import fs from 'fs';
import path from 'path';

const docsDir = 'd:\\Campus-coin\\server\\docs';
const files = fs.readdirSync(docsDir);

let hasCode = false;

files.forEach(file => {
  if (file.endsWith('.md')) {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
    if (content.includes('```javascript') || content.includes('```js') || content.includes('```json') || content.includes('```sql') || content.includes('function') || content.includes('SELECT * FROM')) {
      console.log(`\n--- Code found in ${file} ---`);
      // print first match line
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('```js') || lines[i].includes('```json') || lines[i].includes('```sql')) {
          console.log(`Line ${i + 1}: ${lines[i]}`);
          console.log(`Line ${i + 2}: ${lines[i+1]}`);
          hasCode = true;
          break;
        }
      }
    }
  }
});
if (!hasCode) console.log("No code blocks found.");
