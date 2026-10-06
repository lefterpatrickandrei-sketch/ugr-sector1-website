/**
 * News View (Gestiune Știri & Comunicate Oficiale)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from '../ui/toast.js';
import { formatDateOnlyRo, isValidImageUrl, updateReadingStats, updateCharCounters } from '../lib/format.js';
import { renderPaginationControls } from '../ui/pagination.js';
import { updateBulkActionsBar } from '../ui/bulkbar.js';
import { updateNewsImageLivePreview } from '../ui/media.js';
import { renderMarkdownLite, clearElement } from '../lib/dom.js';
import { openItemHistoryModal } from './history.js';


export const OFFICIAL_FALLBACK_NEWS = [
    {
        titlu: "Săptămâna Geodeziei Românești (SGR) — Chișinău (11–14 Noiembrie)",
        continut: "UGR și Universitatea Tehnică a Moldovei (UTM) organizează ediția internațională SGR la Chișinău. Congresul reunește experți ANCPI, ARFC, delegați FIG și CLGE pentru dezbateri pe tematica geodeziei moderne, scanării LiDAR și integrării europene a cadastrului.",
        imagine_url: "ugr-images/united_1384.png",
        data_publicare: "2026-11-11",
        scope: "international",
        categorie: "Eveniment Internațional Major",
        locatie: "UTM, Chișinău",
        link_actiune: "https://sgr.ugr.ro/indexr.php",
        text_buton: "Înscriere & Detalii SGR ↗",
        publicat: true
    },
    {
        titlu: "Masă Rotundă de Lucru: Filiala Sector 1 & Conducerea BCPI Sector 1",
        continut: "Sesiune de lucru consultativă dedicată geodezilor autorizați din Sectorul 1 București pentru uniformizarea procedurilor de recepție a planurilor de amplasament și rezolvarea necorelărilor tehnice din sistemul integrat e-Terra.",
        imagine_url: "ugr-images/ig_post_5.jpg",
        data_publicare: "2026-09-15",
        scope: "institutional",
        categorie: "Consultare Tehnică Locală",
        locatie: "Sediu OCPI București",
        link_actiune: "https://www.facebook.com/share/1C3GXdASYW/",
        text_buton: "Urmărește noutățile ↗",
        publicat: true
    },
    {
        titlu: "Comunicat privind Deciziile Biroului Executiv (BEX) UGR",
        continut: "Biroul Executiv al Uniunii Geodezilor din România a adoptat rezoluțiile privind optimizarea fluxurilor de lucru cu ANCPI, normele metodologice pentru lucrările de cadastru sistematic și sprijinirea formării profesionale continue a geodezilor autorizați.",
        imagine_url: "ugr-images/6a16e8a299426Comunicat-in-urma-sedintei-BEX-UGR-din-21.05.2026_Page_1.png",
        data_publicare: "2026-05-21",
        scope: "national",
        categorie: "Comunicat Oficial BEX",
        locatie: "Sediul Central UGR",
        link_actiune: "https://www.ugr.ro/stiri/comunicat-privind-bex-ugr-din-21-mai-2026",
        text_buton: "Citește Comunicatul ↗",
        publicat: true
    },
    {
        titlu: "Adunarea Generală a Membrilor Filialei Sector 1 București",
        continut: "Întâlnirea anuală a comunității geodezilor din Sectorul 1: prezentarea raportului de activitate local, validarea calendarului de workshop-uri practice GNSS/LiDAR și primirea noilor absolvenți de la Facultatea de Geodezie UTCB.",
        imagine_url: "ugr-images/ISP8061.png",
        data_publicare: "2026-04-10",
        scope: "local",
        categorie: "Ședință Statutară Filială",
        locatie: "Facultatea de Geodezie UTCB",
        link_actiune: "#contact",
        text_buton: "Confirmă participarea →",
        publicat: true
    },
    {
        titlu: "Ediția a II-a UGR Student Community by UGR Sector 1: GIS și baze de date spațiale",
        continut: "Întâlnirea comunității cu studenții și viitorii colegi în Sala de Consiliu FIFIM – USAMV București. Sesiuni practice de analiză și gestionare a informației spațiale, GIS și tranziția de la facultate la provocările din topografia inginerească de pe șantiere.",
        imagine_url: "ugr-images/ugr_student_community_meeting.jpg",
        data_publicare: "2026-07-08",
        scope: "academic",
        categorie: "Workshop Studențesc & Instruire",
        locatie: "Sala Consiliu FIFIM USAMV",
        link_actiune: "https://www.instagram.com/filiala.sector1.ugr",
        text_buton: "Postare Instagram ↗",
        publicat: true
    },
    {
        titlu: "Premiul Filialei Sector 1 & Pachet de 18 Workshopuri Profesionale de Specialitate",
        continut: "La susținerea licențelor MTC la USAMV, Filiala Sector 1 a acordat premii de excelență și a lansat 18 workshopuri aplicate alături de partenerii KarmaCad Store (scanare laser 3D), SphereFix România și Control Survey SRL.",
        imagine_url: "ugr-images/ig_post_3.jpg",
        data_publicare: "2026-07-10",
        scope: "parteneriat",
        categorie: "Formare Profesională Continuă",
        locatie: "FIFIM USAMV",
        link_actiune: "https://www.instagram.com/filiala.sector1.ugr",
        text_buton: "Vezi parteneriatele ↗",
        publicat: true
    },
    {
        titlu: "Comunicat Filiala Sector 1: Notificare ANCPI privind disponibilitatea sistemului e-Terra",
        continut: "Anunț operativ ANCPI transmis în timp real membrilor geodezi din Sectorul 1 privind disfuncționalitățile tehnice ale platformei e-Terra și calendarul de restabilire a serviciilor de cadastru și carte funciară.",
        imagine_url: "ugr-images/ancpi.png",
        data_publicare: "2026-07-14",
        scope: "institutional",
        categorie: "Notificare Operativă ANCPI",
        locatie: "Canale Oficiale Sector 1",
        link_actiune: "https://www.facebook.com/share/14xwxtFChmC/",
        text_buton: "Citește pe Facebook ↗",
        publicat: true
    },
    {
        titlu: "Burse Complete UGR pentru Participare la Săptămâna Geodeziei Românești 2026 (Chișinău)",
        continut: "Șansă dedicată studenților de la Geodezie: UGR și Filiala Sector 1 oferă burse integrale ce acoperă taxa de participare, cazarea, mesele și transportul pentru conferința internațională SGR de la UTM Chișinău (11–14 Noiembrie).",
        imagine_url: "ugr-images/6a2fcf1057a4cPoster-Bursa-SGR-2026.png",
        data_publicare: "2026-06-15",
        scope: "academic",
        categorie: "Burse & Sprijin Tineri Geodezi",
        locatie: "FIFIM USAMV / UTM Chișinău",
        link_actiune: "https://docs.google.com/forms/d/e/1FAIpQLSctDTm-Gxuph4yz2fJRiU2JOurBFgzBXriAUY6rbrtem5vrEQ/viewform?usp=header",
        text_buton: "Înscriere Bursă SGR ↗",
        publicat: true
    },
    {
        titlu: "Delegația Oficială UGR la Adunarea Generală CLGE",
        continut: "România a promovat armonizarea normelor de etică și bune practici în măsurătorile cadastrale la nivelul Consiliului European al Geodezilor (CLGE), susținând drepturile geodezilor autorizați din Europa Centrală și de Est.",
        imagine_url: "ugr-images/6a0c30e4559d8Board-CLGE-Tartu-mai-2026.png",
        data_publicare: "2026-05-05",
        scope: "international",
        categorie: "Reprezentare Europeană",
        locatie: "Tartu, Estonia",
        link_actiune: "https://www.clge.eu",
        text_buton: "Portal Oficial CLGE ↗",
        publicat: true
    }
];

let editingNewsId = null;
let currentFilteredNews = [];

export async function handleSyncDefaultNews(btnTrigger) {
    if (btnTrigger) {
        btnTrigger.disabled = true;
        btnTrigger.textContent = 'Se sincronizează...';
    }

    try {
        if (state.allNewsData.length > 0) {
            const confirmSync = confirm(`Există deja ${state.allNewsData.length} articole în baza de date. Doriți să adăugați cele 9 comunicate oficiale din site?`);
            if (!confirmSync) {
                if (btnTrigger) {
                    btnTrigger.disabled = false;
                    btnTrigger.textContent = '📥 Sincronizează știri locale';
                }
                return;
            }
        }

        const { error } = await client
            .from('stiri')
            .insert(OFFICIAL_FALLBACK_NEWS);

        if (error) {
            showToast('Eroare la sincronizarea știrilor: ' + error.message, 'error');
            return;
        }

        showToast('✓ 9 știri oficiale au fost sincronizate cu succes în Supabase!', 'success', 5000);
        await loadNews();
    } catch (err) {
        showToast('Eroare de conexiune la sincronizarea știrilor.', 'error');
    } finally {
        if (btnTrigger) {
            btnTrigger.disabled = false;
            btnTrigger.textContent = '📥 Sincronizează știri locale';
        }
    }
}

export async function loadNews() {
    const newsFeedback = document.getElementById('news-feedback');
    const btnRefreshNews = document.getElementById('btn-refresh-news');

    clearBannerFeedback(newsFeedback);
    if (btnRefreshNews) {
        btnRefreshNews.disabled = true;
        btnRefreshNews.textContent = '↻ Se încarcă...';
    }

    try {
        const { data, error } = await client
            .from('stiri')
            .select('id, titlu, continut, imagine_url, data_publicare, publicat, categorie, scope, locatie, link_actiune, text_buton, slug, created_at, updated_at')
            .is('deleted_at', null)
            .order('data_publicare', { ascending: false });


        if (error) {
            setBannerFeedback(newsFeedback, 'Eroare la citirea știrilor: ' + error.message, 'error');
            return;
        }

        state.allNewsData = data || [];
        updateNewsKpi();
        applyNewsFilter();
    } catch (err) {
        setBannerFeedback(newsFeedback, 'Eroare de conexiune la citirea știrilor.', 'error');
    } finally {
        if (btnRefreshNews) {
            btnRefreshNews.disabled = false;
            btnRefreshNews.textContent = '↻ Reîmprospătează';
        }
    }
}

export function updateNewsKpi() {
    const badgeNavNews = document.getElementById('badge-nav-news');
    const kpiValNewsPublished = document.getElementById('kpi-val-news-published');
    const kpiSubtextNews = document.getElementById('kpi-subtext-news');

    const total = state.allNewsData.length;
    const published = state.allNewsData.filter(n => n.publicat).length;
    const drafts = total - published;

    if (badgeNavNews) badgeNavNews.textContent = total;
    if (kpiValNewsPublished) kpiValNewsPublished.textContent = total;
    if (kpiSubtextNews) kpiSubtextNews.textContent = `${published} publicate, ${drafts} ciorne`;
}

export function applyNewsFilter() {
    const newsStatusFilter = document.getElementById('news-status-filter');
    const newsSearchInput = document.getElementById('news-search-input');

    const selectedStatus = newsStatusFilter ? newsStatusFilter.value : 'toate';
    const searchTerm = newsSearchInput ? newsSearchInput.value.toLowerCase().trim() : '';

    currentFilteredNews = state.allNewsData.filter(item => {
        if (selectedStatus === 'publicat' && !item.publicat) return false;
        if (selectedStatus === 'ciorna' && item.publicat) return false;

        if (searchTerm) {
            const titlu = (item.titlu || '').toLowerCase();
            if (!titlu.includes(searchTerm)) return false;
        }
        return true;
    });

    renderNewsWithPagination();
}

export function renderNewsWithPagination() {
    const paginationNews = document.getElementById('pagination-news');
    const total = currentFilteredNews.length;
    const isAll = state.newsLimit === 'toate' || state.newsLimit === total;
    const numSize = isAll ? total : parseInt(state.newsLimit, 10);
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / numSize));
    if (state.newsPage > totalPages) state.newsPage = 1;

    const start = isAll ? 0 : (state.newsPage - 1) * numSize;
    const end = isAll ? total : start + numSize;
    const pageItems = currentFilteredNews.slice(start, end);

    renderNews(pageItems, total);

    renderPaginationControls(
        paginationNews,
        total,
        state.newsPage,
        String(state.newsLimit),
        (newPage) => {
            state.newsPage = newPage;
            renderNewsWithPagination();
        },
        (newSize) => {
            state.newsLimit = newSize === 'toate' ? 'toate' : parseInt(newSize, 10);
            state.newsPage = 1;
            renderNewsWithPagination();
        }
    );
}

export function renderNews(items, totalCount) {
    const newsCounterBadge = document.getElementById('news-counter-badge');
    const newsGridContainer = document.getElementById('news-grid-container');
    const newsTableContainer = document.getElementById('news-table-container');

    const cnt = totalCount !== undefined ? totalCount : items.length;
    if (newsCounterBadge) {
        newsCounterBadge.textContent = cnt + (cnt === 1 ? ' știre' : ' știri');
    }

    if (state.allNewsData.length === 0) {
        renderNewsEmptyState(true);
        return;
    }

    if (items.length === 0) {
        renderNewsEmptyState(false);
        return;
    }

    if (state.newsViewMode === 'table') {
        if (newsGridContainer) newsGridContainer.style.display = 'none';
        if (newsTableContainer) newsTableContainer.style.display = 'block';
        renderNewsTable(items);
    } else {
        if (newsTableContainer) newsTableContainer.style.display = 'none';
        if (newsGridContainer) newsGridContainer.style.display = 'grid';
        renderNewsGrid(items);
    }
}

export function renderNewsEmptyState(isDatabaseEmpty) {
    const newsGridContainer = document.getElementById('news-grid-container');
    const newsTableContainer = document.getElementById('news-table-container');
    const newsTableBody = document.getElementById('news-table-body');
    const newsSearchInput = document.getElementById('news-search-input');
    const newsStatusFilter = document.getElementById('news-status-filter');

    if (!newsGridContainer) return;

    while (newsGridContainer.firstChild) {
        newsGridContainer.removeChild(newsGridContainer.firstChild);
    }
    if (newsTableBody) {
        while (newsTableBody.firstChild) {
            newsTableBody.removeChild(newsTableBody.firstChild);
        }
    }

    if (newsTableContainer) newsTableContainer.style.display = 'none';
    newsGridContainer.style.display = 'grid';

    const emptyCard = document.createElement('div');
    emptyCard.className = 'empty-state-card';

    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent = '📰';
    emptyCard.appendChild(icon);

    const title = document.createElement('h3');
    title.className = 'empty-state-title';

    const desc = document.createElement('p');
    desc.className = 'empty-state-desc';

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'empty-state-actions';

    if (isDatabaseEmpty) {
        title.textContent = 'Baza de date cu știri este nepopulată în Supabase';
        desc.textContent = 'Site-ul public afișează temporar cele 9 comunicate oficiale din fișierul local content/news.json (SGR Chișinău, BEX UGR, USAMV FIFIM). Sincronizează-le acum în Supabase cu un singur clic pentru a le putea edita și administra direct din CMS!';

        const btnSync = document.createElement('button');
        btnSync.type = 'button';
        btnSync.className = 'btn btn-primary';
        btnSync.textContent = '📥 Sincronizează cele 9 știri din site în Supabase';
        btnSync.addEventListener('click', () => handleSyncDefaultNews(btnSync));
        actionsWrap.appendChild(btnSync);

        const btnNew = document.createElement('button');
        btnNew.type = 'button';
        btnNew.className = 'btn btn-secondary';
        btnNew.textContent = '+ Creează știre de la zero';
        btnNew.addEventListener('click', openAddNewsModal);
        actionsWrap.appendChild(btnNew);
    } else {
        title.textContent = 'Nu a fost găsit niciun articol conform filtrelor';
        desc.textContent = 'Nicio știre nu corespunde termenilor de căutare sau stării selectate. Resetează filtrele pentru a vizualiza lista completă.';

        const btnReset = document.createElement('button');
        btnReset.type = 'button';
        btnReset.className = 'btn btn-secondary';
        btnReset.textContent = 'Resetează filtrele';
        btnReset.addEventListener('click', () => {
            if (newsSearchInput) newsSearchInput.value = '';
            if (newsStatusFilter) newsStatusFilter.value = 'toate';
            document.querySelectorAll('.filter-pill[data-filter-news]').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-filter-news') === 'toate');
            });
            applyNewsFilter();
        });
        actionsWrap.appendChild(btnReset);
    }

    emptyCard.appendChild(title);
    emptyCard.appendChild(desc);
    emptyCard.appendChild(actionsWrap);
    newsGridContainer.appendChild(emptyCard);
}

export function renderNewsGrid(items) {
    const newsGridContainer = document.getElementById('news-grid-container');
    if (!newsGridContainer) return;

    while (newsGridContainer.firstChild) {
        newsGridContainer.removeChild(newsGridContainer.firstChild);
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card-item';

        const topRow = document.createElement('div');
        topRow.className = 'card-item-top';

        // Checkbox de selecție în masă
        const cbWrap = document.createElement('div');
        cbWrap.style.cssText = 'display: flex; align-items: center; margin-right: 12px;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'table-checkbox';
        cb.checked = state.selectedNewsIds.has(item.id);
        cb.title = 'Selectează știre';
        cb.addEventListener('change', () => {
            if (cb.checked) state.selectedNewsIds.add(item.id);
            else state.selectedNewsIds.delete(item.id);
            updateBulkActionsBar();
        });
        cbWrap.appendChild(cb);
        topRow.appendChild(cbWrap);

        const titleWrap = document.createElement('div');
        titleWrap.style.flex = '1';
        const titleEl = document.createElement('div');
        titleEl.className = 'card-item-title';
        titleEl.textContent = item.titlu || 'Fără titlu';
        titleWrap.appendChild(titleEl);

        const subDate = document.createElement('div');
        subDate.className = 'card-item-subtitle';
        subDate.textContent = 'Publicat la: ' + formatDateOnlyRo(item.data_publicare);
        titleWrap.appendChild(subDate);
        topRow.appendChild(titleWrap);

        const stateBadge = document.createElement('span');
        stateBadge.className = 'status-badge ' + (item.publicat ? 'publicat' : 'ciorna');
        stateBadge.textContent = item.publicat ? 'Publicat' : 'Ciornă';
        topRow.appendChild(stateBadge);

        card.appendChild(topRow);

        if (item.imagine_url) {
            const imgInfo = document.createElement('div');
            imgInfo.style.fontSize = '12px';
            imgInfo.style.color = 'var(--cyan)';
            imgInfo.style.marginBottom = '10px';
            imgInfo.textContent = '📷 ' + item.imagine_url;
            card.appendChild(imgInfo);
        }

        if (item.continut) {
            const contentBox = document.createElement('div');
            contentBox.className = 'callout-box';
            contentBox.style.maxHeight = '110px';
            contentBox.style.overflowY = 'auto';
            contentBox.textContent = item.continut;
            card.appendChild(contentBox);
        }

        const actionsBar = document.createElement('div');
        actionsBar.className = 'card-actions-bar';

        const leftGroup = document.createElement('div');
        leftGroup.style.display = 'flex';
        leftGroup.style.gap = '8px';

        const btnPreview = document.createElement('button');
        btnPreview.type = 'button';
        btnPreview.className = 'btn btn-secondary btn-sm';
        btnPreview.textContent = '👁 Previzualizează';
        btnPreview.addEventListener('click', () => openPreviewNewsModal(item));
        leftGroup.appendChild(btnPreview);

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn-secondary btn-sm';
        btnEdit.textContent = '✎ Editează';
        btnEdit.addEventListener('click', () => openEditNewsModal(item));
        leftGroup.appendChild(btnEdit);

        const btnToggle = document.createElement('button');
        btnToggle.type = 'button';
        btnToggle.className = 'btn btn-sm ' + (item.publicat ? 'btn-warning' : 'btn-success');
        btnToggle.textContent = item.publicat ? 'Retrage' : 'Publică';
        btnToggle.addEventListener('click', async () => {
            await handleToggleNewsPublish(item.id, !item.publicat, btnToggle);
        });
        leftGroup.appendChild(btnToggle);

        const btnHist = document.createElement('button');
        btnHist.type = 'button';
        btnHist.className = 'btn btn-secondary btn-sm';
        btnHist.title = 'Vezi istoricul modificărilor';
        btnHist.textContent = '🕒 Istoric';
        btnHist.addEventListener('click', () => openItemHistoryModal('stiri', item.id, item.titlu));
        leftGroup.appendChild(btnHist);

        actionsBar.appendChild(leftGroup);

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.textContent = '🗑 Șterge';
        btnDelete.addEventListener('click', async () => {
            if (confirm(`Ștergi definitiv știrea «${item.titlu}»?`)) {
                await handleDeleteNews(item.id, btnDelete);
            }
        });
        actionsBar.appendChild(btnDelete);

        card.appendChild(actionsBar);
        newsGridContainer.appendChild(card);
    });
}

export function renderNewsTable(items) {
    const newsTableBody = document.getElementById('news-table-body');
    const selectAllNews = document.getElementById('select-all-news');
    if (!newsTableBody) return;

    while (newsTableBody.firstChild) {
        newsTableBody.removeChild(newsTableBody.firstChild);
    }

    items.forEach(item => {
        const tr = document.createElement('tr');

        // Checkbox Selecție în masă
        const tdCb = document.createElement('td');
        tdCb.style.textAlign = 'center';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'table-checkbox';
        cb.checked = state.selectedNewsIds.has(item.id);
        cb.title = 'Selectează știre';
        cb.addEventListener('change', () => {
            if (cb.checked) state.selectedNewsIds.add(item.id);
            else state.selectedNewsIds.delete(item.id);
            updateBulkActionsBar();
        });
        tdCb.appendChild(cb);
        tr.appendChild(tdCb);

        // Titlu
        const tdTitle = document.createElement('td');
        tdTitle.style.fontWeight = '600';
        tdTitle.style.color = '#ffffff';
        tdTitle.textContent = item.titlu || 'Fără titlu';
        tr.appendChild(tdTitle);

        // Dată
        const tdDate = document.createElement('td');
        tdDate.style.fontSize = '12.5px';
        tdDate.textContent = formatDateOnlyRo(item.data_publicare);
        tr.appendChild(tdDate);

        // Imagine
        const tdImg = document.createElement('td');
        tdImg.style.fontSize = '12px';
        tdImg.style.color = 'var(--text-muted)';
        tdImg.textContent = item.imagine_url ? item.imagine_url.split('/').pop() : '—';
        tr.appendChild(tdImg);

        // Stare
        const tdState = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'status-badge ' + (item.publicat ? 'publicat' : 'ciorna');
        badge.textContent = item.publicat ? 'Publicat' : 'Ciornă';
        tdState.appendChild(badge);
        tr.appendChild(tdState);

        // Acțiuni
        const tdActions = document.createElement('td');
        tdActions.style.textAlign = 'right';

        const actionsWrap = document.createElement('div');
        actionsWrap.style.display = 'inline-flex';
        actionsWrap.style.gap = '6px';

        const btnPreview = document.createElement('button');
        btnPreview.type = 'button';
        btnPreview.className = 'btn btn-secondary btn-sm';
        btnPreview.textContent = '👁';
        btnPreview.title = 'Previzualizează articol';
        btnPreview.addEventListener('click', () => openPreviewNewsModal(item));
        actionsWrap.appendChild(btnPreview);

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn-secondary btn-sm';
        btnEdit.textContent = '✎';
        btnEdit.title = 'Editează articol';
        btnEdit.addEventListener('click', () => openEditNewsModal(item));
        actionsWrap.appendChild(btnEdit);

        const btnToggle = document.createElement('button');
        btnToggle.type = 'button';
        btnToggle.className = 'btn btn-sm ' + (item.publicat ? 'btn-warning' : 'btn-success');
        btnToggle.textContent = item.publicat ? 'Retrage' : 'Publică';
        btnToggle.addEventListener('click', async () => {
            await handleToggleNewsPublish(item.id, !item.publicat, btnToggle);
        });
        actionsWrap.appendChild(btnToggle);

        const btnHist = document.createElement('button');
        btnHist.type = 'button';
        btnHist.className = 'btn btn-secondary btn-sm';
        btnHist.textContent = '🕒';
        btnHist.title = 'Vezi istoric modificări';
        btnHist.addEventListener('click', () => openItemHistoryModal('stiri', item.id, item.titlu));
        actionsWrap.appendChild(btnHist);

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.textContent = '🗑';
        btnDelete.title = 'Șterge articol';
        btnDelete.addEventListener('click', async () => {
            if (confirm(`Ștergi definitiv știrea «${item.titlu}»?`)) {
                await handleDeleteNews(item.id, btnDelete);
            }
        });
        actionsWrap.appendChild(btnDelete);

        tdActions.appendChild(actionsWrap);
        tr.appendChild(tdActions);

        newsTableBody.appendChild(tr);
    });

    if (selectAllNews) {
        const allOnPageSelected = items.length > 0 && items.every(item => state.selectedNewsIds.has(item.id));
        selectAllNews.checked = allOnPageSelected;
    }
}

export function openAddNewsModal() {
    editingNewsId = null;
    const modalNews = document.getElementById('modal-news');
    const modalNewsTitle = document.getElementById('modal-news-title');
    const newsInputTitlu = document.getElementById('news-input-titlu');
    const newsInputData = document.getElementById('news-input-data');
    const newsInputImagine = document.getElementById('news-input-imagine');
    const newsInputContinut = document.getElementById('news-input-continut');
    const newsInputPublicat = document.getElementById('news-input-publicat');

    if (!modalNews) return;
    if (modalNewsTitle) modalNewsTitle.textContent = 'Publică știre nouă';
    if (newsInputTitlu) newsInputTitlu.value = '';
    if (newsInputData) newsInputData.value = new Date().toISOString().split('T')[0];
    if (newsInputImagine) newsInputImagine.value = '';
    if (newsInputContinut) newsInputContinut.value = '';
    if (newsInputPublicat) newsInputPublicat.checked = true;

    const setInput = (id, val) => {
        const input = document.getElementById(id);
        if (input) input.value = val;
    };
    
    // Resetare Categorie
    const wrapSelectCat = document.getElementById('wrap-select-cat');
    const wrapCustomCat = document.getElementById('wrap-custom-cat');
    const inputCustomCat = document.getElementById('news-input-categorie-custom');
    if (wrapSelectCat) wrapSelectCat.style.display = 'block';
    if (wrapCustomCat) wrapCustomCat.style.display = 'none';
    if (inputCustomCat) inputCustomCat.value = '';

    // Resetare Scope
    const wrapSelectScope = document.getElementById('wrap-select-scope');
    const wrapCustomScope = document.getElementById('wrap-custom-scope');
    const inputCustomScope = document.getElementById('news-input-scope-custom');
    if (wrapSelectScope) wrapSelectScope.style.display = 'block';
    if (wrapCustomScope) wrapCustomScope.style.display = 'none';
    if (inputCustomScope) inputCustomScope.value = '';

    setInput('news-input-categorie', 'Eveniment Oficial');
    setInput('news-input-scope', 'local');
    setInput('news-input-locatie', 'București');
    setInput('news-input-link-actiune', '');
    setInput('news-input-text-buton', 'Detalii ↗');
    setInput('news-input-slug', '');

    setPhotoLockState(false);
    updateNewsImageLivePreview('', '');
    updateReadingStats();
    updateCharCounters();
    modalNews.classList.add('active');
    if (newsInputTitlu) newsInputTitlu.focus();
}

export function openEditNewsModal(item) {
    editingNewsId = item.id;
    const modalNews = document.getElementById('modal-news');
    const modalNewsTitle = document.getElementById('modal-news-title');
    const newsInputTitlu = document.getElementById('news-input-titlu');
    const newsInputData = document.getElementById('news-input-data');
    const newsInputImagine = document.getElementById('news-input-imagine');
    const newsInputContinut = document.getElementById('news-input-continut');
    const newsInputPublicat = document.getElementById('news-input-publicat');

    if (!modalNews) return;
    const fb = document.getElementById('modal-news-feedback');
    if (fb) { fb.style.display = 'none'; fb.textContent = ''; }
    if (modalNewsTitle) modalNewsTitle.textContent = `Editează știre: ${item.titlu || ''}`;
    if (newsInputTitlu) newsInputTitlu.value = item.titlu || '';
    if (newsInputData) newsInputData.value = item.data_publicare ? item.data_publicare.split('T')[0] : '';
    if (newsInputImagine) newsInputImagine.value = item.imagine_url || '';
    if (newsInputContinut) newsInputContinut.value = item.continut || '';
    if (newsInputPublicat) newsInputPublicat.checked = !!item.publicat;

    const setInput = (id, val) => {
        const input = document.getElementById(id);
        if (input) input.value = val || '';
    };

    // Suport categorii presetate sau personalizate
    const wrapSelectCat = document.getElementById('wrap-select-cat');
    const wrapCustomCat = document.getElementById('wrap-custom-cat');
    const inputCustomCat = document.getElementById('news-input-categorie-custom');
    const selectCat = document.getElementById('news-input-categorie');
    const catVal = item.categorie || 'Eveniment Oficial';

    let isCatPreset = false;
    if (selectCat) {
        for (let opt of selectCat.options) {
            if (opt.value === catVal) {
                isCatPreset = true;
                break;
            }
        }
    }

    if (isCatPreset) {
        if (wrapSelectCat) wrapSelectCat.style.display = 'block';
        if (wrapCustomCat) wrapCustomCat.style.display = 'none';
        if (selectCat) selectCat.value = catVal;
        if (inputCustomCat) inputCustomCat.value = '';
    } else {
        if (wrapSelectCat) wrapSelectCat.style.display = 'none';
        if (wrapCustomCat) wrapCustomCat.style.display = 'block';
        if (selectCat) selectCat.value = '__custom__';
        if (inputCustomCat) inputCustomCat.value = catVal;
    }

    // Suport anvergură presetată sau personalizată
    const wrapSelectScope = document.getElementById('wrap-select-scope');
    const wrapCustomScope = document.getElementById('wrap-custom-scope');
    const inputCustomScope = document.getElementById('news-input-scope-custom');
    const selectScope = document.getElementById('news-input-scope');
    const scopeVal = item.scope || 'local';

    let isScopePreset = false;
    if (selectScope) {
        for (let opt of selectScope.options) {
            if (opt.value === scopeVal) {
                isScopePreset = true;
                break;
            }
        }
    }

    if (isScopePreset) {
        if (wrapSelectScope) wrapSelectScope.style.display = 'block';
        if (wrapCustomScope) wrapCustomScope.style.display = 'none';
        if (selectScope) selectScope.value = scopeVal;
        if (inputCustomScope) inputCustomScope.value = '';
    } else {
        if (wrapSelectScope) wrapSelectScope.style.display = 'none';
        if (wrapCustomScope) wrapCustomScope.style.display = 'block';
        if (selectScope) selectScope.value = '__custom__';
        if (inputCustomScope) inputCustomScope.value = scopeVal;
    }

    setInput('news-input-locatie', item.locatie || 'București');
    setInput('news-input-link-actiune', item.link_actiune || '');
    setInput('news-input-text-buton', item.text_buton || 'Detalii ↗');
    setInput('news-input-slug', item.slug || '');

    updateNewsImageLivePreview(item.imagine_url || '', item.titlu || '');
    setPhotoLockState(Boolean(item.imagine_blocata || (item.imagine_url && item.imagine_url.trim())));
    updateReadingStats();
    updateCharCounters();
    modalNews.classList.add('active');
    if (newsInputTitlu) newsInputTitlu.focus();
}

export function closeNewsModal() {
    const modalNews = document.getElementById('modal-news');
    if (modalNews) modalNews.classList.remove('active');
    editingNewsId = null;
}

export function openPreviewNewsModal(item) {
    const modalPreviewNews = document.getElementById('modal-preview-news');
    const modalPreviewTitle = document.getElementById('modal-preview-title');
    const previewBadgeStatus = document.getElementById('preview-badge-status');
    const previewDateText = document.getElementById('preview-date-text');
    const previewImageWrap = document.getElementById('preview-image-wrap');
    const previewImageEl = document.getElementById('preview-image-el');
    const previewContentBox = document.getElementById('preview-content-box');

    if (!modalPreviewNews) return;

    if (modalPreviewTitle) modalPreviewTitle.textContent = item.titlu || 'Fără titlu';
    
    // Status & Scope
    const isScheduled = item.data_publicare && item.data_publicare > new Date().toISOString().split('T')[0];
    if (previewBadgeStatus) {
        clearElement(previewBadgeStatus);
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-badge ' + (isScheduled ? 'badge-warning' : (item.publicat ? 'publicat' : 'ciorna'));
        statusSpan.textContent = isScheduled ? '⏳ Programat' : (item.publicat ? '✓ Publicat pe site' : 'Ciornă privată');
        previewBadgeStatus.appendChild(statusSpan);

        if (item.scope) {
            const scopeSpan = document.createElement('span');
            scopeSpan.className = 'badge-tech';
            scopeSpan.style.marginLeft = '8px';
            const scopeLabels = {
                'national': '🇷🇴 Național',
                'international': '🌍 Internațional',
                'academic': '🎓 Academic',
                'parteneriat': '🤝 Parteneriat',
                'institutional': '🏛️ Instituțional',
                'local': '📍 Local'
            };
            scopeSpan.textContent = scopeLabels[item.scope] || `📍 ${item.scope}`;
            previewBadgeStatus.appendChild(scopeSpan);
        }
        if (item.categorie) {
            const catSpan = document.createElement('span');
            catSpan.className = 'badge-pill';
            catSpan.style.marginLeft = '6px';
            catSpan.textContent = item.categorie;
            previewBadgeStatus.appendChild(catSpan);
        }
    }

    if (previewDateText) {
        previewDateText.textContent = 'Data articolului: ' + formatDateOnlyRo(item.data_publicare) + (item.locatie ? ` | Locație: ${item.locatie}` : '');
    }

    if (previewImageWrap && previewImageEl) {
        if (item.imagine_url && item.imagine_url.trim()) {
            previewImageWrap.style.display = 'block';
            previewImageEl.src = item.imagine_url.startsWith('http') ? item.imagine_url : `../${item.imagine_url}`;
        } else {
            previewImageWrap.style.display = 'none';
            previewImageEl.src = '';
        }
    }

    if (previewContentBox) {
        clearElement(previewContentBox);
        if (item.continut) {
            previewContentBox.appendChild(renderMarkdownLite(item.continut));
        } else {
            const p = document.createElement('p');
            p.className = 'text-muted';
            p.textContent = 'Fără conținut textual.';
            previewContentBox.appendChild(p);
        }

        if (item.link_actiune) {
            const actBox = document.createElement('div');
            actBox.style.marginTop = '20px';
            actBox.style.paddingTop = '16px';
            actBox.style.borderTop = '1px solid var(--border-subtle)';
            const btnLink = document.createElement('a');
            btnLink.href = item.link_actiune;
            btnLink.target = '_blank';
            btnLink.rel = 'noopener noreferrer';
            btnLink.className = 'btn btn-primary btn-sm';
            btnLink.textContent = item.text_buton || 'Detalii ↗';
            actBox.appendChild(btnLink);
            previewContentBox.appendChild(actBox);
        }
    }

    modalPreviewNews.classList.add('active');
}

export function closePreviewNewsModal() {
    const modalPreviewNews = document.getElementById('modal-preview-news');
    if (modalPreviewNews) modalPreviewNews.classList.remove('active');
}

export async function handleSaveNews() {
    const btnSaveNews = document.getElementById('btn-save-news');
    const newsInputTitlu = document.getElementById('news-input-titlu');
    const newsInputData = document.getElementById('news-input-data');
    const newsInputImagine = document.getElementById('news-input-imagine');
    const newsInputContinut = document.getElementById('news-input-continut');
    const newsInputPublicat = document.getElementById('news-input-publicat');

    const getVal = (id) => document.getElementById(id)?.value.trim() || '';

    const titluVal = newsInputTitlu ? newsInputTitlu.value.trim() : '';
    const dataVal = newsInputData ? newsInputData.value : '';
    const imagineVal = newsInputImagine ? newsInputImagine.value.trim() : '';
    const continutVal = newsInputContinut ? newsInputContinut.value.trim() : '';
    const publicatVal = newsInputPublicat ? newsInputPublicat.checked : true;

    // Detectare categorie personalizată sau selectată
    let categorieVal = getVal('news-input-categorie');
    const wrapCustomCat = document.getElementById('wrap-custom-cat');
    const inputCustomCat = document.getElementById('news-input-categorie-custom');
    if (wrapCustomCat && wrapCustomCat.style.display !== 'none' && inputCustomCat && inputCustomCat.value.trim()) {
        categorieVal = inputCustomCat.value.trim();
    } else if (categorieVal === '__custom__') {
        categorieVal = (inputCustomCat && inputCustomCat.value.trim()) || 'Eveniment Oficial';
    }

    if (!titluVal || titluVal.length < 3 || titluVal.length > 200) {
        showToast('Titlul trebuie să aibă între 3 și 200 de caractere.', 'error');
        return;
    }

    if (imagineVal && imagineVal.length > 500) {
        showToast('URL-ul imaginii nu poate depăși 500 de caractere.', 'error');
        return;
    }

    if (!isValidImageUrl(imagineVal)) {
        showToast('Adresa imaginii trebuie să înceapă cu https:// sau ugr-images/.', 'error');
        return;
    }

    if (btnSaveNews) {
        btnSaveNews.disabled = true;
        btnSaveNews.textContent = 'Salvare...';
    }

    try {
        // Detectare anvergură personalizată sau selectată
        let scopeVal = getVal('news-input-scope');
        const wrapCustomScope = document.getElementById('wrap-custom-scope');
        const inputCustomScope = document.getElementById('news-input-scope-custom');
        if (wrapCustomScope && wrapCustomScope.style.display !== 'none' && inputCustomScope && inputCustomScope.value.trim()) {
            scopeVal = inputCustomScope.value.trim();
        } else if (scopeVal === '__custom__') {
            scopeVal = (inputCustomScope && inputCustomScope.value.trim()) || 'local';
        }

        const lockVal = Boolean(document.getElementById('news-input-lock-imagine')?.checked);

        const payload = {
            titlu: titluVal,
            data_publicare: dataVal || new Date().toISOString().split('T')[0],
            imagine_url: imagineVal || null,
            continut: continutVal || null,
            publicat: publicatVal,
            status: publicatVal ? 'publicat' : 'ciorna',
            categorie: categorieVal || 'Eveniment Oficial',
            scope: scopeVal || 'local',
            locatie: getVal('news-input-locatie') || 'București',
            link_actiune: getVal('news-input-link-actiune') || null,
            text_buton: getVal('news-input-text-buton') || 'Detalii ↗',
        };

        if (editingNewsId) {
            const { error } = await client
                .from('stiri')
                .update(payload)
                .eq('id', editingNewsId);

            if (error) {
                showToast('Eroare: ' + error.message, 'error');
                const fb = document.getElementById('modal-news-feedback');
                if (fb) {
                    fb.style.display = 'block';
                    fb.className = 'feedback-banner error';
                    fb.textContent = 'Eroare la salvare: ' + error.message;
                }
                return;
            }
            showToast('Știrea a fost actualizată!', 'success');
        } else {
            const { error } = await client
                .from('stiri')
                .insert([payload]);

            if (error) {
                showToast('Eroare: ' + error.message, 'error');
                const fb = document.getElementById('modal-news-feedback');
                if (fb) {
                    fb.style.display = 'block';
                    fb.className = 'feedback-banner error';
                    fb.textContent = 'Eroare la salvare: ' + error.message;
                }
                return;
            }
            showToast('Știrea a fost publicată cu succes!', 'success');
        }

        closeNewsModal();
        await loadNews();
    } catch (err) {
        showToast('Eroare de conexiune la salvarea știrii.', 'error');
    } finally {
        if (btnSaveNews) {
            btnSaveNews.disabled = false;
            btnSaveNews.textContent = 'Salvează știre';
        }
    }
}

export async function handleToggleNewsPublish(newsId, newStatus, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = '...';
    }

    try {
        const { error } = await client
            .from('stiri')
            .update({ publicat: newStatus })
            .eq('id', newsId);

        if (error) {
            showToast('Eroare la actualizare: ' + error.message, 'error');
            return;
        }

        showToast(newStatus ? 'Știrea este acum publicată!' : 'Știrea a fost trecută în ciornă.', 'success');
        await loadNews();
    } catch (err) {
        showToast('Eroare de rețea la actualizarea știrii.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
        }
    }
}

export async function handleDeleteNews(newsId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.textContent = '...';
    }

    try {
        const { error } = await client
            .from('stiri')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', newsId);

        if (error) {
            showToast('Eroare la ștergere: ' + error.message, 'error');
            return;
        }

        showToast('Știrea a fost ștearsă (mutată în arhivă).', 'success');
        await loadNews();
    } catch (err) {
        showToast('Eroare de conexiune la ștergerea știrii.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
        }
    }
}

export function setPhotoLockState(isLocked) {
    const lockCb = document.getElementById('news-input-lock-imagine');
    const btnToggleLock = document.getElementById('btn-toggle-lock-photo');
    const badgeLock = document.getElementById('badge-photo-locked');
    const newsInputImagine = document.getElementById('news-input-imagine');
    const btnOpenMediaPicker = document.getElementById('btn-open-media-picker');
    const btnClearNewsImage = document.getElementById('btn-clear-news-image');
    const previewBox = document.getElementById('news-live-preview-box');
    const previewSubtext = document.getElementById('news-live-preview-subtext');

    if (lockCb) lockCb.checked = isLocked;
    if (badgeLock) badgeLock.style.display = isLocked ? 'inline-block' : 'none';
    if (newsInputImagine) newsInputImagine.readOnly = isLocked;
    if (btnOpenMediaPicker) {
        btnOpenMediaPicker.disabled = isLocked;
        btnOpenMediaPicker.title = isLocked ? 'Imaginea este fixată / blocată. Deblochează pentru a alege alta.' : 'Alege din galeria foto';
        btnOpenMediaPicker.style.opacity = isLocked ? '0.6' : '1';
    }
    if (btnClearNewsImage) {
        btnClearNewsImage.disabled = isLocked;
        btnClearNewsImage.style.opacity = isLocked ? '0.5' : '1';
    }

    if (btnToggleLock) {
        btnToggleLock.textContent = isLocked ? '🔓 Deblochează' : '🔒 Blochează';
        btnToggleLock.className = isLocked ? 'btn btn-warning btn-sm' : 'btn btn-secondary btn-sm';
    }

    if (previewBox) {
        if (isLocked) {
            previewBox.style.borderColor = 'var(--cyan)';
            previewBox.style.boxShadow = '0 0 12px rgba(0, 229, 255, 0.3)';
        } else {
            previewBox.style.borderColor = '';
            previewBox.style.boxShadow = '';
        }
    }

    if (previewSubtext) {
        previewSubtext.textContent = isLocked 
            ? '🔒 Imagine fixată și protejată (Anti-override)' 
            : 'Imagine selectată pentru articol';
        previewSubtext.style.color = isLocked ? '#22d3ee' : 'var(--cyan)';
    }
}

export function setupNewsCategoryControls() {
    // 1. Controale Categorie Personalizată (+ Adaugă)
    const btnToggleCustomCat = document.getElementById('btn-toggle-custom-cat');
    const btnCancelCustomCat = document.getElementById('btn-cancel-custom-cat');
    const selectCat = document.getElementById('news-input-categorie');
    const wrapSelectCat = document.getElementById('wrap-select-cat');
    const wrapCustomCat = document.getElementById('wrap-custom-cat');
    const inputCustomCat = document.getElementById('news-input-categorie-custom');

    if (btnToggleCustomCat) {
        btnToggleCustomCat.addEventListener('click', () => {
            if (wrapSelectCat) wrapSelectCat.style.display = 'none';
            if (wrapCustomCat) wrapCustomCat.style.display = 'block';
            if (inputCustomCat) inputCustomCat.focus();
        });
    }

    if (btnCancelCustomCat) {
        btnCancelCustomCat.addEventListener('click', () => {
            if (wrapCustomCat) wrapCustomCat.style.display = 'none';
            if (wrapSelectCat) wrapSelectCat.style.display = 'block';
            if (selectCat) selectCat.value = 'Eveniment Oficial';
        });
    }

    if (selectCat) {
        selectCat.addEventListener('change', () => {
            if (selectCat.value === '__custom__') {
                if (wrapSelectCat) wrapSelectCat.style.display = 'none';
                if (wrapCustomCat) wrapCustomCat.style.display = 'block';
                if (inputCustomCat) inputCustomCat.focus();
            }
        });
    }

    // 2. Controale Anvergură Personalizată (+ Adaugă)
    const btnToggleCustomScope = document.getElementById('btn-toggle-custom-scope');
    const btnCancelCustomScope = document.getElementById('btn-cancel-custom-scope');
    const selectScope = document.getElementById('news-input-scope');
    const wrapSelectScope = document.getElementById('wrap-select-scope');
    const wrapCustomScope = document.getElementById('wrap-custom-scope');
    const inputCustomScope = document.getElementById('news-input-scope-custom');

    if (btnToggleCustomScope) {
        btnToggleCustomScope.addEventListener('click', () => {
            if (wrapSelectScope) wrapSelectScope.style.display = 'none';
            if (wrapCustomScope) wrapCustomScope.style.display = 'block';
            if (inputCustomScope) inputCustomScope.focus();
        });
    }

    if (btnCancelCustomScope) {
        btnCancelCustomScope.addEventListener('click', () => {
            if (wrapCustomScope) wrapCustomScope.style.display = 'none';
            if (wrapSelectScope) wrapSelectScope.style.display = 'block';
            if (selectScope) selectScope.value = 'local';
        });
    }

    if (selectScope) {
        selectScope.addEventListener('change', () => {
            if (selectScope.value === '__custom__') {
                if (wrapSelectScope) wrapSelectScope.style.display = 'none';
                if (wrapCustomScope) wrapCustomScope.style.display = 'block';
                if (inputCustomScope) inputCustomScope.focus();
            }
        });
    }

    // 3. Controale Blocare / Fixare Imagine (Anti-Override)
    const lockCb = document.getElementById('news-input-lock-imagine');
    const btnToggleLock = document.getElementById('btn-toggle-lock-photo');

    if (btnToggleLock) {
        btnToggleLock.addEventListener('click', () => {
            const nextLocked = !lockCb?.checked;
            setPhotoLockState(nextLocked);
            showToast(nextLocked ? '🔒 Imaginea a fost blocată (nu va fi suprascrisă automat).' : '🔓 Imaginea a fost deblocată.', nextLocked ? 'success' : 'info');
        });
    }

    if (lockCb) {
        lockCb.addEventListener('change', () => {
            setPhotoLockState(lockCb.checked);
            showToast(lockCb.checked ? '🔒 Imagine blocată împotriva suprascrierii.' : '🔓 Imagine deblocată.', lockCb.checked ? 'success' : 'info');
        });
    }
}


