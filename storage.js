// storage.js
// One place that reads and writes all the app's data.
// We use localStorage as our "database" since there is no server.

const DB_KEYS = {
  users: "rsm_users",
  currentUser: "rsm_currentUser",
  commutes: "rsm_commutes",
  matches: "rsm_matches",
  messages: "rsm_messages",
  confirmations: "rsm_confirmations",
  reviews: "rsm_reviews",
  reports: "rsm_reports",
  notifications: "rsm_notifications",
};

function dbRead(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null || value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

function dbWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Makes a simple unique id like "u_k3j9x2"
function newId(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 8);
}

// ---- Lists (users, commutes, messages, and so on) ----

function getAll(name) {
  return dbRead(DB_KEYS[name], []);
}

function addItem(name, item) {
  const list = getAll(name);
  list.push(item);
  dbWrite(DB_KEYS[name], list);
  return item;
}

function updateItem(name, id, changes) {
  const list = getAll(name);
  const i = list.findIndex((x) => x.id === id);
  if (i === -1) return null;
  list[i] = { ...list[i], ...changes };
  dbWrite(DB_KEYS[name], list);
  return list[i];
}

function findItems(name, test) {
  return getAll(name).filter(test);
}

// ---- Logged-in user ----

function getCurrentUser() {
  return dbRead(DB_KEYS.currentUser, null);
}

function setCurrentUser(user) {
  dbWrite(DB_KEYS.currentUser, user);
}

function clearCurrentUser() {
  localStorage.removeItem(DB_KEYS.currentUser);
}
