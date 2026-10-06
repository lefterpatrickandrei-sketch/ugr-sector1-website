import fs from 'fs';

// Load data.js
const dataFileContent = fs.readFileSync('data.js', 'utf8');

// Evaluate ugrData
const sandbox = new Function(dataFileContent + '; return ugrData;')();

function esc(str) {
    if (str === null || str === undefined) return 'null';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

function jsonEsc(obj) {
    return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

let sql = `-- ============================================================================
-- Seed: seed_from_repo.sql
-- Scop: Populare idempotentă a bazei de date Supabase cu datele oficiale din repo
--       (setari, leadership, faq, documente, stiri, membri demonstrativi).
-- Data: 2026-10-06
-- ============================================================================

-- 1. POPULARE SETĂRI INSTITUȚIONALE (public.setari)
insert into public.setari (cheie, valoare, descriere)
values
  ('organizatie', ${jsonEsc(sandbox.organization)}, 'Date oficiale de identificare și contact Filiala Sector 1'),
  ('ghid_aderare', ${jsonEsc(sandbox.membershipGuide)}, 'Pași și taxe de adeziune UGR'),
  ('telemetrie_sector1', ${jsonEsc(sandbox.sector1Telemetry)}, 'Repere geodezice și stații ROMPOS Sector 1')
on conflict (cheie) do update
set valoare = excluded.valoare,
    descriere = excluded.descriere,
    actualizat_la = now();

-- 2. POPULARE LEADERSHIP (public.leadership)
-- Ștergem și recreăm sau inserăm idempotent
`;

// Central leaders
sandbox.leadership.forEach((m, idx) => {
    sql += `insert into public.leadership (grup, nume, functie, descriere, foto_url, ordine, afisare_publica)
select 'central', ${esc(m.name)}, ${esc(m.role)}, ${esc(m.desc)}, ${esc(m.image)}, ${idx + 1}, true
where not exists (select 1 from public.leadership where grup = 'central' and nume = ${esc(m.name)});\n`;
});

// Branch leaders
sandbox.branchLeadership.forEach((m, idx) => {
    sql += `insert into public.leadership (grup, nume, functie, descriere, telefon, email, ordine, afisare_publica)
select 'filiala', ${esc(m.name)}, ${esc(m.role)}, ${esc(m.desc)}, ${esc(m.phone || null)}, ${esc(m.email || null)}, ${idx + 1}, true
where not exists (select 1 from public.leadership where grup = 'filiala' and nume = ${esc(m.name)});\n`;
});

sql += `\n-- 3. POPULARE FAQ (public.faq)\n`;
sandbox.faqList.forEach((f, idx) => {
    sql += `insert into public.faq (categorie, tag, intrebare, raspuns, ordine, publicat)
select ${esc(f.category)}, ${esc(f.tag)}, ${esc(f.q)}, ${esc(f.a)}, ${idx + 1}, true
where not exists (select 1 from public.faq where intrebare = ${esc(f.q)});\n`;
});

sql += `\n-- 4. POPULARE DOCUMENTE (public.documente)\n`;
sandbox.documentsList.forEach((d, idx) => {
    sql += `insert into public.documente (titlu, descriere, tip, badge, fisier_url, ordine, publicat)
select ${esc(d.title)}, ${esc(d.desc)}, ${esc(d.format)}, ${esc(d.badge)}, ${esc(d.fileUrl)}, ${idx + 1}, true
where not exists (select 1 from public.documente where titlu = ${esc(d.title)});\n`;
});

sql += `\n-- 5. ACTUALIZARE FLAG DEMONSTRATIV PE CEI 8 MEMBRI EXISTENȚI\n`;
sql += `update public.membri
set demonstrativ = true
where id in ('UGR-0012', 'UGR-0038', 'UGR-0145', 'UGR-0220', 'UGR-0312', 'UGR-0402', 'UGR-0589', 'UGR-0614');\n`;

sql += `\n-- 6. ÎMBOGĂȚIRE ȘTIRI EXISTENTE CU SCOPE, CATEGORIE, LOCAȚIE\n`;
sandbox.newsList.forEach((n) => {
    sql += `update public.stiri
set scope = ${esc(n.scope)},
    categorie = ${esc(n.category)},
    locatie = ${esc(n.location)},
    text_buton = ${esc(n.actionText)},
    link_actiune = ${esc(n.source ? n.source.url : null)}
where titlu like ${esc('%' + n.title.substring(0, 30) + '%')};\n`;
});

// Ensure directory exists
if (!fs.existsSync('supabase/seed')) {
    fs.mkdirSync('supabase/seed', { recursive: true });
}

fs.writeFileSync('supabase/seed/seed_from_repo.sql', sql, 'utf8');
console.log('Successfully generated supabase/seed/seed_from_repo.sql!');
