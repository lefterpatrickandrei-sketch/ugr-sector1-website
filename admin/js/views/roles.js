/**
 * Roles & Access Management View ("Roluri & Acces")
 * Manages public.admini (RBAC: owner, editor, viewer, admin)
 */

import { state } from '../state.js';
import { client } from '../supabase.js';
import { showToast, setBannerFeedback, clearBannerFeedback } from '../ui/toast.js';
import { el, clearElement } from '../lib/dom.js';
import { writeRows, describeDbError } from '../lib/db.js';

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
        } else if (admin.rol === 'admin') {
            badgeClass = 'badge-owner';
            badgeLabel = '🛡️ Admin';
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
            // Nu permite owner-ului să își schimbe propriul rol direct aici pentru siguranță
            const isSelf = admin.email === state.adminRecord?.email;

            if (!isSelf) {
                const roleSelect = el('select', {
                    className: 'form-select',
                    style: { width: 'auto', display: 'inline-block', fontSize: '12px', padding: '4px 8px', marginRight: '6px' },
                    onChange: (e) => handleUpdateAdminRole(admin.id, e.target.value)
                }, [
                    el('option', { value: 'editor', selected: admin.rol === 'editor' }, ['Editor']),
                    el('option', { value: 'viewer', selected: admin.rol === 'viewer' }, ['Viewer']),
                    el('option', { value: 'owner', selected: admin.rol === 'owner' }, ['Owner'])
                ]);

                const toggleBtn = el('button', {
                    type: 'button',
                    className: `btn btn-sm ${admin.activ ? 'btn-secondary' : 'btn-primary'}`,
                    style: { padding: '4px 8px', fontSize: '11px', marginRight: '6px' },
                    onClick: () => handleToggleAdminActive(admin.id, !admin.activ)
                }, [admin.activ ? 'Dezactivează' : 'Activează']);

                const deleteBtn = el('button', {
                    type: 'button',
                    className: 'btn btn-sm btn-danger',
                    style: { padding: '4px 8px', fontSize: '11px' },
                    title: 'Elimină administrator',
                    onClick: () => handleDeleteAdmin(admin.id, admin.email)
                }, ['🗑️']);

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

export async function handleDeleteAdmin(adminId, adminEmail) {
    if (!window.confirm(`Sigur doriți să eliminați drepturile administrative pentru contul «${adminEmail}»?`)) {
        return;
    }

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
        await loadAdmins();
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la eliminarea administratorului.'), 'error');
    }
}

export async function handleUpdateAdminRole(adminId, newRole) {
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

        showToast(`Rolul a fost actualizat la «${newRole}».`, 'success');
        await loadAdmins();
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la actualizarea rolului.'), 'error');
    }
}

export async function handleToggleAdminActive(adminId, nextActiveState) {
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
        await loadAdmins();
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la schimbarea stării.'), 'error');
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
    if (e) e.preventDefault();

    const inputEmail = document.getElementById('new-admin-email');
    const selectRole = document.getElementById('new-admin-role');

    const email = inputEmail ? inputEmail.value.trim().toLowerCase() : '';
    const rol = selectRole ? selectRole.value : 'editor';

    if (!email || !email.includes('@')) {
        showToast('Vă rugăm să introduceți o adresă de email validă.', 'warning');
        return;
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
                throw new Error(`Adresa «${email}» există deja în lista de administratori.`);
            }
            throw error;
        }

        showToast(`Administratorul «${email}» (${rol}) a fost înregistrat cu succes!`, 'success');
        closeAddAdminModal();
        await loadAdmins();
    } catch (err) {
        showToast(describeDbError(err, 'Eroare la adăugarea administratorului.'), 'error');
    }
}
