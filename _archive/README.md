# Arhivă — nu face parte din site-ul live

Tot ce se află în acest folder a fost mutat din rădăcina repo-ului și **nu este
servit de GitHub Pages** (exclus în `robots.txt` și neaccesibil din `index.html`).
Nu modifica nimic aici — nu are efect asupra site-ului public.

## Conținut

| Cale | Ce este | De ce nu mai e necesar |
| --- | --- | --- |
| `demo-v2/` | Copie completă a site-ului înainte de integrarea Supabase | Commitul `d825a09` ("promote Demo V2 to official root site") a copiat conținutul în rădăcină; rădăcina a fost apoi modificată în continuare (Supabase, telemetrie, formular aderare). Copia e înghețată și nu mai primește actualizări. |
| `ugr-variants/` | Trei variante de design (`variant-1/2/3`), fiecare cu copie proprie de `borders.js` (~1,4 MB de date identice) | Experimente de design pentru care s-a ales `index.html` din rădăcină. |
| `backup/pre-demov2-promote-2026-10-03/` | Snapshot al site-ului făcut înainte de promovarea lui `demo-v2` | Dublu față de `demo-v2/`. |
| `backup/uniunea_geodezilor_*.html` | Fișier HTML vechi, anterior redesign-ului | Înlocuit de `index.html`. |
| `docs/` | `brand-spec.md`, `FAZA2_RAPORT.md`, `VERIFICARE-DATE-UGR-SECTOR1.md`, `WATERMARKING.md` | Rapoarte de fază, citite de developator, nu de runtime. |
| `dev-scripts/tools/` | `split_html.py`, `verificare-date.js` | Utilitare de dezvoltare, neapelate de nicio pagină. |
| `unused-assets/` | `styles.css` (nefolosit — pagina reală folosește `style.css`), `borders.geojson` (nefolosit — runtime-ul folosește `borders.js`), `fix_encoding.py`, `scrape_ugr_photos.py`, `test_faq_automated.js`, `video_motion_inspector.js`, rezultatele telemetriei | Niciunul nu este referit din codul live. |

## Ce a rămas la rădăcină (codul activ)

```text
index.html            # portalul public
style.css             # design
script.js             # logica: Supabase, hartă 3D, calculator Stereo 70, formular
data.js               # date statice
borders.js            # geometria hărții
confidentialitate.html # GDPR
demos-faq.html        # FAQ & Contact (legat din index.html)
demos-membri.html     # Registrul membrilor (legat din demos-faq.html)
showcase/             # calculatorul Stereo 70 + cele 5 variante de design
admin/                # panoul CMS Studio v3.0
content/  documente/  ugr-images/
```

## Cum se restaurează ceva

```bash
git mv _archive/demo-v2/data.js ./data.js
```

Istoricul git e complet: toate mutările sunt rename-uri, deci `git log --follow`
funcționează în continuare.