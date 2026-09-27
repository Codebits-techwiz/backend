import fs from 'fs';
import path from 'path';

const routesDir = 'd:\\Campus-coin\\server\\routes';
const files = fs.readdirSync(routesDir);

files.forEach(file => {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  console.log(`\n--- ${file} ---`);
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.match(/router\.(get|post|put|delete|patch)/)) {
      console.log(line.trim());
    }
  });
});
