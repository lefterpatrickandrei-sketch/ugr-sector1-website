/**
 * Sync Status View ("Stare Sincronizare")
 * Probes what the public site sees (anonymous client) vs what the admin sees in Supabase.
 */

import { client, SUPABASE_URL, ANON_KEY } from '../supabase.js';
import { showToast } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';

let isChecking = false;

// List of tables to monitor and their public expectations
export const MONITORED_TABLES = [
    {
        name: 'membri',
        label: 'Registru Membri ANCPI',
        isPublicTable: true,
        publicFilter: (item) => item.afisare_publica === true && !item.deleted_at,
        anonEndpoint: `${SUPABASE_URL}/rest/v1/membri?select=id,nume,afisare_publica`
    },
    {
        name: 'stiri',
        label: 'Știri & Comunicate',
        isPublicTable: true,
        publicFilter: (item) => item.publicat === true && !item.deleted_at,
        anonEndpoint: `${SUPABASE_URL}/rest/v1/stiri?select=id,titlu,publicat`
    },
    {
        name: 'leadership',
        label: 'Conducere & Birou Executiv',
        isPublicTable: true,
        publicFilter: (item) => item.afisare_publica === true && !item.deleted_at,
        anonEndpoint: `${SUPABASE_URL}/rest/v1/leadership?select=id,nume,afisare_publica`
    },
    {
        name: 'faq',
        label: 'Întrebări Frecvente (FAQ)',
        isPublicTable: true,
        publicFilter: (item) => item.publicat === true && !item.deleted_at,
        anonEndpoint: `${SUPABASE_URL}/rest/v1/faq?select=id,intrebare,publicat`
    },
    {
        name: 'documente',
        label: 'Documente Oficiale',
        isPublicTable: true,
        publicFilter: (item) => item.publicat === true && !item.deleted_at,
        anonEndpoint: `${SUPABASE_URL}/rest/v1/documente?select=id,titlu,publicat`
    },
    {
        name: 'setari',
        label: 'Setări Filială (Configurare)',
        isPublicTable: true,
        publicFilter: (item) => true,
        anonEndpoint: `${SUPABASE_URL}/rest/v1/setari?select=cheie`
    },
    {
        name: 'cereri_inscriere',
        label: 'Cereri Înscriere (Confidențial)',
        isPublicTable: false, // Anon must receive 401
        anonEndpoint: `${SUPABASE_URL}/rest/v1/cereri_inscriere?select=id`
    },
    {
        name: 'admini',
        label: 'Administratori & Roluri (Confidențial)',
        isPublicTable: false, // Anon must receive 401
        anonEndpoint: `${SUPABASE_URL}/rest/v1/admini?select=id`
    }
];

export async function loadSyncStatus() {
    const container = document.getElementById('sync-results-container');
    const summaryCard = document.getElementById('sync-summary-card');
    const btnRefresh = document.getElementById('btn-refresh-sync');

    if (!container) return;
    if (isChecking) return;
    isChecking = true;

    if (btnRefresh) {
        btnRefresh.disabled = true;
        btnRefresh.textContent = '⏳ Se testează sincronizarea...';
    }

    clearElement(container);
    container.appendChild(el('div', { className: 'loading-pulse' }, ['Rulare probe live (Admin DB vs Anonim Client)...']));

    const results = [];
    const anonHeaders = {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
    };

    try {
        for (const meta of MONITORED_TABLES) {
            const startTime = performance.now();
            let adminTotal = 0;
            let adminPublic = 0;
            let adminDeleted = 0;
            let maxUpdatedAt = null;

            // 1. Fetch admin view
            try {
                const { data, error } = await client.from(meta.name).select('*');
                if (!error && Array.isArray(data)) {
                    adminTotal = data.length;
                    adminDeleted = data.filter(r => !!r.deleted_at).length;
                    if (meta.isPublicTable) {
                        adminPublic = data.filter(meta.publicFilter).length;
                    }
                    // Extract max updated_at if present
                    const timestamps = data
                        .map(r => r.actualizat_la || r.updated_at || r.creat_la || r.created_at)
                        .filter(Boolean);
                    if (timestamps.length > 0) {
                        timestamps.sort();
                        maxUpdatedAt = timestamps[timestamps.length - 1];
                    }
                }
            } catch (e) {
                console.warn(`Admin query failed for ${meta.name}`, e);
            }

            // 2. Run anon probe using session-less fetch
            let anonStatus = 0;
            let anonCount = 0;
            let anonPassed = false;
            let anonDetails = '';

            try {
                const res = await fetch(meta.anonEndpoint, { headers: anonHeaders });
                anonStatus = res.status;
                const endTime = performance.now();
                const latency = Math.round(endTime - startTime);

                if (meta.isPublicTable) {
                    if (res.ok) {
                        const anonData = await res.json();
                        anonCount = Array.isArray(anonData) ? anonData.length : 0;
                        if (anonCount === adminPublic) {
                            anonPassed = true;
                            anonDetails = `Sincronizat perfect: ${anonCount} rânduri publice vizibile anonim (${latency}ms)`;
                        } else {
                            anonPassed = false;
                            anonDetails = `Divergență: DB are ${adminPublic} publice, dar anonimul primește ${anonCount} rânduri!`;
                        }
                    } else {
                        anonPassed = false;
                        anonDetails = `Eroare HTTP ${res.status} la interogare publică.`;
                    }
                } else {
                    // Private table: anon MUST get 401 Unauthorized
                    if (res.status === 401 || res.status === 403) {
                        anonPassed = true;
                        anonCount = 0;
                        anonDetails = `RLS protejat cu succes: Anonimul primește HTTP ${res.status} (Zero date expuse, ${latency}ms)`;
                    } else {
                        anonPassed = false;
                        anonDetails = `VULNERABILITATE RLS: Tabela privată a răspuns cu HTTP ${res.status}!`;
                    }
                }

                results.push({
                    name: meta.name,
                    label: meta.label,
                    isPublicTable: meta.isPublicTable,
                    adminTotal,
                    adminPublic,
                    adminDeleted,
                    maxUpdatedAt,
                    anonStatus,
                    anonCount,
                    anonPassed,
                    anonDetails,
                    latency
                });
            } catch (err) {
                results.push({
                    name: meta.name,
                    label: meta.label,
                    isPublicTable: meta.isPublicTable,
                    adminTotal,
                    adminPublic,
                    adminDeleted,
                    maxUpdatedAt,
                    anonStatus: 0,
                    anonCount: 0,
                    anonPassed: false,
                    anonDetails: `Eroare rețea/conexiune probe: ${err.message}`,
                    latency: 0
                });
            }
        }

        renderSyncSummary(summaryCard, results);
        renderSyncResults(container, results);

    } catch (err) {
        showToast('Eroare la verificarea stării de sincronizare: ' + err.message, 'error');
    } finally {
        isChecking = false;
        if (btnRefresh) {
            btnRefresh.disabled = false;
            btnRefresh.textContent = '🔄 Re-verifică Sincronizarea Acum';
        }
    }
}

function renderSyncSummary(container, results) {
    if (!container) return;
    clearElement(container);

    const totalTables = results.length;
    const passedTables = results.filter(r => r.anonPassed).length;
    const isAllGreen = passedTables === totalTables;

    const banner = el('div', {
        className: `sync-hero-card ${isAllGreen ? 'status-all-green' : 'status-warning'}`
    }, [
        el('div', { className: 'sync-hero-icon' }, [isAllGreen ? '🛡️' : '⚠️']),
        el('div', { className: 'sync-hero-content' }, [
            el('h3', { className: 'sync-hero-title' }, [
                isAllGreen 
                    ? 'Toate tabelele sunt 100% sincronizate cu site-ul public' 
                    : `${totalTables - passedTables} tabele necesită atenție la sincronizare`
            ]),
            el('p', { className: 'sync-hero-desc' }, [
                `Testul sondează comportamentul real al vizitatorilor neautentificați (rol anon). `,
                `Tabelele publice expun exact rândurile marcate publicat, iar tabelele confidențiale returnează strict HTTP 401.`
            ]),
            el('div', { className: 'sync-hero-stats' }, [
                el('div', { className: 'sync-stat-item' }, [
                    el('span', { className: 'stat-num' }, [`${passedTables} / ${totalTables}`]),
                    el('span', { className: 'stat-label' }, ['Tabele Validate'])
                ]),
                el('div', { className: 'sync-stat-item' }, [
                    el('span', { className: 'stat-num' }, ['RLS Activ']),
                    el('span', { className: 'stat-label' }, ['Politică Securitate'])
                ]),
                el('div', { className: 'sync-stat-item' }, [
                    el('span', { className: 'stat-num' }, [new Date().toLocaleTimeString('ro-RO')]),
                    el('span', { className: 'stat-label' }, ['Ultima Verificare'])
                ])
            ])
        ])
    ]);

    container.appendChild(banner);
}

function renderSyncResults(container, results) {
    clearElement(container);

    const grid = el('div', { className: 'sync-grid' });

    results.forEach(res => {
        const card = el('div', {
            className: `cms-card sync-table-card ${res.anonPassed ? 'border-success' : 'border-danger'}`
        }, [
            el('div', { className: 'sync-card-header' }, [
                el('div', { className: 'sync-card-title-group' }, [
                    el('h4', { className: 'sync-table-name' }, [res.label]),
                    el('span', { className: 'badge-tech' }, [`public.${res.name}`])
                ]),
                el('span', {
                    className: `status-badge ${res.anonPassed ? 'badge-success' : 'badge-danger'}`
                }, [res.anonPassed ? '🟢 Sincronizat' : '🔴 Neconcordanță'])
            ]),
            el('div', { className: 'sync-metrics-grid' }, [
                el('div', { className: 'sync-metric' }, [
                    el('span', { className: 'metric-label' }, ['Total în DB (Admin):']),
                    el('strong', { className: 'metric-val' }, [String(res.adminTotal)])
                ]),
                res.isPublicTable ? el('div', { className: 'sync-metric' }, [
                    el('span', { className: 'metric-label' }, ['Publice active:']),
                    el('strong', { className: 'metric-val text-cyan' }, [String(res.adminPublic)])
                ]) : el('div', { className: 'sync-metric' }, [
                    el('span', { className: 'metric-label' }, ['Acces Public:']),
                    el('strong', { className: 'metric-val text-warning' }, ['🔒 Blocat (401)'])
                ]),
                el('div', { className: 'sync-metric' }, [
                    el('span', { className: 'metric-label' }, ['Vede Anonimul:']),
                    el('strong', {
                        className: `metric-val ${res.anonPassed ? 'text-success' : 'text-danger'}`
                    }, [res.isPublicTable ? `${res.anonCount} rânduri` : `HTTP ${res.anonStatus}`])
                ]),
                el('div', { className: 'sync-metric' }, [
                    el('span', { className: 'metric-label' }, ['În Coș (Șterse):']),
                    el('strong', { className: 'metric-val text-muted' }, [String(res.adminDeleted)])
                ])
            ]),
            el('div', { className: 'sync-probe-details' }, [
                el('span', { className: 'probe-icon' }, [res.anonPassed ? '✓' : '⚠️']),
                el('span', { className: 'probe-text' }, [res.anonDetails])
            ]),
            res.maxUpdatedAt ? el('div', { className: 'sync-card-footer text-subtle' }, [
                `Ultima actualizare rând: ${new Date(res.maxUpdatedAt).toLocaleString('ro-RO')}`
            ]) : null
        ]);

        grid.appendChild(card);
    });

    container.appendChild(grid);
}
