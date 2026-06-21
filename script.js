// =========================
// CONFIG (PUT YOUR KEYS)
// =========================
const OPENAI_KEY = "YOUR_OPENAI_API_KEY";
const JDOODLE_ID = "YOUR_ID";
const JDOODLE_SECRET = "YOUR_SECRET";

// =========================
// AI CHAT (FIXED)
// =========================
async function chat() {
  const msg = document.getElementById("msg")?.value || "";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENAI_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: msg }]
      })
    });
    const data = await res.json();
    document.getElementById("output").innerText =
      data.choices?.[0]?.message?.content || "AI error";
  } catch (err) {
    document.getElementById("output").innerText = err;
  }
}

// =========================
// ONLINE COMPILER (WORKING)
// =========================
async function runCode() {
  const code = document.getElementById("code")?.value || "";
  const lang = document.getElementById("lang")?.value || "python";

  let languageMap = {
    python: "python3",
    cpp: "cpp17",
    java: "java",
    javascript: "nodejs"
  };

  try {
    const res = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        clientId: JDOODLE_ID,
        clientSecret: JDOODLE_SECRET,
        script: code,
        language: languageMap[lang] || "python3",
        versionIndex: "0"
      })
    });
    const data = await res.json();
    document.getElementById("output").innerText =
      data.output || JSON.stringify(data);
  } catch (err) {
    document.getElementById("output").innerText = err;
  }
}

// =========================
// AUTH SYSTEM
// =========================
function register() {
  const u = document.getElementById("user")?.value;
  const p = document.getElementById("pass")?.value;
  if (!u || !p) return alert("Fill fields");
  localStorage.setItem("user_" + u, p);
  alert("Registered");
}

function login() {
  const u = document.getElementById("user")?.value;
  const p = document.getElementById("pass")?.value;
  if (localStorage.getItem("user_" + u) === p) {
    alert("Login success");
  } else {
    alert("Invalid login");
  }
}

// =========================
// ADMIN
// =========================
function showUsers() {
  let users = Object.keys(localStorage)
    .filter(k => k.startsWith("user_"))
    .map(k => k.replace("user_", ""));
  const el = document.getElementById("admin");
  if (el) el.innerText = users.join("\n") || "No users";
}

// =========================
// STORAGE
// =========================
function saveCode() {
  const code = document.getElementById("code")?.value || "";
  localStorage.setItem("project_code", code);
  alert("Saved");
}

function loadCode() {
  const el = document.getElementById("code");
  if (el) el.value = localStorage.getItem("project_code") || "";
}


// =========================
// SNIPPETS + PROJECTS FIX
// =========================
const snippets = {
  python: [
    {name: "Hello World", code: "print('Hello World')"},
    {name: "Factorial", code: "n=5\nf=1\nfor i in range(1,n+1): f*=i\nprint(f)"}
  ],
  javascript: [
    {name: "Hello JS", code: "console.log('Hello World')"},
  ],
  cpp: [
    {name: "Hello C++", code: "#include<iostream>\nusing namespace std;\nint main(){cout<<'Hello';}"}
  ]
};

function loadSnippets() {
  const lang = document.getElementById("lang")?.value || "python";
  const list = document.getElementById("snippets");
  if (!list) return;
  list.innerHTML = "";

  (snippets[lang] || []).forEach(s => {
    let btn = document.createElement("button");
    btn.innerText = s.name;
    btn.onclick = () => {
      document.getElementById("code").value = s.code;
    };
    list.appendChild(btn);
  });
}
