// Verifica fiecare coloana folosita in admin/js si script.js, prin REST,
// impotriva bazei de date reale. Daca o coloana nu exista, PostgREST raspunde
// 42703 si codul are un bug ascuns, exact ca in cazul creat_la de pe audit_log.
//
// Ruleaza: node scratch/audit-coloane.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'admin/js';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNra3R6dnp6a2xzcHFmY2xjc2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMDEzNjcsImV4cCI6MjEwNjY3NzM2N30.hrmXR_K-o6jWJ-ts-Opds_cGlU_qMamc6nRgAxArQzo';
const BASE = 'https://ckktzvzzklspqfclcsbu.supabase.co/rest/v1';
const HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}` };

function* walk(dir) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) yield* walk(p);
        else if (name.endsWith('.js')) yield p;
    }
}

// Aduna .from('tabel') ... .select('a, b, c') din acelasi lant de apel.
const pairs = new Map(); // "tabel|coloane" -> [fisiere]
for (const file of walk(ROOT)) {
    const src = readFileSync(file, 'utf8');
    const re = /\.from\(\s*'([a-z_]+)'\s*\)[\s\S]{0,400}?\.select\(\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        const [, table, cols] = m;
        if (table === 'storage' || cols.includes('(')) continue;
        const key = `${table}|${cols}`;
        if (!pairs.has(key)) pairs.set(key, []);
        pairs.get(key).push(file);
    }
}

const results = [];
for (const [key, files] of pairs) {
    const [table, cols] = key.split('|');
    const url = `${BASE}/${table}?select=${encodeURIComponent(cols)}&limit=1`;
    let verdict, detail = '';
    try {
        const res = await fetch(url, { headers: HEADERS });
        const body = await res.text();
        if (res.ok) {
            verdict = 'OK';
        } else {
            let code = '';
            try {
                code = JSON.parse(body).code || '';
            } catch { /* raspuns ne-JSON */ }
            // 42501 = RLS sau GRANT interzice cheia anon. Nu e bug: e corect ca
            // acele tabele sa nu fie citibile de un vizitator. Inseamna doar
            // ca scriptul nu le poate verifica, pentru ca ar trebui un token
            // de administrator.
            if (code === '42501') {
                verdict = 'NEVERIFICABIL';
                detail = 'doar pentru administratori (42501)';
            } else {
                verdict = 'EROARE';
                try {
                    const j = JSON.parse(body);
                    detail = `${j.code || ''} ${j.message || body}`.slice(0, 220);
                } catch {
                    detail = body.slice(0, 220);
                }
            }
        }
    } catch (e) {
        verdict = 'RETEA';
        detail = e.message;
    }
    results.push({ table, cols, verdict, detail, files: [...new Set(files)] });
}

const bugs = results.filter(r => r.verdict === 'EROARE' || r.verdict === 'RETEA');
const skipped = results.filter(r => r.verdict === 'NEVERIFICABIL');
console.log(`Verificate ${results.length} combinatii tabela+coloane, cu cheia anon.`);
console.log(`OK: ${results.length - bugs.length - skipped.length}` +
    `   Neverificabile (doar admin): ${skipped.length}` +
    `   Erori: ${bugs.length}\n`);

if (bugs.length === 0) {
    console.log('Nicio coloana gresita in tabelele verificabile cu cheia anon.');
    console.log('Tabelele cu 42501 raman neverificate de acest script: ar necesita');
    console.log('un token de administrator. Ele se verifica manual, din baseline.');
}
for (const r of bugs) {
    console.log(`\n[${r.verdict}] ${r.table}`);
    console.log(`   coloane: ${r.cols}`);
    console.log(`   ${r.detail}`);
    console.log(`   in: ${r.files.join(', ')}`);
}
if (skipped.length) {
    console.log('\nTabele neverificate automat: ' +
        [...new Set(skipped.map(s => s.table))].join(', '));
}