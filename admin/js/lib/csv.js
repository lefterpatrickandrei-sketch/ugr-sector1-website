/**
 * CSV / Excel Export Utilities (Client-side with UTF-8 BOM for Romanian diacritics)
 */

import { showToast } from '../ui/toast.js';
import { formatDateTimeRo } from './format.js';

export function exportArrayToCsv(filename, headers, rows) {
    const escapeCsv = (str) => {
        let s = (str === null || str === undefined) ? '' : String(str);
        s = s.replace(/"/g, '""');
        if (s.search(/("|,|\n|\r)/g) >= 0) {
            s = `"${s}"`;
        }
        return s;
    };

    const allRows = [headers, ...rows];
    const csvBody = allRows.map(r => r.map(escapeCsv).join(',')).join('\r\n');
    
    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Fișierul «${filename}» a fost descărcat cu succes!`, 'success');
}

export function exportMembersToCsv(membersData) {
    if (!membersData || membersData.length === 0) {
        showToast('Nu există membri de exportat.', 'error');
        return;
    }

    const headers = ['ID Membru', 'Nume Complet', 'Județ', 'Serie ANCPI', 'Categorie', 'Status', 'Afișare Publică', 'Data Înregistrării'];
    const rows = membersData.map(m => [
        m.id || '',
        m.nume || '',
        m.judet || '',
        m.serie_autorizatie || '',
        m.categorie || '',
        m.status || '',
        m.afisare_publica ? 'DA' : 'NU',
        formatDateTimeRo(m.created_at)
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    exportArrayToCsv(`UGR_Sector1_Registru_Membri_${dateStr}.csv`, headers, rows);
}

export function exportRequestsToCsv(requestsData) {
    if (!requestsData || requestsData.length === 0) {
        showToast('Nu există cereri de exportat.', 'error');
        return;
    }

    const headers = ['ID Cerere', 'Nume Solicitant', 'Email', 'Telefon', 'Județ', 'Certificat ANCPI', 'Categorie Dorită', 'Status', 'Data Depunerii', 'Notițe Birou Executiv'];
    const rows = requestsData.map(r => [
        r.id || '',
        r.nume_complet || '',
        r.email || '',
        r.telefon || '',
        r.judet || '',
        r.certificat_ancpi || '',
        r.categorie_dorita || '',
        r.status || '',
        formatDateTimeRo(r.creat_la),
        r.notite_interne || ''
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    exportArrayToCsv(`UGR_Sector1_Cereri_Inscriere_${dateStr}.csv`, headers, rows);
}
