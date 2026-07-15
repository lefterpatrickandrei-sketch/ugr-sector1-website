# Uniunea Geodezilor din România (UGR) — Filiala Sector 1

> [!IMPORTANT]  
> **Status Proiect:** 🚧 Proiect în lucru (Under Construction).  
> * Design-ul actual este în curs de dezvoltare.
> * **Loc de îmbunătățire (Room for Improvement):** Există permanent loc de mai bine pentru a optimiza performanța, a face animațiile și încărcarea hărții 3D cât mai fluide, rapide și plăcute din punct de vedere vizual pentru vizitatori.

Acest repository conține codul sursă pentru website-ul oficial al Filialei Sector 1 a Uniunii Geodezilor din România.

---

## 🌐 Previzualizare Live Propuneri & Original

Pentru a vizualiza propunerile de design și a le compara cu versiunea inițială a site-ului, accesează linkurile de mai jos (servite prin GitHub Pages):

| Versiune Website | Descriere Vizuală & Stilistică | 🌐 Previzualizare Live (GitHub Pages) |
| :--- | :--- | :--- |
| **Site-ul Original** | ⚠️ **Versiunea Curată de Bază** (Varianta originală a site-ului cu textul static complet restaurat) | [Deschide Site Original](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/index.html) |
| **Propunerea 1** | **Tech-Precision Grid** (Temă Cyan/Portocaliu, hartă 3D de precizie cu tooltips pe hover, layout curat) | [Deschide Varianta 1](https://lefterpatrickandrei-sketch.github.io/ugr-sector1-website/ugr-variants/variant-1.html) |
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

## 💡 Structura Nouă de Resurse & Pregătire pentru Personal Non-Coding

Pe lângă restaurarea fișierelor originale în directorul rădăcină (pentru a evita erori de încărcare în browserele care folosesc cache agresiv), am pregătit următoarea structură:

1. **Folderul [ugr-images/](file:///C:/Users/lefpa/.gemini/antigravity/scratch/ugr-sector1-website/ugr-images/):**
   * Conține 33 de imagini reale descărcate automat direct de pe site-ul oficial `ugr.ro` (inclusiv poze de la simpozioane, evenimente naționale, sigla oficială și fotografia portret a președintelui național Mircea Afrăsinei).
2. **Fișierul [data.js](file:///C:/Users/lefpa/.gemini/antigravity/scratch/ugr-sector1-website/data.js):**
   * Un fișier structurat cu comentarii explicative în limba română care conține datele de bază ale hărții, lista de membri, consiliul de conducere și formularele tipizate.
   * Personalul non-coding poate folosi acest fișier ca o bază de date locală de unde site-ul își poate extrage dinamic informațiile pe viitor, fără a fi nevoie de cunoștințe de programare.
3. **Elemente de Design Premium:**
   * **Offset Image Frame:** În pagina de **Contact** (Acasă -> Contact), imaginea comunității folosește o tehnică modernă de încadrare cu un contur cyan decalant (`border-brass-light`) și animație reactivă la hover.

---

## 🛠️ Detalii Tehnice Hartă 3D (Variante)
* **Motor Randare:** [Globe.gl](https://github.com/vasturiano/globe.gl) bazat pe Three.js.
* **Proiecție Coordonate:** Coordonatele Stereo 70 din tabelul de membri sunt convertite local în WGS84 folosind biblioteca `proj4.js` și proiectate automat pe sferă.
* **Contur Granițe (Offline):** Harta încarcă vectorii de graniță pentru România, Moldova și restul continentelor din fișierul local `borders.js` pentru a rula securizat și fără latențe sub protocolul `file://`.
