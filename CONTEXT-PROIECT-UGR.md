# 🏛️ CONTEXT OFICIAL & PREDARE ȘTAFETĂ — UGR FILIALA SECTOR 1 BUCUREȘTI

> [!IMPORTANT]
> **Fișier de orientare pentru orice sesiune nouă Antigravity deschisă în proiectul `webugr` (`C:\Users\lefpa\webugr`).**
> Citește acest document la începutul fiecărei conversații pentru a avea sincronizare 100% cu starea proiectului, deciziile validate și regulile stricte.

---

## 📌 1. Identitate & Repere Proiect
- **Organizație:** Uniunea Geodezilor din România (UGR) — Filiala Sector 1 București
- **Cale locală Workspace:** `C:\Users\lefpa\webugr`
- **Branch Git Activ:** `faza3-admin` (sau `main`)
- **Repository GitHub:** `https://github.com/lefterpatrickandrei-sketch/ugr-sector1-website`
- **Site Live GitHub Pages:** `https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/`
- **Domeniu Oficial Țintă:** `ugrsector1.ro` (R1)
- **Email Oficial:** `filiala.ugr.s1@gmail.com` (R2)

---

## 📋 2. Reguli Stricte de Conformitate (din `VERIFICARE-DATE-UGR-SECTOR1.md`)
1. **R1 (Domeniu):** Orice referință publică trebuie să fie `ugrsector1.ro`.
2. **R2 (Email):** Toate formularele și datele de contact folosesc `filiala.ugr.s1@gmail.com`.
3. **R3 (Documente):** Fișierele Word personalizate din folderul `documente/` se păstrează intacte.
4. **R4 (Conducere BEX):** Se păstrează toți cei 6 membri oficiali ai Biroului Executiv (Alexandru Dorin PĂUN - Președinte, Mircea AFROSIMIE - Vicepreședinte, Andra Teodora VIȘAN - Secretar, etc.).
5. **R5 (Date Bancare):** STRICT contul oficial BRD (`RO57 BRDE 426S V810 0757 4450`) pentru cotizații. Contul BCR a fost eliminat definitiv.
6. **R6 (Git Push):** Niciun commit/push pe `origin` fără aprobarea explicită a utilizatorului.
7. **R7 (Audit Script):** `node tools/verificare-date.js` trebuie să treacă 10/10 `[OK]`.

---

## 🏗️ 3. Arhitectura Tehnică Realizată Până în Prezent

### A. Portalul Public (`index.html`, `style.css`, `script.js`)
- Design Modern **Dark Luxury & Glassmorphism** (conform standardelor 2026).
- **Calculator Geodezic Transversal:** Stereo 70 (EPSG:3844) ⇄ WGS84 conform normelor ANCPI.
- **Registru Public de Membri:** Căutare instantanee, filtrare, badge-uri de autorizare ANCPI.
- **Formular Aderare Multi-Step:** Validare în 3 pași cu capcană de focus și accesibilitate WCAG 2.2 AA.
- **Evenimente & Știri:** SGR Chișinău 2026, burse studențești FIFIM USAMV.
- **SEO & Social Share:** Card OpenGraph 1200×630, `sitemap.xml`, `robots.txt`, `manifest.json`.

### B. Panoul Administrativ Top-Tier CMS (`/admin/panou.html` — CMS Studio v3.0)
- **Acces:** `https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/admin/panou.html`
- **Arhitectură Zero-Trust:** Integrat cu **Supabase** (PostgreSQL) cu Row Level Security (RLS) și GoTrue AAL2 TOTP.
- **Funcționalități Implementate:**
  1. `Ctrl+K` Spotlight Command Palette (căutare unificată în sub 2ms).
  2. Galerie Media & Selector Imagini (15 active oficiale din `ugr-images/`).
  3. Bară Plutitoare Acțiuni în Masă (Bulk Actions, export CSV Excel UTF-8 BOM, aprobare colectivă cereri).
  4. Toolbar Redactare Format Text (Ghost Style) cu contor de cuvinte și timp de lectură.
  5. Paginare Client-Side flexibilă (10, 25, 50, Toate).
  6. Modul Telemetrie & Analytics GDPR (fără cookies invazive, grafic SVG interactiv, monitorizare latență Supabase).
- **Tabele Supabase:**
  - `membri` (registru specialiști)
  - `stiri` (articole și comunicate)
  - `cereri_inscriere` (formulare de aderare primite online)
  - `vizite` (statistici anonime de trafic)
  - `admini` (utilizatori autorizați)

---

## 🎯 4. Cum se continuă lucrul într-o sesiune nouă
1. Când deschizi o conversație nouă în `webugr`, agentul va găsi automat toate fișierele proiectului direct în workspace.
2. Spune-i noului agent ce anume vrei să testezi sau să îmbunătățești (ex: testare formulare, conectare Google Sheets suplimentară, lansare pe domeniu personalizat `ugrsector1.ro`).
3. Agentul va rula comenzile direct în `C:\Users\lefpa\webugr`.
