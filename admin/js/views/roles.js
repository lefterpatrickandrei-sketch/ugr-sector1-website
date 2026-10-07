/**
 * Roles & Access Management View ("Roluri & Acces")
 * Manages public.admini (RBAC: owner, editor, viewer)
 *
 * T-J4: rolul legacy "admin" a fost eliminat (A3). Migrarea 008 convertește
 * rândurile existente cu rol "admin" în "editor" și restrânge CHECK-ul la
 * ('owner','editor','viewer'), deci aici nu mai există ramură de tratament.
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';
import { writeRows, describeDbError } from '../lib/db.js';

const ROLES = ['owner', 'editor', 'viewer'];
const ROL_LABELS = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' };

// Email suficient de strict pentru UX, fără să devină un validator RFC 5322.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// T-J4: bloc împotriva dublei salvări. Butonul este type="submit" și pornește
// atât evenimentul click, cât și evenimentul submit al formularului.
let isSavingAdmin = false;

// T-J4: ID-uri cu un write deja în desfășurare, ca să nu se declanșeze
// două cereri pe același rând la click-uri rapide.
const adminWriteInFlight = new Set();

function beginAdminWrite(adminId) {
    if (adminWriteInFlight.has(adminId)) return false;
    adminWriteInFlight.add(adminId);
    return true;
}

function endAdminWrite(adminId) {
    adminWriteInFlight.delete(adminId);
}

/** true dacă rândul descris reprezintă contul cu care s-a autentificat owner-ul curent. */
function isSelf(admin) {
    if (!admin) return false;
    if (state.user?.id && admin.user_id && admin.user_id === state.user.id) return true;
    const selfEmail = (state.adminRecord?.email || '').toLowerCase();
    return Boolean(selfEmail) && String(admin.email || '').toLowerCase() === selfEmail;
}

export async function loadAdmins() {
    const list = document.getElementById('roles-table-body');
    const feedback = document.getElementById('roles-feedback');
    clearBannerFeedback(feedback);

    if (list) {
        clearElement(list);
        const row = el('tr', {}, [
            el('td', { colspan: 5, style: { textAlign: 'center', padding: '32px', color: 'var(--text-muted)' } }, [
                'Se încarcă lista administratorilor...'
            ])
        ]);
        list.appendChild(row);
    }

    try {
        const { data, error } = await client
            .from('admini')
            .select('*')
            .order('creat_la', { ascending: false });

        if (error) throw error;

        state.allAdminsData = data || [];
        renderAdminsList();
    } catch (err) {
        showToast(`Eroare la încărcarea administratorilor: ${err.message}`, 'error');
        setBannerFeedback(feedback, `Nu s-au putut încărca administratorii: ${err.message}`, 'error');
    }
}

export function renderAdminsList() {
    const tbody = document.getElementById('roles-table-body');
    const feedback = document.getElementById('roles-feedback');
    const btnAddAdmin = document.getElementById('btn-open-add-admin');
    if (!tbody) return;

    clearElement(tbody);

    const isOwner = state.adminRecord?.rol === 'owner';

    if (btnAddAdmin) {
        btnAddAdmin.style.display = isOwner ? '' : 'none';
    }

    if (!isOwner) {
        setBannerFeedback(
            feedback,
            'Vizualizare protejată: Doar administratorul cu rolul de «Owner» poate modifica rolurile și permisiunile conturilor.',
            'info'
        );
    } else {
        clearBannerFeedback(feedback);
    }

    if (state.allAdminsData.length === 0) {
        const row = el('tr', {}, [
            el('td', { colspan: 5, style: { textAlign: 'center', padding: '32px', color: 'var(--text-muted)' } }, [
                'Niciun administrator înregistrat.'
            ])
        ]);
        tbody.appendChild(row);
        return;
    }

    state.allAdminsData.forEach(admin => {
        const tr = el('tr', { 'data-id': admin.id });

        // 1. Email & Avatar
        const avatar = el('div', { className: 'avatar-initials', style: { width: '32px', height: '32px', fontSize: '11px', marginRight: '10px' } }, [
            admin.email.slice(0, 2).toUpperCase()
        ]);
        const emailCell = el('td', { style: { display: 'flex', alignItems: 'center' } }, [
            avatar,
            el('div', {}, [
                el('strong', { style: { display: 'block', color: '#ffffff' } }, [admin.email]),
                el('span', { style: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Space Mono' } }, [
                    admin.user_id ? `UUID: ${admin.user_id.slice(0, 8)}...` : 'Invitație / În așteptare'
                ])
            ])
        ]);

        // 2. Rol Badge
        let badgeClass = 'badge-subtle';
        let badgeLabel = admin.rol;
        if (admin.rol === 'owner') {
            badgeClass = 'badge-owner';
            badgeLabel = '👑 Owner';
        } else if (admin.rol === 'editor') {
            badgeClass = 'badge-editor';
            badgeLabel = '✏️ Editor';
        } else if (admin.rol === 'viewer') {
            badgeClass = 'badge-viewer';
            badgeLabel = '👁️ Viewer';
        } else {
            // Valoare în afara enum-ului (de ex. date rămase de la o versiune veche).
            badgeLabel = `⚠️ necunoscut: ${admin.rol}`;
        }

        const roleCell = el('td', {}, [
            el('span', { className: `role-badge ${badgeClass}` }, [badgeLabel])
        ]);

        // 3. Status Activ
        const statusCell = el('td', {}, [
            el('span', { className: `status-badge ${admin.activ ? 'badge-success' : 'badge-danger'}` }, [
                admin.activ ? '● Activ' : '○ Inactiv'
            ])
        ]);

        // 4. Creat la
        const createdDate = admin.creat_la ? new Date(admin.creat_la).toLocaleDateString('ro-RO') : '—';
        const dateCell = el('td', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, [createdDate]);

        // 5. Acțiuni (doar pentru owner)
        const actionsCell = el('td', { style: { textAlign: 'right' } });

        if (isOwner) {
            // Nu permite owner-ului să își schimbe propriul rol aici, pentru siguranță
            const selfRow = isSelf(admin);

            if (!selfRow) {
                const previousRole = admin.rol;
                const roleSelect = el('select', {
                    className: 'form-select',
                    style: { width: 'auto', display: 'inline-block', fontSize: '12px', padding: '4px 8px', marginRight: '6px' },
                    onChange: (e) => handleUpdateAdminRole(admin, e.target.value, roleSelect, previousRole)
                }, ROLES.map(role => el(
                    'option',
                    { value: role, selected: admin.rol === role },
                    [ROL_LABELS[role]]
                )));

                const toggleBtn = el('button', {
                    type: 'button',
                    className: `btn btn-sm ${admin.activ ? 'btn-secondary' : 'btn-primary'}`,
                    style: { padding: '4px 8px', fontSize: '11px', marginRight: '6px' },
                    onClick: () => handleToggleAdminActive(admin, !admin.activ)
                }, [admin.activ ? 'Dezactivează' : 'Activează']);

                const deleteBtn = el('button', {
                    type: 'button',
                    className: 'btn btn-sm btn-danger',
                    style: { padding: '4px 8px', fontSize: '11px' },
                    title: 'Elimină administrator',
                    onClick: () => handleDeleteAdmin(admin, admin.email)
                }, ['🗑️']);

                // T-J4: bloc împotriva apăsării repetate în timpul unui write în desfășurare.
                

                actionsCell.appendChild(roleSelect);
                actionsCell.appendChild(toggleBtn);
                actionsCell.appendChild(deleteBtn);
            } else {
                actionsCell.appendChild(el('span', { style: { fontSize: '12px', color: 'var(--cyan)' } }, ['(Contul tău)']));
            }
        } else {
            actionsCell.appendChild(el('span', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, ['Doar citire']));
        }

        tr.appendChild(emailCell);
        tr.appendChild(roleCell);
        tr.appendChild(statusCell);
        tr.appendChild(dateCell);
        tr.appendChild(actionsCell);

        tbody.appendChild(tr);
    });
}

export async function handleDeleteAdmin(admin, adminEmail) {
    const adminId = typeof admin === 'object' && admin !== null ? admin.id : admin;

    if (isSelf(admin)) {
        showToast('Nu îți poți elimina propriul cont.', 'warning');
        return;
    }

    if (!window.confirm(`Sigur doriți să eliminați drepturile administrative pentru contul «${adminEmail}»?`)) {
        return;
    }

    if (!beginAdminWrite(adminId)) return;

    try {
        const { error } = await writeRows(
            client
                .from('admini')
                .delete()
                .eq('id', adminId)
                .select('id'),
            { context: `eliminarea administratorului «${adminEmail}»` }
        );

        if (error) throw error;

        showToast(`Administratorul «${adminEmail}» a fost eliminat.`, 'info');
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la eliminarea administratorului.'), 'error');
    } finally {
        endAdminWrite(adminId);
        await loadAdmins();
    }
}

export async function handleUpdateAdminRole(admin, newRole, roleSelect, previousRole) {
    const adminId = typeof admin === 'object' && admin !== null ? admin.id : admin;
    const email = typeof admin === 'object' && admin !== null ? admin.email : 'acest administrator';

    // Refuză silentios valori din afara enum-ului (de ex. payload modificat manual).
    if (!ROLES.includes(newRole)) {
        if (roleSelect && previousRole) roleSelect.value = previousRole;
        showToast('Rol invalid. Sunt permise doar: Owner, Editor, Viewer.', 'error');
        return;
    }

    if (previousRole && previousRole === newRole) return;

    if (isSelf(admin)) {
        if (roleSelect && previousRole) roleSelect.value = previousRole;
        showToast('Nu îți poți modifica propriul rol. Cere unui alt Owner să facă schimbarea.', 'warning');
        return;
    }

    // T-J4: schimbarea rolului afectează permisiunile întregului cont -> confirmare explicită.
    if (newRole === 'owner' || previousRole === 'owner') {
        const toward = newRole === 'owner' ? 'va primi' : 'va pierde';
        const ok = window.confirm(
            `Sigur schimbi rolul lui «${email}» din «${ROL_LABELS[previousRole] || previousRole}» în «${ROL_LABELS[newRole]}»?\n\n` +
            `Contul ${toward} acces de Owner: poate modifica rolurile tuturor administratorilor, ` +
            `poate șterge conținut și poate șterge fișiere media.`
        );
        if (!ok) {
            if (roleSelect && previousRole) roleSelect.value = previousRole;
            return;
        }
    } else {
        const ok = window.confirm(
            `Sigur schimbi rolul lui «${email}» din «${ROL_LABELS[previousRole] || previousRole}» în «${ROL_LABELS[newRole]}»?`
        );
        if (!ok) {
            if (roleSelect && previousRole) roleSelect.value = previousRole;
            return;
        }
    }

    if (!beginAdminWrite(adminId)) return;

    try {
        const { error } = await writeRows(
            client
                .from('admini')
                .update({ rol: newRole })
                .eq('id', adminId)
                .select('id'),
            { context: `actualizarea rolului la „${newRole}”` }
        );

        if (error) throw error;

        showToast(`Rolul lui «${email}» a fost actualizat la «${ROL_LABELS[newRole]}».`, 'success');
    } catch (err) {
        // T-J4: trigger-ul 008 (prevent_last_owner_loss) vine cu mesaj Postgres curat.
        showToast(describeDbError(err, 'Eroare la actualizarea rolului.'), 'error');
    } finally {
        endAdminWrite(adminId);
        // Reîncarcă lista ca selectul să revină la valoarea reală din DB,
        // inclusiv după o eroare sau după o confirmare anulată.
        await loadAdmins();
    }
}

export async function handleToggleAdminActive(admin, nextActiveState) {
    const adminId = typeof admin === 'object' && admin !== null ? admin.id : admin;
    const email = typeof admin === 'object' && admin !== null ? admin.email : 'acest administrator';

    if (isSelf(admin)) {
        showToast('Nu îți poți dezactiva propriul cont.', 'warning');
        return;
    }

    if (nextActiveState) {
        const ok = window.confirm(`Sigur reactivezi contul «${email}»? Acesta va putea din nou accesa panoul.`);
        if (!ok) return;
    } else {
        const ok = window.confirm(
            `Sigur dezactivezi contul «${email}»? Utilizatorul nu va mai putea accesa panoul până când este reactivat.`
        );
        if (!ok) return;
    }

    if (!beginAdminWrite(adminId)) return;

    try {
        const { error } = await writeRows(
            client
                .from('admini')
                .update({ activ: nextActiveState })
                .eq('id', adminId)
                .select('id'),
            { context: `schimbarea stării în ${nextActiveState ? 'Activ' : 'Inactiv'}` }
        );

        if (error) throw error;

        showToast(`Starea administratorului a fost schimbată la: ${nextActiveState ? 'Activ' : 'Inactiv'}.`, 'info');
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la schimbarea stării.'), 'error');
    } finally {
        endAdminWrite(adminId);
        await loadAdmins();
    }
}

export function openAddAdminModal() {
    const modal = document.getElementById('modal-add-admin');
    const inputEmail = document.getElementById('new-admin-email');
    if (modal) {
        if (inputEmail) inputEmail.value = '';
        modal.classList.add('active');
        if (inputEmail) inputEmail.focus();
    }
}

export function closeAddAdminModal() {
    const modal = document.getElementById('modal-add-admin');
    if (modal) modal.classList.remove('active');
}

export async function handleSaveNewAdmin(e) {
    if (e) {
        // Formularul are și onsubmit="return false", dar preventDefault() aici
        // oprește și navigarea dacă markup-ul se schimbă ulterior.
        e.preventDefault();
    }

    // T-J4: butonul declanșează atât click, cât și submit -> fără guard se făceau
    // două INSERT-uri și al doilea lovea unique-ul (23505) cu un mesaj derutant.
    if (isSavingAdmin) return;

    const inputEmail = document.getElementById('new-admin-email');
    const selectRole = document.getElementById('new-admin-role');
    const saveBtn = document.getElementById('btn-save-new-admin');

    const email = inputEmail ? inputEmail.value.trim().toLowerCase() : '';
    const rol = selectRole ? selectRole.value : 'editor';

    if (!EMAIL_RE.test(email)) {
        showToast('Vă rugăm să introduceți o adresă de email validă (exemplu: nume@exemplu.ro).', 'warning');
        if (inputEmail) inputEmail.focus();
        return;
    }

    if (!ROLES.includes(rol)) {
        showToast('Rol invalid. Sunt permise doar: Owner, Editor, Viewer.', 'error');
        return;
    }

    isSavingAdmin = true;
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.dataset.originalLabel = saveBtn.textContent;
        saveBtn.textContent = 'Se salvează...';
    }

    try {
        const { error } = await writeRows(
            client
                .from('admini')
                .insert([{
                    email,
                    rol,
                    activ: true
                }])
                .select('id'),
            { context: `adăugarea administratorului «${email}»` }
        );

        if (error) {
            if (error.message && error.message.includes('user_id') && error.message.includes('not-null')) {
                throw new Error('Coloana user_id din PostgreSQL necesită aplicarea migrării 007 (ALTER TABLE admini ALTER COLUMN user_id DROP NOT NULL).');
            }
            if (error.code === '23505') {
                throw new Error('Acest email este deja înregistrat ca administrator.');
            }
            throw error;
        }

        showToast(`Administratorul «${email}» (${ROL_LABELS[rol]}) a fost înregistrat cu succes!`, 'success');
        closeAddAdminModal();
        await loadAdmins();
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la adăugarea administratorului.'), 'error');
    } finally {
        isSavingAdmin = false;
        if (saveBtn) {
            saveBtn.disabled = false;
            if (saveBtn.dataset.originalLabel) {
                saveBtn.textContent = saveBtn.dataset.originalLabel;
            }
        }
    }
}
