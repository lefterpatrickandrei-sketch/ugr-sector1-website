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

// T-J7: scheme-uri acceptate în câmpurile de link din panou.
// Fără javascript: și data: un link salvat în baza de date devine XSS la
// randare pe site-ul public.
const SAFE_URL_SCHEMES = ['http', 'https', 'mailto', 'tel'];

/**
 * Verifică dacă o adresă introdusă într-un câmp de link poate fi salvată.
 * - câmp gol  → valid (opțional)
 * - fără schemă → valid (adresă relativă)
 * - cu schemă → valid doar dacă e în SAFE_URL_SCHEMES
 * @returns {boolean}
 */
export function isSafeHref(url) {
    const s = String(url ?? '').trim();
    if (!s) return true;

    // Eliminăm caracterele de control și spațiile, pe care browserele le
    // ignoră înainte de a interpreta schema: "java\nscript:alert(1)".
    const probe = s.replace(/[\u0000-\u0020\u007F]+/g, '');
    const m = probe.match(/^([a-z][a-z0-9+.-]*):/i);
    if (!m) return true; // adresă relativă, fără schemă

    return SAFE_URL_SCHEMES.includes(m[1].toLowerCase());
}

/** Mesajul standard pentru un câmp de link respins. */
export function unsafeHrefMessage(label) {
    return `Adresa de la «${label}» este invalidă. Sunt permise doar adrese care încep cu https://, http://, mailto: sau tel:.`;
}

/** Verifică și returnează mesajul de eroare, sau null dacă valoarea e acceptată. */
export function checkHrefField(value, label) {
    if (isSafeHref(value)) return null;
    return unsafeHrefMessage(label);
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


