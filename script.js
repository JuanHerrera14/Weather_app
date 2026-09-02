// BUILD MARKER: no-yaxis-no-aqi-color-v2

// ---------- State ----------

let state = {
  unit: localStorage.getItem('unit') || 'C', // 'C' or 'F'
  place: null,       // { name, admin1, country, lat, lon, timezone }
  weather: null,     // raw open-meteo response
  airQuality: null,  // raw open-meteo air-quality response, or null if unavailable
  trace: null,       // { startIdx, times, pointsActual, pointsFeels, length } for the scrub slider
  traceMode: 'actual', // 'actual' or 'feels'
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
  dialTemp: document.getElementById('dial-temp'),
  dialPrecip: document.getElementById('dial-precip'),
  forecast: document.getElementById('forecast'),
  rainIcon: document.getElementById('rain-icon'),
  rainVerdict: document.getElementById('rain-verdict'),
  rainDetail: document.getElementById('rain-detail'),
  rainChart: document.getElementById('rain-chart'),

  sunIcon: document.getElementById('sun-icon'),
  sunVerdict: document.getElementById('sun-verdict'),
  sunDetail: document.getElementById('sun-detail'),
  uvFill: document.getElementById('uv-fill'),
  uvMarker: document.getElementById('uv-marker'),

  windIcon: document.getElementById('wind-icon'),
  windVerdict: document.getElementById('wind-verdict'),
  windDetail: document.getElementById('wind-detail'),
  windChart: document.getElementById('wind-chart'),

  clothingIcon: document.getElementById('clothing-icon'),
  clothingVerdict: document.getElementById('clothing-verdict'),
  clothingDetail: document.getElementById('clothing-detail'),
  clothingMarker: document.getElementById('clothing-marker'),
  clothingScale0: document.getElementById('clothing-scale-0'),
  clothingScale1: document.getElementById('clothing-scale-1'),
  clothingScale2: document.getElementById('clothing-scale-2'),
  clothingScale3: document.getElementById('clothing-scale-3'),

  aqiIcon: document.getElementById('aqi-icon'),
  aqiVerdict: document.getElementById('aqi-verdict'),
  aqiDetail: document.getElementById('aqi-detail'),
  aqiMarker: document.getElementById('aqi-marker'),

  traceTimes: document.getElementById('trace-times'),
  traceSlider: document.getElementById('trace-slider'),
  scrubTicks: document.getElementById('scrub-ticks'),
  scrubTime: document.getElementById('scrub-time'),
  traceActualBtn: document.getElementById('trace-actual-btn'),
  traceFeelsBtn: document.getElementById('trace-feels-btn'),
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
  umbrella: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a18 18 0 0 1 36 0z"/><line x1="24" y1="22" x2="24" y2="38"/><path d="M24 38a4 4 0 0 0 8 0"/><line x1="24" y1="4" x2="24" y2="8"/></svg>`,
  'umbrella-off': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22a18 18 0 0 1 36 0z" opacity="0.4"/><line x1="24" y1="22" x2="24" y2="38"/><path d="M24 38a4 4 0 0 0 8 0"/><line x1="24" y1="4" x2="24" y2="8"/></svg>`,
  windIcon: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 16h24a5 5 0 1 0-5-5"/><path d="M5 24h32a5 5 0 1 1-5 5"/><path d="M5 32h20a5 5 0 1 1-5 5"/></svg>`,
  sunscreen: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="24" cy="18" r="8"/><line x1="24" y1="2" x2="24" y2="6"/><line x1="9" y1="18" x2="5" y2="18"/><line x1="43" y1="18" x2="39" y2="18"/><line x1="12" y1="6" x2="15" y2="9"/><line x1="36" y1="6" x2="33" y2="9"/><path d="M10 40c0-4 4-6 4-10M18 40c0-5 4-7 4-12M26 40c0-4 4-6 4-10M34 40c0-5 4-7 4-12"/></svg>`,
  coat: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10 18 6h12l4 4 8 7-5 5-5-4v24H16V18l-5 4-5-5z"/><line x1="24" y1="6" x2="24" y2="16"/></svg>`,
  hoodie: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6c-6 0-10 4-10 9l-7 6 4 5 7-6v20h12V20l7 6 4-5-7-6c0-5-4-9-10-9z"/><circle cx="24" cy="11" r="1.6" fill="currentColor" stroke="none"/></svg>`,
  jacket: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10 20 6h8l4 4 8 6-4 5-4-3v22H16V22l-4 3-4-5z"/><line x1="24" y1="10" x2="24" y2="38"/></svg>`,
  tshirt: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8 24 12 32 8 40 15 34 21 31 18v20H17V18l-3 3-6-6z"/></svg>`,
  lungs: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="24" y1="6" x2="24" y2="20"/><path d="M24 20c-2-7-9-9-13-5-5 5-5 16 0 22 4 4 9 2 13-3z"/><path d="M24 20c2-7 9-9 13-5 5 5 5 16 0 22-4 4-9 2-13-3z"/></svg>`,
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

function getAqiAt(isoTime) {
  if (!state.airQuality || !state.airQuality.hourly) return null;
  const { time, us_aqi } = state.airQuality.hourly;
  // Match by hour (first 13 chars, e.g. "2026-08-24T14") rather than an exact
  // string match, in case the two APIs format timestamps a little differently.
  const targetHour = isoTime.slice(0, 13);
  let idx = time.indexOf(isoTime);
  if (idx < 0) idx = time.findIndex(t => t.slice(0, 13) === targetHour);
  if (idx < 0) return null;
  const val = us_aqi[idx];
  return val != null ? val : null;
}

// Clothing tiers keyed to "feels like" temperature in Celsius (the raw API
// unit), regardless of the display unit the person has selected.
const CLOTHING_TIERS = [
  { max: -10, label: 'Extreme Cold', detail: 'Heavy jacket, scarf, hat, and gloves — or stay inside.', icon: 'coat' },
  { max: 6, label: 'Cold', detail: 'Heavy coat, hat, and gloves.', icon: 'coat' },
  { max: 15, label: 'Cool', detail: 'Hoodie or a thick long-sleeve shirt.', icon: 'hoodie' },
  { max: 21, label: 'Mild', detail: 'Light jacket or flannel.', icon: 'jacket' },
  { max: 27, label: 'Warm', detail: 'T-shirt with light layers.', icon: 'tshirt' },
  { max: Infinity, label: 'Hot', detail: 'Shorts and a t-shirt — stay hydrated.', icon: 'tshirt' },
];
const CLOTHING_GAUGE_MIN = -20, CLOTHING_GAUGE_MAX = 40;

function clothingTierFor(tempC) {
  return CLOTHING_TIERS.find(tier => tempC <= tier.max) || CLOTHING_TIERS[CLOTHING_TIERS.length - 1];
}

// US AQI categories per the standard EPA breakpoints.
function aqiCategoryFor(aqi) {
  if (aqi <= 50) return { label: 'Good', detail: 'Air quality is satisfactory with little or no risk.' };
  if (aqi <= 100) return { label: 'Moderate', detail: 'Acceptable air quality; unusually sensitive people should consider limiting prolonged outdoor exertion.' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', detail: 'Sensitive groups may experience health effects; the general public is less likely to be affected.' };
  if (aqi <= 200) return { label: 'Unhealthy', detail: 'Everyone may begin to experience health effects; sensitive groups more seriously.' };
  if (aqi <= 300) return { label: 'Very Unhealthy', detail: 'Health alert — everyone may experience more serious health effects.' };
  return { label: 'Hazardous', detail: 'Health warning of emergency conditions affecting the entire population.' };
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

async function fetchAirQuality(place) {
  try {
    const params = new URLSearchParams({
      latitude: place.lat,
      longitude: place.lon,
      hourly: 'us_aqi',
      timezone: 'auto',
      forecast_days: '6',
    });
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Air quality request failed with status', res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('Air quality request threw an error:', err); // AQI is supplementary — don't break the main forecast over it.
    return null;
  }
}

async function loadWeather(place) {
  showOnly('status');
  el.status.innerHTML = '<p>Taking a reading…</p>';
  try {
    const params = new URLSearchParams({
      latitude: place.lat,
      longitude: place.lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m,uv_index',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max',
      timezone: 'auto',
      forecast_days: '6',
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const [res, airQuality] = await Promise.all([fetch(url), fetchAirQuality(place)]);
    if (!res.ok) throw new Error('Weather service returned an error.');
    const data = await res.json();

    state.place = { ...place, timezone: data.timezone || place.timezone };
    state.weather = data;
    state.airQuality = airQuality;
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

  // Humidity / wind / precip dials, and the What-to-Bring cards, are driven
  // by the trace scrubber (see moveScrubberTo) — they start at "now" and
  // update live as the slider is dragged.

  renderTrace();
  renderForecast();
}

// ---------- Advisories: rain / sun / wind at the scrubbed hour ----------

function barChart(svgEl, values, max, color) {
  const w = 180, h = 46, n = values.length;
  const barW = (w / n) * 0.6;
  const gap = (w / n) * 0.4;
  let bars = '';
  values.forEach((v, i) => {
    const bh = Math.max(2, (v / max) * (h - 4));
    const x = i * (barW + gap) + gap / 2;
    const y = h - bh;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="1.5" fill="${color}"/>`;
  });
  svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svgEl.innerHTML = bars;
}

function renderAdvisories(globalIdx, isoTime) {
  const { hourly } = state.weather;
  const WINDOW = 6; // hours shown in each card's mini chart, starting at the scrubbed hour
  const windowTimes = hourly.time.slice(globalIdx, globalIdx + WINDOW);
  const hourLabels = windowTimes.map(t => new Date(t).toLocaleTimeString([], { hour: 'numeric' }));

  // --- Rain chance at the scrubbed hour ---
  const rainProbs = hourly.precipitation_probability.slice(globalIdx, globalIdx + WINDOW);
  const rainNow = hourly.precipitation_probability[globalIdx] ?? 0;
  const maxRainProb = rainProbs.length ? Math.max(...rainProbs) : rainNow;
  const peakIdx = rainProbs.indexOf(maxRainProb);
  const rainKey = rainNow >= 50 ? 'umbrella' : 'umbrella-off';

  el.rainIcon.innerHTML = ICONS[rainKey];
  el.rainVerdict.textContent = `${Math.round(rainNow)}%`;
  el.rainDetail.textContent = maxRainProb > rainNow
    ? `Rises to ${Math.round(maxRainProb)}% around ${hourLabels[peakIdx]}.`
    : `Steady over the next ${WINDOW} hours.`;
  barChart(el.rainChart, rainProbs, 100, '#6FA8C7');

  // --- UV index at the scrubbed hour ---
  const uvNow = hourly.uv_index[globalIdx] ?? 0;
  let uvLabel;
  if (uvNow < 3) uvLabel = 'Low';
  else if (uvNow < 6) uvLabel = 'Moderate';
  else if (uvNow < 8) uvLabel = 'High';
  else if (uvNow < 11) uvLabel = 'Very high';
  else uvLabel = 'Extreme';

  el.sunIcon.innerHTML = ICONS.sunscreen;
  el.sunVerdict.textContent = uvNow.toFixed ? uvNow.toFixed(1) : uvNow;
  el.sunDetail.textContent = `${uvLabel} at ${hourLabels[0]}.`;
  const uvPct = Math.min(100, (uvNow / 11) * 100);
  el.uvFill.style.width = uvPct + '%';
  el.uvMarker.style.left = uvPct + '%';

  // --- Wind speed at the scrubbed hour ---
  const windValues = hourly.wind_speed_10m.slice(globalIdx, globalIdx + WINDOW);
  const windNow = hourly.wind_speed_10m[globalIdx] ?? 0;
  const maxWind = windValues.length ? Math.max(...windValues) : windNow;
  const windPeakIdx = windValues.indexOf(maxWind);

  el.windIcon.innerHTML = ICONS.windIcon;
  el.windVerdict.textContent = `${Math.round(windNow)} km/h`;
  el.windDetail.textContent = maxWind > windNow
    ? `Peaks near ${Math.round(maxWind)} km/h around ${hourLabels[windPeakIdx]}.`
    : `Steady over the next ${WINDOW} hours.`;
  barChart(el.windChart, windValues, Math.max(20, maxWind), '#C9A227');

  // --- What to wear, based on "feels like" temperature at the scrubbed hour ---
  const feelsNow = hourly.apparent_temperature[globalIdx];
  if (feelsNow != null) {
    const tier = clothingTierFor(feelsNow);
    el.clothingIcon.innerHTML = ICONS[tier.icon];
    el.clothingVerdict.textContent = tier.label;
    el.clothingDetail.textContent = `Feels like ${displayTemp(feelsNow)}° — ${tier.detail}`;
    const clothingPct = Math.min(100, Math.max(0,
      ((feelsNow - CLOTHING_GAUGE_MIN) / (CLOTHING_GAUGE_MAX - CLOTHING_GAUGE_MIN)) * 100
    ));
    el.clothingMarker.style.left = clothingPct + '%';
    el.clothingScale0.textContent = displayTemp(CLOTHING_GAUGE_MIN) + '°';
    el.clothingScale1.textContent = displayTemp(0) + '°';
    el.clothingScale2.textContent = displayTemp(20) + '°';
    el.clothingScale3.textContent = displayTemp(CLOTHING_GAUGE_MAX) + '°';
  }

  // --- Air quality context at the scrubbed hour ---
  const aqi = isoTime != null ? getAqiAt(isoTime) : null;
  el.aqiIcon.innerHTML = ICONS.lungs;
  if (aqi != null) {
    const category = aqiCategoryFor(aqi);
    el.aqiVerdict.textContent = `${Math.round(aqi)} · ${category.label}`;
    el.aqiDetail.textContent = category.detail;
    const aqiPct = Math.min(100, Math.max(0, (aqi / 300) * 100));
    el.aqiMarker.style.left = aqiPct + '%';
  } else {
    el.aqiVerdict.textContent = '—';
    el.aqiDetail.textContent = 'Air quality data is unavailable for this location right now.';
    el.aqiMarker.style.left = '0%';
  }
}

function renderTrace() {
  const { hourly, current } = state.weather;
  const times = hourly.time;
  const temps = hourly.temperature_2m;
  const feelsTemps = hourly.apparent_temperature;

  // Anchor the window to the current hour (not the next upcoming one) so
  // "now" falls inside the plotted range instead of sitting at the edge.
  const nowTime = new Date(current.time).getTime();
  let startIdx = 0;
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]).getTime() <= nowTime) startIdx = i;
    else break;
  }
  const sliceTimes = times.slice(startIdx, startIdx + 24);
  const sliceActual = temps.slice(startIdx, startIdx + 24);
  const sliceFeels = feelsTemps.slice(startIdx, startIdx + 24);

  const w = 600, h = 120;
  const padLeft = 10, padRight = 10, padTop = 12, padBottom = 12;
  // Share one scale across both series so the two lines stay comparable.
  const combined = sliceActual.concat(sliceFeels);
  const min = Math.min(...combined), max = Math.max(...combined);
  const range = (max - min) || 1;

  const toPoints = (slice) => slice.map((t, i) => {
    const x = padLeft + (i / (slice.length - 1)) * (w - padLeft - padRight);
    const y = h - padBottom - ((t - min) / range) * (h - padTop - padBottom);
    return [x, y];
  });

  const pointsActual = toPoints(sliceActual);
  const pointsFeels = toPoints(sliceFeels);

  // Fractional position of "now" between the first two plotted hours.
  const hourMs = 3600 * 1000;
  const firstHourTime = new Date(sliceTimes[0]).getTime();
  const nowFraction = Math.min(1, Math.max(0, (nowTime - firstHourTime) / hourMs));
  const nowX = pointsActual.length > 1
    ? pointsActual[0][0] + nowFraction * (pointsActual[1][0] - pointsActual[0][0])
    : pointsActual[0][0];

  state.trace = {
    startIdx, times: sliceTimes, pointsActual, pointsFeels, length: sliceActual.length,
    min, max, w, h, padLeft, padRight, padTop, padBottom, nowX,
  };

  drawTraceLines();

  renderTraceTimeLabels(sliceTimes);
  setupScrubber(sliceActual.length);
  moveScrubberTo(0);
}

function pathFor(points) {
  return points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
}

function drawNowLine() {
  const { nowX, h, padTop, w } = state.trace;
  // Flip the label to the left of the line if it's too close to the right edge.
  const nearRightEdge = nowX > w - 34;
  const textX = nearRightEdge ? nowX - 6 : nowX + 6;
  const anchor = nearRightEdge ? 'end' : 'start';

  return `
    <line x1="${nowX.toFixed(1)}" y1="0" x2="${nowX.toFixed(1)}" y2="${h}" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.85"/>
    <text x="${textX.toFixed(1)}" y="${(padTop + 2).toFixed(1)}" text-anchor="${anchor}" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="600" fill="#FFFFFF">NOW</text>
  `;
}

function drawTraceLines() {
  const { pointsActual, pointsFeels } = state.trace;
  const activePoints = state.traceMode === 'actual' ? pointsActual : pointsFeels;
  const activeColor = '#C9A227'; // brass
  const dimColor = '#4A5568';    // greyed out

  const actualColor = state.traceMode === 'actual' ? activeColor : dimColor;
  const feelsColor = state.traceMode === 'feels' ? activeColor : dimColor;

  const actualPath = `<path d="${pathFor(pointsActual)}" fill="none" stroke="${actualColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trace-path trace-path--actual"/>`;
  const feelsPath = `<path d="${pathFor(pointsFeels)}" fill="none" stroke="${feelsColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trace-path trace-path--feels"/>`;

  // Draw the dimmed line first, then the active line on top so it isn't obscured.
  const orderedPaths = state.traceMode === 'actual' ? feelsPath + actualPath : actualPath + feelsPath;

  el.traceSvg.innerHTML = `
    ${drawNowLine()}
    ${orderedPaths}
    <line id="trace-marker-line" x1="${activePoints[0][0]}" y1="0" x2="${activePoints[0][0]}" y2="120" />
    <circle id="trace-marker-dot" cx="${activePoints[0][0]}" cy="${activePoints[0][1]}" r="4"/>
  `;

  // Animate the active line's draw-in; the dimmed line just appears.
  const activeSelector = state.traceMode === 'actual' ? '.trace-path--actual' : '.trace-path--feels';
  const pathEl = el.traceSvg.querySelector(activeSelector);
  const len = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = len;
  pathEl.style.strokeDashoffset = len;
  pathEl.getBoundingClientRect(); // force reflow
  pathEl.style.transition = 'stroke-dashoffset 1s ease';
  pathEl.style.strokeDashoffset = '0';
}

function setTraceMode(mode) {
  if (state.traceMode === mode || !state.trace) return;
  state.traceMode = mode;
  el.traceActualBtn.classList.toggle('is-active', mode === 'actual');
  el.traceFeelsBtn.classList.toggle('is-active', mode === 'feels');
  drawTraceLines();
  moveScrubberTo(Number(el.traceSlider.value));
}

el.traceActualBtn.addEventListener('click', () => setTraceMode('actual'));
el.traceFeelsBtn.addEventListener('click', () => setTraceMode('feels'));

function renderTraceTimeLabels(sliceTimes) {
  // Show ~6 evenly-spaced labels so it stays readable at any width.
  const LABEL_COUNT = 6;
  el.traceTimes.innerHTML = '';
  for (let i = 0; i < LABEL_COUNT; i++) {
    const idx = Math.round((i / (LABEL_COUNT - 1)) * (sliceTimes.length - 1));
    const d = new Date(sliceTimes[idx]);
    const span = document.createElement('span');
    span.textContent = d.toLocaleTimeString([], { hour: 'numeric' });
    el.traceTimes.appendChild(span);
  }
}

function setupScrubber(hoursCount) {
  el.traceSlider.max = hoursCount - 1;
  el.traceSlider.value = 0;

  el.scrubTicks.innerHTML = '';
  const TICK_COUNT = 12;
  for (let i = 0; i < TICK_COUNT; i++) {
    el.scrubTicks.appendChild(document.createElement('span'));
  }

  el.traceSlider.oninput = (e) => moveScrubberTo(Number(e.target.value));
}

function moveScrubberTo(idx) {
  const trace = state.trace;
  if (!trace) return;
  const activePoints = state.traceMode === 'actual' ? trace.pointsActual : trace.pointsFeels;
  if (!activePoints[idx]) return;

  const [x, y] = activePoints[idx];
  const dot = document.getElementById('trace-marker-dot');
  const line = document.getElementById('trace-marker-line');
  if (dot) { dot.setAttribute('cx', x); dot.setAttribute('cy', y); }
  if (line) { line.setAttribute('x1', x); line.setAttribute('x2', x); }
  el.traceSlider.value = idx;

  const time = new Date(trace.times[idx]);
  const isToday = time.toDateString() === new Date().toDateString();
  el.scrubTime.textContent = (isToday ? '' : time.toLocaleDateString([], { weekday: 'short' }) + ' ') +
    time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const { hourly } = state.weather;
  const globalIdx = trace.startIdx + idx;

  renderAdvisories(globalIdx, trace.times[idx]);

  // Drive the humidity / temp / precip dials from the same selected hour.
  // Temp follows whichever line (actual vs feels like) is active on the graph.
  const humidity = hourly.relative_humidity_2m[globalIdx];
  const precip = hourly.precipitation[globalIdx];
  const tempC = state.traceMode === 'actual'
    ? hourly.temperature_2m[globalIdx]
    : hourly.apparent_temperature[globalIdx];

  el.dialHumidity.textContent = (humidity != null ? Math.round(humidity) : '—') + '%';
  el.dialPrecip.textContent = (precip != null ? precip : '—') + 'mm';
  el.dialTemp.textContent = (tempC != null ? displayTemp(tempC) : '—') + '°';
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
