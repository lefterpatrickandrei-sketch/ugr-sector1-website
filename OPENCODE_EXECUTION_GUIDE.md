# OPENCODE_EXECUTION_GUIDE — plan de execuție (faza: PLANIFICARE)

Derivat din `C:\Users\lefpa\Downloads\ADMIN_V4_FIXES.md`, adaptat la deciziile tale:
**A1** = branch nou `opencode-admin4-fixes` (din `admin-v4`) · **A2** = 2FA rămâne doar în UI · **A3** = doar `owner|editor|viewer`.

> Acest document este **planul**. Niciun fișier de cod nu este modificat până când Patrick nu aprobă.

---

## 0. Starea repo-ului (verificată pe `admin-v4` @ `2e5fff2`, working tree curat)

```
c:\Users\lefpa\webugr   branch: opencode-admin4-fixes   (creat din admin-v4 @ 2e5fff2)
supabase/migrations/    001…007 (+ rollback-uri), FĂRĂ 008
supabase/seed/          seed_from_repo.sql
admin/js/               30 fișiere ES-module (main, auth, state, supabase,
                        lib/{csv,dom,format}, ui/{bulkbar,media,modal,mode,
                        notifications,pagination,palette,toast},
                        views/{coder,documents,faq,history,leadership,members,
                        news,overview,pages,requests,roles,settings,sync,
                        telemetry,trash})
admin/js/lib/db.js      NU EXISTĂ (se creează la T-J2)
package.json            test:syntax → scratch/check_syntax.mjs  (30/30 OK acum)
                        test:data    → tools/verificare-date.js
```

### Constante verificate (nu presupune, citește)

| Locație | Stare reală |
|---|---|
| `001_roles_and_visibility.sql:24` | `CHECK (rol IN ('owner','editor','viewer','admin'))` |
| `001:34-45` / `001:47-58` | `admin_rol()` / `is_admin()` **fără** condiție `aal` |
| `001:87-88`, `001:122-123` | `anon_select_membri`, `anon_select_stiri` (fără `deleted_at IS NULL`) |
| `002:126-129` | `setari_citire_anonim` → `USING (true)` |
| `002:229-236` | `membri_citire_anonim`, `stiri_citire_anonim` (variantele noi) |
| `005:25-52` | `get_table_rls_policies()` LANGUAGE sql, **fără** `is_admin()`, doar `schemaname='public'` |
| `006:34-47` | **anulează** politicile `media_*` din 004 → `authenticated` fără `admin_rol()` |
| `007:39-48` | `admin_claim_invited` UPDATE pe orice coloană a propriului rând |
| `006:21,26` | bucket `media` permite `image/svg+xml` (nefolosit: `media.js:77` blochează deja) |
| `admin/panou.html:9` | `<script src=".../@supabase/supabase-js@2">` — nepinned, fără `integrity` |
| `admin/js/main.js:145` | importul din `'./ui/media.js'` **nu** include `updateNewsImageLivePreview` |
| `main.js:447,531,541` | `updateNewsImageLivePreview(...)` apelată → `ReferenceError` |
| `supabase.js:20` vs `views/telemetry.js:9` | două `pingSupabaseHealth`; în ambele `Math.max(12,…)` + `'18 ms'` + „Operațional" pe `catch` |
| `views/trash.js:50` | `s.data` (coloană inexistentă) → trebuie `s.data_publicare` |
| `main.js:948` | `onAuthStateChange(async …)` cu `await` în callback |
| `auth.js:398-420` | RPC `claim_admin_invite` **+** fallback `.ilike('email', …).update({ user_id })` |
| `views/coder.js:374-394` | `getDocumentedRlsPolicies` — catalog RLS hardcodat, mincinos |
| `state.js` | obiect plat, fără `createInitialState()`; `adminPresenceChannel`, `realtimeRequestsChannel` |
| `script.js:3287-3312` | `pagina_contact` mapează 9 din 21 câmpuri |
| `script.js:1270,1288` | `renderLeadership` / `renderDocuments` → interpolare fără `escapeHtml` |
| `index.html:1193` | `<section id="view-contact">`; blocuri contact la 1326-1351, butoane triaj 1279-1286 / 1313-1318 |

---

## 1. Regulile de execuție (obligatorii)

1. Branch de lucru: **`opencode-admin4-fixes`** (creat din `admin-v4` @ `2e5fff2`). Dacă ceva merge prost, `admin-v4` rămâne neatins și se poate arunca branch-ul. **Zero push** (Patrick face push-ul). Zero `main`.
2. **Nu** rulezi SQL pe baza reală. Produci doar fișiere `.sql`; Patrick le rulează în Supabase SQL Editor.
3. Nu modifica: `admin/panou.legacy.html`, `content/`, `backups/`, `backup/`, `ugr-images/`, `.agents/`, `demo-*/`.
4. Fără `innerHTML` în `admin/js` (regulă „zero innerHTML" a panelului).
5. Fără dependențe npm noi. Config eslint temporară **necomitată**.
6. Un commit per task: `fix(T-S1): …`, `fix(T-J2): …`. Niciodată amestecat.
7. După fiecare task JS: `npm run test:syntax` **și** `npm run test:data`. Ambele trec înainte de commit.
8. Task cerut cu decizie nespecificată → stai pe task, notează în „Decizii deschise", continuă cu următorul.
9. Nu trimite cereri către adrese reale; nu modifica valori din `setari` prin API.

---

## 2. Ordinea execuției

```
Etapa 0  Verificări de bază (read-only)          → raport
Etapa 1  SQL: 008 + rollback + 008_verify.sql    → 1 fișier per task, commit per task
Etapa 2  admin/js: T-J1 → T-J7                  → commit per task
Etapa 3  public: T-J8 → T-J11                    → commit per task
Etapa 4  Verificare finală + ADMIN_V4_FIXES_RAPORT.md
```

---

# ETAPA 0 — Verificări de bază

Rulează și atașează output-ul în raport:

```powershell
cd c:\Users\lefpa\webugr
git branch --show-current          # trebuie: opencode-admin4-fixes
git status --short                 # trebuie: gol
npm run test:syntax                # baseline: 30/30 OK
npm run test:data
Select-String -Path script.js,index.html,data.js -Pattern 'media/.*\.svg'
npm view @supabase/supabase-js version
```

**Observație:** `npm view` cere rețea. Dacă nu merge, T-J11 rămâne „SĂRIT" și se notează în raport.

---

# ETAPA 1 — SQL

Un singur fișier logic, `BEGIN; … COMMIT;`, idempotent:
`supabase/migrations/008_security_hardening.sql`
plus `008_security_hardening_rollback.sql` și `008_verify.sql`.

## T-S1 — Escaladare de privilegii prin `admin_claim_invited`

Politica din 007 permite UPDATE pe **oricare** coloană a propriului rând (deci `rol` inclusiv), iar RPC-ul `claim_admin_invite()` (`SECURITY DEFINER`) face deja asocierea. Politica e redundantă și periculoasă.

```sql
DROP POLICY IF EXISTS admin_claim_invited ON public.admini;
```

Rollback: recrează politica exact ca în `007:40-48`.

## T-S2 — 2FA în SQL — **ANULAT prin A2**

Documentul original cerea `(auth.jwt() ->> 'aal') = 'aal2'` în `admin_rol()` / `is_admin()`. **Nu implementezi.** Pentru că nu toți administratorii au TOTP configurat, blocarea e riscantă.

Singura schimbare permisă la acest task: adaugă un comentariu în `008` care explică *de ce* verificarea rămâne în UI, și notează în raport că hardened-ul AAL2 e o migrare separată, de aplicat după ce 100% din conturi au TOTP. Precizează ce trebuie schimbat (`auth.js` → lista de blocare la nivel de rol).

## T-S3 — Politici `storage.objects` pentru bucket `media`

006 a suprascris semantică din 004 cu variante deschise oricărui `authenticated`. Re-aplică 004, **dar fără rolul `admin`** (decizia A3):

```sql
DROP POLICY IF EXISTS media_read ON storage.objects;
CREATE POLICY media_read ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS media_insert ON storage.objects;
CREATE POLICY media_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.admin_rol() IN ('owner','editor'));

DROP POLICY IF EXISTS media_update ON storage.objects;
CREATE POLICY media_update ON storage.objects FOR UPDATE TO authenticated
  USING      (bucket_id = 'media' AND public.admin_rol() IN ('owner','editor'))
  WITH CHECK (bucket_id = 'media' AND public.admin_rol() IN ('owner','editor'));

DROP POLICY IF EXISTS media_delete ON storage.objects;
CREATE POLICY media_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.admin_rol() = 'owner');
```

Rollback: versiunea 006 (deschisă) — dar avertizează în raport că rollback-ul **reintroduce** riscul.

## T-S3b — Curățare rol `admin` (decizia A3)

Migrează rândurile existente și strânge constraint-ul:

```sql
UPDATE public.admini SET rol = 'editor' WHERE rol = 'admin';

ALTER TABLE public.admini DROP CONSTRAINT IF EXISTS admini_rol_check;
ALTER TABLE public.admini
  ADD CONSTRAINT admini_rol_check CHECK (rol IN ('owner','editor','viewer'));
```

Rollback: `UPDATE … SET rol='admin'` (doar dacă există istoric) + constraint-ul vechi.
⚠️ Înainte: `SELECT rol, count(*) FROM public.admini GROUP BY rol;` și notează rezultatul în raport.

## T-S4 — Coșul nu ascunde datele din vizualizarea publică

```sql
DROP POLICY IF EXISTS anon_select_membri ON public.membri;
DROP POLICY IF EXISTS anon_select_stiri  ON public.stiri;
```

Rămân `membri_citire_anonim` / `stiri_citire_anonim` din 002. Verifică cu `grep` în repo că `002_content_tables.sql:229-236` chiar conține `deleted_at IS NULL` în `USING`; dacă nu-l conține, **adaugă-l** în 008.

## T-S5 — `setari`: allowlist pentru citire anonimă

`002:127` e `USING (true)` → orice cheie e publică, inclusiv `contact_email_notificari`.

Cheile citite efectiv de `script.js:2960-2971` (verificat): `organizatie`, `ghid_aderare`, `telemetrie_sector1`, `pagina_%`.

```sql
DROP POLICY IF EXISTS setari_citire_anonim ON public.setari;
CREATE POLICY setari_citire_anonim ON public.setari FOR SELECT TO anon
  USING (
    cheie IN ('organizatie','ghid_aderare','telemetrie_sector1')
    OR cheie LIKE 'pagina\_%' ESCAPE '\'
  );
```

Verifică înainte: **cine consumă `contact_email_notificari`** (trigger / Edge Function / cod admin)? Dacă e nevoie anonim, se blochează și se raportează. `pages.js` citește doar `pagina_*` ca `authenticated`, deci e neafectat.

## T-S6 — `get_table_rls_policies()` doar pentru admini

`005:25` e `LANGUAGE sql` fără verificare → orice user autentificat cheamă RPC-ul.

```sql
CREATE OR REPLACE FUNCTION public.get_table_rls_policies()
RETURNS TABLE (schemaname text, tablename text, policyname text, permissive text,
               roles text[], cmd text, qual text, with_check text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT p.schemaname::text, p.tablename::text, p.policyname::text, p.permissive::text,
         p.roles::text[], p.cmd::text, p.qual::text, p.with_check::text
  FROM pg_policies p
  WHERE p.schemaname IN ('public','storage')
  ORDER BY p.tablename, p.policyname;
END; $$;

REVOKE ALL ON FUNCTION public.get_table_rls_policies() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_table_rls_policies() TO authenticated;
```

Alias-ul `p.` evită „column reference is ambiguous". Extinde și la `storage`, pentru că `coder.js` afișează politici de storage.

## T-S7 — Nu poate dispărea ultimul owner

```sql
CREATE OR REPLACE FUNCTION public.prevent_last_owner_loss() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.rol = 'owner' AND OLD.activ AND (
       TG_OP = 'DELETE'
       OR (TG_OP = 'UPDATE' AND (NEW.rol <> 'owner' OR NEW.activ = false))
     ) THEN
    IF NOT EXISTS (SELECT 1 FROM public.admini
                   WHERE rol = 'owner' AND activ AND id <> OLD.id) THEN
      RAISE EXCEPTION 'Nu se poate elimina sau dezactiva ultimul owner activ.';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_last_owner_loss ON public.admini;
CREATE TRIGGER trg_prevent_last_owner_loss
  BEFORE UPDATE OR DELETE ON public.admini
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_owner_loss();
```

Rollback: `DROP TRIGGER` + `DROP FUNCTION`.

## T-S8 — Scoate SVG din bucket `media`

Am verificat: `media.js:77` respinge deja `image/svg+xml` la upload, și nu există referințe `.svg` în bucket. Deci se poate aplica.

```sql
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY['image/webp','image/jpeg','image/png','application/pdf']
 WHERE id = 'media';
```

Rollback: adaugă înapoi `'image/svg+xml'`.

## `008_verify.sql` (read-only, pentru Patrick)

```sql
select tablename, policyname, cmd, roles from pg_policies
 where tablename in ('membri','stiri') and roles::text like '%anon%' order by tablename, policyname;
select policyname, cmd from pg_policies where tablename = 'admini' order by policyname;
select policyname, cmd, qual from pg_policies
 where schemaname = 'storage' and tablename = 'objects' and policyname like 'media_%';
select policyname, qual from pg_policies where tablename = 'setari';
select rol, count(*) from public.admini group by rol;
select proname from pg_proc where proname in ('admin_rol','is_admin','claim_admin_invite',
                                              'get_table_rls_policies','prevent_last_owner_loss');
```

**Așteptat:** `membri`/`stiri` → doar `*_citire_anonim`; `admini` → fără `admin_claim_invited`; storage → `admin_rol()` prezent, `'admin'` absent; `setari` → allowlist; roluri → doar 3.

---

# ETAPA 2 — Panou admin (`admin/js`)

## T-J1 — `updateNewsImageLivePreview` neimportat

`main.js:447,531,541` folosesște funcția; importul din `'./ui/media.js'` (se termină la linia 145) nu o include.

Fix: adaug-o în acel import. **Nu** crea alias și **nu** duplica logica.

Acceptare: scrierea în „URL imagine", „Aplică URL", „Șterge imaginea" nu mai aruncă `ReferenceError`.

## T-J2 — `assertRows`: prinderea scrierilor blocate de RLS

PostgREST + RLS: când `USING` blochează, răspunsul e `{ error: null, data: [] }` → UI-ul arată succes fals.

**1. Creează `admin/js/lib/db.js`:**

```js
export function assertRows(res, action = 'Operația') {
    if (res.error) throw res.error;
    if (!res.data || res.data.length === 0) {
        throw new Error(`${action} nu a modificat niciun rând (permisiuni insuficiente sau rând inexistent).`);
    }
    return res.data;
}
```

**2. Aplică la fiecare `.update()` / `.delete()` / `.upsert()`** din lista de mai jos: adaugă `.select(<cheie>)` și treci rezultatul prin `assertRows`, în `try/catch` care deja există (=> `showToast(..., 'error')`).

Cheie: `id`, sau `cheie` pentru `setari`, sau `idCol` dinamic în `coder.js`.

Fișiere și linii aproximative (de reverificat cu grep, s-au putut deplasa):

| Fișier | Linii aproximative | Cheie |
|---|---|---|
| `ui/bulkbar.js` | 148, 165, 185, 207 | `id` |
| `views/coder.js` | 227, 472, 487, 492 | `idCol` (dinamic) |
| `views/documents.js` | 226, 233, 250, 274, 275, 296 | `id` |
| `views/faq.js` | 226, 233, 250, 274, 275, 296 | `id` |
| `views/leadership.js` | 245, 252, 269, 295, 296, 318 | `id` |
| `views/members.js` | 174, 440, 458, 491, 502, 545, 573, 735 | `id` |
| `views/news.js` | 150, 407, 529, 955, 972, 1008, 1036 | `id` |
| `views/pages.js` | 648 | `cheie` |
| `views/settings.js` | 247 | `cheie` |
| `views/requests.js` | 185, 385, 414, 444 | `id` |
| `views/roles.js` | 186, 202, 218, 262 | `id` |
| `views/trash.js` | 194, 241, 271 | `id` |
| `views/history.js` | 197 | `id` |

**3. Bulk** (`bulkbar.js`, `handlePurgeOldTrash` în `trash.js:259`): numără **rândurile întorcute**, nu iterațiile. Toast: „X din Y rânduri actualizate".

Acceptare: logat ca `viewer`, orice salvare/ștergere arată **eroare**, nu succes.

## T-J3 — Flux de autentificare

**3.1 `main.js:948`** — fără `await` de Supabase în callback (risc de deadlock) și ignoră `SIGNED_IN` redundant:

```js
client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') { showAuthStep('login'); return; }
    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (state.user && session?.user?.id === state.user.id) return;
        setTimeout(() => evaluateAuthState(), 0);
    }
});
```

**3.2 `auth.js:398-439`** — șterge blocul de fallback `.ilike('email', …).update({ user_id })`. Cu T-S1 aplicat devine cod mort, iar `ilike` cu wildcard-uri e hazard. Rămâne doar RPC-ul `claim_admin_invite`; dacă eșuează, mesajul real se afișează în pasul `unauthorized` (nu se înghite).

**3.3** Încărcarea din `verifyAdminStatus` (`loadRequests`, `loadMembers`, `loadNews`, `loadVisitsStats`) → `Promise.allSettled([...])`.

**3.4** `initAdminLivePresence()` și `initRealtimeRequestsListener()` devin idempotente: dacă `state.adminPresenceChannel` / `state.realtimeRequestsChannel` există, nu crea canal nou.

**3.5** `state.js`: exportă `createInitialState()`; folosită la init **și** la `handleSignOut` → `Object.assign(state, createInitialState())`. Se resetează toate colecțiile, nu doar requests/members/news (`allSettingsData`, `allLeadershipData`, `allFaqData`, `allDocumentsData`, `allAdminsData`, `allTrashData`, `pagesData`, selecțiile bulk, `remoteMediaAssets`, paginare, filtre, canale).

Acceptare: schimbi tab-ul și revii → rămâi în view-ul curent, un singur canal `presence` și unul `realtime` în `client.getChannels()`.

## T-J4 — Roluri (`views/roles.js`)

1. `isSelf`: `admin.user_id === state.user?.id || admin.email.toLowerCase() === state.adminRecord?.email?.toLowerCase()`.
2. `confirm()` înainte de schimbarea rolului (mai ales spre/dinspre `owner`) și înainte de dezactivare.
3. La eroare în `handleUpdateAdminRole`: cheamă `loadAdmins()` ca selectul să revină la valoarea reală.
4. `handleSaveNewAdmin`: guard `let isSavingAdmin = false` (butonul e `type="submit"` și are **două** listenere în `main.js` → rulează de două ori). Dezactivează butonul sincron la început. `error.code === '23505'` → „Acest email este deja înregistrat ca administrator." Regex simplu pentru email, nu doar `includes('@')`.
5. **Rolul `admin` dispare** (A3): `roles.js:138-140` are doar editor/viewer/owner — corect acum. Șterge ramura `roles.js:105` care mapează `admin` pe badge-ul de owner, și curăță referințele din `coder.js:377-392` și `media.js:215`.
6. Erorile trigger-ului T-S7 se afișează curate în toast (mesajul vine din Postgres ca `error.message`).

## T-J5 — Coș (`views/trash.js`)

1. `trash.js:50`: `s.data` → `s.data_publicare`, afișat cu `formatDateOnlyRo` din `lib/format.js`.
2. `loadTrash` (`trash.js:23`): verifică `.error` pe fiecare din cele 5 răspunsuri din `Promise.all`; la eroare, toast cu tabela afectată — nu „gol".
3. Purge/restore → `assertRows` (T-J2).

## T-J6 — Sync știri nu mai creează dubluri (`views/news.js`)

`handleSyncDefaultNews` (`news.js:130`) inserează direct `OFFICIAL_FALLBACK_NEWS` (`news.js:16`, 9 articole, `news.js:150`) → dubluri la fiecare apăsare.

Înainte de insert: citește titlurile existente cu `.select('titlu')` **fără** `.is('deleted_at', null)` (astfel titlurile din coș nu se re-inserează), normalizează `trim().toLowerCase()`, filtrează fallback-ul și inserează doar lipsurile. Toast: „X adăugate, Y existau deja".

## T-J7 — Validare URL în panou

**1. `admin/js/lib/format.js`** — adaugă:

```js
export function isSafeHref(url) {
    const s = String(url ?? '').trim();
    if (!s) return true;                    // câmp opțional
    const probe = s.replace(/[\u0000-\u0020\u007F]+/g, '');
    const m = probe.match(/^([a-z][a-z0-9+.-]*):/i);
    return !m || ['http', 'https', 'mailto', 'tel'].includes(m[1].toLowerCase());
}
```

**2. La salvare**, blochează cu toast „Adresa trebuie să înceapă cu https://, mailto: sau tel:" și oprește salvarea:
`link_actiune` (`news.js:948`) · `fisier_url` (`documents.js:217`) · `foto_url` (`leadership.js`) · orice câmp de link din `gatherCurrentPagesPayload` (`pages.js:493`, `605-606`) — inclusiv `heroBtnSecondaryLink`.

**3. `documents.js:94`** — `href: '../${doc.fisier_url}'` strică URL-urile absolute. Devine: dacă `/^https?:\/\//i.test(url)` → ca atare; altfel prefix `../`.

---

# ETAPA 3 — Site public & supply chain

## T-J8 — Editorul de pagini 1-la-1 cu site-ul

`pages.js` scrie 21 câmpuri pentru `pagina_contact`; `script.js:3287-3312` consumă doar 9 (`heroKicker`, `heroTitle`, `heroSubtitle`, `triageHeading`, `triageSub`, `triageLocalTitle`, `triageCentralTitle`, `formTitle`, `formDesc`).

**Neconsumate (12 în tab-ul Contact):**
`triageLocalPhone`, `triageLocalEmail`, `triageCentralPhone`, `triageCentralEmail`, `addressAcademic`, `addressCentral`, `contactEmailLocal`, `contactCentralPhone`, `contactCentralEmail`, `contactPresidentPhone`, `contactSecretaryPhone`, `contactCotizatiiPhone`.

**Neconsumat și în alt tab:** `bankName` — e în tab-ul **Membri** (`pages.js:174`, input `page-membri-bank-name`), iar `script.js:3282-3285` mapează doar `bankIban` și `bankPurpose`. Deci cele 13 câmpuri din documentul original = 12 Contact + `bankName` (Membri). Tratează ambele.

Pași:
1. În `index.html`, pe elementele care afișează aceste valori din `#view-contact` (1193), adaugă atribute stabile `data-page-field="<cheie>"`. **Nu** schimba textul, designul sau clasele existente.
   - Telefoane locale: `btn-copy-chip` din `.triaj-card-local .triaj-actions` (1280-1285), plus linkurile `tel:` din `.contact-point-block` (1335-1338).
   - Central: `.triaj-card-central .triaj-actions` (1313-1318), plus `.contact-point-block` al Sediului Central (1345-1349).
   - Adrese: tot în `.contact-point-block`.
   - Atenție: același număr apare de 2 ori (buton copy + link `tel:`). Aplică `textContent` pe **toate** elementele cu același `data-page-field`.
2. În ramura `pagina_contact` din `script.js`, aplică valorile cu `textContent`; pentru emailuri și telefoane setează și `href` cu `mailto:` / `tel:`. **Fără `innerHTML`.**
3. Păstrează garda `if (val.x)` — câmp gol păstrează textul implicit din HTML.
4. În `admin/panou.html`, sub tab-ul Contact, adaugă textul de ajutor: „Câmp gol = se păstrează textul implicit al site-ului".
5. Adaugă `bankName` în ramura `pagina_membri` (`script.js` lângă 3282).
6. **Raport:** listează orice altă cheie din `gatherCurrentPagesPayload` neconsumată de `applyCustomPageData`. `events` și `timeline` **sunt** consumate — nu le atinge.
7. **Raport:** documentează ordinea dintre `applyCustomPageData('pagina_evenimente')` (suprascrie `.events-timeline-item` după index) și `renderEventsTimeline()` (randat din `stiri`). Care rulează ultima? Poate strica ordinea prin overlay pe index? **Nu schimba comportamentul** fără decizie — doar raportează.

## T-J9 — XSS stocat pe site-ul public

**1. `script.js`** — lângă `escapeHtml` (1334) adaugă:

```js
function safeUrl(u, fallback = '#') {
    const s = String(u ?? '').trim();
    if (!s) return fallback;
    const probe = s.replace(/[\u0000-\u0020\u007F]+/g, '');
    const m = probe.match(/^([a-z][a-z0-9+.-]*):/i);
    if (m && !['http', 'https', 'mailto', 'tel'].includes(m[1].toLowerCase())) return fallback;
    return s;
}
```

**2. `renderLeadership` (1270-1286)** — `escapeHtml` pe `member.name`, `member.role`, `member.desc`; `src="${escapeHtml(safeUrl(member.image, 'logo_geodez.png'))}"`, `alt="${escapeHtml(member.name)}"`.

**3. `renderDocuments` (1288-1311)** — `escapeHtml` pe `doc.format`, `doc.badge`, `doc.title`, `doc.desc`; `href="${escapeHtml(safeUrl(doc.fileUrl))}"`.

**4. Linkuri știri** — `href` cu `escapeHtml(safeUrl(...))` în template-urile care ajung în `innerHTML`; la maparea din `script.js` (~2902) normalizează `link_actiune` cu `safeUrl(..., '#contact')`.

**5. `applyCustomPageData`** — `btnSecLink.setAttribute('href', safeUrl(val.heroBtnSecondaryLink))`.

**6. `renderFaq` (1430)** — verifică explicit `item.question`, `item.answer`, `tag`, `category`. Atenție: `highlightFaqTerms` (1346) deja escapează, dar **raw-ul** din `innerHTML` trebuie acoperit.

**7. Raport:** grep final pe șabloanele cu interpolare `${...}` care ajung în `innerHTML` și listează orice interpolare de date din Supabase rămasă neescapată.

## T-J10 — Health check real și consolă dezvoltator protejată

1. **Dublare:** `supabase.js:20` și `telemetry.js:9` sunt două `pingSupabaseHealth`. Păstrează **doar** `telemetry.js` (importată de `auth.js:12`, `main.js:56`, `overview.js:9`). Șterge-o pe cea din `supabase.js` și verifică că nu mai e importată.
2. **Valori inventate:** elimină `Math.max(12, …)`, `'18 ms'` și „Operațional" de pe ramura `catch`. Logică nouă:
   - `fetch(url + '/auth/v1/health', { method: 'GET', signal: AbortSignal.timeout(5000), headers: { apikey } })`
   - `res.ok` → `latencyEl.textContent = '<rtt real> ms'`, status „Operațional", `health-dot ok`
   - altfel / excepție → `latencyEl.textContent = '—'`, status **„Indisponibil"**, `health-dot error` (adaugă clasa `.health-dot.error` în `admin/css/panel.css` dacă lipsește).
   - ⚠️ **Metodă: `GET`, nu `HEAD`.** Supabase răspunde `405 Method Not Allowed` la `HEAD /auth/v1/health`, deci un health check cu `HEAD` ar afișa mereu „Indisponibil" pe un server perfect funcțional. Verifică mereu `res.ok`, nu existența obiectului `response`.
   - Cache: adaugă `cache: 'no-store'`, ca un rezultat 200 memorat de browser să nu mascheze o cădere ulterioară a serverului.
3. **`coder.js:374-394`** — șterge `getDocumentedRlsCatalog()`. Dacă RPC-ul eșuează (inclusiv `42501` de la T-S6), afișează mesajul real. Nu afișa politici care nu există.
4. **`coder.js`** — acces doar `owner`: guard în `switchView` și în `loadCoderView`. `confirm()` înainte de „Salvează Modificările în DB". Whitelist de tabele editabile, **fără `admini`**. Autoritatea rămâne RLS.

## T-J11 — Pin + SRI pentru Supabase JS

`admin/panou.html:9` →

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@<x.y.z>/dist/umd/supabase.js"
        integrity="sha384-<hash>" crossorigin="anonymous"></script>
```

- Versiune: `npm view @supabase/supabase-js version`
- Hash: `curl -s <url> | openssl dgst -sha512 -binary | openssl base64 -A`
- Testează login complet după schimbare.
- **Nu** adăuga CSP în acest task (panoul are mult inline).

⚠️ Atenție: dacă fișierul UMD nu e cel folosit acum, `-crossorigin` strică load-ul. Verifică răspunsul real înainte să comiți.

⚠️ **openssl poate lipsi de pe PATH** (nu este instalat implicit pe Windows). Variantă de rezervă, fără dependințe externe — scriptul `scratch/sri-supabase.mjs` (creat la T-J11) calculează hash-ul cu `fetch` → `arrayBuffer` → `crypto.createHash('sha512')` din Node:
```powershell
node scratch\sri-supabase.mjs 2.117.2
```
⚠️ **NU** calcula hash-ul dintr-un `Invoke-WebRequest` + `GetBytes(text)` în PowerShell: decodificarea ca text și re-codificarea pot schimba un octet (BOM, conversie newline) și produc un hash care nu corespunde niciunui fișier.

---

# ETAPA 4 — Verificare

```powershell
npm run test:syntax     # 0 FAIL
npm run test:data
node --check script.js
```

**Lint** (config temporară, **necomitată**): `eslint@9` cu `no-undef: error`, `sourceType: module`, `globals.browser` peste `admin/js`. Țintă: **0 erori `no-undef`**. Ideal și `no-unused-vars` curățat în `main.js`, `leadership.js`, `settings.js`, `overview.js`, `sync.js`.

**Test de ID-uri:** fiecare `getElementById('x')` din `admin/js` există în `panou.html`.

### Teste manuale (Patrick, după ce aplică 008)

Cu cheia `anon` din `admin/js/supabase.js:7`:

| # | Test | Așteptat |
|---|---|---|
| 1 | `GET /rest/v1/setari?cheie=eq.contact_email_notificari` ca `anon` | `[]` |
| 2 | `GET /rest/v1/setari?cheie=like.pagina_*` ca `anon` | rânduri |
| 3 | membru cu `deleted_at` setat și `afisare_publica=true`, `GET /rest/v1/membri` ca `anon` | **nu** apare |
| 4 | cont `viewer`: `PATCH /rest/v1/admini` | 0 rânduri |
| 5 | cont `viewer`: `PATCH /rest/v1/admini?id=eq.<propriu>` cu `{"rol":"owner"}` | 0 rânduri |
| 6 | token `aal1` (fără TOTP): `GET /rest/v1/membri` | doar publice |
| 7 | token `aal1`: `GET /rest/v1/audit_log` | `[]` |
| 8 | upload `storage/v1/object/media/test.png` cu user non-admin | `403` |
| 9 | owner încearcă să retrogradeze ultimul owner activ | eroare din trigger |
| 10 | `GET /rest/v1/rpc/get_table_rls_policies` cu token non-admin | `42501` |
| 11 | login complet în panou după 008 + logout + login | funcționează |

---

# Decizii deschise (NU decide singur — raportează)

1. **Starea „programat"** pentru știri: `publicat=true` cu `data_publicare` în viitor e vizibil imediat. Doar raportează.
2. **Retenție `audit_log`**: `vechi`/`nou` stochează date personale complete, fără retenție → incomplet GDPR la ștergere. Nu schimbi; propune politică.
3. **Politicile lipsă din repo** pentru `cereri_inscriere`, `vizite`, `evenimente` (Faza 2 n-are SQL versionat). Propune `000_baseline_policies.sql` exportat din baza live.
4. **Invitație admin nou**: cu `shouldCreateUser:false`, un email inexistent în `auth.users` nu poate primi magic link. Soluția corectă = Edge Function cu `auth.admin.inviteUserByEmail` (service role). **Nu implementa fără aprobare.** Verifică și în Supabase Auth: „Allow new users to sign up" = **OFF**, „Confirm email" = **ON**.
5. **CSP pentru panou**: `admin/panou.html` are mult inline; tratat separat de T-J11.
6. **Rollback T-S3** reintroduce politicile deschise pe storage — decide dacă e acceptabil ca opțiune de rollback.

---

# Raport final: `ADMIN_V4_FIXES_RAPORT.md` (rădăcina branch-ului)

Per task **T-S1…T-S8, T-S3b, T-J1…T-J11**: `FĂCUT` / `PARȚIAL` / `SĂRIT` · fișiere modificate · **o linie de dovadă** (output lint, grep, diff scurt).

Plus secțiunile obligatorii: **„Decizii deschise"** și **„Teste manuale"**.

Regula: **niciun „FĂCUT" fără dovadă.**