// Script auxiliar de verificare pentru ADMIN_V4_FIXES_RAPORT.md.
// Compara cheile pe care le salveaza gatherCurrentPagesPayload (admin/js/views/pages.js)
// cu cele citite de applyCustomPageData (script.js). Ruleaza: node scratch/check-page-fields.mjs
import fs from 'node:fs';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const pages = fs.readFileSync(root + 'admin/js/views/pages.js', 'utf8');
const site = fs.readFileSync(root + 'script.js', 'utf8');

const gi = pages.indexOf('export function gatherCurrentPagesPayload');
const gj = pages.indexOf('\n}', gi);
const body = pages.slice(gi, gj);

const tabs = {};
let cur = null;
for (const line of body.split(/\r?\n/)) {
    const m = line.match(/tabKey === '(\w+)'/);
    if (m) { cur = m[1]; tabs[cur] = []; continue; }
    const k = line.match(/^\s{12}(\w+):/);
    if (k && cur) tabs[cur].push(k[1]);
}

const ai = site.indexOf('function applyCustomPageData');
const aj = site.indexOf('\nfunction fallbackLoadNewsJson', ai);
const apply = site.slice(ai, aj);

for (const [tab, keys] of Object.entries(tabs)) {
    const missing = keys.filter((k) => {
        const used = new RegExp(`val\\.${k}\\b`).test(apply)
            || new RegExp(`cpSet\\w+\\(\\s*'${k}'`).test(apply)
            || new RegExp(`'${k}'`).test(apply);
        return !used;
    });
    console.log(`${tab} (${keys.length} chei): neconsumate -> ${JSON.stringify(missing)}`);
}