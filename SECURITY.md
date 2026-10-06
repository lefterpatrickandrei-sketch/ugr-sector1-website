# Politica de Securitate — UGR Filiala Sector 1 București

Acest document definește politica de securitate, arhitectura de protecție a datelor și procedurile operaționale pentru portalul public și panoul administrativ al Filialei Sector 1 București a Uniunii Geodezilor din România (UGR).

---

## 1. Raportarea Vulnerabilităților

Dacă identificați o problemă de securitate sau o potențială vulnerabilitate în cadrul platformei:
* **NU deschideți un Issue public pe GitHub.**
* Raportați problema direct către administratorul tehnic al filialei prin email securizat: `lefterpatrickandrei@gmail.com`.
* Includeți detalii tehnice: pași de reproducere, capturi de ecran, impactul potențial și cererile HTTP relevante.
* Termen de răspuns și remediere: maximum 48 de ore pentru vulnerabilități critice.

---

## 2. Arhitectura Zero-Trust

Platforma este construită pe principiul că mediul client (browser-ul) este intrinsec nesigur. Toate regulile de securitate, permisiunile și integritatea datelor sunt delegate și forțate exclusiv la nivelul bazei de date PostgreSQL din Supabase Cloud.

### 2.1 Piloni Tehnici de Securitate

1. **Chei Publice Izolate (`anonKey`):**
   * Frontend-ul conține exclusiv cheia publică `anonKey`.
   * Cheia cu privilegii depline (`service_role`) **NU este prezentă în repository** și nu este niciodată utilizată în aplicația client.
2. **Autentificare Multi-Factor (MFA AAL2 TOTP):**
   * Accesul în panoul de administrare (`/admin/panou.html`) necesită autentificare în 2 pași:
     - Etapa 1: Cod OTP trimis pe emailul administratorului.
     - Etapa 2: Validare cod dinamic de 6 cifre generat prin aplicația Google Authenticator (TOTP AAL2).
   * Dacă un cont nu are MFA configurat, este forțat să parcurgă înrolarea prin cod QR înainte de a primi acces la date.
3. **Zero innerHTML în Logica Dinamică Nouă:**
   * Toate componentele dinamice nou create în Admin v4 utilizează exclusiv API-urile DOM native (`document.createElement`, `document.createTextNode`, `setAttribute`).
   * Răspunsurile Markdown din FAQ sunt parsate printr-un helper sigur (`renderMarkdownLite`), verificând schemele link-urilor (`https://`, `mailto:`, `#`) pentru a preveni atacurile XSS (`javascript:` URIs).
4. **Zero-Storage pentru Tokeni Sensibili:**
   * Niciun token de acces sau credențial sensibil nu este salvat în `localStorage` sau `sessionStorage`.
   * Starea sesiunii este menținută în memoria volatilă a clientului Supabase.

---

## 3. Matricea de Permisiuni Row Level Security (RLS)

Toate tabelele din schema `public` au `ROW LEVEL SECURITY` activat (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Permisiunile efective sunt evaluate pe baza rolului utilizatorului (`public.admin_rol()`):

| Tabelă | Public / Anonim (`anon`) | Viewer (`viewer`) | Editor (`editor`) | Owner (`owner`) |
| :--- | :--- | :--- | :--- | :--- |
| `membri` | Doar SELECT unde `afisare_publica = true` și `deleted_at IS NULL` | SELECT toate rândurile | SELECT, INSERT, UPDATE | SELECT, INSERT, UPDATE, DELETE (Purge) |
| `stiri` | Doar SELECT unde `publicat = true` și `deleted_at IS NULL` | SELECT toate rândurile | SELECT, INSERT, UPDATE | SELECT, INSERT, UPDATE, DELETE (Purge) |
| `leadership` | Doar SELECT unde `afisare_publica = true` și `deleted_at IS NULL` | SELECT toate rândurile | SELECT, INSERT, UPDATE | SELECT, INSERT, UPDATE, DELETE (Purge) |
| `faq` | Doar SELECT unde `publicat = true` și `deleted_at IS NULL` | SELECT toate rândurile | SELECT, INSERT, UPDATE | SELECT, INSERT, UPDATE, DELETE (Purge) |
| `documente` | Doar SELECT unde `publicat = true` și `deleted_at IS NULL` | SELECT toate rândurile | SELECT, INSERT, UPDATE | SELECT, INSERT, UPDATE, DELETE (Purge) |
| `setari` | Doar SELECT pe cheile de configurare | SELECT | UPDATE | UPDATE, INSERT, DELETE |
| `cereri_inscriere` | Doar INSERT (depunere formular aderare) | SELECT | SELECT, UPDATE (aprobare, notițe) | SELECT, UPDATE, DELETE |
| `admini` | Fără acces (HTTP 401) | SELECT doar contul propriu | SELECT doar contul propriu | SELECT, INSERT, UPDATE, DELETE (Gestiune conturi) |
| `audit_log` | Fără acces (HTTP 401) | SELECT | SELECT | SELECT, INSERT |
| `storage.objects` (media) | SELECT public (citire imagini) | SELECT | INSERT, UPDATE | INSERT, UPDATE, DELETE |

---

## 4. Protecția Datelor cu Caracter Personal (GDPR)

Tabela `public.cereri_inscriere` conține date cu caracter personal colectate de la solicitanți (nume complet, email, telefon, serie autorizație ANCPI).

### 4.1 Măsuri Tehnice Implementate
* **Consimțământ Explicit:** Formularul de aderare conține checkbox obligatoriu pentru consimțământul GDPR (`consimtamant_gdpr = true`).
* **Izolare RLS:** Clienții anonimi pot doar introduce înregistrări (`INSERT`). Citirea (`SELECT`) este strict blocată prin RLS (returnează HTTP 401).
* **Anonimizare și Retenție:** 
  - Cererile respinse sunt păstrate maximum 5 zile lucrătoare înainte de arhivare sau ștergere.
  - Cererile aprobate sunt convertite în registrul de membri, iar istoricul este consemnat în `audit_log`.
* **Adresă de Notificare Protejată:** Notificările automate privind cererile noi sunt configurate strict către adresa desemnată (`lefterpatrickandrei@gmail.com`). Adresa oficială `filiala.ugr.s1@gmail.com` nu este niciodată spammată cu emailuri de test.

---

## 5. Procedura de Backup & Restaurare Date

### 5.1 Backup Manual (Panou Administrativ)
1. Conectați-vă în panou ca `owner` sau comutați în modul **Avansat**.
2. Deschideți secțiunea **Consolă Dezvoltator** (`data-view="coder"`).
3. Faceți clic pe **„Descarcă Backup Complet (Bundle JSON)”**.
4. Se va descărca un fișier de forma `ugr-s1-full-backup-YYYY-MM-DD-HHmm.json` conținând toate tabelele.

### 5.2 Backup SQL (Supabase Dashboard)
1. Accesați Supabase Dashboard → Proiect `ckktzvzzklspqfclcsbu`.
2. Mergeți la **Database** → **Backups**.
3. Descărcați snapshot-ul zilnic generat automat de platformă.

### 5.3 Restaurare în Caz de Incident
* Pentru un element șters accidental: accesați **Coș de Reciclate** (`data-view="trash"`) și faceți clic pe **„Restaurează”**.
* Pentru o versiune coruptă: accesați **Istoric Modificări** pe elementul respectiv și alegeți **„Restaurează această versiune”**.
* Pentru restaurare completă: utilizați scriptul SQL de rollback corespunzător din `supabase/migrations/` sau restaurați din backup-ul JSON salvat în `backups/`.
