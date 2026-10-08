# Raport de implementare — ADMIN_V4_FIXES

**Branch:** `opencode-admin4-fixes` (creat din `admin-v4` @ `2e5fff2`)
**Interval:** `1b4a757` … `dcf8afc` — 14 commit-uri, 35 fișiere, +2372 / −559
**Data:** 2026-10-07
**Sursă:** `C:\Users\lefpa\Downloads\ADMIN_V4_FIXES.md` (Claude) → plan de execuție `OPENCODE_EXECUTION_GUIDE.md`

## Sumar

| # | Task | Stare | Commit |
|---|---|---|---|
| 1 | T-S1 · `admin_claim_invited` (escaladare viewer → owner) | **FĂCUT** | `1b4a757` |
| 2 | T-S2 · AAL2 impus în SQL | **AMÂNAT** (vezi Decizii) | `1b4a757` (doar comentariu) |
| 3 | T-S3 · politici `storage.media_*` | **FĂCUT** | `1b4a757` |
| 4 | T-S3b · eliminarea rolului `admin` | **FĂCUT** | `1b4a757` |
| 5 | T-S4 · `anon_select_membri` / `anon_select_stiri` | **FĂCUT** | `1b4a757` |
| 6 | T-S5 · `setari` anonim pe allowlist | **FĂCUT** | `1b4a757` |
| 7 | T-S6 · `get_table_rls_policies()` doar admin | **FĂCUT** | `1b4a757` |
| 8 | T-S7 · trigger anti pierdere ultim owner | **FĂCUT** | `1b4a757` |
| 9 | T-S8 · `image/svg+xml` scos din bucket | **FĂCUT** | `1b4a757` |
| 10 | T-J1 · `updateNewsImageLivePreview` neimportat | **FĂCUT** | `6d2753e` |
| 11 | T-J2 · `lib/db.js` + `.select()` pe toate scrierile | **FĂCUT** | `50763e8` |
| 12 | T-J3 · flux de autentificare | **FĂCUT** | `c38238b` |
| 13 | T-J4 · view Roluri | **FĂCUT** | `dd093d0` |
| 14 | T-J5 · view Coș | **FĂCUT** | `4bd8300` |
| 15 | T-J6 · `handleSyncDefaultNews` duplică | **FĂCUT** | `e9b2238` |
| 16 | T-J7 · `isSafeHref()` pe toate linkurile | **FĂCUT** | `3797830` |
| 17 | T-J8 · cele 13 câmpuri neconsumate | **FĂCUT** | `b3f2708` |
| 18 | T-J9 · XSS stocat pe site-ul public | **FĂCUT** | `96fd961` |
| 19 | T-J10 · health check + consolă protejată | **FĂCUT** | `9381e1b`, `dcf8afc` |
| 20 | T-J11 · pin + SRI `supabase-js` | **FĂCUT** | `f095147`, `fce2157` |

Niciun task marcat „FĂCUT" fără dovadă — vezi secțiunea de verificare de mai jos.

Task-uri **adăugate în timpul execuției**, din măsurători, nu din brief: T-S3b, D1…D15. Dintre acestea, **neacționate rămân D3** (retenția PII în `audit_log`), **D5** (crearea contului lui Ștefan din Dashboard) și **D12** (decizia despre `evenimente`).

---

## Ordinea aplicării — stare la 8 octombrie 2026

**Aplicat și verificat în baza de date:** `008a_admini_invites.sql`, `008_security_hardening.sql`, `008c_role_isolation.sql`, `008d_public_writes.sql`, `008e_anti_spam.sql`.

**În repo, neaplicat:** `008b_enforce_aal2.sql` — **NU APLICA ACUM.** Vezi Decizia D1. Se rulează abia după ce fiecare cont de administrator are TOTP configurat.

Ordinea în care au fost rulate, pentru reproducere:

1. `008a_admini_invites.sql` — **înaintea** lui `008`, fiindcă repară tabela `admini` (`id` lipsă, `user_id` NOT NULL) de care depind T-S3b și T-S7.
2. `008_security_hardening.sql` — T-S1, T-S3, T-S3b, T-S4, T-S5, T-S6, T-S7, T-S8.
3. `008c_role_isolation.sql` — D11.
4. `008d_public_writes.sql` — D14. **Fără acest pas, `008e` nu are obiect**: până la el, `anon` nu putea scrie nimic, deci limitarea din `limiteaza_cereri()` nu se putea declanșa niciodată.
5. `008e_anti_spam.sql` — D15.
6. `008_verify.sql` — **read-only**, interogări V1…V13. Nu modifică nimic.

`008_preflight.sql` și `008_preflight_2fa.sql` sunt interogări read-only de măsurare, nu migrări.

`008_security_hardening_rollback.sql` (secțiuni R-1…R-8) este disponibil dacă ceva merge prost. ⚠️ R-6, R-7 și R-8 **reintroduc** riscul pe care le-au închis; sunt marcate în fișier.

---

# Etapa 1 — SQL (`1b4a757`)

Toate cele 5 fișiere sunt în `supabase/migrations/`.

## T-S1 — politică `admin_claim_invited` eliminată

**Simptom.** Politica permitea oricărui rând autentificat să facă `UPDATE` pe orice coloană a tabelei `admini`, deci un `viewer` își putea promova singur la `owner`.

**Fix.** `DROP POLICY IF EXISTS admin_claim_invited ON public.admini;` + `COMMENT ON POLICY admin_select_invited` care explică singura cale de revendicare: funcția `claim_admin_invite()` (`SECURITY DEFINER`).

**De ce funcția e suficientă.** Ea scrie doar `user_id` pe rândul cu `rol IS NULL` și cu emailul potrivit, ca `anon`/`authenticated`, ca `definer`. RLS nu poate compara o coloană cu alta, deci alternativa „politiciă pe `rol IS NULL`" ar bloca și operațiunile legitime ale unui owner deja înscris.

**Dovadă.** `grep -c admin_claim_invited 008_security_hardening.sql` → apare doar în DROP și în comentariul explicativ; rollback-ul îl recrează în varianta restrânsă (R-8).

## T-S2 — AAL2 în SQL: **AMÂNAT, cu excepție deliberată**

**De ce nu.** `admin_rol()` și `is_admin()` intră în evaluarea practic a fiecărei politici RLS. Dacă impunem `(auth.jwt()->>'aal') = 'aal2'` **înainte** ca toți administratorii să aibă TOTP înscris, orice cont fără 2F ar primi `[]` peste tot și n-ar mai putea nici să ajungă în panoul de configurare a 2FA. Blocajul e exact invers celui dorit.

**Ce s-a făcut în schimb.** Verificarea rămâne în UI, în `auth.js` (`verifyAdminStatus` → `verifyAdminStatus` cu `aal2` înainte de `showCmsDashboard()`). `008_security_hardening.sql` conține un bloc de comentariu care explică motivul și indică fișierul de activare.

**`admin_select_invited` nu depinde de `admin_rol()`.** De aceea loginul continuă să funcționeze: rândul de invitat rămâne lizibil prin politică, iar `claim_admin_invite()` merge prin `SECURITY DEFINER`.

**Când se aplică.** `supabase/migrations/008b_enforce_aal2.sql` — doar după ce **100% din conturile de administrator au TOTP înscris și testat loginul complet**, și cu un owner de rezervă, cu sesiune directă în SQL Editor ca `postgres`. `008b_enforce_aal2_rollback.sql` readuce variantele din `001`.

## T-S3 — politici `storage.media_*` restaurate

**Simptom.** `006_media_policies.sql:34-47` rescrisese cele trei politici ca `TO authenticated` fără nicio condiție de rol. Orice utilizator autentificat putea șterge sau înlocui orice fișier din bucket.

**Fix.** Reaplicate variantele stricte din `004`, fără valoarea `'admin'` (rol eliminat la T-S3b):

| Politică | Cui | Condiție |
|---|---|---|
| `media_read` | `public` | `bucket_id = 'media'` |
| `media_insert` | `authenticated` | `admin_rol() IN ('owner','editor')` |
| `media_update` | `authenticated` | `admin_rol() IN ('owner','editor')` |
| `media_delete` | `authenticated` | `admin_rol() = 'owner'` |

**Dovadă.** `008_verify.sql` V3 listează cele patru politici cu `qual` și `roles`, de verificat după aplicare.

## T-S3b — rolul `admin` eliminat (task adăugat, decizia A3)

**Simptom.** `001_roles_and_visibility.sql:24` permitea `rol IN ('owner','editor','viewer','admin')`, iar `is_admin()` din `001:34-45` nu includea `'admin'` în lista verificată. Deci un cont cu rolul `'admin'` trecea drept neadmin la RLS, dar apărea drept „admin" în interfață — un rol care nu face nimic.

**Fix.** Două pași, în ordine:
1. `UPDATE public.admini SET rol = 'editor' WHERE rol = 'admin';` — conversie, nu ștergere, ca niciun administrator existent să nu-și piardă accesul.
2. `DROP CONSTRAINT admini_rol_check` + `ADD CONSTRAINT admini_rol_check CHECK (rol IN ('owner','editor','viewer'))`.

**⚠️ Verifică înainte de aplicare:** `SELECT rol, count(*) FROM public.admini GROUP BY rol;` și notează rezultatul. Dacă vreun rând are altceva în afară de cele trei roluri, `ADD CONSTRAINT` va eșua cu `23514`.

**Rolul `'admin'` a fost eliminat din codul JS**, nu doar din SQL: `roles.js:105` (ramura care transforma `admin` în badge „Owner"), `media.js:215` (`isOwner = rol === 'owner' || rol === 'admin'`) și catalogul RLS fals din `coder.js` (șters la T-J10).

## T-S4 — `anon_select_membri` / `anon_select_stiri` eliminate

**Simptom.** `001_roles_and_visibility.sql:87-88, 122-123` permiteau citirea publică **integrală**, fără `deleted_at IS NULL`. Orice rând arhivat (intrare în coș) era încă descărcabil public prin REST, cu adresa de e-mail și numărul de telefon.

**Fix.** Ambele politici `DROP`. Cele corecte există deja: `stiri_citire_anonim` (`publicat = true AND deleted_at IS NULL`) și `membri_citire_anonim` (`afisare_publica = true AND deleted_at IS NULL`) din `002:229-236`.

**Dovadă.** `008_verify.sql` V1 și V2: contorul de politici `anon` pe `membri`/`stiri` trebuie să fie 0.

## T-S5 — `setari` anonim limitat la allowlist

**Simptom.** `002_content_tables.sql:127` folosea `USING (true)`. Tabela conține inclusiv chei confidențiale — de exemplu `contact_email_notificari`, adresa de expediere a formularului.

**Fix.** Recreate cu allowlist:

```sql
USING (cheie IN ('organizatie', 'ghid_aderare', 'telemetrie_sector1')
       OR cheie LIKE 'pagina\_%' ESCAPE '\')
```

**De ce lista e completă.** `script.js:2960-2971` citește doar `organizatie`, `ghid_aderare`, `telemetrie_sector1` și orice `pagina_*`. Nu e nevoie de nimic altceva.

**`pages.js` nu e afectat:** citește paginile ca `authenticated` (`pages.js:208-211`).

**Dovadă.** `008_verify.sql` V10 compară `contact_email_notificari` (așteptat 0 rânduri) cu cheile din allowlist. Testul manual #1 confirmă prin REST.

## T-S6 — `get_table_rls_policies()` devine funcție de administrator

**Simptom.** `005_rls_diagnostics.sql:25-52`: funcție `LANGUAGE sql` fără nicio verificare de rol, `SECURITY INVOKER` implicit. Orice rol putea citi catalogul complet de politici — hartă exactă a ce e permis și pe ce tabele.

**Fix.** Rescrisă ca `plpgsql SECURITY DEFINER`:

```sql
IF NOT public.is_admin() THEN
  RAISE EXCEPTION 'forbidden: functia este rezervata administratorilor'
    USING ERRCODE = '42501';
END IF;
```

Plus: alias de coloană `p.` pentru a evita ambiguitatea `schemaname` dintre variabila de buclă și coloana `pg_policies`; domeniu extins la `('public','storage')` (storage avea politici stricte, invizibile până acum); `REVOKE ALL FROM PUBLIC, anon, authenticated` + `GRANT EXECUTE TO authenticated`.

**Dovadă.** `008_verify.sql` V11 — apelul RPC cu token non-admin trebuie să întoarcă `42501`. Testul manual #10 confirmă prin REST.

## T-S7 — trigger anti pierdere ultim owner

**Simptom.** Fără nicio protecție, un owner putea să își schipe rolul sau să fie șters, lăsând baza fără niciun `owner`. Nu mai exista nimeni care să modifice rânduri sau să acceseze consola dezvoltator.

**Fix.** `prevent_last_owner_loss()` + `trg_prevent_last_owner_loss`, `BEFORE UPDATE OR DELETE ON public.admini`. Eșuează dacă rândul afectat e un `owner` activ și ar rămâne mai puțin de un `owner` activ. Operațiile în masă (`UPDATE admini SET activ = false`) trec — declanșează o singură verificare la final.

**Mesajul ajunge în toast curat.** E un `RAISE EXCEPTION` plpgsql, deci `error.code` e `P0001`. `describeDbError` din `lib/db.js` face passthrough verbatim pentru `/^P0\d+$/`, în loc să-l înlocuiască cu mesajul generic.

**Dovadă.** `008_verify.sql` V8 listează trigger-urile pe `admini`. Testul manual #9 confirmă cu un owner real.

## T-S8 — `image/svg+xml` scos din bucket

**Simptom.** `006:21,26` permitea `image/svg+xml`. Un SVG e un document XML care poate conține `<script>`. Servit din aceeași origine ca aplicația, e XSS stocat. (Restricția din client, `media.js:77`, se putea ocoli prin upload direct prin REST.)

**Fix.** `allowed_mime_types = ARRAY['image/webp','image/jpeg','image/png','application/pdf']`.

**Dovadă.** `008_verify.sql` V9 afișează `allowed_mime_types`.

---

# Etapa 2 — Panou (`admin/js`)

Regulă strictă respectată: **zero `innerHTML` în `admin/js`**. Cele 4 potriviri textuale sunt în comentarii/doc-blocks (`dom.js:2`, `pagination.js:2`, `toast.js:2`, `faq.js:98`). Zero `eval(` / `new Function(`.

## T-J1 — `updateNewsImageLivePreview` neimportat (`6d2753e`)

**Simptom.** `main.js:447, 531, 541` apeleau funcția, dar blocul de import din `./ui/media.js` nu o includea. La deschiderea paginii de editare a unei știri cu imagine: `ReferenceError`, previzualizarea nu se actualiza.

**Fix.** Funcția adăugată în import, cu un comentariu `// T-J1:` care indică exact cele trei linii de apel.

**Dovadă.** `npm run test:syntax` → 30/30 OK după schimbare.

## T-J2 — scrieri „fantomă" (`50763e8`)

**Simptom, cel mai grav din toată lista.** În PostgREST, `.update()` / `.delete()` **fără** `.select()` răspund `{ data: null, error: null }` chiar dacă RLS a blocat scrierea. Codul verifica doar `if (error)`, deci UI-ul afișa „salvat cu succes" de fiecare dată când RLS respingea operația. Un `viewer` vedea confirmări de salvare pentru modificări care nu se produseseră.

**Fix — `admin/js/lib/db.js`, fișier nou:**

| Export | Rol |
|---|---|
| `writeRows(request, {context, expect})` | înconjoară un builder PostgREST, întoarce mereu `{data, error}`. **Dacă `data === null`, sintetizează eroarea `NO_SELECT`** — astfel orice apel fără `.select()` eșuează vizibil, nu tăcut. |
| `assertRows(data, expect, context)` | aruncă `DbWriteError` cu cod `NO_ROWS` dacă `data.length !== expect`. |
| `describeDbError(error, fallback)` | mapează codurile PG la mesaje românești; **passthrough verbatim pentru `/^P0\d+$/`** (mesajele plpgsql `RAISE`, ex. trigger-ul T-S7). |

`MESSAGES_BY_CODE`: `23505` unic, `23503` FK, `23514` check, `42501` RLS, `22P02` text invalid, `PGRST116` negăsit, `NO_ROWS`, `NO_SELECT`.

**Sunt aplicate `writeRows` + `.select(...)` în 13 fișiere** — `bulkbar` (4 operații în masă, `expect: ids.length`), `coder`, `documents`, `faq`, `leadership` (6 fiecare, cu reordonarea împărțită în `errUp`/`errDown` care aruncă), `history`, `members` (7, import CSV cu `expect: pendingCsvImportRows.length`), `news`, `pages` (2 `upsert`, `.select('cheie')` **după** `.upsert(payload, {onConflict})`), `requests`, `roles`, `settings`, `trash`.

`handlePurgeOldTrash` numără acum ștergerile reale și raportează un `failed[]` în loc să afișeze un succes generic.

**Deliberat neatinse, cu motiv:**
- **Insert-urile în `audit_log`** — tabela are politică doar `SELECT`, deci `.select()` pe un insert ar întoarce mereu vid și ar genera un `NO_ROWS` fals.
- **Fallback-ul de revendicare din `auth.js`** — eliminat la T-J3, oricum.

**Dovadă.** `grep -c "writeRows(" admin/js/views/*.js` → fiecare fișier listat conține apeluri; `lib/db.js` e în `npm run test:syntax` (31/31 după adaugare).

## T-J3 — flux de autentificare (`c38238b`)

**3.1 `main.js:948` — `await` în `onAuthStateChange`.** Supabase blochează clientul în timpul callback-ului, iar orice operație async acolo produce deadlock. Callback-ul e acum sincron: `SIGNED_OUT` → `showAuthStep('login')`; altfel, dacă `state.user.id === session.user.id`, ieșire imediată (eveniment redundant), iar munca reală e amânată cu `setTimeout(…, 0)`.

**3.2 `auth.js` — fallback-ul `.ilike('email', …).update({ user_id })` eliminat.** Era cod mort după T-S1 (RLS l-ar bloca oricum) și era periculos: `'ilike'` tratează `%` și `_` ca metacaractere, deci `maybeSingle()` ar fi putut potrivi rândul **altui** administrator. Singura cale e `client.rpc('claim_admin_invite')`.

Eroarea ei nu mai e înghițită într-un `try/catch` gol: ajunge într-un `#unauthorized-detail` nou în `admin/panou.html`, cu `textContent` și `class="feedback-banner error"` (clasa există deja în `panel.css:469`). `showAuthStep(stepName, detailMessage)` a primit al doilea parametru.

**3.3 `verifyAdminStatus` — `Promise.all` → `Promise.allSettled`.** `Promise.all` propaga prima respingere într-un `catch` care apela `client.auth.signOut()`. Un singur modul lent sau cu o eroare trânta logout unui administrator valid. Acum: `LOADER_LABELS = ['Cereri de înscriere', 'Membri', 'Știri', 'Statistici vizite']` și un toast de avertizare care listează secțiile care nu au putut încărca.

**3.4 Canale idempotente.** `initAdminLivePresence` (`telemetry.js:559`) și `initRealtimeRequestsListener` (`requests.js:476`) aveau deja `if (state.<x>Channel) return;` la început. Verificat, nimic de schimbat; s-a adăugat un comentariu la punctul de apel.

**3.5 `state.js` rescris, `resetState()` nou.** `createInitialState()` întoarce întregul store (colecții, cele 6 `Set`-uri de selecție masivă, paginare, filtre, canale, stare trash/media/pagini; `uiMode` se recitește din `localStorage`). `resetState()` păstrează `uiMode` și face `Object.assign(state, createInitialState())`.

`handleSignOut` elimină **ambele** canale realtime prin `client.removeChannel` **înainte** de reset — altfel referințele ar fi anulate înainte de dezabonare. Apoi resetează complet store-ul: setări, conducere, FAQ, documente, administratori, coș, media și selecțiile masive nu mai supraviețuiesc pe un browser partajat.

Contractul e documentat în antetul fișierului: niciun modul nu ține o referință de lungă durată de tip `const s = state.selectedMemberIds`. Verificat prin grep — toate accesările merg prin `state.*`, deci înlocuirea obiectelor `Set` e sigură.

**Dovadă.** `npm run test:syntax` 31/31, `npm run test:data` 10/10. `#unauthorized-detail` prezent în `panou.html`.

## T-J4 — view Roluri (`dd093d0`)

**4.1 `isSelf(admin)`.** `state.user.id === admin.user_id` în primul rând, apoi comparație case-insensitive pe email cu `state.adminRecord.email`. Folosit pentru `(Contul tău)` și ca blocaj: nu îți poți schimbi propriul rol, nu îți poți dezactiva contul, nu îți poți șterge contul.

**4.2 `confirm()` înainte de schimbarea rolului**, cu un paragraf suplimentar care listează capabilitățile Owner dacă se intră sau se iese din `owner`. `confirm()` și la dezactivare și la reactivare.

**4.3 `loadAdmins()` mutat în `finally`.** La eroare, `select` revenea la valoarea optimistă, nu la cea din baza de date. Acum revine la valoarea reală indiferent de rezultat — success, eroare sau anulare.

**4.4 `handleSaveNewAdmin`.** Butonul de submit avea **doi** ascultători în `main.js` (delegare pe form `submit` + `click` pe buton), deci funcția se executa de două ori. Adăugat `isSavingAdmin` + dezactivare sincronă a butonului, cu eticheta restaurată din `dataset.originalLabel` în `finally`. `includes('@')` înlocuit cu `EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`. Codul `23505` dă mesajul „Acest email este deja înregistrat ca administrator."

**4.5 Rolul `admin` eliminat din UI.** `ROLES = ['owner','editor','viewer']` e singura sursă; `select`-ul se construiește din ea. Ramura `admin → badge Owner` a dispărut; o valoare necunoscută afișează `⚠️ necunoscut: ${rol}` în loc de a fi tratată ca `owner`. Antetul fișierului corectat.

**4.6 Erorile trigger-ului T-S7** apar în toast ca atare, prin passthrough-ul `P0001` din `describeDbError`.

**Dovadă.** `grep "rol === 'admin'" admin/js` → 0 potriviri.

## T-J5 — view Coș (`4bd8300`)

**5.1 Coloană inexistentă.** `trash.js:50` citea `s.data` pe rândurile din `stiri`. Nu există — coloana e `data_publicare`. `undefined` trecea în formatare ca „Invalid Date".

**5.2 Eroare per categorie ascunsă.** `Promise.all` peste 5 interogări, cu `error` verificat pe fiecare. PostgREST **nu aruncă** la `.error` — un tabel refuzat (RLS) producea pur și simplu un coș gol, fără niciun indiciu că o categorie nu s-a încărcat. Acum: `failedTrashSources` + `failedTables`, toast nominalizat, iar în listă apare un paragraf roșu `⚠️ Nu s-au putut încărca categoriile: …` — sau, dacă lista e goală, mesajul spune care categorii au eșuat.

`handleRestoreTrashItem` și `handleConfirmPurge` validează tabelul înainte de `.from()` (allowlist local), iar `handlePurgeOldTrash` iese cu un toast informativ când nu e nimic de șters.

**Notă de stil.** Clasa `.text-error` nu există în `admin/css`, deci cularea e inline: `color: var(--error, #ef4444)`.

**Dovadă.** `grep -n "s\.data_publicare\|data\.data\b" admin/js/views/trash.js`.

## T-J6 — `handleSyncDefaultNews` (`e9b2238`)

**Simptom.** Fiecare apăsare insera din nou cele 9 articole oficiale, fără verificare. Butonul era o mașină de duplicate.

**Fix.** Citește `titlu` din `stiri` — **deliberat fără** `.is('deleted_at', null)`, ca un articol arhivat să nu fie reintrodus. Normalizează titlurile (`trim` + `lowercase`) într-un `Set`, calculează `missing` și `alreadyThere`. Dacă `missing` e gol: toast informativ + `loadNews()`, fără `confirm`. Altfel `confirm()` cu numere reale (lipsă, existente, total rânduri) și inserează **doar** `missing`, cu `expect: missing.length`.

**Dovadă.** `git show e9b2238 --stat` — modifică doar `news.js`.

## T-J7 — linkuri nesigure (`3797830`)

**Simptom.** Câmpuri de link ajungeau direct în `href` pe site-ul public: `link_actiune`, `fisier_url`, `foto_url`, plus 4 linkuri din paginile editabile. `javascript:` într-un `href` e XSS stocat, executat la clicul unui vizitator.

**Fix — `admin/js/lib/format.js`:**

| Export | Rol |
|---|---|
| `isSafeHref(url)` | gol → `true`; curăță `[\u0000-\u0020\u007F]+` (ignoră spațiile și caracterele de control ascunse); testează `/^([a-z][a-z0-9+.-]*):/i`; fără schemă → `true` (URL relativ, sigur); cu schemă → trebuie în `['http','https','mailto','tel']`. |
| `unsafeHrefMessage(label)` | mesajul de eroare, cu eticheta câmpului. |
| `checkHrefField(value, label)` | întoarce mesajul sau `null`. |

Punctele de apel se opresc **înainte de scriere** și pun focus pe input: `news.js` (`link_actiune`), `documents.js` (`fisier_url`), `leadership.js` (`foto_url`), `pages.js` (`PAGE_LINK_FIELDS` + `validatePageLinks`, apelată imediat după `gatherCurrentPagesPayload`).

`PAGE_LINK_FIELDS` acoperă `acasa` → `heroBtnSecondaryLink`, `despre` → `statutPdfUrl`, `membri` → `cardBtnSecondaryLink`, `evenimente` → `link1` din fiecare eveniment.

**`documents.js:94` — URL-uri absolute stricate.** `href: '../${doc.fisier_url}'` transformă `https://exemplu.ro/x.pdf` în `../https://exemplu.ro/x.pdf`. Acum: `isAbsoluteDocUrl = /^(https?:)?\/\//i.test(...)` → se folosește ca atare, altfel se prefixează cu `../`. Deci `documents.js:84-87`.

`imagine_url` din `news.js` nu are nevoie de verificare nouă: e deja limitată de `isValidImageUrl` existentă (doar `https://` sau `ugr-images/`).

**Dovadă.** `grep -n "checkHrefField" admin/js/views/*.js` → `news`, `documents`, `leadership`, `pages`.

---

# Etapa 3 — Site public și supply chain

## T-J8 — cele 13 câmpuri neconsumate (`b3f2708`)

**Simptom.** Panoul salva corect, site-ul ignora. 12 câmpuri în tab-ul **Contact**, plus `bankName` — care e în tab-ul **Membri** (`pages.js:174`), nu în Contact. `applyCustomPageData` consuma 9 din cele 21 de câmpuri de contact.

| Cheie | Cheie |
|---|---|
| `addressAcademic` | `addressCentral` |
| `contactPresidentPhone` | `contactEmailLocal` |
| `contactSecretaryPhone` | `contactCentralPhone` |
| `contactCotizatiiPhone` | `contactCentralEmail` |
| `triageLocalPhone` | `triageLocalEmail` |
| `triageCentralPhone` | `triageCentralEmail` |
| `bankName` (tab Membri) | |

**Soluție: `data-cp`, nu rescriere.** Fiecare valoare editabilă din `index.html` poartă acum `data-cp="<cheie>"`, iar **textul implicit rămâne în markup**. Dacă `script.js` eșuează sau câmpul e gol, vizitatorul vede în continuare datele de azi, nu goluri.

Detalii delicioase rezolvate pe parcurs:
- **Butoanele de copiere** aveau numărul de telefon înscris în atributul `onclick` (`copyToClipboard('0726390774', …)`). Acum folosesc `this.dataset.cpPhone` / `this.dataset.cpLabel`, deci schimbarea numărului în panou schimbă și ce se copiază.
- **Cardul central** nu avea niciun buton de telefon, deși `triageCentralPhone` era editabil. A fost adăugat unul, cu stilul auriu al cardului local.
- **Banca** — `data-cp` pe `<span>`, **nu** pe `<b>`, pentru că selectorii existenți `#m-cotizatii-block .m-cotizatii-bank b` și `em` continuă să gestioneze IBAN-ul și destinația.

**`script.js` — 6 helperi noi**, așezați imediat înaintea lui `applyCustomPageData`: `cpDigits`, `cpPhoneChunks` (separă pe `/`, `,`, `;`, `|`), `cpSetText`, `cpSetTel` (reconstruiește copiii cu `createElement` + `createTextNode(' / ')`, `href='tel:'+digits`), `cpSetMail` (validează formatul, setează `href` doar dacă elementul e `<a>`), `cpSetCopyChip` (scrie `textContent` **și** `dataset` împreună, ca eticheta și valoarea copiată să nu se desincronizeze). Tot prin `textContent` / `createElement`, niciodată `innerHTML`. Valoare goală sau malformată → default-ul din markup rămâne.

`cpSetText('bankName', …)` a fost adăugat la finalul ramurii `pagina_membri`, lângă `bankIban` / `bankPurpose` existente.

**Text de ajutor în panou** (`cc0f8ee`): „Câmp gol = se păstrează textul implicit al site-ului", în tab-urile Membri și Contact, cu nota despre telefoanele multiple și validarea e-mail-urilor.

**Dovadă.** `node scratch/check-page-fields.mjs` → `neconsumate -> []` pentru toate cele cinci tab-uri (acasa 22, despre 18, evenimente 6, membri 42, contact 21). Scriptul e comitat, deci regresia se vede la următoarea rulare.

## T-J9 — XSS stocat (`96fd961`, completat în `cc0f8ee`)

**Simptom.** `renderLeadership`, `renderDocuments`, `renderNews`, `renderEventsTimeline` interpolau direct în șiruri de caractere care ajung în `innerHTML`. Un nume de membru cu `<script>` în el se executa în browserul fiecărui vizitator. `escapeHtml` blochează `<script>`, dar **nu** `javascript:` într-un `href`.

**Fix.** `const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:']` + `safeUrl(url)`, definite imediat înaintea lui `renderLeadership` (funcțiile sunt apelate doar din `DOMContentLoaded` și din fluxuri async, niciodată în timpul evaluării scriptului, deci ordinea e sigură). `safeUrl` curăță spațiile și caracterele de control înainte de testarea schemei, întoarce valoarea brută pentru URL-urile fără schemă (relative) și `''` pentru cele respinse.

| Funcție | Ce s-a schimbat |
|---|---|
| `renderLeadership` | `map` cu `=>` de expresie → corp de bloc. `role`, `name`, `desc` trec prin `escapeHtml`; `<img>` se emite doar dacă `safeUrl(member.image)` e nevid. |
| `renderDocuments` | `format`, `badge`, `title`, `desc` escape-uite; `fileHref = safeUrl(doc.fileUrl) \|\| '#'`, apoi escape. |
| `renderNews` | `actionUrl = safeUrl(item.source.url)`; `targetAttr` depinde de `actionUrl.startsWith('http')`; adresă respinsă → `<span>` cu eticheta, nu un `<a>` care ar părea buton funcțional. |
| `renderEventsTimeline` | același tratament pentru `actionsHtml`. |
| `updateFaqResultsCounter` | `catName` escape-uit (poate cădea pe o valoare din HTML). `href="javascript:void(0)"` a devenit `<button type="button" class="faq-reset-link">` — același efect, fără URL de executat. `style.css` câștigă 6 linii pentru a anula stilarea implicită a butonului. |
| tooltip glob | `${d.labelTitle}` escape-uit. Date din `data.js`, statice și neîncărcate din rețea — apărare în adâncime. |

**`renderFaq` nu a necesitat modificări:** `item.q` și `item.a` trec deja prin `highlightFaqTerms`, care escape-uie înainte de a insera `<mark>`. `item.tag` și `item.category` ajung doar în contorul de rezultate, unde sunt escape-uite acum.

**`applyCustomPageData` — completat în `cc0f8ee`.** `heroBtnSecondaryLink`, `statutPdfUrl` și `cardBtnSecondaryLink` ajungeau în `href` fără `safeUrl`. Panoul le validase la salvare (T-J7), dar site-ul nu trebuie să depindă de validarea dintr-un alt fișier: o valoare veche sau introdusă direct în baza de date ar fi trecut neatentă.

**Dovadă.** `node --check script.js` OK. Scanarea interpolărilor `${item.*}`, `${member.*}`, `${doc.*}` rămase fără `escapeHtml`/`safeUrl` lasă doar linia 1496 (construirea unui șir de căutare, nu markup) și cazul L533/534 deja reparat. Cele 24 atribuiri `innerHTML` rămase în `script.js`: 223/242/258 (telemetrie hartă, text static), 955/959 (buton copiat), 1064 (membri, escape-uit), 1077 (contor numeric), 1652 (toast, escape-uit), 1721/1723 (buton copiat), 1787 (mesaj de eroare, escape-uit), 1837 (confirmare trimitere, escape-uit), 2255 (brand markup static), 2399/2405/2410/2415 (animare per caracter peste text literal).

## T-J10 — health check real, consolă protejată (`9381e1b` + `dcf8afc`)

**10.1 Funcție duplicată.** `supabase.js:20` și `telemetry.js:9` defineau ambele `pingSupabaseHealth`. Cea din `supabase.js` lua cele 3 elemente DOM ca parametri, dar **niciun punct de apel nu le transmitea** — deci nu actualiza nimic. Ștersă, înlocuită cu un comentariu. Rămâne cea din `telemetry.js`, importată de `auth.js:12`, `main.js:56`, `overview.js:9`.

**10.2 Latencies inventate.** `Math.max(12, …)` punea un plafon de 12 ms sub orice valoare reală; `'18 ms'` era o constantă; ramura `catch` afișa „Operațional". Panoul afirma sănătatea unui server care nu răspundea.

Rescris: `GET <url>/auth/v1/health`, `cache: 'no-store'`, antetele `apikey` **și** `Authorization: Bearer`. `GET`, nu `HEAD` — Supabase răspunde `405` la `HEAD` pe această rută, deci un health check cu `HEAD` ar afișa mereu „Indisponibil" pe un server perfect funcțional. Fără plafon. Erou de rețea (`— ms`, „Inaccesibil (fără răspuns)") distinct de răspuns non-OK (`Eroare server (HTTP ${res.status})`). Ambele pun `health-dot err` și un `rtt` real. Adăugat `getLastHealthResult()`.

`admin/css/panel.css` a primit `.health-dot.err` (roșu, `animation: none`) — existau doar `.ok` și `.cyan`.

**10.3 Catalog RLS fabricat.** `getDocumentedRlsCatalog()` era un tablou de 17 rânduri codificate, afișat ca „configurația RLS a proiectului" — și conținea în continuare rolul `'admin'` eliminat. Mai rău: lista falsă apărea exact când accesul era refuzat corect, deci un non-admin vedea politici care nu îi erau accesibile. Ștersă, împreună cu cele două ramuri de fallback. `loadRlsInspector` apelează acum RPC-ul direct și afișează `error.message` la eșec, respectiv „Serverul nu a raportat nicio politică RLS" la tablou gol.

**10.4 Consola dezvoltator, doar Owner** (`9381e1b`). În `auth.js`: `OWNER_ONLY_VIEWS = ['coder']` + `applyRoleUiGates()`, care ascunde `.nav-link[data-view="coder"]`, marchează `dataset.ownerOnly` și mută un non-owner pe `overview` dacă avea deja consola deschisă. `switchView` are ungard la început. `applyRoleUiGates()` rulează după `showCmsDashboard()` în `verifyAdminStatus` (funcția aceea apelează `switchView('overview')` înainte ca rolul să fie cunoscut) și din nou după `resetState()` în `handleSignOut` — altfel linkul ar supraviețui în următoarea sesiune pe un browser partajat. `ui/mode.js` verifică acum `dataset.ownerOnly === 'false'` înainte să deascunde `.advanced-only`, fiindcă scrie `style.display` direct și ar suprascrie starea ascunsă.

**Whitelist și confirmare** (`dcf8afc`). Codarea RLS era singura bariera: un `<select>` modificat din DevTools putea trimite orice nume de tabel către `.update()`, iar salvarea JSON nu cerea confirmare deloc. `EDITABLE_TABLES`, derivat din `AVAILABLE_TABLES`: `handleSaveCoderJson` refuză orice tabel din afara listei. **`admini` nu figurează în `AVAILABLE_TABLES`**, deci nu mai e nici măcar ținta unei erori de nume de tabel. `window.confirm()` explicit înainte de scriere, cu identificatorul rândului. `loadCoderTableData` normalizează numele tabelului. `loadCoderView` verifică rolul și în corpul funcției, nu doar în `switchView`.

**Dovadă.** `grep -c getDocumentedRlsCatalog admin/js/views/coder.js` → 0. `grep "rol === 'admin'" admin/js` → 0.

## T-J11 — pin + SRI (`f095147`)

**Simptom.** `admin/panou.html:9` încărca `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` — fără versiune fixată, fără `integrity`. Un răspuns modificat pe cale sau un incident la CDN ajungea executat cu `anon key` la browserul fiecărui administrator.

**Fix.** Versiunea curentă rezolvată prin API-ul npm: **`2.117.2`**. S-a confirmat că `@2` și `@2.117.2` servesc conținut identic la octet (218237 bytes, același sha512) — deci fixarea nu schimbă nimic din ce se rulează azi.

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2"
        integrity="sha512-4w/AcXbU7AGdxOzJGUPCLrSqlTh+jnM25jQ+wmZByQckoKFyHvA10J9JLEavYV9cfp0JdTxIP6jddakO4xlOGA=="
        crossorigin="anonymous"></script>
```

**`scratch/sri-supabase.mjs`, fișier nou**, calculează hash-ul cu `fetch` → `arrayBuffer` → `crypto.createHash('sha512')` din Node și afișează eticheta gata de copiat. Primește versiunea ca argument.

⚠️ **De ce Node și nu `openssl` / PowerShell.** `openssl` nu e instalat implicit pe Windows. Iar varianta `Invoke-WebRequest` + `GetBytes(text)` e periculoasă: decodificarea ca text și re-codificarea pot schimba un octet (BOM, conversie newline) și produc un hash care nu corespunde niciunui fișier — deci un `integrity` care ar bloca panoul la pornire. Hash-ul calculat în Node a fost verificat în două moduri.

**Fail explicit.** `admin/js/supabase.js` aruncă acum o eroare numită și acționabilă când `window.supabase` e `undefined`. Altfel, un mismatch de `integrity` sau un CDN blocat ar produce un `TypeError` gol la import și un panou complet alb.

**Dovadă.** `node scratch/sri-supabase.mjs 2.117.2` reproduce hash-ul din eticheta de mai sus.

### Extindere pe `index.html` (`fce2157`)

Prima aplicare a acoperit doar `admin/panou.html`, fiind singurul fișier indicat în brief. `index.html` încărca aceeași bibliotecă cu eticheta flotantă `@2` și rămă neatins.

Diferența de context contează: pe panou scriptul rulează doar pentru administratori care au trecut deja de autentificare. Pe `index.html` rulează pentru **orice vizitator, anonim inclusiv**, și alimentează prezența live, membrii, știrile, conducerea, FAQ-ul și formularul de contact. După aplicarea migrării 008 singura apărare rămâne RLS, deci o versiune nouă netestată introdusă automat de CDN s-ar vedea direct în conținutul public.

`index.html` a primit aceeași etichetă, cu același hash reutilizat. Diferența de execuție e zero: `@2` servea oricum `2.117.2` în ziua aplicării.

**Rămas neschimbat, conștient:** `proj4@2.9.0`, `three@0.146.0` și `globe.gl@2.28.3` de la `index.html:1657-1659`. Toate trei sunt deja fixate pe versiune, deci nu se actualizează surpriză — dar nu au `integrity`. Adăugarea SRI pentru ele este o sarcină separată, netestată în această sesiune.

---

# Etapa 4 — Verificare (`cc0f8ee`, `dcf8afc`)

## Teste automate

```
npm run test:syntax   →  Successfully verified 31 JavaScript files in admin/js/!
npm run test:data     →  REZULTAT: niciun check esuat (10 check-uri rulate)
node --check script.js →  OK
```

## Lint

Config **temporară, necomitată**, în `C:\Users\lefpa\AppData\Local\Temp\opencode\eslint.config.mjs` — `eslint@9`, `no-undef: error`, `sourceType: module`, `globals.browser` peste `admin/js`.

```
✖ 0 problems (0 errors, 0 warnings)
```

**Curățat pentru asta:**
- `main.js` — **17 importuri nefolosite** scoase (`showCmsDashboard`, `openEditNewsModal`, `openEditLeaderModal`, `openEditFaqModal`, `openEditDocModal`, `handleRestoreTrashItem`, `openPurgeModal`, `renderAdminsList`, `handleUpdateAdminRole`, `handleToggleAdminActive`, `openItemHistoryModal`, `loadCoderView`, `openCoderJsonEditorModal`, `renderRequestsWithPagination`, `renderLeadershipLists`, `updateNotificationBadge`, `updateCommandPaletteHighlight`). Verificat înainte de eliminare: fiecare e importat și în modulul care îl exportă, iar **niciunul** nu apare în `admin/panou.html` ca atribut inline — deci niciunul nu dispare din UI.
- `pages.js` — `isDirty` locală, scrisă dar necitită. Starea reală e `state.pagesDirty`.
- `sync.js` — `adminData` asignat și niciodată folosit (restul se calculează din `data` direct).
- `settings.js` — importuri `el`/`clearElement` nefolosite, plus `existingTiers`.
- `overview.js` — import `state` nefolosit. `leadership.js` — `setBannerFeedback`/`clearBannerFeedback` nefolosite. `media.js` — `data` nefolosit la upload. `news.js` — `lockVal` nefolosit (`setPhotoLockState` se apelează separat).

## Test de ID-uri

Fiecare `getElementById('x')` din `admin/js` există în `panou.html`, cu trei excepții care sunt **false positive**:

| ID lipsă | De ce nu e bug |
|---|---|
| `cmd-palette-results` | `palette.js`: `getElementById('cmd-palette-results-container') \|\| getElementById('cmd-palette-results')` — primul există |
| `cms-bulk-actions-bar` | `bulkbar.js`: `getElementById('bulk-actions-bar') \|\| ...` — primul există |
| `cms-toast-container` | `toast.js`: `getElementById('cms-toast-container') \|\| getElementById('toast-container')` — al doilea există |

Toate trei sunt fallback-uri de tip „a **sau** b" înaintea ID-ului real. Nu s-au eliminat: sunt defensive, iar `xyz-container` e un ID pe care o versiune viitoare îl poate reintroduce.

## Alte verificări de siguranță

| Verificare | Rezultat |
|---|---|
| `innerHTML` în `admin/js` | 0 utilizări reale (4 potriviri doar în comentarii) |
| `eval(` / `new Function(` în `admin/js` | 0 |
| `setAttribute('href'\|'src')` în `admin/js` | 3, toate benigne: `auth.js:321` (`qr_code` TOTP de la Supabase), `lib/csv.js:24` (blob URL local), `requests.js:229` (`mailto:`/`tel:` construite din `addCell`) |

---

# Decizii deschise

## D1 — AAL2 în SQL (`008b_enforce_aal2.sql`): **amânat, cu excepție deliberată**

Nu e o decizie de „mai târziu", ci una de **secvență**. Impunerea lui `(auth.jwt()->>'aal') = 'aal2'` în `admin_rol()` / `is_admin()` înainte ca toți administratorii să aibă TOTP înscris ar bloca accesul chiar și la panoul de configurare a 2FA — deadlock.

**Condiții de activare, toate obligatorii:**
1. 100% din conturile de administrator au TOTP înscris.
2. Loginul complet a fost testat cu 2F activ, de cel puțin două ori, pe dispozitive diferite.
3. Există un owner de rezervă, cu acces SQL direct.
4. Migrarea se rulează din SQL Editor ca `postgres`, nu din aplicație.
5. Se rulează întâi `008b_enforce_aal2_rollback.sql` într-o fereastră de test, ca să fie confirmat că readucerea e la un clic distanță.

`admin_select_invited` nu depinde de `admin_rol()`, deci loginul rămâne funcțional. Restul blocării rămâne în UI, în `auth.js`.

## D2 — „Programat" nu însemna viitor — **REPARAT**

`publicat = true` cu `data_publicare` în viitor făcea știrea **imediat vizibilă** pe site.

**Cauza.** Interogarea din `script.js:2965` filtra doar după `publicat` și `deleted_at`. Nu exista criteriu pe `data_publicare` nici în interogare, nici în politica RLS: `stiri_citire_anonim` este `publicat = true AND deleted_at IS NULL`. Câmpul de dată exista, era editabil din panou, și nu avea niciun efect.

**Demonstrație pe date reale**, măsurată la 8 octombrie 2026: baza conținea o știre cu `data_publicare = 2026-11-11` și `publicat = true`, adică programată cu peste o lună, vizibilă pe site în acel moment.

**Corectura**, o singură condiție în interogare:
```js
.or(`data_publicare.is.null,data_publicare.lte.${azi}`)
```
PostgREST combină filtrele de tipuri diferite cu `AND`, iar condițiile din `.or()` între ele cu `OR`, deci rezultatul este `publicat = true AND deleted_at IS NULL AND (data_publicare IS NULL OR data_publicare <= azi)`. Valoarea nulă e tratată explicit, ca un articol fără dată să nu devină invizibil.

**De ce data locală, nu `toISOString()`.** `data_publicare` e o coloană de tip `date`, nu de tip timestamp — răspunsul PostgREST o serializează `2026-11-11`, nu cu oră și zonă. `toISOString()` ar produce `2026-10-08T23:59:59Z` pentru ora 01:59 din București, iar Postgres ar compara cu 00:00:00Z, ascunzând articolele programate pentru ziua curentă. Helperul `formatLocalDateRo()` construiește `YYYY-MM-DD` din componentele locale.

**Decizia e în server, nu în panou.** Nu s-a adăugat validare care să interzică bifarea lui `publicat` înainte de dată: regula stă în interogare, deci orice consumator respectă programarea. Panoul continuă să arate articolele programate, fiindcă interogarea lui nu are acest filtru.

**Verificat pe server:** cu filtrul, 9 articole; fără, 10. Dispărea exact articolul din 11 noiembrie.

## D3 — Retenție `audit_log` — **REPARAT** (`008f`)

### ⚠️ Corecție: afirmația anterioară era falsă

Prima versiune a acestei secțiuni spunea că `audit_log` păstrează pentru membri *nume, email, telefon, CNP și IBAN*. **Nu e adevărat.** Măsurarea coloanelor din `information_schema` arată că `public.membri` are exact 11 coloane:

```
id, nume, judet, serie_autorizatie, categorie, status,
afisare_publica, created_at, updated_at, demonstrativ, deleted_at
```

Nu există email, telefon, CNP sau IBAN. **Sistemul nu stochează date de contact per membru.** Singurele date de contact ale oamenilor stau în `cereri_inscriere` — tabel care **nu** are `audit_trigger`, ci doar `log_admin_action`, jurnalul care scrie numele coloanelor modificate, fără valori. Deci cererile nu ajung copiate integral în `audit_log`.

### Ce date personale există efectiv în `audit_log`

`audit_trigger` e atașat la 7 tabele. Dintre ele, cele cu date personale:

| Tabel | Coloane cu PII | Expunere reală |
|---|---|---|
| `membri` | `nume`, `serie_autorizatie` | **redimensionate de `008f`** |
| `admini` | `email` | **redimensionat de `008f`** la dezactivare |
| `leadership` | `nume`, `telefon`, `email` | **neatinse** — sunt publicate pe site prin `leadership_citire_anonim`; a le redimensiona ar distruge jurnalul fără să elimine vreo expunere |
| `documente`, `faq`, `stiri`, `setari` | — | conținut de conținut, nu PII |

### Decizia aplicată

> Păstrează datele personale cât timp persoana este membru. Redimensionează când nu mai este.

„Nu mai este membru" = `status <> 'activ'` **sau** `deleted_at IS NOT NULL` **sau** rând șters definitiv. Pentru membri, interfața permite doar trei statusuri (`activ`, `suspendat`, `inactiv` — `admin/panou.html:2160-2164`). `suspendat` e tratat la fel ca `inactiv`: un membru temporar suspendat poate reveni, dar numele lui rămâne în jurnal până la o decizie explicită de mai departe. Mai protector, nu mai puțin.

### Redimensionare, nu ștergere

| Coloană | Înainte | După |
|---|---|---|
| `membri.nume` | `'Ion Popescu'` | `'[redat:3f9a1c02]'` |
| `membri.serie_autorizatie` | `'UGR-0123'` | `'[redat]'` |
| `membri.judet`, `categorie`, `status`, `afisare_publica`, `demonstrativ`, `created_at`, `updated_at` | — | **neatinse** |
| `audit_log.tabel`, `actiune`, `rand_id`, `ts` | — | **neatinse** |

Jurnalul rămâne folosibil: se poate răspunde „ce s-a întâmplat cu acest membru" fără a mai ști cum îl cheamă.

**Pseudonimul se calculează din `id`, nu din nume.** Un `md5(nume)` ar fi tot date personală — spațiul de căutare al numelor românești e suficient de mic încât un dicționar să-l inverseze. `id` nu e PII și e deja prezent în `rand_id`.

**Lista e de „ce eliminăm", nu de „ce păstrăm"**, ca o coloană nouă adăugată acum la `membri` să treacă automat în jurnal, nu să fie uitată.

### Detalii de implementare care contează

- **Ordinea declanșatorilor.** Redimensionarea trebuie să ruleze *după* `audit_membri`, ca rândul nou să existe deja. PostgreSQL ordonează declanșatorii alfabetic, deci numele începe cu `trg_` (`audit_membri` < `trg_redact_membri_pii`). Un nume de forma `aaa_…` ar rula primul și ar lăsa neatins exact rândul tocmai scris. Interogarea V3 din `008f` există tocmai ca să prindă asta.
- **Test pe starea curentă, nu pe tranziție.** Declanșatorul redactează dacă rândul *acum* nu mai e membru activ, nu doar dacă tocmai a schimbat. O redactare ratată se repară singură la urmatoarea editare, în loc să depindă de faptul că declanșatorul a vazut tranziția exactă.
- **`rand_id` pentru `admini` e `id`, nu `user_id`.** `audit_trigger` folosește `to_jsonb(NEW)->>'id'`, iar după `008a` coloana `id` există și e cheia primară, `user_id` fiind nullable.
- **Idempotență.** Condiția `NOT LIKE '[redat%'` face ca rândurile deja redimensionate să nu fie atinse din nou.
- **Odată redimensionat, rămâne redimensionat.** Nu există cale de întoarcere: pseudonimul nu poate fi inversat. N-ar fi corect să se pretindă că revenirea la `activ` restaurează numele.
- **SECURITY DEFINER** pe declanșatoare, fiindcă `audit_log` are `revoke insert, update, delete from authenticated` și RLS activ. Fără `DEFINER`, declanșatorul ar eșua.

### Istoricul deja acumulat NU e atins

Migrarea nu rescrie rândurile existente. Redimensionarea istoricului e o operație deliberată, cu rezultat asumat, nu un efect secundar al unei migrări: cineva trebuie să știe ce devine ireversibil înainte să se întâmple. Interogarea de inventar e în `008f`, secțiunea 4.

### Rollback

Oprește redimensionarea viitoare. **Nu poate readuce numele deja redimensionate.** Ce s-a pierdut, s-a pierdut.

## D4 — Politicile lipsă din repo

`cereri_inscriere`, `vizite` și `evenimente` n-au politici versionate — Faza 2 nu are SQL în repo. `cereri_inscriere` nu are RLS activ deloc, doar `GRANT`-uri în `fix_permissions_and_owner.sql:13`. Recomandare: exportă un `000_baseline_policies.sql` din baza live, ca starea reală să fie în versionare și nu doar pe server.

## D5 — Invitarea unui administrator nou

Cu `shouldCreateUser: false`, un email care nu există încă în `auth.users` nu poate primi magic link. Soluția corectă e o Edge Function cu `auth.admin.inviteUserByEmail` (service role). **Nu implementat, după cum s-a cerut.**

De verificat în Supabase Auth: „Allow new users to sign up" = **OFF**, „Confirm email" = **ON**.

**Confirmat prin test live** (`POST /auth/v1/signup`, atât cu email existent, cât și cu email nou):
```json
{"code":422,"error_code":"signup_disabled","msg":"Signups not allowed for this instance"}
```

Configurația e corectă pentru securitate, dar are o consecință operațională: **un administrator invitat nu își poate crea singur contul.** Ca să intre în panou, contul trebuie creat din Supabase Dashboard → Authentication → Users → Add user, cu „Auto Confirm User" bifat. Alternativa e activarea temporară a signup-ului, care ar deschide o fereastră în care orice vizitator care află URL-ul proiectului poate crea conturi.

## D6 — CSP pentru panou

`admin/panou.html` are mult JavaScript inline. Tratat separat de T-J11, care a rezolvat doar supply chain-ul bibliotecii.

## D7 — Rollback-ul T-S3 reintroduce riscul

`008_security_hardening_rollback.sql` R-6 restaurează politicile **deschise** pe storage, R-4 `USING (true)` pe `setari`, R-5 politicile anon fără `deleted_at`. Sunt fișierul de siguranță, nu o opțiune de rollback curentă. Dacă R-6 ajunge în producție, Q4-ul devine „cine poate șterge fișiere din bucket".

## D8 — `main.js`: doi ascultători pe butonul de submit — **REPARAT** (`8cda38d`)

La T-J4 s-a constatat că `main.js:834-835` atașează `handleSaveNewAdmin` atât pe `submit`-ul formularului, cât și pe `click`-ul butonului, deci handlerul se execută de două ori. Gardul `isSavingAdmin` din `roles.js` masca simptomul, dar cauza de bază era încă în `main.js`.

**Scanarea tuturor celor 10 butoane `type="submit"` din panou a găsit trei, nu unul:**

| Formular | Handler | Gravitate |
|---|---|---|
| `form-news` | `handleSaveNews` | **negardat — articol nou = două INSERT = duplicat în `stiri`** |
| `form-update-password` | `handleUpdatePassword` | negardat, două cereri de modificare parolă |
| `form-add-admin` | `handleSaveNewAdmin` | mascat de `isSavingAdmin`, dar două cereri |

Reparat prin eliminarea celor trei ascultători `click` și a celor trei `const` nefolosite. Cazul `form-news` era cel mai grav și nu avea nicio protecție.

## D9 — Ordine `applyCustomPageData` vs `renderEventsTimeline` — **REPARAT** (`d2b2b3d`)

Raportat inițial **fără modificare de comportament**, conform cerinței. Ulterior reparat.

Ambele ating `.events-timeline-item`, prin mecanisme diferite:
- `applyCustomPageData('pagina_evenimente')` scrie `textContent` **pornind de la index** pe nodurile existente din `#view-evenimente`.
- `renderEventsTimeline()` face `axis.innerHTML = ...`, **construind de la zero** din `ugrData.newsList` (tabela `stiri`).

Ordinea e determinată de `DOMContentLoaded`: `renderNewsBento()` → `renderEventsTimeline()` (liniile 2299-2300, date statice), apoi `loadNewsFromSupabase()` (care re-randează din `stiri`) și `loadContentFromSupabase()` (care aplică `pagina_*`) — **ambele asincrone, în ordine de apel**.

Deci: dacă `stiri` se încarcă **înainte** de `setari`,Timeline-ul din `stiri` umple nodurile, `applyCustomPageData` suprascrie primele N pe index. Dacă `setari` ajunge primul, `renderEventsTimeline` șterge tot ce a scris `applyCustomPageData`. **Câștigă cel care termină ultimul — ordine nedeterminată între două `await`-uri fără sincronizare.**

În `index.html` există 6 `.events-timeline-item`, iar panoul trimite 6 elemente `events` — astăzi numerele se potrivesc. Dacă panoul va avea mai multe evenimente decât știri publicate, `applyCustomPageData` le va ignora în tăcere (bucla `if (eventNodes[idx])`).

**Recomandarea inițială a fost:** un singur punct de randare pentru timeline. **Implementată în `d2b2b3d`.** `applyCustomPageData('pagina_evenimente')` memorează acum valorile în `eventPanelOverrides` și apelează `renderEventsTimeline()`; un singur loc scrie acum în noduri, `applyEventPanelOverrides()`, invocat la finalul fiecărei randări. Cele două ordini de sosire conduc la același rezultat. Declararea `let` a fost mutată înaintea funcției, pentru a evita o referință din zona temporala moartă.

## D10 — Politici corecte în DB, absente din repo — **NOU, neacționat**

`cereri_inscriere` are patru politici create din Dashboard, absente din orice migrare din repository:

| Politică | Cmd | Roluri | `WITH CHECK` |
|---|---|---|---|
| `cereri_public_insert` | INSERT | `{anon, authenticated}` | `consimtamant_gdpr IS TRUE AND status = 'in_asteptare'` |
| `cereri_admin_select` | SELECT | `{authenticated}` | `is_admin()` |
| `cereri_admin_update` | UPDATE | `{authenticated}` | `is_admin()` |
| `cereri_admin_delete` | DELETE | `{authenticated}` | — |

**Verificate ca fiind corecte — dar irrelevante.** Am concluzionat inițial că formularul public de înscriere funcționează fiindcă politica e satisfăcută: `script.js` nu trimite `status`, iar coloana are `'in_asteptare'::text` ca valoare implicită. **Concluzia era greșită.** Politica nu era niciodată consultată, pentru că rolul `anon` nu avea GRANT-ul de `INSERT` — Postgreș refuza apelul înainte de a evalua RLS. Vezi **D14**.

Proiectarea politicii în sine e sănătoasă și rămâne de dorit: sursa de adevăr pentru `status` stă în bază de date, nu în JavaScript, deci clientul nu poate forța o valoare pe care politica nu o acceptă. Nu s-a schimbat nimic în ea.

Problema de versionare e D4, **rezolvată** — vezi D13.

## D11 — `viewer` putea șterge membri și știri — **NOU, REPARAT** (`008c`)

Descoperit la 8 octombrie 2026, în timpul exportului de baseline (D4).

`membri` și `stiri` aveau câte o politică `FOR ALL` creată din Dashboard, absentă din orice migrare:

```sql
membri_admin_all ON membri FOR ALL TO authenticated USING (is_admin())
stiri_admin_all  ON stiri  FOR ALL TO authenticated USING (is_admin())
```

Funcția `is_admin()` (`001_roles_and_visibility.sql:47-58`) întreabă doar „există un rând activ în `admini`?", fără să citească `rol`:

```sql
SELECT EXISTS(SELECT 1 FROM public.admini WHERE user_id = auth.uid() AND activ = true);
```

Deci `is_admin()` este `true` și pentru `viewer`. Politicile permissive se combină cu **OR**, așa că o politică `FOR ALL` cu `is_admin()` acordă orice operație oricărui rol activ, iar politicile granulare care impuneau limitele de rol devin irelevante:

| Operație | Politica granulată corectă | Ce se aplica de fapt |
|---|---|---|
| `DELETE membri` | `admin_delete_membri` → `owner` | `membri_admin_all` → orice rol activ |
| `UPDATE membri` | `admin_update_membri` → `owner`+`editor` | `membri_admin_all` → orice rol activ |
| `DELETE stiri` | `admin_delete_stiri` → `owner` | `stiri_admin_all` → orice rol activ |
| `UPDATE stiri` | `admin_update_stiri` → `owner`+`editor` | `stiri_admin_all` → orice rol activ |

Ierarhia de roluri scrisă cu atenție în `001` era anulată de două politici create ulterior, care nu aveau cum să fie cunoscute la scrierea migrărilor. **Testul din lista de verificare („salvează un membru ca viewer → trebuie să dea eroare") nu ar fi dat eroare**: `viewer` ar fi putut șterge membri din Registru.

**Reparație:** `DROP` pentru cele două politici. Nu s-a adăugat nimic în locul lor — pentru ambele tabele există deja setul complet de politici granulare, create de migrările din repo și verificate corecte. Acoperirea rămâne: citire pentru orice rol activ, scriere pentru `owner`+`editor`, ștergere doar pentru `owner`.

`is_admin()` nu s-a atins. În politicile de **SELECT** e corect ca un `viewer` să citească integral registrul; problema era folosirea ei și în politici de scriere și ștergere.

Fișiere: `008c_role_isolation.sql` (idempotent, aplicat manual înainte de a fi scris), `008c_role_isolation_rollback.sql` (reface cele două politici, cu avertisment explicit că reintroduce escaladarea).

## D12 — Orice vizitator poate insera rânduri în `evenimente` și `vizite` — **NOU, neacționat**

Descoperit în aceeași extragere. Ambele politici au `WITH CHECK (true)`:

| Tabel | Politică | Roluri | `WITH CHECK` |
|---|---|---|---|
| `evenimente` | `evenimente_public_insert` | `{anon, authenticated}` | `true` |
| `vizite` | `vizite_public_insert` | `{anon, authenticated}` | `true` |

Un vizitator neautentificat poate insera rânduri cu orice conținut. Pentru `vizite` (contor de acces) e un vector de inflație a statisticilor; pentru `evenimente` e mai grav, dacă tabela reprezintă agenda publică.

**Nu s-a atins nimic.** Structura celor două tabele a fost extrasă între timp și a schimbat evaluarea:

| Tabel | Coloane | Scris de | Citit de |
|---|---|---|---|
| `vizite` | `id`, `created_at`, `pagina`, `referrer`, `dispozitiv`, `sesiune` | `script.js:3631` | `telemetry.js:76` |
| `evenimente` | `id`, `created_at`, `tip`, `pagina`, `sesiune` | `script.js:3652` | **nimeni** |

**`vizite` — funcționează așa cum trebuie.** `INSERT` cu `WITH CHECK (true)` pe `anon` nu e o slăbiciune corectabilă: `logPageVisit()` rulează în browserul vizitatorului, unde cheia anon e publică, deci orice verificare server-side a identității ar respinge apelul și telemetria ar muri. Singura protecție posibilă e limitarea volumului, nu autentificarea. Risc real, dar modest: un bot poate insera volume mari de contori și falsifica statisticile din panel. Nu duce la scurgere de date.

**`evenimente` — tabel scris fără să fie citit.** Niciun `SELECT` pe `evenimente` în tot repo-ul. Primește scrieri anonime fără restricție și nu produce nicio valoare folosită. **Atenție:** `evenimente` nu e agenda publică, cum bănuiam înainte de extragere — e tot telemetrie, deci severitatea e mai mică decât părea. Diferența față de `vizite` e că acolo datele sunt citite, aici nu.

Stergerea politicii de `INSERT` ar opri și telemetria folosită de script, fără să elimine riscul: riskul nu e accesul, ci volumul. Deciziile posibile:

1. să înceapă să fie citită — panelul Telemetrie ar putea afișa evenimente pe pagină, caz în care inserarea publică e motivată;
2. dacă nu va fi citită, să se elimine calea de scriere din `script.js` (`logTelemetryEvent` și apelurile ei);
3. dacă rămâne necitită și scrisă, se acceptă riscul de spam, documentat.

**`jurnal_admin` — structură clară, origine necunoscută.** Coloane: `id`, `created_at`, `admin_id`, `admin_email`, `tabel`, `actiune`, `rand_id`, `detalii jsonb`. E un jurnal de audit, dar **niciun SELECT, INSERT sau UPDATE pe el în tot repo-ul**. Nu are politică de `INSERT`. Deci fie există un trigger neextras, fie tabela e complet nefolosită.

Structura tuturor trei tabele e documentată în `supabase/baseline/000_tabele_neversionate.sql`.

## D13 — Starea reală a DB-ului exportată în repo — **REPARAT** (`supabase/baseline/`)

Rezolvă D4 și D10. `supabase/baseline/000_policies_verificat.sql` conține toate cele **43 de politici pe 12 tabele**, extrase pe 8 octombrie 2026 direct din catalogul PostgreSQL (`pg_policy` + `pg_get_expr`), nu reconstruite din memorie.

| Tabel | Politici | Origine înainte de export |
|---|---|---|
| `admini` | 5 | 4 din Dashboard, 1 din `008a` |
| `audit_log` | 1 | din migrări |
| `cereri_inscriere` | 4 | toate din Dashboard |
| `documente` | 5 | din migrări |
| `evenimente` | 2 | ambele din Dashboard |
| `faq` | 5 | din migrări |
| `jurnal_admin` | 1 | din Dashboard |
| `leadership` | 5 | din migrări |
| `membri` | 5 | 1 din Dashboard (`membri_admin_all`), eliminată în `008c` |
| `setari` | 3 | din migrări + rescriere în `008` |
| `stiri` | 5 | 1 din Dashboard (`stiri_admin_all`), eliminată în `008c` |
| `vizite` | 2 | ambele din Dashboard |

Fișierul e idempotent (`DROP IF EXISTS` + `CREATE`) și marcat explicit ca **snapshot, nu parte a lanțului de migrări**. Nu activează RLS, nu acordă GRANT-uri, nu atinge funcțiile. La final conține și `DROP` pentru cele două politici `*_admin_all`, ca rularea lui pe o bază unde `008c` nu s-a aplicat să nu le readucă.

Ce **nu** e acoperit încă: definițiile celor 5 funcții create din Dashboard, structura tabelelor `evenimente` / `vizite` / `jurnal_admin` (acum documentate în `000_tabele_neversionate.sql`) și GRANT-urile pe tabele — **acestea din urmă au fost extrase și au produs D14**.

## D14 — Cheia `anon` nu putea scrie nimic: formularul public și telemetria erau moarte — **NOU, REPARAT** (`008d`)

Descoperit pe 8 octombrie 2026, la finalizarea exportului de GRANT-uri (D4).

În PostgreSQL, RLS decide *ce* operații sunt permise **în** GRANT-uri. Dacă GRANT-ul lipsește, accesul e refuzat înainte ca RLS să fie evaluat. Politicile de scriere publică existau și erau corecte; GRANT-urile corespunzătoare nu.

Verificat prin REST cu cheia `anon`, pe baza reală:

```
POST /rest/v1/cereri_inscriere → 401 {"code":"42501","message":"permission denied for table cereri_inscriere"}
POST /rest/v1/vizite          → 401 {"code":"42501","message":"permission denied for table vizite"}
```

Rolul `anon` nu avea **niciun** GRANT pe `cereri_inscriere`, `vizite` sau `evenimente`. Avea `SELECT` doar pe cele șase tabele publice de citit.

Două consecințe reale:

**1. Formularul public de înscriere nu funcționa.** Niciun vizitator nu putea trimite o cerere. Singurul rând existent a fost creat manual din Dashboard. `cereri_public_insert` nu a fost niciodată consultată.

**2. Telemetria era moartă, în tăcere.** `script.js:3631` și `script.js:3652` trimit `INSERT` cu cheia `anon`, iar ambele apeluri sunt fire-and-forget:

```js
client.from('vizite').insert([...]).then(() => {}).catch(() => {});
```

Eroarea `401` e prinsă și aruncată. Fiecare acces de pagină și fiecare eveniment se pierdeau fără urmă. Panelul Telemetrie citește corect, dar tabela rămâne goală.

Aceeași clasă de defect ca `pingSupabaseHealth` cu latențe inventate (T-J10.2): panoul afirma ceva ce nu poate fi adevărat, pentru că nimeni nu verifică.

**Reparație:** `GRANT INSERT` pe exact cele trei tabele, fără `SELECT`. Politicile existente decid conținutul — pentru `cereri_inscriere`, vizitatorul nu poate crea o cerere cu alt status decât `'in_asteptare'`. Pentru `vizite` și `evenimente`, `WITH CHECK (true)` rămâne, deci riscul de spam persistă (D12); nu poate fi eliminat, fiindcă scriptul rulează în browser unde cheia `anon` e publică.

Fișiere: `008d_public_writes.sql` (idempotent, cu acordarea `USAGE` pe secvențe doar pentru cele trei tabele, prin buclă care caută secvențe după prefix — nu atinge secvențele celorlalte tabele), `008d_public_writes_rollback.sql` (cu variantă de rollback parțial: retrage telemetria, păstrează formularul).

**De ce nu a fost prins mai devreme.** Verificările anterioare au măsurat definiția politicii, nu efectul ei. Testul care ar fi prins asta e un `POST` real prin REST, nu o interogare de catalog — e în `Teste manuale` începând cu această versiune.

### Verificat prin REST după aplicare

| Test | Rezultat | Corect |
|---|---|---|
| `information_schema.table_privileges` pentru `anon` | 3 rânduri, toate `INSERT`, niciun `SELECT` sau `DELETE` | ✅ |
| `POST /vizite` `{pagina:"test-008d", sesiune:"test", dispozitiv:"desktop"}` | `201` | ✅ |
| `POST /evenimente` `{tip:"test", pagina:"test", sesiune:"test"}` | `201` | ✅ |
| `POST /cereri_inscriere` `{nume_complet:"probe", consimtamant_gdpr:false}` | `401 new row violates row-level security policy` | ✅ GRANT funcționează, politica respinge |
| `GET /vizite` ca `anon` | `401 permission denied` | ✅ publicul nu citește telemetria |
| `GET /cereri_inscriere` ca `anon` | `401 permission denied` | ✅ |

Testul al patrulea e cel care distinge configurația corectă de una ruptă: mesajul ajunge la **politica**, ceea ce dovedește că GRANT-ul e acordat și că singurul lucru care oprește cererea invalidă e regula de business.

### Două capcane întâlnite la testare

**1. `Prefer: return=representation` maschează rezultatul.** Un `POST` cu `Prefer: return=representation` primește `permission denied`, pentru că PostgREST adaugă `RETURNING *`, care implică necesitatea unui GRANT `SELECT`. `supabase-js` nu trimite acest header decât dacă se folosește `.insert().select()`, iar `script.js:3631` și `:3652` **nu** îl folosesc. Deci un test care adaugă acest header poate raporta un GRANT lipsă care în realitate e corect. Testele trebuie făcute exact cum trimite aplicația.

**2. `vizite` are un `CHECK` pe `dispozitiv`.** Valorile admise sunt `mobil`, `tableta`, `desktop` (`script.js:3602-3611`, `detectDeviceType()`). O valoare arbitrară produce `23514`, nu o eroare de acces — deci un test prost ales poate fi citit drept GRANT lipsă.

### Curățare

Testele au creat două rânduri reale, pe care `anon` nu le poate șterge:

```sql
DELETE FROM vizite WHERE pagina = 'test-008d';
DELETE FROM evenimente WHERE tip = 'test';
```

Rândul din `vizite` apare în panelul Telemetrie până la ștergere. Rândul din `evenimente` e invizibil: tabela nu e citită de niciun cod.

Ambele rânduri au fost șterse.

---

## D15 — `limiteaza_cereri()` putea bloca formularul tuturor — **NOU, REPARAT** (`008e`)

Constatare, nu presupunere. Funcția `limiteaza_cereri()` a fost creată din Dashboard și nu se regăsea în nicio migrare; a fost exportată în `supabase/baseline/000_functionii_si_trigere.sql` la închiderea D4. Conținea două verificări:

| Verificare | Cod | Efect |
|---|---|---|
| același email, 2 cereri în 24 h | `EXISTS(...)` | corect |
| **maxim 30 de cereri în 10 minute, GLOBAL** | `count(*) … >= 30` | **problemă** |

A doua verificare nu are niciun filtru. Tradus: **30 de cereri trimise de orice sursă opresc formularul de înscriere al tuturor vizitatorilor, timp de 10 minute.** Cheia `anon` e publică (`admin/js/supabase.js:7`), deci oricine poate face asta din `curl`, în buclă.

**Această limită era inaccesibilă până la `008d`.** Fără `GRANT INSERT`, `anon` nu putea scrie nimic și declanșatorul nu avea ce bloca. `008d` a făcut formularul funcțional și, odată cu el, a activat suprafața de atac. Consecința nu fusese evaluată înainte de aplicare — `008d` a fost aplicat fără o măsurătoare prealabilă a declanșatorilor. Vezi D14.

### De ce nu se limitează per IP

| Metodă | De ce nu merge |
|---|---|
| `inet_client_addr()` | întoarce adresa serverului PostgREST, nu a vizitatorului — toate cererile trec prin infrastructura Supabase. Ar fi aceeași valoare pentru toată lumea, deci identică cu limita globală. |
| `x-forwarded-for` | falsificabil de client. O limită construită pe o valoare falsificabilă nu oferă protecție, iar dacă e prea strictă blochează vizitatori legițimi cu proxy sau rețea comună. |

Protecția rămâne pe ce se poate susține cu date reale: **emailul**.

### Ce s-a schimbat

| # | Regula | Înainte | După |
|---|---|---|---|
| 1 | același email | 1 cerere / 24 h | 1 cerere / 24 h (nemodificat) |
| 2 | același email, prag mare | — | 3 cereri / 24 h → `prea_multe_cereri_acelasi_email` |
| 3 | prag global | 30 cereri / 10 min | **100 cereri / 10 min** |

**Pragul global crește intenționat.** Un prag mic nu descurajează atacatorul — 30 de cereri sunt puține — ci blochează mai repede vizitatorii reali. Cu 100, e nevoie de 100 de cereri false ca formularul să devină inutilizabil, iar acele cereri ajung oricum în tabel: exact cele pe care le vom șterge ulterior, nu cele pe care le păstrăm.

### O regulă care rămâne inaccesibilă prin formular

Prima versiune scrisă ordona invers verificările: `EXISTS(...)` pentru duplicat, **apoi** `count(*) >= 3` pe exact aceleași rânduri. Cum `count >= 3` implică `EXISTS = true`, regula de 3 cereri ar fi oprit **orice** cerere înainte de a se putea atinge, deci **cod mort**. Corectat în `b1f21f8`: numărul se calculează o dată, iar pragurile se testează descrescător (3, apoi 1).

Rămâne totuși un fapt onest: **pragul de 3 cereri pe email nu poate fi atins prin formular**, fiindcă regula „1 la 24 h" respinge a doua cerere, deci nu se acumulează niciodată 3 rânduri. E plasa de siguranță pentru o cale de inserare care ocolește declanșatorul (import manual, o relaxare viitoare a regulii de duplicat), nu o protecție măsurabilă. Nu e prezentat ca fiind testat.

### Limita rămâne, și e onest să fie spusă

Fără o adresă de IP de încredere, un atacator doritor poate bloca în continuare formularul, cu 100 în loc de 30. E un efort de 3,3 ori mai mare, **nu o interzicere**. Interzicerea reală ar cere o limită per IP la nivel de rețea, adică o configurare în afara bazei de date.

Ce ar reduce cel mai mult riscul e un CAPTCHA în formular, aplicat la rândul lui în panou. Nu s-a atins: depinde de alegerea furnizorului.

### Verificat în baza de date

Definție, prin poziție în `prosrc` (ordinea pragurilor):

| `prag_3` | `prag_1` | `prag_100` |
|---|---|---|
| 210 | 319 | 526 |

Efect, prin REST cu cheia `anon` (fără autentificare):

| Test | Rezultat | Ce demonstrează |
|---|---|---|
| `POST /cereri_inscriere` cu `consimtamant_gdpr: true`, `judet` setat | `201` | declanșatorul **nu blochează** cererile normale — formularul e funcțional |
| același `POST`, imediat, același email | `400` · `P0001` · `cerere_duplicata` | regula de duplicat ajunge la client prin PostgREST, nu rămâne pe server |

Rândul de test creat la primul `POST` a fost șters.

---

# Teste manuale — Patrick

**Doar după ce ai aplicat `008_security_hardening.sql` în SQL Editor și ai rulat `008_verify.sql`.**

Cheia `anon` e la `admin/js/supabase.js:7`. Prefixul REST e `https://<project-ref>.supabase.co`.

### Test de efect prin REST — rulează primul

Verifică definițiile din catalog **și** efectul lor. Un `GET` care „merge" înseamnă „merge" și când definiția e corectă dar GRANT-ul lipsește — exact cazul din D14, care a trecut nedetectat luni de zile.

| # | Test | Așteptat |
|---|---|---|
| 0 | `POST /cereri_inscriere` cu `{"consimtamant_gdpr":false}` | `permission denied for table` → GRANT lipsește; `new row violates row-level security policy` → GRANT ok, politica își face treaba. **Această diferență e singura care deosebește o configurație corectă de una ruptă.** |
| 0b | `POST /vizite` cu `{"pagina":"test"}` | `201` |
| 0c | `GET /vizite?select=pagina&limit=1` ca `anon` | `401` — publicul **nu** trebuie să citească telemetria |

### Teste de configurare

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

## Mai de testat în interfață

**Înainte de aplicarea SQL-ului**, ca să vezi comportamentul „de dinainte":

| Ce | De ce |
|---|---|
| Login cu un email care nu e în `admini` | mesajul specific pe „neautorizat", nu un eșec mut |
| Sesiune ca `viewer`, apoi logout pe același browser | la următoarea sesiune ca `editor`, secțiunile anterioare nu mai apar |
| Salvează un membru ca `viewer` | **trebuie** să dea eroare, nu „salvat cu succes" |
| „Sincronizează știrile oficiale" de două ori | a doua apăsare spune „deja există", nu inserează duplicate |
| Sincronizare cu `stiri` goală | confirm cu numere reali, nu un generic |
| Schimbă rolul unui administrator, apoi apasă „anulează" | `select` revine la valoarea din baza de date |
| Adaugă un administrator cu un email duplicat | „Acest email este deja înregistrat ca administrator." |
| Adaugă un administrator cu email invalid | respins de regex, nu acceptat pentru că are un `@` |
| Coș → o categorie cu RLS refuzat | apare `⚠️ Nu s-au putut încărca categoriile: …`, nu o listă goală |
| Știri: link cu `javascript:alert(1)` | respins la salvare |
| Pagini: salvează un telefon, apoi golește câmpul | revine textul implicit din `index.html` |
| Pagini: contact, telefon local | butonul de copiat copiază numărul nou |
| Pagini: bancă, modifică „Denumire bancă" | apare pe pagina Membri |
| Cont non-owner: secțiunea „Consolă dezvoltator" | ascunsă din meniu; acces direct prin hash → refuzat |
| Consolă, tab „RLS Policies", non-owner | mesajul real de `42501`, nu o listă de politici |
| Telemetrie: oprește rețeaua, apasă refresh | „Inaccesibil (fără răspuns)", nu „18 ms" |
| Panou: blochează jsdelivr.net în DevTools | **trebuie** să apară un mesaj explicit, nu un panou alb |

---

# Rezultate verificare live

Migrările `008a_admini_invites.sql` și `008_security_hardening.sql` au fost **aplicate și verificate în baza de date reală**. Mai jos sunt rezultatele obținute, nu așteptările teoretice.

## Verificare structurală (SQL Editor)

| Ce | Rezultat |
|---|---|
| Politici pe `admini` | 5, toate corecte — `admin_select_invited` cu varianta reparată din 008a, plus cele 4 din Dashboard |
| Politici storage | `media_read` public, `media_insert`/`media_update` owner+editor, `media_delete` owner ✅ T-S3 |
| `setari_citire_anonim` | allowlist cu cele 3 chei + `pagina\_%` ✅ T-S5 |
| Triggeruri pe `admini` | `audit_admini` + `trg_prevent_last_owner_loss` ✅ T-S7 |
| Funcții | 12 în `public`, `claim_admin_invite` și `get_table_rls_policies` SECURITY DEFINER ✅ |
| `prevent_last_owner_loss` | `security_definer = false` — corect, triggerul nu ocolește RLS |
| Constraint-uri `admini` | `admini_id_pkey` (id), `admini_email_key`, `admini_user_id_key` ✅ 008a |
| `admini_rol_check` | doar `owner`, `editor`, `viewer` ✅ T-S3b |
| Bucket `media` | fără `image/svg+xml` ✅ T-S8 |
| `admin_claim_invited` | absent ✅ T-S1 (n-a existat niciodată în această bază) |

## Verificare de efect — anon, fără autentificare

Teste HTTP reale împotriva API-ului PostgREST cu `anon key`:

| Test | Rezultat |
|---|---|
| `GET /stiri` ca anon | 10 rânduri, **0 cu `deleted_at` ne-null** |
| `GET /membri`, `/leadership`, `/faq`, `/documente` ca anon | **0 rânduri șterse** vizibile |
| `GET /admini` ca anon | **401** |
| `GET /audit_log` ca anon | **401** |
| `GET /cereri_inscriere` ca anon | **401** |
| `GET /setari?cheie=eq.contact_email_notificari` ca anon | `[]` — adresa personală nu mai e publică |
| `POST /rpc/get_table_rls_policies` ca anon | **401 `42501 permission denied`** ✅ T-S6 |
| `DELETE /membri`, `DELETE /setari` ca anon | **401** |

**T-S4 este închis prin efect, nu doar prin definiție.** Înainte de migrare, politica `stiri_public_select` (creată din Supabase Dashboard, absentă din repository) avea `qual` egal cu doar `publicat` — deci orice știre ștearsă din coș rămânea publică. Cum politicile permissive se aplică cu OR, eliminarea doar a celor `anon_select_*` ar fi raportat „gata" fără să închidă scurgerea. Migrarea 008 șterge toate cele patru politici.

## Verificare funcțională — calea de scriere pe `admini`

Teste executate cu SQL Editor, ca `postgres`. Fiecare a fost conceput să nu modifice permanent starea.

| Test | Rezultat |
|---|---|
| `INSERT INTO admini (email, rol, activ) VALUES (...)` | rând creat, `id` = uuid, `user_id` gol, `activ = false` ✅ |
| Inserare cu email duplicat | `ERROR 23505 duplicate key … admini_email_key` ✅ exact ramura din `roles.js` |
| `UPDATE admini SET rol = 'viewer' WHERE email = ...` | rând actualizat ✅ calea `.eq('id', …)` |
| Trigger ultimul owner | `ERROR P0001 Nu se poate elimina sau dezactiva ultimul owner activ.` ✅ **T-S7 funcțional** |

Testul triggerului a fost rulat într-un bloc `DO` care încearcă dezactivarea owner-ului, prinde excepția, **aplică înapoi `activ = true`** și raportează verdictul prin `RAISE EXCEPTION`. Rândul proprietarului rămâne activ indiferent de rezultat.

## Verificare de vizibilitate — politica `admin_select_invited`

Simulare de rol prin `set_config('request.jwt.claims', …)` + `SET LOCAL ROLE authenticated`:

| JWT `email` | Rânduri vizibile din `admini` | Corect |
|---|---|---|
| `cineva@random.ro` | **0** | ✅ un utilizator autenticat oarecare nu află niciun administrator |
| `stefanmatei927@gmail.com` (invitație) | **1** | ✅ vede doar propriul rând de invitație |

Varianta din migrarea 007 ar fi folosit `lower(email) = lower(jwt.email) OR user_id = auth.uid()` — deci orice utilizator autentificat ar fi putut afla dacă o adresă arbitrară este administrator. `008a` înlocuiește condiția cu `user_id IS NULL AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))`, eliminând enumerarea de conturi.

## Bugs găsite și reparate în timpul verificării

`admin/js/views/roles.js` — lista de administratori nu se încărca deloc:

```js
.order('creat_la', { ascending: false })
```

Tabelul `admini` a fost creat direct din Supabase Dashboard, nu de migrările din repository, și folosește `created_at` — spre deosebire de `cereri_inscriere` și `audit_log`, care au într-adevăr `creat_la`. PostgREST răspundea cu `42703 column does not exist`, deci fiecare apel `loadAdmins()` arunca. **Aceasta este cauza reală a eșecului de adăugare a unui administrator, nu lipsa coloanei `id`.** Corectat în `c74bb31`, împreună cu:

- coloana „Creat la" din listă, care afișa permanent `—`;
- mesajul de eroare care indica migrarea 007 (neaplicată niciodată și inaplicabilă, fiindcă `ALTER COLUMN user_id DROP NOT NULL` pică pe o coloană cheie primară) — înlocuit cu referință la `008a` și condiționat pe codul real `23502`;
- invitațiile noi se inserează cu `activ = false` în loc de `true`, ca owner-ul să aprobe explicit. Cu `activ = true`, orice cont creat cu adresa deja introdusă în panou ar primi acces complet la prima conectare.

## Necunoscut verificat

`membri.judet` afișat ca `Bucure?ti` în consola PowerShell: **nu e corupție**. Octeții răspunsului sunt `0xC8 0x99`, adică `ș` corect în UTF-8. E doar codepage-ul consolei.

---

# Fișiere modificate

**Noi (7):** `supabase/migrations/008_security_hardening.sql`, `…_rollback.sql`, `008_verify.sql`, `008b_enforce_aal2.sql`, `008b_enforce_aal2_rollback.sql`, `admin/js/lib/db.js`, `scratch/sri-supabase.mjs`, `scratch/check-page-fields.mjs`

**Modificați (28):** `admin/panou.html`, `admin/css/panel.css`, `admin/js/{main,auth,state,supabase}.js`, `admin/js/lib/format.js`, `admin/js/ui/{bulkbar,media,mode}.js`, `admin/js/views/{coder,documents,faq,history,leadership,members,news,overview,pages,requests,roles,settings,sync,telemetry,trash}.js`, `index.html`, `script.js`, `style.css`

**Neatinse:** `demo-v2/`, `ugr-variants/variant-{1,2,3}/`, `backup/pre-demov2-promote-2026-10-03/` (copii separate, nu sursa live), `admin/panou.legacy.html` (conține o copie veche a funcției `pingSupabaseHealth`, dar nu e încărcat de `panou.html`), `supabase/migrations/001…007`.