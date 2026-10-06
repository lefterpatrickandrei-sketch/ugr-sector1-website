/**
 * Notifications UI Module
 * Manages the topbar notification bell, unread badge, and realtime notifications dropdown.
 */

import { state } from '../state.js';
import { el, clearElement } from '../lib/dom.js';
import { formatDateTimeRo } from '../lib/format.js';
import { switchView } from '../auth.js';

let notificationsList = [];
let isDropdownOpen = false;

export function initNotifications() {
    const btnBell = document.getElementById('btn-notifications-bell');
    const dropdown = document.getElementById('notifications-dropdown');
    const btnViewAll = document.getElementById('btn-view-all-notifications');

    if (btnBell) {
        btnBell.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotificationsDropdown();
        });
    }

    if (btnViewAll) {
        btnViewAll.addEventListener('click', () => {
            closeNotificationsDropdown();
            switchView('requests');
        });
    }

    document.addEventListener('click', (e) => {
        if (dropdown && isDropdownOpen && !dropdown.contains(e.target) && e.target !== btnBell) {
            closeNotificationsDropdown();
        }
    });

    // Ascultare eveniment venit din Realtime
    window.addEventListener('ugr:notification-new-request', (e) => {
        const item = e.detail;
        if (item) {
            addNotificationItem({
                id: item.id || Date.now(),
                type: 'cerere_noua',
                title: 'Cerere nouă de adeziune',
                desc: `${item.nume_complet || 'Solicitant'} a depus o cerere (${item.judet || 'Sector 1'}).`,
                timestamp: item.creat_la || new Date().toISOString()
            });
        }
    });
}

export function updateNotificationBadge(pendingCount) {
    const badge = document.getElementById('bell-badge-count');
    if (!badge) return;

    if (pendingCount > 0) {
        badge.textContent = pendingCount > 99 ? '99+' : String(pendingCount);
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

export function addNotificationItem(notif) {
    notificationsList.unshift(notif);
    if (notificationsList.length > 20) notificationsList.pop();

    updateNotificationBadge(notificationsList.length);
    renderNotificationsDropdown();
}

export function toggleNotificationsDropdown() {
    isDropdownOpen = !isDropdownOpen;
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;

    dropdown.style.display = isDropdownOpen ? 'block' : 'none';
    if (isDropdownOpen) {
        renderNotificationsDropdown();
    }
}

export function closeNotificationsDropdown() {
    isDropdownOpen = false;
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) dropdown.style.display = 'none';
}

function renderNotificationsDropdown() {
    const listContainer = document.getElementById('notifications-dropdown-list');
    if (!listContainer) return;

    clearElement(listContainer);

    // Populate with pending requests from state if notificationsList is empty
    const pendingReqs = (state.allRequestsData || []).filter(r => (r.status || 'in_asteptare') === 'in_asteptare');

    if (notificationsList.length === 0 && pendingReqs.length === 0) {
        listContainer.appendChild(el('div', { className: 'notif-empty-state' }, [
            el('div', { style: 'font-size: 24px; margin-bottom: 6px;' }, ['🔔']),
            el('p', { className: 'text-subtle' }, ['Nicio notificare nouă în acest moment.'])
        ]));
        return;
    }

    // Merge recent notifications with pending requests
    const itemsToRender = [...notificationsList];
    if (itemsToRender.length === 0) {
        pendingReqs.slice(0, 5).forEach(req => {
            itemsToRender.push({
                id: req.id,
                type: 'cerere_noua',
                title: 'Cerere în așteptare',
                desc: `${req.nume_complet} (${req.email || req.telefon || 'fără date'})`,
                timestamp: req.creat_la
            });
        });
    }

    itemsToRender.forEach(notif => {
        const itemEl = el('div', { className: 'notif-item' }, [
            el('div', { className: 'notif-item-icon' }, ['📋']),
            el('div', { className: 'notif-item-content' }, [
                el('div', { className: 'notif-item-title' }, [notif.title]),
                el('div', { className: 'notif-item-desc' }, [notif.desc]),
                el('div', { className: 'notif-item-time' }, [
                    notif.timestamp ? formatDateTimeRo(notif.timestamp) : 'Recent'
                ])
            ]),
            el('button', {
                type: 'button',
                className: 'btn btn-secondary btn-xs',
                onClick: () => {
                    closeNotificationsDropdown();
                    switchView('requests');
                }
            }, ['Vezi'])
        ]);

        listContainer.appendChild(itemEl);
    });
}
