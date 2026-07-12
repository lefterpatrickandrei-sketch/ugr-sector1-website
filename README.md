# Uniunea Geodezilor din România (UGR) — Filiala Sector 1

Acest repository conține codul sursă pentru website-ul oficial al Filialei Sector 1 a Uniunii Geodezilor din România.

---

## 🌐 Previzualizare Variante Interactive Hărți 3D (Globe.gl)

Pentru a vizualiza și testa direct în browser propunerile de design pentru harta interactivă a filialelor (glob 3D cu localizare precisă, conexiuni geodezice și interfață premium), folosește linkurile de previzualizare de mai jos:

| Variantă Propunere | Descriere Vizuală & Stilistică | 🌐 Previzualizare Live (GitHub Pages) |
| :--- | :--- | :--- |
| **Varianta 1** | **Tech-Precision Grid** (Temă Cyan/Portocaliu, etichete curate pe hover, layout curat) | [Deschide Varianta 1](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-1.html) |
| **Varianta 2** | **Vintage Brass/Editorial** (Temă Aurie/Terracotta, stil academic elegant, etichete pe hover) | [Deschide Varianta 2](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-2.html) |
| **Varianta 3** | **Swiss Corporate/Clean** (Temă Crimson Red/Royal Blue, font modern geometric, etichete pe hover) | [Deschide Varianta 3](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-3.html) |

> [!IMPORTANT]  
> Pentru ca linkurile de previzualizare de mai sus să funcționeze, asigură-te că opțiunea **GitHub Pages** este activată în tab-ul *Settings -> Pages* al repository-ului tău de pe GitHub (selectând branch-ul `main` ca sursă de deployment).

---

## 🛠️ Detalii Tehnice Hartă 3D
* **Motor Randare:** [Globe.gl](https://github.com/vasturiano/globe.gl) bazat pe Three.js.
* **Proiecție Coordonate:** Coordonatele Stereo 70 din tabelul de membri sunt convertite local în WGS84 folosind biblioteca `proj4.js` și proiectate automat pe sferă.
* **Contur Granițe (Offline):** Harta încarcă vectorii de graniță pentru România, Moldova și restul continentelor din fișierul local `borders.js` pentru a rula securizat și fără latențe sub protocolul `file://`.
