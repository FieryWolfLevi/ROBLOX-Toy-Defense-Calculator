

let settings = {
  theme: "dark",
};

function initSettings() {
  const saved = localStorage.getItem("td_calc_settings");
  if (saved) {
    try {
      settings = JSON.parse(saved);
    } catch (e) {}
  }
}

function saveSettings() {
  localStorage.setItem("td_calc_settings", JSON.stringify(settings));
}

function toggleSettingsPopup() {
  const popup = document.getElementById("settings-popup");
  if (!popup) return;
  const isShown = popup.style.display === "block";
  popup.style.display = isShown ? "none" : "block";
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

function openItemInBrowser(itemName) {
  if (typeof selectFinderItem === "function") {
    selectFinderItem(itemName);
  }
  switchTab("item-finder");
}

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

  const r_colors = {
    Mythical: "var(--rarity-mythical)",
    Legendary: "var(--rarity-legendary)",
    Epic: "var(--rarity-epic)",
    Rare: "var(--rarity-rare)",
    Uncommon: "var(--rarity-uncommon)",
    Common: "var(--rarity-common)",
  };

  const grid = document.getElementById("crate-grid");
  grid.innerHTML = crates
    .map((c) => {
      const times = Math.floor(
        Math.round(budgetInput * 10000) / Math.round(c.cost * 10000),
      );
      const isSelected = c.name === selectedCrateName;
      const isBuyable = times > 0;
      const bestForHTML = c.bestFor ? `<div class="best-for-badge" style="color: ${r_colors[c.bestFor] || "var(--primary-color)"}; border-color: ${r_colors[c.bestFor] || "var(--primary-color)"};">Best: ${c.bestFor}</div>` : "";

      return `
        <div class="crate-tile ${isSelected ? "selected" : ""} ${!isBuyable ? "unaffordable" : ""}" onclick="selectCrate('${c.name}')">
          ${bestForHTML}
          <img src="${c.image}" alt="${c.name}" class="crate-tile-icon" />
          <div class="crate-tile-name">${c.name}</div>
          <div class="crate-tile-cost"><i data-lucide="cookie" style="width:14px;height:14px;vertical-align:middle;display:inline-block;color:var(--secondary-color);"></i> ${c.cost.toFixed(2)} Crackers</div>
          <div class="crate-buys-badge ${!isBuyable ? "zero" : ""}">${isBuyable ? times + "x Buys" : "Can't Afford"}</div>
        </div>
      `;
    })
    .join("");

  const selectedCrate =
    crates.find((c) => c.name === selectedCrateName) || crates[0];
  renderLunchboxBreakdown(selectedCrate, budgetInput, toyMult);
  if (window.lucide) lucide.createIcons();
}

function renderLunchboxBreakdown(c, budgetInput, toyMult) {
  const panel = document.getElementById("inspector-panel");
  if (!panel) return;

  const times = Math.floor(
    Math.round(budgetInput * 10000) / Math.round(c.cost * 10000),
  );
  const buyable = times > 0;
  const totalToys = times * c.toys * toyMult;

  const r_colors = {
    Mythical: "var(--rarity-mythical)",
    Legendary: "var(--rarity-legendary)",
    Epic: "var(--rarity-epic)",
    Rare: "var(--rarity-rare)",
    Uncommon: "var(--rarity-uncommon)",
    Common: "var(--rarity-common)",
  };

  const categories = [
    { key: "soldier", label: "Soldiers", color: "var(--primary-color)" },
    { key: "trap", label: "Traps", color: "#e056fd" },
    { key: "block", label: "Blocks", color: "#00d2d3" },
  ];

  const rarities = [
    "Mythical",
    "Legendary",
    "Epic",
    "Rare",
    "Uncommon",
    "Common",
  ];

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
            const safeName = it.name.replace(/'/g, "\\'");
            groupItemsHTML += `
              <div class="item-row" onclick="openItemInBrowser('${safeName}')" title="Click to view ${it.name} in Item Browser">
                <div class="item-row-left">
                  <img src="${it.image}" alt="${it.name}" class="item-row-img" />
                  <span class="item-row-name" style="color: ${r_colors[r]};">
                    ${it.name}
                    <i data-lucide="external-link"></i>
                  </span>
                </div>
                <span class="item-row-yield">${itemYield.toFixed(2)}</span>
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
          : `<div style="text-align: center; color: var(--text-sub); padding: 2.5rem 1rem;">
              <i data-lucide="alert-circle" style="width: 44px; height: 44px; color: var(--text-muted); margin-bottom: 0.75rem;"></i>
              <div style="font-weight: 800; color: #ffffff; margin-bottom: 0.35rem; font-size: 1.05rem;">Insufficient Crackers</div>
              <div style="font-size: 0.88rem; color: var(--text-sub); margin-bottom: 0.85rem; max-width: 380px; margin-left: auto; margin-right: auto; line-height: 1.4;">
                Enter a higher Crackers amount in the <strong>Current Crackers <i data-lucide="cookie" style="width:14px;height:14px;vertical-align:middle;display:inline-block;color:var(--secondary-color);"></i> input (top right of the page)</strong> to view item yields for <strong>${c.name} Lunchbox</strong>.
              </div>
              <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255, 159, 67, 0.15); border: 1px solid var(--secondary-color); color: var(--secondary-color); padding: 0.45rem 0.85rem; border-radius: 8px; font-size: 0.8rem; font-weight: 800; cursor: pointer;" onclick="document.getElementById('budget-input')?.focus()">
                <i data-lucide="arrow-up-right" style="width:14px;height:14px;"></i> Click to focus Crackers field (Top Right ↗)
              </div>
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
