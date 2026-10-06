
const SUPABASE_URL = 'https://ckktzvzzklspqfclcsbu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNra3R6dnp6a2xzcHFmY2xjc2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMDEzNjcsImV4cCI6MjEwNjY3NzM2N30.hrmXR_K-o6jWJ-ts-Opds_cGlU_qMamc6nRgAxArQzo';

const headers = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
};

async function test(name, fn) {
    try {
        const res = await fn();
        if (res.pass) {
            console.log(`[PASS] ${name}: ${res.msg}`);
        } else {
            console.log(`[FAIL] ${name}: ${res.msg}`);
        }
        return res.pass;
    } catch (err) {
        console.log(`[ERROR] ${name}: ${err.message}`);
        return false;
    }
}

async function run() {
    console.log('================================================================');
    console.log('VERIFICARE AUTOMATĂ FAZA P3 — REST API SUPABASE');
    console.log('================================================================');

    let allOk = true;

    // Test 1: setari citire anonim
    const t1 = await test('1. Citire anonimă public.setari', async () => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/setari?select=cheie`, { headers });
        if (!r.ok) return { pass: false, msg: `HTTP ${r.status} ${await r.text()}` };
        const data = await r.json();
        return { pass: Array.isArray(data), msg: `Returnat ${data.length} rânduri setări` };
    });
    if (!t1) allOk = false;

    // Test 2: setari blocare scriere anonim
    const t2 = await test('2. Blocare scriere anonimă în public.setari', async () => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/setari`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ cheie: 'test_hacker', valoare: {} })
        });
        return { pass: r.status === 401 || r.status === 403, msg: `HTTP ${r.status} (corect blocat)` };
    });
    if (!t2) allOk = false;

    // Test 3: leadership citire anonim
    const t3 = await test('3. Citire anonimă public.leadership', async () => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/leadership?select=nume,grup,afisare_publica`, { headers });
        if (!r.ok) return { pass: false, msg: `HTTP ${r.status} ${await r.text()}` };
        const data = await r.json();
        return { pass: Array.isArray(data), msg: `Returnat ${data.length} lideri publici` };
    });
    if (!t3) allOk = false;

    // Test 4: leadership blocare scriere anonim
    const t4 = await test('4. Blocare scriere anonimă în public.leadership', async () => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/leadership`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ grup: 'filiala', nume: 'Hacker', functie: 'Test' })
        });
        return { pass: r.status === 401 || r.status === 403, msg: `HTTP ${r.status} (corect blocat)` };
    });
    if (!t4) allOk = false;

    // Test 5: faq citire anonim
    const t5 = await test('5. Citire anonimă public.faq', async () => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/faq?select=intrebare,categorie`, { headers });
        if (!r.ok) return { pass: false, msg: `HTTP ${r.status} ${await r.text()}` };
        const data = await r.json();
        return { pass: Array.isArray(data), msg: `Returnat ${data.length} întrebări frecvente` };
    });
    if (!t5) allOk = false;

    // Test 6: documente citire anonim
    const t6 = await test('6. Citire anonimă public.documente', async () => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/documente?select=titlu,fisier_url`, { headers });
        if (!r.ok) return { pass: false, msg: `HTTP ${r.status} ${await r.text()}` };
        const data = await r.json();
        return { pass: Array.isArray(data), msg: `Returnat ${data.length} documente oficiale` };
    });
    if (!t6) allOk = false;

    // Test 7: membri flag demonstrativ prezent
    const t7 = await test('7. Verificare membri demonstrativ flag', async () => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/membri?select=id,nume,demonstrativ&limit=5`, { headers });
        if (!r.ok) return { pass: false, msg: `HTTP ${r.status} ${await r.text()}` };
        const data = await r.json();
        const hasDemo = data.some(m => m.demonstrativ === true);
        return { pass: hasDemo, msg: `Găsit membri cu flag demonstrativ = true` };
    });
    if (!t7) allOk = false;

    // Test 8: audit_log inaccesibil anonim
    const t8 = await test('8. Blocare totală acces anonim la public.audit_log', async () => {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/audit_log?select=*`, { headers });
        return { pass: r.status === 401 || r.status === 403, msg: `HTTP ${r.status} (corect blocat)` };
    });
    if (!t8) allOk = false;

    console.log('================================================================');
    if (allOk) {
        console.log('REZULTAT: TOATE CELE 8 TESTE P3 AU TRECUT CU SUCCES!');
    } else {
        console.log('REZULTAT: ATENȚIE, UNELE TESTE AU EȘUAT (Migrarea trebuie aplicată în Supabase)');
    }
}

run();
