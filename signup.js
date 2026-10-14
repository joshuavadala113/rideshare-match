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
const emailInput = document.getElementById("email");
const emailTag = document.getElementById("emailTag");
const passwordInput = document.getElementById("password");
const passTag = document.getElementById("passTag");

let campus = "UNT";
let plan = "both";

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

// ---- Chips and plan buttons ----

function wireChoice(containerId, itemClass, onPick) {
  const container = document.getElementById(containerId);
  container.addEventListener("click", (event) => {
    const button = event.target.closest("." + itemClass);
    if (!button) return;
    container.querySelectorAll("." + itemClass).forEach((b) => b.classList.remove("selected"));
    button.classList.add("selected");
    onPick(button.dataset.value);
  });
}

wireChoice("campusChips", "chip", (value) => { campus = value; });
wireChoice("planChoice", "seg", (value) => { plan = value; });

// ---- Show / hide password ----

document.querySelectorAll(".toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Show" : "Hide";
  });
});

// ---- Live hints ----

emailInput.addEventListener("input", () => {
  const email = emailInput.value.trim().toLowerCase();
  if (isValidEmailShape(email) && isEligibleEmail(email)) {
    emailTag.textContent = "Eligible email";
    emailTag.className = "tag ok";
  } else {
    emailTag.textContent = "";
  }
});

passwordInput.addEventListener("input", () => {
  const length = passwordInput.value.length;
  if (length === 0) {
    passTag.textContent = "";
  } else if (length < 8) {
    passTag.textContent = "Too short";
  } else if (length < 12) {
    passTag.textContent = "Okay";
  } else {
    passTag.textContent = "Strong";
  }
});

// ---- Submit ----

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirm = document.getElementById("confirm").value;
  const agreed = document.getElementById("terms").checked;

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

  if (!agreed) {
    showError("Please agree to the terms to continue.");
    return;
  }

  // NOTE: storing a plain password is only OK because this is a class demo
  // with no server. A real app would never do this.
  const user = {
    id: newId("u"),
    name,
    email,
    campus,
    plan,
    password,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  addItem("users", user);
  setCurrentUser({ id: user.id, name: user.name, email: user.email, campus, plan });

  window.location.href = "dashboard.html";
});
