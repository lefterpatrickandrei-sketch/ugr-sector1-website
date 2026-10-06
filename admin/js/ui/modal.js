/**
 * Modal Management and Profile/Password Handlers
 */

import { client } from '../supabase.js';
import { showToast, setBannerFeedback } from './toast.js';

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

export async function openAdminProfileModal() {
    const modalAdminProfile = document.getElementById('modal-admin-profile');
    const profileAdminEmail = document.getElementById('profile-admin-email');
    const profileNewPassword = document.getElementById('profile-new-password');
    const profileConfirmPassword = document.getElementById('profile-confirm-password');
    const profileFeedback = document.getElementById('profile-feedback');

    if (!modalAdminProfile) return;

    try {
        const { data } = await client.auth.getUser();
        if (data && data.user && profileAdminEmail) {
            profileAdminEmail.textContent = data.user.email || 'administrator@ugr.ro';
        }
    } catch (e) {
        if (profileAdminEmail) profileAdminEmail.textContent = 'administrator@ugr.ro';
    }

    if (profileNewPassword) profileNewPassword.value = '';
    if (profileConfirmPassword) profileConfirmPassword.value = '';
    setBannerFeedback(profileFeedback, '', '');
    modalAdminProfile.classList.add('active');
    if (profileNewPassword) profileNewPassword.focus();
}

export function closeAdminProfileModal() {
    const modalAdminProfile = document.getElementById('modal-admin-profile');
    if (modalAdminProfile) modalAdminProfile.classList.remove('active');
}

export async function handleUpdatePassword() {
    const profileNewPassword = document.getElementById('profile-new-password');
    const profileConfirmPassword = document.getElementById('profile-confirm-password');
    const profileFeedback = document.getElementById('profile-feedback');
    const btnSavePassword = document.getElementById('btn-save-password');

    if (!profileNewPassword || !profileConfirmPassword) return;

    const p1 = profileNewPassword.value;
    const p2 = profileConfirmPassword.value;

    if (!p1 || p1.length < 8) {
        setBannerFeedback(profileFeedback, 'Parola nouă trebuie să aibă cel puțin 8 caractere.', 'error');
        return;
    }
    if (p1 !== p2) {
        setBannerFeedback(profileFeedback, 'Parolele introduse nu coincid.', 'error');
        return;
    }

    setBannerFeedback(profileFeedback, 'Se actualizează parola contului...', 'info');
    if (btnSavePassword) btnSavePassword.disabled = true;

    try {
        const { error } = await client.auth.updateUser({ password: p1 });
        if (error) throw error;
        showToast('Parola a fost actualizată cu succes!', 'success');
        closeAdminProfileModal();
    } catch (err) {
        setBannerFeedback(profileFeedback, 'Eroare la actualizare: ' + (err.message || 'Server indisponibil'), 'error');
    } finally {
        if (btnSavePassword) btnSavePassword.disabled = false;
    }
}
