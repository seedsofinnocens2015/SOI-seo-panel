import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const costPath = join(__dirname, '../../SOI_Main_Website/src/app/data/ivfcost.json');
const outPath = join(__dirname, '../lib/ivfCostPageTree.js');

function truncateLabel(title, max = 52) {
  const cleaned = String(title || '').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

const raw = readFileSync(costPath, 'utf8');
const data = JSON.parse(raw);
const list = data.ivfCosts || [];

const costPages = list.map((item) => ({
  label: item.hometitle || truncateLabel(item.title),
  value: `/cost/${item.slug}`,
}));

costPages.sort((a, b) => a.label.localeCompare(b.label));

const tree = {
  label: 'IVF Cost',
  children: [
    { label: 'IVF Cost Overview', value: '/cost' },
    ...costPages,
  ],
};

const fileContent = `/** Auto-generated from SOI_Main_Website/src/app/data/ivfcost.json — run: node scripts/gen-cost-tree.mjs */
export const IVF_COST_PAGE_TREE = ${JSON.stringify(tree, null, 2)};
`;

writeFileSync(outPath, fileContent, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`IVF Cost pages count: ${costPages.length}`);
