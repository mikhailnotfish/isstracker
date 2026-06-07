
const ISS_API      = 'https://api.wheretheiss.at/v1/satellites/25544';
const GEO_API_BASE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const UPDATE_EVERY = 5; // seconds between ISS position refreshes


let countdown = UPDATE_EVERY;


const elLat       = document.getElementById('lat');
const elLon       = document.getElementById('lon');
const elAlt       = document.getElementById('alt');
const elVel       = document.getElementById('vel');
const elLocation  = document.getElementById('location-text');
const elCountdown = document.getElementById('countdown-label');
const elError     = document.getElementById('error-banner');




function formatCoord(val, posDir, negDir) {
  const dir = val >= 0 ? posDir : negDir;
  return `${Math.abs(val).toFixed(4)}° ${dir}`;
}


function flashValue(el) {
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 700);
}




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




async function updateISS() {
  try {
   
    const response = await fetch(ISS_API);

  
    const data = await response.json();


    const lat = data.latitude;    
    const lon = data.longitude;   
    const alt = data.altitude;    
    const vel = data.velocity;    


    elLat.textContent = formatCoord(lat, 'N', 'S');
    elLon.textContent = formatCoord(lon, 'E', 'W');
    elAlt.textContent = alt.toFixed(1);
    elVel.textContent = Math.round(vel).toLocaleString();


    [elLat, elLon, elAlt, elVel].forEach(flashValue);


    getLocationName(lat, lon).then(name => {
      elLocation.textContent = name;
    });

    elError.style.display = 'none';

  } catch (err) {

    elError.style.display = 'block';
    console.error('ISS API error:', err);
  }
}


function tick() {
  elCountdown.textContent = `UPDATING IN ${countdown}s`;

  if (countdown <= 0) {
    countdown = UPDATE_EVERY;
    updateISS();
  } else {
    countdown--;
  }
}


updateISS();               
setInterval(tick, 1000);  
