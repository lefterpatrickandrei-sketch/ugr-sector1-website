# De continuat — starea la 7 octombrie 2026

## Făcut și verificat

Migrările `008a_admini_invites.sql` și `008_security_hardening.sql` sunt **aplicate în baza de date live** și verificate structural și prin cereri HTTP reale cu `anon key`. Zero rânduri șterse vizibile public, `admini`/`audit_log`/`cereri_inscriere` refuză anon cu 401, `get_table_rls_policies` refuză anon cu 42501, triggerul ultimului owner blocat cu `P0001`.

Toate cele 19 task-uri din brief sunt FĂCUTE. D8 și D9, raportate ca observații, au fost reparate ulterior (`8cda38d`, `d2b2b3d`).

**29 → 31 de commit-uri peste `admin-v4` @ `2e5fff2`, branch `opencode-admin4-fixes`, zero push.**

## Resturi, în ordinea recomandată

**1. ~~D2 — „Programat" nu înseamnă viitor.~~ FĂCUT.** Interogarea publică din `script.js` filtra doar după `publicat` și `deleted_at`; `data_publicare` nu avea niciun efect, nici în interogare, nici în RLS. Măsurat: o știre programată pe 11 noiembrie 2026 era vizibilă pe 8 octombrie. Corectat cu `.or('data_publicare.is.null,data_publicare.lte.<data locală>')`. Verificat pe server: 9 articole în loc de 10.

**1b. ~~D14 — cheia `anon` nu putea scrie.~~ FĂCUT, aplicat și verificat.** Formularul public de înscriere și telemetria erau **moarte de luni de zile**: GRANT lipsă pe `cereri_inscriere`, `vizite`, `evenimente`, iar apelurile sunt fire-and-forget cu `.catch(() => {})`. Reparat cu trei `GRANT INSERT` în `008d`. Verificat prin REST: `201` la `POST /vizite` și `/evenimente`, `401 permission denied` la citire, și — testul decisiv — `POST /cereri_inscriere` cu `consimtamant_gdpr:false` întoarce `new row violates row-level security policy`, deci GRANT-ul e corect și politica e cea care respinge. Rânduri de test de curățat: `DELETE FROM vizite WHERE pagina = 'test-008d'; DELETE FROM evenimente WHERE tip = 'test';`

**1c. ~~D11 — `viewer` putea șterge membri și știri.~~ FĂCUT, aplicat și verificat.** `membri_admin_all` și `stiri_admin_all`, politici `FOR ALL` cu `is_admin()` create din Dashboard. `is_admin()` întreabă doar dacă există rând activ, fără să citească `rol`, deci `viewer` trecea. `DROP` în `008c`; politicile granulare din repo acoperă complet rolurile. Rollback-ul reface problema și avertizează explicit.

**1d. ~~D4 / D10 — exportul stării reale.~~ PARȚIAL făcut.** `supabase/baseline/000_policies_verificat.sql` (43 politici pe 12 tabele) și `supabase/baseline/000_tabele_neversionate.sql` (structura lui `evenimente`, `vizite`, `jurnal_admin`). GRANT-urile au fost extrase și au produs D14. **Rămas:** definițiile celor 5 funcții create din Dashboard (`limiteaza_cereri`, `log_admin_action`, `marcheaza_procesare`, `rls_auto_enable`, `set_updated_at`) și lista de triggere pe tabelele public.

**2. Cele 15 teste de UI din secțiunea „Mai de testat în interfață".** Unul rulat: adăugarea unui administrator funcționează. Restul neatinse. Atenție — lista e scrisă înainte de D11, când un `viewer` ar fi putut șterge membri; acum **trebuie** să dea eroare.

**2b. D12 — `evenimente` primește scrieri anonime și nu e citit de nimeni.** Nu s-a atins. Decizii posibile: să înceapă să fie citit, să se elimine calea de scriere din `script.js` (`logTelemetryEvent`), sau riscul de spam să fie acceptat documentat.

**4. D3 — retenție în `audit_log`.** Nu e bug, e decizie cu implicație legală. Coloanele `vechi` și `nou` păstrează date personale definitiv, inclusiv după ștergerea membrului din registru. În GDPR e un motiv de solicitare a dreptului de ștergere. Nu s-a atins nimic.

**5. D5 — invitarea unui administrator.** Contul trebuie creat din Dashboard (signup e `signup_disabled`, confirmat prin test). Făcut pentru `stefanmatei927@gmail.com`: rândul există în `admini`, rol `editor`, `activ = false`, `user_id` NULL. owner-ul trebuie să îl activeze după ce invitatul creează contul.

**6. D1 — AAL2 în SQL.** Sigilat în `008b_enforce_aal2.sql` până când 100% din conturi au TOTP înscris și loginul complet a fost testat de două ori pe dispozitive diferite.

**7. D6 — CSP pentru panou.** `admin/panou.html` are mult JavaScript inline.

## Blocaje cunoscute

- **Rânduri de test de curățat**, create la verificarea lui 008d, pe care `anon` nu le poate șterge: `vizite` cu `pagina = 'test-008d'` (apare în panelul Telemetrie) și `evenimente` cu `tip = 'test'`.
- **Signup dezactivat.** Un administrator invitat nu își poate crea singur contul. Rezolvare: Dashboard → Authentication → Users → Add user, cu „Auto Confirm User".
- **Rollback-ul T-S7 oprește intenționat** dacă există rânduri cu `user_id IS NULL`. Șterge rândurile de invitație înainte de R-1…R-6.
- **Nu s-a deschis pagina în browser.** SRI de pe `index.html` e validat sintactic, dar nu s-a confirmat încărcarea efectivă a conținutului din Supabase.

## Două capcane la testarea prin REST

Ambele m-au costat câte o rundă de greșeli în 8 octombrie 2026. Le repet pentru că se vor repeta:

- **`Prefer: return=representation`** cere implicit `GRANT SELECT`. Un `POST` cu acest header întoarce `permission denied` chiar dacă GRANT-ul e corect. `supabase-js` nu îl trimite decât la `.insert().select()`, iar `script.js` nu folosește `.select()` la aceste inserări. Testează exact cum trimite aplicația.
- **`vizite` are `CHECK` pe `dispozitiv`** (`mobil` / `tableta` / `desktop`, din `script.js:3602`). O valoare arbitrară produce `23514`, care poate fi citit drept GRANT lipsă.

Regula de aur: în PostgreSQL, RLS decide *ce* e permis **în** GRANT-uri. Politica poate fi perfectă și totuși operația refuzată, pentru că GRANT-ul lipsește. Verifică definiția **și** efectul.

## Reguli de lucru

Un task odată, commit per task. După fiecare task JS: `npm run test:syntax`, `npm run test:data`, `node --check script.js` pentru fișierul public. Zero `innerHTML` în `admin/js`. Mesajele de commit lungi se scriu în fișier temp și se aplică cu `git commit -F`, fiindcă PowerShell strică diacriticele din `-m`.

Interogările SQL i se trimit pe un singur rând: newline-urile se pierd la transport și dau `ERROR 42601`.