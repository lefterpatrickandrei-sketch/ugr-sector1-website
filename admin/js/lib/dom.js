/**
 * DOM Helper Utilities for UGR Admin (Safe DOM construction, zero innerHTML)
 */

export function el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
        if (key === 'className' || key === 'class') {
            element.className = val;
        } else if (key === 'style' && typeof val === 'object') {
            Object.assign(element.style, val);
        } else if (key.startsWith('on') && typeof val === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, val);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, val);
        } else if (key === 'textContent') {
            element.textContent = val;
        } else if (val !== null && val !== undefined && val !== false) {
            element.setAttribute(key, val === true ? '' : val);
        }
    }

    const childList = Array.isArray(children) ? children : [children];
    for (const child of childList) {
        if (child === null || child === undefined || child === false) continue;
        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    }
    return element;
}

export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function clearElement(element) {
    if (!element) return;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
