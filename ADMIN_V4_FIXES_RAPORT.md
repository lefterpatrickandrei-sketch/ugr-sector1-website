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
| 20 | T-J11 · pin + SRI `supabase-js` | **FĂCUT** | `f095147` |

Niciun task marcat „FĂCUT" fără dovadă — vezi secțiunea de verificare de mai jos.

---

## ⚠️ Ordinea aplicării — citește înainte

Migrarea SQL **nu este aplicată**. Codul JS este gata de deploy, dar SQL-ul trebuie rulat manual în Supabase SQL Editor, în această ordine:

1. `supabase/migrations/008_security_hardening.sql` — aplică T-S1, T-S3, T-S3b, T-S4, T-S5, T-S6, T-S7, T-S8. Este idempotent (`DROP ... IF EXISTS` peste tot), înconjurat de `BEGIN; … COMMIT;`.
2. `supabase/migrations/008_verify.sql` — **read-only**, 11 interogări V1…V11. Nu modifică nimic.
3. `supabase/migrations/008b_enforce_aal2.sql` — **NU APLICA ACUM.** Vezi Decizia D1.

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
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js"
        integrity="sha512-4w/AcXbU7AGdxOzJGUPCLrSqlTh+jnM25jQ+wmZByQckoKFyHvA10J9JLEavYV9cfp0JdTxIP6jddakO4xlOGA=="
        crossorigin="anonymous"></script>
```

**`scratch/sri-supabase.mjs`, fișier nou**, calculează hash-ul cu `fetch` → `arrayBuffer` → `crypto.createHash('sha512')` din Node și afișează eticheta gata de copiat. Primește versiunea ca argument.

⚠️ **De ce Node și nu `openssl` / PowerShell.** `openssl` nu e instalat implicit pe Windows. Iar varianta `Invoke-WebRequest` + `GetBytes(text)` e periculoasă: decodificarea ca text și re-codificarea pot schimba un octet (BOM, conversie newline) și produc un hash care nu corespunde niciunui fișier — deci un `integrity` care ar bloca panoul la pornire. Hash-ul calculat în Node a fost verificat în două moduri.

**Fail explicit.** `admin/js/supabase.js` aruncă acum o eroare numită și acționabilă când `window.supabase` e `undefined`. Altfel, un mismatch de `integrity` sau un CDN blocat ar produce un `TypeError` gol la import și un panou complet alb.

**Dovadă.** `node scratch/sri-supabase.mjs 2.117.2` reproduce hash-ul din eticheta de mai sus.

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

## D2 — „Programat" nu însemna viitor

`publicat = true` cu `data_publicare` în viitor face știrea **imediat vizibilă** pe site. N-a fost schimbat — e în afara scopului acestui raport, dar merită o decizie: fie se tratează „programat" la nivel de interogare (`.lte('data_publicare', now())`), fie panoul ar trebui să nu permită `publicat` înainte de data indicată.

## D3 — Retenție `audit_log`

Coloanele `vechi` și `nou` stochează date personale complete, fără retenție și fără anonimizare. La ștergerea unui membru, urma lui rămâne în jurnal pentru totdeauna. Nu s-a schimbat (ar distruge istoricul de audit, care e chiar scopul tabelei). Propunere: o politică de retenție declarată explicit, plus un proces de ștergere la cerere, cu acoperirea manuală a înregistrărilor din coloanele `vechi`/`nou`.

## D4 — Politicile lipsă din repo

`cereri_inscriere`, `vizite` și `evenimente` n-au politici versionate — Faza 2 nu are SQL în repo. `cereri_inscriere` nu are RLS activ deloc, doar `GRANT`-uri în `fix_permissions_and_owner.sql:13`. Recomandare: exportă un `000_baseline_policies.sql` din baza live, ca starea reală să fie în versionare și nu doar pe server.

## D5 — Invitarea unui administrator nou

Cu `shouldCreateUser: false`, un email care nu există încă în `auth.users` nu poate primi magic link. Soluția corectă e o Edge Function cu `auth.admin.inviteUserByEmail` (service role). **Nu implementat, după cum s-a cerut.**

De verificat în Supabase Auth: „Allow new users to sign up" = **OFF**, „Confirm email" = **ON**.

## D6 — CSP pentru panou

`admin/panou.html` are mult JavaScript inline. Tratat separat de T-J11, care a rezolvat doar supply chain-ul bibliotecii.

## D7 — Rollback-ul T-S3 reintroduce riscul

`008_security_hardening_rollback.sql` R-6 restaurează politicile **deschise** pe storage, R-4 `USING (true)` pe `setari`, R-5 politicile anon fără `deleted_at`. Sunt fișierul de siguranță, nu o opțiune de rollback curentă. Dacă R-6 ajunge în producție, Q4-ul devine „cine poate șterge fișiere din bucket".

## D8 — `main.js`: doi ascultători pe butonul de submit

La T-J4 s-a constatat că `main.js:834-835` atașează `handleSaveNewAdmin` atât pe `submit`-ul formularului, cât și pe `click`-ul butonului, deci handlerul se execută de două ori. Am adăugat gardul `isSavingAdmin` în `roles.js` — corect local. **Cauza de bază (dublul ascultător) e încă în `main.js`**; merită verificat dacă există și alți butoane cu aceeași problemă.

## D9 — Ordine `applyCustomPageData` vs `renderEventsTimeline`

Raportat, **fără modificare de comportament**, conform cerinței.

Ambele ating `.events-timeline-item`, prin mecanisme diferite:
- `applyCustomPageData('pagina_evenimente')` scrie `textContent` **pornind de la index** pe nodurile existente din `#view-evenimente`.
- `renderEventsTimeline()` face `axis.innerHTML = ...`, **construind de la zero** din `ugrData.newsList` (tabela `stiri`).

Ordinea e determinată de `DOMContentLoaded`: `renderNewsBento()` → `renderEventsTimeline()` (liniile 2299-2300, date statice), apoi `loadNewsFromSupabase()` (care re-randează din `stiri`) și `loadContentFromSupabase()` (care aplică `pagina_*`) — **ambele asincrone, în ordine de apel**.

Deci: dacă `stiri` se încarcă **înainte** de `setari`,Timeline-ul din `stiri` umple nodurile, `applyCustomPageData` suprascrie primele N pe index. Dacă `setari` ajunge primul, `renderEventsTimeline` șterge tot ce a scris `applyCustomPageData`. **Câștigă cel care termină ultimul — ordine nedeterminată între două `await`-uri fără sincronizare.**

În `index.html` există 6 `.events-timeline-item`, iar panoul trimite 6 elemente `events` — astăzi numerele se potrivesc. Dacă panoul va avea mai multe evenimente decât știri publicate, `applyCustomPageData` le va ignora în tăcere (bucla `if (eventNodes[idx])`).

**Recomandare pentru o decizie viitoare:** un singur punct de randare pentru timeline (ex. `applyCustomPageData` rulează la finalul unui `Promise.all`, nu într-un `forEach` concurent).

---

# Teste manuale — Patrick

**Doar după ce ai aplicat `008_security_hardening.sql` în SQL Editor și ai rulat `008_verify.sql`.**

Cheia `anon` e la `admin/js/supabase.js:7`. Prefixul REST e `https://<project-ref>.supabase.co`.

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

# Fișiere modificate

**Noi (7):** `supabase/migrations/008_security_hardening.sql`, `…_rollback.sql`, `008_verify.sql`, `008b_enforce_aal2.sql`, `008b_enforce_aal2_rollback.sql`, `admin/js/lib/db.js`, `scratch/sri-supabase.mjs`, `scratch/check-page-fields.mjs`

**Modificați (28):** `admin/panou.html`, `admin/css/panel.css`, `admin/js/{main,auth,state,supabase}.js`, `admin/js/lib/format.js`, `admin/js/ui/{bulkbar,media,mode}.js`, `admin/js/views/{coder,documents,faq,history,leadership,members,news,overview,pages,requests,roles,settings,sync,telemetry,trash}.js`, `index.html`, `script.js`, `style.css`

**Neatinse:** `demo-v2/`, `ugr-variants/variant-{1,2,3}/`, `backup/pre-demov2-promote-2026-10-03/` (copii separate, nu sursa live), `admin/panou.legacy.html` (conține o copie veche a funcției `pingSupabaseHealth`, dar nu e încărcat de `panou.html`), `supabase/migrations/001…007`.