import fs from 'fs';

const m002 = fs.readFileSync('supabase/migrations/002_content_tables.sql', 'utf8');
const m003 = fs.readFileSync('supabase/migrations/003_audit_and_trash.sql', 'utf8');
const seed = fs.readFileSync('supabase/seed/seed_from_repo.sql', 'utf8');

const combined = `-- ============================================================================
-- PACHET COMPLET FAZA P3: MIGRAȚII 002 & 003 + POPULARE SEED SUPABASE
-- Data: 2026-10-06
-- ============================================================================

-- >>>>> PARTEA 1: MIGRARE 002 (TABELE CONȚINUT & RLS) <<<<<
${m002}

-- >>>>> PARTEA 2: MIGRARE 003 (JURNAL AUDIT & TRASH) <<<<<
${m003}

-- >>>>> PARTEA 3: POPULARE DATE OFICIALE (SEED DIN REPO) <<<<<
${seed}
`;

fs.writeFileSync('supabase/combined_p3_migration_and_seed.sql', combined, 'utf8');
console.log('Successfully written supabase/combined_p3_migration_and_seed.sql!');
