const KEY = "admission_portal_students";
const form = document.getElementById("form");
const rows = document.getElementById("rows");
const totalEl = document.getElementById("total");
const emptyEl = document.getElementById("empty");
const statusEl = document.getElementById("status");
const fields = ["name", "matric", "email", "phone", "age", "department", "password", "confirm"];

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    return false;
  }
  return true;
}

let students = load();

const rules = {
  name(v, list) {
    if (!v) return "Enter the student's full name.";
    if (v.length < 3) return "Name must be at least 3 characters.";
    if (!/^[A-Za-z][A-Za-z' -]*$/.test(v)) return "Use letters, spaces, hyphens and apostrophes only.";
    if (v.trim().split(/\s+/).length < 2) return "Enter at least a first name and a surname.";
    return "";
  },
  matric(v, list) {
    if (!v) return "Enter a matriculation number.";
    if (!/^[A-Z0-9]{2,6}\/[A-Z0-9]{3,8}$/i.test(v)) return "Use the format 2024/12345 (letters or digits, one slash).";
    if (list.some(s => s.matric.toLowerCase() === v.toLowerCase())) return "This matriculation number is already registered.";
    return "";
  },
  email(v, list) {
    if (!v) return "Enter an email address.";
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return "Enter a valid email like name@example.com.";
    if (list.some(s => s.email.toLowerCase() === v.toLowerCase())) return "This email address is already registered.";
    return "";
  },
  phone(v) {
    if (!v) return "Enter a phone number.";
    const clean = v.replace(/[\s-]/g, "");
    if (!/^(\+234|0)[789][01]\d{8}$/.test(clean)) return "Use a Nigerian number like 08012345678 or +2348012345678.";
    return "";
  },
  age(v) {
    if (v === "") return "Enter the student's age.";
    if (!/^\d+$/.test(v)) return "Age must be a whole number.";
    const n = Number(v);
    if (n < 16) return "Applicants must be at least 16 years old.";
    if (n > 60) return "Age cannot be above 60.";
    return "";
  },
  department(v) {
    return v ? "" : "Select a department.";
  },
  password(v) {
    if (!v) return "Create a password.";
    if (v.length < 8) return "Password must be at least 8 characters.";
    if (!/[a-z]/.test(v)) return "Add at least one lowercase letter.";
    if (!/[A-Z]/.test(v)) return "Add at least one uppercase letter.";
    if (!/\d/.test(v)) return "Add at least one number.";
    if (!/[^A-Za-z0-9]/.test(v)) return "Add at least one special character.";
    return "";
  },
  confirm(v, list, all) {
    if (!v) return "Re-enter the password to confirm it.";
    if (v !== all.password) return "Passwords do not match.";
    return "";
  }
};

function values() {
  const out = {};
  fields.forEach(f => {
    const el = form.elements[f];
    out[f] = f === "password" || f === "confirm" ? el.value : el.value.trim();
  });
  return out;
}

function showError(field, message) {
  const input = form.elements[field];
  document.getElementById("err-" + field).textContent = message;
  input.classList.toggle("invalid", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validateField(field) {
  const all = values();
  const message = rules[field](all[field], students, all);
  showError(field, message);
  return message === "";
}

function validateAll() {
  let ok = true;
  let firstBad = null;
  fields.forEach(f => {
    if (!validateField(f)) {
      ok = false;
      if (!firstBad) firstBad = f;
    }
  });
  if (firstBad) form.elements[firstBad].focus();
  return ok;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function render() {
  totalEl.textContent = students.length;
  emptyEl.style.display = students.length ? "none" : "block";
  rows.innerHTML = students.map((s, i) =>
    "<tr>" +
    "<td>" + (i + 1) + "</td>" +
    "<td>" + escapeHtml(s.name) + "</td>" +
    "<td>" + escapeHtml(s.matric) + "</td>" +
    "<td>" + escapeHtml(s.email) + "</td>" +
    "<td>" + escapeHtml(s.phone) + "</td>" +
    "<td>" + escapeHtml(s.age) + "</td>" +
    "<td>" + escapeHtml(s.department) + "</td>" +
    "<td>" + escapeHtml(s.date) + "</td>" +
    '<td class="btn"><button type="button" class="remove" data-id="' + escapeHtml(s.id) + '">Remove</button></td>' +
    "</tr>"
  ).join("");
}

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || "";
}

fields.forEach(f => {
  const el = form.elements[f];
  el.addEventListener("blur", () => {
    if (el.value !== "") validateField(f);
  });
  el.addEventListener("input", () => {
    if (el.classList.contains("invalid")) validateField(f);
    if (f === "password" && form.elements.confirm.value) validateField("confirm");
    setStatus("");
  });
});

form.addEventListener("submit", e => {
  e.preventDefault();
  setStatus("");
  if (!validateAll()) {
    setStatus("Fix the highlighted fields and try again.", "bad");
    return;
  }
  const v = values();
  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: v.name.replace(/\s+/g, " "),
    matric: v.matric.toUpperCase(),
    email: v.email.toLowerCase(),
    phone: v.phone.replace(/[\s-]/g, ""),
    age: Number(v.age),
    department: v.department,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  };
  const next = students.concat(record);
  if (!save(next)) {
    setStatus("Could not save. Browser storage is unavailable.", "bad");
    return;
  }
  students = next;
  form.reset();
  fields.forEach(f => showError(f, ""));
  render();
  setStatus(record.name + " has been registered.", "ok");
});

rows.addEventListener("click", e => {
  const btn = e.target.closest(".remove");
  if (!btn) return;
  const next = students.filter(s => s.id !== btn.dataset.id);
  if (save(next)) {
    students = next;
    render();
    setStatus("Student removed.", "ok");
  }
});

render();
