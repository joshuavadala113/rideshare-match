// sso.js
// FR-15: simulated single sign-on (Google Workspace and Okta Campus ID).
// A real SSO needs a server and an approved app with Google or Okta.
// Here a pop-up pretends to be the school login. Nothing is sent anywhere.

const SSO_BLOCKED = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "aol.com", "proton.me"];

// Guess the campus from the email ending
const SSO_CAMPUS = [
  ["unt.edu", "UNT"],
  ["utdallas.edu", "UT Dallas"],
  ["smu.edu", "SMU"],
  ["dallascollege.edu", "Dallas College"],
];

function ssoCampus(domain) {
  const hit = SSO_CAMPUS.find(([ending]) => domain === ending || domain.endsWith("." + ending));
  return hit ? hit[1] : "Workplace";
}

function ssoName(email) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function ssoEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Opens the pop-up. onDone(error) is called with an error text, or nothing when the user is signed in.
function startSso(provider, onDone) {
  const overlay = ssoEl("div", "sheet");
  const body = ssoEl("div", "sheet-body");
  overlay.appendChild(body);

  const head = ssoEl("div", "label-row");
  head.appendChild(ssoEl("h3", "", provider === "google" ? "Google Workspace" : "Okta Campus ID"));
  const close = ssoEl("button", "chip", "Cancel");
  close.type = "button";
  close.style.margin = "0";
  head.appendChild(close);
  body.appendChild(head);

  body.appendChild(ssoEl("p", "fine", "Simulated sign-in for the class demo. Nothing is sent to Google or Okta, and no password is asked."));

  const label = ssoEl("label", "", "School or work email");
  label.setAttribute("for", "ssoEmail");
  const input = ssoEl("input");
  input.id = "ssoEmail";
  input.type = "email";
  input.placeholder = "name@my.unt.edu";
  input.autocomplete = "email";
  const msg = ssoEl("p", "error");
  msg.setAttribute("role", "status");
  const go = ssoEl("button", "", "Continue");
  go.type = "button";
  body.append(label, input, msg, go);

  document.body.appendChild(overlay);
  input.focus();

  function closeIt() {
    overlay.remove();
  }
  close.addEventListener("click", closeIt);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeIt(); });

  function submit() {
    const email = input.value.trim().toLowerCase();
    const parts = email.split("@");
    if (parts.length !== 2 || !parts[0] || !parts[1].includes(".")) {
      msg.textContent = "Enter a full email like name@my.unt.edu.";
      return;
    }
    const domain = parts[1];
    if (SSO_BLOCKED.includes(domain)) {
      msg.textContent = "Use a school or work email. Personal emails like " + domain + " can't use single sign-on.";
      return;
    }

    msg.className = "success";
    msg.textContent = "Contacting " + (provider === "google" ? "Google" : "Okta") + " (simulated)...";
    go.disabled = true;

    setTimeout(() => {
      let user = findItems("users", (u) => u.email === email)[0];

      if (user && user.status === "suspended") {
        closeIt();
        onDone("This account has been suspended.");
        return;
      }

      if (!user) {
        user = {
          id: newId("u"),
          name: ssoName(email),
          email,
          campus: ssoCampus(domain),
          plan: "both",
          password: null,
          sso: provider,
          status: "active",
          createdAt: new Date().toISOString(),
        };
        addItem("users", user);
      }

      setCurrentUser({ id: user.id, name: user.name, email: user.email, campus: user.campus, plan: user.plan, role: user.role });
      window.location.href = "dashboard.html";
    }, 900);
  }

  go.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
}
