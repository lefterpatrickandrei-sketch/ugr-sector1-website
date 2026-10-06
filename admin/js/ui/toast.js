/**
 * Toast Notifications and Banner Feedback (Zero innerHTML)
 */

export function showToast(message, type = 'info', duration = 4000) {
    const toastContainer = document.getElementById('cms-toast-container') || document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'cms-toast cms-toast-' + type;

    const iconSpan = document.createElement('span');
    iconSpan.textContent = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    iconSpan.style.fontWeight = 'bold';
    toast.appendChild(iconSpan);

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
}

export function setBannerFeedback(element, message, type) {
    if (!element) return;
    element.className = 'feedback-banner ' + (type || '');
    element.textContent = message;
}

export function clearBannerFeedback(element) {
    if (!element) return;
    element.className = 'feedback-banner';
    element.textContent = '';
}
