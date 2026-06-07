/* =============================================
   script.js  —  ISS Live Tracker
   =============================================

   HOW THE API CALL WORKS (beginner guide):
   -----------------------------------------
   An API is a URL you can ask a question to and
   get structured data (JSON) back.

   We use: https://api.wheretheiss.at/v1/satellites/25544
   25544 is the ISS's official NORAD tracking ID.

   `fetch(url)` is the browser's built-in function
   for making those requests. It returns a Promise —
   meaning the result arrives LATER (over the internet).

   `async/await` lets us wait for that result without
   freezing the page. Think of it like:
     "Go get this data, then come back and continue."
   ============================================= */

// ─── Config ────────────────────────────────────────
const ISS_API      = 'https://api.wheretheiss.at/v1/satellites/25544';
const GEO_API_BASE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const UPDATE_EVERY = 5; // seconds between ISS position refreshes

// ─── State ─────────────────────────────────────────
let countdown = UPDATE_EVERY;

// ─── DOM refs ───────────────────────────────────────
const elLat       = document.getElementById('lat');
const elLon       = document.getElementById('lon');
const elAlt       = document.getElementById('alt');
const elVel       = document.getElementById('vel');
const elLocation  = document.getElementById('location-text');
const elCountdown = document.getElementById('countdown-label');
const elError     = document.getElementById('error-banner');

// ─── Helpers ────────────────────────────────────────

/**
 * Converts a decimal degree value to a cardinal direction string.
 * e.g. formatCoord(43.25, 'N', 'S')  →  "43.2500° N"
 */
function formatCoord(val, posDir, negDir) {
  const dir = val >= 0 ? posDir : negDir;
  return `${Math.abs(val).toFixed(4)}° ${dir}`;
}

/**
 * Briefly flashes an element's value in cyan to signal it updated.
 * Adds a CSS class, then removes it after 700ms.
 */
function flashValue(el) {
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 700);
}

// ─── Reverse geocoding ──────────────────────────────

/**
 * Given a lat/lon, asks bigdatacloud for a human-readable
 * place name (country, region, ocean, etc.).
 * Returns a string like "Pacific Ocean" or "Kansas, United States".
 */
async function getLocationName(lat, lon) {
  try {
    const url = `${GEO_API_BASE}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res  = await fetch(url);
    const data = await res.json();

    const parts = [];
    if (data.locality)              parts.push(data.locality);
    if (data.principalSubdivision)  parts.push(data.principalSubdivision);
    if (data.countryName)           parts.push(data.countryName);

    if (parts.length > 0) return parts.join(', ');
    if (data.ocean)        return '🌊 ' + data.ocean;
    return 'Open Ocean / Remote Region';
  } catch {
    return 'Location data unavailable';
  }
}

// ─── Main fetch ─────────────────────────────────────

/**
 * Fetches the current ISS position from the API and updates the UI.
 *
 * Step by step:
 *   1. fetch(url)        — send the HTTP request
 *   2. response.json()   — parse the JSON text into a JS object
 *   3. read data fields  — latitude, longitude, altitude, velocity
 *   4. update the DOM    — write values into the page elements
 */
async function updateISS() {
  try {
    // 1. Request the data
    const response = await fetch(ISS_API);

    // 2. Convert the response body to a JS object
    //    It looks like: { latitude: 43.25, longitude: -97.34, altitude: 408, velocity: 27600, ... }
    const data = await response.json();

    // 3. Extract the values we care about
    const lat = data.latitude;    // decimal degrees, positive = North
    const lon = data.longitude;   // decimal degrees, positive = East
    const alt = data.altitude;    // kilometres above Earth
    const vel = data.velocity;    // km/h

    // 4. Update the display
    elLat.textContent = formatCoord(lat, 'N', 'S');
    elLon.textContent = formatCoord(lon, 'E', 'W');
    elAlt.textContent = alt.toFixed(1);
    elVel.textContent = Math.round(vel).toLocaleString();

    // Flash each value to show it just refreshed
    [elLat, elLon, elAlt, elVel].forEach(flashValue);

    // Fetch a human-readable place name in the background
    // (we don't await it so the rest of the UI doesn't wait)
    getLocationName(lat, lon).then(name => {
      elLocation.textContent = name;
    });

    // Hide any previous error message
    elError.style.display = 'none';

  } catch (err) {
    // If the fetch failed (no internet, API down, etc.) show a message
    elError.style.display = 'block';
    console.error('ISS API error:', err);
  }
}

// ─── Countdown timer ────────────────────────────────

/**
 * Runs every second.
 * Counts down from UPDATE_EVERY to 0, then triggers a fresh fetch
 * and resets the counter.
 */
function tick() {
  elCountdown.textContent = `UPDATING IN ${countdown}s`;

  if (countdown <= 0) {
    countdown = UPDATE_EVERY;
    updateISS();
  } else {
    countdown--;
  }
}

// ─── Boot ───────────────────────────────────────────
updateISS();               // Fetch immediately on page load
setInterval(tick, 1000);   // Then tick every second
