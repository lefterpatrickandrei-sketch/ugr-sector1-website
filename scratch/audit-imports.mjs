// Verifica ca fiecare simbol importat in admin/js exista in modulu din care
// e importat.
//
// De ce conteaza: un import gresit nu da niciun avertisment pana la rulare.
// Modulul care importseste arunca SyntaxError la incarcare, ceea ce omoara
// intregul panou, nu doar functia respectiva. npm run test:syntax verifica
// doar ca fiecare fisier se parseaza separat, deci nu prinde asta.
//
// Ruleaza: node scratch/audit-imports.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = 'admin/js';

function* walk(dir) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) yield* walk(p);
        else if (name.endsWith('.js')) yield p;
    }
}

const files = [...walk(ROOT)];

/** Extrage numele exportate dintr-un modul. */
function exportsOf(src) {
    const out = new Set();

    // export function x / export async function x / export const x
    for (const m of src.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);
    for (const m of src.matchAll(/^export\s+(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);

    // export { a, b as c }
    for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) {
        for (const part of m[1].split(',')) {
            const t = part.trim();
            if (!t) continue;
            const as = t.split(/\s+as\s+/);
            out.add((as[1] || as[0]).trim());
        }
    }
    return out;
}

const cache = new Map();
function exportsCached(file) {
    if (!cache.has(file)) cache.set(file, exportsOf(readFileSync(file, 'utf8')));
    return cache.get(file);
}

const problems = [];
let checked = 0;

for (const file of files) {
    const src = readFileSync(file, 'utf8');

    // import { a, b as c } from './x.js'
    for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
        const [, syms, spec] = m;
        if (!spec.startsWith('.')) continue; // pachete externe, nu ne intereseaza
        const target = resolve(dirname(file), spec);
        let available;
        try {
            available = exportsCached(target);
        } catch {
            problems.push({ file, syms, spec, why: 'modul inexistent' });
            continue;
        }
        // Un comentariu poate sta in interiorul acoladelor, de ex.
        //   import {
        //       // T-J1: motivul
        //       updateNewsImageLivePreview } from './ui/media.js'
        // Se elimina inainte de impartire, altfel parserul ar considera
        // comentariul un simbol.
        const cleaned = syms.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
        for (const s of cleaned.split(',')) {
            const name = s.trim().split(/\s+as\s+/)[0].trim();
            if (!name) continue;
            checked++;
            if (!available.has(name)) {
                problems.push({ file, syms: name, spec, why: 'nu este exportat' });
            }
        }
    }

    // import * as x from './y.js' -- exista totusi trebuie sa existe fisierul
    for (const m of src.matchAll(/import\s+\*\s+as\s+[A-Za-z_$][\w$]*\s+from\s*['"](\.[^'"]+)['"]/g)) {
        try {
            readFileSync(resolve(dirname(file), m[1]), 'utf8');
        } catch {
            problems.push({ file, syms: '*', spec: m[1], why: 'modul inexistent' });
        }
    }
}

console.log(`Verificate ${checked} simboluri importate in ${files.length} fisiere din admin/js.\n`);
if (problems.length === 0) {
    console.log('OK: tot ce se importa exista in modulul sursa.');
} else {
    console.log(`${problems.length} importuri care nu corespund:\n`);
    for (const p of problems) {
        console.log(`  ${p.file}`);
        console.log(`     import { ${p.syms} } from '${p.spec}'  ->  ${p.why}`);
    }
}