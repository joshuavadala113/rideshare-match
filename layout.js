// layout.js
// Builds the header and nav bar so every page looks the same.
// To add a page to the menu, add one line to NAV_LINKS.

const NAV_LINKS = [
  { label: "Home", href: "index.html" },
];

function buildHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const current = location.pathname.split("/").pop() || "index.html";

  const title = document.createElement("div");
  title.className = "brand";
  const h1 = document.createElement("h1");
  h1.textContent = "Rideshare Match";
  const tagline = document.createElement("p");
  tagline.textContent = "Find a ride. Share the journey.";
  title.append(h1, tagline);

  const nav = document.createElement("nav");
  NAV_LINKS.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    if (link.href === current) a.className = "active";
    nav.appendChild(a);
  });

  // Right side of the nav: who is logged in
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (user) {
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = user.name || user.email;

    const logout = document.createElement("a");
    logout.href = "index.html";
    logout.textContent = "Log out";
    logout.addEventListener("click", () => clearCurrentUser());

    nav.append(who, logout);
  }

  header.replaceChildren(title, nav);
}

function buildFooter() {
  const footer = document.getElementById("siteFooter");
  if (!footer) return;
  footer.textContent = "Rideshare Match - CSCE 3444 Student Project";
}

buildHeader();
buildFooter();
