// layout.js
// Builds the top bar, the bottom tab bar and the footer so every page looks the same.
// To add a page to the app menu, add one line to APP_TABS.

// Shown when someone is logged in (matches the bottom bar in our Figma design)
const APP_TABS = [
  { label: "Explore", href: "dashboard.html", icon: "compass" },
  { label: "Post Ride", href: "postride.html", icon: "plus" },
  { label: "Matches", href: "matches.html", icon: "people" },
  { label: "Messages", href: "messages.html", icon: "chat" },
];

// Shown when nobody is logged in
const LOGGED_OUT_LINKS = [
  { label: "Log in", href: "login.html" },
  { label: "Sign up", href: "signup.html" },
];

const ICONS = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  people: '<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M15 15.5c3-.5 5.5 1 5.5 3.5"/>',
  chat: '<path d="M5 5h14a1 1 0 011 1v9a1 1 0 01-1 1H10l-4 3v-3H5a1 1 0 01-1-1V6a1 1 0 011-1z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

function makeIcon(name) {
  const span = document.createElement("span");
  span.className = "icon";
  // Constant strings from ICONS above, never user input
  span.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg>";
  return span;
}

function makeLink(link, current, withIcon) {
  const a = document.createElement("a");
  a.href = link.href;
  if (withIcon && link.icon) a.appendChild(makeIcon(link.icon));
  const text = document.createElement("span");
  text.textContent = link.label;
  a.appendChild(text);
  if (link.href === current) a.className = "active";
  return a;
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function buildHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const current = location.pathname.split("/").pop() || "index.html";
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  const bar = document.createElement("div");
  bar.className = "topbar";

  const brand = document.createElement("a");
  brand.className = "brand";
  brand.href = user ? "dashboard.html" : "index.html";
  const logo = document.createElement("img");
  logo.src = "logo.png";
  logo.alt = "";
  const name = document.createElement("span");
  name.textContent = "RideShare Match";
  brand.append(logo, name);

  const nav = document.createElement("nav");
  nav.className = "topnav";

  if (user) {
    APP_TABS.forEach((tab) => nav.appendChild(makeLink(tab, current, false)));

    const logout = document.createElement("a");
    logout.href = "index.html";
    logout.textContent = "Log out";
    logout.addEventListener("click", () => clearCurrentUser());
    nav.appendChild(logout);

    const avatar = document.createElement("a");
    avatar.className = "avatar";
    avatar.href = "settings.html";
    avatar.title = "Settings & Profile";
    avatar.textContent = initials(user.name || user.email);
    nav.appendChild(avatar);

    buildTabBar(current);
  } else {
    LOGGED_OUT_LINKS.forEach((link) => nav.appendChild(makeLink(link, current, false)));
  }

  bar.append(brand, nav);
  header.replaceChildren(bar);
}

// Bottom tab bar, only visible on phones (see style.css)
function buildTabBar(current) {
  const tabbar = document.createElement("nav");
  tabbar.className = "tabbar";
  APP_TABS.forEach((tab) => tabbar.appendChild(makeLink(tab, current, true)));
  document.body.appendChild(tabbar);
  document.body.classList.add("has-tabbar");
}

function buildFooter() {
  const footer = document.getElementById("siteFooter");
  if (!footer) return;
  footer.textContent = "RideShare Match - CSCE 3444 Student Project";
}

buildHeader();
buildFooter();
