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

## 🗳️ Sondaj de Vot & Casetă de Sugestii (Live Poll & Customer Feedback)

> [!TIP]
> **Votare unică securizată:** Pentru a strânge feedback-ul tuturor vizitatorilor într-un mod centralizat, am creat un sondaj nativ pe GitHub.
> 
> * **Pasul 1:** Accesează link-ul de mai jos.
> * **Pasul 2:** Votează varianta de design preferată în widget-ul din partea de sus a discuției.
> * **Pasul 3:** Scrie direct în comentarii sugestiile tale pentru a adăuga idei noi pentru clienți.
> 
> 👉 **[APASĂ AICI PENTRU A VOTA ȘI A SCRIE SUGESTII](https://github.com/lefterpatrickandrei-sketch/ugr-sector1-website/discussions/1)** 👈

---

## 💡 Idei de Îmbunătățiri pentru Clienți (De discutat în comentarii)
Pentru a transforma website-ul într-un **portal prietenos pentru clienți**, poți analiza aceste propuneri și scrie în comentariile sondajului care ți se par potrivite:

1. **Convertor Coordonate (Stereo 70 -> WGS84) integrat:**
   * *Utilitate:* Clienții tehnici (proiectanți, arhitecți) fac transformări des. O unealtă utilă îi va aduce pe site repetat.
2. **Calculator de Deviz / Estimator de Costuri Online:**
   * *Utilitate:* Un formular interactiv unde clienții introduc datele terenului și obțin instant un preț estimativ pentru cadastru/intabulare.
3. **Sistem de Programări Online pentru Măsurători (Scheduler):**
   * *Utilitate:* Un calendar online (tip Calendly) unde clienții își rezervă ziua și ora pentru măsurătorile de teren ale geodezului.
4. **Ghid de Informare Cadastru & Legislație (FAQ):**
   * *Utilitate:* Explicații simple cu pașii obținerii actelor, sporind încrederea și oferind ajutor direct.
5. **Widget de Contact Rapid WhatsApp:**
   * *Utilitate:* Buton plutitor de WhatsApp pentru comunicare rapidă și oferte trimise pe loc.

---

## 🛠️ Detalii Tehnice Hartă 3D
* **Motor Randare:** [Globe.gl](https://github.com/vasturiano/globe.gl) bazat pe Three.js.
* **Proiecție Coordonate:** Coordonatele Stereo 70 din tabelul de membri sunt convertite local în WGS84 folosind biblioteca `proj4.js` și proiectate automat pe sferă.
* **Contur Granițe (Offline):** Harta încarcă vectorii de graniță pentru România, Moldova și restul continentelor din fișierul local `borders.js` pentru a rula securizat și fără latențe sub protocolul `file://`.
