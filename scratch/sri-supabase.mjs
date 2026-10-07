// Calculul hash-ului SRI pentru scriptul CDN folosit de panoul de administrare.
//
// De ce Node și nu PowerShell: Invoke-WebRequest + GetBytes(text) reface
// fișierul prin conversie de codepage, ceea ce poate schimba un octet și poate
// produce un hash care nu corespunde conținutului servit efectiv de rețea.
// fetch + arrayBuffer păstrează octeții exact, iar hashul rezultat se poate
// verifica în browser prin sha256 de pe fișierul descărcat manual.
//
// Rulare:  node scratch/sri-supabase.mjs [versiune]

import { createHash } from 'node:crypto';

const version = process.argv[2] || '2.117.2';
const url = `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${version}`;

const res = await fetch(url, { cache: 'no-store' });
if (!res.ok) {
    console.error(`HTTP ${res.status} pentru ${url}`);
    process.exit(1);
}

const bytes = Buffer.from(await res.arrayBuffer());
const sri = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;

console.log(`versiune : ${version}`);
console.log(`url      : ${url}`);
console.log(`octeți   : ${bytes.length}`);
console.log(`SRI      : ${sri}`);
console.log();
console.log(`<script src="${url}" integrity="${sri}" crossorigin="anonymous"></script>`);