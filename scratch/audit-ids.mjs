// Verifica ca fiecare id cautat cu getElementById exista in HTML.
//
// De ce conteaza: un id lipsa intoarce null, iar null.addEventListener arunca
// TypeError. Efectul tipic este ca handlerul nu se atasaseaza niciodata, deci
// butonul pur si simplu nu face nimic, fara niciun mesaj. Cum panoul are
// sute de butoane, unul lipsa arata exact ca un buton necuplat.
//
// Sunt raportate separat apelurile cu rezerva, de forma el.getElementById(a)
// || el.getElementById(b), pentru ca acolo se cauta doua id-uri si se foloseste
// primul existent. Unul lipsa e intentionat, nu e bug.
//
// Ruleaza: node scratch/audit-ids.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'admin/js';
const HTML = 'admin/panou.html';

function* walk(dir) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) yield* walk(p);
        else if (name.endsWith('.js')) yield p;
    }
}

const html = readFileSync(HTML, 'utf8');
const existing = new Set();
for (const m of html.matchAll(/\sid\s*=\s*"([^"]+)"/g)) existing.add(m[1]);

const missing = new Map();  // id -> [fisiere]
const optional = new Map(); // id -> [fisiere]

for (const file of walk(ROOT)) {
    const src = readFileSync(file, 'utf8');

    for (const m of src.matchAll(/getElementById\(\s*'([^']+)'\s*\)/g)) {
        const id = m[1];
        if (existing.has(id)) continue;

        // Cu rezerva? Un id poate lipsi intentionat daca e unul din cei doi operanzi
        // ai expresiei getElementById(a) || getElementById(b).
        //
        // Nu se poate decide privind inapoi si inapoi, pentru ca textul
        // imediat vecin e mereu "document.", nu operatorul. Se decide pe
        // linia intreaga: daca ea are cel putin doua apeluri getElementById
        // si un ||, atunci toti id-urile de pe ea sunt candidati la rezerva.
        const lineStart = src.lastIndexOf('\n', m.index) + 1;
        const lineEnd = src.indexOf('\n', m.index);
        const line = src.slice(lineStart, lineEnd === -1 ? src.length : lineEnd);
        const callsOnLine = (line.match(/getElementById\(/g) || []).length;
        const isFallback = callsOnLine >= 2 && /\|\|/.test(line);

        const bucket = isFallback ? optional : missing;
        if (!bucket.has(id)) bucket.set(id, []);
        bucket.get(id).push(file);
    }
}

console.log(`id-uri definite in ${HTML}: ${existing.size}`);
console.log(`id-uri cautate in cod care NU exista: ${missing.size}`);
console.log(`  din care cu rezerva (a || b), intentionat: ${optional.size}\n`);

if (missing.size === 0) {
    console.log('OK: fiecare id cautat fara rezerva exista in HTML.');
} else {
    for (const [id, files] of [...missing].sort()) {
        console.log(`  LIPSA  #${id}`);
        console.log(`         in: ${[...new Set(files)].join(', ')}`);
    }
}
if (optional.size) {
    console.log('\nCu rezerva, al doilea id poate lipsi fara probleme:');
    for (const [id, files] of [...optional].sort()) {
        console.log(`  ok     #${id}  (${[...new Set(files)].join(', ')})`);
    }
}