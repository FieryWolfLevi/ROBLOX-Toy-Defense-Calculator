

const STUD_CONVERSION_FACTOR = 1 / 3;

function studsToBlocks(rangeStuds) {
  return rangeStuds * STUD_CONVERSION_FACTOR;
}

function frontEdgeReach(rangeStuds, unitDepth = 1.0) {
  return Math.max(0, studsToBlocks(rangeStuds) - (unitDepth / 2.0));
}

function sideEdgeReach(rangeStuds, unitWidth = 1.0) {
  return Math.max(0, studsToBlocks(rangeStuds) - (unitWidth / 2.0));
}

function topEdgeReach(rangeStuds, unitHeight = 2.0) {
  return Math.max(0, studsToBlocks(rangeStuds) - (unitHeight / 2.0));
}

function directTargetImmunityHeight(rangeStuds, enemyDepthZ = 1.0) {
  const rEff = studsToBlocks(rangeStuds) - 0.5;
  const xMin = 0.5 + (enemyDepthZ / 2.0); 
  if (xMin >= rEff) return 0;
  const maxVertReach = Math.sqrt(rEff * rEff - xMin * xMin);
  return Math.max(0, Math.ceil(maxVertReach));
}

const WEIGHT_BASE_DEFAULT = 300;
const WEIGHT_STEP = 30;

const WEIGHT_MULT = 1.169025;

function calcWeightUpgradeCost(upgradeIndex) {
  if (upgradeIndex <= 0) return 0;
  return 0.1 * Math.pow(WEIGHT_MULT, upgradeIndex - 1);
}

function calcTotalWeightCost(upgradesCount) {
  if (upgradesCount <= 0) return 0;
  return 0.1 * (Math.pow(WEIGHT_MULT, upgradesCount) - 1) / (WEIGHT_MULT - 1);
}

function formatCrackerNumber(num) {
  if (num < 1) {
    return (Math.floor(num * 100 + 0.0001) / 100).toFixed(2);
  }
  if (num < 10) {
    return (Math.round(num * 100) / 100).toFixed(2);
  }
  if (num < 100) {
    return (Math.round(num * 10) / 10).toFixed(1);
  }
  if (num < 1000) {
    return Math.round(num).toString();
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  }
  if (num >= 100000) {
    return Math.round(num / 1000) + "K";
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return (num / 1000).toFixed(2) + "K";
}

function updateWeightCalc() {
  const input = document.getElementById("target-weight-input");
  const vipCheckbox = document.getElementById("weight-vip-pass");
  const resultsBox = document.getElementById("weight-calc-results");
  if (!input || !resultsBox) return;

  const hasVip = vipCheckbox ? vipCheckbox.checked : false;
  const baseWeight = WEIGHT_BASE_DEFAULT + (hasVip ? 150 : 0);

  const rawW = parseInt(input.value) || baseWeight;
  const currentW = Math.max(baseWeight, rawW);

  const upgradesCompleted = Math.floor((currentW - baseWeight) / WEIGHT_STEP);
  const effectiveWeight = baseWeight + upgradesCompleted * WEIGHT_STEP;
  const nextTargetWeight = effectiveWeight + WEIGHT_STEP;

  const nextTierIndex = upgradesCompleted + 1;
  const nextUpgradeCost = calcWeightUpgradeCost(nextTierIndex);
  const totalCumulativeCost = calcTotalWeightCost(upgradesCompleted);

  resultsBox.innerHTML = `
    <div class="guide-stats-grid" style="margin-top: 1rem;">
      <div class="guide-stat-card highlight" style="border-color: #ffd32a;">
        <div class="stat-label" style="color: #ffd32a;">Upgrade Cost (${effectiveWeight} → ${nextTargetWeight})</div>
        <div class="stat-value" style="color: #ffd32a;">${formatCrackerNumber(nextUpgradeCost)} <span class="unit">Crackers</span></div>
      </div>
      <div class="guide-stat-card highlight stat-immune">
        <div class="stat-label">Total Spent So Far</div>
        <div class="stat-value">${formatCrackerNumber(totalCumulativeCost)} <span class="unit">Crackers (from ${baseWeight})</span></div>
      </div>
      <div class="guide-stat-card">
        <div class="stat-label">Completed Upgrades</div>
        <div class="stat-value">${upgradesCompleted} <span class="unit">tiers (${effectiveWeight} Max Weight)</span></div>
      </div>
    </div>
  `;
}

const canvasViewStates = {
  "circle-preview-canvas": { zoom: 1.0, panX: 0, panY: 0, isDragging: false, startX: 0, startY: 0 },
  "tan-spawn-canvas": { zoom: 1.0, panX: 0, panY: 0, isDragging: false, startX: 0, startY: 0 }
};

function zoomCanvas(canvasId, delta) {
  const view = canvasViewStates[canvasId];
  if (!view) return;
  view.zoom = Math.min(4.0, Math.max(0.5, parseFloat((view.zoom + delta).toFixed(2))));
  updateZoomLabel(canvasId);
  triggerCanvasRedraw(canvasId);
}

function resetCanvasZoom(canvasId) {
  const view = canvasViewStates[canvasId];
  if (!view) return;
  view.zoom = 1.0;
  view.panX = 0;
  view.panY = 0;
  updateZoomLabel(canvasId);
  triggerCanvasRedraw(canvasId);
}

function updateZoomLabel(canvasId) {
  const label = document.getElementById(`${canvasId}-zoom-label`);
  const view = canvasViewStates[canvasId];
  if (label && view) {
    label.textContent = `${Math.round(view.zoom * 100)}%`;
  }
}

function triggerCanvasRedraw(canvasId) {
  if (canvasId === "circle-preview-canvas") {
    runCircleCalcLogic();
  } else if (canvasId === "tan-spawn-canvas") {
    runTanSpawnCalcLogic();
  }
}

function attachCanvasInteractions(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas.dataset.hasZoomEvents === "true") return;
  canvas.dataset.hasZoomEvents = "true";

  const view = canvasViewStates[canvasId];
  if (!view) return;

  canvas.style.cursor = "grab";

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    view.zoom = Math.min(4.0, Math.max(0.5, parseFloat((view.zoom + delta).toFixed(2))));
    updateZoomLabel(canvasId);
    triggerCanvasRedraw(canvasId);
  }, { passive: false });

  canvas.addEventListener("mousedown", (e) => {
    view.isDragging = true;
    view.startX = e.clientX - view.panX;
    view.startY = e.clientY - view.panY;
    canvas.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!view.isDragging) return;
    view.panX = e.clientX - view.startX;
    view.panY = e.clientY - view.startY;
    triggerCanvasRedraw(canvasId);
  });

  window.addEventListener("mouseup", () => {
    if (view.isDragging) {
      view.isDragging = false;
      canvas.style.cursor = "grab";
    }
  });

  let touchStartDist = 0;
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      view.isDragging = true;
      view.startX = e.touches[0].clientX - view.panX;
      view.startY = e.touches[0].clientY - view.panY;
    } else if (e.touches.length === 2) {
      view.isDragging = false;
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && view.isDragging) {
      view.panX = e.touches[0].clientX - view.startX;
      view.panY = e.touches[0].clientY - view.startY;
      triggerCanvasRedraw(canvasId);
    } else if (e.touches.length === 2 && touchStartDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist;
      view.zoom = Math.min(4.0, Math.max(0.5, parseFloat((view.zoom * factor).toFixed(2))));
      touchStartDist = dist;
      updateZoomLabel(canvasId);
      triggerCanvasRedraw(canvasId);
    }
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    view.isDragging = false;
    touchStartDist = 0;
  });
}

function updateQuickRangeConverter() {
  const input = document.getElementById("quick-studs-input");
  const outputBlocks = document.getElementById("quick-blocks-output");
  const outputDiameter = document.getElementById("quick-diameter-output");
  if (!input || !outputBlocks || !outputDiameter) return;

  const studs = Math.max(0, parseFloat(input.value) || 0);
  const blocks = studsToBlocks(studs);
  outputBlocks.textContent = blocks.toFixed(3);
  outputDiameter.textContent = (blocks * 2).toFixed(3);
}

function updateSoldierReachCalc() {
  const rangeInput = document.getElementById("soldier-range-input");
  const sizeXInput = document.getElementById("soldier-size-x");
  const sizeYInput = document.getElementById("soldier-size-y");
  const sizeZInput = document.getElementById("soldier-size-z");
  const resultsBox = document.getElementById("soldier-reach-results");

  if (!rangeInput || !sizeXInput || !sizeYInput || !sizeZInput || !resultsBox) return;

  const range = Math.max(0, parseFloat(rangeInput.value) || 0);
  const sizeX = Math.max(0.1, parseFloat(sizeXInput.value) || 1.0);
  const sizeY = Math.max(0.1, parseFloat(sizeYInput.value) || 2.0);
  const sizeZ = Math.max(0.1, parseFloat(sizeZInput.value) || 1.0);

  const centerRadius = studsToBlocks(range);
  const reachX = sideEdgeReach(range, sizeX);
  const reachY = topEdgeReach(range, sizeY);
  const reachZ = frontEdgeReach(range, sizeZ);

  resultsBox.innerHTML = `
    <div class="guide-stats-grid">
      <div class="guide-stat-card highlight">
        <div class="stat-label">Radius from Center</div>
        <div class="stat-value">${centerRadius.toFixed(3)} <span class="unit">blocks</span></div>
      </div>
      <div class="guide-stat-card">
        <div class="stat-label">Side Reach (X Edge)</div>
        <div class="stat-value">${reachX.toFixed(3)} <span class="unit">blocks</span></div>
      </div>
      <div class="guide-stat-card">
        <div class="stat-label">Top Reach (Y Edge)</div>
        <div class="stat-value">${reachY.toFixed(3)} <span class="unit">blocks</span></div>
      </div>
      <div class="guide-stat-card">
        <div class="stat-label">Front Reach (Z Edge)</div>
        <div class="stat-value">${reachZ.toFixed(3)} <span class="unit">blocks</span></div>
      </div>
    </div>
  `;
}

function updateGuideCalc() {
  const rangeInput = document.getElementById("guide-range-input");
  const enemyXInput = document.getElementById("guide-enemy-x");
  const enemyYInput = document.getElementById("guide-enemy-y");
  const enemyZInput = document.getElementById("guide-enemy-z");
  const resultContainer = document.getElementById("guide-calc-results");

  if (!rangeInput || !resultContainer) return;

  const rangeStuds = Math.max(0, parseFloat(rangeInput.value) || 0);
  const enemyX = Math.max(0.1, parseFloat(enemyXInput?.value) || 1.0);
  const enemyY = Math.max(0.1, parseFloat(enemyYInput?.value) || 2.0);
  const enemyZ = Math.max(0.1, parseFloat(enemyZInput?.value) || 1.0);

  const baseRangeBlocks = studsToBlocks(rangeStuds);
  const targetImmuneH = directTargetImmunityHeight(rangeStuds, enemyZ);

  resultContainer.innerHTML = `
    <div class="guide-calc-summary status-immune" style="margin-top: 1rem;">
      <div class="summary-badge">
        <i data-lucide="shield-check"></i>
        <span>REQUIRED UNTARGETABLE PILLAR HEIGHT: ${targetImmuneH} BLOCKS</span>
      </div>
      <div class="summary-details">
        Building <strong>${targetImmuneH} blocks under your soldier</strong> guarantees an enemy with Range <strong>${rangeStuds}</strong> (Size ${enemyX}×${enemyY}×${enemyZ}) can <em>never</em> target your soldier directly. The enemy will instead stop to attack the ground pillar!
      </div>
    </div>

    <div class="guide-stats-grid">
      <div class="guide-stat-card">
        <div class="stat-label">Attack Radius</div>
        <div class="stat-value">${baseRangeBlocks.toFixed(3)} <span class="unit">blocks</span></div>
      </div>
      <div class="guide-stat-card highlight">
        <div class="stat-label">Untargetable Pillar Height</div>
        <div class="stat-value">${targetImmuneH} <span class="unit">blocks</span></div>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

let circleCalcDebounceTimer = null;

function updateCircleCalc() {
  if (circleCalcDebounceTimer) clearTimeout(circleCalcDebounceTimer);
  circleCalcDebounceTimer = setTimeout(runCircleCalcLogic, 60);
}

function runCircleCalcLogic() {
  const pillarsInput = document.getElementById("circle-pillars-input");
  const aoeInput = document.getElementById("circle-aoe-input");
  const showAoeCheckbox = document.getElementById("circle-show-aoe");
  const resultContainer = document.getElementById("circle-calc-results");
  const canvas = document.getElementById("circle-preview-canvas");

  if (!pillarsInput || !aoeInput || !resultContainer || !canvas) return;
  attachCanvasInteractions("circle-preview-canvas");

  const requestedPillars = Math.max(1, parseInt(pillarsInput.value) || 1);
  const aoeStuds = Math.max(0, Math.min(200, parseFloat(aoeInput.value) || 6));
  const aoeBlocks = studsToBlocks(aoeStuds);
  const showAoeBubbles = showAoeCheckbox ? showAoeCheckbox.checked : true;

  const layout = generateMaxDensityPackedLayout(requestedPillars, aoeBlocks);

  resultContainer.innerHTML = `
    <div class="guide-stats-grid" style="margin-top: 1rem;">
      <div class="guide-stat-card highlight">
        <div class="stat-label">Min Block Edge Distance</div>
        <div class="stat-value">${layout.minActualDist.toFixed(3)} <span class="unit">blocks</span></div>
      </div>
      <div class="guide-stat-card highlight stat-immune">
        <div class="stat-label">Grid Bounding Footprint</div>
        <div class="stat-value">${layout.gridWidth} × ${layout.gridHeight} <span class="unit">blocks</span></div>
      </div>
    </div>
  `;

  drawDiscreteGridPreview(canvas, layout.gridSpan, aoeBlocks, layout.coords, showAoeBubbles);
  if (window.lucide) window.lucide.createIcons();
}

function distanceToSquareBlockCell(cx, cz, bx, bz) {
  const minX = bx - 0.5;
  const maxX = bx + 0.5;
  const minZ = bz - 0.5;
  const maxZ = bz + 0.5;

  const dx = Math.max(0, Math.max(minX - cx, cx - maxX));
  const dz = Math.max(0, Math.max(minZ - cz, cz - maxZ));

  return Math.sqrt(dx * dx + dz * dz);
}

function generateMaxDensityPackedLayout(numPillars, aoeBlocks) {
  const minRequiredDist = aoeBlocks - 0.0001; 
  const coords = [];

  for (let ring = 0; ring <= 50 && coords.length < numPillars; ring++) {
    const candidatePoints = [];

    for (let x = -ring; x <= ring; x++) {
      for (let z = -ring; z <= ring; z++) {
        if (Math.max(Math.abs(x), Math.abs(z)) === ring) {
          candidatePoints.push({ x, z, distSq: x * x + z * z });
        }
      }
    }

    candidatePoints.sort((a, b) => a.distSq - b.distSq);

    for (const pt of candidatePoints) {
      if (coords.length >= numPillars) break;

      let isFarEnough = true;
      for (const existing of coords) {
        const distToSquare1 = distanceToSquareBlockCell(existing.x, existing.z, pt.x, pt.z);
        const distToSquare2 = distanceToSquareBlockCell(pt.x, pt.z, existing.x, existing.z);
        const minEdgeDist = Math.min(distToSquare1, distToSquare2);

        if (minEdgeDist < minRequiredDist) {
          isFarEnough = false;
          break;
        }
      }

      if (isFarEnough) {
        coords.push({ x: pt.x, z: pt.z });
      }
    }
  }

  const minActualDist = computeMinSquareBlockDistance(coords);
  let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
  coords.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  });

  const gridWidth = Math.max(1, (maxX - minX) + 1);
  const gridHeight = Math.max(1, (maxZ - minZ) + 1);
  const gridSpan = Math.max(Math.abs(minX), Math.abs(maxX), Math.abs(minZ), Math.abs(maxZ)) + Math.ceil(aoeBlocks) + 1;

  return {
    coords,
    minActualDist: minActualDist === Infinity ? 0 : minActualDist,
    gridWidth,
    gridHeight,
    gridSpan
  };
}

function computeMinSquareBlockDistance(coords) {
  if (coords.length < 2) return Infinity;
  let minDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      const d1 = distanceToSquareBlockCell(coords[i].x, coords[i].z, coords[j].x, coords[j].z);
      const d2 = distanceToSquareBlockCell(coords[j].x, coords[j].z, coords[i].x, coords[i].z);
      const dist = Math.min(d1, d2);
      if (dist < minDist) minDist = dist;
    }
  }
  return minDist;
}

function drawDiscreteGridPreview(canvas, gridSpan, aoeBlocks, pillarCoords, showAoeBubbles = true) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const view = canvasViewStates["circle-preview-canvas"] || { zoom: 1.0, panX: 0, panY: 0 };

  ctx.save();
  ctx.translate(w / 2 + view.panX, h / 2 + view.panY);
  ctx.scale(view.zoom, view.zoom);
  ctx.translate(-w / 2, -h / 2);

  const cellSize = Math.min(w, h) / (gridSpan * 2 + 1);
  const originX = Math.floor(w / 2);
  const originY = Math.floor(h / 2);

  for (let gx = -gridSpan; gx <= gridSpan; gx++) {
    for (let gz = -gridSpan; gz <= gridSpan; gz++) {
      const px = originX + gx * cellSize - cellSize / 2;
      const py = originY + gz * cellSize - cellSize / 2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }

  pillarCoords.forEach(coord => {
    const ppx = originX + coord.x * cellSize;
    const ppy = originY + coord.z * cellSize;

    if (showAoeBubbles && aoeBlocks > 0) {
      ctx.fillStyle = "rgba(235, 77, 75, 0.14)";
      ctx.strokeStyle = "rgba(235, 77, 75, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ppx, ppy, aoeBlocks * cellSize, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    const isCenterPillar = (coord.x === 0 && coord.z === 0);
    const bpx = ppx - cellSize / 2;
    const bpy = ppy - cellSize / 2;
    ctx.fillStyle = isCenterPillar ? "#ff9f43" : "#00d2d3";
    ctx.fillRect(bpx, bpy, cellSize, cellSize);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = isCenterPillar ? 2 : 1.5;
    ctx.strokeRect(bpx, bpy, cellSize, cellSize);
  });

  ctx.restore();
}

let tanCalcDebounceTimer = null;
function updateTanSpawnCalc() {
  if (tanCalcDebounceTimer) clearTimeout(tanCalcDebounceTimer);
  tanCalcDebounceTimer = setTimeout(runTanSpawnCalcLogic, 60);
}

function applyTanSoldierPreset() {
  const select = document.getElementById("tan-soldier-preset-select");
  const input = document.getElementById("tan-soldier-range-input");
  if (!select || !input) return;
  input.value = select.value;
  updateTanSpawnCalc();
}

function applyMinePreset() {
  const select = document.getElementById("tan-mine-preset-select");
  const input = document.getElementById("tan-mine-aoe-input");
  if (!select || !input) return;
  input.value = select.value;
  updateTanSpawnCalc();
}

function getCircularRingBlocks(radius) {
  const blocks = new Map();
  const rCeil = Math.ceil(radius);

  for (let x = -rCeil; x <= rCeil; x++) {
    const val = radius * radius - x * x;
    if (val >= 0) {
      const z = Math.round(Math.sqrt(val));
      blocks.set(`${x},${z}`, { x, z });
      blocks.set(`${x},${-z}`, { x, z: -z });
    }
  }
  for (let z = -rCeil; z <= rCeil; z++) {
    const val = radius * radius - z * z;
    if (val >= 0) {
      const x = Math.round(Math.sqrt(val));
      blocks.set(`${x},${z}`, { x, z });
      blocks.set(`${-x},${z}`, { x: -x, z });
    }
  }
  return Array.from(blocks.values());
}

function get50PercentCoverageTrapBlocks(rInner, rOuter) {
  const blocks = [];
  const maxTrapR = rOuter + 1.0; 
  const rCeil = Math.ceil(maxTrapR);
  const samples = [-0.33, 0, 0.33];

  for (let x = -rCeil; x <= rCeil; x++) {
    for (let z = -rCeil; z <= rCeil; z++) {
      const centerDist = Math.hypot(x, z);
      if (centerDist > maxTrapR + 0.1) continue;

      let insideCount = 0;
      for (const dx of samples) {
        for (const dz of samples) {
          const d = Math.hypot(x + dx, z + dz);
          if (d >= rInner && d <= maxTrapR + 0.05) {
            insideCount++;
          }
        }
      }
      if (insideCount / 9 >= 0.5) {
        blocks.push({ x, z });
      }
    }
  }
  return blocks;
}

function getOptimalMinePositionsInTrapTiles(mineCount, ringBlocks) {
  if (mineCount <= 0 || !ringBlocks || ringBlocks.length === 0) return [];
  const mines = [];
  const used = new Set();

  for (let i = 0; i < mineCount; i++) {
    const angle = (2 * Math.PI * i) / mineCount;
    let best = null;
    let bestScore = Infinity;

    ringBlocks.forEach(pt => {
      const key = `${pt.x},${pt.z}`;
      if (used.has(key)) return;

      const tileAngle = Math.atan2(pt.z, pt.x);
      let angleDiff = Math.abs(tileAngle - angle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

      if (angleDiff < bestScore) {
        bestScore = angleDiff;
        best = pt;
      }
    });

    if (best) {
      used.add(`${best.x},${best.z}`);
      mines.push(best);
    }
  }

  return mines;
}

function runTanSpawnCalcLogic() {
  const rangeInput = document.getElementById("tan-soldier-range-input");
  const enemyRangeInput = document.getElementById("tan-enemy-range-input");
  const mineCountInput = document.getElementById("tan-mine-count-input");
  const mineAoeInput = document.getElementById("tan-mine-aoe-input");
  const showRangeCheckbox = document.getElementById("tan-show-soldier-range");
  const showCrosshairCheckbox = document.getElementById("tan-show-crosshair");
  const showHaloCheckbox = document.getElementById("tan-show-trap-halo");
  const showMinesCheckbox = document.getElementById("tan-show-mines");
  const showMineAoeCheckbox = document.getElementById("tan-show-mine-aoe");
  const resultsBox = document.getElementById("tan-spawn-calc-results");
  const canvas = document.getElementById("tan-spawn-canvas");

  if (!rangeInput || !resultsBox || !canvas) return;
  attachCanvasInteractions("tan-spawn-canvas");

  const soldierRange = Math.max(1, parseFloat(rangeInput.value) || 18);
  const enemyRange = Math.max(0, parseFloat(enemyRangeInput?.value) || 57);
  const mineCount = Math.max(0, parseInt(mineCountInput?.value) || 0);
  const mineAoeStuds = Math.max(0, parseFloat(mineAoeInput?.value) || 0);
  const mineAoeBlocks = mineAoeStuds / 3.0;

  const soldierRangeBlocks = soldierRange / 3.0;
  const enemyRangeBlocks = enemyRange / 3.0;

  const offsetBlocks = Math.round(5 + (enemyRange - 2) * (13 / 55));

  const spawnRadiusBlocks = Math.max(11, Math.round(soldierRangeBlocks + offsetBlocks));
  const innerTrapRadius = Math.max(0, enemyRangeBlocks);
  const outerTrapRadius = spawnRadiusBlocks;
  const gridDiameter = spawnRadiusBlocks * 2 + 1;

  const innerRingBlocks = innerTrapRadius > 0 ? getCircularRingBlocks(innerTrapRadius) : [];
  const ringBlocks = getCircularRingBlocks(spawnRadiusBlocks);
  const trapBlocks = get50PercentCoverageTrapBlocks(innerTrapRadius, outerTrapRadius);
  const minePositions = getOptimalMinePositionsInTrapTiles(mineCount, ringBlocks);

  const showRange = showRangeCheckbox ? showRangeCheckbox.checked : true;
  const showCrosshair = showCrosshairCheckbox ? showCrosshairCheckbox.checked : true;
  const showHalo = showHaloCheckbox ? showHaloCheckbox.checked : true;
  const showMines = showMinesCheckbox ? showMinesCheckbox.checked : true;
  const showMineAoe = showMineAoeCheckbox ? showMineAoeCheckbox.checked : true;

  resultsBox.innerHTML = `
    <div class="guide-stats-grid" style="margin-top: 1rem;">
      <div class="guide-stat-card">
        <div class="stat-label">Center Soldier Range</div>
        <div class="stat-value">${soldierRangeBlocks.toFixed(1)} <span class="unit">blocks</span></div>
      </div>
      <div class="guide-stat-card highlight" style="border-color: #ff4757;">
        <div class="stat-label" style="color: #ff4757;">Tan Spawn Radius</div>
        <div class="stat-value" style="color: #ff4757;">${spawnRadiusBlocks} <span class="unit">blocks (${gridDiameter}×${gridDiameter})</span></div>
      </div>
      <div class="guide-stat-card highlight" style="border-color: #e056fd;">
        <div class="stat-label" style="color: #e056fd;">Trap Tiles (≥50%)</div>
        <div class="stat-value" style="color: #e056fd;">${trapBlocks.length} <span class="unit">blocks</span></div>
      </div>
      <div class="guide-stat-card highlight" style="border-color: #ffd32a;">
        <div class="stat-label" style="color: #ffd32a;">Mines on Spawn Line</div>
        <div class="stat-value" style="color: #ffd32a;">${minePositions.length} <span class="unit">mines (${mineAoeBlocks.toFixed(1)} blk AOE)</span></div>
      </div>
    </div>
  `;

  drawTanSpawnRingPreview(canvas, soldierRangeBlocks, enemyRangeBlocks, spawnRadiusBlocks, innerRingBlocks, ringBlocks, trapBlocks, minePositions, mineAoeBlocks, showRange, showCrosshair, showHalo, showMines, showMineAoe);
  if (window.lucide) window.lucide.createIcons();
}

function drawTanSpawnRingPreview(canvas, soldierRangeBlocks, enemyRangeBlocks, spawnRadiusBlocks, innerRingBlocks, ringBlocks, trapBlocks, minePositions, mineAoeBlocks, showSoldierRange = true, showCrosshair = true, showTrapHalo = true, showMines = true, showMineAoe = true) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const view = canvasViewStates["tan-spawn-canvas"] || { zoom: 1.0, panX: 0, panY: 0 };

  ctx.save();
  ctx.translate(w / 2 + view.panX, h / 2 + view.panY);
  ctx.scale(view.zoom, view.zoom);
  ctx.translate(-w / 2, -h / 2);

  const gridSpan = spawnRadiusBlocks + Math.ceil(mineAoeBlocks) + 3;
  const cellSize = Math.min(w, h) / (gridSpan * 2 + 1);
  const originX = Math.floor(w / 2);
  const originY = Math.floor(h / 2);

  for (let gx = -gridSpan; gx <= gridSpan; gx++) {
    for (let gz = -gridSpan; gz <= gridSpan; gz++) {
      const px = originX + gx * cellSize - cellSize / 2;
      const py = originY + gz * cellSize - cellSize / 2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }

  if (showTrapHalo && trapBlocks.length > 0) {
    const innerSet = new Set((innerRingBlocks || []).map(p => `${p.x},${p.z}`));

    trapBlocks.forEach(pt => {
      if (innerSet.has(`${pt.x},${pt.z}`)) return; 
      const bpx = originX + pt.x * cellSize - cellSize / 2;
      const bpy = originY + pt.z * cellSize - cellSize / 2;

      ctx.fillStyle = "rgba(224, 86, 253, 0.28)";
      ctx.fillRect(bpx, bpy, cellSize, cellSize);
      ctx.strokeStyle = "rgba(224, 86, 253, 0.45)";
      ctx.lineWidth = 0.75;
      ctx.strokeRect(bpx, bpy, cellSize, cellSize);
    });

    (innerRingBlocks || []).forEach(pt => {
      const bpx = originX + pt.x * cellSize - cellSize / 2;
      const bpy = originY + pt.z * cellSize - cellSize / 2;

      ctx.fillStyle = "#be2edd"; 
      ctx.fillRect(bpx, bpy, cellSize, cellSize);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bpx, bpy, cellSize, cellSize);
    });
  }

  if (showCrosshair) {
    for (let gx = -spawnRadiusBlocks; gx <= spawnRadiusBlocks; gx++) {
      if (gx === 0) continue;
      const hpx = originX + gx * cellSize - cellSize / 2;
      const hpy = originY - cellSize / 2;
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(hpx, hpy, cellSize, cellSize);

      const vpx = originX - cellSize / 2;
      const vpy = originY + gx * cellSize - cellSize / 2;
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(vpx, vpy, cellSize, cellSize);
    }
  }

  const innerTrapRadius = Math.max(0, enemyRangeBlocks);

  if (showTrapHalo && innerTrapRadius > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(224, 86, 253, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(originX, originY, innerTrapRadius * cellSize, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  if (showSoldierRange && soldierRangeBlocks > 0) {
    ctx.fillStyle = "rgba(70, 178, 22, 0.14)";
    ctx.strokeStyle = "rgba(70, 178, 22, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(originX, originY, soldierRangeBlocks * cellSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 71, 87, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(originX, originY, spawnRadiusBlocks * cellSize, 0, 2 * Math.PI);
  ctx.stroke();

  ringBlocks.forEach(pt => {
    const bpx = originX + pt.x * cellSize - cellSize / 2;
    const bpy = originY + pt.z * cellSize - cellSize / 2;
    const isCardinalAnchor = (pt.x === 0 || pt.z === 0) && (Math.abs(pt.x) === spawnRadiusBlocks || Math.abs(pt.z) === spawnRadiusBlocks);

    ctx.fillStyle = isCardinalAnchor ? "#b33939" : "#ff4757";
    ctx.fillRect(bpx, bpy, cellSize, cellSize);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bpx, bpy, cellSize, cellSize);
  });

  if (showMines && minePositions.length > 0) {

    if (showMineAoe && mineAoeBlocks > 0) {
      minePositions.forEach(m => {
        const mpx = originX + m.x * cellSize;
        const mpy = originY + m.z * cellSize;

        ctx.fillStyle = "rgba(255, 211, 42, 0.14)";
        ctx.strokeStyle = "rgba(255, 211, 42, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mpx, mpy, mineAoeBlocks * cellSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    }

    minePositions.forEach(m => {
      const mbpx = originX + m.x * cellSize - cellSize / 2;
      const mbpy = originY + m.z * cellSize - cellSize / 2;

      ctx.fillStyle = "#ffd32a";
      ctx.fillRect(mbpx, mbpy, cellSize, cellSize);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mbpx, mbpy, cellSize, cellSize);
    });
  }

  const cpx = originX - cellSize / 2;
  const cpy = originY - cellSize / 2;
  ctx.fillStyle = "#ff9f43";
  ctx.fillRect(cpx, cpy, cellSize, cellSize);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(cpx, cpy, cellSize, cellSize);

  ctx.restore();
}

function renderBuildingGuide() {
  const container = document.getElementById("view-building-guide");
  if (!container) return;

  if (container.children.length === 0) {
    container.innerHTML = `
      <div class="guide-page-layout">

        
        <div class="guide-section-card calc-card">
          <div class="guide-card-header">
            <i data-lucide="crosshair" class="header-icon" style="color: #ff4757;"></i>
            <h2>Tan Spawn Ring & Mine Placement Optimizer</h2>
          </div>

          
          <div class="guide-input-group">
            <div class="guide-input-box">
              <label for="tan-soldier-range-input">Center Soldier Range:</label>
              <input type="number" id="tan-soldier-range-input" value="18" min="1" max="250" step="1" oninput="updateTanSpawnCalc()" placeholder="e.g. 18" />
            </div>

            <div class="guide-input-box">
              <label for="tan-enemy-range-input">Tan Enemy Range:</label>
              <input type="number" id="tan-enemy-range-input" value="57" min="0" max="250" step="1" oninput="updateTanSpawnCalc()" placeholder="e.g. 57 (Wave 49)" />
            </div>
          </div>

          
          <div class="guide-input-group" style="margin-top: 0.5rem; background: rgba(255, 211, 42, 0.04); border: 1px solid rgba(255, 211, 42, 0.2); border-radius: 8px; padding: 0.65rem 0.85rem;">
            <div class="guide-input-box" style="margin-bottom: 0;">
              <label for="tan-mine-count-input" style="color: #ffd32a;">Mine Count (Even Spacing):</label>
              <input type="number" id="tan-mine-count-input" value="8" min="0" max="64" step="1" oninput="updateTanSpawnCalc()" placeholder="e.g. 8 mines" />
            </div>

            <div class="guide-input-box" style="margin-bottom: 0;">
              <label for="tan-mine-aoe-input" style="color: #ffd32a;">Mine AOE Radius:</label>
              <input type="number" id="tan-mine-aoe-input" value="12" min="0" max="100" step="1" oninput="updateTanSpawnCalc()" placeholder="e.g. 12" />
            </div>
          </div>

          
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 0.65rem; flex-wrap: wrap;">
            <div class="guide-input-box" style="flex: 1; min-width: 180px; margin-bottom: 0;">
              <label for="tan-soldier-preset-select" style="font-size: 0.78rem;">Soldier Preset:</label>
              <select id="tan-soldier-preset-select" onchange="applyTanSoldierPreset()" style="background: rgba(7, 9, 14, 0.7); border: 1.5px solid var(--border-color); border-radius: 8px; color: #fff; padding: 0.35rem 0.55rem; width: 100%; outline: none; font-weight: 600; font-size: 0.82rem; cursor: pointer;">
                <option value="18">Hunter (18 Range) - Smallest Ring</option>
                <option value="20">Orbital Shield (20 Range)</option>
                <option value="25">Sniper / Scout (25 Range)</option>
                <option value="33">Shotgunner (33 Range)</option>
                <option value="40">Gunner (40 Range)</option>
                <option value="50">Laser Machinegunner (50 Range)</option>
                <option value="70">Heavy Gunner (70 Range)</option>
                <option value="105">Mortar (105 Range)</option>
                <option value="150">Orbital Laser Station (150 Range)</option>
              </select>
            </div>

            <div class="guide-input-box" style="flex: 1; min-width: 180px; margin-bottom: 0;">
              <label for="tan-mine-preset-select" style="font-size: 0.78rem;">Mine / Trap Preset:</label>
              <select id="tan-mine-preset-select" onchange="applyMinePreset()" style="background: rgba(7, 9, 14, 0.7); border: 1.5px solid var(--border-color); border-radius: 8px; color: #fff; padding: 0.35rem 0.55rem; width: 100%; outline: none; font-weight: 600; font-size: 0.82rem; cursor: pointer;">
                <option value="12">Plasma Mine (AOE 12 / 4 Blocks)</option>
                <option value="14">TNT (AOE 14 / 4.67 Blocks)</option>
                <option value="9">Landmine (AOE 9 / 3 Blocks)</option>
                <option value="3">Plasma Spikes / Spikes (Single Tile)</option>
              </select>
            </div>
          </div>

          
          <div style="display: flex; align-items: center; gap: 1rem; margin-top: 0.85rem; flex-wrap: wrap;">
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #ffd32a;">
              <input type="checkbox" id="tan-show-mines" checked onchange="updateTanSpawnCalc()" style="accent-color: #ffd32a;" /> Show Mines
            </label>
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #ffd32a;">
              <input type="checkbox" id="tan-show-mine-aoe" checked onchange="updateTanSpawnCalc()" style="accent-color: #ffd32a;" /> Show Mine AOE
            </label>
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #e056fd;">
              <input type="checkbox" id="tan-show-trap-halo" checked onchange="updateTanSpawnCalc()" style="accent-color: #e056fd;" /> Show Trap Tiles (≥50%)
            </label>
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #ddd;">
              <input type="checkbox" id="tan-show-soldier-range" checked onchange="updateTanSpawnCalc()" style="accent-color: var(--primary-color);" /> Show Soldier Zone
            </label>
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #ddd;">
              <input type="checkbox" id="tan-show-crosshair" checked onchange="updateTanSpawnCalc()" style="accent-color: #aaa;" /> Show Axes
            </label>
          </div>

          <div id="tan-spawn-calc-results"></div>

          <div class="circle-canvas-wrapper" style="margin-top: 1rem; text-align: center; position: relative; display: inline-block; width: 100%;">
            
            <div class="canvas-zoom-toolbar" style="position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 4px; background: rgba(15, 20, 30, 0.85); backdrop-filter: blur(8px); border: 1px solid var(--border-color); border-radius: 8px; padding: 4px 6px; z-index: 10;">
              <button onclick="zoomCanvas('tan-spawn-canvas', 0.25)" title="Zoom In" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #fff; width: 26px; height: 26px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
              <span id="tan-spawn-canvas-zoom-label" style="font-size: 0.78rem; font-weight: 700; color: #fff; min-width: 40px; text-align: center;">100%</span>
              <button onclick="zoomCanvas('tan-spawn-canvas', -0.25)" title="Zoom Out" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #fff; width: 26px; height: 26px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;">−</button>
              <button onclick="resetCanvasZoom('tan-spawn-canvas')" title="Reset Zoom" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #aaa; width: 26px; height: 26px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">↺</button>
            </div>
            <canvas id="tan-spawn-canvas" width="400" height="400" style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-color); border-radius: 12px; max-width: 100%; height: auto;"></canvas>
          </div>
        </div>

        
        <div class="guide-grid-cards">

          
          <div class="guide-section-card calc-card">
            <div class="guide-card-header">
              <i data-lucide="arrow-right-left" class="header-icon"></i>
              <h2>Range to Block Converter</h2>
            </div>
            <div class="guide-input-box">
              <label for="quick-studs-input">Enter Range:</label>
              <input type="number" id="quick-studs-input" value="25" min="0" step="1" oninput="updateQuickRangeConverter()" />
            </div>

            <div class="quick-calc-display">
              <div class="quick-calc-col">
                <div class="quick-val-title">Radius in Blocks</div>
                <div id="quick-blocks-output" class="quick-val-num">8.333</div>
              </div>
              <div class="quick-calc-divider"></div>
              <div class="quick-calc-col">
                <div class="quick-val-title">Total Diameter</div>
                <div id="quick-diameter-output" class="quick-val-num">16.667</div>
              </div>
            </div>
          </div>

          
          <div class="guide-section-card calc-card">
            <div class="guide-card-header">
              <i data-lucide="box" class="header-icon"></i>
              <h2>Soldier Dimensions & Reach</h2>
            </div>
            <div class="guide-input-group compact">
              <div class="guide-input-box">
                <label for="soldier-range-input">Range:</label>
                <input type="number" id="soldier-range-input" value="25" min="0" step="1" oninput="updateSoldierReachCalc()" />
              </div>
              <div class="guide-input-box">
                <label>Soldier Size (X × Y × Z Blocks):</label>
                <div class="size-inputs-row">
                  <input type="number" id="soldier-size-x" value="1" min="0.1" step="0.5" placeholder="X (Width)" oninput="updateSoldierReachCalc()" title="Width X" />
                  <span class="times-sym">×</span>
                  <input type="number" id="soldier-size-y" value="2" min="0.1" step="0.5" placeholder="Y (Height)" oninput="updateSoldierReachCalc()" title="Height Y" />
                  <span class="times-sym">×</span>
                  <input type="number" id="soldier-size-z" value="1" min="0.1" step="0.5" placeholder="Z (Depth)" oninput="updateSoldierReachCalc()" title="Depth Z" />
                </div>
              </div>
            </div>

            <div id="soldier-reach-results"></div>
          </div>

        </div>

        
        <div class="guide-section-card calc-card">
          <div class="guide-card-header">
            <i data-lucide="disc" class="header-icon"></i>
            <h2>AOE Pillar Spacing Helper</h2>
          </div>

          <div class="guide-input-group">
            <div class="guide-input-box">
              <label for="circle-pillars-input">Pillar Count:</label>
              <input type="number" id="circle-pillars-input" value="5" min="1" step="1" oninput="updateCircleCalc()" placeholder="e.g. 5" />
            </div>

            <div class="guide-input-box">
              <label for="circle-aoe-input">Enemy AOE Radius:</label>
              <input type="number" id="circle-aoe-input" value="6" min="0" max="200" step="1" oninput="updateCircleCalc()" placeholder="e.g. 6" />
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.6rem;">
            <input type="checkbox" id="circle-show-aoe" checked onchange="updateCircleCalc()" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-color);" />
            <label for="circle-show-aoe" style="cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #ddd;">Show AOE Splash Bubbles on Canvas</label>
          </div>

          <div id="circle-calc-results"></div>

          <div class="circle-canvas-wrapper" style="margin-top: 1rem; text-align: center; position: relative; display: inline-block; width: 100%;">
            
            <div class="canvas-zoom-toolbar" style="position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 4px; background: rgba(15, 20, 30, 0.85); backdrop-filter: blur(8px); border: 1px solid var(--border-color); border-radius: 8px; padding: 4px 6px; z-index: 10;">
              <button onclick="zoomCanvas('circle-preview-canvas', 0.25)" title="Zoom In" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #fff; width: 26px; height: 26px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
              <span id="circle-preview-canvas-zoom-label" style="font-size: 0.78rem; font-weight: 700; color: #fff; min-width: 40px; text-align: center;">100%</span>
              <button onclick="zoomCanvas('circle-preview-canvas', -0.25)" title="Zoom Out" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #fff; width: 26px; height: 26px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;">−</button>
              <button onclick="resetCanvasZoom('circle-preview-canvas')" title="Reset Zoom" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #aaa; width: 26px; height: 26px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">↺</button>
            </div>
            <canvas id="circle-preview-canvas" width="360" height="360" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 12px; max-width: 100%; height: auto;"></canvas>
          </div>
        </div>

        
        <div class="guide-section-card calc-card">
          <div class="guide-card-header">
            <i data-lucide="shield-check" class="header-icon"></i>
            <h2>Vertical Immunity Calculator</h2>
          </div>

          <div class="guide-input-group">
            <div class="guide-input-box">
              <label for="guide-range-input">Enemy Attack Range:</label>
              <input type="number" id="guide-range-input" value="25" min="0" step="1" oninput="updateGuideCalc()" />
            </div>

            <div class="guide-input-box">
              <label>Enemy Size (X × Y × Z Blocks):</label>
              <div class="size-inputs-row">
                <input type="number" id="guide-enemy-x" value="1" min="0.1" step="0.5" placeholder="X (Width)" oninput="updateGuideCalc()" title="Width X" />
                <span class="times-sym">×</span>
                <input type="number" id="guide-enemy-y" value="2" min="0.1" step="0.5" placeholder="Y (Height)" oninput="updateGuideCalc()" title="Height Y" />
                <span class="times-sym">×</span>
                <input type="number" id="guide-enemy-z" value="1" min="0.1" step="0.5" placeholder="Z (Depth)" oninput="updateGuideCalc()" title="Depth Z" />
              </div>
            </div>
          </div>

          <div id="guide-calc-results"></div>
        </div>

        
        <div class="guide-section-card" style="margin-top: 1.5rem; background: rgba(15, 20, 30, 0.6); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem 1.4rem;">
          <div class="guide-card-header" style="margin-bottom: 0.85rem;">
            <i data-lucide="scale" class="header-icon" style="color: var(--secondary-color);"></i>
            <h2>Target Weight & Plot Limits Calculator</h2>
          </div>

          
          <div class="guide-input-group" style="margin-bottom: 0.5rem; align-items: center;">
            <div class="guide-input-box" style="margin-bottom: 0; flex: 1;">
              <label for="target-weight-input" style="color: #ffd32a; font-weight: 700;">Enter Current Max Weight:</label>
              <input type="number" id="target-weight-input" value="300" min="300" max="10000" step="30" oninput="updateWeightCalc()" placeholder="e.g. 300" style="border-color: #ffd32a;" />
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1.3rem;">
              <input type="checkbox" id="weight-vip-pass" onchange="updateWeightCalc()" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--secondary-color);" />
              <label for="weight-vip-pass" style="cursor: pointer; font-size: 0.88rem; font-weight: 600; color: #fff;">VIP Gamepass (+150 Base Weight)</label>
            </div>
          </div>

          <div id="weight-calc-results"></div>

          
          <div style="background: rgba(224, 197, 125, 0.08); border: 1px solid rgba(224, 197, 125, 0.25); border-radius: 8px; padding: 0.75rem 1rem; margin-top: 1rem;">
            <div style="font-weight: 700; color: #fff; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
              <i data-lucide="calculator" style="width: 16px; height: 16px; color: var(--secondary-color);"></i>
              Weight Upgrade Scaling Formula:
            </div>
            <div style="font-size: 0.84rem; color: #eee; line-height: 1.5;">
              • Starting base weight is <strong>300</strong> (or <strong>450</strong> with VIP Pass).<br/>
              • Each upgrade purchase adds <strong>+30 Max Weight</strong>.<br/>
              • The upgrade cost formula for tier <em>N</em> is:<br/>
              <code style="display: inline-block; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 4px; color: #ffd32a; font-size: 0.85rem; margin-top: 5px;">Cost(N) = 0.1 × (1.169)^(N - 1) &nbsp;[where N = (Weight − Base) / 30 + 1]</code><br/>
              <code style="display: inline-block; background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 4px; color: #3bf2ff; font-size: 0.85rem; margin-top: 3px;">Total_Cost(N) = 0.1 × ((1.169)^N − 1) / (1.169 − 1)</code>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  updateQuickRangeConverter();
  updateSoldierReachCalc();
  updateGuideCalc();
  updateCircleCalc();
  updateTanSpawnCalc();
  updateWeightCalc();
  if (window.lucide) window.lucide.createIcons();
}

(function selfCheckBuildingGuideLogic() {
  const targetH25Normal = directTargetImmunityHeight(25, 1.0);
  console.assert(targetH25Normal === 8, "Self-check failed: Normal Range 25 untargetable height should be 8");

  const layout3Aoe = generateMaxDensityPackedLayout(13, 1.0);
  console.assert(layout3Aoe.gridWidth <= 9 && layout3Aoe.gridHeight <= 9, "Self-check failed: 13 pillars with AOE=3 studs must fit inside compact <=9x9 footprint");

  const ringBlocks = getCircularRingBlocks(21);
  console.assert(ringBlocks.length > 0, "Self-check failed: Circular ring blocks should generate symmetric discrete points");

  const trapBlocks = get50PercentCoverageTrapBlocks(6.67, 21);
  console.assert(trapBlocks.length > 0, "Self-check failed: 50% coverage trap blocks should generate tiles");

  const mines = getOptimalMinePositionsInTrapTiles(8, ringBlocks);
  console.assert(mines.length === 8, "Self-check failed: 8 mines should generate 8 optimal discrete coordinates on the spawn line");
  console.assert(mines.every(m => ringBlocks.some(rb => rb.x === m.x && rb.z === m.z)), "Self-check failed: All mines must be placed directly on the spawn line");

  const cTier1 = calcWeightUpgradeCost(1);
  console.assert(Math.abs(cTier1 - 0.1) < 0.001, "Self-check failed: Tier 1 upgrade cost must be 0.1");

  const c1740Vip = calcWeightUpgradeCost(44);
  console.assert(Math.abs(c1740Vip - 82.5) < 0.1, "Self-check failed: 1740 Weight (VIP Tier 44) upgrade cost must match 82.5");

  const c1770Vip = calcWeightUpgradeCost(45);
  console.assert(Math.abs(c1770Vip - 96.4) < 0.1, "Self-check failed: 1770 Weight (VIP Tier 45) upgrade cost must match 96.4");

  const cTier81 = calcWeightUpgradeCost(81);
  console.assert(Math.abs(cTier81 - 26700) < 100, "Self-check failed: Tier 81 upgrade cost must match 26.7K");

  const cTier96 = calcWeightUpgradeCost(96);
  console.assert(Math.abs(cTier96 - 277000) < 1000, "Self-check failed: Tier 96 upgrade cost must match 277K");
})();
