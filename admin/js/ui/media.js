/**
 * Media Picker Modal & Text Editor Toolbar Helpers
 * Upgraded in P5: Supabase Storage 'media' bucket, WebP resizing, Drag & Drop
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast } from './toast.js';
import { updateCharCounters } from '../lib/format.js';

export const OFFICIAL_MEDIA_ASSETS = [
    { name: "Conferința SGR Chișinău (Amfiteatru UTM)", file: "ugr-images/united_1384.png", tag: "eveniment", isLocal: true },
    { name: "Masă Rotundă BCPI Sector 1", file: "ugr-images/ig_post_5.jpg", tag: "instituțional", isLocal: true },
    { name: "Gala MTC & Pachet 18 Workshopuri", file: "ugr-images/ig_post_3.jpg", tag: "workshop", isLocal: true },
    { name: "Comunitate Geodezică Teren", file: "ugr-images/ig_post_1.jpg", tag: "teren", isLocal: true },
    { name: "Consultare Tehnică Specialiști", file: "ugr-images/ig_post_2.jpg", tag: "instituțional", isLocal: true },
    { name: "Activitate Profesională Filială", file: "ugr-images/ig_post_4.jpg", tag: "eveniment", isLocal: true },
    { name: "Întâlnire Practică & Tehnologie", file: "ugr-images/ig_post_6.jpg", tag: "teren", isLocal: true },
    { name: "Echipamente Geodezice Teren GNSS", file: "ugr-images/ISP7469.png", tag: "tehnic", isLocal: true },
    { name: "Măsurători Stație Totală & Rețea", file: "ugr-images/ISP7765.png", tag: "tehnic", isLocal: true },
    { name: "Inginerie & Șantier Cadastru", file: "ugr-images/ISP8061.png", tag: "teren", isLocal: true },
    { name: "Scanare Laser LiDAR & GNSS", file: "ugr-images/ISP8267.png", tag: "tehnic", isLocal: true },
    { name: "Workshop Profesional GEOS", file: "ugr-images/6a0c07be70466Invitaie-workshop-GEOS.png", tag: "workshop", isLocal: true },
    { name: "Student Community USAMV FIFIM", file: "ugr-images/ugr_student_community_meeting.jpg", tag: "studenti", isLocal: true },
    { name: "Poster Burse Geodezie UTM Chișinău", file: "ugr-images/6a2fcf1057a4cPoster-Bursa-SGR-2026.png", tag: "burse", isLocal: true },
    { name: "Banner Congres SGR Chișinău", file: "ugr-images/6a3a76ec27fdaBanner_chisinau_2026_11.jpg", tag: "eveniment", isLocal: true },
    { name: "Board CLGE Tartu (Consiliu European)", file: "ugr-images/6a0c30e4559d8Board-CLGE-Tartu-mai-2026.png", tag: "oficial", isLocal: true },
    { name: "Adunarea Generală CLGE Tartu", file: "ugr-images/6a0c33b42cd7bAG-CLGE-TARTU-Group-pic.png", tag: "oficial", isLocal: true },
    { name: "Delegație Cornel Păunescu CLGE", file: "ugr-images/6a0c3219a2b43Cornel-Punescu-CLGE-Tartu.png", tag: "oficial", isLocal: true },
    { name: "Observator România CLGE Tartu", file: "ugr-images/6a0c329530cd0Observator-Tartu-1.png", tag: "oficial", isLocal: true },
    { name: "Comunicat Oficial BEX UGR (Pag. 1)", file: "ugr-images/6a16e8a299426Comunicat-in-urma-sedintei-BEX-UGR-din-21.05.2026_Page_1.png", tag: "bex", isLocal: true },
    { name: "Comunicat Oficial BEX UGR (Pag. 2)", file: "ugr-images/6a16e8af09d90Comunicat-in-urma-sedintei-BEX-UGR-din-21.05.2026_Page_2.png", tag: "bex", isLocal: true },
    { name: "Noii Vicepreședinți FIG", file: "ugr-images/6a196478983e1Noii-Vicepreedini-FIG.jpeg", tag: "oficial", isLocal: true },
    { name: "Delegați FIG Iaroslav & Diane", file: "ugr-images/6a19645d0cbc2Iaroslav-i-Diane.jpeg", tag: "oficial", isLocal: true },
    { name: "Siglă Partener ANCPI", file: "ugr-images/ancpi.png", tag: "partener", isLocal: true },
    { name: "Siglă For European CLGE", file: "ugr-images/clge.png", tag: "partener", isLocal: true },
    { name: "Siglă For Internațional FIG", file: "ugr-images/fig.png", tag: "partener", isLocal: true },
    { name: "Sigla Oficială UGR", file: "ugr-images/logo_geodez.png", tag: "identitate", isLocal: true },
    { name: "Portret Petre Iuliu Dragomir", file: "ugr-images/6214a5fa49f15Dragomir-Petre-Iuliu.JPG", tag: "conducere", isLocal: true },
    { name: "Portret Mircea Afrăsinei", file: "ugr-images/67272db703f0aMircea-Afrsinei.jpg", tag: "conducere", isLocal: true }
];

export async function loadRemoteMediaAssets() {
    try {
        const { data, error } = await client.storage
            .from('media')
            .list('', {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            // Bucket s-ar putea să nu fie creat încă dacă migrarea 004 nu a fost rulată
            state.remoteMediaAssets = [];
            return;
        }

        if (data && Array.isArray(data)) {
            state.remoteMediaAssets = data.map(item => {
                const { data: pubData } = client.storage.from('media').getPublicUrl(item.name);
                return {
                    name: item.name,
                    file: pubData.publicUrl,
                    tag: 'upload',
                    isLocal: false,
                    size: item.metadata?.size || 0,
                    created_at: item.created_at
                };
            });
        }
    } catch (err) {
        state.remoteMediaAssets = [];
    }
}

export async function compressAndResizeImage(file, maxDimension = 1600, quality = 0.82) {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let { width, height } = img;

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(file);
                    return;
                }
                const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const convertedFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
                resolve(convertedFile);
            }, 'image/webp', quality);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
        };

        img.src = objectUrl;
    });
}

export async function handleUploadMedia(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        showToast('Fișierul depășește limita de 5 MB.', 'error');
        return;
    }

    const uploadStatus = document.getElementById('media-upload-status');
    if (uploadStatus) {
        uploadStatus.style.display = 'block';
        uploadStatus.textContent = 'Procesare & optimizare WebP...';
    }

    try {
        const processedFile = await compressAndResizeImage(file);
        
        if (uploadStatus) {
            uploadStatus.textContent = 'Se încarcă în Supabase Storage...';
        }

        const cleanName = processedFile.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
        const fileName = `${Date.now()}-${cleanName}`;

        const { data, error } = await client.storage
            .from('media')
            .upload(fileName, processedFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        showToast(`Fișierul «${processedFile.name}» a fost încărcat cu succes!`, 'success');
        await loadRemoteMediaAssets();
        renderMediaPickerGrid(document.getElementById('media-search-input')?.value || '');
    } catch (err) {
        showToast(`Eroare la încărcare: ${err.message}`, 'error');
    } finally {
        if (uploadStatus) {
            uploadStatus.style.display = 'none';
        }
    }
}

export async function handleDeleteRemoteMedia(fileName) {
    if (!confirm(`Sunteți sigur că doriți să ștergeți definitiv fișierul «${fileName}» din Supabase Storage?`)) {
        return;
    }

    try {
        const { error } = await client.storage
            .from('media')
            .remove([fileName]);

        if (error) throw error;

        showToast(`Fișierul «${fileName}» a fost șters din storage.`, 'info');
        await loadRemoteMediaAssets();
        renderMediaPickerGrid(document.getElementById('media-search-input')?.value || '');
    } catch (err) {
        showToast(`Eroare la ștergerea fișierului: ${err.message}`, 'error');
    }
}

export async function openMediaPickerModal() {
    const modalMediaPicker = document.getElementById('modal-media-picker');
    const mediaSearchInput = document.getElementById('media-search-input');
    if (!modalMediaPicker) return;
    modalMediaPicker.classList.add('active');
    if (mediaSearchInput) {
        mediaSearchInput.value = '';
        mediaSearchInput.focus();
    }
    await loadRemoteMediaAssets();
    renderMediaPickerGrid('');
}

export function closeMediaPickerModal() {
    const modalMediaPicker = document.getElementById('modal-media-picker');
    if (modalMediaPicker) modalMediaPicker.classList.remove('active');
}

export function renderMediaPickerGrid(filter) {
    const mediaPickerGrid = document.getElementById('media-picker-grid');
    const newsInputImagine = document.getElementById('news-input-imagine');
    if (!mediaPickerGrid) return;

    while (mediaPickerGrid.firstChild) mediaPickerGrid.removeChild(mediaPickerGrid.firstChild);

    const f = (filter || '').toLowerCase().trim();
    const isOwner = state.adminRecord?.rol === 'owner' || state.adminRecord?.rol === 'admin';

    let allAssets = [];
    if (state.mediaActiveTab === 'remote') {
        allAssets = [...state.remoteMediaAssets];
    } else if (state.mediaActiveTab === 'local') {
        allAssets = [...OFFICIAL_MEDIA_ASSETS];
    } else {
        allAssets = [...state.remoteMediaAssets, ...OFFICIAL_MEDIA_ASSETS];
    }

    const filtered = allAssets.filter(a => {
        if (!f) return true;
        return a.name.toLowerCase().includes(f) || a.tag.toLowerCase().includes(f) || a.file.toLowerCase().includes(f);
    });

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 13px;';
        empty.textContent = 'Niciun fișier media găsit conform filtrului curent.';
        mediaPickerGrid.appendChild(empty);
        return;
    }

    filtered.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'media-picker-card';
        if (newsInputImagine && newsInputImagine.value === asset.file) card.classList.add('selected');

        const isImg = asset.file.match(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i);

        if (isImg) {
            const img = document.createElement('img');
            img.className = 'media-picker-thumb';
            img.src = asset.isLocal ? ('../' + asset.file) : asset.file;
            img.alt = asset.name;
            img.loading = 'lazy';
            card.appendChild(img);
        } else {
            const docThumb = document.createElement('div');
            docThumb.className = 'media-picker-thumb doc-thumb-placeholder';
            docThumb.style.cssText = 'display:flex;align-items:center;justify-content:center;background:#1e293b;color:var(--cyan);font-size:24px;height:120px;';
            docThumb.textContent = '📄 PDF';
            card.appendChild(docThumb);
        }

        const info = document.createElement('div');
        info.className = 'media-picker-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'media-picker-name';
        nameEl.textContent = asset.name;
        info.appendChild(nameEl);

        const metaRow = document.createElement('div');
        metaRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 4px;';

        const tagEl = document.createElement('div');
        tagEl.className = 'media-picker-tag';
        tagEl.textContent = asset.isLocal ? '#arhivă-locală' : '#supabase-storage';
        metaRow.appendChild(tagEl);

        if (!asset.isLocal && isOwner) {
            const btnDel = document.createElement('button');
            btnDel.type = 'button';
            btnDel.className = 'btn-trash-inline';
            btnDel.title = 'Șterge din Supabase Storage';
            btnDel.textContent = '🗑️';
            btnDel.style.cssText = 'background:none;border:none;cursor:pointer;font-size:12px;padding:2px 4px;';
            btnDel.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteRemoteMedia(asset.name);
            });
            metaRow.appendChild(btnDel);
        }

        info.appendChild(metaRow);
        card.appendChild(info);

        card.addEventListener('click', () => {
            selectMediaAsset(asset.file, asset.name);
        });

        mediaPickerGrid.appendChild(card);
    });
}

export function selectMediaAsset(filePath, displayName) {
    const newsInputImagine = document.getElementById('news-input-imagine');
    const lockCb = document.getElementById('news-input-lock-imagine');
    const badgeLock = document.getElementById('badge-photo-locked');
    const previewSubtext = document.getElementById('news-live-preview-subtext');

    if (newsInputImagine) newsInputImagine.value = filePath;
    updateNewsImageLivePreview(filePath, displayName || filePath);
    updateCharCounters();

    // Fixează automat imaginea selectată pentru a preveni orice suprascriere automată
    if (lockCb) lockCb.checked = true;
    if (badgeLock) badgeLock.style.display = 'inline-block';
    if (previewSubtext) {
        previewSubtext.textContent = '🔒 Imagine fixată și protejată (Anti-override)';
        previewSubtext.style.color = '#22d3ee';
    }

    closeMediaPickerModal();
    showToast('Fișierul a fost selectat și fixat împotriva suprascrierii.', 'success');
}

export function updateNewsImageLivePreview(url, name) {
    const newsLivePreviewBox = document.getElementById('news-live-preview-box');
    const newsLivePreviewImg = document.getElementById('news-live-preview-img');
    const newsLivePreviewName = document.getElementById('news-live-preview-name');
    if (!newsLivePreviewBox || !newsLivePreviewImg) return;

    if (url && url.trim()) {
        newsLivePreviewBox.style.display = 'flex';
        newsLivePreviewImg.src = url.startsWith('http') ? url : ('../' + url);
        if (newsLivePreviewName) newsLivePreviewName.textContent = name || url.split('/').pop() || url;
    } else {
        newsLivePreviewBox.style.display = 'none';
        newsLivePreviewImg.src = '';
        if (newsLivePreviewName) newsLivePreviewName.textContent = '-';
    }
}

export function applyFormatting(formatType) {
    const el = document.getElementById('news-input-continut');
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    const sel = val.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (formatType) {
        case 'bold':
            replacement = `**${sel || 'text îngroșat'}**`;
            cursorOffset = sel ? replacement.length : 2;
            break;
        case 'italic':
            replacement = `*${sel || 'text cursiv'}*`;
            cursorOffset = sel ? replacement.length : 1;
            break;
        case 'heading':
            replacement = `\n### ${sel || 'Titlu secțiune'}\n`;
            cursorOffset = replacement.length;
            break;
        case 'link':
            replacement = `[${sel || 'Titlu link'}](https://ugr.ro)`;
            cursorOffset = replacement.length;
            break;
        case 'quote':
            replacement = `\n> ${sel || 'Citat sau declarație oficială'}\n`;
            cursorOffset = replacement.length;
            break;
        case 'ul':
            replacement = `\n• ${sel || 'Element listă'}\n`;
            cursorOffset = replacement.length;
            break;
        case 'ol':
            replacement = `\n1. ${sel || 'Primul punct'}\n`;
            cursorOffset = replacement.length;
            break;
        case 'clear':
            replacement = sel.replace(/\s+/g, ' ').trim();
            cursorOffset = replacement.length;
            break;
        default:
            return;
    }

    el.value = val.substring(0, start) + replacement + val.substring(end);
    el.focus();
    el.setSelectionRange(start + cursorOffset, start + cursorOffset);
    updateReadingStats();
}

export function updateReadingStats() {
    const el = document.getElementById('news-input-continut');
    const newsReadingTime = document.getElementById('news-reading-time');
    const newsWordCount = document.getElementById('news-word-count');
    if (!el) return;

    const text = el.value.trim();
    if (!text) {
        if (newsReadingTime) newsReadingTime.textContent = '~0 min de lectură';
        if (newsWordCount) newsWordCount.textContent = '0 cuvinte';
        return;
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    if (newsReadingTime) newsReadingTime.textContent = `~${minutes} min de lectură`;
    if (newsWordCount) newsWordCount.textContent = `${words} cuvinte`;
}
