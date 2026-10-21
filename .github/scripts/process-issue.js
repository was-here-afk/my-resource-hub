// Runs inside GitHub Actions. Reads the issue from environment variables,
// then adds or removes an entry in resources.json.
const fs = require('fs');

const FILE = 'resources.json';
const ACTION = process.env.ACTION;           // "approve" or "remove"
const TITLE = process.env.ISSUE_TITLE || '';
const BODY = process.env.ISSUE_BODY || '';

function finish(ok, message) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `status=${ok ? 'ok' : 'error'}\n`);
  fs.writeFileSync('result.md', message);
  console.log(message);
  process.exit(0); // the workflow reads "status", so the job itself doesn't fail
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

let resources;
try {
  resources = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!Array.isArray(resources)) throw new Error('not an array');
} catch (err) {
  finish(false, `Could not read ${FILE}: ${err.message}`);
}

if (ACTION === 'approve') {
  // Greedy match: first ```json fence to the last ``` fence, so code snippets
  // that contain backticks don't cut the JSON short.
  const match = BODY.match(/```json\s*([\s\S]*)```/);
  if (!match) finish(false, 'No ```json block found in the issue body.');

  let raw;
  try {
    raw = JSON.parse(match[1]);
  } catch (err) {
    finish(false, `The JSON in the issue is invalid: ${err.message}`);
  }

  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const entry = {
    title: str(raw.title, 120),
    category: str(raw.category, 40),
    type: ['link', 'code', 'cheatsheet'].includes(raw.type) ? raw.type : 'link',
    description: str(raw.description, 500)
  };

  if (!entry.title || !entry.category || !entry.description) {
    finish(false, 'Missing title, category or description.');
  }

  const url = str(raw.url, 500);
  if (url) {
    if (!isHttpUrl(url)) finish(false, `Invalid URL: ${url}`);
    entry.url = url;
  }

  const code = typeof raw.code === 'string' ? raw.code.slice(0, 5000) : '';
  if (code) entry.code = code;

  if (!entry.url && !entry.code) {
    finish(false, 'A resource needs a URL or a code snippet.');
  }

  if (entry.url && resources.some(r => r.url === entry.url)) {
    finish(false, `A resource with this URL already exists: ${entry.url}`);
  }

  const nextId = resources.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
  resources.unshift({ id: nextId, ...entry }); // newest first

  fs.writeFileSync(FILE, JSON.stringify(resources, null, 2) + '\n');
  finish(true, `Added **${entry.title}** (id ${nextId}) to the site. It should be live in about a minute.`);

} else if (ACTION === 'remove') {
  // Issue title can be an id ("Remove 5"), the exact resource title, or its URL
  const query = TITLE.replace(/^\s*remove[:\s-]*/i, '').trim();
  if (!query) finish(false, 'Put an id, title or URL in the issue title, e.g. "Remove 5".');

  const lower = query.toLowerCase();
  const matches = resources.filter(r =>
    (/^\d+$/.test(query) && Number(r.id) === Number(query)) ||
    (r.title || '').toLowerCase() === lower ||
    (r.url || '').toLowerCase() === lower
  );

  if (matches.length === 0) finish(false, `No resource matched "${query}".`);
  if (matches.length > 1) finish(false, `"${query}" matched ${matches.length} resources. Use the id instead.`);

  const target = matches[0];
  resources = resources.filter(r => r !== target);
  fs.writeFileSync(FILE, JSON.stringify(resources, null, 2) + '\n');
  finish(true, `Removed **${target.title}** (id ${target.id}) from the site.`);

} else {
  finish(false, `Unknown action: ${ACTION}`);
}
