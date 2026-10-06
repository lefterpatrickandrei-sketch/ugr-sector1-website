function parseCsv(text) {
    if (!text) return [];
    let clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
    const lines = [];
    let row = [];
    let inQuotes = false;
    let field = '';

    for (let i = 0; i < clean.length; i++) {
        const c = clean[i];
        const next = clean[i + 1];

        if (c === '"') {
            if (inQuotes && next === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push(field.trim());
            field = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') i++;
            row.push(field.trim());
            if (row.some(f => f.length > 0)) {
                lines.push(row);
            }
            row = [];
            field = '';
        } else {
            field += c;
        }
    }
    if (field || row.length > 0) {
        row.push(field.trim());
        if (row.some(f => f.length > 0)) {
            lines.push(row);
        }
    }
    return lines;
}

const csv = `ID,Nume,Judet,Serie
UGR-0999,"Popescu, Ion",Bucuresti,RO-B-F-0123
UGR-1000,Ionescu Vasile,Ilfov,RO-IF-F-0456`;

console.log(parseCsv(csv));
