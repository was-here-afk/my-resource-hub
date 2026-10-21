// ===== Config =====
// Your GitHub repo, where visitor submissions arrive as Issues
const REPO = 'was-here-afk/my-resource-hub';

// Resources are loaded from resources.json (edit that file to add resources permanently)
let resources = [];

let activeCategory = "All";
let searchQuery = "";

// DOM Elements
const resourceGrid = document.getElementById('resourceGrid');
const sidebarNav = document.getElementById('sidebarNav');
const tagContainer = document.getElementById('tagContainer');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const statTotal = document.getElementById('statTotal');
const statCategories = document.getElementById('statCategories');
const currentCategoryTitle = document.getElementById('currentCategoryTitle');

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await loadResources();
  renderApp();
});

async function loadResources() {
  try {
    const res = await fetch('resources.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    resources = await res.json();
  } catch (err) {
    console.error('Could not load resources.json', err);
    resources = [];
  }
}

function renderApp() {
  renderSidebar();
  renderTags();
  renderResources();
  updateStats();
}

function getCategories() {
  return ['All', ...new Set(resources.map(r => r.category))];
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only allow http(s) links so nobody can sneak in javascript: URLs
function safeUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
  } catch {
    return null;
  }
}

function renderSidebar() {
  sidebarNav.innerHTML = getCategories().map(cat => {
    const count = cat === 'All' ? resources.length : resources.filter(r => r.category === cat).length;
    const activeClass = cat === activeCategory ? 'active' : '';
    return `
      <div class="nav-item ${activeClass}" data-cat="${escapeHtml(cat)}">
        <span>${escapeHtml(cat)}</span>
        <span class="item-count">${count}</span>
      </div>
    `;
  }).join('');
}

function renderTags() {
  tagContainer.innerHTML = getCategories().map(cat => `
    <button class="tag-btn ${cat === activeCategory ? 'active' : ''}" data-cat="${escapeHtml(cat)}">
      ${escapeHtml(cat)}
    </button>
  `).join('');
}

function renderResources() {
  let filtered = resources;

  if (activeCategory !== 'All') {
    filtered = filtered.filter(r => r.category === activeCategory);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }

  currentCategoryTitle.textContent = activeCategory === 'All' ? 'All Resources' : `${activeCategory} Resources`;

  if (filtered.length === 0) {
    resourceGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  resourceGrid.classList.remove('hidden');
  emptyState.classList.add('hidden');

  resourceGrid.innerHTML = filtered.map(r => {
    const link = r.url ? safeUrl(r.url) : null;
    return `
      <div class="card">
        <div>
          <div class="card-top">
            <span class="card-badge">${escapeHtml(r.category)}</span>
          </div>
          <h3 class="card-title">${escapeHtml(r.title)}</h3>
          <p class="card-desc">${escapeHtml(r.description)}</p>
        </div>

        ${r.type === 'code' && r.code ? `
          <div class="code-block">
            <button class="copy-btn" data-id="${r.id}">Copy</button>
            <pre><code>${escapeHtml(r.code)}</code></pre>
          </div>
        ` : ''}

        ${link ? `
          <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="card-action">Visit Resource &rarr;</a>
        ` : ''}
      </div>
    `;
  }).join('');
}

function updateStats() {
  statTotal.textContent = resources.length;
  statCategories.textContent = new Set(resources.map(r => r.category)).size;
}

function setCategory(cat) {
  activeCategory = cat;
  renderApp();
}

// Category clicks (sidebar + tag bar)
[sidebarNav, tagContainer].forEach(el => {
  el.addEventListener('click', (e) => {
    const target = e.target.closest('[data-cat]');
    if (target) setCategory(target.dataset.cat);
  });
});

// Copy button clicks
resourceGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const item = resources.find(r => String(r.id) === btn.dataset.id);
  if (!item) return;
  navigator.clipboard.writeText(item.code);
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 2000);
});

// Search Handler
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderResources();
});

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  activeCategory = 'All';
  searchQuery = '';
  searchInput.value = '';
  renderApp();
});

// Theme Switcher
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

themeToggle.addEventListener('click', () => {
  const currentTheme = document.body.getAttribute('data-theme');
  if (currentTheme === 'light') {
    document.body.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
  } else {
    document.body.setAttribute('data-theme', 'light');
    themeIcon.textContent = '☀️';
  }
});

// Keyboard Shortcut Ctrl+K
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
});

// Modal Dialog Handlers
const modalBackdrop = document.getElementById('modalBackdrop');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const addResourceForm = document.getElementById('addResourceForm');
const resTypeSelect = document.getElementById('resType');
const urlGroup = document.getElementById('urlGroup');
const codeGroup = document.getElementById('codeGroup');

openModalBtn.addEventListener('click', () => modalBackdrop.classList.remove('hidden'));
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

resTypeSelect.addEventListener('change', (e) => {
  if (e.target.value === 'code') {
    codeGroup.classList.remove('hidden');
    urlGroup.classList.add('hidden');
  } else {
    codeGroup.classList.add('hidden');
    urlGroup.classList.remove('hidden');
  }
});

function closeModal() {
  modalBackdrop.classList.add('hidden');
  addResourceForm.reset();
  codeGroup.classList.add('hidden');
  urlGroup.classList.remove('hidden');
}

// Submitting sends the resource to you as a pre-filled GitHub Issue
addResourceForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const submission = {
    title: document.getElementById('resTitle').value.trim(),
    category: document.getElementById('resCategory').value.trim(),
    type: document.getElementById('resType').value,
    description: document.getElementById('resDesc').value.trim(),
    url: document.getElementById('resUrl').value.trim() || null,
    code: document.getElementById('resCode').value || null
  };

  if (submission.url && !safeUrl(submission.url)) {
    alert('Please enter a valid http(s) URL.');
    return;
  }

  const json = JSON.stringify(submission, null, 2);
  const issueTitle = encodeURIComponent(`Resource submission: ${submission.title}`);
  const issueBody = encodeURIComponent(
    `**New resource submission**\n\n\`\`\`json\n${json}\n\`\`\`\n`
  );
  const issueUrl = `https://github.com/${REPO}/issues/new?labels=submission&title=${issueTitle}&body=${issueBody}`;

  // GitHub rejects very long URLs, so warn instead of failing silently
  if (issueUrl.length > 7500) {
    alert('This submission is too long to send. Please shorten the code snippet or description.');
    return;
  }

  window.open(issueUrl, '_blank', 'noopener');
  closeModal();
  alert('Thanks! GitHub will open in a new tab. Click "Submit new issue" there to send it for review.');
});
