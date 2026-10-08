# Uniunea Geodezilor din România (UGR) — Filiala Sector 1 București

Website-ul oficial și platforma digitală de gestiune administrativă a Filialei Sector 1 București a Uniunii Geodezilor din România (UGR).

🌐 **Site Oficial Live:** **[https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/)**  
🔒 **Panou Administrativ (CMS Studio v4.0):** **[`/admin/panou.html`](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/admin/panou.html)**

---

## 🏛️ Despre Platformă

Platforma digitală oficială asigură reprezentarea profesională a inginerilor geodezi, topografilor autorizați și cartografilor din Sectorul 1 București, oferind servicii dedicate comunității tehnice și un canal modern de comunicare instituțională cu Agenția Națională de Cadastru și Publicitate Imobiliară (ANCPI), OCPI București, universitățile de profil (UTCB, USAMV) și administrația publică.

---

## 🚀 Funcționalități Principale (Portal Public)

* **👥 Registru Public de Membri:** Listare dinamică a specialiștilor autorizați din filială, sincronizată în timp real cu baza de date Supabase, ordonată alfabetic, cu filtrare după județ/categorie și căutare instantanee.
* **📰 Secțiune Știri & Comunicate:** Publicare dinamică a deciziilor Biroului Executiv (BEX), hotărârilor adunărilor generale, workshop-urilor practice și evenimentelor geodezice (Săptămâna Geodeziei Românești, congrese CLGE).
* **🏛️ Conducere & Birou Executiv:** Prezentare oficială a conducerii Filialei Sector 1 și a Biroului Executiv Central Național, sincronizată dinamic din baza de date.
* **❓ Întrebări Frecvente (FAQ):** Răspunsuri la întrebări pe 4 categorii (Înscriere, BCPI & Cadastru, Studenți FIFIM, Evenimente).
* **📄 Documente Oficiale:** Formulare tipizate descărcabile și statut oficial.
* **📝 Formular de Aderare Online:** Înscriere în 3 pași cu validare completă de date, verificare consimțământ GDPR, protecție anti-spam Honeypot și salvare securizată în tabela `cereri_inscriere`.
* **📐 Utilitar Tehnic Geodezic:** Calculator nativ pentru conversia coordonatelor **Stereo 70 ⇄ WGS84**, cu preseturi dedicate pentru Sectorul 1 și Sediul Central UGR.
* **🗺️ Cartografie & Telemetrie:** Hartă interactivă vectorizată cu polul regional București și repere geodezice locale.
* **🛡️ Conformitate GDPR & Confidențialitate:** Telemetrie anonimă fără cookies terțe, fără colectare de adrese IP și fără stocare persistentă invazivă, documentată complet în [`confidentialitate.html`](confidentialitate.html).

---

## 🎛️ Panou Administrativ Modular (CMS Studio v4.0)

Panoul de administrare v4.0 este complet modularizat în 29 de module ES6 native (`admin/js/`), fără dependențe de build sau compilare, proiectat conform standardelor de referință (AdminLTE, Tabler, react-admin, Ghost Admin) și protejat prin arhitectura **Zero-Trust**:

### 1. 🎚️ Dual Mode (Simplu / Avansat)
* **Mod Simplu (pentru non-programatori):** Formulare ghidate în limba română, validări prietenoase, previzualizări vizuale Bento, comutatoare cu un singur clic.
* **Mod Avansat (pentru utilizatori tehnici):** Consola Coder, editor JSON brut, inspectare politici RLS, generator snippets API, selector de volum de date.

### 2. 📝 Editori Specializați de Conținut
* **Setări Filială (`public.setari`):** Date oficiale de contact, cont bancar BRD, link înregistrare SGR 2026, cotizații anuale și ghid de aderare, cu bară flotantă de salvare a modificărilor nesalvate.
* **Conducere & Echipă (`public.leadership`):** Reordonare secvențială sus/jos (`ordine`), comutator afișare publică, asignare fotografii și editare profiluri.
* **Întrebări Frecvente (`public.faq`):** Organizare pe 4 categorii oficiale, reordonare, formatare Markdown-lite sigură (fără `innerHTML`), comutator publicare/ciornă.
* **Documente Oficiale (`public.documente`):** Formulare tipizate, recunoaștere automată tip fișier (PDF/DOCX), link-uri descărcare și etichete oficiale.
* **Știri & Comunicate v2 (`public.stiri`):** Editor avansat cu categorie, anvergură (local / național), locație fizică, link acțiune extern, previzualizare fidelă Bento card.
* **Registru Membri v2 (`public.membri`):** Import în masă din fișiere CSV cu validare duplicate ID, conservare etichetă „Date demonstrative” și acțiuni rapide.

### 3. 🖼️ Galerie Media & Supabase Storage
* Bucket dedicat `media` în Supabase Storage cu limită 5MB și citire publică.
* Zonă drag-and-drop pentru încărcare fișiere din calculator.
* Compresie automată client-side în format WebP cu redimensionare pe canvas HTML5 la maximum 1600px.
* Vizualizare separată a fișierelor din Cloud Storage și a celor din arhiva repo (`ugr-images/`).

### 4. 👥 Gestiune Roluri & RBAC (`public.admini`)
* Niveluri de acces strict delimitate: `owner`, `editor`, `viewer`.
* Schimbare dinamică a rolurilor și activare/dezactivare conturi de administrator.
* Modal de înregistrare administrator nou cu generare link invitație.

### 5. 🗑️ Coș de Reciclate (Trash / Soft-Delete)
* Ștergere logică sigură (`deleted_at IS NOT NULL`) pe Membri, Știri, Conducere, FAQ și Documente.
* Restaurare cu un singur clic (resetează `deleted_at = NULL`).
* Ștergere definitivă (Purge) restricționată exclusiv pentru rolul `owner`, cu confirmare manuală prin tastarea cuvântului „STERGE”.
* Sugestie și golire în masă a elementelor șterse de peste 30 de zile.

### 6. 🕒 Istoric Modificări & Audit Diff (`public.audit_log`)
* Buton „🕒 Istoric” prezent pe toate cardurile și rândurile de conținut.
* Cronologie vizuală a modificărilor (INSERT, UPDATE, DELETE, RESTORE).
* Comparație vizuală câmp-cu-câmp (Vechi vs. Nou) colorată.
* Restaurare instantanee la o versiune anterioară („Restaurează această versiune”).

### 7. 👤 Conversie Cerere → Membru Oficial
* Buton „👤 Convertește în Membru” pe orice cerere de adeziune aprobată.
* Auto-populare a datelor solicitantului și generare ID unic de registru.
* Legătură automată (`cereri_inscriere.membru_id`) și înregistrare în jurnalul de audit.

### 8. 🔔 Notificări Realtime & Clopoțel Antet
* Clopoțel animat în antet cu contor de cereri noi în așteptare.
* Meniu dropdown cu cererile recente și acces instantaneu.
* Abonare pe WebSocket Realtime Postgres la sosirea cererilor noi.

### 9. 🔄 Pagină Stare Sincronizare (Sync Status Probe)
* Sondă automată live: interoghează anonim toate cele 8 tabele din perspectiva unui vizitator neautentificat.
* Compară datele publice cu baza de date și confirmă că tabelele confidențiale returnează HTTP 401.
* Monitorizare latență (ms) și indicatori de stare (🟢 Sincronizat / 🔴 Neconcordanță / 🔒 Blocat RLS).

### 10. 💻 Consolă Dezvoltator (Coder Mode)
* Browser generic de tabele cu căutare și filtrare.
* Editor JSON brut pe rânduri cu validare și salvare directă în Supabase.
* Export JSON și CSV pe orice tabelă.
* Export complet al bazei de date („Full Backup Bundle JSON”).
* Inspector politici RLS și generator de snippets API.

---

## 🛡️ Arhitectura de Securitate Zero-Trust

| Pilon de Securitate | Implementare în Platformă |
| :--- | :--- |
| **Autentificare AAL2 TOTP** | Accesul administrativ este condiționat de validarea factorului secundar (TOTP Google Authenticator / GoTrue AAL2). |
| **Row Level Security (RLS)** | Politici stricte pe toate tabelele PostgreSQL (`admini`, `membri`, `stiri`, `leadership`, `faq`, `documente`, `setari`, `cereri_inscriere`, `audit_log`, `vizite`). |
| **Roluri RBAC** | `owner` (drepturi depline), `editor` (editare conținut), `viewer` (doar citire). |
| **Chei Publice Izolate** | Frontend-ul utilizează exclusiv cheia publică `anonKey`; nicio cheie `service_role` nu este expusă în cod. |
| **Zero-Trust DOM API** | Manipulare exclusivă prin API-uri DOM native (`document.createElement`, `textContent`); **zero `innerHTML`** utilizat în logica dinamică nouă. |
| **Zero-Storage Persistență** | Niciun token sau credențial sensibil nu este salvat în `localStorage`; starea sesiunii este menținută în memoria securizată a clientului. |
| **Soft-Delete Protejat** | Nicio ștergere accidentală nu distruge date; elementele merg în Coș și pot fi restaurate. |

Consultați [`SECURITY.md`](SECURITY.md) pentru raportarea vulnerabilităților și matricea completă de permisiuni.

---

## 📁 Structura Tehnică a Repository-ului

```text
├── index.html               # Portalul oficial public (servit de GitHub Pages)
├── confidentialitate.html   # Politica oficială de confidențialitate și conformitate GDPR
├── script.js                # Logica frontend portal: încărcare dinamică DB, fallback-uri, hartă
├── style.css                # Sistemul de design instituțional și stilurile vizuale
├── data.js                  # Date de rezervă locale (repere geodezice, demo fallback)
├── borders.js               # Coordonate vectoriale pentru harta Sector 1
├── demos-faq.html           # Secțiunea FAQ & Contact (legată din index.html)
├── demos-membri.html        # Registrul membrilor și procedura de aderare
├── showcase/                # Calculatorul Stereo 70 + cele 5 variante de design
├── admin/
│   ├── panou.html           # Panoul administrativ complet (CMS Studio v4.0)
│   ├── panou.legacy.html    # Copie de siguranță a panoului monolit anterior
│   ├── index.html           # Punct de acces și redirecționare securizată către panou.html
│   ├── css/
│   │   └── panel.css        # Sistemul vizual complet al panoului administrativ
│   └── js/                  # 31 de module ES6 native
│       ├── main.js          # Orchestrator principal și ascultători de evenimente
│       ├── auth.js          # Autentificare Magic Link + TOTP AAL2 & rutare vederi
│       ├── state.js         # Starea centralizată a aplicației (store reactiv)
│       ├── supabase.js      # Inițializare client Supabase SDK
│       ├── lib/             # Utilitare: CSV, formatare, DOM sigur fără innerHTML, db.js (writeRows/describeDbError)
│       ├── ui/              # Componente UI: Mod Simplu/Avansat, Notificări, Media, Modal, Paginare, Spotlight Ctrl+K, Toast
│       └── views/           # 14 Vederi: Overview, Requests, Members, News, Settings, Pages, Leadership, FAQ, Documents, Telemetry, Trash, Roles, Sync, Coder
├── supabase/
│   ├── migrations/          # Migrări SQL versionate + scripturi de rollback și verificare
│   ├── baseline/            # Starea reală a DB-ului exportată: politici, tabele, funcții, declanșatoare
│   ├── seed/
│   └── combined_004_005.sql
├── tools/                   # Scripturi de verificare referite de package.json (test:data)
│   └── verificare-date.js   # Verifică datele oficiale publice
├── scratch/                 # Unelte de dezvoltare: sintaxă, audit-uri, calcul SRI
│   ├── check_syntax.mjs     # Verifică sintaxa celor 31 de module din admin/js (test:syntax)
│   ├── audit-coloane.mjs    # Testează fiecare .select()/.insert() prin REST, cu cheia anon
│   ├── audit-imports.mjs    # Verifică că fiecare simbol importat există în modulul sursă
│   ├── audit-ids.mjs        # Verifică că fiecare getElementById() există în HTML
│   ├── audit-rls.mjs        # Caută tabele fără SELECT pentru administrator
│   ├── sri-supabase.mjs     # Calculează hash-ul SRI pentru supabase-js
│   └── check-page-fields.mjs# Compară cheile salvate de panou cu cele citite de portal
├── backups/                 # Instantanee de siguranță JSON și arhive
├── _archive/                # Istoric și experimente nepublicate (NU sunt servite)
└── ugr-images/              # Active grafice și fotografii oficiale de arhivă
```

> **Notă despre `_archive/`** — conține versiuni anterioare ale site-ului (`demo-v2/`,
> `ugr-variants/`, `backup/`) și scripturi de dezvoltare (`dev-scripts/`). Folderul
> este exclus din `robots.txt` și nu este legat din nicio pagină publică. Nu modifica
> nimic acolo. Vezi [`_archive/README.md`](_archive/README.md).
>
> **Singura excepție:** `dev-scripts/tools/verificare-date.js` a fost mutat înapoi în
> `tools/`, fiindcă `package.json` îl referă prin `npm run test:data`. Dacă ar rămâne
> în arhivă, comanda se oprește cu „Cannot find module". Un instrument de test pe care
> îl rulezi nu are ce să caute într-un folder de istoric.

---

## 🛠️ Ghid de Rulare Locală & Testare

### 1. Pornire Server Local

Pentru a testa aplicația local (cu suport complet pentru module ES6):

**Opțiunea A — Node.js (Recomandat):**
```bash
npx serve -l 3000
# sau
npx http-server -p 3000
```

**Opțiunea B — Python:**
```bash
python -m http.server 3000
```

### 2. Accesare în Browser

* **Portal Public:** `http://localhost:3000/index.html`
* **Panou Administrativ:** `http://localhost:3000/admin/panou.html` (sau `http://localhost:3000/admin/`)

### 3. Verificări Automate de Integritate

Pentru a valida integritatea datelor oficiale și sintaxa JavaScript:
```bash
node tools/verificare-date.js
node scratch/check_syntax.mjs
```

Audit-uri suplimentare, care verifică lucruri pe care `check_syntax.mjs` nu le atinge:
```bash
node scratch/audit-coloane.mjs   # fiecare .select()/.insert() testat prin REST, cu cheia anon
node scratch/audit-imports.mjs   # fiecare simbol importat există în modulul sursă
node scratch/audit-ids.mjs       # fiecare getElementById() există în HTML
node scratch/audit-rls.mjs       # tabele fără SELECT pentru administrator
```

`audit-coloane.mjs` are nevoie de cheia `anon` (se află în `admin/js/supabase.js`).
Restul merg offline.

---

## 📞 Contact Oficial Filiala Sector 1

* **Email:** [filiala.ugr.s1@gmail.com](mailto:filiala.ugr.s1@gmail.com)
* **Telefon:** 0726 390 774
* **Sediu / Parteneriat Academic:** Facultatea de Îmbunătățiri Funciare și Ingineria Mediului (FIFIM) — USAMV București (Bvd. Mărăști nr. 59, Sector 1)
* **Canale Social Media Oficiale:**
  * Facebook: [Filiala Sector 1 UGR](https://www.facebook.com/share/14xwxtFChmC/)
  * Instagram: [@filiala.sector1.ugr](https://www.instagram.com/filiala.sector1.ugr)
