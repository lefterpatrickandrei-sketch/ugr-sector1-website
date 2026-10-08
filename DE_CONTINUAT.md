# De continuat — starea la 7 octombrie 2026

## Făcut și verificat

Migrările `008a_admini_invites.sql` și `008_security_hardening.sql` sunt **aplicate în baza de date live** și verificate structural și prin cereri HTTP reale cu `anon key`. Zero rânduri șterse vizibile public, `admini`/`audit_log`/`cereri_inscriere` refuză anon cu 401, `get_table_rls_policies` refuză anon cu 42501, triggerul ultimului owner blocat cu `P0001`.

Toate cele 19 task-uri din brief sunt FĂCUTE. D8 și D9, raportate ca observații, au fost reparate ulterior (`8cda38d`, `d2b2b3d`).

**29 → 31 de commit-uri peste `admin-v4` @ `2e5fff2`, branch `opencode-admin4-fixes`, zero push.**

## Resturi, în ordinea recomandată

**1. ~~D2 — „Programat" nu înseamnă viitor.~~ FĂCUT.** Interogarea publică din `script.js` filtra doar după `publicat` și `deleted_at`; `data_publicare` nu avea niciun efect, nici în interogare, nici în RLS. Măsurat: o știre programată pe 11 noiembrie 2026 era vizibilă pe 8 octombrie. Corectat cu `.or('data_publicare.is.null,data_publicare.lte.<data locală>')`. Verificat pe server: 9 articole în loc de 10.

**2. Cele 15 teste de UI din secțiunea „Mai de testat în interfață".** Niciunul n-a fost rulat. SQL-ul e migrat, dar nu s-a verificat că interfața se comportă cum descrie raportul. Aici apar surprizele.

**3. D4 — exportă starea reală din DB în repo.** Politici create din Dashboard, absente din migrări: cele 4 pe `cereri_inscriere` (verificate corecte, vezi D10), plus politicile pe `vizite` și `evenimente`. O bază reconstituită din repo ar ajunge diferită de cea reală. Export ca `000_baseline_policies.sql`.

**4. D3 — retenție în `audit_log`.** Nu e bug, e decizie cu implicație legală. Coloanele `vechi` și `nou` păstrează date personale definitiv, inclusiv după ștergerea membrului din registru. În GDPR e un motiv de solicitare a dreptului de ștergere. Nu s-a atins nimic.

**5. D5 — invitarea unui administrator.** Contul trebuie creat din Dashboard (signup e `signup_disabled`, confirmat prin test). Făcut pentru `stefanmatei927@gmail.com`: rândul există în `admini`, rol `editor`, `activ = false`, `user_id` NULL. owner-ul trebuie să îl activeze după ce invitatul creează contul.

**6. D1 — AAL2 în SQL.** Sigilat în `008b_enforce_aal2.sql` până când 100% din conturi au TOTP înscris și loginul complet a fost testat de două ori pe dispozitive diferite.

**7. D6 — CSP pentru panou.** `admin/panou.html` are mult JavaScript inline.

## Blocaje cunoscute

- **Signup dezactivat.** Un administrator invitat nu își poate crea singur contul. Rezolvare: Dashboard → Authentication → Users → Add user, cu „Auto Confirm User".
- **Rollback-ul T-S7 oprește intenționat** dacă există rânduri cu `user_id IS NULL`. Șterge rândurile de invitație înainte de R-1…R-6.
- **Nu s-a deschis pagina în browser.** SRI de pe `index.html` e validat sintactic, dar nu s-a confirmat încărcarea efectivă a conținutului din Supabase.

## Reguli de lucru

Un task odată, commit per task. După fiecare task JS: `npm run test:syntax`, `npm run test:data`, `node --check script.js` pentru fișierul public. Zero `innerHTML` în `admin/js`. Mesajele de commit lungi se scriu în fișier temp și se aplică cu `git commit -F`, fiindcă PowerShell strică diacriticele din `-m`.

Interogările SQL i se trimit pe un singur rând: newline-urile se pierd la transport și dau `ERROR 42601`.