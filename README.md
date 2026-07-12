# Uniunea Geodezilor din România (UGR) — Filiala Sector 1

Acest repository conține codul sursă pentru website-ul oficial al Filialei Sector 1 a Uniunii Geodezilor din România.

---

## 🌐 Previzualizare Variante Interactive Hărți 3D (Globe.gl)

Pentru a vizualiza și testa direct în browser propunerile de design pentru harta interactivă a filialelor (glob 3D cu localizare precisă, conexiuni geodezice și interfață premium), folosește linkurile de previzualizare de mai jos:

| Variantă Propunere | Descriere Vizuală & Stilistică | 🚀 Previzualizare Rapidă (HTMLPreview) | 🌐 Previzualizare Alternativă (GitHub Pages) |
| :--- | :--- | :--- | :--- |
| **Varianta 1** | **Tech-Precision Grid** (Temă Cyan/Portocaliu, etichete curate pe hover, layout curat) | [Deschide Varianta 1](https://htmlpreview.github.io/?https://github.com/lefterpatrickandrei-sketch/ugr-sector1-website/blob/main/ugr-variants/variant-1.html) | [Deschide via GH Pages](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-1.html) |
| **Varianta 2** | **Vintage Brass/Editorial** (Temă Aurie/Terracotta, stil academic elegant, etichete pe hover) | [Deschide Varianta 2](https://htmlpreview.github.io/?https://github.com/lefterpatrickandrei-sketch/ugr-sector1-website/blob/main/ugr-variants/variant-2.html) | [Deschide via GH Pages](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-2.html) |
| **Varianta 3** | **Swiss Corporate/Clean** (Temă Crimson Red/Royal Blue, font modern geometric, etichete pe hover) | [Deschide Varianta 3](https://htmlpreview.github.io/?https://github.com/lefterpatrickandrei-sketch/ugr-sector1-website/blob/main/ugr-variants/variant-3.html) | [Deschide via GH Pages](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-3.html) |

> [!NOTE]  
> Linkurile din coloana **Previzualizare Rapidă (HTMLPreview)** randează codul HTML direct din fișierele repository-ului pe orice dispozitiv, fără a necesita configurări suplimentare.
> Pentru a activa linkurile din coloana **GitHub Pages**, asigură-te că activezi opțiunea GitHub Pages din tab-ul *Settings -> Pages* al repository-ului tău de pe GitHub (selectând branch-ul `main` ca sursă).

---

## 🛠️ Detalii Tehnice Hartă 3D
* **Motor Randare:** [Globe.gl](https://github.com/vasturiano/globe.gl) bazat pe Three.js.
* **Proiecție Coordonate:** Coordonatele Stereo 70 din tabelul de membri sunt convertite local în WGS84 folosind biblioteca `proj4.js` și proiectate automat pe sferă.
* **Contur Granițe (Offline):** Harta încarcă vectorii de graniță pentru România, Moldova și restul continentelor din fișierul local `borders.js` pentru a rula securizat și fără latențe sub protocolul `file://`.
