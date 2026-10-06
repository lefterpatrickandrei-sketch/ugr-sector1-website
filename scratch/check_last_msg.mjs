import fs from 'fs';
const lines = fs.readFileSync('C:/Users/lefpa/.gemini/antigravity/brain/7ba45d9f-ec5f-42da-84e3-0e455a3c30aa/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');
for (const l of lines) {
  if (l.includes('"step_index":462')) {
    const obj = JSON.parse(l);
    console.log(obj.content);
  }
}
