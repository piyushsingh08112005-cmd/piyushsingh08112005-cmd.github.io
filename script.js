// ============================================================
//  script.js  –  Piyush Singh Portfolio
//  FIX LOG:
//  1. Removed broken OpenAI / JDoodle config stubs (keys were placeholders).
//  2. Compiler now uses FREE Judge0 CE public API – no key required.
//  3. loadSnippets() / stray <select> / <div id="snippets"> removed from HTML.
//  4. Dataset context now loaded from data/codes.json (single source of truth).
//  5. Theme-toggle, navbar scroll-hide, modal, copy, run, contact form all fixed.
//  6. Projects data moved inline (was missing from JSON).
//  7. Modal "Run Code" now uses Judge0 for C / C++ / Python – shows real output.
//  8. Footer year auto-filled.
// ============================================================

// ── Judge0 CE public endpoint (no auth needed for basic use) ─────────────────
const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
// Sign up free at rapidapi.com/judge0-official/api/judge0-ce for a key.
// Leave blank to use the unauthenticated mirror below instead.
const RAPIDAPI_KEY = "";   // optional – paste your RapidAPI key here if you have one

// Fallback: public mirror that needs no key (rate-limited but works for demos)
const JUDGE0_MIRROR = "https://api.judge0.com";

// Judge0 language IDs
const LANG_IDS = {
  C:      50,   // C (GCC 9.2.0)
  "C++":  54,   // C++ (GCC 9.2.0)
  Python: 71    // Python (3.8.1)
};

// ── All code snippets (merged + enriched from data/codes.json) ────────────────
let allCodes = [];

// ── Projects data ─────────────────────────────────────────────────────────────
const projects = [
  {
    title: "Student Grade Calculator",
    desc: "A C++ console application that calculates student grades, GPA and generates report cards using OOP principles.",
    tags: ["C++", "OOP", "Console"]
  },
  {
    title: "Number Guessing Game",
    desc: "Interactive Python game with difficulty levels, score tracking and colorful terminal output using random module.",
    tags: ["Python", "Game", "Random"]
  },
  {
    title: "Linked List Visualizer",
    desc: "C program that implements singly, doubly and circular linked lists with interactive insert/delete/search operations.",
    tags: ["C++", "Data Structures", "Algorithms"]
  },
  {
    title: "CSV Data Analyzer",
    desc: "Python script that reads CSV files, performs statistical analysis using Pandas and plots charts with Matplotlib.",
    tags: ["Python", "Pandas", "Data Analysis"]
  },
  {
    title: "Matrix Operations Library",
    desc: "C++ library for matrix addition, subtraction, multiplication, transpose and determinant using 2D arrays.",
    tags: ["C++", "Math", "Library"]
  },
  {
    title: "Password Strength Checker",
    desc: "Python tool that evaluates password strength using regex, suggests improvements and generates secure passwords.",
    tags: ["Python", "Security", "Regex"]
  }
];

// ── State ─────────────────────────────────────────────────────────────────────
let currentLang  = "C";
let currentLevel = "basic";
let currentFilter = "All";

// ═══════════════════════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme
  initTheme();

  // Load codes then boot UI
  fetchCodes();

  // Contact form
  initContactForm();

  // Navbar active-link on scroll
  initScrollSpy();
});

// ── Fetch codes.json ──────────────────────────────────────────────────────────
async function fetchCodes() {
  try {
    const res = await fetch("data/codes.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    allCodes = await res.json();
  } catch (e) {
    console.warn("Could not load data/codes.json, using built-in fallback.", e);
    allCodes = FALLBACK_CODES;
  }
  renderCodeGrid();
  renderProjects();
  initTabs();
  initModal();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  THEME TOGGLE
// ═══════════════════════════════════════════════════════════════════════════════
function initTheme() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const saved = localStorage.getItem("theme") || "dark";
  applyTheme(saved, btn);

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next, btn);
  });
}

function applyTheme(theme, btn) {
  document.documentElement.setAttribute("data-theme", theme);
  btn.textContent = theme === "dark" ? "🌙" : "☀️";
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TABS (language + level)
// ═══════════════════════════════════════════════════════════════════════════════
function initTabs() {
  // Language tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentLang = btn.dataset.lang;

      // Show/hide Python Drive link
      const driveLink = document.getElementById("notebooksDriveLink");
      if (driveLink) {
        driveLink.style.display = (currentLang === "Python") ? "flex" : "none";
      }

      renderCodeGrid();
    });
  });

  // Level sub-tabs
  document.querySelectorAll(".subtab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentLevel = btn.dataset.level;
      renderCodeGrid();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CODE GRID
// ═══════════════════════════════════════════════════════════════════════════════
function renderCodeGrid() {
  const grid = document.getElementById("codeGrid");
  if (!grid) return;

  const filtered = allCodes.filter(
    c => c.lang === currentLang && c.level === currentLevel
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<p class="empty-state">No ${currentLang} snippets found at <strong>${currentLevel}</strong> level yet.</p>`;
    return;
  }

  grid.innerHTML = filtered.map((c, i) => {
    const globalIdx = allCodes.indexOf(c);
    return `
      <div class="glass-card code-card" onclick="openModal(${globalIdx})">
        <div class="code-card-header">
          <h4>${escHtml(c.title)}</h4>
          <span class="lang-badge">${escHtml(c.lang)}</span>
        </div>
        <p class="filename">📄 ${escHtml(c.filename)}</p>
        <span class="level-badge">⭐ ${escHtml(c.level)}</span>
      </div>`;
  }).join("");
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function initModal() {
  const overlay = document.getElementById("codeModal");
  const closeBtn = document.getElementById("modalClose");
  const copyBtn  = document.getElementById("copyBtn");
  const runBtn   = document.getElementById("runBtn");

  if (!overlay) return;

  // Close on overlay click or × button
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
  closeBtn.addEventListener("click", closeModal);

  // Keyboard Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  copyBtn.addEventListener("click", copyCode);
  runBtn.addEventListener("click", runModalCode);
}

function openModal(idx) {
  const c = allCodes[idx];
  if (!c) return;

  const overlay   = document.getElementById("codeModal");
  const titleEl   = document.getElementById("modalTitle");
  const codeEl    = document.getElementById("modalCode");
  const runOutput = document.getElementById("runOutput");
  const extraLinks = document.getElementById("extraLinks");

  titleEl.textContent = c.title;
  codeEl.textContent  = c.code;
  codeEl.className    = `language-${langClass(c.lang)}`;

  // Reset output
  runOutput.innerHTML = "";
  runOutput.classList.remove("active");

  // Extra links (colab, ipynb, custom links)
  extraLinks.innerHTML = "";

  if (c.colab) {
    extraLinks.innerHTML += `<a href="${escHtml(c.colab)}" target="_blank" rel="noopener" class="extra-link-btn">🚀 Open in Colab</a>`;
  }
  if (c.ipynb) {
    const colabUrl = c.ipynb.startsWith("http")
      ? c.ipynb
      : `https://colab.research.google.com/github/${c.ipynb}`;
    extraLinks.innerHTML += `<a href="${escHtml(colabUrl)}" target="_blank" rel="noopener" class="extra-link-btn">📓 Notebook</a>`;
  }
  if (Array.isArray(c.links)) {
    c.links.forEach(link => {
      extraLinks.innerHTML += `<a href="${escHtml(link.url)}" target="_blank" rel="noopener" class="extra-link-btn">${escHtml(link.label)}</a>`;
    });
  }

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  // Re-highlight with Prism if available
  if (window.Prism) {
    Prism.highlightElement(codeEl);
  }
}

function closeModal() {
  const overlay = document.getElementById("codeModal");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function langClass(lang) {
  const map = { C: "c", "C++": "cpp", Python: "python" };
  return map[lang] || "clike";
}

// ── Copy code ─────────────────────────────────────────────────────────────────
async function copyCode() {
  const code = document.getElementById("modalCode")?.textContent || "";
  try {
    await navigator.clipboard.writeText(code);
    const btn = document.getElementById("copyBtn");
    btn.textContent = "✅ Copied!";
    setTimeout(() => { btn.textContent = "📋 Copy Code"; }, 2000);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

// ── Run code via Judge0 ───────────────────────────────────────────────────────
async function runModalCode() {
  const codeEl    = document.getElementById("modalCode");
  const runOutput = document.getElementById("runOutput");
  const runBtn    = document.getElementById("runBtn");

  if (!codeEl || !runOutput) return;

  const code     = codeEl.textContent || "";
  const langName = codeEl.className.includes("python") ? "Python"
                 : codeEl.className.includes("cpp")    ? "C++"
                 : "C";
  const langId   = LANG_IDS[langName];

  runBtn.disabled    = true;
  runBtn.textContent = "⏳ Running…";
  runOutput.classList.add("active");
  runOutput.innerHTML = `<div style="padding:16px;color:var(--text-secondary);">⏳ Compiling &amp; executing…</div>`;

  try {
    const result = await judge0Run(code, langId);
    const stdout = result.stdout || "";
    const stderr = result.stderr || result.compile_output || "";
    const status = result.status?.description || "Unknown";

    if (status === "Accepted" || stdout) {
      runOutput.innerHTML = `
        <div style="background:#0d1117;border-radius:10px;padding:16px;font-family:monospace;font-size:0.88rem;color:#c9d1d9;white-space:pre-wrap;line-height:1.6;">
<span style="color:#3fb950;font-weight:700;">▶ Output (${escHtml(status)}):</span>\n${escHtml(stdout || "(no output)")}</div>`;
    } else {
      runOutput.innerHTML = `
        <div style="background:#1a0a0a;border-radius:10px;padding:16px;font-family:monospace;font-size:0.88rem;color:#ff7b72;white-space:pre-wrap;line-height:1.6;">
<span style="font-weight:700;">❌ ${escHtml(status)}</span>\n${escHtml(stderr || "Unknown error")}</div>`;
    }
  } catch (err) {
    runOutput.innerHTML = `<div style="padding:16px;color:var(--error);">⚠️ Could not reach compiler API: ${escHtml(err.message)}</div>`;
  }

  runBtn.disabled    = false;
  runBtn.textContent = "▶ Run Code";
}

// ── Judge0 helper ─────────────────────────────────────────────────────────────
async function judge0Run(sourceCode, languageId) {
  const base    = RAPIDAPI_KEY ? JUDGE0_URL : JUDGE0_MIRROR;
  const headers = { "Content-Type": "application/json" };
  if (RAPIDAPI_KEY) {
    headers["X-RapidAPI-Key"]  = RAPIDAPI_KEY;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  // Submit
  const submitRes = await fetch(`${base}/submissions?base64_encoded=false&wait=false`, {
    method: "POST",
    headers,
    body: JSON.stringify({ source_code: sourceCode, language_id: languageId })
  });
  if (!submitRes.ok) throw new Error("Submission failed: HTTP " + submitRes.status);
  const { token } = await submitRes.json();

  // Poll until done
  for (let i = 0; i < 20; i++) {
    await sleep(800);
    const res = await fetch(`${base}/submissions/${token}?base64_encoded=false`, { headers });
    if (!res.ok) throw new Error("Polling failed: HTTP " + res.status);
    const data = await res.json();
    // Status IDs 1 (In Queue) and 2 (Processing) – keep waiting
    if (data.status?.id > 2) return data;
  }
  throw new Error("Execution timed out");
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════════════════════════════════════════════
function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderProjectCards();
    });
  });

  renderProjectCards();
}

function renderProjectCards() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  const filtered = currentFilter === "All"
    ? projects
    : projects.filter(p => p.tags.includes(currentFilter));

  grid.innerHTML = filtered.map(p => `
    <div class="glass-card project-card">
      <h4>${escHtml(p.title)}</h4>
      <p>${escHtml(p.desc)}</p>
      <div class="project-tags">
        ${p.tags.map(t => `<span>${escHtml(t)}</span>`).join("")}
      </div>
    </div>`).join("");
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CONTACT FORM  (EmailJS-free fallback: mailto + validation)
// ═══════════════════════════════════════════════════════════════════════════════
function initContactForm() {
  const form    = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    let valid = true;

    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const message = form.message.value.trim();

    // Clear errors
    ["nameError", "emailError", "messageError"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    });
    if (success) success.textContent = "";

    if (!name) {
      setErr("nameError", "Name is required.");
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("emailError", "Please enter a valid email.");
      valid = false;
    }
    if (!message || message.length < 10) {
      setErr("messageError", "Message must be at least 10 characters.");
      valid = false;
    }

    if (!valid) return;

    // Open mailto as fallback (no server needed)
    const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
    const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.open(`mailto:piyushsingh08112005@gmail.com?subject=${subject}&body=${body}`);

    if (success) success.textContent = "✅ Your mail client has been opened! Message ready to send.";
    form.reset();
  });
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCROLL SPY  (navbar highlight)
// ═══════════════════════════════════════════════════════════════════════════════
function initScrollSpy() {
  const links    = document.querySelectorAll(".nav-links a");
  const sections = ["home", "languages", "codes", "projects", "contact"];

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(a => {
          a.style.color = a.getAttribute("href") === `#${id}`
            ? "var(--accent-1)"
            : "var(--text-secondary)";
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════════════════════════════════
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Fallback codes (used if data/codes.json can't be fetched) ─────────────────
const FALLBACK_CODES = [
  // ── C Basic ──
  { title: "Hello World", filename: "hello.c", lang: "C", level: "basic",
    code: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}` },
  { title: "Sum of Two Numbers", filename: "sum.c", lang: "C", level: "basic",
    code: `#include <stdio.h>\n\nint main() {\n    int a = 5, b = 10;\n    printf("Sum: %d\\n", a + b);\n    return 0;\n}` },
  { title: "Even or Odd", filename: "even_odd.c", lang: "C", level: "basic",
    code: `#include <stdio.h>\n\nint main() {\n    int n = 7;\n    printf("%d is %s\\n", n, n % 2 == 0 ? "Even" : "Odd");\n    return 0;\n}` },
  { title: "Fibonacci Series", filename: "fibonacci.c", lang: "C", level: "basic",
    code: `#include <stdio.h>\n\nint main() {\n    int n = 10, a = 0, b = 1, next;\n    printf("Fibonacci: ");\n    for (int i = 0; i < n; i++) {\n        printf("%d ", a);\n        next = a + b; a = b; b = next;\n    }\n    printf("\\n");\n    return 0;\n}` },
  // ── C Advanced ──
  { title: "Factorial (Recursion)", filename: "factorial.c", lang: "C", level: "advanced",
    code: `#include <stdio.h>\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    printf("5! = %d\\n", factorial(5));\n    return 0;\n}` },
  { title: "Bubble Sort", filename: "bubble_sort.c", lang: "C", level: "advanced",
    code: `#include <stdio.h>\n\nvoid bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n - 1; i++)\n        for (int j = 0; j < n - i - 1; j++)\n            if (arr[j] > arr[j+1]) { int t = arr[j]; arr[j] = arr[j+1]; arr[j+1] = t; }\n}\n\nint main() {\n    int arr[] = {64, 34, 25, 12, 22, 11, 90}, n = 7;\n    bubbleSort(arr, n);\n    for (int i = 0; i < n; i++) printf("%d ", arr[i]);\n    printf("\\n");\n    return 0;\n}` },
  { title: "Prime Number Check", filename: "prime.c", lang: "C", level: "advanced",
    code: `#include <stdio.h>\n#include <math.h>\n\nint isPrime(int n) {\n    if (n < 2) return 0;\n    for (int i = 2; i <= (int)sqrt(n); i++)\n        if (n % i == 0) return 0;\n    return 1;\n}\n\nint main() {\n    printf("Primes up to 50: ");\n    for (int i = 2; i <= 50; i++) if (isPrime(i)) printf("%d ", i);\n    printf("\\n");\n    return 0;\n}` },
  // ── C Expert ──
  { title: "Quick Sort", filename: "quicksort.c", lang: "C", level: "expert",
    code: `#include <stdio.h>\n\nvoid swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }\n\nint partition(int arr[], int lo, int hi) {\n    int pivot = arr[hi], i = lo - 1;\n    for (int j = lo; j < hi; j++) if (arr[j] < pivot) swap(&arr[++i], &arr[j]);\n    swap(&arr[i+1], &arr[hi]);\n    return i + 1;\n}\n\nvoid quickSort(int arr[], int lo, int hi) {\n    if (lo < hi) { int p = partition(arr, lo, hi); quickSort(arr, lo, p-1); quickSort(arr, p+1, hi); }\n}\n\nint main() {\n    int arr[] = {64, 34, 25, 12, 22, 11, 90}, n = 7;\n    quickSort(arr, 0, n - 1);\n    for (int i = 0; i < n; i++) printf("%d ", arr[i]);\n    printf("\\n");\n    return 0;\n}` },
  { title: "Linked List (Insert/Print)", filename: "linked_list.c", lang: "C", level: "expert",
    code: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node { int data; struct Node *next; } Node;\n\nNode* insert(Node *head, int val) {\n    Node *n = malloc(sizeof(Node));\n    n->data = val; n->next = head;\n    return n;\n}\n\nvoid print(Node *head) {\n    while (head) { printf("%d -> ", head->data); head = head->next; }\n    printf("NULL\\n");\n}\n\nint main() {\n    Node *head = NULL;\n    for (int i = 1; i <= 5; i++) head = insert(head, i * 10);\n    print(head);\n    return 0;\n}` },
  { title: "String Reverse (Pointers)", filename: "str_reverse.c", lang: "C", level: "expert",
    code: `#include <stdio.h>\n#include <string.h>\n\nvoid reverse(char *s) {\n    char *e = s + strlen(s) - 1;\n    while (s < e) { char t = *s; *s++ = *e; *e-- = t; }\n}\n\nint main() {\n    char str[] = "Piyush Singh";\n    reverse(str);\n    printf("%s\\n", str);\n    return 0;\n}` },
  // ── C++ Basic ──
  { title: "Hello World", filename: "hello.cpp", lang: "C++", level: "basic",
    code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}` },
  { title: "Student Class", filename: "student.cpp", lang: "C++", level: "basic",
    code: `#include <iostream>\n#include <string>\nusing namespace std;\n\nclass Student {\npublic:\n    string name;\n    int roll;\n    void display() { cout << "Name: " << name << ", Roll: " << roll << endl; }\n};\n\nint main() {\n    Student s; s.name = "Piyush"; s.roll = 101;\n    s.display(); return 0;\n}` },
  { title: "Vector Sort (STL)", filename: "vector_sort.cpp", lang: "C++", level: "basic",
    code: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    vector<int> v = {5, 2, 8, 1, 9, 3};\n    sort(v.begin(), v.end());\n    for (int x : v) cout << x << " ";\n    cout << endl;\n    return 0;\n}` },
  // ── C++ Advanced ──
  { title: "Binary Search", filename: "bsearch.cpp", lang: "C++", level: "advanced",
    code: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint binarySearch(vector<int>& arr, int target) {\n    int l = 0, r = arr.size() - 1;\n    while (l <= r) {\n        int m = l + (r - l) / 2;\n        if (arr[m] == target) return m;\n        arr[m] < target ? l = m + 1 : r = m - 1;\n    }\n    return -1;\n}\n\nint main() {\n    vector<int> a = {1, 3, 5, 7, 9, 11};\n    cout << "Index of 7: " << binarySearch(a, 7) << endl;\n    return 0;\n}` },
  { title: "Operator Overloading", filename: "op_overload.cpp", lang: "C++", level: "advanced",
    code: `#include <iostream>\nusing namespace std;\n\nclass Complex {\npublic:\n    int r, i;\n    Complex(int r=0, int i=0): r(r), i(i) {}\n    Complex operator+(const Complex& o) { return Complex(r+o.r, i+o.i); }\n    void print() { cout << r << " + " << i << "i" << endl; }\n};\n\nint main() {\n    Complex c1(3, 4), c2(1, 2);\n    (c1 + c2).print();\n    return 0;\n}` },
  // ── C++ Expert ──
  { title: "File Handling + Exceptions", filename: "file_exc.cpp", lang: "C++", level: "expert",
    code: `#include <iostream>\n#include <fstream>\n#include <stdexcept>\nusing namespace std;\n\nvoid readFile(const string& f) {\n    ifstream file(f);\n    if (!file.is_open()) throw runtime_error("Cannot open: " + f);\n    string line;\n    while (getline(file, line)) cout << line << "\\n";\n}\n\nint main() {\n    try { readFile("data.txt"); }\n    catch (const exception& e) { cerr << "Error: " << e.what() << endl; }\n    return 0;\n}` },
  { title: "Template Stack", filename: "template_stack.cpp", lang: "C++", level: "expert",
    code: `#include <iostream>\n#include <vector>\nusing namespace std;\n\ntemplate<typename T>\nclass Stack {\n    vector<T> v;\npublic:\n    void push(T x) { v.push_back(x); }\n    void pop()  { if (!v.empty()) v.pop_back(); }\n    T top()     { return v.back(); }\n    bool empty(){ return v.empty(); }\n};\n\nint main() {\n    Stack<int> s;\n    s.push(10); s.push(20); s.push(30);\n    while (!s.empty()) { cout << s.top() << " "; s.pop(); }\n    cout << endl;\n    return 0;\n}` },
  // ── Python Basic ──
  { title: "Hello World", filename: "hello.py", lang: "Python", level: "basic",
    code: `print("Hello, World!")` },
  { title: "Palindrome Check", filename: "palindrome.py", lang: "Python", level: "basic",
    code: `def is_palindrome(s):\n    s = s.lower().replace(" ", "")\n    return s == s[::-1]\n\nword = "Madam"\nprint(f"{word} is{'' if is_palindrome(word) else ' not'} a Palindrome")` },
  { title: "Anagram Checker", filename: "anagram.py", lang: "Python", level: "basic",
    code: `def is_anagram(a, b):\n    return sorted(a.lower()) == sorted(b.lower())\n\nprint(is_anagram("listen", "silent"))  # True\nprint(is_anagram("hello", "world"))   # False` },
  { title: "List Operations", filename: "lists.py", lang: "Python", level: "basic",
    code: `numbers = [1, 2, 3, 4, 5]\nprint("Sum:", sum(numbers))\nprint("Average:", sum(numbers) / len(numbers))\nsquares = [x**2 for x in numbers]\nprint("Squares:", squares)` },
  // ── Python Advanced ──
  { title: "List Comprehension", filename: "list_comp.py", lang: "Python", level: "advanced",
    code: `# Squares of even numbers\nnumbers = range(1, 21)\nsquares_of_evens = [n**2 for n in numbers if n % 2 == 0]\nprint("Even squares:", squares_of_evens)\n\n# Matrix flatten\nmatrix = [[1,2,3],[4,5,6],[7,8,9]]\nflat = [x for row in matrix for x in row]\nprint("Flattened:", flat)` },
  { title: "Dictionary Frequency", filename: "freq.py", lang: "Python", level: "advanced",
    code: `def word_freq(text):\n    freq = {}\n    for w in text.lower().split():\n        freq[w] = freq.get(w, 0) + 1\n    return freq\n\ntext = "the quick brown fox jumps over the lazy dog the fox"\nfor w, c in sorted(word_freq(text).items(), key=lambda x: -x[1]):\n    print(f"{w}: {c}")` },
  { title: "File I/O", filename: "file_io.py", lang: "Python", level: "advanced",
    code: `# Write then read a file\nwith open("example.txt", "w") as f:\n    f.write("Hello from Python!\\nLine 2\\nLine 3")\n\nwith open("example.txt", "r") as f:\n    for i, line in enumerate(f, 1):\n        print(f"Line {i}: {line.rstrip()}")` },
  // ── Python Expert ──
  { title: "NumPy Statistics", filename: "numpy_stats.py", lang: "Python", level: "expert",
    code: `import numpy as np\n\ndata = np.array([23, 45, 12, 67, 34, 89, 56, 41, 78, 29])\n\nprint(f"Mean:   {np.mean(data):.2f}")\nprint(f"Median: {np.median(data):.2f}")\nprint(f"Std:    {np.std(data):.2f}")\nprint(f"Min:    {np.min(data)}")\nprint(f"Max:    {np.max(data)}")\n\n# Normalize\nnorm = (data - np.min(data)) / (np.max(data) - np.min(data))\nprint("Normalized:", np.round(norm, 2))`,
    colab: "https://colab.research.google.com/drive/sample" },
  { title: "Pandas Data Analysis", filename: "pandas_analysis.py", lang: "Python", level: "expert",
    code: `import pandas as pd\n\ndata = {\n    "Name": ["Alice", "Bob", "Charlie", "Diana", "Eve"],\n    "Age": [25, 30, 35, 28, 22],\n    "Score": [85, 90, 78, 92, 88],\n    "Grade": ["B", "A", "C", "A", "B"]\n}\n\ndf = pd.DataFrame(data)\nprint(df)\nprint("\\nAverage Score:", df["Score"].mean())\nprint("Top scorers:\\n", df[df["Score"] >= 88][["Name","Score"]])`,
    colab: "https://colab.research.google.com/drive/sample" }
];


// ═══════════════════════════════════════════════════════════════════════════════
//  STANDALONE COMPILER  (section #compiler in index.html)
// ═══════════════════════════════════════════════════════════════════════════════
async function runCompiler() {
  const code   = document.getElementById("compilerCode")?.value || "";
  const lang   = document.getElementById("compilerLang")?.value || "C";
  const output = document.getElementById("compilerOutput");
  const btn    = document.getElementById("compilerRunBtn");

  if (!output || !btn) return;

  const langId = LANG_IDS[lang];
  if (!langId) { output.textContent = "⚠️ Language not supported."; return; }

  btn.disabled    = true;
  btn.textContent = "⏳ Running…";
  output.textContent = "⏳ Compiling & executing…";

  try {
    const result = await judge0Run(code, langId);
    const stdout = result.stdout  || "";
    const stderr = result.stderr  || result.compile_output || "";
    const status = result.status?.description || "Unknown";

    if (status === "Accepted" || stdout) {
      output.textContent = `▶ Output (${status}):\n${stdout || "(no output)"}`;
      output.style.color = "#3fb950";
    } else {
      output.textContent = `❌ ${status}\n${stderr || "Unknown error"}`;
      output.style.color = "#ff7b72";
    }
  } catch (err) {
    output.textContent = `⚠️ Compiler API error: ${err.message}`;
    output.style.color = "#f87171";
  }

  btn.disabled    = false;
  btn.textContent = "▶ Run";
}

function clearCompiler() {
  const ta = document.getElementById("compilerCode");
  const out = document.getElementById("compilerOutput");
  if (ta)  ta.value = "";
  if (out) { out.textContent = "Output will appear here after you click ▶ Run…"; out.style.color = ""; }
}

// Tab key inserts spaces in compiler textarea
document.addEventListener("DOMContentLoaded", () => {
  const ta = document.getElementById("compilerCode");
  if (!ta) return;
  ta.addEventListener("keydown", e => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.substring(0, s) + "    " + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = s + 4;
    }
  });
});
