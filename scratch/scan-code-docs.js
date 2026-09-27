import fs from 'fs';
import path from 'path';

const files = [
  '01-architecture.md', '02-database.md', '03-api-reference.md',
  '04-flows.md', '05-dfd.md', '06-security.md', '09-srs-traceability.md'
];

const docsDir = 'd:\\Campus-coin\\server\\docs';

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let inCodeBlock = false;
  
  lines.forEach((line, i) => {
    // We want to find JS syntax or query syntax
    const tLine = line.trim();
    if (tLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      // Also flag if they specifically used js/javascript tag
      if (inCodeBlock && (tLine === '```js' || tLine === '```javascript' || tLine === '```sql' || tLine === '```mongodb')) {
        console.log(`[VIOLATION] ${file}:${i+1} : Explicit code block declared: ${tLine}`);
      }
      return;
    }
    
    // Check if line looks like code (in or out of code block, but mostly inside backticks)
    // Keywords: jwt.sign, .find(, .sort(, if (, await, const, let, var
    const codePatterns = [
      /jwt\.(sign|verify)/i,
      /\.find\(/,
      /\.sort\(/,
      /\bif\s*\(/,
      /\bawait\s+/,
      /\bconst\s+/,
      /\blet\s+/,
      /\bfunction\s*\(/,
      /=>/,
      /console\.log/
    ];
    
    for (const pattern of codePatterns) {
      if (pattern.test(line)) {
        console.log(`[VIOLATION] ${file}:${i+1} : Contains code logic (${pattern}): ${tLine}`);
        break; // don't flag same line twice
      }
    }
  });
});
