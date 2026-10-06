/**
 * Pagination Controls (Client-side slicing, Zero innerHTML)
 */

export function renderPaginationControls(container, totalItems, currentPage, pageSize, onPageChange, onPageSizeChange) {
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);

    if (totalItems === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';

    const isAll = pageSize === 'toate';
    const numPageSize = isAll ? totalItems : parseInt(pageSize, 10);
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / numPageSize));
    const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const startIdx = isAll ? 1 : (validCurrentPage - 1) * numPageSize + 1;
    const endIdx = isAll ? totalItems : Math.min(validCurrentPage * numPageSize, totalItems);

    const leftSpan = document.createElement('div');
    leftSpan.className = 'pagination-info';
    leftSpan.textContent = `Afișare ${startIdx}–${endIdx} din ${totalItems} elemente`;
    container.appendChild(leftSpan);

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'pagination-controls';

    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'form-select';
    sizeSelect.style.cssText = 'padding: 4px 10px; font-size: 12px; width: auto; height: 32px;';
    ['10', '25', '50', 'toate'].forEach(optVal => {
        const opt = document.createElement('option');
        opt.value = optVal;
        opt.textContent = optVal === 'toate' ? 'Toate' : `${optVal} / pag`;
        if (optVal === String(pageSize)) opt.selected = true;
        sizeSelect.appendChild(opt);
    });
    sizeSelect.addEventListener('change', (e) => {
        onPageSizeChange(e.target.value);
    });
    controlsDiv.appendChild(sizeSelect);

    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'btn btn-secondary btn-sm pagination-btn';
    btnPrev.textContent = '‹ Anterior';
    btnPrev.disabled = validCurrentPage <= 1 || isAll;
    btnPrev.addEventListener('click', () => {
        if (validCurrentPage > 1) onPageChange(validCurrentPage - 1);
    });
    controlsDiv.appendChild(btnPrev);

    const pageIndicator = document.createElement('span');
    pageIndicator.style.cssText = 'font-size: 12.5px; color: var(--text-muted); padding: 0 4px;';
    pageIndicator.textContent = `Pagina ${validCurrentPage} din ${totalPages}`;
    controlsDiv.appendChild(pageIndicator);

    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'btn btn-secondary btn-sm pagination-btn';
    btnNext.textContent = 'Următor ›';
    btnNext.disabled = validCurrentPage >= totalPages || isAll;
    btnNext.addEventListener('click', () => {
        if (validCurrentPage < totalPages) onPageChange(validCurrentPage + 1);
    });
    controlsDiv.appendChild(btnNext);

    container.appendChild(controlsDiv);
}
