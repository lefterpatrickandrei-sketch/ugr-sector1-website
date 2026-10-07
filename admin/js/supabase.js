/**
 * Supabase Client Initialization and Health Check
 */

export const SUPABASE_CONFIG = {
    url: 'https://ckktzvzzklspqfclcsbu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNra3R6dnp6a2xzcHFmY2xjc2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMDEzNjcsImV4cCI6MjEwNjY3NzM2N30.hrmXR_K-o6jWJ-ts-Opds_cGlU_qMamc6nRgAxArQzo'
};

export const SUPABASE_URL = SUPABASE_CONFIG.url;
export const ANON_KEY = SUPABASE_CONFIG.anonKey;

export const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    auth: {
        persistSession: true,
        detectSessionInUrl: true
    }
});

// T-J10: funcția pingSupabaseHealth care era aici a fost eliminată.
// Existau două copii: aceasta și cea din views/telemetry.js. Cea de aici
// primea elementele DOM ca argumente, dar nimeni nu o apela cu argumente
// (toate apelurile vin din telemetry.js și nu trimit nimic), deci nu avea
// efect asupra niciunui element din interfață. În plus, cei doi parametri
// rămâneau la aceleași valori false pe orice eroare de rețea, deci un proiect
// căzut era raportat drept "Operațional". Versiunea din telemetry.js cere
// /auth/v1/health, verifică res.ok și raportează latența măsurată.
