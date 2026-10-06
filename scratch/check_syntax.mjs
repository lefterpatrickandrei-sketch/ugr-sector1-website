import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function checkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let passed = 0;
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            passed += checkDir(full);
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
            try {
                execSync(`node --check "${full}"`);
                console.log(`[OK] ${full}`);
                passed++;
            } catch (err) {
                console.error(`[FAIL] ${full}:`, err.message);
                process.exit(1);
            }
        }
    }
    return passed;
}

const total = checkDir('admin/js');
console.log(`\nSuccessfully verified ${total} JavaScript files in admin/js/!`);
