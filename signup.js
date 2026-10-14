// signup.js
// FR-1: sign-up form, eligible email check, duplicate account check.

// Personal email providers we do NOT accept. Add more here if needed.
const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
];

const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("message");

function showError(text) {
  signupMessage.className = "error";
  signupMessage.textContent = text;
}

function isValidEmailShape(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isEligibleEmail(email) {
  const domain = email.split("@")[1];
  return !BLOCKED_EMAIL_DOMAINS.includes(domain);
}

function emailAlreadyUsed(email) {
  return findItems("users", (u) => u.email === email).length > 0;
}

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const role = document.getElementById("role").value;
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  if (!name || !email || !password || !confirm) {
    showError("Please fill in every field.");
    return;
  }

  if (!isValidEmailShape(email)) {
    showError("That email doesn't look right. Check it and try again.");
    return;
  }

  if (!isEligibleEmail(email)) {
    showError("Please use your school or work email, not a personal one.");
    return;
  }

  if (emailAlreadyUsed(email)) {
    showError("An account with that email already exists. Try logging in.");
    return;
  }

  if (password.length < 8) {
    showError("Your password needs at least 8 characters.");
    return;
  }

  if (password !== confirm) {
    showError("The two passwords don't match.");
    return;
  }

  // NOTE: storing a plain password is only OK because this is a class demo
  // with no server. A real app would never do this.
  const user = {
    id: newId("u"),
    name,
    email,
    role,
    password,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  addItem("users", user);
  setCurrentUser({ id: user.id, name: user.name, email: user.email, role: user.role });

  window.location.href = "index.html";
});
