// Verifica ca fiecare tabela pe care panoul o citeste ca administrator are
// o politica RLS care ii permite SELECT. Daca lipseste, lista se incarca
// goala, fara nicio eroare in consola si fara niciun toast.
//
// Se bazeaza pe inventarul real de politici, din
// supabase/baseline/000_policies_verificat.sql, si pe tabelele pe care le
// citeste admin/js.
//
// Ruleaza: node scratch/audit-politici.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'admin/js';
const BASELINE = 'supabase/baseline/000_policies_verificat.sql';

function* walk(dir) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) yield* walk(p);
        else if (name.endsWith('.js')) yield p;
    }
}

// 1. Ce tabele citeste panoul, ca SELECT.
const tablesRead = new Map();
for (const file of walk(ROOT)) {
    const src = readFileSync(file, 'utf8');
    const re = /\.from\(\s*'([a-z_]+)'\s*\)[\s\S]{0,400}?\.select\(/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        const table = m[1];
        if (table === 'storage') continue;
        if (!tablesRead.has(table)) tablesRead.set(table, []);
        tablesRead.get(table).push(file);
    }
}

// 2. Ce politici exista in realitate, pe ce tabele, pentru ce roluri.
// Formatul din baseline: CREATE POLICY nume ON public.tabel FOR cmd TO rol ...
const policies = new Map(); // tabel -> [{nume, cmd, roles}]
const base = readFileSync(BASELINE, 'utf8');
const rePol = /create policy\s+(\w+)\s+on\s+public\.(\w+)\s+for\s+(\w+)(?:\s+to\s+([\w,\s]+?))?(?:\s+using|\s+with|\s*$)/gi;
let m;
while ((m = rePol.exec(base)) !== null) {
    const [, nume, tabel, cmd, rolesRaw] = m;
    const roles = (rolesRaw || 'public')
        .split(',')
        .map(r => r.trim().replace(/^\(|\)$/g, ''))
        .filter(Boolean);
    if (!policies.has(tabel)) policies.set(tabel, []);
    policies.get(tabel).push({ nume, cmd: cmd.toUpperCase(), roles });
}

console.log(`Tabele citite de panou: ${tablesRead.size}`);
console.log(`Tabele cu politici in baseline: ${policies.size}\n`);

const problems = [];
for (const [table, files] of [...tablesRead].sort()) {
    const list = policies.get(table) || [];
    // Un SELECT ii permite orice politica care contine "ALL" sau "SELECT",
    // pentru un rol pe care il foloseste un administrator logat.
    const allowsAdminSelect = list.some(p =>
        (p.cmd === 'ALL' || p.cmd === 'SELECT') &&
        p.roles.some(r => r === 'authenticated' || r === 'public')
    );

    if (list.length === 0) {
        problems.push({ table, files, why: 'nicio politica in baseline' });
    } else if (!allowsAdminSelect) {
        problems.push({
            table, files,
            why: `politici existente, dar niciuna pentru SELECT de la authenticated: ${list.map(p => `${p.nume}[${p.cmd}->${p.roles.join('|')}]`).join(', ')}`
        });
    }
}

if (problems.length === 0) {
    console.log('OK: fiecare tabela citita de panou are o politica care ii permite SELECT.');
} else {
    console.log(`ATENTIE: ${problems.length} tabele fara SELECT pentru administrator:\n`);
    for (const p of problems) {
        console.log(`  ${p.table}`);
        console.log(`     ${p.why}`);
        console.log(`     citit in: ${[...new Set(p.files)].join(', ')}\n`);
    }
}