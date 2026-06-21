/* ============================================================
   PIYUSH SINGH PORTFOLIO - MAIN SCRIPT
   Handles: theme toggle, code loading/rendering, modal logic,
   copy/run actions, project filtering, contact form validation
============================================================ */

const REPLIT_URLS = {
  "C": "https://replit.com/languages/c",
  "C++": "https://replit.com/languages/cpp",
  "Python": "https://replit.com/languages/python3"
};

// GitHub repo this site is hosted from — used to build "Open in Colab" links
// for .ipynb notebooks stored in the repo (e.g. codes/Python/expert/demo.ipynb)
const REPO_OWNER = "piyushsingh08112005-cmd";
const REPO_NAME = "piyushsingh08112005-cmd.github.io";
const REPO_BRANCH = "main";

/**
 * Build a Colab URL for a notebook.
 * - If `notebook` is already a full URL (http/https), it's used as-is.
 * - Otherwise it's treated as a path inside this repo (e.g. "codes/Python/expert/ml_demo.ipynb")
 *   and turned into a GitHub-loader Colab link that opens directly in Colab.
 */
function buildColabUrl(notebook) {
  if (!notebook) return null;
  if (/^https?:\/\//i.test(notebook)) return notebook;
  const cleanPath = notebook.replace(/^\/+/, '');
  return `https://colab.research.google.com/github/${REPO_OWNER}/${REPO_NAME}/blob/${REPO_BRANCH}/${cleanPath}`;
}

// Google Drive folder where Python .ipynb notebooks are stored/uploaded
const NOTEBOOKS_DRIVE_FOLDER = "https://drive.google.com/drive/folders/1XSeTiWy2YNpcdTpsmmi9NyGGXFlAyVd9";

const PRISM_LANG_MAP = {
  "C": "language-c",
  "C++": "language-cpp",
  "Python": "language-python"
};

let allCodes = [];
let currentLang = "C";
let currentLevel = "basic";

/* ============================
   THEME TOGGLE
============================ */
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function applyTheme(theme) {
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
    themeToggle.textContent = '☀️';
  } else {
    root.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
  }
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
}

themeToggle.addEventListener('click', () => {
  const isLight = root.getAttribute('data-theme') === 'light';
  const newTheme = isLight ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});

initTheme();

/* ============================
   FETCH & RENDER CODE DATA
============================ */
async function loadCodes() {
  try {
    const res = await fetch('data/codes.json');
    if (!res.ok) throw new Error('Failed to load codes.json');
    allCodes = await res.json();
    renderCodeGrid();
  } catch (err) {
    console.error('Error loading codes:', err);
    const grid = document.getElementById('codeGrid');
    grid.innerHTML = '<p class="empty-state">⚠️ Could not load code snippets. Check data/codes.json</p>';
  }
}

function renderCodeGrid() {
  const grid = document.getElementById('codeGrid');
  grid.innerHTML = '';

  const filtered = allCodes.filter(
    item => item.lang === currentLang && item.level === currentLevel
  );

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="empty-state">No snippets found for this category yet.</p>';
    return;
  }

  filtered.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'glass-card code-card';
    card.innerHTML = `
      <div class="code-card-header">
        <h4>${escapeHtml(item.title)}</h4>
        <span class="lang-badge">${escapeHtml(item.lang)}</span>
      </div>
      <p class="filename">${escapeHtml(item.filename)}</p>
      <span class="level-badge">⬤ ${escapeHtml(item.level)}</span>
    `;
    card.addEventListener('click', () => openModal(item));
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================
   TAB SWITCHING (LANGUAGE)
============================ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLang = btn.dataset.lang;
    renderCodeGrid();
    toggleNotebooksDriveLink();
  });
});

function toggleNotebooksDriveLink() {
  const link = document.getElementById('notebooksDriveLink');
  if (link) link.style.display = (currentLang === 'Python') ? 'flex' : 'none';
}

/* ============================
   SUB-TAB SWITCHING (LEVEL)
============================ */
document.querySelectorAll('.subtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
    renderCodeGrid();
  });
});

/* ============================
   MODAL LOGIC
============================ */
const codeModal = document.getElementById('codeModal');
const modalTitle = document.getElementById('modalTitle');
const modalCode = document.getElementById('modalCode');
const copyBtn = document.getElementById('copyBtn');
const runBtn = document.getElementById('runBtn');
const runOutput = document.getElementById('runOutput');
const modalClose = document.getElementById('modalClose');

const extraLinksEl = document.getElementById('extraLinks');

let activeItem = null;

function openModal(item) {
  activeItem = item;
  modalTitle.textContent = `${item.title} (${item.filename})`;

  // Reset classes and set code content
  modalCode.className = '';
  modalCode.classList.add(PRISM_LANG_MAP[item.lang] || 'language-clike');
  modalCode.textContent = item.code;

  // Reset run output
  runOutput.innerHTML = '';
  runOutput.classList.remove('active');

  // Resolve a Colab link: prefer an .ipynb notebook path/URL, fall back to a plain colab link
  const colabUrl = buildColabUrl(item.ipynb) || item.colab || null;

  // Update run button label based on colab/notebook availability
  if (item.lang === 'Python' && colabUrl) {
    runBtn.textContent = 'Open in Colab 🚀';
  } else {
    runBtn.textContent = '▶ Run on Replit ↗';
  }

  // Render any extra reference links attached to this snippet
  extraLinksEl.innerHTML = '';
  if (Array.isArray(item.links)) {
    item.links.forEach(link => {
      if (!link || !link.url) return;
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'extra-link-btn';
      a.textContent = `🔗 ${link.label || link.url}`;
      extraLinksEl.appendChild(a);
    });
  }

  codeModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Highlight syntax
  if (window.Prism) {
    Prism.highlightElement(modalCode);
  }
}

function closeModal() {
  codeModal.classList.remove('active');
  document.body.style.overflow = '';
  runOutput.innerHTML = '';
  runOutput.classList.remove('active');
  extraLinksEl.innerHTML = '';
  activeItem = null;
}

modalClose.addEventListener('click', closeModal);

codeModal.addEventListener('click', (e) => {
  if (e.target === codeModal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && codeModal.classList.contains('active')) {
    closeModal();
  }
});

/* ============================
   COPY BUTTON
============================ */
copyBtn.addEventListener('click', async () => {
  if (!activeItem) return;
  try {
    await navigator.clipboard.writeText(activeItem.code);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
    copyBtn.textContent = '❌ Failed';
    setTimeout(() => {
      copyBtn.textContent = '📋 Copy Code';
    }, 2000);
  }
});

/* ============================
   RUN BUTTON LOGIC
============================ */
runBtn.addEventListener('click', () => {
  if (!activeItem) return;

  // Python with a notebook (.ipynb) or Colab link -> open directly in Colab, new tab
  const colabUrl = buildColabUrl(activeItem.ipynb) || activeItem.colab;
  if (activeItem.lang === 'Python' && colabUrl) {
    window.open(colabUrl, '_blank', 'noopener');
    return;
  }

  // Otherwise -> open Replit in a new tab (no more inline iframe runner)
  const replitUrl = REPLIT_URLS[activeItem.lang];
  if (replitUrl) {
    window.open(replitUrl, '_blank', 'noopener');
  }
});

/* ============================
   PROJECTS SECTION
============================ */
const sampleProjects = [
  {
    title: "Student Management System",
    desc: "A C++ console application using OOP principles to manage student records with file-based persistence.",
    tags: ["C++", "OOP", "File I/O"],
    filterTag: "C++"
  },
  {
    title: "Library Inventory Tracker",
    desc: "Built with C++ STL containers for efficient searching, sorting, and inventory management of library books.",
    tags: ["C++", "STL", "Data Structures"],
    filterTag: "C++"
  },
  {
    title: "Movie Recommendation Engine",
    desc: "A Python-based content recommendation system using Pandas for data wrangling and similarity scoring.",
    tags: ["Python", "Pandas", "ML"],
    filterTag: "Python"
  },
  {
    title: "Data Visualization Dashboard",
    desc: "Interactive dashboard built with Python, NumPy and Matplotlib to visualize trends in datasets.",
    tags: ["Python", "NumPy", "Matplotlib"],
    filterTag: "Python"
  },
  {
    title: "Tic Tac Toe AI",
    desc: "A C++ console game implementing the Minimax algorithm for an unbeatable AI opponent.",
    tags: ["C++", "Algorithms", "Game Dev"],
    filterTag: "C++"
  }
];

let currentFilter = "All";

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = '';

  const filtered = currentFilter === 'All'
    ? sampleProjects
    : sampleProjects.filter(p => p.filterTag === currentFilter);

  filtered.forEach(project => {
    const card = document.createElement('div');
    card.className = 'glass-card project-card';
    card.innerHTML = `
      <h4>${escapeHtml(project.title)}</h4>
      <p>${escapeHtml(project.desc)}</p>
      <div class="project-tags">
        ${project.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
      </div>
    `;
    grid.appendChild(card);
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProjects();
  });
});

/* ============================
   CONTACT FORM VALIDATION
============================ */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

function showError(id, message) {
  document.getElementById(id).textContent = message;
}

function clearErrors() {
  ['nameError', 'emailError', 'messageError'].forEach(id => showError(id, ''));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  formSuccess.textContent = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  let valid = true;

  if (name.length < 2) {
    showError('nameError', 'Please enter a valid name (min 2 characters).');
    valid = false;
  }

  if (!isValidEmail(email)) {
    showError('emailError', 'Please enter a valid email address.');
    valid = false;
  }

  if (message.length < 10) {
    showError('messageError', 'Message must be at least 10 characters long.');
    valid = false;
  }

  if (!valid) return;

  // Simulate successful submission (no backend connected)
  formSuccess.textContent = '✅ Thank you! Your message has been noted. I will get back to you soon.';
  contactForm.reset();

  setTimeout(() => {
    formSuccess.textContent = '';
  }, 5000);
});

/* ============================
   FOOTER YEAR
============================ */
document.getElementById('year').textContent = new Date().getFullYear();

/* ============================
   INIT
============================ */
document.addEventListener('DOMContentLoaded', () => {
  loadCodes();
  renderProjects();
  toggleNotebooksDriveLink();
});
