// layout.js
// Builds the top bar and footer so every page looks the same.
// To add a page to the menu, add one line to NAV_LINKS.

// Always shown
const NAV_LINKS = [
  { label: "Rides", href: "rides.html" },
];

// Only shown when nobody is logged in
const LOGGED_OUT_LINKS = [
  { label: "Log in", href: "login.html" },
  { label: "Sign up", href: "signup.html" },
];

function makeLink(link, current) {
  const a = document.createElement("a");
  a.href = link.href;
  a.textContent = link.label;
  if (link.href === current) a.className = "active";
  return a;
}

function buildHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const current = location.pathname.split("/").pop() || "index.html";

  const bar = document.createElement("div");
  bar.className = "topbar";

  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = "index.html";
  const logo = document.createElement("img");
  logo.src = "logo.png";
  logo.alt = "";
  const name = document.createElement("span");
  name.textContent = "RideShare Match";
  brand.append(logo, name);

  const nav = document.createElement("nav");
  NAV_LINKS.forEach((link) => nav.appendChild(makeLink(link, current)));

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
  } else {
    LOGGED_OUT_LINKS.forEach((link) => nav.appendChild(makeLink(link, current)));
  }

  bar.append(brand, nav);
  header.replaceChildren(bar);
}

function buildFooter() {
  const footer = document.getElementById("siteFooter");
  if (!footer) return;
  footer.textContent = "RideShare Match - CSCE 3444 Student Project";
}

buildHeader();
buildFooter();
