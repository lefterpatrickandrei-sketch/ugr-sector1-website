/**
 * Media Picker Modal & Text Editor Toolbar Helpers
 */

import { showToast } from './toast.js';

export const OFFICIAL_MEDIA_ASSETS = [
    { name: "Conferința Geodezie UGR", file: "ugr-images/united_1384.png", tag: "eveniment" },
    { name: "Echipamente Geodezice Teren", file: "ugr-images/ISP7469.png", tag: "tehnic" },
    { name: "Măsurători Stație Totală", file: "ugr-images/ISP7765.png", tag: "tehnic" },
    { name: "Inginerie & Șantier", file: "ugr-images/ISP8061.png", tag: "teren" },
    { name: "Scanare Laser LiDAR & GNSS", file: "ugr-images/ISP8267.png", tag: "tehnic" },
    { name: "Workshop Profesional GEOS", file: "ugr-images/6a0c07be70466Invitaie-workshop-GEOS.png", tag: "workshop" },
    { name: "Board CLGE Tartu", file: "ugr-images/6a0c30e4559d8Board-CLGE-Tartu-mai-2026.png", tag: "oficial" },
    { name: "Adunarea Generală CLGE", file: "ugr-images/6a0c33b42cd7bAG-CLGE-TARTU-Group-pic.png", tag: "oficial" },
    { name: "Banner Congres Chișinău", file: "ugr-images/6a3a76ec27fdaBanner_chisinau_2026_11.jpg", tag: "eveniment" },
    { name: "Poster Burse Geodezie UTM", file: "ugr-images/6a2fcf1057a4cPoster-Bursa-SGR-2026.png", tag: "burse" },
    { name: "Student Community USAMV", file: "ugr-images/ugr_student_community_meeting.jpg", tag: "studenti" },
    { name: "Sigla Oficială UGR", file: "ugr-images/logo_geodez.png", tag: "identitate" },
    { name: "Comunicat BEX Oficial", file: "ugr-images/6a16e8a299426Comunicat-in-urma-sedintei-BEX-UGR-din-21.05.2026_Page_1.png", tag: "bex" },
    { name: "Petre Iuliu Dragomir", file: "ugr-images/6214a5fa49f15Dragomir-Petre-Iuliu.JPG", tag: "conducere" },
    { name: "Mircea Afrăsinei", file: "ugr-images/67272db703f0aMircea-Afrsinei.jpg", tag: "conducere" }
];

export function openMediaPickerModal() {
    const modalMediaPicker = document.getElementById('modal-media-picker');
    const mediaSearchInput = document.getElementById('media-search-input');
    if (!modalMediaPicker) return;
    modalMediaPicker.classList.add('active');
    if (mediaSearchInput) {
        mediaSearchInput.value = '';
        mediaSearchInput.focus();
    }
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
    const assets = OFFICIAL_MEDIA_ASSETS.filter(a => {
        if (!f) return true;
        return a.name.toLowerCase().includes(f) || a.tag.toLowerCase().includes(f) || a.file.toLowerCase().includes(f);
    });

    if (assets.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 13px;';
        empty.textContent = 'Nicio imagine găsită conform căutării tale.';
        mediaPickerGrid.appendChild(empty);
        return;
    }

    assets.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'media-picker-card';
        if (newsInputImagine && newsInputImagine.value === asset.file) card.classList.add('selected');

        const img = document.createElement('img');
        img.className = 'media-picker-thumb';
        img.src = '../' + asset.file;
        img.alt = asset.name;
        img.loading = 'lazy';
        card.appendChild(img);

        const info = document.createElement('div');
        info.className = 'media-picker-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'media-picker-name';
        nameEl.textContent = asset.name;
        info.appendChild(nameEl);

        const tagEl = document.createElement('div');
        tagEl.className = 'media-picker-tag';
        tagEl.textContent = '#' + asset.tag;
        info.appendChild(tagEl);

        card.appendChild(info);

        card.addEventListener('click', () => {
            selectMediaAsset(asset.file, asset.name);
        });

        mediaPickerGrid.appendChild(card);
    });
}

export function selectMediaAsset(filePath, displayName) {
    const newsInputImagine = document.getElementById('news-input-imagine');
    if (newsInputImagine) newsInputImagine.value = filePath;
    updateNewsImageLivePreview(filePath, displayName || filePath);
    closeMediaPickerModal();
    showToast('Imaginea a fost selectată din biblioteca foto oficială.', 'success');
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
