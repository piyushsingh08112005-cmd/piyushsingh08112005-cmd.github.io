/* ============================================================
   PIYUSH SINGH PORTFOLIO - MAIN SCRIPT
   Handles: theme toggle, code loading/rendering, modal logic,
   copy/run actions, project filtering, contact form validation
============================================================ */

const PISTON_LANG_MAP = {
  "C": "c",
  "C++": "cpp",
  "Python": "python"
};

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
    if (!res.ok) throw new Error(`Failed to load codes.json: ${res.status}`);
    allCodes = await res.json();
    console.log('Codes loaded:', allCodes.length, 'snippets');
    renderCodeGrid();
  } catch (err) {
    console.error('Error loading codes:', err);
    const grid = document.getElementById('codeGrid');
    grid.innerHTML = '<p class="empty-state">⚠️ Could not load code snippets. Error: ' + err.message + '</p>';
  }
}

function renderCodeGrid() {
  const grid = document.getElementById('codeGrid');
  grid.innerHTML = '';

  const filtered = allCodes.filter(
    item => item.lang === currentLang && item.level === currentLevel
  );

  console.log('Filtered codes:', filtered.length);

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
  });
});

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

let activeItem = null;
let isRunning = false;

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

  // Update run button label based on colab availability
  if (item.lang === 'Python' && item.colab) {
    runBtn.textContent = 'Open in Colab 🚀';
  } else {
    runBtn.textContent = '▶ Run Code';
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
   RUN BUTTON LOGIC - PISTON API
============================ */
runBtn.addEventListener('click', async () => {
  if (!activeItem || isRunning) return;

  // Python with Colab link -> open in new tab
  if (activeItem.lang === 'Python' && activeItem.colab) {
    window.open(activeItem.colab, '_blank', 'noopener');
    return;
  }

  isRunning = true;
  const originalText = runBtn.textContent;
  runBtn.textContent = '⏳ Running...';
  runBtn.disabled = true;

  try {
    const language = PISTON_LANG_MAP[activeItem.lang];
    if (!language) {
      throw new Error(`Language "${activeItem.lang}" not supported`);
    }

    const response = await fetch('https://emkc.org/api/v2/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: language,
        version: '*',
        files: [
          {
            name: activeItem.filename,
            content: activeItem.code
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const output = result.run.output || result.run.stderr || '(No output)';
    const runtime = result.run.stdout ? '✅ Success' : '⚠️ Output';

    runOutput.innerHTML = `
      <div class="output-container">
        <div class="output-header">${runtime}</div>
        <pre class="output-code">${escapeHtml(output)}</pre>
      </div>
    `;
    runOutput.classList.add('active');
    runOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error('Execution error:', err);
    runOutput.innerHTML = `
      <div class="output-container">
        <div class="output-header">❌ Error</div>
        <pre class="output-code">${escapeHtml(err.message)}</pre>
      </div>
    `;
    runOutput.classList.add('active');
  } finally {
    isRunning = false;
    runBtn.textContent = originalText;
    runBtn.disabled = false;
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
});
