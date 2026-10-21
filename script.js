// Sample Placeholder Data (Add your real resources here anytime!)
let resources = [
  {
    id: 1,
    title: "Official Python Documentation",
    category: "Python",
    type: "link",
    description: "Comprehensive language reference, standard libraries, and official guides for Python developers.",
    url: "https://docs.python.org/3/"
  },
  {
    id: 2,
    title: "Useful Git Commands",
    category: "Tools",
    type: "code",
    description: "Quick reference snippet for creating and pushing a new feature branch.",
    code: "git checkout -b feature/my-branch\ngit add .\ngit commit -m 'Add new feature'\ngit push origin feature/my-branch"
  },
  {
    id: 3,
    title: "Flexbox Froggy",
    category: "Web Dev",
    type: "link",
    description: "A fun interactive game to learn CSS Flexbox alignment and layout rules easily.",
    url: "https://flexboxfroggy.com/"
  }
];

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
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  setupEventListeners();
});

function renderApp() {
  renderSidebar();
  renderTags();
  renderResources();
  updateStats();
}

function getCategories() {
  const cats = ['All', ...new Set(resources.map(r => r.category))];
  return cats;
}

function renderSidebar() {
  const categories = getCategories();
  sidebarNav.innerHTML = categories.map(cat => {
    const count = cat === 'All' ? resources.length : resources.filter(r => r.category === cat).length;
    const activeClass = cat === activeCategory ? 'active' : '';
    return `
      <div class="nav-item ${activeClass}" onclick="setCategory('${cat}')">
        <span>${cat}</span>
        <span class="item-count">${count}</span>
      </div>
    `;
  }).join('');
}

function renderTags() {
  const categories = getCategories();
  tagContainer.innerHTML = categories.map(cat => `
    <button class="tag-btn ${cat === activeCategory ? 'active' : ''}" onclick="setCategory('${cat}')">
      ${cat}
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

  } else {
    resourceGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    resourceGrid.innerHTML = filtered.map(r => `
      <div class="card">
        <div>
          <div class="card-top">
            <span class="card-badge">${r.category}</span>
          </div>
          <h3 class="card-title">${r.title}</h3>
          <p class="card-desc">${r.description}</p>
        </div>

        ${r.type === 'code' ? `
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this, \`${r.code.replace(/`/g, '\\`')}\`)">Copy</button>
            <pre><code>${escapeHtml(r.code)}</code></pre>
          </div>
        ` : ''}

        ${r.url ? `
          <a href="${r.url}" target="_blank" class="card-action">Visit Resource &rarr;</a>
        ` : ''}
      </div>
    `).join('');
  }
}

function updateStats() {
  statTotal.textContent = resources.length;
  statCategories.textContent = new Set(resources.map(r => r.category)).size;
}

function setCategory(cat) {
  activeCategory = cat;
  renderApp();
}

// Search Handler
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderResources();
});

// Copy Code Utility
function copyCode(btn, codeText) {
  navigator.clipboard.writeText(codeText);
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 2000);
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
}

addResourceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newRes = {
    id: Date.now(),
    title: document.getElementById('resTitle').value,
    category: document.getElementById('resCategory').value,
    type: document.getElementById('resType').value,
    description: document.getElementById('resDesc').value,
    url: document.getElementById('resUrl').value || null,
    code: document.getElementById('resCode').value || null
  };

  resources.unshift(newRes);
  closeModal();
  renderApp();
});