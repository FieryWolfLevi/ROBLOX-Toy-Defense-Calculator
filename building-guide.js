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
        Building <strong>${targetImmuneH} blocks under your soldier</strong> guarantees an enemy with Range <strong>${rangeStuds} studs</strong> (Size ${enemyX}×${enemyY}×${enemyZ}) can <em>never</em> target your soldier directly. The enemy will instead stop to attack the ground pillar!
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
  circleCalcDebounceTimer = setTimeout(runCircleCalcLogic, 100);
}

function runCircleCalcLogic() {
  const pillarsInput = document.getElementById("circle-pillars-input");
  const aoeInput = document.getElementById("circle-aoe-input");
  const showAoeCheckbox = document.getElementById("circle-show-aoe");
  const resultContainer = document.getElementById("circle-calc-results");
  const canvas = document.getElementById("circle-preview-canvas");

  if (!pillarsInput || !aoeInput || !resultContainer || !canvas) return;

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
              <input type="number" id="circle-pillars-input" value="5" min="1" step="1" oninput="updateCircleCalc()" placeholder="e.g. 5 pillars" />
            </div>

            <div class="guide-input-box">
              <label for="circle-aoe-input">Enemy AOE Radius (Studs):</label>
              <input type="number" id="circle-aoe-input" value="6" min="0" max="200" step="1" oninput="updateCircleCalc()" placeholder="e.g. 6 studs" />
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.6rem;">
            <input type="checkbox" id="circle-show-aoe" checked onchange="updateCircleCalc()" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-color);" />
            <label for="circle-show-aoe" style="cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #ddd;">Show AOE Splash Bubbles on Canvas</label>
          </div>

          <div id="circle-calc-results"></div>

          <div class="circle-canvas-wrapper" style="margin-top: 1rem; text-align: center;">
            <canvas id="circle-preview-canvas" width="340" height="340" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 12px;"></canvas>
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
              <label for="guide-range-input">Enemy Attack Range (Studs):</label>
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
  if (window.lucide) window.lucide.createIcons();
}

// Runnable self-check for non-trivial formulas (Ponytail check)
(function selfCheckBuildingGuideLogic() {
  const targetH25Normal = directTargetImmunityHeight(25, 1.0);
  console.assert(targetH25Normal === 8, "Self-check failed: Normal Range 25 untargetable height should be 8");

  const layout3Aoe = generateMaxDensityPackedLayout(13, 1.0);
  console.assert(layout3Aoe.gridWidth <= 9 && layout3Aoe.gridHeight <= 9, "Self-check failed: 13 pillars with AOE=3 studs must fit inside compact <=9x9 footprint");
})();
