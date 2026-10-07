/**
 * db.js
 *
 * Protecție pentru apelurile de scriere (INSERT / UPDATE / DELETE / UPSERT)
 * din panoul admin UGR.
 *
 * ─── Problema pe care o rezolvă ────────────────────────────────────────────
 *
 * În PostgREST, un `.update()` sau `.delete()` fără `.select()` întoarce
 *     { data: null, error: null }
 * chiar dacă RLS a blocat operația sau dacă rândul nu mai există.
 * Interfața raportează "salvat" deși în baza de date nu s-a schimbat nimic.
 *
 * Prin adăugarea `.select(...)` PostgREST întoarce rândurile afectate, deci
 * putem verifica efectiv câte rânduri au fost atinse.
 *
 * ─── Cum se folosește ─────────────────────────────────────────────────────
 *
 *     import { writeRows, describeDbError } from '../lib/db.js';
 *
 *     const { error } = await writeRows(
 *         client.from('membri').update(payload).eq('id', id).select('id'),
 *         { context: 'salvarea membrului' }
 *     );
 *     if (error) {
 *         showToast(describeDbError(error, 'Membrul nu a putut fi salvat.'), 'error');
 *         return;
 *     }
 *
 * `writeRows` are exact forma returnată de Supabase (`{ data, error }`),
 * deci înlocuirea e de tip drop-in: handler-ele `if (error)` existente
 * continuă să funcționeze, doar că acum văd și eșecurile tăcute.
 *
 * ⚠️ REGULĂ: apelul trimis lui `writeRows` TREBUIE să conțină `.select(...)`.
 *    Fără el, writeRows raportează un cod 'NO_SELECT' în loc să tacă.
 */

/** Erori sintetizate local (nu vin din Postgres). */
export const NO_ROWS = 'NO_ROWS';
export const NO_SELECT = 'NO_SELECT';

const MESSAGES_BY_CODE = {
    '23505': 'Există deja o înregistare cu aceleași valori unice.',
    '23503': 'Operațiunea nu poate fi făcută: există o legătură către un rând inexistent.',
    '23514': 'Datele nu respectă o regulă de validare a bazei de date.',
    '42501': 'Operațiunea a fost respinsă de permisiunile bazei de date (RLS).',
    '22P02': 'Date invalide: un număr sau o dată nu a putut fi convertit.',
    'PGRST116': 'Rândul nu a fost găsit sau nu este vizibil pentru tine.',
    [NO_ROWS]: 'Niciun rând nu a fost modificat. Posibil să fi fost șters sau blocat de permisiuni.',
    [NO_SELECT]: 'Apel de scriere fără .select() — nu se poate verifica rezultatul.'
};

/**
 * Transformă un obiect error din Supabase/Postgres într-un mesaj
 * potrivit pentru utilizator, în română.
 *
 * @param {object|null} error
 * @param {string} [fallback] mesaj folosit când error e null sau gol
 * @returns {string}
 */
export function describeDbError(error, fallback = 'Operațiunea nu a fost salvată.') {
    if (!error) return fallback;

    const code = error.code || '';
    const message = (error.message || '').trim();

    // Excepții ridicate explicit din plpgsql (de exemplu triggerul
    // anti pierdere a ultimului owner) au mesaj gata de utilizat.
    if (/^P0\d+$/.test(code)) return message || fallback;

    const known = MESSAGES_BY_CODE[code];
    if (known) return known;

    return message || fallback;
}

/**
 * Eroare produsă de o asertare locală asupra numărului de rânduri.
 * Nu ajunge la utilizator direct: writeRows o transformă într-un obiect
 * `{ data, error }` cu același format ca restul apelurilor Supabase.
 */
export class DbWriteError extends Error {
    constructor(message, code, context) {
        super(message);
        this.name = 'DbWriteError';
        this.code = code;
        this.context = context;
    }
}

/**
 * Verifică că răspunsul unei scrieri a atins numărul așteptat de rânduri.
 * Returnează obiectul `data` dacă totul e în regulă, altfel aruncă.
 *
 * @param {Array|null} data
 * @param {number|null} expect numărul exact așteptat; null = nu verifica
 * @param {string} context eticheta operațiunii, ex. 'salvarea membrului'
 * @returns {Array|null} data
 * @throws {DbWriteError}
 */
export function assertRows(data, expect, context = 'operațiunea') {
    if (expect === null || expect === undefined) return data;

    const affected = Array.isArray(data) ? data.length : 0;
    if (affected !== expect) {
        throw new DbWriteError(
            MESSAGES_BY_CODE[NO_ROWS],
            NO_ROWS,
            `${context} (așteptat ${expect}, obținut ${affected})`
        );
    }
    return data;
}

/**
 * Trimite o cerere de scriere și verifică efectul ei real.
 *
 * @param {PromiseLike<object>} request builder PostgREST cu `.select(...)`
 * @param {object}  [options]
 * @param {string}  [options.context] eticheta operațiunii, pentru mesaje
 * @param {number|null} [options.expect] rânduri așteptate; null = verifică doar
 *                                  că s-a scris cel puțin un rând
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function writeRows(request, { context = 'operațiunea', expect = 1 } = {}) {
    let data = null;
    let error = null;

    try {
        const result = await request;
        data = result?.data ?? null;
        error = result?.error ?? null;
    } catch (e) {
        // supabase-js aruncă doar pentru erori de rețea / URL invalid
        error = {
            code: e?.code || 'NETWORK',
            message: e?.message || 'Cererea către baza de date nu a putut fi trimisă.'
        };
    }

    if (error) return { data, error };

    if (data === null) {
        return {
            data,
            error: { code: NO_SELECT, message: MESSAGES_BY_CODE[NO_SELECT], context }
        };
    }

    try {
        assertRows(data, expect, context);
    } catch (e) {
        if (e instanceof DbWriteError) {
            return { data, error: { code: e.code, message: e.message, context: e.context } };
        }
        throw e;
    }

    return { data, error: null };
}