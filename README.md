# Uniunea Geodezilor din România (UGR) — Filiala Sector 1

> [!IMPORTANT]  
> **Status Proiect:** 🚧 Proiect în lucru (Under Construction).  
> Design-ul actual este în curs de dezvoltare. Urmează să fie adăugate fotografii reale de la evenimente, detalii administrative suplimentare, și alte date necesare pentru a completa structura finală a website-ului.

Acest repository conține codul sursă pentru website-ul oficial al Filialei Sector 1 a Uniunii Geodezilor din România.

---

## 🌐 Previzualizare Live Propuneri & Original

Pentru a vizualiza propunerile de design și a le compara cu versiunea inițială a site-ului, accesează linkurile de mai jos (servite prin GitHub Pages):

| Versiune Website | Descriere Vizuală & Stilistică | 🌐 Previzualizare Live (GitHub Pages) |
| :--- | :--- | :--- |
| **Site-ul Original** | ⚠️ **Fără Harta 3D** (Varianta inițială a site-ului, nu conține globul interactiv) | [Deschide Site Original](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/index.html) |
| **Propunerea 1 (Ales)** | **Tech-Precision Grid** (Temă Cyan/Portocaliu, hartă 3D de precizie cu tooltips pe hover, layout curat) | [Deschide Varianta 1](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-1.html) |
| **Propunerea 2** | **Vintage Brass/Editorial** (Temă Aurie/Terracotta, stil academic elegant, etichete pe hover) | [Deschide Varianta 2](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-2.html) |
| **Propunerea 3** | **Swiss Corporate/Clean** (Temă Crimson Red/Royal Blue, font modern geometric, etichete pe hover) | [Deschide Varianta 3](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-3.html) |

> [!NOTE]  
> Pentru ca linkurile de mai sus să funcționeze, opțiunea **GitHub Pages** trebuie să fie activată în tab-ul *Settings -> Pages* al repository-ului tău (selectând branch-ul `main` ca sursă de deployment).

---

## 💡 Idei și Sugestii pentru un Website orientat către Clienți

Pentru a transforma acest website dintr-o pagină instituțională de prezentare într-un **portal valoros și atractiv pentru clienții** serviciilor topografice/geodezice, iată câteva idei de funcționalități propuse (unele dintre acestea sunt simulate în noile variante):

1. **Caseta Interactivă de Sugestii Client (Implementată local pe variante):**
   * Am adăugat pe pagină o secțiune de feedback în timp real. Clienții pot trimite sugestii legate de site sau servicii, care sunt stocate securizat în `localStorage`-ul browserului.
   * **Cum o citești:** Administratorul site-ului (tu) poate vedea o listă cu toate feedback-urile trimise apăsând pe butonul "Afișează" din panoul de administrare local aflat sub formular.
2. **Calculator Automat de Prețuri / Estimator de Deviz:**
   * Un widget interactiv unde clienții introduc detaliile terenului lor (suprafață în mp, tipul lucrării: cadastru, intabulare, trasare limite, ridicare topo) și primesc o estimare de cost și durată instant.
3. **Sistem de Programări Online (Appointment Scheduler):**
   * Integrare cu Calendly sau un formular de programare directă pentru consultanță gratuită la sediu sau pe teren.
4. **Secțiune de Întrebări Frecvente (FAQ) pentru Clienți:**
   * Explicații pe înțelesul tuturor despre diferențele dintre intabulare, cadastru și carte funciară, ghidând clienții pas cu pas în procesele lor administrative.
5. **Widget de Chat Rapid (WhatsApp Integration):**
   * Un buton plutitor de WhatsApp care permite clienților să inițieze o conversație directă cu un inginer geodez autorizat de gardă pentru oferte rapide.

---

## 🛠️ Detalii Tehnice Hartă 3D
* **Motor Randare:** [Globe.gl](https://github.com/vasturiano/globe.gl) bazat pe Three.js.
* **Proiecție Coordonate:** Coordonatele Stereo 70 din tabelul de membri sunt convertite local în WGS84 folosind biblioteca `proj4.js` și proiectate automat pe sferă.
* **Contur Granițe (Offline):** Harta încarcă vectorii de graniță pentru România, Moldova și restul continentelor din fișierul local `borders.js` pentru a rula securizat și fără latențe sub protocolul `file://`.
