import fs from 'fs';
import path from 'path';

const srcDir = 'd:\\Techwix UI\\Techwix UI\\Techwix UI\\campuscoin\\src';

function searchInDir(dir, query, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchInDir(fullPath, query, files);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (query.test(line)) {
          files.push({ file: fullPath.replace(srcDir, ''), line: i + 1, content: line.trim() });
        }
      });
    }
  });
  return files;
}

const queries = {
  8: /Greeting|Balance|balance|Hello|Welcome/i,
  9: /tips|saving-tips|Insights/i,
  10: /Top Category|Budget vs Actual|budgetVsActual/i,
  11: /Quick Add|quick-add/i,
  12: /Recurring/i,
  14: /predictCategory|predict-category/i,
  16: /import-csv/i,
  17: /category-breakdown|Category Breakdown/i,
  18: /trend-6months|6 months|6-month/i,
  19: /daily-weekly|Daily\/Weekly/i,
  20: /dateFrom|dateTo|filter/i,
  21: /export-pdf|jsPDF|html2canvas|Export/i,
  22: /monthly-insights/i,
  23: /growth|baseline|spike/i,
  31: /notification|alert/i,
  32: /bookmark/i,
  38: /recent|ActivityLog/i,
  39: /forecast/i,
  40: /anomaly|large transaction|duplicate/i,
  41: /dark|darkMode/i,
  42: /breadcrumb|Breadcrumbs|Link|navigate/i,
  43: /transition|animate-|spinner/i,
  47: /disclaimer/i,
  53: /localStorage|sessionStorage/i,
  64: /Sitemap/i,
  66: /AI usage|acknowledge/i
};

for (const [id, q] of Object.entries(queries)) {
  const res = searchInDir(srcDir, q);
  console.log(`\n--- Item ${id} (${q}) ---`);
  res.slice(0, 5).forEach(r => console.log(`${r.file}:${r.line}: ${r.content}`));
}
