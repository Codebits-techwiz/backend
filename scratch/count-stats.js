import fs from 'fs';
import path from 'path';

const routesDir = path.join(process.cwd(), 'routes');
const modelsDir = path.join(process.cwd(), 'models');
const validatorsDir = path.join(process.cwd(), 'validators');

const routesFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
const modelsFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
const validatorsFiles = fs.readdirSync(validatorsDir).filter(f => f.endsWith('.js'));

let routeCount = 0;
let routesWithoutValidatorCount = 0;

for (const file of routesFiles) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  // Count routes: router.get, router.post, router.put, router.delete, router.route
  const routeRegex = /router\.(get|post|put|delete|patch)\(['"`](.*?)['"`]/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    routeCount++;
    // Check if the line has 'validate(' or 'validateParams('
    const line = content.substring(match.index, content.indexOf('\n', match.index));
    if (!line.includes('validate(') && !line.includes('validateParams(')) {
      routesWithoutValidatorCount++;
    }
  }
  const routeRegexChained = /router\.route\(['"`](.*?)['"`]\)/g;
  while ((match = routeRegexChained.exec(content)) !== null) {
    // If it's router.route('/'), check methods chained
    const stmt = content.substring(match.index, content.indexOf('\n', match.index));
    const methods = stmt.match(/\.(get|post|put|delete)\(/g) || [];
    for (const m of methods) {
      routeCount++;
    }
    const valds = stmt.match(/validate\(|validateParams\(/g) || [];
    routesWithoutValidatorCount += Math.max(0, methods.length - valds.length);
  }
}

console.log(`Routes: ${routeCount}`);
console.log(`Routes without validator: ${routesWithoutValidatorCount}`);
console.log(`Models: ${modelsFiles.length}`);
