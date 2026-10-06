/**
 * Format and validation helpers for UGR Admin
 */

export function formatStatusLabel(st) {
    switch (st) {
        case 'in_asteptare': return 'În așteptare';
        case 'aprobat': return 'Aprobată';
        case 'respins': return 'Respinsă';
        case 'activ': return 'Activ';
        case 'suspendat': return 'Suspendat';
        case 'inactiv': return 'Inactiv';
        default: return st || '—';
    }
}

export function formatDateTimeRo(isoStr) {
    if (!isoStr) return '—';
    try {
        const d = new Date(isoStr);
        return d.toLocaleDateString('ro-RO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return isoStr;
    }
}

export function formatDateOnlyRo(isoDate) {
    if (!isoDate) return '—';
    try {
        const d = new Date(isoDate);
        return d.toLocaleDateString('ro-RO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return isoDate;
    }
}

export function isValidImageUrl(url) {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    if (trimmed.startsWith('https://')) return true;
    if (trimmed.startsWith('ugr-images/') || trimmed.startsWith('/ugr-images/')) return true;
    return false;
}

export function updateCharCounters() {
    const counterMemberNume = document.getElementById('counter-member-nume');
    const memberInputNume = document.getElementById('member-input-nume');
    const counterMemberSerie = document.getElementById('counter-member-serie');
    const memberInputSerie = document.getElementById('member-input-serie');
    const counterNewsTitlu = document.getElementById('counter-news-titlu');
    const newsInputTitlu = document.getElementById('news-input-titlu');
    const counterNewsImagine = document.getElementById('counter-news-imagine');
    const newsInputImagine = document.getElementById('news-input-imagine');

    if (counterMemberNume && memberInputNume) {
        counterMemberNume.textContent = `${memberInputNume.value.length}/120`;
    }
    if (counterMemberSerie && memberInputSerie) {
        counterMemberSerie.textContent = `${memberInputSerie.value.length}/80`;
    }
    if (counterNewsTitlu && newsInputTitlu) {
        counterNewsTitlu.textContent = `${newsInputTitlu.value.length}/200`;
    }
    if (counterNewsImagine && newsInputImagine) {
        counterNewsImagine.textContent = `${newsInputImagine.value.length}/500`;
    }
}

export function updateReadingStats() {
    const newsInputContinut = document.getElementById('news-input-continut');
    const newsReadingTime = document.getElementById('news-reading-time');
    const newsWordCount = document.getElementById('news-word-count');

    if (!newsReadingTime || !newsWordCount) return;
    const text = newsInputContinut ? newsInputContinut.value.trim() : '';
    if (!text) {
        newsReadingTime.textContent = '~0 min de lectură';
        newsWordCount.textContent = '0 cuvinte';
        return;
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    newsReadingTime.textContent = `~${minutes} min de lectură`;
    newsWordCount.textContent = `${words} cuvinte`;
}


