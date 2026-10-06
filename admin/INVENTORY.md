# INVENTORY.md — Inventarul Complet al Panoului de Administrare (`admin/panou.html`)

> **Data generării:** 2026-10-06  
> **Sursă:** `admin/panou.html` (CMS Studio v3.0, 7.073 linii, ~337 KB)  
> **Scop:** Baza tehnică pentru Faza P2 (Modularizare nativă fără modificări funcționale sau vizuale).

---

## 1. Structura Generală a Fișierului

| Secțiune | Linii aprox. | Conținut principal | Destinație propusă în P2 |
|---|---|---|---|
| `<head>` & `<style>` | L1 – L2200 | Variabile CSS tematice (Dark Cyan Glassmorphic), layout, carduri, modale, badge-uri, grafice | `admin/css/panel.css` |
| Markup HTML — Ecrane Auth | L56 – L2100 | Ecrane Login (email/parolă), MFA Enroll (QR code/secret TOTP), MFA Verify (cod 6 cifre) | `admin/panou.html` |
| Markup HTML — Layout CMS | L2200 – L3050 | Sidebar (brand, navigație, footer cu profil & logout), Topbar (breadcrumb, acțiuni rapide, Command Palette, status RTT), Main Content (5 views) | `admin/panou.html` |
| Markup HTML — Modale | L3050 – L3200 | Modal Membru, Modal Știre, Modal Preview Știre, Modal Command Palette, Modal Galerie Media, Modal Profil/Securitate Admin | `admin/panou.html` |
| `<script>` — Config & Init | L3200 – L3350 | Config Supabase (`SUPABASE_CONFIG`), variabile de stare globală, selectori DOM | `admin/js/supabase.js`, `admin/js/main.js` |
| `<script>` — Utilitare & Helpers | L3350 – L3780 | Toasts, bannere feedback, formatare date RO, validări, export CSV, comutator vederi | `admin/js/lib/dom.js`, `admin/js/ui/toast.js`, `admin/js/lib/format.js`, `admin/js/lib/csv.js` |
| `<script>` — Autentificare & MFA | L3780 – L4030 | Handlers autentificare, înrolare TOTP, verificare AAL2 TOTP, verificare rol în `admini` | `admin/js/auth.js` |
| `<script>` — Paginare & Bulk Bar | L4030 – L4340 | Paginare pe 10/25/50/100/toate, selecție multiplă, acțiuni în masă (export, aprobare/respingere, ștergere) | `admin/js/ui/pagination.js`, `admin/js/ui/bulkbar.js` |
| `<script>` — Galerie Media & Palette | L4340 – L4625 | Picker imagine din `ugr-images/`, căutare universală Command Palette (Ctrl+K) | `admin/js/ui/palette.js`, `admin/js/ui/media.js` |
| `<script>` — Modale & Profil | L4625 – L4750 | Schimbare parolă admin, manipulare modale | `admin/js/ui/modal.js` |
| `<script>` — Views Logic | L4750 – L6900 | Handlers & renderers pentru `requests`, `members`, `news`, `telemetry`, `overview` | `admin/js/views/*.js` |
| `<script>` — Event Listeners & Boot | L6900 – L7073 | Ascultători pe butoane, taste rapide (Ctrl+K, Esc), verificare sesiune la boot | `admin/js/main.js` |

---

## 2. Vederi (Views) & Tabele Supabase Interogate

### 2.1 Overview (`data-view="overview"`)
* **Rol:** Tablou de bord general cu statistici agregate și comenzi rapide.
* **Date afișate:**
  * Număr cereri noi în așteptare (`cereri_inscriere` cu status `in_asteptare`)
  * Număr total membri activi (`membri` cu status `activ`)
  * Număr știri publicate (`stiri` cu `publicat = true`)
  * Număr vizitatori unici / total vizite azi (`vizite`)
  * Indicator stare conexiune Supabase RTT (ping la `/auth/v1/health`)
  * Indicator canal Realtime `ugr-live-visitors`
* **Acțiuni:**
  * Butoane de salt rapid către Cereri, Membri, Știri
  * Sincronizare inițială știri din JSON în Supabase
  * Export rapid membri în CSV

### 2.2 Requests (`data-view="requests"`)
* **Tabelă Supabase:** `public.cereri_inscriere`
* **Operațiuni Supabase:** `SELECT`, `UPDATE`, `DELETE`
* **Funcții cheie:**
  * `loadRequests()`: încarcă cererile sortate după `created_at DESC`
  * `applyRequestsFilter()`: filtrare după status (`toate`, `in_asteptare`, `aprobat`, `respins`) și căutare text (nume, email, telefon, serie)
  * `renderRequestsList()`, `renderRequestsWithPagination()`: redare tabelă cu paginare
  * `handleSetRequestStatus(reqId, newStatus)`: aprobare / respingere cerere cu înregistrare `procesat_de` și `procesat_la`
  * `handleSaveNotes(reqId, notesVal)`: salvare notițe interne administrative
  * `handleDeleteRequest(reqId)`: ștergere definitivă cerere
  * `initRealtimeRequestsListener()`: abonare Realtime Postgres pe evenimentul `INSERT` în `cereri_inscriere` (badge dinamic + toast notificare)
  * `handleBulkApproveRequests()`, `handleBulkRejectRequests()`, `exportRequestsToCsv()`: acțiuni pe selecție multiplă

### 2.3 Members (`data-view="members"`)
* **Tabelă Supabase:** `public.membri`
* **Operațiuni Supabase:** `SELECT`, `INSERT`, `UPDATE`, `DELETE`
* **Funcții cheie:**
  * `loadMembers()`: încarcă toți membrii ordonați alfabetic după `nume`
  * `applyMembersFilter()`: filtrare după județ, categorie (A, B, C, D), status (activ/inactiv/suspendat) și text
  * `renderMembersTable()`, `renderMembersWithPagination()`: redare tabelă cu badge-uri de autorizare
  * `openAddMemberModal()` / `openEditMemberModal(id)`: deschidere formular membru
  * `handleSaveMember()`: adăugare / actualizare membru (`id`, `nume`, `judet`, `serie_autorizatie`, `categorie`, `status`, `afisare_publica`)
  * `handleToggleMemberVisibility(memberId, newVis)`: comutare rapidă afișare publică (ochiuleț)
  * `handleDeleteMember(memberId)`: ștergere membru
  * `handleBulkDeleteMembers()`, `exportMembersToCsv()`: acțiuni în masă

### 2.4 News (`data-view="news"`)
* **Tabelă Supabase:** `public.stiri`
* **Operațiuni Supabase:** `SELECT`, `INSERT`, `UPDATE`, `DELETE`
* **Funcții cheie:**
  * `loadNews()`: încarcă știrile ordonate descrescător după `data_publicare`
  * `applyNewsFilter()`: filtrare după stare (toate, publicat, ciornă/programat) și căutare text
  * `renderNews()`, `renderNewsGrid()`, `renderNewsTable()`: vizualizare duală (Grid de carduri vs Tabel compact)
  * `openAddNewsModal()` / `openEditNewsModal(id)`: deschidere editor știre cu formatare toolbar, preview imagine, counter caractere
  * `openPreviewNewsModal()`: modal de previzualizare exactă a modului în care arată știrea pe site
  * `handleSaveNews()`: salvare / actualizare știre (`titlu`, `continut`, `imagine_url`, `data_publicare`, `publicat`)
  * `handleToggleNewsPublish(newsId, newStatus)`: comutare stare publicare
  * `handleDeleteNews(newsId)`: ștergere știre
  * `handleSyncDefaultNews()`: import idempotent din fallback-ul de 9 știri

### 2.5 Telemetry (`data-view="telemetry"`)
* **Tabelă Supabase:** `public.vizite` (și evenimente de audit locale)
* **Operațiuni Supabase:** `SELECT`
* **Funcții cheie:**
  * `loadTelemetryData()`: citește ultimele 500 vizite anonime înregistrate
  * `renderTrafficChart()`: generează graficul SVG interactiv de vizite pe ultimele 14 zile
  * `renderTelemetryBreakdowns()`: top pagini vizitate, dispozitive (Desktop/Mobil/Tabletă), referrers
  * `buildAuditTrailEvents()` / `renderAuditTrail()`: jurnal de audit operațiuni admin și sesiuni AAL2
  * `initAdminLivePresence()`: conectare canal `ugr-live-visitors` cu broadcast prezență admin

---

## 3. Sistemul de Autentificare & Securitate Existent

* **Supabase Client:** inițializat cu `persistSession: true`, `detectSessionInUrl: true`.
* **Flux MFA AAL2:**
  1. Pas 1: `client.auth.signInWithPassword({ email, password })`.
  2. Pas 2: `client.auth.mfa.getAuthenticatorAssuranceLevel()`.
     - Dacă nivelul curent este `aal1` și nivelul următor este `aal2` → solicită codul TOTP (`handleVerifyTotp`).
     - Dacă utilizatorul nu are MFA înrolat → afișează ecranul de înrolare TOTP cu QR code SVG / secret text (`startTotpEnrollment`, `handleVerifyEnroll`).
  3. Pas 3: `verifyAdminStatus(user)`:
     - Interoghează `client.from('admini').select('user_id, email, rol, activ').eq('user_id', user.id).maybeSingle()`.
     - Permite accesul doar dacă `adminRecord.activ === true`.
* **Deconectare:** `handleSignOut()` -> `client.auth.signOut()`, curățare stare și resetare la ecranul de login.

---

## 4. Modale & Componente Reutilizabile

1. **`modal-member`**: Formular Adăugare / Editare Membru ANCPI.
2. **`modal-news`**: Editor Știri cu toolbar de formatare rapidă (`**bold**`, `*italic*`, liste, link-uri), countere lungime titlu/descriere, selector imagine.
3. **`modal-preview-news`**: Previzualizare card Bento identic cu cel de pe site-ul public.
4. **`modal-command-palette`**: Paletă de căutare rapidă (Ctrl+K sau Cmd+K) cu navigare pe tastatură, căutare în comenzi de sistem, știri și membri.
5. **`modal-media-picker`**: Galerie media cu imagini oficiale din `ugr-images/` pentru selecție instantanee.
6. **`modal-admin-profile`**: Modal de gestionare securitate cont (schimbare parolă cont administrator conectat).

---

## 5. Lista Celor 93 de Funcții din Cod

```
showToast, setBannerFeedback, clearBannerFeedback, showAuthStep, showCmsDashboard,
switchView, getPanelRedirectUrl, formatStatusLabel, formatDateTimeRo, formatDateOnlyRo,
isValidImageUrl, exportArrayToCsv, exportMembersToCsv, exportRequestsToCsv, handleSendOtp,
startTotpEnrollment, handleVerifyEnroll, handleVerifyTotp, verifyAdminStatus, evaluateAuthState,
handleSignOut, loadRequests, updateRequestsKpi, renderPaginationControls, updateBulkActionsBar,
clearAllBulkSelections, handleBulkExportMembers, handleBulkExportRequests, handleBulkDeleteMembers,
handleBulkApproveRequests, handleBulkRejectRequests, handleBulkDeleteNews, openMediaPickerModal,
closeMediaPickerModal, renderMediaPickerGrid, selectMediaAsset, updateNewsImageLivePreview,
applyFormatting, updateReadingStats, openCommandPalette, closeCommandPalette,
updateCommandPaletteHighlight, renderCommandPaletteResults, appendGroup, openAdminProfileModal,
closeAdminProfileModal, handleUpdatePassword, renderRequestsWithPagination,
renderMembersWithPagination, renderNewsWithPagination, applyRequestsFilter, renderRequestsList,
addCell, handleSaveNotes, handleSetRequestStatus, handleDeleteRequest,
initRealtimeRequestsListener, loadMembers, updateMembersKpi, applyMembersFilter,
renderMembersTable, openAddMemberModal, openEditMemberModal, closeMemberModal, handleSaveMember,
handleToggleMemberVisibility, handleDeleteMember, handleSyncDefaultNews, loadNews, updateNewsKpi,
applyNewsFilter, renderNews, renderNewsEmptyState, renderNewsGrid, renderNewsTable,
openAddNewsModal, openEditNewsModal, closeNewsModal, openPreviewNewsModal, closePreviewNewsModal,
handleSaveNews, handleToggleNewsPublish, handleDeleteNews, pingSupabaseHealth, loadVisitsStats,
loadTelemetryData, renderTrafficChart, renderTelemetryBreakdowns, populateCard,
buildAuditTrailEvents, renderAuditTrail, initAdminLivePresence, updateCharCounters
```

---

## 6. Concluzie pentru Faza P2 (Modularizare)

Niciuna dintre aceste funcționalități nu va fi modificată sau eliminată în Faza P2. În P2, fiecare grup funcțional de mai sus va fi extras curat în fișierul său modul corespunzător, cu o pagină de auto-test (`admin/_selftest.html`) și cu `admin/panou.legacy.html` păstrat ca plasă de siguranță completă.
