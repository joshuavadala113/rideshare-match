// login.js
// FR-2: sign in and keep the user logged in.

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("message");

function showMessage(text, kind) {
  loginMessage.className = kind || "error";
  loginMessage.textContent = text;
}

ensureAdmin();

// Already logged in? Skip this page.
if (getCurrentUser()) {
  window.location.href = "dashboard.html";
}

// ---- Show / hide password ----

document.querySelectorAll(".toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Show" : "Hide";
  });
});

// ---- Parts we build later ----

document.getElementById("forgot").addEventListener("click", (event) => {
  event.preventDefault();
  showMessage("Password reset isn't available in this demo yet.", "error");
});

document.getElementById("googleSso").addEventListener("click", () => {
  showMessage("Google Workspace sign-in is coming soon.", "error");
});

document.getElementById("oktaSso").addEventListener("click", () => {
  showMessage("Okta Campus ID sign-in is coming soon.", "error");
});

// ---- Submit ----

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMessage("Enter your email and password.");
    return;
  }

  const user = findItems("users", (u) => u.email === email)[0];

  // Same message for "no account" and "wrong password" so we don't reveal which emails exist.
  if (!user || user.password !== password) {
    showMessage("That email and password don't match.");
    return;
  }

  if (user.status && user.status !== "active") {
    showMessage("This account has been suspended.");
    return;
  }

  setCurrentUser({
    id: user.id,
    name: user.name,
    email: user.email,
    campus: user.campus,
    plan: user.plan,
    role: user.role,
  });

  window.location.href = "dashboard.html";
});
