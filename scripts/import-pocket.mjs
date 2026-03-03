/**
 * Import Pocket bookmarks from CSV export into bookmarks.json
 * Usage: node scripts/import-pocket.mjs /path/to/part_000000.csv
 */
import { readFileSync, writeFileSync } from 'node:fs';

const csvPath = process.argv[2] || '/tmp/pocket_inspect/part_000000.csv';
const outPath = new URL('../content/pages/bookmarks.json', import.meta.url).pathname;

// Domain → category mapping
const domainCategories = {
  // Tech & Engineering
  'github.com': 'Engineering',
  'stackoverflow.com': 'Engineering',
  'dev.to': 'Engineering',
  'hackernoon.com': 'Engineering',
  'css-tricks.com': 'Engineering',
  'web.dev': 'Engineering',
  'developer.mozilla.org': 'Engineering',
  'martinfowler.com': 'Engineering',
  'overreacted.io': 'Engineering',
  'kentcdodds.com': 'Engineering',
  'npmjs.com': 'Engineering',
  'nodejs.org': 'Engineering',
  'reactjs.org': 'Engineering',
  'nextjs.org': 'Engineering',
  'vercel.com': 'Engineering',

  // Design
  'smashingmagazine.com': 'Design',
  'alistapart.com': 'Design',
  'blog.invisionapp.com': 'Design',
  'fastcodesign.com': 'Design',
  'designmodo.com': 'Design',
  'dribbble.com': 'Design',
  'behance.net': 'Design',
  'uxdesign.cc': 'Design',
  'nngroup.com': 'Design',
  'creativebloq.com': 'Design',
  'tympanus.net': 'Design',
  'codrops.com': 'Design',

  // Business & Startups
  'firstround.com': 'Business',
  'techcrunch.com': 'Business',
  'thenextweb.com': 'Business',
  'blog.intercom.io': 'Business',
  'hbr.org': 'Business',
  'ycombinator.com': 'Business',
  'paulgraham.com': 'Business',
  'a16z.com': 'Business',
  'stratechery.com': 'Business',
  'bothsidesofthetable.com': 'Business',
  'avc.com': 'Business',
  'inc.com': 'Business',
  'entrepreneur.com': 'Business',
  'fastcompany.com': 'Business',
  'fortune.com': 'Business',
  'forbes.com': 'Business',
  'bloomberg.com': 'Business',

  // Science & Knowledge
  'nautil.us': 'Science',
  'scientificamerican.com': 'Science',
  'nature.com': 'Science',
  'arxiv.org': 'Science',
  'en.wikipedia.org': 'Science',
  'aeon.co': 'Science',
  'brainpickings.org': 'Science',
  'quantamagazine.org': 'Science',
  'norvig.com': 'Science',

  // Long reads & Culture
  'newyorker.com': 'Culture',
  'theatlantic.com': 'Culture',
  'nytimes.com': 'Culture',
  'theguardian.com': 'Culture',
  'washingtonpost.com': 'Culture',
  'longreads.com': 'Culture',
  'lithub.com': 'Culture',
  'lrb.co.uk': 'Culture',

  // Medium gets its own since it's mixed
  'medium.com': 'Reading',
  'quora.com': 'Reading',

  // HowStuffWorks & Time are bulk saves — group them
  'time.com': 'Time',
};

// Subdomains of howstuffworks
const hswCategory = 'HowStuffWorks';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

function categorize(url, tags) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');

    // Check for howstuffworks subdomains
    if (hostname.endsWith('howstuffworks.com')) return hswCategory;

    // Check direct domain match
    if (domainCategories[hostname]) return domainCategories[hostname];

    // Check tags for hints
    const tagStr = (tags || '').toLowerCase();
    if (tagStr.includes('design') || tagStr.includes('css') || tagStr.includes('typography'))
      return 'Design';
    if (tagStr.includes('android') || tagStr.includes('node') || tagStr.includes('python') || tagStr.includes('algorithm'))
      return 'Engineering';
    if (tagStr.includes('science') || tagStr.includes('math'))
      return 'Science';
    if (tagStr.includes('startup'))
      return 'Business';

    return 'Other';
  } catch {
    return 'Other';
  }
}

// Parse CSV
const raw = readFileSync(csvPath, 'utf-8');
const lines = raw.split('\n').slice(1).filter(Boolean);

const bookmarks = [];

for (const line of lines) {
  const [title, url, timeAdded, tags, status] = parseCSVLine(line);

  if (!url || !url.startsWith('http')) continue;
  if (!title || title.length < 2) continue;

  const category = categorize(url, tags);
  const date = timeAdded && !Number.isNaN(Number(timeAdded))
    ? new Date(Number(timeAdded) * 1000).toISOString().split('T')[0]
    : null;

  bookmarks.push({
    title: title.slice(0, 200),
    url,
    category,
    tags: tags ? tags.split('|').map((t) => t.trim()).filter((t) => t && !t.match(/^\d+$/) && t.length < 30) : [],
    date,
  });
}

// Sort by date descending (newest first)
bookmarks.sort((a, b) => {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return b.date.localeCompare(a.date);
});

// Group counts for summary
const categoryCounts = {};
for (const b of bookmarks) {
  categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
}

console.log(`Imported ${bookmarks.length} bookmarks`);
console.log('Categories:', JSON.stringify(categoryCounts, null, 2));

writeFileSync(outPath, JSON.stringify(bookmarks, null, 2));
console.log(`Written to ${outPath}`);
