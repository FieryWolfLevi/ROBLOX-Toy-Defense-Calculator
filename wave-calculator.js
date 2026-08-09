let waveStrategies = [];
let nextWaveId = 1;
function robloxLuaRound(val, decimals = 2) {
  const mult = Math.pow(10, decimals);
  return Math.floor(val * mult + 0.00001) / mult;
}
function formatCrackers(val) {
  const rounded = robloxLuaRound(val, 2);
  return parseFloat(rounded.toFixed(2));
}
function getOriginalBaseWaveEarnings(w) {
  const safeW = Math.max(1, parseInt(w) || 1);
  return (Math.pow(1.1, safeW) - 1) / 10;
}
function calcWaveCrackers(waveNum) {
  const isCrackersPass = localStorage.getItem("crackerPassEnabled") === "true";
  const isGroupBonus = localStorage.getItem("groupBonusEnabled") === "true";
  const isPremiumBonus = localStorage.getItem("premiumBonusEnabled") === "true";
  const w = Math.max(1, parseInt(waveNum) || 1);
  const base = getOriginalBaseWaveEarnings(w);
  let bonusMult = 1.0;
  if (isCrackersPass) bonusMult += 0.5;
  if (isGroupBonus) bonusMult += 0.1;
  if (isPremiumBonus) bonusMult += 0.15;
  const unrounded = base * bonusMult;
  return Math.max(0.01, robloxLuaRound(unrounded, 2));
}
function loadWaveStrategies() {
  const saved = localStorage.getItem("waveStrategies");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        waveStrategies = parsed;
        const maxId = parsed.reduce((max, s) => Math.max(max, s.id || 0), 0);
        nextWaveId = maxId + 1;
      }
    } catch (e) {
      console.error("Error loading waveStrategies from localStorage", e);
    }
  }
}
function saveWaveStrategies() {
  localStorage.setItem("waveStrategies", JSON.stringify(waveStrategies));
}
function addWaveStrategy() {
  waveStrategies.push({
    id: nextWaveId++,
    name: `Wave Strategy ${waveStrategies.length + 1}`,
    wave: "",
    minutes: "",
    seconds: "",
  });
  saveWaveStrategies();
  renderWaveCalculator();
}
function deleteWaveStrategy(id) {
  waveStrategies = waveStrategies.filter((s) => s.id !== id);
  saveWaveStrategies();
  renderWaveCalculator();
}
function updateWaveStrategy(id, field, val) {
  const strat = waveStrategies.find((s) => s.id === id);
  if (!strat) return;
  if (field === "name") strat.name = val;
  else if (field === "wave") strat.wave = val === "" ? "" : parseInt(val) || "";
  else if (field === "minutes") strat.minutes = val;
  else if (field === "seconds") strat.seconds = val;
  saveWaveStrategies();
  updateAllCardsDOM();
}
function updateAllCardsDOM() {
  const processed = waveStrategies.map((s) => {
    const minVal =
      s.minutes === "" || s.minutes === undefined || s.minutes === null
        ? 0
        : parseInt(s.minutes) || 0;
    const secVal =
      s.seconds === "" || s.seconds === undefined || s.seconds === null
        ? 0
        : parseInt(s.seconds) || 0;
    const totalMinutes = minVal + secVal / 60.0;
    const safeMinutes = totalMinutes > 0 ? totalMinutes : 0.01;
    const waveNum =
      s.wave === "" || s.wave === undefined || s.wave === null
        ? 0
        : parseInt(s.wave) || 0;
    const crackers = waveNum > 0 ? calcWaveCrackers(waveNum) : 0;
    const perMinute = crackers / safeMinutes;
    const perHour = perMinute * 60.0;
    return { ...s, crackers, perMinute, perHour };
  });
  const maxRun = Math.max(...processed.map((x) => x.crackers), 0.01);
  const maxMin = Math.max(...processed.map((x) => x.perMinute), 0.01);
  const maxHour = Math.max(...processed.map((x) => x.perHour), 0.01);
  let bestId = null;
  let maxPerHour = -1;
  processed.forEach((p) => {
    if (p.perHour > maxPerHour) {
      maxPerHour = p.perHour;
      bestId = p.id;
    }
  });
  processed.forEach((p) => {
    const cardEl = document.getElementById(`wave-card-${p.id}`);
    const isBest = p.id === bestId && processed.length > 1;
    if (cardEl) cardEl.classList.toggle("best-strategy", isBest);
    const earnedEl = document.getElementById(`earned-run-${p.id}`);
    const minEl = document.getElementById(`crackers-min-${p.id}`);
    const hourEl = document.getElementById(`crackers-hour-${p.id}`);
    const runBar = document.getElementById(`bar-run-${p.id}`);
    const minBar = document.getElementById(`bar-min-${p.id}`);
    const hourBar = document.getElementById(`bar-hour-${p.id}`);
    if (earnedEl) earnedEl.textContent = formatCrackers(p.crackers);
    if (minEl) minEl.textContent = formatCrackers(p.perMinute);
    if (hourEl) hourEl.textContent = formatCrackers(p.perHour);
    if (runBar)
      runBar.style.width = `${Math.min(100, Math.round((p.crackers / maxRun) * 100))}%`;
    if (minBar)
      minBar.style.width = `${Math.min(100, Math.round((p.perMinute / maxMin) * 100))}%`;
    if (hourBar)
      hourBar.style.width = `${Math.min(100, Math.round((p.perHour / maxHour) * 100))}%`;
  });
  if (window.lucide) lucide.createIcons();
}
function renderWaveCalculator() {
  const grid = document.getElementById("wave-strategies-grid");
  if (!grid) return;
  if (waveStrategies.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 3rem;">No strategies added yet. Click "+ Add Wave Strategy" to create one.</div>`;
    return;
  }
  const processed = waveStrategies.map((s) => {
    const minVal =
      s.minutes === "" || s.minutes === undefined || s.minutes === null
        ? 0
        : parseInt(s.minutes) || 0;
    const secVal =
      s.seconds === "" || s.seconds === undefined || s.seconds === null
        ? 0
        : parseInt(s.seconds) || 0;
    const totalMinutes = minVal + secVal / 60.0;
    const safeMinutes = totalMinutes > 0 ? totalMinutes : 0.01;
    const waveNum =
      s.wave === "" || s.wave === undefined || s.wave === null
        ? 0
        : parseInt(s.wave) || 0;
    const crackers = waveNum > 0 ? calcWaveCrackers(waveNum) : 0;
    const perMinute = crackers / safeMinutes;
    const perHour = perMinute * 60.0;
    return { ...s, totalMinutes, crackers, perMinute, perHour };
  });
  const maxRun = Math.max(...processed.map((x) => x.crackers), 0.01);
  const maxMin = Math.max(...processed.map((x) => x.perMinute), 0.01);
  const maxHour = Math.max(...processed.map((x) => x.perHour), 0.01);
  let bestId = null;
  let maxPerHour = -1;
  processed.forEach((s) => {
    if (s.perHour > maxPerHour) {
      maxPerHour = s.perHour;
      bestId = s.id;
    }
  });
  const cookieIconHeader =
    '<i data-lucide="cookie" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:2px;color:var(--secondary-color);"></i>';
  grid.innerHTML = processed
    .map((s) => {
      const isBest = s.id === bestId && processed.length > 1;
      const runPct = Math.min(100, Math.round((s.crackers / maxRun) * 100));
      const minPct = Math.min(100, Math.round((s.perMinute / maxMin) * 100));
      const hourPct = Math.min(100, Math.round((s.perHour / maxHour) * 100));
      return `
      <div id="wave-card-${s.id}" class="wave-card ${isBest ? "best-strategy" : ""}">
        <div class="wave-card-header">
          <input
            type="text"
            class="wave-card-title"
            value="${s.name}"
            oninput="updateWaveStrategy(${s.id}, 'name', this.value)"
          />
          <button class="delete-wave-btn" onclick="deleteWaveStrategy(${s.id})" title="Delete Strategy">&times;</button>
        </div>
        <div class="wave-inputs-row">
          <div class="wave-input-group">
            <label>WAVE NUMBER</label>
            <input
              type="number"
              class="wave-field"
              placeholder="0"
              value="${s.wave !== undefined && s.wave !== null ? s.wave : ""}"
              min="1"
              oninput="updateWaveStrategy(${s.id}, 'wave', this.value)"
            />
          </div>
          <div class="wave-input-group">
            <label>TIME (MM:SS)</label>
            <div style="display: flex; gap: 0.35rem; align-items: center;">
              <input
                type="number"
                class="wave-field"
                placeholder="0"
                value="${s.minutes !== undefined && s.minutes !== null ? s.minutes : ""}"
                min="0"
                oninput="updateWaveStrategy(${s.id}, 'minutes', this.value)"
              />
              <span style="font-weight: 800; color: var(--text-sub);">:</span>
              <input
                type="number"
                class="wave-field"
                placeholder="0"
                value="${s.seconds !== undefined && s.seconds !== null ? s.seconds : ""}"
                min="0"
                max="59"
                oninput="updateWaveStrategy(${s.id}, 'seconds', this.value)"
              />
            </div>
          </div>
        </div>
        <!-- Vertical Bar Stat Blocks with Icon Labels -->
        <div class="wave-stats-grid">
          <div class="wave-stat-box">
            <div class="wave-stat-label">${cookieIconHeader} / RUN</div>
            <div id="earned-run-${s.id}" class="wave-stat-val">
              ${formatCrackers(s.crackers)}
            </div>
            <div class="wave-stat-bar-bg"><div id="bar-run-${s.id}" class="wave-stat-bar-fill" style="width: ${runPct}%;"></div></div>
          </div>
          <div class="wave-stat-box">
            <div class="wave-stat-label">${cookieIconHeader} / MIN</div>
            <div id="crackers-min-${s.id}" class="wave-stat-val">
              ${formatCrackers(s.perMinute)}
            </div>
            <div class="wave-stat-bar-bg"><div id="bar-min-${s.id}" class="wave-stat-bar-fill" style="width: ${minPct}%;"></div></div>
          </div>
          <div class="wave-stat-box highlight-box">
            <div class="wave-stat-label">${cookieIconHeader} / HOUR</div>
            <div id="crackers-hour-${s.id}" class="wave-stat-val highlight-val">
              ${formatCrackers(s.perHour)}
            </div>
            <div class="wave-stat-bar-bg"><div id="bar-hour-${s.id}" class="wave-stat-bar-fill primary-fill" style="width: ${hourPct}%;"></div></div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
