// Toy Defense - Building Tips & Guide Script

// Exact Roblox grid unit conversion: 1 Block = 3.0 Roblox Studs (0.3333x)
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
  const xMin = 0.5 + (enemyDepthZ / 2.0); // Min horizontal distance enemy center can reach
  if (xMin >= rEff) return 0;
  const maxVertReach = Math.sqrt(rEff * rEff - xMin * xMin);
  return Math.max(0, Math.ceil(maxVertReach));
}

// ----------------------------------------------------
// Canvas Zoom & Pan Controller
// ----------------------------------------------------

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

  // Mouse Wheel Zoom
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    view.zoom = Math.min(4.0, Math.max(0.5, parseFloat((view.zoom + delta).toFixed(2))));
    updateZoomLabel(canvasId);
    triggerCanvasRedraw(canvasId);
  }, { passive: false });

  // Mouse Drag Pan
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

  // Touch Support for Mobile / Tablets
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

// ----------------------------------------------------
// Event Handlers & Live Updates
// ----------------------------------------------------

// Quick Converter: Range to Blocks
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

// Soldier Size & Reach Calculator
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

// Vertical Immunity Calculator
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

// Maximum Density 2D Grid Shape Builder & Anti-AOE Spacing Calculator
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

  // Compute maximum density grid packing layout with exact minimum tile clearance
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

  // Draw 2D Discrete Roblox Grid Map
  drawDiscreteGridPreview(canvas, layout.gridSpan, aoeBlocks, layout.coords, showAoeBubbles);
  if (window.lucide) window.lucide.createIcons();
}

// Minimum distance from center (cx, cz) to closest point on 1x1 square block cell (bx, bz)
function distanceToSquareBlockCell(cx, cz, bx, bz) {
  const minX = bx - 0.5;
  const maxX = bx + 0.5;
  const minZ = bz - 0.5;
  const maxZ = bz + 0.5;

  const dx = Math.max(0, Math.max(minX - cx, cx - maxX));
  const dz = Math.max(0, Math.max(minZ - cz, cz - maxZ));

  return Math.sqrt(dx * dx + dz * dz);
}

// Ultra-compact 2D discrete grid packing algorithm evaluating exact integer block cell distances
function generateMaxDensityPackedLayout(numPillars, aoeBlocks) {
  const minRequiredDist = aoeBlocks - 0.0001; // >= AOE Blocks
  const coords = [];

  // Expand in radial grid rings from (0,0) outwards
  for (let ring = 0; ring <= 50 && coords.length < numPillars; ring++) {
    const candidatePoints = [];

    for (let x = -ring; x <= ring; x++) {
      for (let z = -ring; z <= ring; z++) {
        if (Math.max(Math.abs(x), Math.abs(z)) === ring) {
          candidatePoints.push({ x, z, distSq: x * x + z * z });
        }
      }
    }

    // Sort candidate points by radial distance from origin (0,0)
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

  // 1. Draw Grid Background Blocks
  for (let gx = -gridSpan; gx <= gridSpan; gx++) {
    for (let gz = -gridSpan; gz <= gridSpan; gz++) {
      const px = originX + gx * cellSize - cellSize / 2;
      const py = originY + gz * cellSize - cellSize / 2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }

  // 2. Draw Pillar Grid Blocks & AOE Splash Areas
  pillarCoords.forEach(coord => {
    const ppx = originX + coord.x * cellSize;
    const ppy = originY + coord.z * cellSize;

    // AOE Splash Radius Circle (only if showAoeBubbles is enabled)
    if (showAoeBubbles && aoeBlocks > 0) {
      ctx.fillStyle = "rgba(235, 77, 75, 0.14)";
      ctx.strokeStyle = "rgba(235, 77, 75, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ppx, ppy, aoeBlocks * cellSize, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // Pillar Block Cell Highlight (Orange highlight if at (0,0), Cyan for outer pillars)
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

// ----------------------------------------------------
// Tan Spawn Ring Calculator & Visualizer
// ----------------------------------------------------

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

// High-circularity 8-way symmetric Euclidean raster circle
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

// Calculate discrete 1x1 block cells that have >= 50% geometric area coverage inside the trap ring
function get50PercentCoverageTrapBlocks(rInner, rOuter) {
  const blocks = [];
  const rMax = Math.ceil(rOuter + 1);
  const samples = [-0.33, 0, 0.33];

  for (let x = -rMax; x <= rMax; x++) {
    for (let z = -rMax; z <= rMax; z++) {
      let insideCount = 0;
      for (const dx of samples) {
        for (const dz of samples) {
          const d = Math.sqrt((x + dx) ** 2 + (z + dz) ** 2);
          if (d >= rInner && d <= rOuter) {
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

// Calculate optimal, evenly-distributed mine placement positions STRICTLY WITHIN the Trap Tiles
function getOptimalMinePositionsInTrapTiles(mineCount, rInner, rOuter, trapBlocks) {
  if (mineCount <= 0 || !trapBlocks || trapBlocks.length === 0) return [];
  const mines = [];
  const used = new Set();
  const targetR = (rInner + rOuter) / 2;

  for (let i = 0; i < mineCount; i++) {
    const angle = (2 * Math.PI * i) / mineCount;
    let best = null;
    let bestScore = Infinity;

    trapBlocks.forEach(pt => {
      const key = `${pt.x},${pt.z}`;
      if (used.has(key)) return;

      const tileAngle = Math.atan2(pt.z, pt.x);
      let angleDiff = Math.abs(tileAngle - angle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

      const r = Math.hypot(pt.x, pt.z);
      const rDiff = Math.abs(r - targetR);

      // Score prioritizes exact radial angle alignment while favoring middle radius of the trap band
      const score = angleDiff * 12 + rDiff;
      if (score < bestScore) {
        bestScore = score;
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
  const resultsBox = document.getElementById("tan-spawn-calc-results");
  const canvas = document.getElementById("tan-spawn-canvas");

  if (!rangeInput || !resultsBox || !canvas) return;
  attachCanvasInteractions("tan-spawn-canvas");

  const soldierRange = Math.max(1, parseFloat(rangeInput.value) || 18);
  const enemyRange = Math.max(0, parseFloat(enemyRangeInput?.value) || 20);
  const mineCount = Math.max(0, parseInt(mineCountInput?.value) || 0);
  const mineAoeStuds = Math.max(0, parseFloat(mineAoeInput?.value) || 0);
  const mineAoeBlocks = mineAoeStuds / 3.0;

  const soldierRangeBlocks = soldierRange / 3.0;
  const enemyRangeBlocks = enemyRange / 3.0;

  // Dynamic spawn offset based on Tan enemy range:
  // Range 20 Tan -> 12 blocks, Range 45 Tan -> 15 blocks
  let offsetBlocks = 12;
  if (enemyRange <= 20) {
    offsetBlocks = Math.max(8, Math.round(12 - (20 - enemyRange) * 0.2));
  } else {
    offsetBlocks = Math.round(12 + (enemyRange - 20) * (3 / 25));
  }

  const spawnRadiusBlocks = Math.round(soldierRangeBlocks + offsetBlocks);
  const innerTrapRadius = Math.max(0, enemyRangeBlocks);
  const outerTrapRadius = spawnRadiusBlocks;
  const gridDiameter = spawnRadiusBlocks * 2 + 1;

  const ringBlocks = getCircularRingBlocks(spawnRadiusBlocks);
  const trapBlocks = get50PercentCoverageTrapBlocks(innerTrapRadius, outerTrapRadius);
  const minePositions = getOptimalMinePositionsInTrapTiles(mineCount, innerTrapRadius, outerTrapRadius, trapBlocks);

  const showRange = showRangeCheckbox ? showRangeCheckbox.checked : true;
  const showCrosshair = showCrosshairCheckbox ? showCrosshairCheckbox.checked : true;
  const showHalo = showHaloCheckbox ? showHaloCheckbox.checked : true;
  const showMines = showMinesCheckbox ? showMinesCheckbox.checked : true;
  const showMineAoeCheckbox = document.getElementById("tan-show-mine-aoe");
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
        <div class="stat-label" style="color: #ffd32a;">Mines Placed in Trap Tiles</div>
        <div class="stat-value" style="color: #ffd32a;">${minePositions.length} <span class="unit">mines (${mineAoeBlocks.toFixed(1)} blk AOE)</span></div>
      </div>
    </div>
  `;

  drawTanSpawnRingPreview(canvas, soldierRangeBlocks, enemyRangeBlocks, spawnRadiusBlocks, ringBlocks, trapBlocks, minePositions, mineAoeBlocks, showRange, showCrosshair, showHalo, showMines, showMineAoe);
  if (window.lucide) window.lucide.createIcons();
}

function drawTanSpawnRingPreview(canvas, soldierRangeBlocks, enemyRangeBlocks, spawnRadiusBlocks, ringBlocks, trapBlocks, minePositions, mineAoeBlocks, showSoldierRange = true, showCrosshair = true, showTrapHalo = true, showMines = true, showMineAoe = true) {
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

  // 1. Draw Grid Background Blocks
  for (let gx = -gridSpan; gx <= gridSpan; gx++) {
    for (let gz = -gridSpan; gz <= gridSpan; gz++) {
      const px = originX + gx * cellSize - cellSize / 2;
      const py = originY + gz * cellSize - cellSize / 2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }

  // 2. Draw Discrete Trap Placement Blocks (>= 50% coverage)
  if (showTrapHalo && trapBlocks.length > 0) {
    trapBlocks.forEach(pt => {
      const bpx = originX + pt.x * cellSize - cellSize / 2;
      const bpy = originY + pt.z * cellSize - cellSize / 2;

      ctx.fillStyle = "rgba(224, 86, 253, 0.28)";
      ctx.fillRect(bpx, bpy, cellSize, cellSize);
      ctx.strokeStyle = "rgba(224, 86, 253, 0.45)";
      ctx.lineWidth = 0.75;
      ctx.strokeRect(bpx, bpy, cellSize, cellSize);
    });
  }

  // 3. Draw Crosshair Axes if enabled
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

  // 4. Draw Crisp Vector Guide Circles (High Circularity)
  const innerTrapRadius = Math.max(0, enemyRangeBlocks);

  // Inner trap engagement boundary guide
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

  // Soldier Attack Range Zone Circle
  if (showSoldierRange && soldierRangeBlocks > 0) {
    ctx.fillStyle = "rgba(70, 178, 22, 0.14)";
    ctx.strokeStyle = "rgba(70, 178, 22, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(originX, originY, soldierRangeBlocks * cellSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  // Outer Tan Spawn Guide Circle (Smooth Circular Stroke)
  ctx.strokeStyle = "rgba(255, 71, 87, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(originX, originY, spawnRadiusBlocks * cellSize, 0, 2 * Math.PI);
  ctx.stroke();

  // 5. Draw High-Circularity Symmetric Discrete Red Pixel Spawn Ring Blocks
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

  // 6. Draw Optimal Mine Positions & AOE Bubbles (strictly inside Trap Tiles)
  if (showMines && minePositions.length > 0) {
    // A. Draw Mine AOE Splash Radius Bubbles
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

    // B. Draw Discrete Mine Tiles (Bright Gold Marker)
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

  // 7. Draw Center Soldier Marker at (0,0)
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

  // Only populate DOM if empty to avoid unnecessary re-renders
  if (container.children.length === 0) {
    container.innerHTML = `
      <div class="guide-page-layout">
        
        <!-- Top Card: AOE Pillar Spacing Helper -->
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
            <!-- Floating Zoom Toolbar -->
            <div class="canvas-zoom-toolbar" style="position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 4px; background: rgba(15, 20, 30, 0.85); backdrop-filter: blur(8px); border: 1px solid var(--border-color); border-radius: 8px; padding: 4px 6px; z-index: 10;">
              <button onclick="zoomCanvas('circle-preview-canvas', 0.25)" title="Zoom In" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #fff; width: 26px; height: 26px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
              <span id="circle-preview-canvas-zoom-label" style="font-size: 0.78rem; font-weight: 700; color: #fff; min-width: 40px; text-align: center;">100%</span>
              <button onclick="zoomCanvas('circle-preview-canvas', -0.25)" title="Zoom Out" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #fff; width: 26px; height: 26px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;">−</button>
              <button onclick="resetCanvasZoom('circle-preview-canvas')" title="Reset Zoom" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #aaa; width: 26px; height: 26px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">↺</button>
            </div>
            <canvas id="circle-preview-canvas" width="360" height="360" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 12px; max-width: 100%; height: auto;"></canvas>
          </div>
        </div>

        <!-- Tan Spawn Ring Visualizer Card -->
        <div class="guide-section-card calc-card" style="margin-top: 1.5rem;">
          <div class="guide-card-header">
            <i data-lucide="crosshair" class="header-icon" style="color: #ff4757;"></i>
            <h2>Tan Spawn Ring & Mine Placement Optimizer</h2>
          </div>

          <!-- Soldier & Enemy Range Inputs -->
          <div class="guide-input-group">
            <div class="guide-input-box">
              <label for="tan-soldier-range-input">Center Soldier Range:</label>
              <input type="number" id="tan-soldier-range-input" value="18" min="1" max="250" step="1" oninput="updateTanSpawnCalc()" placeholder="e.g. 18" />
            </div>

            <div class="guide-input-box">
              <label for="tan-enemy-range-input">Tan Enemy Range:</label>
              <input type="number" id="tan-enemy-range-input" value="20" min="0" max="250" step="1" oninput="updateTanSpawnCalc()" placeholder="e.g. 20" />
            </div>
          </div>

          <!-- Mine Placement Inputs -->
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

          <!-- Presets Row -->
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

          <!-- Toggles Row -->
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
            <!-- Floating Zoom Toolbar -->
            <div class="canvas-zoom-toolbar" style="position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 4px; background: rgba(15, 20, 30, 0.85); backdrop-filter: blur(8px); border: 1px solid var(--border-color); border-radius: 8px; padding: 4px 6px; z-index: 10;">
              <button onclick="zoomCanvas('tan-spawn-canvas', 0.25)" title="Zoom In" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #fff; width: 26px; height: 26px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
              <span id="tan-spawn-canvas-zoom-label" style="font-size: 0.78rem; font-weight: 700; color: #fff; min-width: 40px; text-align: center;">100%</span>
              <button onclick="zoomCanvas('tan-spawn-canvas', -0.25)" title="Zoom Out" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #fff; width: 26px; height: 26px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;">−</button>
              <button onclick="resetCanvasZoom('tan-spawn-canvas')" title="Reset Zoom" style="background: rgba(255,255,255,0.1); border: none; border-radius: 4px; color: #aaa; width: 26px; height: 26px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">↺</button>
            </div>
            <canvas id="tan-spawn-canvas" width="400" height="400" style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-color); border-radius: 12px; max-width: 100%; height: auto;"></canvas>
          </div>
        </div>

        <!-- Middle Row: Range-to-Block & Soldier Size Calculators -->
        <div class="guide-grid-cards">
          
          <!-- Quick Converter Card -->
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

          <!-- Soldier Dimensions Reach Calculator -->
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

        <!-- Bottom Row: Vertical Immunity Calculator Card -->
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

      </div>
    `;
  }

  updateQuickRangeConverter();
  updateSoldierReachCalc();
  updateGuideCalc();
  updateCircleCalc();
  updateTanSpawnCalc();
  if (window.lucide) window.lucide.createIcons();
}

// Runnable self-check for non-trivial formulas (Ponytail check)
(function selfCheckBuildingGuideLogic() {
  const targetH25Normal = directTargetImmunityHeight(25, 1.0);
  console.assert(targetH25Normal === 8, "Self-check failed: Normal Range 25 untargetable height should be 8");

  const layout3Aoe = generateMaxDensityPackedLayout(13, 1.0);
  console.assert(layout3Aoe.gridWidth <= 9 && layout3Aoe.gridHeight <= 9, "Self-check failed: 13 pillars with AOE=3 studs must fit inside compact <=9x9 footprint");

  const ringBlocks = getCircularRingBlocks(21);
  console.assert(ringBlocks.length > 0, "Self-check failed: Circular ring blocks should generate symmetric discrete points");

  const trapBlocks = get50PercentCoverageTrapBlocks(6.67, 21);
  console.assert(trapBlocks.length > 0, "Self-check failed: 50% coverage trap blocks should generate tiles");

  const mines = getOptimalMinePositionsInTrapTiles(8, 6.67, 21, trapBlocks);
  console.assert(mines.length === 8, "Self-check failed: 8 mines should generate 8 optimal discrete coordinates inside trap blocks");
  console.assert(mines.every(m => trapBlocks.some(tb => tb.x === m.x && tb.z === m.z)), "Self-check failed: All mines must be placed inside trap blocks");
})();
