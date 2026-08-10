function formatCrackers(val) {
  const rounded = robloxLuaRound(val, 2);
  return parseFloat(rounded.toFixed(2));
}
function initSettings() {
  if (typeof loadWaveStrategies === "function") loadWaveStrategies();
  const savedToys = localStorage.getItem("toyPassEnabled");
  const toyCheckbox = document.getElementById("extra-toys-checkbox");
  if (toyCheckbox) toyCheckbox.checked = savedToys === "true";
  const savedCrackers = localStorage.getItem("crackerPassEnabled");
  const crackerCheckbox = document.getElementById("extra-crackers-checkbox");
  if (crackerCheckbox) crackerCheckbox.checked = savedCrackers === "true";
  const savedGroup = localStorage.getItem("groupBonusEnabled");
  const groupCheckbox = document.getElementById("group-bonus-checkbox");
  if (groupCheckbox) groupCheckbox.checked = savedGroup === "true";
  const savedPremium = localStorage.getItem("premiumBonusEnabled");
  const premiumCheckbox = document.getElementById("premium-bonus-checkbox");
  if (premiumCheckbox) premiumCheckbox.checked = savedPremium === "true";
}
function toggleExtraToysPass() {
  const checkbox = document.getElementById("extra-toys-checkbox");
  localStorage.setItem(
    "toyPassEnabled",
    checkbox ? (checkbox.checked ? "true" : "false") : "false",
  );
  updateCalculator();
  if (typeof renderItemFinder === "function") renderItemFinder();
  if (typeof renderWaveCalculator === "function") renderWaveCalculator();
}
function toggleExtraCrackersPass() {
  const checkbox = document.getElementById("extra-crackers-checkbox");
  localStorage.setItem(
    "crackerPassEnabled",
    checkbox ? (checkbox.checked ? "true" : "false") : "false",
  );
  updateCalculator();
  if (typeof renderItemFinder === "function") renderItemFinder();
  if (typeof renderWaveCalculator === "function") renderWaveCalculator();
}
function toggleGroupBonus() {
  const checkbox = document.getElementById("group-bonus-checkbox");
  localStorage.setItem(
    "groupBonusEnabled",
    checkbox ? (checkbox.checked ? "true" : "false") : "false",
  );
  updateCalculator();
  if (typeof renderItemFinder === "function") renderItemFinder();
  if (typeof renderWaveCalculator === "function") renderWaveCalculator();
}
function togglePremiumBonus() {
  const checkbox = document.getElementById("premium-bonus-checkbox");
  localStorage.setItem(
    "premiumBonusEnabled",
    checkbox ? (checkbox.checked ? "true" : "false") : "false",
  );
  updateCalculator();
  if (typeof renderItemFinder === "function") renderItemFinder();
  if (typeof renderWaveCalculator === "function") renderWaveCalculator();
}
function toggleSettingsPopup() {
  const popup = document.getElementById("settings-popup");
  if (popup) {
    const isVis = popup.style.display === "block";
    popup.style.display = isVis ? "none" : "block";
  }
}
document.addEventListener("click", (e) => {
  const popup = document.getElementById("settings-popup");
  const btn = document.getElementById("settings-btn");
  if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) {
    popup.style.display = "none";
  }
});
let selectedCrateName = "Toothpick";
let currentTab = "calculator";
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.id === `tab-${tab}`);
  });
  document.querySelectorAll(".tab-view").forEach((view) => {
    const isActive = view.id === `view-${tab}`;
    view.classList.toggle("active", isActive);
    view.style.display = isActive ? "flex" : "none";
  });

  if (tab === "wave-calc" && typeof renderWaveCalculator === "function") {
    renderWaveCalculator();
  } else if (tab === "item-finder" && typeof renderItemFinder === "function") {
    renderItemFinder();
  } else if (tab === "building-guide" && typeof renderBuildingGuide === "function") {
    renderBuildingGuide();
  } else if (tab === "calculator") {
    updateCalculator();
  }
}
function selectCrate(name) {
  selectedCrateName = name;
  updateCalculator();
}
function updateCalculator() {
  const budgetInput =
    parseFloat(document.getElementById("budget-input").value) || 0;
  const toyMult = document.getElementById("extra-toys-checkbox")?.checked
    ? 1.5
    : 1;
  const grid = document.getElementById("crate-grid");
  grid.innerHTML = crates
    .map((c) => {
      const times = Math.floor(
        Math.round(budgetInput * 10000) / Math.round(c.cost * 10000),
      );
      const buyable = times > 0;
      const isSelected = c.name === selectedCrateName;
      const r_colors = {
        Mythical: "var(--rarity-mythical)",
        Legendary: "var(--rarity-legendary)",
        Epic: "var(--rarity-epic)",
        Rare: "var(--rarity-rare)",
        Uncommon: "var(--rarity-uncommon)",
        Common: "var(--rarity-common)",
      };
      const bestBadge = c.bestFor
        ? `<div class="best-for-badge" style="border-color: ${r_colors[c.bestFor] || "#46b216"}; color: ${r_colors[c.bestFor] || "#46b216"};">BEST FOR ${c.bestFor.toUpperCase()}</div>`
        : "";
      return `
        <div class="crate-tile ${isSelected ? "selected" : ""} ${buyable ? "" : "unaffordable"}" onclick="selectCrate('${c.name}')">
          ${bestBadge}
          <img src="${c.image}" alt="${c.name} Lunchbox" class="crate-tile-icon" />
          <div class="crate-tile-name">${c.name} Lunchbox</div>
          <div class="crate-tile-cost">
            <i data-lucide="cookie" style="width:14px;height:14px;vertical-align:middle;display:inline-block;color:var(--secondary-color);"></i>${c.cost.toFixed(2)} | ${c.toys * toyMult} Toys
          </div>
          <span class="crate-buys-badge ${buyable ? "" : "zero"}">
            ${buyable ? `${times}x BUYS` : "UNAFFORDABLE"}
          </span>
        </div>
      `;
    })
    .join("");
  if (window.lucide) lucide.createIcons();
  renderInspector(budgetInput);
}
function renderInspector(budgetInput) {
  const c = crates.find((x) => x.name === selectedCrateName) || crates[0];
  const toyMult = document.getElementById("extra-toys-checkbox")?.checked
    ? 1.5
    : 1;
  const times = Math.floor(
    Math.round(budgetInput * 10000) / Math.round(c.cost * 10000),
  );
  const buyable = times > 0;
  const totalToys = times * c.toys * toyMult;
  const rarities = [
    "Mythical",
    "Legendary",
    "Epic",
    "Rare",
    "Uncommon",
    "Common",
  ];
  const r_colors = {
    Mythical: "var(--rarity-mythical)",
    Legendary: "var(--rarity-legendary)",
    Epic: "var(--rarity-epic)",
    Rare: "var(--rarity-rare)",
    Uncommon: "var(--rarity-uncommon)",
    Common: "var(--rarity-common)",
  };
  const categories = [
    { key: "soldier", label: "Expected Soldiers", color: "var(--cat-soldier)" },
    { key: "trap", label: "Expected Traps", color: "var(--cat-trap)" },
    { key: "block", label: "Expected Blocks", color: "var(--cat-block)" },
  ];
  const panel = document.getElementById("inspector-panel");
  let breakdownHTML = "";
  if (buyable) {
    categories.forEach((cat) => {
      let groupItemsHTML = "";
      let catTotalExp = 0;
      rarities.forEach((r) => {
        const crate_pct = c[r.toLowerCase()] || 0;
        if (crate_pct <= 0) return;
        const catItems = itemDatabase.filter(
          (x) => x.rarity === r && x.category === cat.key,
        );
        catItems.forEach((it) => {
          const itemYield = totalToys * ((crate_pct * it.rate) / 100);
          catTotalExp += itemYield;
          if (itemYield > 0.001) {
            groupItemsHTML += `
              <div class="item-row" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 6px; border-bottom: 1px solid rgba(255,255,255,0.03);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <img src="${it.image}" alt="${it.name}" style="width: 26px; height: 26px; object-fit: contain; border-radius: 6px; background: #000; border: 1px solid rgba(255,255,255,0.15);" />
                  <span style="color: ${r_colors[r]}; font-weight: 700; font-size: 0.875rem;">${it.name}</span>
                </div>
                <span style="font-weight: 800; font-size: 0.9rem; color: #ffffff;">${itemYield.toFixed(2)}</span>
              </div>
            `;
          }
        });
      });
      if (groupItemsHTML.length > 0) {
        breakdownHTML += `
          <div class="breakdown-group" style="margin-bottom: 1.25rem;">
            <div class="group-label" style="color: ${cat.color}; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
              <span>${cat.label} (~${catTotalExp.toFixed(2)} total)</span>
            </div>
            <div class="item-list" style="background: rgba(7, 9, 14, 0.5); border-radius: 10px; border: 1px solid var(--border-color); padding: 0.35rem 0.5rem; max-height: 220px; overflow-y: auto;">
              ${groupItemsHTML}
            </div>
          </div>
        `;
      }
    });
  }
  panel.innerHTML = `
    <div class="inspector-header">
      <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.5rem;">
        <img src="${c.image}" alt="${c.name}" style="width: 54px; height: 54px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));" />
        <div>
          <div class="inspector-title">${c.name} Lunchbox</div>
          <div class="inspector-subtitle">
            <i data-lucide="cookie" style="width:14px;height:14px;vertical-align:middle;display:inline-block;color:var(--secondary-color);"></i>${c.cost.toFixed(2)} Crackers | ${c.toys * toyMult} Toys
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: rgba(7, 9, 14, 0.6); padding: 0.75rem; border-radius: 10px; border: 1px solid var(--border-color); margin-top: 0.5rem;">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-sub); font-weight: 700; text-transform: uppercase;">Total Toys Received</div>
          <div style="font-size: 1.2rem; font-weight: 900; color: var(--primary-color);">${totalToys.toLocaleString()}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-sub); font-weight: 700; text-transform: uppercase;">Times Purchased</div>
          <div style="font-size: 1.2rem; font-weight: 900; color: #ffffff;">${times}x</div>
        </div>
      </div>
    </div>
    <div class="inspector-body">
      ${
        buyable
          ? breakdownHTML
          : `<div style="text-align: center; color: var(--text-sub); padding: 3rem 1rem;">
              <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 0.75rem;"></i>
              <div style="font-weight: 700; color: #ffffff; margin-bottom: 0.25rem;">Insufficient Crackers</div>
              <div>Enter a higher Crackers amount to view item yields for ${c.name} Lunchbox.</div>
            </div>`
      }
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}
document.addEventListener("DOMContentLoaded", () => {
  initSettings();
  updateCalculator();
  const budgetInput = document.getElementById("budget-input");
  if (budgetInput) {
    budgetInput.addEventListener("input", updateCalculator);
  }
});
