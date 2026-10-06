-- ============================================================================
-- Migrare: 002_content_tables.sql
-- Scop: Tabele de conținut (setari, leadership, faq, documente),
--       extindere stiri & membri, coloane deleted_at (trash),
--       triggeri updated_at și politici Row Level Security (RLS).
-- Data: 2026-10-06
-- ============================================================================

-- 1. TABELĂ SETĂRI INSTITUȚIONALE (CONFIGURARE GLOBALĂ)
create table if not exists public.setari (
    cheie text primary key,
    valoare jsonb not null,
    descriere text,
    actualizat_la timestamptz not null default now(),
    updated_by uuid default auth.uid()
);

alter table public.setari enable row level security;

-- 2. TABELĂ LEADERSHIP (BIROU EXECUTIV NAȚIONAL & CONDUCERE FILIALĂ SECTOR 1)
create table if not exists public.leadership (
    id uuid primary key default gen_random_uuid(),
    grup text not null check (grup in ('central', 'filiala')),
    nume text not null,
    functie text not null,
    descriere text,
    telefon text,
    email text,
    foto_url text,
    ordine int not null default 0,
    afisare_publica boolean not null default true,
    deleted_at timestamptz,
    updated_at timestamptz not null default now()
);

alter table public.leadership enable row level security;

-- 3. TABELĂ FAQ (ÎNTREBĂRI FRECVENTE & PROTOCOL INSTITUȚIONAL)
create table if not exists public.faq (
    id uuid primary key default gen_random_uuid(),
    categorie text,
    tag text,
    intrebare text not null,
    raspuns text not null,
    ordine int not null default 0,
    publicat boolean not null default true,
    deleted_at timestamptz,
    updated_at timestamptz not null default now()
);

alter table public.faq enable row level security;

-- 4. TABELĂ DOCUMENTE (FORMULARE TIPIZATE, STATUT & CERERI ADEZIUNE)
create table if not exists public.documente (
    id uuid primary key default gen_random_uuid(),
    titlu text not null,
    descriere text,
    tip text,
    badge text,
    fisier_url text not null,
    ordine int not null default 0,
    publicat boolean not null default true,
    deleted_at timestamptz,
    updated_at timestamptz not null default now()
);

alter table public.documente enable row level security;

-- 5. EXTINDERE TABELĂ STIRI (CATEGORIE, SCOPE, LOCAȚIE, BUTON, SLUG, TRASH)
alter table public.stiri
    add column if not exists categorie text default 'Eveniment Oficial',
    add column if not exists scope text default 'local' check (scope in ('local', 'national')),
    add column if not exists locatie text default 'București',
    add column if not exists link_actiune text,
    add column if not exists text_buton text default 'Detalii ↗',
    add column if not exists slug text,
    add column if not exists deleted_at timestamptz;

-- 6. EXTINDERE TABELĂ MEMBRI (FLAG DEMONSTRATIV & TRASH)
alter table public.membri
    add column if not exists demonstrativ boolean not null default false,
    add column if not exists deleted_at timestamptz;

-- Marcare cei 8 membri inițiali ca date demonstrative (conform §10 Q6)
update public.membri
set demonstrativ = true
where id in ('UGR-0012', 'UGR-0038', 'UGR-0145', 'UGR-0220', 'UGR-0312', 'UGR-0402', 'UGR-0589', 'UGR-0614');

-- 7. TRIGGERI PENTRU ACTUALIZARE AUTOMATĂ updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_updated_at_leadership on public.leadership;
create trigger set_updated_at_leadership
    before update on public.leadership
    for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_faq on public.faq;
create trigger set_updated_at_faq
    before update on public.faq
    for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_documente on public.documente;
create trigger set_updated_at_documente
    before update on public.documente
    for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_stiri on public.stiri;
create trigger set_updated_at_stiri
    before update on public.stiri
    for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at_membri on public.membri;
create trigger set_updated_at_membri
    before update on public.membri
    for each row execute function public.handle_updated_at();

-- 8. POLITICI ROW LEVEL SECURITY (RLS) PENTRU TABELELE NOI

-- 8.1 SETĂRI
drop policy if exists setari_citire_anonim on public.setari;
create policy setari_citire_anonim on public.setari
    for select to anon
    using (true);

drop policy if exists setari_citire_admin on public.setari;
create policy setari_citire_admin on public.setari
    for select to authenticated
    using (public.is_admin());

drop policy if exists setari_modificare_admin on public.setari;
create policy setari_modificare_admin on public.setari
    for all to authenticated
    using (public.admin_rol() in ('owner', 'editor'))
    with check (public.admin_rol() in ('owner', 'editor'));

revoke insert, update, delete on public.setari from anon;

-- 8.2 LEADERSHIP
drop policy if exists leadership_citire_anonim on public.leadership;
create policy leadership_citire_anonim on public.leadership
    for select to anon
    using (afisare_publica = true and deleted_at is null);

drop policy if exists leadership_citire_admin on public.leadership;
create policy leadership_citire_admin on public.leadership
    for select to authenticated
    using (public.is_admin());

drop policy if exists leadership_scriere_admin on public.leadership;
create policy leadership_scriere_admin on public.leadership
    for insert to authenticated
    with check (public.admin_rol() in ('owner', 'editor'));

drop policy if exists leadership_actualizare_admin on public.leadership;
create policy leadership_actualizare_admin on public.leadership
    for update to authenticated
    using (public.admin_rol() in ('owner', 'editor'));

drop policy if exists leadership_stergere_admin on public.leadership;
create policy leadership_stergere_admin on public.leadership
    for delete to authenticated
    using (public.admin_rol() = 'owner');

revoke insert, update, delete on public.leadership from anon;

-- 8.3 FAQ
drop policy if exists faq_citire_anonim on public.faq;
create policy faq_citire_anonim on public.faq
    for select to anon
    using (publicat = true and deleted_at is null);

drop policy if exists faq_citire_admin on public.faq;
create policy faq_citire_admin on public.faq
    for select to authenticated
    using (public.is_admin());

drop policy if exists faq_scriere_admin on public.faq;
create policy faq_scriere_admin on public.faq
    for insert to authenticated
    with check (public.admin_rol() in ('owner', 'editor'));

drop policy if exists faq_actualizare_admin on public.faq;
create policy faq_actualizare_admin on public.faq
    for update to authenticated
    using (public.admin_rol() in ('owner', 'editor'));

drop policy if exists faq_stergere_admin on public.faq;
create policy faq_stergere_admin on public.faq
    for delete to authenticated
    using (public.admin_rol() = 'owner');

revoke insert, update, delete on public.faq from anon;

-- 8.4 DOCUMENTE
drop policy if exists documente_citire_anonim on public.documente;
create policy documente_citire_anonim on public.documente
    for select to anon
    using (publicat = true and deleted_at is null);

drop policy if exists documente_citire_admin on public.documente;
create policy documente_citire_admin on public.documente
    for select to authenticated
    using (public.is_admin());

drop policy if exists documente_scriere_admin on public.documente;
create policy documente_scriere_admin on public.documente
    for insert to authenticated
    with check (public.admin_rol() in ('owner', 'editor'));

drop policy if exists documente_actualizare_admin on public.documente;
create policy documente_actualizare_admin on public.documente
    for update to authenticated
    using (public.admin_rol() in ('owner', 'editor'));

drop policy if exists documente_stergere_admin on public.documente;
create policy documente_stergere_admin on public.documente
    for delete to authenticated
    using (public.admin_rol() = 'owner');

revoke insert, update, delete on public.documente from anon;

-- 8.5 ACTUALIZARE POLITICI STIRI & MEMBRI PENTRU SUPORT TRASH (deleted_at is null)
drop policy if exists stiri_citire_anonim on public.stiri;
create policy stiri_citire_anonim on public.stiri
    for select to anon
    using (publicat = true and deleted_at is null);

drop policy if exists membri_citire_anonim on public.membri;
create policy membri_citire_anonim on public.membri
    for select to anon
    using (afisare_publica = true and deleted_at is null);
