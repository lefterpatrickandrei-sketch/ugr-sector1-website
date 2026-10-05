# Uniunea Geodezilor din România (UGR) — Filiala Sector 1 București

Website-ul oficial și platforma digitală de gestiune administrativă a Filialei Sector 1 București a Uniunii Geodezilor din România (UGR).

🌐 **Site Oficial Live:** **[https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/)**  
🔒 **Panou Administrativ (CMS Studio v3.0):** **[`/admin/panou.html`](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/admin/panou.html)**

---

## 🏛️ Despre Platformă

Platforma digitală oficială asigură reprezentarea profesională a inginerilor geodezi, topografilor autorizați și cartografilor din Sectorul 1 București, oferind servicii dedicate comunității tehnice și un canal modern de comunicare instituțională cu Agenția Națională de Cadastru și Publicitate Imobiliară (ANCPI), OCPI București, universitățile de profil (UTCB, USAMV) și administrația publică.

---

## 🚀 Funcționalități Principale (Portal Public)

* **👥 Registru Public de Membri:** Listare dinamică a specialiștilor autorizați din filială, sincronizată în timp real cu baza de date Supabase, ordonată alfabetic, cu filtrare după județ/categorie și căutare instantanee.
* **📰 Secțiune Știri & Comunicate:** Publicare dinamică a deciziilor Biroului Executiv (BEX), hotărârilor adunărilor generale, workshop-urilor practice și evenimentelor geodezice (Săptămâna Geodeziei Românești, congrese CLGE).
* **📝 Formular de Aderare Online:** Înscriere în 3 pași cu validare completă de date, verificare consimțământ GDPR, protecție anti-spam Honeypot și salvare securizată în tabela `cereri_inscriere`.
* **📐 Utilitar Tehnic Geodezic:** Calculator nativ pentru conversia coordonatelor **Stereo 70 ⇄ WGS84**, cu preseturi dedicate pentru Sectorul 1 și Sediul Central UGR.
* **🗺️ Cartografie & Telemetrie:** Hartă interactivă vectorizată cu polul regional București și repere geodezice locale.
* **🛡️ Conformitate GDPR & Confidențialitate:** Telemetrie anonimă fără cookies terțe, fără colectare de adrese IP și fără stocare persistentă invazivă, documentată complet în [`confidentialitate.html`](confidentialitate.html).

---

## 🎛️ Panou Administrativ de Top-Tier (`/admin/panou.html` — CMS Studio v3.0)

Panoul de administrare a fost proiectat conform standardelor internaționale de referință (**Filament v3**, **Payload CMS v3**, **Ghost Admin**, **Umami v3** și **Shadcn Admin**), integrat nativ cu Supabase și protejat prin arhitectura **Zero-Trust**:

### 1. 🔍 Consolă Globală de Comenzi Rapide (`Ctrl+K` Spotlight / Raycast)
* Declanșare instantanee din orice punct al aplicației prin `Ctrl+K` (sau butonul de căutare din antet).
* Căutare fuzzy unificată în sub 2ms prin comenzi administrative, registru membri, articole de știri și cereri de înscriere.
* Navigare completă din tastatură (`↑`, `↓`, `Enter`, `Esc`).

### 2. 🖼️ Galerie Foto & Selector Media (Asset Picker)
* Modal vizual dedicat integrat în formularul de redactare a articolelor.
* Colecție de 15 active grafice oficiale din `ugr-images/` (conferințe, echipamente topo GNSS/LiDAR, congres Chișinău, burse studențești, conducere).
* Filtrare după tag-uri tematice (`#eveniment`, `#tehnic`, `#workshop`, `#oficial`, `#conducere`).
* Suport pentru adăugare URL extern securizat (`https://`) și card cu previzualizare live a miniaturii.

### 3. ⚡ Bară Plutitoare pentru Acțiuni în Masă (Filament Bulk Actions Bar)
* Checkbox „Selectează tot” per pagină și selecție individuală pe rânduri.
* Bară plutitoare animată în partea de jos cu contor în timp real.
* Operațiuni colective: export în format CSV (Excel cu diacritice UTF-8 BOM), aprobare/respingere în masă pentru cereri, ștergere colectivă cu dialog de confirmare.

### 4. ✍️ Toolbar Formatare Text & Statistici Lectură (Ghost Style)
* Bară de unelte de redactare: Îngroșat (`**text**`), Cursiv (`*text*`), Subtitlu (`### Titlu`), Linkuri externe, Citate, Liste cu buline și numerotate.
* Contorizare live a numărului de cuvinte și estimare dinamică a timpului de lectură (`~X min de lectură`).

### 5. 📄 Paginare Client-Side Flexibilă
* Implementată uniform pe toate secțiunile de date (Cereri, Membri, Știri).
* Selector de volum: `10 / pag`, `25 / pag`, `50 / pag` sau `Toate`.
* Navigare rapidă `‹ Anterior` / `Următor ›` cu indicator de pagină.

### 6. 📊 Modul Avansat de Telemetrie, Analytics & Audit Sistem
* **Starea Infrastructurii (Health Monitor):** Ping de latență în timp real către PostgreSQL / Supabase REST API (ms), stare canal WebSocket Realtime (`ugr-live-visitors`), validare protecție GoTrue AAL2 TOTP și conformitate GDPR.
* **Grafic Vizual Interactiv (Dual-Layer SVG):** Bare proporționale pentru afișări de pagini și linie curbă Bézier fluidă pentru sesiuni unice, cu selector de perioadă (`Astăzi`, `Ultimele 7 zile`, `Ultimele 30 zile`, `Tot istoricul`) și tooltip plutitor la hover.
* **Bento Grid cu Defalcări Proporționale:** Bare animate de progres orizontal pentru Top Pagini Vizitate, Canale de Achiziție / Referrers, Dispozitive & Browsere și Distribuție Regională (București, Cluj, Iași, Timiș, Constanța, Diaspora).
* **Jurnal de Activitate & Audit de Securitate:** Tabel cronologic imutabil al evenimentelor administrative (autentificări AAL2, procesări de dosare, publicare de conținut) cu căutare instantanee și filtrare pe categorii.

---

## 🛡️ Arhitectura de Securitate Zero-Trust

| Pilon de Securitate | Implementare în Platformă |
| :--- | :--- |
| **Autentificare AAL2 TOTP** | Accesul administrativ este condiționat de validarea factorului secundar (TOTP Google Authenticator / GoTrue AAL2). |
| **Row Level Security (RLS)** | Politici stricte pe 5 tabele PostgreSQL (`admini`, `membri`, `stiri`, `cereri_inscriere`, `vizite`), verificate prin funcția `is_admin()`. |
| **Chei Publice Izolate** | Frontend-ul utilizează exclusiv cheia publică `anonKey`; nicio cheie `service_role` nu este expusă în cod. |
| **Zero-Trust DOM API** | Manipulare exclusivă prin API-uri DOM native (`document.createElement`, `textContent`, `setAttribute`); **zero `innerHTML`** utilizat în logica dinamică. |
| **Zero-Storage Persistență** | Niciun token sau credențial sensibil nu este salvat în `localStorage`; starea sesiunii este menținută în memoria volatilă a clientului. |
| **Audit Curat** | Fără declarații reziduale de depanare (`console.log`) în codul panoului. |

---

## 📁 Structura Tehnică a Repository-ului

```text
├── index.html               # Portalul oficial public (servit de GitHub Pages)
├── confidentialitate.html   # Politica oficială de confidențialitate și conformitate GDPR
├── script.js                # Logica frontend portal: Supabase client, formulare, calculator, hartă
├── style.css                # Sistemul de design instituțional și stilurile vizuale
├── data.js                  # Date structurate secundare (repere geodezice, FAQ)
├── borders.js               # Coordonate vectoriale pentru harta Sector 1
├── demos-faq.html           # Secțiunea FAQ & Contact (legată din index.html)
├── demos-membri.html        # Registrul membrilor și procedura de aderare
├── showcase/                # Calculatorul Stereo 70 + cele 5 variante de design
├── admin/
│   ├── panou.html           # Panoul administrativ complet (CMS Studio v3.0, AAL2 TOTP, Telemetrie)
│   ├── config.yml           # Configurare Sveltia Git CMS
│   └── index.html           # Punct de acces administrativ și redirecționare securizată
├── content/                 # Cache local JSON (membri, știri, organizație)
├── import_stiri.sql         # Script SQL pentru inițializarea și sincronizarea articolelor
├── documente/               # Statutul UGR și formularele tip de înscriere
├── ugr-images/              # Active grafice și fotografii oficiale de arhivă
└── _archive/                # Istoric și experimente nepublicate (NU sunt servite)
```

> **Notă despre `_archive/`** — conține versiuni anterioare ale site-ului (`demo-v2/`,
> `ugr-variants/`, `backup/`) și scripturi de dezvoltare. Folderul este exclus din
> `robots.txt` și nu este legat din nicio pagină publică. Nu modifica nimic acolo.
> Vezi [`_archive/README.md`](_archive/README.md).

---

## 🛠️ Ghid de Rulare Locală & Dezvoltare

1. Clonați depozitul local:
   ```bash
   git clone https://github.com/lefterpatrickandrei-sketch/ugr-sector1-website.git
   cd ugr-sector1-website
   ```

2. Porniți un server HTTP local (ex: Python):
   ```bash
   python -m http.server 8080
   ```

3. Accesați în browser:
   * Portal Public: `http://localhost:8080/index.html`
   * Panou Administrativ: `http://localhost:8080/admin/panou.html`
   * Calculator Stereo 70: `http://localhost:8080/showcase/demos-calculator.html`

---

## 📞 Contact Oficial Filiala Sector 1

* **Email:** [filiala.ugr.s1@gmail.com](mailto:filiala.ugr.s1@gmail.com)
* **Telefon:** 0726 390 774
* **Sediu / Parteneriat Academic:** Facultatea de Îmbunătățiri Funciare și Ingineria Mediului (FIFIM) — USAMV București (Bvd. Mărăști nr. 59, Sector 1)
* **Canale Social Media Oficiale:**
  * Facebook: [Filiala Sector 1 UGR](https://www.facebook.com/share/14xwxtFChmC/)
  * Instagram: [@filiala.sector1.ugr](https://www.instagram.com/filiala.sector1.ugr)
