// ---------- State ----------

let state = {
  unit: localStorage.getItem('unit') || 'C', // 'C' or 'F'
  place: null,       // { name, admin1, country, lat, lon, timezone }
  weather: null,     // raw open-meteo response
};

// ---------- Elements ----------

const el = {
  searchForm: document.getElementById('search-form'),
  cityInput: document.getElementById('city-input'),
  suggestions: document.getElementById('suggestions'),
  locateBtn: document.getElementById('locate-btn'),
  status: document.getElementById('status'),
  reading: document.getElementById('reading'),
  error: document.getElementById('error'),
  errorText: document.getElementById('error-text'),
  placeName: document.getElementById('place-name'),
  placeMeta: document.getElementById('place-meta'),
  observedAt: document.getElementById('observed-at'),
  tempValue: document.getElementById('temp-value'),
  unitToggle: document.getElementById('unit-toggle'),
  condIcon: document.getElementById('cond-icon'),
  condText: document.getElementById('cond-text'),
  feelsLike: document.getElementById('feels-like'),
  traceSvg: document.getElementById('trace-svg'),
  dialHumidity: document.getElementById('dial-humidity'),
  dialWind: document.getElementById('dial-wind'),
  dialPrecip: document.getElementById('dial-precip'),
  dialUv: document.getElementById('dial-uv'),
  windArrow: document.getElementById('wind-arrow'),
  forecast: document.getElementById('forecast'),
};

el.unitToggle.textContent = '°' + state.unit;

// ---------- Weather code -> description + icon ----------

const WEATHER_CODES = {
  0: ['Clear sky', 'sun'],
  1: ['Mainly clear', 'sun-cloud'],
  2: ['Partly cloudy', 'sun-cloud'],
  3: ['Overcast', 'cloud'],
  45: ['Fog', 'fog'],
  48: ['Depositing rime fog', 'fog'],
  51: ['Light drizzle', 'rain'],
  53: ['Drizzle', 'rain'],
  55: ['Dense drizzle', 'rain'],
  56: ['Freezing drizzle', 'rain'],
  57: ['Dense freezing drizzle', 'rain'],
  61: ['Light rain', 'rain'],
  63: ['Rain', 'rain'],
  65: ['Heavy rain', 'rain'],
  66: ['Freezing rain', 'rain'],
  67: ['Heavy freezing rain', 'rain'],
  71: ['Light snow', 'snow'],
  73: ['Snow', 'snow'],
  75: ['Heavy snow', 'snow'],
  77: ['Snow grains', 'snow'],
  80: ['Light showers', 'rain'],
  81: ['Showers', 'rain'],
  82: ['Violent showers', 'rain'],
  85: ['Snow showers', 'snow'],
  86: ['Heavy snow showers', 'snow'],
  95: ['Thunderstorm', 'storm'],
  96: ['Thunderstorm, hail', 'storm'],
  99: ['Thunderstorm, heavy hail', 'storm'],
};

const ICONS = {
  sun: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="24" cy="24" r="9"/><line x1="24" y1="3" x2="24" y2="9"/><line x1="24" y1="39" x2="24" y2="45"/><line x1="3" y1="24" x2="9" y2="24"/><line x1="39" y1="24" x2="45" y2="24"/><line x1="8.5" y1="8.5" x2="12.5" y2="12.5"/><line x1="35.5" y1="35.5" x2="39.5" y2="39.5"/><line x1="8.5" y1="39.5" x2="12.5" y2="35.5"/><line x1="35.5" y1="12.5" x2="39.5" y2="8.5"/></svg>`,
  'sun-cloud': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="16" r="7"/><line x1="18" y1="2" x2="18" y2="5"/><line x1="5" y1="16" x2="8" y2="16"/><line x1="7" y1="4" x2="9" y2="6"/><path d="M14 30h20a7 7 0 0 0 0-14 9 9 0 0 0-17-3 8 8 0 0 0-3 17z" fill="none"/></svg>`,
  cloud: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 34h22a8 8 0 0 0 0-16 10 10 0 0 0-19-3 9 9 0 0 0-3 19z"/></svg>`,
  fog: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="18" x2="40" y2="18"/><line x1="4" y1="24" x2="44" y2="24"/><line x1="8" y1="30" x2="40" y2="30"/><line x1="14" y1="36" x2="34" y2="36"/></svg>`,
  rain: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 24h22a8 8 0 0 0 0-16 10 10 0 0 0-19-3 9 9 0 0 0-3 19z"/><line x1="15" y1="32" x2="12" y2="40"/><line x1="24" y1="32" x2="21" y2="40"/><line x1="33" y1="32" x2="30" y2="40"/></svg>`,
  snow: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 24h22a8 8 0 0 0 0-16 10 10 0 0 0-19-3 9 9 0 0 0-3 19z"/><line x1="15" y1="32" x2="15" y2="40"/><line x1="12" y1="35" x2="18" y2="37"/><line x1="18" y1="35" x2="12" y2="37"/><line x1="33" y1="32" x2="33" y2="40"/><line x1="30" y1="35" x2="36" y2="37"/><line x1="36" y1="35" x2="30" y2="37"/></svg>`,
  storm: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22h22a8 8 0 0 0 0-16 10 10 0 0 0-19-3 9 9 0 0 0-3 19z"/><path d="M25 28l-6 9h6l-4 8"/></svg>`,
};

function iconFor(code) {
  const key = (WEATHER_CODES[code] || ['Unknown', 'cloud'])[1];
  return ICONS[key];
}
function textFor(code) {
  return (WEATHER_CODES[code] || ['Unknown conditions'])[0];
}

// ---------- Helpers ----------

function cToF(c) { return c * 9 / 5 + 32; }

function displayTemp(celsius) {
  const v = state.unit === 'C' ? celsius : cToF(celsius);
  return Math.round(v);
}

function windDir16(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function showOnly(section) {
  el.status.hidden = section !== 'status';
  el.reading.hidden = section !== 'reading';
  el.error.hidden = section !== 'error';
}

function showError(message) {
  el.errorText.textContent = message;
  showOnly('error');
}

// ---------- Geocoding ----------

let searchDebounce = null;

el.cityInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  const q = el.cityInput.value.trim();
  if (q.length < 2) {
    el.suggestions.hidden = true;
    el.suggestions.innerHTML = '';
    return;
  }
  searchDebounce = setTimeout(() => runGeocode(q), 300);
});

async function runGeocode(query) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    renderSuggestions(data.results || []);
  } catch (err) {
    el.suggestions.hidden = true;
  }
}

function renderSuggestions(results) {
  el.suggestions.innerHTML = '';
  if (!results.length) {
    el.suggestions.hidden = true;
    return;
  }
  results.forEach(r => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    const region = [r.admin1, r.country].filter(Boolean).join(', ');
    li.innerHTML = `${r.name}<small>${region}</small>`;
    const pick = () => selectPlace(r);
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter') pick(); });
    el.suggestions.appendChild(li);
  });
  el.suggestions.hidden = false;
}

el.searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const first = el.suggestions.querySelector('li');
  if (first) first.click();
});

function selectPlace(r) {
  el.suggestions.hidden = true;
  el.cityInput.value = `${r.name}`;
  const place = {
    name: r.name,
    admin1: r.admin1 || '',
    country: r.country || '',
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone,
  };
  localStorage.setItem('lastPlace', JSON.stringify(place));
  loadWeather(place);
}

// ---------- Geolocation ----------

el.locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Your browser does not support geolocation.');
    return;
  }
  showOnly('status');
  el.status.innerHTML = '<p>Locating…</p>';
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const place = await reverseLabel(latitude, longitude);
      localStorage.setItem('lastPlace', JSON.stringify(place));
      loadWeather(place);
    },
    () => showError('Could not access your location. You can search for a place instead.'),
    { timeout: 8000 }
  );
});

async function reverseLabel(lat, lon) {
  // Open-Meteo geocoding has no reverse endpoint; label generically and let
  // the weather response's timezone stand in for locale context.
  return { name: 'Current location', admin1: '', country: '', lat, lon, timezone: 'auto' };
}

// ---------- Weather fetch ----------

async function loadWeather(place) {
  showOnly('status');
  el.status.innerHTML = '<p>Taking a reading…</p>';
  try {
    const params = new URLSearchParams({
      latitude: place.lat,
      longitude: place.lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max',
      timezone: 'auto',
      forecast_days: '6',
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather service returned an error.');
    const data = await res.json();

    state.place = { ...place, timezone: data.timezone || place.timezone };
    state.weather = data;
    render();
    showOnly('reading');
  } catch (err) {
    showError('Could not load weather for that place. Check your connection and try again.');
  }
}

// ---------- Render ----------

function render() {
  const { place, weather } = state;
  if (!place || !weather) return;

  const region = [place.admin1, place.country].filter(Boolean).join(', ');
  el.placeName.textContent = place.name;
  el.placeMeta.textContent = region || `${place.lat.toFixed(2)}, ${place.lon.toFixed(2)}`;

  const cur = weather.current;
  const now = new Date(cur.time);
  el.observedAt.textContent = 'OBSERVED ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  el.tempValue.textContent = displayTemp(cur.temperature_2m);
  el.condIcon.innerHTML = iconFor(cur.weather_code);
  el.condText.textContent = textFor(cur.weather_code);
  el.feelsLike.textContent = `Feels like ${displayTemp(cur.apparent_temperature)}°`;

  el.dialHumidity.textContent = `${Math.round(cur.relative_humidity_2m)}%`;
  el.dialPrecip.textContent = `${cur.precipitation ?? 0}mm`;
  el.dialWind.textContent = `${Math.round(cur.wind_speed_10m)} km/h ${windDir16(cur.wind_direction_10m)}`;
  el.windArrow.setAttribute('transform', `rotate(${cur.wind_direction_10m} 20 20)`);

  const todayUv = weather.daily.uv_index_max ? weather.daily.uv_index_max[0] : null;
  el.dialUv.textContent = todayUv != null ? Math.round(todayUv) : '—';

  renderTrace();
  renderForecast();
}

function renderTrace() {
  const { hourly, current } = state.weather;
  const times = hourly.time;
  const temps = hourly.temperature_2m;

  // Find index closest to "now" and take the surrounding 24 hours.
  const nowTime = new Date(current.time).getTime();
  let startIdx = times.findIndex(t => new Date(t).getTime() >= nowTime);
  if (startIdx < 0) startIdx = 0;
  const slice = temps.slice(startIdx, startIdx + 24);

  const w = 600, h = 120, pad = 10;
  const min = Math.min(...slice), max = Math.max(...slice);
  const range = (max - min) || 1;

  const points = slice.map((t, i) => {
    const x = pad + (i / (slice.length - 1)) * (w - pad * 2);
    const y = h - pad - ((t - min) / range) * (h - pad * 2);
    return [x, y];
  });

  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

  el.traceSvg.innerHTML = `
    <path d="${path}" fill="none" stroke="#C9A227" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trace-path"/>
    <circle cx="${points[0][0]}" cy="${points[0][1]}" r="3" fill="#6FA8C7"/>
  `;

  const pathEl = el.traceSvg.querySelector('.trace-path');
  const len = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = len;
  pathEl.style.strokeDashoffset = len;
  pathEl.getBoundingClientRect(); // force reflow
  pathEl.style.transition = 'stroke-dashoffset 1s ease';
  pathEl.style.strokeDashoffset = '0';
}

function renderForecast() {
  const { daily } = state.weather;
  el.forecast.innerHTML = '';
  const days = daily.time.slice(0, 5);
  days.forEach((dateStr, i) => {
    const d = new Date(dateStr + 'T12:00:00');
    const label = i === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' });
    const code = daily.weather_code[i];
    const hi = displayTemp(daily.temperature_2m_max[i]);
    const lo = displayTemp(daily.temperature_2m_min[i]);

    const card = document.createElement('div');
    card.className = 'forecast__day';
    card.innerHTML = `
      <p class="day-label">${label}</p>
      <div class="day-icon">${iconFor(code)}</div>
      <p class="day-hi">${hi}°</p>
      <p class="day-lo">${lo}°</p>
    `;
    el.forecast.appendChild(card);
  });
}

// ---------- Unit toggle ----------

el.unitToggle.addEventListener('click', () => {
  state.unit = state.unit === 'C' ? 'F' : 'C';
  localStorage.setItem('unit', state.unit);
  el.unitToggle.textContent = '°' + state.unit;
  if (state.weather) render();
});

// ---------- Close suggestions on outside click ----------

document.addEventListener('click', (e) => {
  if (!el.searchForm.contains(e.target)) {
    el.suggestions.hidden = true;
  }
});

// ---------- Init: restore last place ----------

(function init() {
  const saved = localStorage.getItem('lastPlace');
  if (saved) {
    try {
      const place = JSON.parse(saved);
      loadWeather(place);
      return;
    } catch (e) { /* fall through */ }
  }
  showOnly('status');
})();
