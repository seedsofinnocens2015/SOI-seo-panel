import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const centerBlogsPath = join(__dirname, '../../SOI_Main_Website/src/app/data/centerblogs.json');
const outPath = join(__dirname, '../lib/centerBlogsTree.js');

function truncateLabel(title, max = 52) {
  const cleaned = String(title || '').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

const raw = readFileSync(centerBlogsPath, 'utf8');
const data = JSON.parse(raw);
const list = data.centerBlogs || [];

const centerPages = list.map((item) => ({
  label: item.hometitle || truncateLabel(item.title),
  value: `/doctor/${item.slug}`,
}));

centerPages.sort((a, b) => a.label.localeCompare(b.label));

const tree = {
  label: 'IVF Doctors In India',
  children: [
    ...centerPages,
  ],
};

const fileContent = `/** Auto-generated from SOI_Main_Website/src/app/data/centerblogs.json — run: node scripts/gen-center-tree.mjs */
export const CENTER_BLOGS_PAGE_TREE = ${JSON.stringify(tree, null, 2)};
`;

writeFileSync(outPath, fileContent, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`Center blogs / IVF doctor pages count: ${centerPages.length}`);
