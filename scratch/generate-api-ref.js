import fs from 'fs';
import path from 'path';

const routesDir = path.join(process.cwd(), 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let totalRoutes = 0;
let totalWithoutValidator = 0;
let markdown = `# WORKING DRAFT for the team. The final report must be written by the team.

# API Reference

| Method | Path | Auth Level | Rate Limit | Validator | Note |
|---|---|---|---|---|---|
`;

for (const file of routeFiles) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const basePrefix = '/api/' + file.replace('Routes.js', '').replace('auth', 'auth'); // roughly
  
  let currentAuth = content.includes('requireAuth') || content.includes('protect') ? 'Student' : 'Public';
  if (content.includes('requireAdmin')) currentAuth = 'Admin';

  const routeRegex = /router\.(get|post|put|delete|patch)\(['"`](.*?)['"`](.*?)\)/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    totalRoutes++;
    const method = match[1].toUpperCase();
    let rPath = match[2];
    if (rPath === '/') rPath = '';
    const middlewareArgs = match[3];
    
    let hasValidator = false;
    if (middlewareArgs.includes('validate(') || middlewareArgs.includes('validateParams(')) {
      hasValidator = true;
    } else {
      totalWithoutValidator++;
    }
    
    const rl = middlewareArgs.includes('Limiter') ? 'Strict (authLimiter)' : 'Standard (apiLimiter)';
    const valText = hasValidator ? 'Yes' : 'NO VALIDATOR';
    
    markdown += `| ${method} | /api/${file.replace('Routes.js', '').replace('user', 'users')}${rPath} | ${currentAuth} | ${rl} | ${valText} | |\n`;
  }

  // Handle router.route
  const routeRegexChained = /router\.route\(['"`](.*?)['"`]\)([\s\S]*?);/g;
  while ((match = routeRegexChained.exec(content)) !== null) {
    let rPath = match[1];
    if (rPath === '/') rPath = '';
    const methodsStr = match[2];
    
    const methodRegex = /\.(get|post|put|delete|patch)\((.*?)\)/g;
    let mMatch;
    while ((mMatch = methodRegex.exec(methodsStr)) !== null) {
      totalRoutes++;
      const method = mMatch[1].toUpperCase();
      const middlewareArgs = mMatch[2];
      
      let hasValidator = false;
      if (middlewareArgs.includes('validate(') || middlewareArgs.includes('validateParams(')) {
        hasValidator = true;
      } else {
        totalWithoutValidator++;
      }
      
      const rl = 'Standard (apiLimiter)';
      const valText = hasValidator ? 'Yes' : 'NO VALIDATOR';
      
      markdown += `| ${method} | /api/${file.replace('Routes.js', '').replace('user', 'users')}${rPath} | ${currentAuth} | ${rl} | ${valText} | |\n`;
    }
  }
}

markdown += `\n**Total Routes (Computed):** ${totalRoutes}\n`;
markdown += `**Routes without Validator (Computed):** ${totalWithoutValidator}\n`;

fs.writeFileSync(path.join(process.cwd(), 'docs', 'api-reference.md'), markdown);
