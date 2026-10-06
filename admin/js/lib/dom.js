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

export function parseInlineMarkdown(text) {
    const fragment = document.createDocumentFragment();
    if (!text) return fragment;

    let pos = 0;
    const len = text.length;

    while (pos < len) {
        const linkMatch = text.slice(pos).match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
            const linkText = linkMatch[1];
            const rawUrl = linkMatch[2].trim();
            let safeUrl = '#';
            if (/^(https?:|\/|#|mailto:)/i.test(rawUrl)) {
                safeUrl = rawUrl;
            }
            const a = document.createElement('a');
            a.href = safeUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'text-link';
            a.textContent = linkText;
            fragment.appendChild(a);
            pos += linkMatch[0].length;
            continue;
        }

        const boldMatch = text.slice(pos).match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
            const strong = document.createElement('strong');
            strong.textContent = boldMatch[1];
            fragment.appendChild(strong);
            pos += boldMatch[0].length;
            continue;
        }

        const italicMatch = text.slice(pos).match(/^\*([^*]+)\*/);
        if (italicMatch) {
            const em = document.createElement('em');
            em.textContent = italicMatch[1];
            fragment.appendChild(em);
            pos += italicMatch[0].length;
            continue;
        }

        const nextSpecial = text.slice(pos + 1).search(/[\[*]/);
        if (nextSpecial === -1) {
            fragment.appendChild(document.createTextNode(text.slice(pos)));
            break;
        } else {
            const chunk = text.slice(pos, pos + 1 + nextSpecial);
            fragment.appendChild(document.createTextNode(chunk));
            pos += chunk.length;
        }
    }
    return fragment;
}

export function renderMarkdownLite(rawText) {
    const container = document.createDocumentFragment();
    if (!rawText) return container;

    const lines = String(rawText).split(/\r?\n/);
    let currentList = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) {
            currentList = null;
            continue;
        }

        if (line.startsWith('### ')) {
            currentList = null;
            const h3 = document.createElement('h3');
            h3.className = 'article-subheading';
            h3.appendChild(parseInlineMarkdown(line.slice(4)));
            container.appendChild(h3);
            continue;
        }
        if (line.startsWith('## ')) {
            currentList = null;
            const h2 = document.createElement('h2');
            h2.className = 'article-heading';
            h2.appendChild(parseInlineMarkdown(line.slice(3)));
            container.appendChild(h2);
            continue;
        }

        if (line.startsWith('> ')) {
            currentList = null;
            const bq = document.createElement('blockquote');
            bq.className = 'article-quote';
            bq.appendChild(parseInlineMarkdown(line.slice(2)));
            container.appendChild(bq);
            continue;
        }

        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (!currentList) {
                currentList = document.createElement('ul');
                currentList.className = 'article-list';
                container.appendChild(currentList);
            }
            const li = document.createElement('li');
            li.appendChild(parseInlineMarkdown(line.slice(2)));
            currentList.appendChild(li);
            continue;
        }

        currentList = null;
        const p = document.createElement('p');
        p.className = 'article-paragraph';
        p.appendChild(parseInlineMarkdown(line));
        container.appendChild(p);
    }

    return container;
}

