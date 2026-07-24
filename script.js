const ISS_API = "https://api.wheretheiss.at/v1/satellites/25544";
const GEO_API = "https://api.bigdatacloud.net/data/reverse-geocode-client";

const UPDATE_INTERVAL = 5;

let countdown = UPDATE_INTERVAL;

const latEl = document.getElementById("lat");
const lonEl = document.getElementById("lon");
const altEl = document.getElementById("alt");
const velEl = document.getElementById("vel");
const locationEl = document.getElementById("location-text");
const countdownEl = document.getElementById("countdown-label");
const errorBanner = document.getElementById("error-banner");

function formatCoordinate(value, positive, negative) {
    return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}

function flash(element) {
    element.classList.add("flash");

    setTimeout(() => {
        element.classList.remove("flash");
    }, 500);
}

async function reverseGeocode(lat, lon) {

    try {

        const response = await fetch(
            `${GEO_API}?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );

        if (!response.ok)
            throw new Error();

        const data = await response.json();

        const parts = [];

        if (data.locality) parts.push(data.locality);
        if (data.principalSubdivision) parts.push(data.principalSubdivision);
        if (data.countryName) parts.push(data.countryName);

        if (parts.length)
            return parts.join(", ");

        if (data.ocean)
            return data.ocean;

        return "Remote Region";

    } catch {

        return "Location unavailable";

    }

}

async function updateISS() {

    try {

        const response = await fetch(ISS_API);

        if (!response.ok)
            throw new Error(`HTTP ${response.status}`);

        const iss = await response.json();

        latEl.textContent = formatCoordinate(iss.latitude, "N", "S");
        lonEl.textContent = formatCoordinate(iss.longitude, "E", "W");
        altEl.textContent = `${iss.altitude.toFixed(1)}`;
        velEl.textContent = Math.round(iss.velocity).toLocaleString();

        flash(latEl);
        flash(lonEl);
        flash(altEl);
        flash(velEl);

        locationEl.textContent = await reverseGeocode(
            iss.latitude,
            iss.longitude
        );

        errorBanner.style.display = "none";

    } catch (err) {

        errorBanner.style.display = "block";
        console.error(err);

    }

}

function updateCountdown() {

    countdownEl.textContent = `Next update in ${countdown}s`;

    if (countdown === 0) {

        countdown = UPDATE_INTERVAL;
        updateISS();

    } else {

        countdown--;

    }

}

updateISS();
setInterval(updateCountdown, 1000);
