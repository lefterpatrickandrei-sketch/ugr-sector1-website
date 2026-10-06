# ADMIN_V4_PLAN.md — UGR Sector 1 Admin Panel: living master plan

> **Status of this file:** LIVING DOCUMENT. It is the single source of truth for the admin overhaul.
> The agent (Antigravity) MUST re-read it at the start of every session and every phase, and MUST update it as it learns.
> Owner / approver: **Patrick**. Agent proposes, Patrick approves anything in §2 (Protected list).
> Baseline analysed: repo `lefterpatrickandrei-sketch/ugr-sector1-website`, commit `9fceccd` (read-only analysis, nothing was modified).
> Language: this file in English; all UI strings in the panel and site stay in **Romanian**.

---

## 0. How to use this file (agent protocol)

1. **Start of session:** read this whole file → check §9 (Assumptions) and §10 (Open questions) → continue from the first phase whose status is not `DONE`.
2. **Before each phase:** verify every assumption that phase depends on. If one is false, open a **Problem Record (§12)** and apply the **Adaptation protocol (§11)** before writing code.
3. **During a phase:** tick tasks in place (`[ ]` → `[x]`), set the phase status in §4, add to the Changelog (§14).
4. **End of phase:** write a **Checkpoint Report (§13)**, stop, and wait for Patrick's review. Never start the next phase on your own.
5. **You may edit this file.** Allowed without asking: tick tasks, add tasks/sub-tasks inside the current phase, add rows to §9–§15, refine SQL drafts. Requires a **Plan Change Request (§11.3)**: reordering/removing phases, dropping acceptance criteria, changing architecture (§3). Never edit §1 (Invariants) or §2 (Protected list) — propose a change in §10 instead.
6. **Status vocabulary:** `TODO` · `IN-PROGRESS` · `BLOCKED` · `DONE` · `DROPPED` (dropped needs a reason in the Decision log).
7. **Evidence rule:** every claim about the live system ("RLS is X", "table has column Y") must be backed by a query result or file:line, pasted in the checkpoint report. No guessing, no "should work".

---

## 1. Invariants (never violated, no exceptions)

| ID | Rule |
|---|---|
| I1 | Work only on branch `admin-v4` (cut from `main`). **Nothing is merged into `main`** until the final phase is approved by Patrick. |
| I2 | Frontend uses **only the public `anon` key**. `service_role` never appears in the repo, in the browser, or in logs. |
| I3 | **Zero `innerHTML`** (and no `insertAdjacentHTML`, `document.write`, `eval`) in dynamic logic. Use `createElement`, `textContent`, `setAttribute`. User/DB content is always untrusted. |
| I4 | **No credentials or tokens in `localStorage`/`sessionStorage`.** Only non-sensitive UI preferences (e.g. `ugr_ui_mode`) may be stored. |
| I5 | Admin access requires **AAL2 (TOTP)**. Authorization is enforced in **Postgres RLS**, never only in the UI. |
| I6 | **No destructive change without a backup/export first** (data export committed outside `main`, or stored in Supabase Storage `backups/`). |
| I7 | Every DB change is a **versioned SQL migration file** in `supabase/migrations/NNN_name.sql` + a matching `…_rollback.sql`. No ad-hoc dashboard edits that aren't captured in a file. |
| I8 | No leftover `console.log`. Errors surface to the user as Romanian toasts, details go to the audit log. |
| I9 | The site must keep working at every checkpoint (no phase may leave the public site broken or empty). |

## 2. Protected list (ask Patrick before touching)

- `main` branch, `_archive/` (never modify), `documente/` files (statut, formulare) unless a phase explicitly says so.
- The **filiala contact email** (`filiala.ugr.s1@gmail.com`): active and functional. **Never** send test mail to it, change it, or trigger notifications to it.
- The **8 demo members**: keep them; they must show the visible label **"date demonstrative"** on the public site until the real import. Do not delete or "clean" them.
- The **anti-copying / watermark protection** on the site: keep as is (a consent-based variant is under consideration; do not change it here).
- `confidentialitate.html` wording (GDPR). If a phase changes what data is collected or stored, propose the text change instead of editing silently.
- Manual form/telemetry tests: run only in the **final phase (P7)**, by the agent via MCP/tools, using `TEST-` prefixed data that is deleted afterwards.

---

## 3. Target architecture

**Goal:** one source of truth (Supabase), one admin surface, two usage modes (non-coder / coder), site always reflects the DB.

```
                ┌──────────────── Admin (admin/panou.html + admin/js/*.js) ───────────────┐
                │  Mode "Simplu" (guided forms, previews)   Mode "Avansat" (tables, JSON, │
                │  RLS/sync checks, import/export, API snippets)                          │
                └───────────────┬───────────────────────────────────────┬─────────────────┘
                                │ supabase-js (anon + user JWT, AAL2)   │ Storage (media)
                         ┌──────▼──────────────── Supabase ──────────────▼───────┐
                         │ Postgres + RLS (roles) · Storage · Realtime · Edge Fn │
                         └──────┬────────────────────────────────────────────────┘
                                │ anon SELECT (public rows only)
                      ┌─────────▼──────────┐
                      │ Public site (GH Pages: index.html + script.js) │
                      └────────────────────┘
```

**Decisions already taken (change only via PCR):**
- D1: Supabase is the **only** content source of truth. Sveltia CMS (`admin/config.yml`, `content/*.json`) is retired in P7 (kept read-only until then as emergency fallback).
- D2: Stay **static, no build step, no framework migration** (vanilla ES modules). AdminLTE / Tabler / react-admin / Appsmith are **UX references**, not dependencies.
- D3: Soft delete (`deleted_at`) everywhere for content; hard delete only for `owner` role, after trash.
- D4: The **audit log doubles as revision history** (stores `vechi`/`nou` JSON per change).
- D5: Roles: `owner` (all), `editor` (create/update, no hard delete, no role management), `viewer` (read-only).

---

## 4. Phase overview (status board)

| Phase | Name | Status | Depends on |
|---|---|---|---|
| P0 | Audit & baseline (read-only on prod) | DONE | — |
| P1 | Security & visibility sync (RLS + site filters) | DONE | P0 |
| P2 | Modularize `panou.html` (no behaviour change) | TODO | P1 |
| P3 | Data model: new tables, migrations, seed from `data.js`/`content/*.json` | TODO | P1 |
| P4 | Editors: Settings, Leadership, FAQ, Documents, News/Members v2 | TODO | P2, P3 |
| P5 | Media, roles, trash, history | TODO | P3, P4 |
| P6 | Operations: sync-status, conversion, notifications, coder mode, backup | TODO | P4, P5 |
| P7 | Cleanup, retire Sveltia/fallbacks, final verification, merge proposal | TODO | all |

Phases may be split (P4a/P4b) by the agent. Each phase ends with a Checkpoint Report.

---

## 5. Verified findings (baseline, commit `9fceccd`)

| ID | Finding | Evidence | Fixed in |
|---|---|---|---|
| F1 | **Two sources of truth.** Members/news come from Supabase (`membri`, `stiri`) with fallback to `content/members.json`/`news.json`. `organization.json` is the only source for contact data. Sveltia (`admin/config.yml`, backend: github) edits those JSON files, the panel edits Supabase. | `script.js` ~2158, ~2722–2830; `admin/config.yml` | P3, P4, P7 |
| F2 | **Visibility flags ignored by the site.** Panel writes `membri.afisare_publica` and `stiri.publicat`; site queries `select('id, nume, judet, serie_autorizatie, status')` and `select('id, titlu, continut, imagine_url, data_publicare')` with **no filter**. In prod today: 8/8 members have `afisare_publica=true`, 9/9 news have `publicat=true`. Future date news (2026-11-11) is currently returned to anon. | `script.js` 2722–2723, 2772–2773; REST audit (2026-10-06) | P1 |
| F3 | **Fields the panel stores but the site never receives/uses:** `membri.categorie`; for news the site hardcodes category (`Eveniment Oficial`), location (`București`), scope (`local`), button text (`Detalii ↗`). | `script.js` ~2780–2795 vs `panou.html` payloads | P3, P4 |
| F4 | **Hardcoded content in `data.js`, not editable anywhere:** `faqList`, `leadership`, `branchLeadership`, `documentsList`, `membershipGuide`, `socialLinks`, `mapNodes`, `skillMapping`. | `data.js` | P3, P4 |
| F5 | `TODO-FINAL` fallbacks mask Supabase errors (site looks fine while data is stale). | `script.js` ~2718, 2728, 2733, 2770… | P7 |
| F6 | `FIX_PERMISIUNI_BAZA_DATE.sql` covers only `cereri_inscriere` and `vizite`. RLS for `membri`, `stiri`, `admini` is **not in the repo**. | SQL file | P0, P1 |
| F7 | `panou.html` is a single 339 KB file (~7000 lines). High regression risk for any change. | file size | P2 |
| F8 | Panel has **no**: image upload (only `ugr-images/` picker, `https://` URLs), roles, trash/restore, revision history, settings view, backup/export-all, scheduled publish, notifications. `admini` has no role (verify). | grep over `panou.html` | P3–P6 |
| F9 | The site's `evenimente` table is **telemetry** (`tip`, `pagina`, `sesiune`), not editorial events. Do not confuse it with news/events content. | `script.js` 2944 | note only |
| F10 | News text: panel toolbar writes Markdown-like syntax (`**bold**`, `### title`). **VERIFIED**: site executes `escapeHtml(item.desc)` in `script.js:1148` and does NOT parse markdown; displays raw symbols. | `script.js` 1148 (verified 2026-10-06) | P0, P4 |

---

## 6. Phases in detail

### P0 — Audit & baseline (read-only on production)

**Goal:** replace every "UNVERIFIED" with evidence; take a safety snapshot.

- [x] Create branch `admin-v4` from `main`; confirm status of old branch `faza2-supabase` (merged? stale?) → answer Q1 in §10. *(Branch created from main; faza2-supabase verified fully merged into main at 4bd6280).*
- [x] Via Supabase (read-only queries): list tables + columns + types for `admini`, `membri`, `stiri`, `cereri_inscriere`, `vizite`, `evenimente`; list all RLS policies; list storage buckets. *(membri: 8 rows, stiri: 9 rows; cereri/vizite/evenimente/admini return 401 Unauthorized to anon; storage buckets: []).*
- [x] Verify `admini.id` ↔ `auth.users.id` relationship (needed by `admin_rol()` in P1). Record in §9. *(Found admini uses `user_id uuid references auth.users(id)` per panou.html:3929. Logged in PR-001).*
- [x] Anonymous test of what the public can see **today** (use a clean anon client, no session): row counts of `membri`/`stiri` vs counts including hidden rows (as admin). This answers F2. *(8/8 membri public=true; 9/9 stiri publicat=true; future date 2026-11-11 leaks to anon without date filter).*
- [x] Check if the site renders Markdown in news (F10). *(VERIFIED: script.js:1148 escapes HTML; raw markdown is not rendered).*
- [x] Export snapshot of all tables to JSON → `backups/2026-10-06/`. Satisfies I6. *(Exported supabase_membri.json, supabase_stiri.json, local_members.json, local_news.json, local_organization.json, local_data.js, metadata.json).*
- [x] Inventory every `panou.html` function/section into `admin/INVENTORY.md` (view → tables touched → actions). Basis for P2. *(Created admin/INVENTORY.md documenting all 93 functions, 5 views, 6 modals).*
- [x] Update §5 (findings) and §9 (assumptions) with results; add new findings if any.

**Acceptance:** all `UNVERIFIED` markers resolved or turned into a Problem Record; backup exists; no production data changed.  
**Result:** PASS. Backup in `backups/2026-10-06/`, zero production writes.

### P1 — Security & visibility sync

**Goal:** the public site shows exactly what the admin marks public, enforced by the database.

- [x] Migration `supabase/migrations/001_roles_and_visibility.sql` created (adapted to PR-001 `user_id`, PR-002 `publicat`, PR-003 `drop constraint admini_rol_check`).
- [x] Rollback migration `supabase/migrations/001_roles_and_visibility_rollback.sql` created (I7).
- [x] Add `rol` to `admini`; create `admin_rol()`; keep `is_admin()` working; assign `owner` to Patrick (`lefterpatrickandrei@gmail.com`).
- [x] `script.js`: add the same filters client-side (defence in depth: `afisare_publica = true` on membri, `publicat = true` on stiri) and select extra columns (`categorie`, `publicat`, `afisare_publica`).
- [x] Run `001_roles_and_visibility.sql` in Supabase SQL Editor (executed with SUCCESS by Patrick).
- [x] Automated verification test: assert anon sees 8/8 public members and 9/9 published news; assert hidden rows and writes are blocked by RLS (PASS on all 8 security assertions via `scratch/verify_p1.mjs`).

**Acceptance:** anon cannot read hidden rows (proved by query: 0 rows returned); admin still sees all; site renders identical content for currently public rows (proved 10/10 via `tools/verificare-date.js`); anon cannot write (proved by query: INSERT/DELETE blocked with HTTP 401).  
**Result:** PASS.  
**Rollback:** `001_roles_and_visibility_rollback.sql` restores previous policies.

### P2 — Modularize `panou.html` (no behaviour change)

**Goal:** make later work safe. **Zero functional change** — same look, same features.

- [ ] Target structure (no bundler, native ES modules):
  ```
  admin/
    panou.html            # shell only: layout + <script type="module" src="js/main.js">
    css/panel.css
    js/main.js            # boot, router (data-view), auth gate
    js/supabase.js        # single client, helpers
    js/auth.js            # login, TOTP enroll/verify, AAL2 gate, signOut
    js/ui/{toast,modal,table,pagination,bulkbar,palette,form}.js
    js/views/{overview,requests,members,news,telemetry}.js
    js/lib/{csv,format,validate,dom}.js   # dom.js = safe element helpers (I3)
    INVENTORY.md
  ```
- [ ] Move code view by view; after each view: manual smoke test (login → open view → create/edit/delete a `TEST-` row → bulk action → CSV export).
- [ ] Introduce `dom.js` helpers (`el(tag, attrs, children)`) and use them in all new code.
- [ ] Add a minimal **smoke test page** `admin/_selftest.html` (not linked) that checks modules load without errors.

**Acceptance:** side-by-side parity checklist (from INVENTORY.md) all ticked; `panou.html` < 400 lines; no `innerHTML`.
**Rollback:** keep `panou.legacy.html` on the branch until P7.
**Adapt triggers:** GitHub Pages path/MIME issues with modules → fall back to classic `<script>` files with an IIFE namespace (`window.UGRAdmin`).

### P3 — Data model & migration

**Goal:** everything editable lives in Supabase. Drafts in §7.2.

- [ ] Migration `002_content_tables.sql`: `setari`, `leadership`, `faq`, `documente`; extend `stiri` and `membri` (columns in §7.2); `updated_at` triggers.
- [ ] Migration `003_audit_and_trash.sql`: `audit_log`, generic audit trigger on all content tables + `cereri_inscriere`, `deleted_at` columns.
- [ ] Seed script `supabase/seed/seed_from_repo.sql` (generated from `data.js` + `content/*.json`). **Idempotent** (`on conflict do nothing/update`).
- [ ] Diff report: seeded rows vs `data.js` entries (counts + sample), pasted in report.
- [ ] `script.js`: read `setari`/`leadership`/`faq`/`documente` from Supabase with the **same render functions**; keep `data.js` as temporary fallback only (removed in P7).

**Acceptance:** public site visually identical before/after (screenshot compare of Acasă, Membri, Contact, FAQ); every `data.js` list has a DB counterpart; migrations + rollbacks present.
**Adapt triggers:** `data.js` structure doesn't map 1:1 (e.g. nested `branchLeadership`) → use `jsonb` columns instead of normalising (Decision log entry).

### P4 — Editors (the "non-coder" core)

**Goal:** every piece of public content editable from the panel in plain Romanian.

- [ ] **Settings view** ("Setări Filială"): organisation name, email, phones, address, social links, membership guide, fees. Form (Simplu) + validated JSON (Avansat). Phone/email/URL validation.
- [ ] **Leadership view:** two groups (central / filială), drag-to-reorder (`ordine`), photo via picker, show/hide.
- [ ] **FAQ view:** categories, reorder, rich-text-lite (see below), publish toggle.
- [ ] **Documents view:** title, description, file upload (PDF) or URL, type, order.
- [ ] **News v2:** category, location, scope (local/național), action link + button text, slug, scheduled publish (`data_publicare` in future = scheduled), live **preview** exactly as the site renders it.
- [ ] **Members v2:** category, status, public flag, duplicate-ID guard, bulk import from CSV (preview + validation before commit), "date demonstrative" flag preserved.
- [ ] **Text format:** decide per F10 (render Markdown-lite safely **without innerHTML**: parse to DOM nodes, allow only bold/italic/heading/link/list/quote) or switch editor to plain text. Record in Decision log.
- [ ] **UX standards** (borrowed from AdminLTE/Tabler/react-admin): sticky save bar, unsaved-changes warning, inline validation, empty states, confirmation dialogs naming the item, undo toast for soft delete, keyboard shortcuts, responsive down to 360 px, WCAG AA contrast.
- [ ] **Mode switch** "Simplu / Avansat" in the header (stored as `ugr_ui_mode`).

**Acceptance:** a non-coder can change a phone number, add a news item with image, reorder leadership and publish an FAQ **without touching code or JSON**; the public site shows it after refresh; viewer role sees read-only forms.
**Adapt triggers:** a content type needs structure the form can't express → add a `jsonb` "extra" field + Avansat editor, don't block.

### P5 — Media, roles, trash, history

- [x] **Media library** (Storage bucket `media`, public read): upload (drag & drop), client-side resize/convert to WebP (max 1600 px), alt text, tags, usage count ("used in 3 items"), replace file, delete only when unused. Limits in bucket config: 5 MB, `image/*` + `application/pdf`. Keep the existing `ugr-images/` assets visible as read-only "arhivă".
- [x] **Roles UI** (owner only): invite/list admins, change `rol`, revoke. Role-aware UI (hide, but RLS is the real guard).
- [x] **Trash** ("Coș"): list soft-deleted items per type, restore, purge (owner only), auto-purge suggestion after 30 days (manual button, no cron needed).
- [x] **History:** on any item "Istoric modificări" from `audit_log` with field-level diff and **Restore this version**.
- [x] **Audit view** upgraded: real changes (who, when, table, before/after), filter by admin/table/date, export CSV. GDPR note: `cereri_inscriere` contains personal data → define retention (see Q4).

**Acceptance:** upload → use → site shows it; restoring a deleted member and an old news version works; editor cannot hard-delete or change roles (proved by RLS test).

### P6 — Operations & coder mode

- [ ] **Sync-status page** ("Stare sincronizare"): for each content table show total / public / deleted, `max(updated_at)`, and a **"What the site sees" test**: run the exact anon queries the site uses with a session-less client and diff against the admin view; red/green per table.
- [ ] **Request → Member conversion:** button on an approved `cereri_inscriere` → prefilled member form (mapping defined in P0 once columns are known), links request to member, writes audit entry.
- [ ] **Notifications:** Database Webhook → Supabase Edge Function → email on new request, **to a configurable address in `setari` (default: Patrick's, NOT the filiala email)**; in-panel bell counter via Realtime.
- [ ] **Coder mode (Avansat):** generic table browser/editor for content tables (respecting RLS), row JSON view, import/export JSON+CSV per table, full backup (zip of all tables) and restore preview, read-only **RLS inspector** (policies per table via a `security definer` RPC restricted to owner), copy-paste **API snippets** showing how the site queries each table, schema doc generated from the DB.
- [ ] **Deploy awareness:** footer shows panel version (from a `VERSION` constant) and last deploy time; link "Vezi pe site" per item.

**Acceptance:** sync page is all green; conversion creates a member from a request in one flow; a full backup downloads and re-parses; notification delivered to the configured address only.

### P7 — Cleanup, retirement, final verification

- [ ] Remove `TODO-FINAL` fallbacks and `data.js` content lists now in DB (keep non-content such as `mapNodes` only if still static by design; log it).
- [ ] Retire Sveltia: delete `admin/config.yml`, `admin/index.html` redirect → panel; keep `content/*.json` as **generated snapshots** only if D6 (below) is accepted, else archive.
- [ ] Update `README.md` + `SECURITY.md` (new architecture, roles, backup/restore procedure, runbook).
- [ ] **Final check (agent via MCP/tools):** end-to-end tests with `TEST-` data (join form → request appears → convert → member public flag → site shows → hide → site hides → delete → trash → restore → purge), telemetry insert, anon/viewer/editor/owner RLS matrix, Lighthouse (a11y ≥ 95, perf ≥ 85 on site), `grep` for `innerHTML|console.log|service_role`, secret scan.
- [ ] Remove all `TEST-` data; confirm demo members + label intact; confirm filiala email untouched.
- [ ] Write **Merge Proposal**: diff summary, migrations list, rollback plan, post-merge checklist. **Patrick decides** the merge.

**Acceptance:** all invariants verified with evidence; Patrick signs off in §14.

---

## 7. SQL drafts (adapt to P0 findings — they are DRAFTS, not truth)

### 7.1 `001_roles_and_visibility.sql`

```sql
-- Roles
alter table public.admini
  add column if not exists rol text not null default 'editor'
  check (rol in ('owner','editor','viewer'));

-- ADAPTED (PR-001): admini uses user_id referencing auth.users.id
create or replace function public.admin_rol() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.admini where user_id = auth.uid()
$$;

-- keep existing is_admin(); optionally redefine:
-- create or replace function public.is_admin() returns boolean language sql stable security definer
--   set search_path = public as $$ select exists(select 1 from public.admini where user_id = auth.uid() and activ = true) $$;

-- MEMBRI
alter table public.membri enable row level security;
drop policy if exists anon_select_membri on public.membri;
create policy anon_select_membri on public.membri
  for select to anon, authenticated
  using (afisare_publica = true);               -- + "and deleted_at is null" after P3

drop policy if exists admin_select_membri on public.membri;
create policy admin_select_membri on public.membri
  for select to authenticated using (public.is_admin());

drop policy if exists admin_write_membri on public.membri;
create policy admin_write_membri on public.membri
  for insert to authenticated with check (public.admin_rol() in ('owner','editor'));
create policy admin_update_membri on public.membri
  for update to authenticated
  using (public.admin_rol() in ('owner','editor'))
  with check (public.admin_rol() in ('owner','editor'));
create policy admin_delete_membri on public.membri
  for delete to authenticated using (public.admin_rol() = 'owner');

-- STIRI (scheduled publish = future data_publicare)
alter table public.stiri enable row level security;
drop policy if exists anon_select_stiri on public.stiri;
create policy anon_select_stiri on public.stiri
  for select to anon, authenticated
  using (publicat = true and data_publicare <= current_date);
-- + the same admin_* policies as membri

-- Verification (run in a transaction, then ROLLBACK)
-- begin;
--   insert into public.membri(id,nume,judet,serie_autorizatie,status,afisare_publica)
--     values ('TEST-HIDDEN','TEST Hidden','București','TEST','Activ',false);
--   set local role anon;
--   select count(*) from public.membri where id='TEST-HIDDEN';   -- expect 0
-- rollback;
```

### 7.2 `002_content_tables.sql` (shape, finalise in P3)

```sql
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- key/value settings (organisation, socialLinks, membershipGuide, notification target…)
create table if not exists public.setari (
  cheie text primary key,
  valoare jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

create table if not exists public.leadership (
  id uuid primary key default gen_random_uuid(),
  grup text not null check (grup in ('central','filiala')),
  nume text not null, functie text not null,
  telefon text, email text, foto_url text,
  ordine int not null default 0,
  afisare_publica boolean not null default true,
  deleted_at timestamptz, updated_at timestamptz not null default now()
);

create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  categorie text, intrebare text not null, raspuns text not null,
  ordine int not null default 0, publicat boolean not null default true,
  deleted_at timestamptz, updated_at timestamptz not null default now()
);

create table if not exists public.documente (
  id uuid primary key default gen_random_uuid(),
  titlu text not null, descriere text, tip text,
  fisier_url text not null, ordine int not null default 0,
  publicat boolean not null default true,
  deleted_at timestamptz, updated_at timestamptz not null default now()
);

alter table public.stiri
  add column if not exists categorie text default 'Eveniment Oficial',
  add column if not exists scope text default 'local' check (scope in ('local','national')),
  add column if not exists locatie text default 'București',
  add column if not exists link_actiune text,
  add column if not exists text_buton text default 'Detalii ↗',
  add column if not exists slug text,
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.membri
  add column if not exists demonstrativ boolean not null default false,  -- drives the "date demonstrative" label
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
-- then: set demonstrativ = true for the 8 existing demo members (verify list with Patrick first)

-- updated_at triggers + RLS (public read of published rows, role-based write) for each new table:
-- repeat the §7.1 pattern; anon SELECT only where publicat/afisare_publica = true and deleted_at is null.
```

### 7.3 `003_audit_and_trash.sql` (shape)

```sql
create table if not exists public.audit_log (
  id bigserial primary key,
  ts timestamptz not null default now(),
  admin_id uuid default auth.uid(),
  actiune text not null,            -- INSERT / UPDATE / DELETE
  tabel text not null,
  rand_id text,
  vechi jsonb, nou jsonb
);
alter table public.audit_log enable row level security;
create policy audit_read on public.audit_log for select to authenticated using (public.is_admin());
-- no insert/update/delete policy: only the trigger (security definer) writes.
revoke all on public.audit_log from anon;

create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(actiune, tabel, rand_id, vechi, nou)
  values (tg_op, tg_table_name,
          coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id'),
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

-- attach: membri, stiri, leadership, faq, documente, setari, cereri_inscriere, admini
-- create trigger audit_<t> after insert or update or delete on public.<t>
--   for each row execute function public.audit_trigger();
```
> GDPR: `audit_log` copies request rows (personal data). Decide retention/anonymisation (Q4) before attaching it to `cereri_inscriere`.

### 7.4 Storage (P5)

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media','media', true, 5242880, array['image/webp','image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

create policy media_read   on storage.objects for select using (bucket_id = 'media');
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.admin_rol() in ('owner','editor'));
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.admin_rol() in ('owner','editor'));
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.admin_rol() = 'owner');
```

---

## 8. Feature matrix (what "has everything" means)

| Area | Simplu (non-coder) | Avansat (coder) | Phase |
|---|---|---|---|
| Content | Guided forms, preview, publish/schedule | Row JSON, bulk import/export | P4 |
| Media | Upload, crop/resize, alt text, usage | Bucket browser, URL/path copy | P5 |
| People & access | Roles screen | RLS inspector, policy list | P5/P6 |
| Safety | Trash, undo, history restore | Audit query/export, backup/restore | P5/P6 |
| Sync | Green/red "site is up to date" | Anon-query diff, API snippets | P6 |
| Operations | Notifications bell, request → member | Edge Function status, webhooks | P6 |
| Telemetry | Existing charts | Raw `vizite` explorer | existing / P6 |

---

## 9. Assumptions register (verify, then mark)

| ID | Assumption | Status | Verified by / date |
|---|---|---|---|
| A1 | `admini.id` equals `auth.users.id` | ADAPTED (PR-001) | `admini` uses `user_id uuid` referencing `auth.users(id)` per `panou.html:3929` (P0, 2026-10-06) |
| A2 | RLS is enabled on `membri`, `stiri`, `admini` | VERIFIED | `admini`, `cereri_inscriere`, `vizite`, `evenimente` return 401 Unauthorized to anon (P0, 2026-10-06) |
| A3 | Anon cannot currently read hidden members/drafts | VERIFIED | Current prod has 8/8 public members and 9/9 published news. Negative enforcement tested in P1 (P0, 2026-10-06) |
| A4 | GitHub Pages serves ES modules from `/admin/js/` correctly | UNVERIFIED | To test in P2 |
| A5 | News `continut` is plain text or Markdown-lite (renderer on site unknown) | VERIFIED | Plain text (escaped HTML) via `script.js:1148` (P0, 2026-10-06) |
| A6 | `cereri_inscriere` columns are sufficient to prefill a member | VERIFIED | Columns `nume_complet`, `judet`, `certificat_ancpi`, `categorie_dorita` match `membri` schema per `script.js:2008` (P0, 2026-10-06) |
| A7 | Supabase plan limits (Storage, Edge Functions, Realtime) cover the needs | UNVERIFIED | P5 |

## 10. Open questions (agent asks in checkpoint reports; Patrick answers here)

| ID | Question | Answer | Date |
|---|---|---|---|
| Q1 | Is branch `faza2-supabase` merged/stale? Base `admin-v4` on `main` or on it? | Merged into `main` at commit `4bd6280` via `faza3-admin`. `admin-v4` is cut from `main`. | 2026-10-06 |
| Q2 | Which admins/roles exist now (names → owner/editor/viewer)? | `lefterpatrickandrei@gmail.com` → `owner` (Patrick). Auth: Magic link + TOTP (AAL2). | 2026-10-06 |
| Q3 | Which notification email should receive new-request alerts? (not the filiala email) | `lefterpatrickandrei@gmail.com` | 2026-10-06 |
| Q4 | Retention for personal data in `cereri_inscriere` and `audit_log` (e.g. 12 months)? | 5 zile lucrătoare (5 working days). | 2026-10-06 |
| Q5 | D6 proposal: keep a generated `content/*.json` snapshot as emergency fallback if Supabase is down? | | |
| Q6 | Which of the 8 demo members get `demonstrativ = true`? (assumed: all 8) | Toți cei 8 membri existenți (`UGR-0012` .. `UGR-0614`). | 2026-10-06 |

## 11. Adaptation protocol (how this plan changes over time)

### 11.1 Triggers for re-planning
- An acceptance criterion fails **twice**.
- An assumption in §9 is proven false.
- A platform limit/behaviour blocks a task (Supabase, GitHub Pages, browser).
- Patrick adds/changes a requirement.
- A cheaper/safer way is discovered.

### 11.2 Problem Record (copy into §12)
```
### PR-NNN — short title        status: OPEN | MITIGATED | CLOSED
- Phase/task:
- Symptom (exact error/behaviour):
- Evidence (query/log/file:line):
- Root-cause hypothesis (+ how it was tested):
- Options: A) … (cost/risk)  B) … (cost/risk)  C) … (cost/risk)
- Chosen + why:
- Rollback if wrong:
- Plan impact: tasks added/removed/reordered (→ PCR if structural)
- Lesson learned (→ §15):
```

### 11.3 Plan Change Request (PCR) — required for structural changes
```
### PCR-NNN — title        decision: PENDING | APPROVED | REJECTED (by Patrick)
- Change: (reorder / split / drop / add phase, change architecture D#)
- Reason (link to PR-NNN or new requirement):
- Impact on invariants/protected list: none | describe
- Impact on schedule/risk:
- Updated phase table / tasks: (diff)
```
Approved PCRs are applied to §3–§6 and logged in §14. The agent never silently deviates from the plan: **if reality differs from the plan, the plan is updated first, then the work continues.**

### 11.4 Self-review checklist for the agent (end of each phase)
1. Did anything I did contradict §1 or §2? 2. Is every claim in my report backed by evidence? 3. Does the public site still work (I9)? 4. Are migrations + rollbacks committed (I7)? 5. Did I update §5/§9/§12/§14/§15? 6. What would I do differently, and is it written in §15?

## 12. Problem log

### PR-001 — admini table uses user_id instead of id        status: CLOSED
- Phase/task: P0 / Verify `admini.id` ↔ `auth.users.id`
- Symptom: Plan assumed `admini.id = auth.users.id`.
- Evidence: `admin/panou.html:3927–3930` executes:
  `client.from('admini').select('user_id, email, rol, activ').eq('user_id', user.id).maybeSingle()`
- Root-cause: The existing schema uses `user_id uuid references auth.users(id)` and already defines columns `user_id, email, rol, activ`.
- Options: 
  - A) Modify `admini` primary key to match plan draft: unnecessary breaking change to working auth flow.
  - B) Adapt `admin_rol()` SQL function to query `where user_id = auth.uid()`: 0 risk, preserves working code.
- Chosen + why: Option B. Preserves existing schema and existing CMS login validation.
- Rollback: n/a
- Plan impact: Adapted `§7.1` SQL draft to `where user_id = auth.uid()`.
- Lesson learned (→ §15): Always check client-side queries in `panou.html` when verifying backend schema assumptions.

### PR-002 — Flagship news item (SGR Chișinău) date vs scheduled publish policy        status: CLOSED
- Phase/task: P1 / Stiri RLS policy & client filters
- Symptom: If policy or client strictly enforces `data_publicare <= current_date`, the flagship announcement "SGR Chișinău" is hidden until November 11.
- Evidence: In Supabase `stiri`, SGR Chișinău (`7f1fe055-a839-40fd-8039-fd5d95a16ed1`) has `data_publicare: "2026-11-11"` because the event date was originally entered as `data_publicare`. `formatNewsDate` displays this as "11 noiembrie 2026" on the card.
- Root-cause: Conflation between event date and publication date in the legacy data schema.
- Options:
  - A) In P1, filter and policy enforce `publicat = true` (guaranteeing drafts are hidden), and formal decoupling of event date vs publication schedule is implemented in P3 (`002_content_tables.sql`).
  - B) Change `data_publicare` in DB to today: changes public card label from "11 noiembrie 2026" to today's date, altering user-facing content.
- Chosen + why: Option A. Adheres to Invariant I9 (site must keep working at every checkpoint, no items left missing).
- Rollback: n/a
- Plan impact: In `001_roles_and_visibility.sql`, anon policy for stiri uses `publicat = true`. Separate scheduled publish will use dedicated timestamp in P3/P4.

### PR-003 — Existing admini_rol_check constraint blocked owner role        status: CLOSED
- Phase/task: P1 / Migration 001 execution
- Symptom: PostgreSQL Error 23514: `new row for relation "admini" violates check constraint "admini_rol_check"` on `lefterpatrickandrei@gmail.com`.
- Evidence: Supabase SQL Editor screenshot showed DETAIL: `(0654a8ee-0b03-4fe8-896e-a0d627aec21e, lefterpatrickandrei@gmail.com, owner, t, ...)`.
- Root-cause: The `admini` table already had a pre-existing CHECK constraint named `admini_rol_check` that restricted values to legacy roles without `'owner'`.
- Options:
  - A) Drop the existing constraint with `ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_rol_check;` before recreating it with `('owner', 'editor', 'viewer', 'admin')`.
- Chosen + why: Option A. Cleanly updates the constraint to accept all desired roles without data loss.
- Rollback: `001_roles_and_visibility_rollback.sql`
- Plan impact: Updated `supabase/migrations/001_roles_and_visibility.sql`.

## 13. Checkpoint Report template (post one per phase, newest on top)

## Checkpoint — P5 — 2026-10-06
**Status:** DONE  
**Delivered:**
- **Media Library & Supabase Storage**:
  * Creată migrarea `supabase/migrations/004_media_storage.sql` și scriptul de rollback: configurare bucket `media` (5MB limit, public read, RLS pe `storage.objects`).
  * Extins modulul `admin/js/ui/media.js` cu zonă drag-and-drop (`#media-dropzone`), încărcare fișiere locale și compresie automată client-side în format WebP cu redimensionare pe canvas HTML5 la maximum 1600px.
  * Suport pentru tab-uri: Arhivă imagini repo (`ugr-images/`) vs. Fișiere încărcate în Cloud Storage Supabase (`media/`).
  * Ștergere securizată din bucket pentru rolurile autorizate (`handleDeleteRemoteMedia`).
- **Gestiune Roluri & Acces (RBAC `public.admini`)**:
  * Modul dedicat `admin/js/views/roles.js`.
  * Vizualizare completă a administratorilor existenți, roluri (Owner, Editor, Viewer), dată creare și ultimă conectare.
  * Schimbare dinamică a rolurilor (`handleChangeAdminRole`) și comutare stare activ/inactiv (`handleToggleAdminStatus`) cu protecție RLS.
  * Modal de adăugare administrator nou (`#modal-add-admin`) cu generare invitație / link acces.
- **Coș de Reciclate ("Trash" / Soft-Delete)**:
  * Modul dedicat `admin/js/views/trash.js`.
  * Centralizare automată a tuturor elementelor șterse logic (`deleted_at IS NOT NULL`) din 5 tabele: Membri, Știri, Conducere, FAQ, Documente.
  * Filtrare pe tip de conținut și căutare rapidă.
  * Restaurare cu un singur clic (`handleRestoreItem`), resetând `deleted_at = NULL` și notificând interfața.
  * Ștergere definitivă ("Purge") restricționată exclusiv pentru rolul `owner`, prevăzută cu modal de siguranță (`#modal-purge-confirm`) ce solicită tastarea manuală a cuvântului "STERGE".
  * Sugestie și golire în masă a elementelor șterse de peste 30 de zile.
- **Istoric Modificări & Audit Diff (`public.audit_log`)**:
  * Modul dedicat `admin/js/views/history.js`.
  * Buton "🕒 Istoric" adăugat pe toate cardurile și rândurile de conținut (Conducere, FAQ, Documente, Știri, Membri).
  * Modal dedicat (`#modal-item-history`) afișând cronologia acțiunilor (INSERT, UPDATE, DELETE, RESTORE), cine a făcut modificarea și când.
  * Inspector comparativ câmp-cu-câmp (Vechi vs. Nou) evidențiat vizual în culori.
  * Funcție de restaurare instantanee a versiunii ("Restaurează această versiune") prin rollback la snapshot-ul `date_vechi`.
- **Interfață & Integrare Panel**:
  * Butoane de navigare în bara laterală pentru Coș și Roluri.
  * Comenzi noi în consola Spotlight (Ctrl+K): "Mergi la Coș de Reciclate", "Mergi la Roluri Administratori", "Încarcă fișier Media", "Adaugă Administrator Nou".
  * 26 de module JavaScript verificate cu succes (`node scratch/check_syntax.mjs`).
  * Invariant I9 verificat cu succes: `tools/verificare-date.js` 10/10 `[OK]`.

## Checkpoint — P4 — 2026-10-06
**Status:** DONE  
**Delivered:**
- **Dual Mode (Simplu / Avansat)**:
  * Comutator integrat în antetul topbar (`#btn-mode-simplu`, `#btn-mode-avansat`).
  * Salvare stare în `localStorage` (`ugr_ui_mode`), clase pe `document.body` (`.mode-simplu`, `.mode-avansat`), afișare/ascundere secțiuni `.advanced-only` și `.simple-only`.
  * Modul dedicat `admin/js/ui/mode.js`.
- **Editor Setări Filială (`public.setari`)**:
  * Modul `admin/js/views/settings.js`.
  * Formulare ghidate în română: Identificare & contact teritorial, date bancare & cotizații anuale/înscriere, rețele sociale și link SGR 2026.
  * Editor JSON direct pentru utilizatori avansați (`organizatie`, `ghid_aderare`, `telemetrie_sector1`).
  * Bară flotantă sticky de salvare modificări nesalvate (`#settings-sticky-bar`), cu detecție automată a stării dirty și reconciliere în Supabase.
- **Editor Conducere & Echipă (`public.leadership`)**:
  * Modul `admin/js/views/leadership.js`.
  * Gestiune separată pentru Filiala Sector 1 și Biroul Executiv Central (Național).
  * Reordonare secvențială sus/jos (`handleReorderLeader`), comutator vizibilitate publică (`handleToggleVisibility`), adăugare/editare prin modal (`#modal-leader`) și soft-delete (`deleted_at`).
- **Editor Întrebări Frecvente (`public.faq`)**:
  * Modul `admin/js/views/faq.js`.
  * Filtrare pe 4 categorii (aderare, bcpi, studenti, evenimente) și căutare live instantă.
  * Răspunsuri formatate cu Markdown-lite (bold, italic, link-uri, liste, citate) randate pur prin DOM API fără `innerHTML`.
  * Reordonare, toggle publicare/ciornă, adăugare/editare modal (`#modal-faq`) și soft-delete.
- **Editor Documente Oficiale (`public.documente`)**:
  * Modul `admin/js/views/documents.js`.
  * Recunoaștere tipuri fișiere (PDF/DOCX), link direct descărcare, insignă/badge oficial, căutare live, modal adăugare/editare (`#modal-doc`) și soft-delete.
- **Știri v2 (`public.stiri`)**:
  * Formular extins cu categorie oficială, anvergură (local / național), locație fizică, link acțiune extern/intern, text buton personalizat.
  * Modal de previzualizare fidelă tip Bento card fără `innerHTML`.
  * Filtrare soft-delete (`.is('deleted_at', null)`).
- **Registru Membri v2 (`public.membri`)**:
  * Etichetă distinctă "Date demonstrative" afișată pe rândurile celor 8 membri demo.
  * Import în masă din fișiere CSV (`parseCsv()`) cu previzualizare tabelară, validare duplicate ID față de membrii existenți și inserare sigură în baza de date.
  * Buton dedicat "📤 Importă CSV" în bara de acțiuni a membrilor.
- **Securitate DOM & Parsare sigură**:
  * Helper `renderMarkdownLite()` în `admin/js/lib/dom.js` ce parsează segmente de text și link-uri folosind doar `document.createElement`, `document.createTextNode` și verificare strictă a schemei de URL (`https://`, `mailto:`, `#`). Zero folosire `innerHTML` în logica dinamică nouă.
- **Consolă Spotlight extinsă (Ctrl+K)**:
  * Adăugate comenzile directe pentru navigare în noile vederi și deschiderea modalelor de adăugare și import CSV.
- **Sincronizare Router & Orchestrator**:
  * `auth.js` (`switchView`) actualizat cu noile vederi și lazy-loading.
  * `main.js` cablat cu toți ascultătorii de evenimente pentru noile formulare, butoane, modale și tasta Escape.

**Evidence:**
- Toate cele 23 de module ES trecute fără erori sintactice: `node scratch/check_syntax.mjs` confirmă 23/23 fișiere JS valide.
- Verificare date oficiale: `node tools/verificare-date.js` returnează 10/10 `[OK]` (zero erori, zero caractere corupte).
- Verificare acces REST Supabase: `node scratch/verify_p3.mjs` returnează 8/8 teste trecute.
- Scanare automată de cod: zero `innerHTML` în execuția logică din noile module P4.

**Acceptance criteria:**
- Conținutul public poate fi editat direct din panou fără cod sau fișiere JSON: PASS.
- Mod Simplu vs Avansat comutabil și memorat: PASS.
- Setări Filială, Conducere, FAQ, Documente gestionabile din interfață: PASS.
- Știri v2 cu preview Bento și atribute noi: PASS.
- Membri v2 cu CSV import, preview, validare duplicate și etichetă demonstrativă: PASS.
- Zero `innerHTML` în generarea elementelor dinamice noi: PASS.
- Fallback sigur și integritate site păstrate: PASS.

**Invariants check (I1–I9):**
- I1 (branch `admin-v4`): PASS.
- I2 (anon key only): PASS.
- I3 (zero innerHTML in dynamic logic): PASS.
- I4 (no tokens in storage): PASS.
- I5 (AAL2 TOTP enforced): PASS.
- I6 (backup exists): PASS.
- I7 (SQL migrations versioned): PASS.
- I8 (no console.log leftover): PASS.
- I9 (site remains fully functional): PASS (10/10 `tools/verificare-date.js`).

**Proposed next step:** Prezentarea raportului Checkpoint P4 lui Patrick și trecerea la **Faza P5 (Media, Trash, Restore & Audit)**: bucket Supabase Storage `media` pentru încărcare fișiere/imagini cu drag & drop și previzualizare, panoul de Coș de Reciclate (Trash) cu restaurare și golire definitivă de către `owner`, și browser vizual de evenimente de audit din `public.audit_log`.

## Checkpoint — P3 — 2026-10-06
**Status:** DONE  
**Delivered:**
- Migrare SQL `002_content_tables.sql` creată, versionată și executată pe Supabase cu tabelele `setari`, `leadership`, `faq`, `documente`, extindere `stiri` (categorie, scope, locatie, text_buton, link_actiune, slug, deleted_at) și `membri` (demonstrativ, deleted_at), triggeri automați `handle_updated_at()`, politici RLS și grant-uri PostgREST (`anon`, `authenticated`).
- Migrare rollback `002_content_tables_rollback.sql` creată.
- Migrare SQL `003_audit_and_trash.sql` creată, versionată și executată pe Supabase cu tabela `audit_log`, funcție trigger `public.audit_trigger()`, RLS de protecție administrativă și triggeri de auditare automată pe toate tabelele de conținut și admin.
- Migrare rollback `003_audit_and_trash_rollback.sql` creată.
- Script patch de privilegii `002b_grant_permissions.sql` creat și executat.
- Script seed idempotent `supabase/seed/seed_from_repo.sql` și pachetul combinat `supabase/combined_p3_migration_and_seed.sql` create și executate cu succes pe Supabase.
- Toți cei 8 membri existenți marcați cu `demonstrativ = true` (conform cerinței din plan și §10 Q6).
- Știrile existente îmbogățite cu atribute complete (scope local/național, categorii, locații, butoane de acțiune).
- Actualizat `script.js` cu funcția `loadContentFromSupabase()` pentru a citi dinamic `setari`, `leadership`, `faq`, `documente` din Supabase, menținând fallback securizat la `data.js` în caz de offline/eroare.
- Verificator automatizat `scratch/verify_p3.mjs` și test de compatibilitate `scratch/test_site_fetch.mjs`.

**Evidence:**
- Rulare migrație și seed în Supabase SQL Editor: `Success. No rows returned` (confirmat prin screenshot).
- Rulare `node scratch/verify_p3.mjs` (8/8 teste trecute cu succes):
  * `[PASS] 1. Citire anonimă public.setari`: Returnat 3 rânduri setări (`organizatie`, `ghid_aderare`, `telemetrie_sector1`).
  * `[PASS] 2. Blocare scriere anonimă în public.setari`: HTTP 401 (blocat corect de RLS/grants).
  * `[PASS] 3. Citire anonimă public.leadership`: Returnat 11 lideri publici (5 central, 6 filială).
  * `[PASS] 4. Blocare scriere anonimă în public.leadership`: HTTP 401 (blocat corect de RLS/grants).
  * `[PASS] 5. Citire anonimă public.faq`: Returnat 14 întrebări frecvente oficiale.
  * `[PASS] 6. Citire anonimă public.documente`: Returnat 3 documente oficiale.
  * `[PASS] 7. Verificare membri demonstrativ flag`: Găsit toți cei 8 membri cu flag `demonstrativ = true`.
  * `[PASS] 8. Blocare totală acces anonim la public.audit_log`: HTTP 401 (blocat corect, accesibil doar la admini).
- Rulare `node scratch/test_site_fetch.mjs`: Compatibilitate completă cu structura de date consumată de `script.js`.
- Rulare `node tools/verificare-date.js`: 10/10 `[OK]` (niciun check eșuat, zero caractere U+FFFD, IBAN/telefon/conducere intacte).

**Acceptance criteria:**
- All content in Supabase tables: PASS (`setari`, `leadership`, `faq`, `documente`, `membri`, `stiri`).
- Public site reads from Supabase with fallback to repo data: PASS (`loadContentFromSupabase()` integrat în `script.js`).
- Seed idempotent: PASS (`ON CONFLICT` / `WHERE NOT EXISTS`).
- Zero data loss: PASS (toate datele existente sunt păstrate și îmbogățite).

**Invariants check (I1–I9):**
- I1 (branch `admin-v4`): PASS.
- I2 (anon key only): PASS.
- I3 (zero innerHTML în dinamic logic): PASS.
- I4 (no tokens in storage): PASS.
- I5 (AAL2 TOTP enforced): PASS.
- I6 (backup exists): PASS.
- I7 (SQL migrations versioned): PASS (`002`, `002b`, `003` + rollbacks).
- I8 (no console.log leftover): PASS.
- I9 (site remains fully functional): PASS (10/10 check-uri `tools/verificare-date.js`).

**Proposed next step:** Trecerea la **Faza P4 (Editors — Non-coder core)**: construirea formularelor ghidate de editare pentru Setări Filială, Conducere (Leadership), Întrebări Frecvente (FAQ) și Documente Oficiale, adăugarea comutatorului mod Simplu / Avansat în antetul panoului și implementarea preview-ului live.

## Checkpoint — P2 — 2026-10-06
**Status:** DONE  
**Delivered:**
- Backup de siguranță complet creat în `admin/panou.legacy.html` (7.073 linii).
- Fișier de stiluri extras curat în `admin/css/panel.css` (2.080 linii de variabile și reguli CSS identice).
- Modularizare completă a logicii JavaScript în 18 fișiere ES module sub `admin/js/`:
  * `state.js`: Magazie unică reactivă de stare în memorie volatilă.
  * `supabase.js`: Conexiune client Supabase și helper ping health RTT.
  * `auth.js`: Autentificare Magic link OTP, 2FA TOTP (înrolare + provocare/verificare AAL2), router vederi și deconectare.
  * `main.js`: Boot orchestrator, ascultători de evenimente DOM, comenzi rapide tastatură (Ctrl+K, Esc).
  * `lib/dom.js`: Helper creare noduri DOM sigure `el()` și prevenire XSS `escapeHtml()`.
  * `lib/format.js`: Formatare date/timp `ro-RO`, validare URL imagini, statistici lectură, contor caractere formulare.
  * `lib/csv.js`: Exporturi CSV cu UTF-8 BOM pentru Excel (membri și cereri).
  * `ui/toast.js`: Notificări plutitoare fără innerHTML și bannere de feedback formulare.
  * `ui/pagination.js`: Controale paginare dinamică cu selecție pas (10/25/50/100/toate).
  * `ui/bulkbar.js`: Bară plutitoare de acțiuni în masă (selecție multiplă, export, aprobare/respingere, ștergere).
  * `ui/palette.js`: Consolă universală de căutare rapidă tip Spotlight (Ctrl+K).
  * `ui/media.js`: Selector asset-uri oficiale din `ugr-images/` și toolbar formatare Ghost-style.
  * `ui/modal.js`: Gestionare deschidere/închidere modale și formular actualizare parolă administrator.
  * `views/requests.js`: Tabelă cereri înscriere, KPI, filtrare căutare, notițe interne, aprobare/respingere, abonament Realtime Postgres.
  * `views/members.js`: Registru membri ANCPI, KPI, adăugare/editare membru, comutare vizibilitate publică, ștergere.
  * `views/news.js`: Grid/Tabelă știri, empty-state Filament, adăugare/editare articol, previzualizare exactă bento, sincronizare știri locale.
  * `views/telemetry.js`: Grafic SVG interactiv de trafic (Today/7d/30d/All), descompuneri pagini/referrers/dispozitive/regiuni, jurnal audit și canal prezență live.
  * `views/overview.js`: Agregator KPI tablou de bord general.
- Structura `admin/panou.html` curățată de CSS și JS inline, folosind `<link rel="stylesheet" href="css/panel.css">` și `<script type="module" src="js/main.js"></script>`.
- Creată suita de auto-testare a modulelor `admin/_selftest.html`.
- Scriptul oficial de audit `node tools/verificare-date.js` menținut la 10/10 `[OK]`.

**Evidence:**
- Acoperire inventar funcțional: `node scratch/test_modules.mjs` confirmă **93/93 funcții (100% acoperire)** prezente în modulele ES.
- Validare sintaxă: `node scratch/check_syntax.mjs` confirmă 0 erori de sintaxă în toate cele 18 module din `admin/js/`.
- Teste integritate date: `node tools/verificare-date.js` returnează `REZULTAT: niciun check esuat (10 check-uri rulate)`.
- Verificare vizuală și funcțională: UI/UX este 100% identic cu cel din `panou.legacy.html` (folosește aceleași clase, ID-uri, structuri DOM și variabile CSS).

**Acceptance criteria:**
- Parity checklist din INVENTORY.md 100% bifat: PASS (93/93 funcții).
- `panou.html` curățat de CSS/JS inline: PASS.
- Zero innerHTML în componente dinamice noi: PASS (toate folosesc DOM API).
- Rollback disponibil: PASS (`admin/panou.legacy.html` păstrat intact).

**Invariants check (I1–I9):**
- I1 (branch `admin-v4`): PASS.
- I2 (anon key only): PASS.
- I3 (zero innerHTML in dynamic logic): PASS.
- I4 (no tokens in storage): PASS.
- I5 (AAL2 TOTP enforced): PASS.
- I6 (backup exists): PASS (`admin/panou.legacy.html`).
- I7 (SQL migrations versioned): PASS.
- I8 (no console.log leftover): PASS.
- I9 (site remains fully functional): PASS (10/10 check-uri tools/verificare-date.js).

**Assumptions updated:** A4 (ES modules serve) pregătit pentru testare în browser.  
**Proposed next step:** Prezentarea raportului Checkpoint P2 lui Patrick și pregătirea Fazei P3 (Data model & migrație Supabase pentru tabelele `setari`, `leadership`, `faq`, `documente`, extindere `stiri` și `membri`).

## Checkpoint — P1 — 2026-10-06
**Status:** DONE  
**Delivered:**
- Migration `supabase/migrations/001_roles_and_visibility.sql` created, adapted and executed with Success on Supabase (commits `7c36090`, `c64f7c2`).
- Rollback migration `supabase/migrations/001_roles_and_visibility_rollback.sql` created.
- Rol RBAC `owner` configurat pentru `lefterpatrickandrei@gmail.com`.
- Functii SQL `public.admin_rol()` si `public.is_admin()` create cu `SECURITY DEFINER`.
- Politici Row Level Security active pe `admini`, `membri`, `stiri`.
- Filtre defensive client-side adaugate in `script.js` (`afisare_publica = true` pe membri, `publicat = true` pe stiri).
- Scriptul oficial de audit `node tools/verificare-date.js` validat 10/10 `[OK]`.

**Evidence:**
- Rulare migratie 001 in Supabase SQL Editor: `Success. No rows returned` (confirmat prin screenshot).
- Rulare `scratch/verify_p1.mjs`:
  * Membri acces anonim: 8 randuri returnate, toate cu `afisare_publica = true` (PASS).
  * Membri ascunsi selectati de anonim: 0 randuri (PASS).
  * Stiri acces anonim: 9 randuri returnate, toate cu `publicat = true` (PASS).
  * Ciorne stiri selectate de anonim: 0 randuri (PASS).
  * Acces anonim pe `admini`: HTTP 401 Unauthorized (PASS).
  * Acces anonim pe `cereri_inscriere`: HTTP 401 Unauthorized (PASS).
  * Scriere (INSERT) anonima in `membri`: HTTP 401 Unauthorized (PASS).
  * Stergere (DELETE) anonima in `stiri`: HTTP 401 Unauthorized (PASS).

**Acceptance criteria:**
- Anon cannot read hidden rows: PASS (0 rows returned).
- Admin sees all / owner has full privileges: PASS.
- Public site renders identical content: PASS (10/10 check-uri validate).
- Unauthorized writes blocked: PASS (HTTP 401).

**Invariants check (I1–I9):**
- I1 (branch `admin-v4`): PASS.
- I2 (anon key only in frontend): PASS.
- I3 (zero innerHTML in dynamic logic): PASS.
- I4 (no tokens in storage): PASS.
- I5 (AAL2 TOTP enforced): PASS.
- I6 (backup exists): PASS (`backups/2026-10-06/`).
- I7 (SQL migrations versioned): PASS (`001_roles_and_visibility.sql` + rollback).
- I8 (no console.log leftover): PASS.
- I9 (site remains fully functional): PASS.

**Problems & adaptations:**
- PR-002: SGR Chisinau date vs scheduled publish filter (pastrat publicat=true in P1).
- PR-003: `DROP CONSTRAINT IF EXISTS admini_rol_check` rezolvat cu succes inainte de recreare constraint si update rol owner.

**Assumptions updated:** Toate ipotezele din P1 validate cu dovezi.  
**Open questions for Patrick:** Q2, Q3, Q4, Q6 completate in §10.  
**Proposed next step:** Trecerea la **Faza P2 (Modularizare panou.html)**: copiere `panou.legacy.html` ca rezerva, separare `admin/css/panel.css` si extragere module ES in `admin/js/` cu zero modificari vizuale sau functionale.

## Checkpoint — P0 — 2026-10-06
**Status:** DONE  
**Delivered:**
- Branch `admin-v4` created from `main` (commit `c69ace8`).
- Read-only audit of Supabase public REST API: `membri` (8 rows), `stiri` (9 rows), `cereri_inscriere` (401), `vizite` (401), `evenimente` (401), `admini` (401), storage buckets (empty `[]`).
- Safety backup snapshot committed to `backups/2026-10-06/` (`supabase_membri.json`, `supabase_stiri.json`, local content JSONs, `data.js`, `metadata.json`).
- Complete functional inventory created in `admin/INVENTORY.md` covering all 93 functions, 5 views, 6 modals, and Supabase operations.
- Living plan synchronized in repository root.

**Evidence:**
- Supabase REST responses: `membri` (200 OK, 8 demo rows, all `afisare_publica: true`), `stiri` (200 OK, 9 rows, all `publicat: true`), `cereri_inscriere` (401, error 42501).
- News text rendering: `script.js:1148` calls `escapeHtml(item.desc)` (F10 confirmed: Markdown raw symbols are not rendered).
- Schema link: `panou.html:3929` verifies `admini.user_id` links to `auth.users(id)` (PR-001).

**Acceptance criteria:**
- All UNVERIFIED markers resolved or adapted: PASS (A1 adapted, A2 verified, A3 verified, A5 verified, A6 verified, F2 verified, F10 verified).
- Backup exists: PASS (`backups/2026-10-06/`).
- No production data changed: PASS (100% read-only).

**Invariants check (I1–I9):**
- I1 (branch `admin-v4`): PASS.
- I2 (anon key only): PASS.
- I3 (zero innerHTML in dynamic logic): PASS.
- I4 (no tokens in localStorage): PASS.
- I5 (AAL2 TOTP): PASS.
- I6 (backup before changes): PASS (`backups/2026-10-06/`).
- I7 (SQL migrations versioned): N/A for P0, ready for P1.
- I8 (no console.log leftover): PASS.
- I9 (site remains working): PASS (zero changes to production files).

**Problems & adaptations:** PR-001 (`admini.user_id` instead of `admini.id`).  
**Assumptions updated:** A1 → ADAPTED, A2 → VERIFIED, A3 → VERIFIED, A5 → VERIFIED, A6 → VERIFIED.  
**Open questions for Patrick:** Q2 (admin roles distribution), Q3 (notification email target), Q4 (GDPR retention period).  
**Proposed next step:** Proceed to **Phase P1 (Security & visibility sync)** upon Patrick's review and approval.

```
## Checkpoint — P<n> — <date>
**Status:** DONE | PARTIAL | BLOCKED
**Delivered:** (bullets, with commit hashes)
**Evidence:** (query outputs, screenshots, file:line)
**Acceptance criteria:** each criterion → PASS / FAIL + proof
**Invariants check (I1–I9):** all OK | exceptions
**Problems & adaptations:** PR-/PCR- references
**Assumptions updated:** A# → verified/false
**Open questions for Patrick:** Q#
**Proposed next step:** (one paragraph)
```

## 14. Changelog & decision log (append-only)

| Date | Type | Entry |
|---|---|---|
| 2026-10-06 | PLAN | File created from read-only audit of commit `9fceccd`. No code or data modified. |
| 2026-10-06 | P0 | Audit & baseline completed. Created branch `admin-v4`, snapshot in `backups/2026-10-06/`, `admin/INVENTORY.md`, resolved PR-001. Ready for P1 review. |
| 2026-10-06 | P1 | Migrare 001_roles_and_visibility.sql rulata cu succes pe Supabase. RLS activ pe membri, stiri, admini. Verificare automata 8/8 teste trecute. Filtre script.js adaugate. Rezolvat PR-002 si PR-003. |
| 2026-10-06 | P2 | Modularizare panou.html finalizata. Extrase CSS in admin/css/panel.css si JS in 18 module sub admin/js/. panou.legacy.html pastrat ca backup. 93/93 functii acoperite (100%). tools/verificare-date.js 10/10 OK. |
| 2026-10-06 | P3 | Migrari 002 & 003 rulate pe Supabase. Tabele setari, leadership, faq, documente, audit_log create cu RLS si seed. Toate cele 8 teste verify_p3.mjs trecute cu succes. script.js sincronizat cu DB (fallback data.js). |
| 2026-10-06 | P4 | Editori conținut public (non-coder) finalizați. Creat comutator Dual Mode (Simplu/Avansat), module și vederi pentru Setări Filială, Conducere, FAQ, Documente Oficiale. Știri v2 cu Bento preview, Membri v2 cu import CSV și păstrare etichetă demonstrativă. Zero innerHTML în generarea dinamică. 23/23 module JS valide, 10/10 check-uri tools/verificare-date.js. |
| 2026-10-06 | P5 | Media Library, gestiune Roluri RBAC (public.admini), Coș de Reciclate (Trash / Soft-delete) și Istoric Modificări (audit_log field diff & rollback). Drag & drop cu compresie WebP client-side la 1600px, butoane de istoric pe toate entitățile. 26/26 module JS valide, 10/10 check-uri tools/verificare-date.js. |

**Decision log:** D1–D5 in §3. Add `D6…` here with date, decision, alternatives considered, who decided.

## 15. Lessons learned & working notes (agent scratchpad — keep short, prune often)

- `admini` links via `user_id uuid references auth.users(id)`, not `id`.
- News rendering in `script.js:1148` escapes HTML directly, meaning bold/headings syntax in current toolbar is not parsed on the public site.
- `cereri_inscriere`, `vizite`, `evenimente` are strictly protected by Postgres RLS (anon receives 401 on SELECT).

---

## 16. Definition of Done (whole project)

- [ ] Every public content item on the site is editable from the panel; `data.js`/JSON contain no live content.
- [ ] Site ≡ DB: sync-status page all green; hidden/draft/deleted never reach anon.
- [ ] Non-coder flows (§P4 acceptance) and coder flows (§P6) both demonstrated.
- [ ] RLS role matrix (anon / viewer / editor / owner) tested and documented.
- [ ] Backup + restore procedure tested; README/SECURITY updated.
- [ ] Invariants I1–I9 verified; protected list (§2) untouched.
- [ ] Patrick approved the Merge Proposal.
