// matching.js
// FR-5: decides who can match and how well.
// No page code in here, just functions that take commutes and return scores.

// Places we know about. Any text that contains one of these words counts as that area.
const AREA_WORDS = {
  denton: ["unt", "denton", "university of north texas"],
  richardson: ["ut dallas", "utd", "richardson", "ut-dallas"],
  universitypark: ["smu", "university park", "southern methodist"],
  lewisville: ["lewisville"],
  plano: ["plano"],
  frisco: ["frisco"],
  mckinney: ["mckinney"],
  arlington: ["uta", "arlington", "ut arlington"],
  dallas: ["dallas college", "downtown dallas", "dallas"],
};

// Longest words first, so "ut dallas" wins over "dallas".
const AREA_LOOKUP = [];
Object.keys(AREA_WORDS).forEach((area) => {
  AREA_WORDS[area].forEach((word) => AREA_LOOKUP.push({ area, word }));
});
AREA_LOOKUP.sort((a, b) => b.word.length - a.word.length);

function areaOf(text) {
  const t = " " + String(text || "").toLowerCase().trim() + " ";
  const hit = AREA_LOOKUP.find((entry) => t.includes(" " + entry.word + " ") || t.includes(entry.word + ","));
  if (hit) return hit.area;
  const loose = AREA_LOOKUP.find((entry) => t.includes(entry.word));
  return loose ? loose.area : null;
}

function samePlace(a, b) {
  const areaA = areaOf(a);
  const areaB = areaOf(b);
  if (areaA && areaB) return areaA === areaB;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function minutesOf(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Gas and toll estimate per mile (same number used on the Post Ride page)
const MATCH_COST_PER_MILE = 0.25;

// Price one rider pays for the driver's commute
function pricePerRide(driverCommute) {
  return (driverCommute.miles * MATCH_COST_PER_MILE) / (driverCommute.seats + 1);
}

// Score one other commute against mine.
// Returns null when they can't match, or { score, detour, price, ... } when they can.
//   destination 30 + pickup 25 + days 20 + time 15 + seats 10 = 100
function scoreMatch(mine, theirs) {
  // Drivers match riders and riders match drivers
  if (mine.type === theirs.type) return null;

  // Must be going to the same place
  if (!samePlace(mine.to, theirs.to)) return null;

  // Must share at least one day
  const sharedDays = mine.days.filter((d) => theirs.days.includes(d));
  if (sharedDays.length === 0) return null;

  // The driver needs enough seats for the rider
  const driver = mine.type === "offer" ? mine : theirs;
  const rider = mine.type === "offer" ? theirs : mine;
  if (driver.seats < rider.seats) return null;

  const destinationScore = 30;
  const pickupClose = samePlace(mine.from, theirs.from);
  const pickupScore = pickupClose ? 25 : 0;
  const dayScore = Math.round((sharedDays.length / mine.days.length) * 20);

  const gap = Math.abs(minutesOf(mine.departTime) - minutesOf(theirs.departTime));
  let timeScore = 0;
  if (gap <= 10) timeScore = 15;
  else if (gap <= 20) timeScore = 12;
  else if (gap <= 30) timeScore = 9;
  else if (gap <= 60) timeScore = 4;

  const seatScore = 10;

  return {
    score: destinationScore + pickupScore + dayScore + timeScore + seatScore,
    sharedDays,
    timeGap: gap,
    detour: pickupClose ? 0.4 : 2.5,
    price: pricePerRide(driver),
  };
}

// Rank every candidate for my commute, best first. Weak matches (under 40) are dropped.
function findMatches(mine, candidates) {
  const results = [];
  candidates.forEach((theirs) => {
    const result = scoreMatch(mine, theirs);
    if (result && result.score >= 40) {
      results.push({ commute: theirs, ...result });
    }
  });
  results.sort((a, b) => b.score - a.score);
  return results;
}
