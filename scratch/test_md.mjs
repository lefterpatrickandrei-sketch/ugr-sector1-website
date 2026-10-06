// test markdown lite
import fs from 'fs';

function parseInlineMarkdown(text) {
    // simulated document nodes for node.js test
    let pos = 0;
    const len = text.length;
    const tokens = [];

    while (pos < len) {
        const linkMatch = text.slice(pos).match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
            tokens.push({ type: 'link', text: linkMatch[1], url: linkMatch[2].trim() });
            pos += linkMatch[0].length;
            continue;
        }

        const boldMatch = text.slice(pos).match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
            tokens.push({ type: 'bold', text: boldMatch[1] });
            pos += boldMatch[0].length;
            continue;
        }

        const italicMatch = text.slice(pos).match(/^\*([^*]+)\*/);
        if (italicMatch) {
            tokens.push({ type: 'italic', text: italicMatch[1] });
            pos += italicMatch[0].length;
            continue;
        }

        const nextSpecial = text.slice(pos + 1).search(/[\[*]/);
        if (nextSpecial === -1) {
            tokens.push({ type: 'text', text: text.slice(pos) });
            break;
        } else {
            const chunk = text.slice(pos, pos + 1 + nextSpecial);
            tokens.push({ type: 'text', text: chunk });
            pos += chunk.length;
        }
    }
    return tokens;
}

const sample = 'Text cu **bold**, *italic*, si link [UGR](https://ugr.ro) final.';
console.log(parseInlineMarkdown(sample));
