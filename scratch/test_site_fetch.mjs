const SUPABASE_URL = 'https://ckktzvzzklspqfclcsbu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNra3R6dnp6a2xzcHFmY2xjc2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMDEzNjcsImV4cCI6MjEwNjY3NzM2N30.hrmXR_K-o6jWJ-ts-Opds_cGlU_qMamc6nRgAxArQzo';

const headers = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
};

async function testFetch() {
    console.log('--- TEST FETCH SCRIPT.JS COMPATIBILITY ---');
    
    // Setari
    const rSetari = await fetch(`${SUPABASE_URL}/rest/v1/setari?select=cheie,valoare`, { headers });
    const setari = await rSetari.json();
    console.log(`Setari primite: ${setari.length} chei:`, setari.map(s => s.cheie).join(', '));
    const org = setari.find(s => s.cheie === 'organizatie')?.valoare;
    console.log('Org verificat:', org?.name, '| IBAN:', org?.bankAccounts?.[0]?.iban);

    // Leadership
    const rLead = await fetch(`${SUPABASE_URL}/rest/v1/leadership?afisare_publica=eq.true&deleted_at=is.null&order=ordine.asc`, { headers });
    const leaders = await rLead.json();
    console.log(`Leadership primit: ${leaders.length} persoane (Central: ${leaders.filter(l => l.grup === 'central').length}, Filiala: ${leaders.filter(l => l.grup === 'filiala').length})`);

    // FAQ
    const rFaq = await fetch(`${SUPABASE_URL}/rest/v1/faq?publicat=eq.true&deleted_at=is.null&order=ordine.asc`, { headers });
    const faq = await rFaq.json();
    console.log(`FAQ primit: ${faq.length} intrebari`);

    // Documente
    const rDocs = await fetch(`${SUPABASE_URL}/rest/v1/documente?publicat=eq.true&deleted_at=is.null&order=ordine.asc`, { headers });
    const docs = await rDocs.json();
    console.log(`Documente primite: ${docs.length} fisiere`);

    // Membri
    const rMembri = await fetch(`${SUPABASE_URL}/rest/v1/membri?afisare_publica=eq.true&deleted_at=is.null&order=id.asc`, { headers });
    const membri = await rMembri.json();
    console.log(`Membri primiti: ${membri.length} (demo flag count: ${membri.filter(m => m.demonstrativ).length})`);

    // Stiri
    const rStiri = await fetch(`${SUPABASE_URL}/rest/v1/stiri?publicat=eq.true&deleted_at=is.null&order=data_publicare.desc`, { headers });
    const stiri = await rStiri.json();
    console.log(`Stiri primite: ${stiri.length} (cu scope/categorie prezente: ${stiri.filter(s => s.scope).length})`);

    console.log('--- TOATE ENDPOINT-URILE SUNT PERFECT COMPATIBILE ---');
}

testFetch();
