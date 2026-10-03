# Verificare date oficiale — UGR Filiala Sector 1 vs. ugrsector1.ro

> **Document de lucru pentru Antigravity.**
> Data: 2026-10-03 · Repo: `ugr-sector1-website` · Branch: `main`
> Status: **repo-ul este sursa de editare**, site-ul live este doar reper de verficare.

---

## 0. Cum se folosește acest document

1. Citește secțiunea 1 (reguli dure) **înainte** de orice modificare.
2. Lucrează **doar** din lista din secțiunea 4 — fiecare item are `fișier:linie` exact.
3. Nu atinge nimic din secțiunea 5 (personalizări dorite).
4. După modificări, re-execută checklist-ul din secțiunea 7 și raportează rezultatul.

---

## 1. Reguli dure

| # | Regula | De ce |
|---|---|---|
| R1 | **Domainul live este `ugrsector1.ro`** (fără linie de pauză). `ugr-sector1.ro` **nu există** în DNS — NXDOMAIN confirmat. | S-a pierdut timp cu greșeli de domeniu. |
| R2 | **E-mailul oficial rămâne `filiala.ugr.s1@gmail.com`.** Nu-l înlocui cu adrese personale. | Decizie explicită a proprietarului. |
| R3 | **Nu modificați formularele .docx din `documente/`.** Sunt personalizate intenționat pentru Sector 1. | Secțiunea 5. |
| R4 | **Nu scoateți membrii de conducere din `branchLeadership`.** Toți 6 sunt confirmați pe site-ul live. | Secțiunea 3. |
| R5 | Orice date bancară nouă se publică **doar** dacă apare pe `ugrsector1.ro` **sau** `ugr.ro`. | Secțiunea 4.1 — situația actuală. |
| R6 | Nu face commit/push fără aprobare explicită. | Proprietarul controlează deployment-ul. |
| R7 | Verificările rulează prin `node tools/verificare-date.js`, **nu** prin comenzi `node -e` scrise manual în PowerShell — escaping-ul ghilimelelor le rupe. | Testat: comanda inline pentru check-ul de referințe eșuează la copiere. |

---

## 2. Sursa de adevăr și cum a fost verificat

| Sursă | Rol | Verificare |
|---|---|---|
| `https://ugrsector1.ro/` | Site live al Filialei Sector 1 (WordPress, ~4 pagini) | HTTP 200, Apache, 87.795 B, UTF-8 |
| `https://www.ugr.ro/` | Site național UGR — sursa oficială pentru date bancare | HTTP 200 |
| `data.js` + `index.html` (repo) | Codul site-ului nostru (Demo V2, acum în rădăcină) | — |

Metodă: REST API WordPress deschis, fără scraping fragil:
```
https://ugrsector1.ro/wp-json/wp/v2/pages?per_page=50&_fields=id,slug,title,link
https://ugrsector1.ro/wp-json/wp/v2/pages/22   # Conducere
https://ugrsector1.ro/wp-json/wp/v2/pages/23   # Contact
```

⚠️ **Atenție la verificări în PowerShell**: console-ul strică diacriticele (`PĂUN` afișat ca `PAUN`, `VIȘAN` ca `VI?AN`). Pentru orice comparație de text folosește `node` cu `readFileSync(f,"utf8")`. Am descoperit astfel că numele din repo sunt **corecte**, deși console-ul sugera invers.

---

## 3. ✅ DATE CONFIRMATE IDENTICE (nu modifica)

Verificate pe paginile `/`, `/despre/`, `/contact/`, `/blog/` și în `data.js`.

| Câmp | Valoare | Locație în repo |
|---|---|---|
| Denumire | Uniunea Geodezilor din România (UGR) / Filiala Sector 1 București | `data.js` L17-18 |
| Președinte | Alexandru Dorin **PĂUN** | `data.js` L25 |
| Tel. președinte | `0726 390 774` · `0748 912 263` | `data.js` L26 |
| Secretar | Andra Teodora **VIȘAN** | `data.js` L27 |
| Tel. secretar | `0764 572 874` | `data.js` L28 |
| Trezorier | Alexandru NELEPCU | `data.js` `branchLeadership` |
| Cenzor | Ștefan Paul MATEI | `data.js` `branchLeadership` |
| Membru conducere | Nicoleta BOBÎRCEA | `data.js` `branchLeadership` |
| Membru conducere | Radu Mihai NIȚĂ | `data.js` `branchLeadership` |
| Contact cotizații | Camelia Matei · `0722 684 104` | `data.js` L29-30 |
| E-mail | `filiala.ugr.s1@gmail.com` | `data.js` L22 |
| **IBAN oficial** | `RO57 BRDE 426S V810 0757 4450` (BRD, Ag. Tei, sector 2) | `data.js` L36-37 |
| Taxă înscriere | 50 lei / 10 lei studenți | `data.js` `membershipGuide` |
| Cotizație anuală | 100 lei / 10 lei studenți | `data.js` `membershipGuide` |
| Instagram | `instagram.com/filiala.sector1.ugr` | `data.js` L50 · L54 · L64 |
| Workshopuri | 18 (9 frecvență + 9 frecvență redusă) | `data.js` / `index.html` |

**Linkurile Facebook — cele 3 sunt echivalente, NU e conflict:**
```
facebook.com/profile.php?id=61589062168887   -> .../people/Filiala-Sector-1-UGR/61589062168887/
facebook.com/share/14xwxtFChmC/              -> .../people/Filiala-Sector-1-UGR/61589062168887/
facebook.com/share/1C3GXdASYW/               -> .../people/Filiala-Sector-1-UGR/61589062168887/
```
Toate trei HTTP 200, toate trei redirecționează la **aceeași** pagină oficială.

---

## 4. ⚠️ ACȚIUNI NECESARE

### 4.1 [P1 — CRITIC] Contul bancar BCR nu există în nicio sursă oficială

**Problema.** Repo-ul publică un al doilea cont bancar care **nu apare** nici pe `ugrsector1.ro`, nici pe `ugr.ro`:

```
RO04 RNCB 0074 0104 7856 0001  (Banca Comercială Română / BCR)
```

`ugr.ro/cum-devin-membru` publică **un singur IBAN**: `RO57BRDE426SV81007574450`. Nu există niciun mențiune de BCR/RNCB pe site-urile oficiale.

Mai grav: `index.html` îl etichetează explicit **„DATE BANCARE OFICIALE (UGR.RO)"** — o afirmație de autoritate care nu are sursă.

**Impact:** un membru care plătește în contul BCR poate pierde banii.

**Locații de eliminat (5):**

| Fișier | Linii | Text |
|---|---|---|
| `data.js` | **41-46** | întregul obiect BCR din `bankAccounts` (`{ bank: "Banca Comercială Română (BCR)", iban: "RO04 RNCB 0074 0104 7856 0001", currency: "RON", purpose: "Taxă înscriere & cotizație anuală" }`) — se șterge integral; rămâne doar obiectul BRD (L35-40) |
| `data.js` | 141 | răspuns FAQ — menționează „... sau RO04 RNCB 0074 0104 7856 0001 (BCR)" |
| `index.html` | 1064 | `... \| BCR: <b>RO04 RNCB 0074 0104 7856 0001</b>` |
| `index.html` | 1523-1524 | bloc „Cont Secundar (BCR):" + IBAN |
| `demos-membri.html` | 287 | `... \| BCR: <b>RO04 RNCB 0074 0104 7856 0001</b>` |

**Instrucțiuni:**
1. Șterge obiectul BCR din `bankAccounts` (`data.js`) — rămâne doar contul BRD.
2. La `data.js` L141, reformulează răspunsul FAQ păstrând **doar** BRD + mențiunea obligatorie („Nume Prenume, CNP, Cotizație Filiala Sector 1").
3. La `index.html` L1064 și L1520-1525, elimină segmentul BCR și eticheta „Cont Secundar". Păstrează contul BRD.
4. La `demos-membri.html` L287, la fel — doar BRD.
5. **Nu** adăuga niciun cont nou fără sursă oficială (R5).

> Dacă proprietarul confirmă că există un cont secundar legitim, **anulează** această acțiune și documentează sursa. Până atunci, se elimină.

### 4.2 [P2] Linkul de înscriere la SGR 2026 lipsește din repo

**Problema.** Site-ul live are formularul de înscriere la bursa SGR (Chișinău, 11–14 noiembrie). Repo-ul vorbește despre bursă, dar **nu conține niciun link `docs.google.com`** — deci nimeni nu se poate înscrie de pe site-ul nostru.

```
https://docs.google.com/forms/d/e/1FAIpQLSctDTm-Gxuph4yz2fJRiU2JOurBFgzBXriAUY6rbrtem5vrEQ/viewform?usp=header
```

**Instrucțiuni:** adaugă butonul de înscriere lângă secțiunea despre SGR din `index.html`, cu `target="_blank" rel="noopener noreferrer"`. Verifică dacă `data.js` are deja un câmp dedicat; altfel creează `organization.sgr2026FormUrl` și citește-l dinamic.

### 4.3 [P3] Placeholder necompletat pe site-ul live (informativ, e la ei)

Secțiunea „Citat — Președinte" de pe `ugrsector1.ro` conține text de umplutură:
```
aaaa…aaaa text aaaa…aaaa
```
**Repo-ul nostru nu are problema asta.** Acțiune: raportează doar, nu modifica nimic în repo.

---

## 5. 🚫 NU MODIFICA — personalizări dorite

### 5.1 Formularele de înscriere `.docx`

Cele din `documente/` sunt **versiuni personalizate pentru Sector 1**, superioare celor de pe site-ul live. Diferențe reale:

| Câmp | Repo (NOU) | Site live (VECHI) |
|---|---|---|
| Titlu | `CERERE DE INSCRIERE IN U.G.R. - FILIALA SECTOR 1 BUCUREȘTI` | `CERERE DE INSCRIERE IN U.G.R.` |
| Semnătură | „Președintele Filialei Sector 1 București" | „Președintele Asociației locale" |
| Cont bancar | `RO57BRDE426SV81007574450` + mențiune OP „Cotizație Filiala Sector 1 / Nume Prenume / CNP" | `RO57BRDE426SV81007574450` simplu |
| Nota 3 | **există** — trimitere scan la `filiala.ugr.s1@gmail.com` sau Secretariat FIFIM-USAMV, Bd. Mărăști 59 | lipsește |

IBAN-ul e **identic** în ambele. Dacă se înlocuiesc cu versiunile live, se **pierde** personalizarea Sector 1 și nota 3. **Nu înlocui.**

### 5.2 Membrii de conducere

Toți cei 6 din `branchLeadership` sunt confirmați pe pagina `/despre/`. Nu elimina niciunul pe baza presupunerii că „nu sunt pe site".

---

## 6. Date din repo care NU pot fi verificate

`ugrsector1.ro` nu le publică. **Nu sunt declarate greșite** — doar neconfirmate de acest site. Verifică-le din Statutul UGR (`documente/statut_ugr.pdf`) sau de la proprietar înainte de orice modificare:

| Date | Locație |
|---|---|
| CIF `6480330` | `data.js` L33 · `index.html` L1295, L1404 · `demos-faq.html` L233, L339 |
| Telefon central `0723 587 081` | `data.js` L32 · `index.html` L478, L1294 · `demos-faq.html` L232 |
| `office@ugr.ro`, `secretar@ugr.ro` | `data.js` L23-24 |
| Adresă sediu: Bd. Lacul Tei nr. 124, Sector 2 | `data.js` L20 |
| Adresă centru academic: Bd. Mărăști nr. 59, Sector 1 (FIFIM-USAMV) | `data.js` L21 |
| Cotizație persoane juridice „500 – 2.000 RON / an" | `data.js` L114 |
| Afiliări FIG / CLGE / UPLR | `data.js` L56-59 |

---

## 7. Checklist după modificări

**Rulează un singur script** — conține toate cele 10 check-uri:

```powershell
cd C:\Users\lefpa\.gemini\antigravity\scratch\ugr-sector1-website
node tools\verificare-date.js
```

Ieșire: un raport cu `[OK]` / `[FAIL]` / `[INFO]` per check și un rezumat final.
**Cod de ieșire `0`** = totul OK. **`1`** = există check-uri eșuate (detalii în output).

Check-urile rulate de script:

| # | Ce verifică | Stare așteptată acum |
|---|---|---|
| 1 | Contul BCR (`RO04 RNCB` / `RNCB`) nu apare | ❌ **FAIL** → devine OK după 4.1 |
| 2 | IBAN oficial BRD prezent | ✅ OK |
| 3 | Sintaxă JS validă (`script.js`, `data.js`, `borders.js`) | ✅ OK |
| 4 | Toate referințele relative se rezolvă (36 referințe) | ✅ OK |
| 5 | Zero caractere U+FFFD (encoding curat) | ✅ OK |
| 6 | Link înscriere SGR 2026 prezent | ⚠️ INFO → devine OK după 4.2 |
| 7 | Conducere completă — 6 membri, diacritice corecte | ✅ OK |
| 8 | Cele 4 telefoane oficiale prezente | ✅ OK |
| 9 | E-mail oficial corect, fără adresă personală | ✅ OK |
| 10 | Tag-uri HTML echilibrate în `index.html` | ✅ OK |

**Starea curentă (2026-10-03, înainte de modificări):** 1 check eșuat (nr. 1 — BCR), 1 INFO (nr. 6 — SGR), restul OK.

### Smoke test HTTP

Serverul local rulează din rădăcina repo-ului (`python -m http.server 8088`):
```
http://127.0.0.1:8088/                              -> 200
http://127.0.0.1:8088/documente/statut_ugr.pdf     -> 200
http://127.0.0.1:8088/documente/cerere_inscriere_UGR_persoane_fizice_sector1.docx -> 200
```

### Dacă nu ai rulat niciodată verificarea

Nu folosi `Select-String` din PowerShell pentru comparații de text — console-ul strică
diacriticele și produce false-negative-uri (`PĂUN` afișat ca `PAUN`). Scriptul folosește
`node` cu `fs.readFileSync(f, "utf8")`, care e corect.

---

## 8. Raport final cerut

După modificări, răspunde cu:

1. Care dintre acțiunile 4.1 / 4.2 au fost aplicate.
2. Output-ul literal al fiecărui check din secțiunea 7.
3. Orice divergență între ce ai găsit și ce scrie documentul.
4. Starea `git status` — **fără commit/push** până la aprobare (R6).