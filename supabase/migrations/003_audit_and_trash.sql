-- ============================================================================
-- Migrare: 003_audit_and_trash.sql
-- Scop: Jurnal de audit în baza de date (audit_log), trigger generic de audit
--       pentru modificările administrative de conținut și protecție RLS.
-- Data: 2026-10-06
-- ============================================================================

-- 1. TABELĂ JURNAL AUDIT (AUDIT_LOG)
create table if not exists public.audit_log (
    id bigserial primary key,
    ts timestamptz not null default now(),
    admin_id uuid default auth.uid(),
    actiune text not null check (actiune in ('INSERT', 'UPDATE', 'DELETE')),
    tabel text not null,
    rand_id text,
    vechi jsonb,
    nou jsonb
);

alter table public.audit_log enable row level security;

-- Doar administratorii autentificați pot citi jurnalul de audit
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log
    for select to authenticated
    using (public.is_admin());

-- Blocare explicită a oricărei scrieri directe (doar trigger-ul SECURITY DEFINER poate scrie)
revoke all on public.audit_log from anon;
revoke insert, update, delete on public.audit_log from authenticated;

-- 2. FUNCȚIE TRIGGER GENERICĂ PENTRU JURNALIZARE MODIFICĂRI
create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.audit_log(actiune, tabel, rand_id, vechi, nou)
    values (
        tg_op,
        tg_table_name,
        coalesce(
            to_jsonb(new)->>'id',
            to_jsonb(old)->>'id',
            to_jsonb(new)->>'cheie',
            to_jsonb(old)->>'cheie'
        ),
        case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
        case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
    );
    return coalesce(new, old);
end;
$$;

-- 3. ATAȘARE TRIGGERI PE TABELELE DE CONȚINUT ȘI ADMINISTRARE

drop trigger if exists audit_membri on public.membri;
create trigger audit_membri
    after insert or update or delete on public.membri
    for each row execute function public.audit_trigger();

drop trigger if exists audit_stiri on public.stiri;
create trigger audit_stiri
    after insert or update or delete on public.stiri
    for each row execute function public.audit_trigger();

drop trigger if exists audit_leadership on public.leadership;
create trigger audit_leadership
    after insert or update or delete on public.leadership
    for each row execute function public.audit_trigger();

drop trigger if exists audit_faq on public.faq;
create trigger audit_faq
    after insert or update or delete on public.faq
    for each row execute function public.audit_trigger();

drop trigger if exists audit_documente on public.documente;
create trigger audit_documente
    after insert or update or delete on public.documente
    for each row execute function public.audit_trigger();

drop trigger if exists audit_setari on public.setari;
create trigger audit_setari
    after insert or update or delete on public.setari
    for each row execute function public.audit_trigger();

drop trigger if exists audit_admini on public.admini;
create trigger audit_admini
    after insert or update or delete on public.admini
    for each row execute function public.audit_trigger();
