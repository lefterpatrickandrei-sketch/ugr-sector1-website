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

## 💡 Casetă de Sugestii și Idei (Website orientat spre Clienți)

Pentru a transforma website-ul dintr-o pagină instituțională rigidă într-un **portal prietenos, orientat către clienții** serviciilor geodezice și topografice, poți analiza următoarele propuneri tehnice și de structură. Alege ideile care se potrivesc cel mai bine obiectivelor filialei:

1. **Convertor Coordonate (Stereo 70 -> WGS84) integrat:**
   * *Utilitate:* Clienții tehnici (proiectanți, arhitecți, constructori) folosesc des Stereo 70. Permiterea unei transformări rapide direct pe site le oferă o unealtă practică și îi aduce pe site în mod repetat.
2. **Calculator de Deviz / Estimator de Costuri Online:**
   * *Utilitate:* Clienții persoane fizice vor să afle rapid "cât costă o intabulare/cadastru". Un formular interactiv unde selectează tipul terenului (intravilan/extravilan), suprafața și tipul lucrării le poate returna o cotație estimativă instant.
3. **Sistem de Programări Online pentru Măsurători (Scheduler):**
   * *Utilitate:* Integrarea unui calendar online (tip Calendly sau similar) unde clienții își pot alege o zi și o oră liberă pentru vizita geodezului pe teren, reducând timpul pierdut cu telefoanele.
4. **Ghid de Informare Cadastru & Legislație (FAQ):**
   * *Utilitate:* Documentarea pe înțelesul tuturor a pașilor pentru obținerea cărții funciare sau intabularea unei case (cu termene, acte necesare și avize), sporind încrederea clienților în expertiza filialei.
5. **Widget de Contact Rapid WhatsApp:**
   * *Utilitate:* Un buton plutitor de WhatsApp care permite clienților să trimită o poză cu un act sau un plan de amplasament direct de pe telefon pentru a primi o ofertă personalizată în câteva minute.

---

## 🛠️ Detalii Tehnice Hartă 3D
* **Motor Randare:** [Globe.gl](https://github.com/vasturiano/globe.gl) bazat pe Three.js.
* **Proiecție Coordonate:** Coordonatele Stereo 70 din tabelul de membri sunt convertite local în WGS84 folosind biblioteca `proj4.js` și proiectate automat pe sferă.
* **Contur Granițe (Offline):** Harta încarcă vectorii de graniță pentru România, Moldova și restul continentelor din fișierul local `borders.js` pentru a rula securizat și fără latențe sub protocolul `file://`.
