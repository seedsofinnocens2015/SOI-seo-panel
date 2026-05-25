import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blogsPath = join(__dirname, '../../SOI_Main_Website/src/app/data/blogs.json');
const outPath = join(__dirname, '../lib/blogPageTree.js');

const categoryRouteMap = {
  'Treatment Guides': 'treatment-guides',
  "Women's Health": 'womens-health',
  "Men's Health": 'mens-health',
  Fertility: 'fertility',
  'IVF Process': 'ivf-process',
  Pregnancy: 'pregnancy',
  'Success Stories': 'success-stories',
  'Doctor Insights': 'doctor-insights',
  'News & Press': 'news-press',
  'Lifestyle & Fertility': 'fertility',
  'Treatment Guide': 'treatment-guides',
  'Doctor Insight': 'doctor-insights',
  'IVF Success': 'success-stories',
  'ICSI Success': 'success-stories',
  'Egg Freezing & IVF': 'success-stories',
  Surrogacy: 'success-stories',
};

const categoryLabels = {
  fertility: 'Fertility',
  'ivf-process': 'IVF Process',
  pregnancy: 'Pregnancy',
  'mens-health': "Men's Health",
  'womens-health': "Women's Health",
  'treatment-guides': 'Treatment Guides',
  'success-stories': 'Success Stories',
  'doctor-insights': 'Doctor Insights',
  'news-press': 'News & Press',
};

const categoryOrder = [
  'fertility',
  'ivf-process',
  'pregnancy',
  'mens-health',
  'womens-health',
  'treatment-guides',
  'success-stories',
  'doctor-insights',
  'news-press',
];

function getCategoryRoute(category) {
  return (
    categoryRouteMap[category] ||
    String(category || '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/'/g, '')
  );
}

function truncateLabel(title, max = 52) {
  const cleaned = String(title || '').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

const data = JSON.parse(readFileSync(blogsPath, 'utf8'));
const byCategory = new Map();

for (const blog of data.blogs || []) {
  const route = getCategoryRoute(blog.category);
  if (!byCategory.has(route)) byCategory.set(route, []);
  byCategory.get(route).push({
    label: truncateLabel(blog.title),
    value: `/blog/${blog.slug}`,
  });
}

for (const [, items] of byCategory) {
  items.sort((a, b) => a.label.localeCompare(b.label));
}

const children = categoryOrder.map((key) => ({
  label: categoryLabels[key] || key,
  children: [
    { label: `${categoryLabels[key] || key} Overview`, value: `/blogs/${key}` },
    ...(byCategory.get(key) || []),
  ],
}));

// Include any unexpected categories from blogs.json
for (const [key, items] of byCategory) {
  if (categoryOrder.includes(key)) continue;
  children.push({
    label: categoryLabels[key] || key,
    children: [
      { label: `${categoryLabels[key] || key} Overview`, value: `/blogs/${key}` },
      ...items,
    ],
  });
}

const tree = {
  label: 'Blogs',
  children: [{ label: 'Blogs Overview', value: '/blogs' }, ...children],
};

const fileContent = `/** Auto-generated from SOI_Main_Website/src/app/data/blogs.json — run: node scripts/gen-blog-tree.mjs */
export const BLOG_PAGE_TREE = ${JSON.stringify(tree, null, 2)};
`;

writeFileSync(outPath, fileContent, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`Categories: ${children.length}, blog pages: ${(data.blogs || []).length}`);
