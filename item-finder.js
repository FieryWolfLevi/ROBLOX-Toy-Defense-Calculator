let selectedFinderItemName = "Shield Generator";
let currentRarityFilter = "All";
let currentCategoryFilter = "all";

function setCategoryFilter(category, btn) {
  currentCategoryFilter = category;
  btn.parentElement
    .querySelectorAll(".pill")
    .forEach((p) => p.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderItemFinder();
}

function setRarityFilter(rarity, btn) {
  currentRarityFilter = rarity;
  btn.parentElement.querySelectorAll(".pill").forEach((p) => {
    if (
      p.parentElement === btn.parentElement &&
      !p.getAttribute("onclick").includes("setCategoryFilter")
    ) {
      p.classList.remove("active");
    }
  });
  if (btn) btn.classList.add("active");
  renderItemFinder();
}

function selectFinderItem(name) {
  selectedFinderItemName = name;
  renderItemFinder();
}

function renderItemFinder() {
  const grid = document.getElementById("item-cards-grid");
  const searchVal = (document.getElementById("item-search-input")?.value || "")
    .toLowerCase()
    .trim();
  const budgetInput =
    parseFloat(document.getElementById("budget-input")?.value) || 0;
  const toyMult = document.getElementById("extra-toys-checkbox")?.checked
    ? 1.5
    : 1;
  const sortBy = document.getElementById("item-sort-select")?.value || "rarity";
  const rarityOrder = {
    Mythical: 1,
    Legendary: 2,
    Epic: 3,
    Rare: 4,
    Uncommon: 5,
    Common: 6,
  };
  const filtered = itemDatabase
    .filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchVal);
      const matchCategory =
        currentCategoryFilter === "all" ||
        item.category === currentCategoryFilter;
      const matchRarity =
        currentRarityFilter === "All" || item.rarity === currentRarityFilter;
      return matchSearch && matchCategory && matchRarity;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "dps") {
        const dpsA =
          a.stats?.damage && a.stats?.reload_time
            ? a.stats.damage / a.stats.reload_time
            : 0;
        const dpsB =
          b.stats?.damage && b.stats?.reload_time
            ? b.stats.damage / b.stats.reload_time
            : 0;
        if (dpsA === 0 && dpsB === 0) {
          return (b.stats?.damage || 0) - (a.stats?.damage || 0);
        }
        return dpsB - dpsA;
      } else if (sortBy === "dps_weight") {
        const calcDpsPerWeight = (item) => {
          if (item.stats?.damage && item.stats?.reload_time) {
            const dps = item.stats.damage / item.stats.reload_time;
            const w = item.weight !== undefined ? item.weight : item.stats?.weight;
            return w && w > 0 ? dps / w : 0;
          }
          return 0; 
        };
        const dwA = calcDpsPerWeight(a);
        const dwB = calcDpsPerWeight(b);
        if (dwA === dwB) {
          return (b.stats?.damage || 0) - (a.stats?.damage || 0);
        }
        return dwB - dwA;
      } else if (sortBy === "weight") {
        const wA = a.weight !== undefined ? a.weight : (a.stats?.weight || 0);
        const wB = b.weight !== undefined ? b.weight : (b.stats?.weight || 0);
        return wB - wA;
      } else if (sortBy === "health") {
        return (b.stats?.health || 0) - (a.stats?.health || 0);
      } else if (sortBy === "damage") {
        return (b.stats?.damage || 0) - (a.stats?.damage || 0);
      } else if (sortBy === "range") {
        return (b.stats?.range || 0) - (a.stats?.range || 0);
      } else if (sortBy === "rate") {
        return b.rate - a.rate;
      } else {
        return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
      }
    });
  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-sub); padding: 3rem;">No items found matching filter criteria.</div>`;
    renderItemDetail(null, budgetInput, toyMult);
    return;
  }
  if (!filtered.some((x) => x.name === selectedFinderItemName)) {
    selectedFinderItemName = filtered[0].name;
  }
  const r_colors = {
    Mythical: "var(--rarity-mythical)",
    Legendary: "var(--rarity-legendary)",
    Epic: "var(--rarity-epic)",
    Rare: "var(--rarity-rare)",
    Uncommon: "var(--rarity-uncommon)",
    Common: "var(--rarity-common)",
  };
  grid.innerHTML = filtered
    .map((item) => {
      const isSelected = item.name === selectedFinderItemName;
      const bestCrate =
        crates.find((c) => c.bestFor === item.rarity) ||
        crates[crates.length - 1];
      let subBadge = `${item.rarity} ${item.category}`;
      if (sortBy === "dps" && item.stats?.damage) {
        if (item.stats.reload_time) {
          const dps = item.stats.damage / item.stats.reload_time;
          subBadge = item.stats.aoe ? `min. ${dps.toFixed(1)} DPS` : `${dps.toFixed(1)} DPS`;
        } else {
          subBadge = `${item.stats.damage} Single-Use`;
        }
      } else if (sortBy === "dps_weight" && item.stats?.damage) {
        if (item.stats.reload_time) {
          const dps = item.stats.damage / item.stats.reload_time;
          const w = item.weight !== undefined ? item.weight : item.stats?.weight;
          const ratio = w && w > 0 ? dps / w : 0;
          subBadge = item.stats.aoe ? `min. ${ratio.toFixed(1)} DPS/W` : `${ratio.toFixed(1)} DPS/W`;
        } else {
          subBadge = `${item.stats.damage} Single-Use`;
        }
      } else if (sortBy === "weight") {
        const w = item.weight !== undefined ? item.weight : (item.stats?.weight || 0);
        subBadge = `${w} Weight`;
      } else if (sortBy === "health" && item.stats?.health) {
        subBadge = `${item.stats.health} HP`;
      } else if (sortBy === "damage" && item.stats?.damage) {
        subBadge = `${item.stats.damage} DMG`;
      } else if (sortBy === "range" && item.stats?.range) {
        subBadge = `${item.stats.range} Range`;
      }
      return `
        <div class="item-card ${isSelected ? "selected" : ""}" onclick="selectFinderItem('${item.name.replace(/'/g, "\\'")}')">
          <img src="${item.image}" alt="${item.name}" />
          <div class="item-card-name">${item.name}</div>
          <div class="item-card-badge" style="color: ${r_colors[item.rarity] || "#ffffff"};">${subBadge}</div>
          <div class="item-card-best">Best: ${bestCrate.name}</div>
        </div>
      `;
    })
    .join("");
  const activeItem =
    itemDatabase.find((x) => x.name === selectedFinderItemName) || filtered[0];
  renderItemDetail(activeItem, budgetInput, toyMult);

  setTimeout(() => {
    const selectedCard = grid.querySelector(".item-card.selected");
    if (selectedCard) {
      selectedCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, 50);
}

function renderItemDetail(item, budgetInput, toyMult) {
  const s = item?.stats || {};
  const statLabels = [
    { key: "health", label: "Health", icon: "heart", suffix: "" },
    { key: "shield", label: "Shield", icon: "shield", suffix: "" },
    { key: "damage", label: "Damage", icon: "crosshair", suffix: "" },
    { key: "aoe", label: "AOE Radius", icon: "flame", suffix: "" },
    { key: "slow_percent", label: "Slow Amount", icon: "anchor", suffix: "%" },
    {
      key: "slow_duration",
      label: "Slow Duration",
      icon: "clock",
      suffix: "s",
    },
    { key: "reload_time", label: "Reload Time", icon: "timer", suffix: "s" },
    { key: "range", label: "Range", icon: "radio", suffix: "" },
    {
      key: "damage_buff",
      label: "Damage Buff",
      icon: "trending-up",
      suffix: "%",
    },
    { key: "range_buff", label: "Range Buff", icon: "wifi", suffix: "%" },
  ];
  let statsGridHTML = "";
  if (item) {
    statLabels.forEach((st) => {
      let val = s[st.key];
      if (val !== null && val !== undefined) {
        statsGridHTML += `
          <div style="background: rgba(7, 9, 14, 0.6); padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.8rem; color: var(--text-sub); font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;"><i data-lucide="${st.icon}" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i> ${st.label}</span>
            <span style="font-size: 0.95rem; color: #ffffff; font-weight: 900;">${val}${st.suffix}</span>
          </div>
        `;
      }
    });
  }
  const statsSection = statsGridHTML
    ? `
    <div style="margin-bottom: 1rem;">
      <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Item Attributes & Stats</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
        ${statsGridHTML}
      </div>
    </div>
  `
    : "";

  const itemWeight = item ? (item.weight !== undefined ? item.weight : (s.weight !== undefined ? s.weight : null)) : null;
  const weightSection = itemWeight !== null && itemWeight !== undefined
    ? `
    <div style="margin-bottom: 1.25rem; padding-top: 0.75rem; border-top: 1px dashed var(--border-color);">
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(7, 9, 14, 0.6); padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-color);">
        <span style="font-size: 0.8rem; color: var(--text-sub); font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;"><i data-lucide="scale" style="width:14px;height:14px;display:inline-block;vertical-align:middle;color:var(--primary-color);"></i> Placement Weight</span>
        <span style="font-size: 0.95rem; color: #ffffff; font-weight: 900;">${itemWeight}</span>
      </div>
    </div>
  `
    : "";

  const panel = document.getElementById("item-detail-panel");
  if (!panel) return;
  if (!item) {
    panel.innerHTML = `<div style="text-align: center; color: var(--text-sub); padding: 3rem;">Select an item to view details.</div>`;
    return;
  }
  const r_colors = {
    Mythical: "var(--rarity-mythical)",
    Legendary: "var(--rarity-legendary)",
    Epic: "var(--rarity-epic)",
    Rare: "var(--rarity-rare)",
    Uncommon: "var(--rarity-uncommon)",
    Common: "var(--rarity-common)",
  };

  const cratePerformances = crates
    .map((c) => {
      const crate_pct = c[item.rarity.toLowerCase()] || 0;
      const times = Math.floor(
        Math.round(budgetInput * 10000) / Math.round(c.cost * 10000),
      );
      const totalToys = times * c.toys * toyMult;
      const expYield = totalToys * ((crate_pct * item.rate) / 100);
      const perCracker =
        c.cost > 0
          ? (c.toys * toyMult * ((crate_pct * item.rate) / 100)) / c.cost
          : 0;
      return {
        ...c,
        crate_pct,
        times,
        totalToys,
        expYield,
        perCracker,
      };
    })
    .sort((a, b) => b.perCracker - a.perCracker);
  const bestCrate = cratePerformances[0];
  const rowsHTML = cratePerformances
    .map((c, idx) => {
      const isTop = idx === 0;
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.75rem; background: ${isTop ? "rgba(70, 178, 22, 0.12)" : "rgba(7, 9, 14, 0.5)"}; border: 1px solid ${isTop ? "var(--primary-color)" : "var(--border-color)"}; border-radius: 10px; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <img src="${c.image}" alt="${c.name}" style="width: 32px; height: 32px; object-fit: contain;" />
            <div>
              <div style="font-weight: 800; font-size: 0.9rem; color: #ffffff;">${c.name} Lunchbox ${isTop ? '<span style="font-size:0.65rem; background:var(--primary-color); color:#000; padding:2px 6px; border-radius:4px; margin-left:4px;">BEST</span>' : ""}</div>
              <div style="font-size: 0.72rem; color: var(--text-sub);">${c.crate_pct}% ${item.rarity} Rate</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 900; font-size: 0.95rem; color: ${isTop ? "var(--primary-color)" : "#ffffff"};">${c.expYield.toFixed(2)} Expected</div>
            <div style="font-size: 0.72rem; color: var(--text-sub);">${c.perCracker.toFixed(4)} per Cracker</div>
          </div>
        </div>
      `;
    })
    .join("");
  panel.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
      <img src="${item.image}" alt="${item.name}" style="width: 72px; height: 72px; object-fit: contain; background: #000; border-radius: 12px; border: 1.5px solid ${r_colors[item.rarity] || "var(--border-color)"};" />
      <div>
        <div style="font-size: 1.3rem; font-weight: 900; color: #ffffff; line-height: 1.2;">${item.name}</div>
        <div style="font-size: 0.85rem; font-weight: 800; color: ${r_colors[item.rarity]}; margin-top: 2px;">${item.rarity} ${item.category.toUpperCase()}</div>
        <div style="font-size: 0.75rem; color: var(--text-sub); margin-top: 2px;">Exact Drop Rate: ${(item.rate * 100).toFixed(1)}% inside ${item.rarity} tier</div>
      </div>
    </div>
    <div style="background: rgba(70, 178, 22, 0.1); border: 1px solid var(--primary-color); padding: 0.85rem; border-radius: 12px; margin-bottom: 1.25rem;">
      <div style="font-size: 0.7rem; font-weight: 900; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.2rem;">Optimal Lunchbox for ${item.name}</div>
      <div style="font-size: 1.1rem; font-weight: 900; color: #ffffff;">${bestCrate.name} Lunchbox</div>
      <div style="font-size: 0.8rem; color: var(--text-sub); margin-top: 2px;">Yields ~${bestCrate.expYield.toFixed(2)} items with your current budget (${bestCrate.times}x Buys).</div>
    </div>
    ${statsSection}
    ${weightSection}
    <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">Lunchbox Efficiency Comparison</div>
    <div style="max-height: 300px; overflow-y: auto;">
      ${rowsHTML}
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

(function selfCheckItemFinder() {
  if (typeof itemDatabase !== "undefined" && itemDatabase.length > 0) {
    const testItem = itemDatabase[0];
    console.assert(
      testItem.weight !== undefined || (testItem.stats && testItem.stats.weight !== undefined),
      "Self-check failed: Item should have weight property defined in database"
    );
  }
})();
