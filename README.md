# Uniunea Geodezilor din România (UGR) — Filiala Sector 1 București

Website-ul oficial și platforma digitală de gestiune a Filialei Sector 1 București a Uniunii Geodezilor din România (UGR).

🌐 **Site Oficial Live:** **[https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/)**

---

## 🏛️ Despre Platformă

Platforma digitală oficială asigură reprezentarea profesională a inginerilor geodezi, topografilor autorizați și cartografilor din Sectorul 1 București, oferind servicii dedicate comunității tehnice și un canal modern de comunicare instituțională cu ANCPI, OCPI București și administrația publică.

### Funcționalități Principale

* **Registru Public de Membri:** Listare dinamică a membrilor autorizați, sincronizată în timp real cu baza de date Supabase, ordonată alfabetic, cu filtrare după județ și căutare rapidă.
* **Secțiune Știri & Noutăți:** Publicare dinamică a articolelor, comunicatelor profesionale și evenimentelor din domeniu.
* **Formular de Aderare Online:** Înscriere în 3 pași cu validare completă de date, verificare consimțământ GDPR, protecție anti-spam Honeypot și salvare securizată a cererilor.
* **Utilitar Tehnic Geodezic:** Calculator nativ pentru conversia coordonatelor **Stereo 70 ⇄ WGS84**, cu preseturi dedicate pentru Sectorul 1 și Sediul Central UGR.
* **Cartografie & Telemetrie:** Hartă interactivă vectorizată cu polul regional București și repere geodezice locale.
* **Conformitate GDPR & Confidențialitate:** Telemetrie anonimă fără cookies, fără colectare de adrese IP și fără stocare persistentă invazivă, documentată complet în [`confidentialitate.html`](confidentialitate.html).

---

## 🔐 Panou de Administrare Securizat (`/admin/panou.html`)

Platforma dispune de un panou administrativ intern dedicat Biroului Executiv al Filialei Sector 1, construit pe principiul **Zero-Trust**:

* **Autentificare în 2 Pași (2FA):** Magic Link OTP pe email + verificare TOTP cu aplicație de autentificare (nivel de securitate **AAL2**).
* **Securitate la Nivel de Rând (Row Level Security):** Toate operațiunile sunt protejate în PostgreSQL prin politici RLS stricte (`is_admin()`). Fără utilizarea rolului de `service_role` în frontend.
* **Gestiune Cereri de Înscriere:** Vizualizare cereri noi, căutare și filtrare, salvare notițe interne Birou Executiv, schimbare status (*În așteptare*, *Aprobată*, *Respinsă*) și ștergere.
* **Gestiune Registru Membri:** Adăugare membri noi, editare date, activare/suspendare și comutator rapid pentru vizibilitatea publică pe site.
* **Gestiune Știri:** Creare și editare articole, validare strictă a adreselor de imagini, comutator Publicat / Ciornă și ștergere.
* **Zero-Storage:** Fără salvarea credențialelor sau sesiunilor sensibile în `localStorage`.

---

## 📁 Structura Tehnică a Repository-ului

```text
├── index.html               # Pagina principală a site-ului oficial (servită de GitHub Pages)
├── confidentialitate.html   # Politica oficială de confidențialitate și protecție GDPR
├── script.js                # Logica frontend: Supabase client, formulare, calculator, hartă
├── style.css                # Sistemul de design instituțional și stilurile vizuale
├── data.js                  # Date structurate secundare (repere geodezice, FAQ)
├── borders.js               # Coordonate vectoriale pentru harta Sector 1
├── admin/
│   ├── panou.html           # Panoul oficial securizat de administrare (AAL2 TOTP)
│   └── index.html           # Punct de acces administrativ
├── documente/               # Statutul UGR și formularele tip de înscriere
└── ugr-images/              # Active grafice și imagini oficiale de arhivă
```

---

## 📞 Contact Oficial Filiala Sector 1

* **Email:** [filiala.ugr.s1@gmail.com](mailto:filiala.ugr.s1@gmail.com)
* **Telefon:** 0726 390 774
* **Sediu / Parteneriat Academic:** Facultatea de Îmbunătățiri Funciare și Ingineria Mediului (FIFIM) — USAMV București (Bvd. Mărăști nr. 59, Sector 1)
* **Canale Social Media Oficiale:**
  * Facebook: [Filiala Sector 1 UGR](https://www.facebook.com/share/14xwxtFChmC/)
  * Instagram: [@filiala.sector1.ugr](https://www.instagram.com/filiala.sector1.ugr)
