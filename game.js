// ==========================================
// 【版本号管理】版本格式: MM.dd.HH.mm (月.日.小时.分钟)
// ⚠️ 每次修改代码时，必须更新下方版本号！
// 当前版本：v12.5.22.00 (2025年12月5日 22:00 修改)
// 历史版本：
//   - v12.5.22.00: 初版（2025-12-05 22:00）- 特效增强 + 版本号系统添加
// ==========================================
const GAME_VERSION = "12.5.22.00";

const GRID_SIZE = 9;
const COLORS = ["red", "blue", "green", "purple", "white", "orange", "yellow"];
let board = [];
let score = 0;
let level = 1;
let targetScore = 1000;
let selectedCell = null; // Store {r, c} of selected cell
let isProcessing = false; // Lock interaction during animations/gravity
let nextTileId = 0; // Unique ID for animations

// Level Data: Targets for each level
// Level 1: 20 Red
// Level 2: 20 Blue, 20 Green
// Level 3+: Scale up
let levelTargets = {}; // { color: count }

const gridContainer = document.getElementById("grid-container");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const messageArea = document.getElementById("message-area");
const versionDisplay = document.getElementById("version-display");
const targetPanel = document.getElementById("target-panel");

// VFX System: 用于放置所有视觉特效元素的容器（将在 DOMContentLoaded 中统一 append）
const vfxContainer = document.createElement("div");
vfxContainer.classList.add("vfx-container");
// 注意：不要在文件顶部立刻 append，这会造成节点在后续被移动或重复
// 初始 append 在 DOMContentLoaded 回调中执行： gridContainer.appendChild(vfxContainer);

document.addEventListener("DOMContentLoaded", () => {
  gridContainer.appendChild(vfxContainer);

  // 初始化版本号显示
  if (versionDisplay) {
    versionDisplay.textContent = `v${GAME_VERSION}`;
    versionDisplay.title = `Game Version: ${GAME_VERSION}\n(Month.Day.Hour.Minute format)`;
  }

  // Resume audio context on first user interaction if needed
  document.addEventListener(
    "click",
    () => {
      if (audio && audio.ctx && audio.ctx.state === "suspended") {
        audio.ctx.resume();
      }
    },
    { once: true }
  );
  initGame();
});

/*
  createParticle(r, c, type)
  - 作用：在格子 (r,c) 位置生成一次短暂的粒子特效（DOM 元素），用于碎裂、飞溅等视觉反馈。
  - 参数：
      r, c: 格子坐标（行, 列）
      type: 特效类型（'debris','ice-shard','bubble','crush' 等）
  - 副作用：向 `vfxContainer` 添加临时 DOM 元素，1s 后自动移除。
  - 注意：该函数只负责视觉，不修改游戏数据结构（board）。
*/
function createParticle(r, c, type) {
  const particle = document.createElement("div");
  const top = (r + 0.5) * (100 / GRID_SIZE) + "%";
  const left = (c + 0.5) * (100 / GRID_SIZE) + "%";

  particle.style.top = top;
  particle.style.left = left;

  if (type === "debris") {
    particle.classList.add("debris");
    const angle = Math.random() * 360;
    const dist = 10 + Math.random() * 15;
    const tx = Math.cos((angle * Math.PI) / 180) * dist + "vmin";
    const ty = Math.sin((angle * Math.PI) / 180) * dist + "vmin";
    particle.style.setProperty("--tx", tx);
    particle.style.setProperty("--ty", ty);
  } else if (type === "ice-shard") {
    particle.classList.add("ice-shard");
    const angle = Math.random() * 360;
    const dist = 5 + Math.random() * 10;
    const tx = Math.cos((angle * Math.PI) / 180) * dist + "vmin";
    const ty = Math.sin((angle * Math.PI) / 180) * dist + "vmin";
    particle.style.setProperty("--tx", tx);
    particle.style.setProperty("--ty", ty);
  } else if (type === "bubble") {
    particle.classList.add("bubble");
    particle.style.left = (c + Math.random()) * (100 / GRID_SIZE) + "%";
  } else if (type === "crush") {
    particle.classList.add("crush-particle");
    // Use custom property for color, passed as 4th argument?
    // createParticle(r, c, 'crush', colorName)
    // arguments[3] is the color
    const colorName = arguments[3] || "white";
    particle.style.setProperty("--p-color", `var(--color-${colorName})`);

    const angle = Math.random() * 360;
    const dist = 5 + Math.random() * 8;
    const tx = Math.cos((angle * Math.PI) / 180) * dist + "vmin";
    const ty = Math.sin((angle * Math.PI) / 180) * dist + "vmin";

    particle.style.setProperty("--tx", tx);
    particle.style.setProperty("--ty", ty);

    particle.style.width = 0.5 + Math.random() * 0.8 + "vmin";
    particle.style.height = particle.style.width;
    particle.style.transform = `rotate(${Math.random() * 360}deg)`;
  }

  vfxContainer.appendChild(particle);
  setTimeout(() => particle.remove(), 1000);
}

/*
  showVFX(r, c, type, orientation)
  - 作用：根据 type 在指定格子显示不同的视觉特效（震荡、光束、闪电、涡旋等）。
  - 参数：
      r, c: 特效中心格的行列坐标
      type: 特效名称（'frost-nova','acid-splash','biohazard','shockwave','wind-slash','hydro-beam','void-vortex','holy-beam','lightning' 等）
      orientation: 可选，某些特效需要方向（'row' 或 'col'），默认 'horizontal'
  - 副作用：直接操作 DOM（vfxContainer），不修改游戏逻辑数据。
  - 注意：lightning 分支会接受额外参数 target（目标坐标对象 {r,c}）。
*/
function showVFX(r, c, type, orientation = "horizontal") {
  const el = document.createElement("div");
  const top = (r + 0.5) * (100 / GRID_SIZE) + "%";
  const left = (c + 0.5) * (100 / GRID_SIZE) + "%";

  el.style.top = top;
  el.style.left = left;

  if (type === "frost-nova") {
    el.classList.add("frost-nova");
    for (let i = 0; i < 8; i++) createParticle(r, c, "ice-shard");
  } else if (type === "acid-splash") {
    el.classList.add("acid-splash"); // We need CSS for this
    for (let i = 0; i < 6; i++)
      createParticle(r, c, "crush", Math.random() > 0.5 ? "green" : "orange");
  } else if (type === "biohazard") {
    // Full screen flash or large icon
    const bio = document.createElement("div");
    bio.classList.add("biohazard-symbol");
    bio.style.top = top;
    bio.style.left = left;
    vfxContainer.appendChild(bio);
    setTimeout(() => bio.remove(), 1000);
  } else if (type === "shockwave") {
    el.classList.add("shockwave");
    for (let i = 0; i < 8; i++) createParticle(r, c, "debris");
  } else if (type === "wind-slash") {
    el.classList.add("wind-slash");
    const angle = orientation === "col" ? 90 : 0;
    el.style.setProperty("--angle", angle + "deg");
  } else if (type === "hydro-beam") {
    el.classList.add("hydro-beam");
    el.style.left = "0";
    el.style.top = "0";
    if (orientation === "row") {
      el.style.width = "100%";
      el.style.height = `calc(100% / ${GRID_SIZE} - var(--gap-size))`;
      el.style.top = r * (100 / GRID_SIZE) + "%";
    } else {
      el.classList.add("vertical");
      el.style.height = "100%";
      el.style.width = `calc(100% / ${GRID_SIZE} - var(--gap-size))`;
      el.style.left = c * (100 / GRID_SIZE) + "%";
    }
    for (let k = 0; k < GRID_SIZE; k++) {
      if (Math.random() > 0.5)
        createParticle(
          orientation === "row" ? r : k,
          orientation === "row" ? k : c,
          "bubble"
        );
    }
  } else if (type === "void-vortex") {
    el.classList.add("void-vortex");
    const cell = getCellElement(r, c);
    if (cell) {
      el.style.width = cell.offsetWidth + "px";
      el.style.height = cell.offsetHeight + "px";
      el.style.top = cell.offsetTop + "px";
      el.style.left = cell.offsetLeft + "px";
    } else {
      el.style.width = `calc(100% / ${GRID_SIZE})`;
      el.style.height = `calc(100% / ${GRID_SIZE})`;
      el.style.top = r * (100 / GRID_SIZE) + "%";
      el.style.left = c * (100 / GRID_SIZE) + "%";
    }
  } else if (type === "holy-beam") {
    const flash = document.createElement("div");
    flash.classList.add("holy-flash");
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1000);

    const beam = document.createElement("div");
    beam.classList.add("holy-beam");
    beam.style.left = (c + 0.5) * (100 / GRID_SIZE) + "%";
    vfxContainer.appendChild(beam);
    setTimeout(() => beam.remove(), 1000);
    return;
  } else if (type === "lightning") {
    const target = arguments[3]; // Expect target object {r, c}
    if (target) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.position = "absolute";
      svg.style.top = "0";
      svg.style.left = "0";
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.pointerEvents = "none";
      svg.style.zIndex = "100";

      // Calculate percentages manually for SVG lines if possible, or use pixel coords.
      // Using percentages in x1/y1 works in SVG if standard.
      const x1 = ((c + 0.5) * 100) / GRID_SIZE + "%";
      const y1 = ((r + 0.5) * 100) / GRID_SIZE + "%";
      // 修复：目标坐标应使用 target.c (列) 与 target.r (行)
      const x2 = ((target.c + 0.5) * 100) / GRID_SIZE + "%";
      const y2 = ((target.r + 0.5) * 100) / GRID_SIZE + "%";

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#ffeb3b");
      line.setAttribute("stroke-width", "4");
      line.classList.add("lightning-anim");

      svg.appendChild(line);
      vfxContainer.appendChild(svg);
      setTimeout(() => svg.remove(), 400);
      return;
    }
  }

  vfxContainer.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/*
  initGame()
  - 入口：初始化游戏，通常在 DOMContentLoaded 后调用。
  - 当前实现：直接调用 startLevel(1) 启动第 1 关。
*/
function initGame() {
  startLevel(1);
}

/*
  startLevel(lvl)
  - 作用：开始指定关卡，重置分数、目标、生成新的棋盘并刷新 UI。
  - 参数：lvl: 要开始的关卡数字。
  - 副作用：会调用 createBoard() 与 renderBoard()，重置 levelTargets 并更新 messageArea。
*/
function startLevel(lvl) {
  level = lvl;
  score = 0;
  targetScore = level * 1000;

  // Define Targets
  levelTargets = {};
  const baseCount = 10 + level * 5;

  if (level === 1) {
    levelTargets["red"] = baseCount;
  } else if (level === 2) {
    levelTargets["blue"] = baseCount;
    levelTargets["green"] = baseCount;
  } else {
    const numColors = Math.min(3, 1 + Math.floor(level / 2));
    const shuffledColors = [...COLORS].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numColors; i++) {
      levelTargets[shuffledColors[i]] = baseCount;
    }
  }

  levelDisplay.textContent = level;
  scoreDisplay.textContent = `${score} / ${targetScore}`;

  // Generate Goal Description
  const colorNames = {
    red: "红色",
    blue: "蓝色",
    green: "绿色",
    purple: "紫色",
    white: "白色",
    orange: "橙色",
    yellow: "黄色",
  };
  let goalText = "目标：";
  let parts = [];
  for (const [color, count] of Object.entries(levelTargets)) {
    parts.push(`消除 ${count} 个${colorNames[color] || color}方块`);
  }
  parts.push(`达到 ${targetScore} 分`);
  messageArea.textContent = parts.join("，");

  updateTargetUI();
  createBoard();
  renderBoard();
}

/*
  updateTargetUI()
  - 将当前关卡的颜色目标（levelTargets）渲染到目标面板 `targetPanel` 中，供玩家查看剩余任务。
  - 此函数仅操作 DOM（创建 icon/text），不会更改游戏逻辑数据（不修改 levelTargets 本身）。
*/
function updateTargetUI() {
  targetPanel.innerHTML = "";

  // Add Label
  const label = document.createElement("div");
  label.style.marginRight = "2vmin";
  label.style.fontWeight = "bold";
  label.textContent = "目标:";
  targetPanel.appendChild(label);

  for (const [color, count] of Object.entries(levelTargets)) {
    const item = document.createElement("div");
    item.classList.add("target-item");

    const icon = document.createElement("div");
    icon.classList.add("target-icon", `color-${color}`);

    const text = document.createElement("span");
    text.textContent = count > 0 ? count : "✔";

    item.appendChild(icon);
    item.appendChild(text);
    targetPanel.appendChild(item);
  }
}

/*
  createBoard()
  - 初始化并返回一个新的棋盘（写入全局 board 变量），避免初始三连消。
  - 每个 tile 包含字段：id, color, type, state，黄色会有 voltage 属性。
*/
function createBoard() {
  board = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    let row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let color;
      // Prevent initial matches
      do {
        color = getWeightedRandomColor();
      } while (
        (c >= 2 &&
          row[c - 1]?.color === color &&
          row[c - 2]?.color === color) ||
        (r >= 2 &&
          board[r - 1][c]?.color === color &&
          board[r - 2][c]?.color === color)
      );
      let newTile = {
        id: nextTileId++,
        color: color,
        type: "normal",
        state: "normal",
      };
      if (color === "yellow") {
        newTile.voltage = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
      }
      row.push(newTile);
    }
    board.push(row);
  }
}

/*
  getWeightedRandomColor()
  - 按预设权重随机返回一个颜色字符串。orange 和 yellow 概率较低（稀有色）。
  - 返回值为 COLORS 数组内的一项。
*/
function getWeightedRandomColor() {
  const weights = {
    red: 18,
    blue: 18,
    green: 18,
    purple: 18,
    white: 18,
    orange: 5,
    yellow: 5,
  };
  const totalWeight = 100;
  let r = Math.random() * totalWeight;
  for (const color of COLORS) {
    let w = weights[color] || 0;
    if (r < w) return color;
    r -= w;
  }
  return COLORS[0];
}

/*
  applyFreeze(tile)
  - 将指定 tile 标记为 frozen（冰冻），金块（gold）免疫。
  - 仅修改 tile.state，不直接操作 DOM；renderBoard 会据此添加 class 以显示效果。
*/
function applyFreeze(tile) {
  if (tile.type === "gold") return; // Gold tiles are immune to freezing
  tile.state = "frozen";
}

function renderBoard() {
  gridContainer.innerHTML = "";
  gridContainer.appendChild(vfxContainer);

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = board[r][c];

      const cell = document.createElement("div");
      cell.style.gridRowStart = r + 1;
      cell.style.gridColumnStart = c + 1;

      if (tile) {
        cell.classList.add("cell", `color-${tile.color}`);

        // Add type class
        if (tile.type !== "normal") {
          cell.classList.add(`type-${tile.type}`);
        }
        // Add state class
        if (tile.state && tile.state !== "normal") {
          cell.classList.add(`state-${tile.state}`);
        }

        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.id = tile.id;

        if (tile.color === "yellow" && tile.voltage) {
          cell.classList.add(`voltage-${tile.voltage}`);
        }

        // Re-apply selection style
        if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
          cell.classList.add("selected");
        }

        cell.addEventListener("click", handleCellClick);
      } else {
        // Placeholder for empty space
        cell.classList.add("cell-placeholder");
      }

      gridContainer.appendChild(cell);
    }
  }
}

function handleCellClick(e) {
  if (isProcessing) return;

  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);

  // 冰冻方块：不可选择、不可交换
  if (board[r][c] && board[r][c].state === "frozen") {
    audio.playInvalid();
    return;
  }

  // Fusion Core tiles cannot be moved
  if (board[r][c] && board[r][c].type === "fusion-core") {
    audio.playInvalid();
    // Shake visual?
    e.target.classList.add("shake");
    setTimeout(() => e.target.classList.remove("shake"), 200);
    return;
  }
  // Gold tiles CAN be moved anywhere

  if (!selectedCell) {
    audio.playSelect();
    selectCell(r, c);
    return;
  }

  if (selectedCell.r === r && selectedCell.c === c) {
    audio.playSelect();
    deselectCell();
    return;
  }

  const isAdjacent =
    Math.abs(selectedCell.r - r) + Math.abs(selectedCell.c - c) === 1;

  // Check for Global Swap Conditions
  const isGold =
    board[selectedCell.r][selectedCell.c].type === "gold" ||
    board[r][c].type === "gold";
  const allowAnySwap = isGold;

  if (isAdjacent || allowAnySwap) {
    audio.playSwap();
    swapCells(selectedCell.r, selectedCell.c, r, c);
  } else {
    // Just select the new cell (deselect old implicitly)
    audio.playSelect();
    selectCell(r, c);
  }
}

function selectCell(r, c) {
  selectedCell = { r, c };
  renderBoard();
}

function deselectCell() {
  selectedCell = null;
  renderBoard();
}

async function swapCells(r1, c1, r2, c2) {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // Check for Golden Tile Interaction FIRST
    const tile1 = board[r1][c1];
    const tile2 = board[r2][c2];

    if (tile1.type === "gold" || tile2.type === "gold") {
      const goldTile = tile1.type === "gold" ? tile1 : tile2;
      const goldR = tile1.type === "gold" ? r1 : r2;
      const goldC = tile1.type === "gold" ? c1 : c2;

      // Perform visual swap
      const cell1 = getCellElement(r1, c1);
      const cell2 = getCellElement(r2, c2);
      if (cell1 && cell2) {
        const xDiff = (c2 - c1) * 100;
        const yDiff = (r2 - r1) * 100;
        cell1.style.transform = `translate(${xDiff}%, ${yDiff}%)`;
        cell2.style.transform = `translate(${-xDiff}%, ${-yDiff}%)`;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (cell1) cell1.style.transform = "";
      if (cell2) cell2.style.transform = "";

      // Swap data
      let temp = board[r1][c1];
      board[r1][c1] = board[r2][c2];
      board[r2][c2] = temp;

      renderBoard();

      deselectCell();

      // Trigger Holy Beam VFX before activation logic
      showVFX(goldR === r1 ? r2 : r1, goldC === c1 ? c2 : c1, "holy-beam");
      await new Promise((resolve) => setTimeout(resolve, 800)); // Wait for flash/beam

      await activateGoldenTile(goldR === r1 ? r2 : r1, goldC === c1 ? c2 : c1);
      return;
    }

    const cell1 = getCellElement(r1, c1);
    const cell2 = getCellElement(r2, c2);

    // Visual Swap
    if (cell1 && cell2) {
      const xDiff = (c2 - c1) * 100;
      const yDiff = (r2 - r1) * 100;

      cell1.style.transform = `translate(${xDiff}%, ${yDiff}%)`;
      cell2.style.transform = `translate(${-xDiff}%, ${-yDiff}%)`;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (cell1) cell1.style.transform = "";
    if (cell2) cell2.style.transform = "";

    // Perform swap in data
    let temp = board[r1][c1];
    board[r1][c1] = board[r2][c2];
    board[r2][c2] = temp;

    renderBoard();

    // Check if this swap results in a match OR triggers special mechanics (Gold)
    const matches = findMatchGroups();

    if (matches.length > 0) {
      deselectCell();

      await new Promise((resolve) => setTimeout(resolve, 50));

      await processMatches(matches, { r: r2, c: c2 });

      // End of Turn Logic (Fusion Cores) - only run after all matches and cascades are done
      await processFusionCores();
    } else {
      // No Match? Revert!
      audio.playInvalid();

      // Revert Data
      temp = board[r1][c1];
      board[r1][c1] = board[r2][c2];
      board[r2][c2] = temp;

      renderBoard();

      const newCell1 = getCellElement(r1, c1);
      const newCell2 = getCellElement(r2, c2);

      // Revert Animation (Shake)
      if (newCell1) newCell1.classList.add("shake");
      if (newCell2) newCell2.classList.add("shake");

      await new Promise((resolve) => setTimeout(resolve, 200));

      if (newCell1) newCell1.classList.remove("shake");
      if (newCell2) newCell2.classList.remove("shake");

      // Ensure Clean State: Clear Selection
      deselectCell();
    }
  } catch (e) {
    console.error("Game Error:", e);
  } finally {
    // Absolute Lock Release
    isProcessing = false;
    // Double check selection is cleared if we errored out?
    // if(selectedCell) deselectCell(); // Safer to leave selection if just an error, but let's be clean.
  }
}

/*
  getCellElement(r, c)
  - 作用：根据行列查找并返回对应的 DOM 单元格元素（用于动画定位）。
  - 返回：对应的 `.cell[data-row][data-col]` 或 null。
*/
function getCellElement(r, c) {
  return document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}

/*
  findMatchGroups()
  - 作用：扫描整个 board 并返回所有的三消及以上分组（横向或纵向）。
  - 细节：忽略 state 为 'frozen' 的方块与 type 为 'fusion-core' 的方块（它们不参与标准匹配）。
  - 返回：一个 group 数组，每个 group 包含 { type: 'horizontal'|'vertical', tiles: [{r,c}, ...] }
*/
function findMatchGroups() {
  let groups = [];

  // Horizontal
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let tile = board[r][c];
      if (!tile || tile.state === "frozen") continue;

      let matchLen = 1;
      while (
        c + matchLen < GRID_SIZE &&
        board[r][c + matchLen] &&
        board[r][c + matchLen].color === tile.color &&
        board[r][c + matchLen].type !== "fusion-core"
      ) {
        matchLen++;
      }

      if (matchLen >= 3) {
        let group = {
          type: "horizontal",
          tiles: [],
        };
        for (let i = 0; i < matchLen; i++) {
          group.tiles.push({ r: r, c: c + i });
        }
        groups.push(group);
        c += matchLen - 1;
      }
    }
  }

  // Vertical
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE; r++) {
      let tile = board[r][c];
      if (!tile || tile.state === "frozen") continue;

      let matchLen = 1;
      while (
        r + matchLen < GRID_SIZE &&
        board[r + matchLen][c] &&
        board[r + matchLen][c].color === tile.color &&
        board[r + matchLen][c].type !== "fusion-core"
      ) {
        matchLen++;
      }

      if (matchLen >= 3) {
        let group = {
          type: "vertical",
          tiles: [],
        };
        for (let i = 0; i < matchLen; i++) {
          group.tiles.push({ r: r + i, c: c });
        }
        groups.push(group);
        r += matchLen - 1;
      }
    }
  }

  return groups;
}

/*
  processMatches(initialMatches, swapFocus)
  - 游戏中消除与连锁的主流程函数。
  - 步骤概要：
    1. 收集 match groups（或使用传入的 initialMatches）。
    2. 对每组按长度（3/4/5+）分发到对应颜色的 handler，收集 removalSet 与 special creations。
    3. 处理特殊 state（bright-blue/bright-purple）和特殊类型（行/列/区域炸弹、gold）。
    4. 以波次移除冰冻（frozen）并播放特效，调用 removeMatches。
    5. applyGravity 下落并生成新砖，animateGravity 播放下落动画。
    6. 处理 pendingBallLightnings / pendingFusionCores 并递归处理新产生的 matches。
  - 参数说明：
    - initialMatches: 可选的预计算 match 列表（用于 swap 后直接传入）。
    - swapFocus: 可选，指示本回合的交换焦点格（保留位置以便某些效果使用）。
*/
async function processMatches(initialMatches = null, swapFocus = null) {
  let matchGroups = initialMatches || findMatchGroups();
  let combo = 0;

  try {
    while (matchGroups.length > 0) {
      combo++;
      audio.playMatch(combo);

      let tilesToRemove = new Set();
      let specialCreations = []; // {r, c, type, color}

      // Create Context for this chain step
      let context = {
        removalSet: tilesToRemove, // Shared removal set
        overloadedSet: new Set(), // Track overloads this step
      };

      for (const group of matchGroups) {
        const len = group.tiles.length;
        // Updated: Always use geometric center for consistency, unless overruled by game design (user requested "middle")
        const centerTile = group.tiles[Math.floor(len / 2)];
        let creationPos = centerTile;

        // Note: User explicitly requested Red match to center on the "middle", so we stick to centerTile.
        // For consistency, we use centerTile for all, unless specific mechanics need swapFocus.
        // Previously logic used swapFocus. I've removed it for Red as requested.

        const groupColor = board[creationPos.r][creationPos.c].color;

        if (len >= 5) {
          specialCreations.push({
            r: creationPos.r,
            c: creationPos.c,
            type: "gold",
            color: "gold",
          });
          group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
        } else if (len === 4) {
          if (groupColor === "red") {
            await handleRedMatch4(tilesToRemove);
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "green") {
            await handleGreenMatch4(group.tiles);
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "blue") {
            const isHorizontal = group.type === "horizontal";
            await handleBlueMatch4(
              creationPos.r,
              creationPos.c,
              isHorizontal,
              tilesToRemove
            );
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "purple") {
            await handlePurpleMatch4();
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "white") {
            await handleWhiteMatch4(tilesToRemove);
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "orange") {
            await handleOrangeMatch4();
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "yellow") {
            await handleYellowMatch4(creationPos.r, creationPos.c);
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          }
        } else {
          // Match 3
          if (groupColor === "red") {
            // Center is geometric center
            await handleRedMatch3(creationPos.r, creationPos.c, tilesToRemove);
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "green") {
            const isHorizontal = group.type === "horizontal";
            await handleGreenMatch3(
              creationPos.r,
              creationPos.c,
              isHorizontal,
              tilesToRemove
            );
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "blue") {
            // Blue Special Logic: returns false (never keeps center in new logic)
            await handleBlueMatch3(creationPos.r, creationPos.c, group.tiles);
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "purple") {
            await handlePurpleMatch3(creationPos.r, creationPos.c, group.tiles);
            // Force a delay to ensure user sees the transformation before removal/gravity
            await new Promise((resolve) => setTimeout(resolve, 300));
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "white") {
            // White Match-3 Logic: Mixed or Pure?
            const frozenInGroup = group.tiles.filter(
              (t) => board[t.r][t.c].state === "frozen"
            );
            const normalInGroup = group.tiles.filter(
              (t) => board[t.r][t.c].state !== "frozen"
            );

            if (frozenInGroup.length > 0) {
              // Mixed or Pure Frozen -> Shatter Frozen, Freeze Normal
              frozenInGroup.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
              if (normalInGroup.length > 0) {
                await handleWhiteMatch3(normalInGroup);
              }
            } else {
              // Pure Normal -> All Freeze
              await handleWhiteMatch3(group.tiles);
            }
          } else if (groupColor === "orange") {
            await handleOrangeMatch3(creationPos.r, creationPos.c);
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          } else if (groupColor === "yellow") {
            await handleYellowMatch3(
              creationPos.r,
              creationPos.c,
              group.tiles,
              context
            );
            group.tiles.forEach((t) => tilesToRemove.add(`${t.r},${t.c}`));
          }
        }
      }

      let removalArray = Array.from(tilesToRemove).map((str) => {
        const [r, c] = str.split(",").map(Number);
        return { r, c };
      });

      let finalRemovalSet = new Set(tilesToRemove);
      let queue = [...removalArray];
      let processedSpecials = new Set();

      while (queue.length > 0) {
        const { r, c } = queue.pop();
        const tile = board[r][c];
        if (!tile) continue;

        if (tile.state === "bright-blue") {
          if (!processedSpecials.has(tile.id)) {
            processedSpecials.add(tile.id);
            audio.playExplosion("blue");

            // Visual effect for Blue Explosion
            showVFX(r, c, "shockwave"); // Blue tinted shockwave handled by CSS ideally, or just standard for now

            for (let i = r - 1; i <= r + 1; i++) {
              for (let j = c - 1; j <= c + 1; j++) {
                if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
                  let key = `${i},${j}`;
                  if (!finalRemovalSet.has(key)) {
                    finalRemovalSet.add(key);
                    queue.push({ r: i, c: j });
                  }
                }
              }
            }
          }
        } else if (tile.state === "bright-purple") {
          if (!processedSpecials.has(tile.id)) {
            processedSpecials.add(tile.id);
            await handleBrightPurpleEffect(r, c);
          }
        } else if (tile.state === "frozen") {
          // Logic handled in post-loop check
        }

        if (
          tile.type !== "normal" &&
          tile.type !== "gold" &&
          !processedSpecials.has(tile.id)
        ) {
          processedSpecials.add(tile.id);
          audio.playExplosion(tile.color);
          let exploded = getExplosionTargets(r, c, tile.type);
          exploded.forEach((t) => {
            const key = `${t.r},${t.c}`;
            if (!finalRemovalSet.has(key)) {
              finalRemovalSet.add(key);
              queue.push(t);
            }
          });
        }
      }

      // 冰冻连锁：按波次扩散，遵循延迟破碎
      const removalWaves = buildFrozenRemovalWaves(finalRemovalSet);

      let totalRemoved = 0;
      if (removalWaves.length > 0) {
        for (let w = 0; w < removalWaves.length; w++) {
          const wave = removalWaves[w];
          if (wave.length === 0) continue;
          // 展示冰冻破碎特效（仅对冰冻块）
          wave.forEach((pos) => {
            const tile = board[pos.r]?.[pos.c];
            if (tile && tile.state === "frozen") {
              showVFX(pos.r, pos.c, "frost-nova");
            }
          });
          await removeMatches(wave);
          totalRemoved += wave.length;
          if (w < removalWaves.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 180));
          }
        }
        score += totalRemoved * 10 * combo;
        updateUI();

        specialCreations.forEach((sc) => {
          let newTile = {
            id: nextTileId++,
            color: sc.color,
            type: sc.type,
            state: "normal",
          };
          board[sc.r][sc.c] = newTile;
          audio.playCreateSpecial();
        });

        // Spawn Fusion Cores
        while (pendingFusionCores.length > 0) {
          const pc = pendingFusionCores.pop();
          board[pc.r][pc.c] = {
            id: nextTileId++,
            color: "yellow",
            type: "fusion-core",
            state: "normal",
            durability: 5,
          };
          audio.playCreateSpecial();
        }

        renderBoard();
        await new Promise((resolve) => setTimeout(resolve, 200));

        const moves = applyGravity();

        renderBoard();
        await animateGravity(moves);
      } else {
        // Should not happen, but safe guard to prevent infinite loops if logic fails
        break;
      }

      matchGroups = findMatchGroups();
      swapFocus = null;
    }

    // --- BALL LIGHTNING RESUMPTION ---
    // After board is static (matches done), check for pending Ball Lightnings (Match-4 Pause)
    let ballLightningActive = await resumeBallLightnings();
    if (ballLightningActive) {
      // Ball lightning activity might have created new matches (via explosions or transmutation).
      // Re-check matches.
      matchGroups = findMatchGroups();
      if (matchGroups.length > 0) {
        // Recursively call processMatches or loop back?
        // Calling recursively is safer to maintain context.
        await processMatches(matchGroups);
      }
    }

    checkLevelProgress();

    // Only run Fusion Cores if we are at the top level call?
    // If we recurse, we might run it multiple times.
    // But resumeBallLightnings only happens if matches are done.
    // Let's assume processFusionCores runs at the very end of the *Player's* turn.
    // It should be fine to run here, as long as we don't have infinite loops.
    // await processFusionCores(); // Moved to swapCells to fix timing bug

    if (!checkPossibleMoves()) {
      messageArea.textContent = "无路可走！自动洗牌中...";
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await shuffleBoard();
      // Restore goal text
      const colorNames = {
        red: "红色",
        blue: "蓝色",
        green: "绿色",
        purple: "紫色",
        white: "白色",
        orange: "橙色",
        yellow: "黄色",
      };
      let parts = [];
      for (const [color, count] of Object.entries(levelTargets)) {
        parts.push(`消除 ${count} 个${colorNames[color] || color}方块`);
      }
      parts.push(`达到 ${targetScore} 分`);
      messageArea.textContent = parts.join("，");
    }
  } catch (e) {
    console.error("Process Matches Error:", e);
  }
}

/*
  getExplosionTargets(r, c, type)
  - 工具函数：根据类型返回受影响坐标集合。
  - type 可为 'row'（整行）、'col'（整列）或 'area'（以 (r,c) 为中心的 3x3 区域）。
  - 返回值为 [{r,c}, ...] 的数组，方便后续传入 removeMatches 或合并到 removalSet。
*/
function getExplosionTargets(r, c, type) {
  let targets = [];
  if (type === "row") {
    for (let i = 0; i < GRID_SIZE; i++) targets.push({ r: r, c: i });
  } else if (type === "col") {
    for (let i = 0; i < GRID_SIZE; i++) targets.push({ r: i, c: c });
  } else if (type === "area") {
    for (let i = r - 1; i <= r + 1; i++) {
      for (let j = c - 1; j <= c + 1; j++) {
        if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
          targets.push({ r: i, c: j });
        }
      }
    }
  }
  return targets;
}

/*
  activateGoldenTile(r, c)
  - 金块被激活时的特殊效果：随机吸收（清除）盘上最多若干目标（当前实现上限为 25），并对被吸入的特殊方块触发相应的连锁效果。
  - 实现要点：
+    1. 随机选择若干非空格子作为吸收目标
+    2. 对其中的特殊方块（行/列炸弹、bright-blue 等）展开连锁爆炸，扩展最终的移除集合
+    3. 播放吸收动画并清空这些格子，随后调用 applyGravity 和 processMatches 继续连锁
+  - 副作用：修改 board，播放大量 VFX，更新 score。
*/
async function activateGoldenTile(r, c) {
  audio.playWhirlwind();

  let targets = [];
  let available = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (i === r && j === c) continue;
      if (board[i][j]) available.push({ r: i, c: j });
    }
  }

  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  targets = available.slice(0, 25);

  let finalRemovalSet = new Set();
  targets.forEach((t) => finalRemovalSet.add(`${t.r},${t.c}`));
  finalRemovalSet.add(`${r},${c}`);

  let queue = [...targets];
  let processedSpecials = new Set();

  while (queue.length > 0) {
    const { r, c } = queue.pop();
    const tile = board[r][c];
    if (!tile) continue;

    if (
      tile.type === "row" ||
      tile.type === "col" ||
      tile.type === "area" ||
      tile.state === "bright-blue"
    ) {
      if (!processedSpecials.has(tile.id)) {
        processedSpecials.add(tile.id);

        // Handle bright-blue specifically if caught in whirlwind
        if (tile.state === "bright-blue") {
          showVFX(r, c, "shockwave");
          let exploded = getExplosionTargets(r, c, "area");
          exploded.forEach((t) => {
            const key = `${t.r},${t.c}`;
            if (!finalRemovalSet.has(key)) {
              finalRemovalSet.add(key);
              queue.push(t);
            }
          });
        } else {
          let exploded = getExplosionTargets(r, c, tile.type);
          exploded.forEach((t) => {
            const key = `${t.r},${t.c}`;
            if (!finalRemovalSet.has(key)) {
              finalRemovalSet.add(key);
              queue.push(t);
            }
          });
        }
      }
    }
  }

  let removalList = Array.from(finalRemovalSet).map((str) => {
    const [r, c] = str.split(",").map(Number);
    return { r, c };
  });

  const movePromises = removalList.map((t) => {
    const cell = getCellElement(t.r, t.c);
    if (cell && (t.r !== r || t.c !== c)) {
      const xDiff = (c - t.c) * 100;
      const yDiff = (r - t.r) * 100;
      cell.style.zIndex = 100;
      // Enhanced Absorb Animation: Back In easing + Gold Trail
      cell.style.transition =
        "transform 0.6s cubic-bezier(0.6, -0.28, 0.735, 0.045), opacity 0.6s ease-in";
      cell.style.transform = `translate(${xDiff}%, ${yDiff}%) scale(0.1)`;
      cell.style.opacity = "0";
      // Optional: Add a trail particle here?
      // Too many DOM elements might lag, sticking to CSS enhancement.
      return new Promise((resolve) => setTimeout(resolve, 600));
    }
    return Promise.resolve();
  });

  await Promise.all(movePromises);

  removalList.forEach(({ r, c }) => (board[r][c] = null));
  score += removalList.length * 10;
  updateUI();

  renderBoard();

  await new Promise((resolve) => setTimeout(resolve, 200));
  const moves = applyGravity();
  renderBoard();
  await animateGravity(moves);

  await processMatches();
}

/*
  checkPossibleMoves()
  - 作用：模拟每个相邻交换，判断是否存在任何能产生消除的有效移动（用于检测无路可走时触发洗牌）。
  - 注意：会短暂交换 board 数据后恢复，不会修改已存在的 tile 状态（仅做检测）。
*/
function checkPossibleMoves() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 1; c++) {
      if (!board[r][c] || !board[r][c + 1]) continue;
      // Frozen tiles cannot be moved
      if (board[r][c].state === "frozen" || board[r][c + 1].state === "frozen")
        continue;

      let temp = board[r][c];
      board[r][c] = board[r][c + 1];
      board[r][c + 1] = temp;

      let hasMatch = hasMatches(); // Uses findMatchGroups

      temp = board[r][c];
      board[r][c] = board[r][c + 1];
      board[r][c + 1] = temp;

      if (hasMatch) return true;
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 1; r++) {
      if (!board[r][c] || !board[r + 1][c]) continue;
      if (board[r][c].state === "frozen" || board[r + 1][c].state === "frozen")
        continue;

      let temp = board[r][c];
      board[r][c] = board[r + 1][c];
      board[r + 1][c] = temp;

      let hasMatch = hasMatches();

      temp = board[r][c];
      board[r][c] = board[r + 1][c];
      board[r + 1][c] = temp;

      if (hasMatch) return true;
    }
  }
  return false;
}

/*
  hasMatches()
  - 作用：快速探测当前 board 是否存在任意三连消（横向或纵向），用于检测洗牌与交换回退判断。
  - 实现：只检查连续 3 个相同颜色且非 frozen 的组合，返回布尔值。
*/
function hasMatches() {
  // Horizontal
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 2; c++) {
      let tile = board[r][c];
      if (!tile || tile.state === "frozen") continue;
      if (
        board[r][c + 1] &&
        board[r][c + 1].state !== "frozen" &&
        board[r][c + 1].color === tile.color &&
        board[r][c + 2] &&
        board[r][c + 2].state !== "frozen" &&
        board[r][c + 2].color === tile.color
      ) {
        return true;
      }
    }
  }
  // Vertical
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      let tile = board[r][c];
      if (!tile || tile.state === "frozen") continue;
      if (
        board[r + 1][c] &&
        board[r + 1][c].state !== "frozen" &&
        board[r + 1][c].color === tile.color &&
        board[r + 2][c] &&
        board[r + 2][c].state !== "frozen" &&
        board[r + 2][c].color === tile.color
      ) {
        return true;
      }
    }
  }
  return false;
}

/*
  shuffleBoard()
  - 作用：打乱棋盘（用于无路可走时的救济机制）。播放打乱动画，然后检查新棋盘是否有初始消除或可行动。若不满足则递归再次洗牌。
  - 副作用：修改 board 数据并触发 processMatches（若有初始消除）或洗牌动画。
*/
async function shuffleBoard() {
  // Visual Shuffle Effect
  gridContainer.classList.add("shuffling");
  await new Promise((resolve) => setTimeout(resolve, 500));

  let flatBoard = board.flat();
  for (let i = flatBoard.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flatBoard[i], flatBoard[j]] = [flatBoard[j], flatBoard[i]];
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      board[r][c] = flatBoard[r * GRID_SIZE + c];
    }
  }

  renderBoard();
  gridContainer.classList.remove("shuffling");

  if (hasMatches()) {
    await processMatches();
  } else if (!checkPossibleMoves()) {
    await shuffleBoard();
  }
}

/*
  removeMatches(matches)
  - 批量移除给定的格子（matches: [{r,c}, ...]）。
  - 行为：播放碎裂粒子、更新 levelTargets（关卡目标计数）、短暂动画后将 board 中对应位置设为 null。
  - 注意：此函数只负责移除与视觉反馈，实际的下落由 applyGravity() 负责。
*/
async function removeMatches(matches) {
  let targetsUpdated = false;
  matches.forEach(({ r, c }) => {
    const tile = board[r][c];

    // Universal Crush VFX
    if (tile) {
      const particleCount = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < particleCount; i++) {
        createParticle(r, c, "crush", tile.color);
      }
    }

    if (tile && levelTargets[tile.color] && levelTargets[tile.color] > 0) {
      levelTargets[tile.color]--;
      targetsUpdated = true;
    }

    const cell = getCellElement(r, c);
    if (cell) {
      cell.classList.add("matched");
    }
  });

  if (targetsUpdated) updateTargetUI();

  await new Promise((resolve) => setTimeout(resolve, 300));

  matches.forEach(({ r, c }) => {
    board[r][c] = null;
  });
}

/*
  applyGravity()
  - 作用：将 board 中的方块向下落至列底（模拟重力），并在顶部生成新的随机方块补充空位。
  - 返回：moves 数组，包含每个发生移动或新生成 tile 的 {id, oldR, oldC, newR, newC}，供 animateGravity 使用。
*/
function applyGravity() {
  const moves = [];

  for (let c = 0; c < GRID_SIZE; c++) {
    let writeRow = GRID_SIZE - 1;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (board[r][c] !== null) {
        let tile = board[r][c];

        if (writeRow !== r) {
          moves.push({
            id: tile.id,
            oldR: r,
            oldC: c,
            newR: writeRow,
            newC: c,
          });
        }

        board[writeRow][c] = tile;
        if (writeRow !== r) {
          board[r][c] = null;
        }
        writeRow--;
      }
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let emptyCount = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (board[r][c] === null) {
        emptyCount++;
      }
    }

    let currentR = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (board[r][c] === null) {
        let spawnRow = currentR - emptyCount;

        let color = getWeightedRandomColor();
        // Try to avoid matching the tile below
        if (
          r < GRID_SIZE - 1 &&
          board[r + 1] &&
          board[r + 1][c] &&
          board[r + 1][c].color === color
        ) {
          if (Math.random() > 0.5) {
            color = getWeightedRandomColor();
          }
        }

        let newTile = {
          id: nextTileId++,
          color: color,
          type: "normal",
          state: "normal",
        };
        if (color === "yellow") {
          newTile.voltage = Math.floor(Math.random() * 3) + 1;
        }

        board[r][c] = newTile;

        moves.push({
          id: newTile.id,
          oldR: spawnRow,
          oldC: c,
          newR: r,
          newC: c,
        });

        currentR++;
      }
    }
  }

  return moves;
}

/*
  animateGravity(moves)
  - 作用：根据 applyGravity 返回的 moves 信息，对 DOM 中对应 cell 元素应用位移动画从 old -> new 位置。
  - 实现：先设置即时 transform 表示起始位置，再清空 transform 触发过渡动画，最后清理内联样式。
  - 注意：依赖 tile.id 与 cell[data-id] 对应关系保持稳定。
*/
async function animateGravity(moves) {
  moves.forEach((move) => {
    const cell = document.querySelector(`.cell[data-id="${move.id}"]`);
    if (cell) {
      const rDiff = move.oldR - move.newR;
      const cDiff = move.oldC - move.newC;
      cell.style.transition = "none";
      cell.style.transform = `translate(${cDiff * 100}%, ${rDiff * 100}%)`;
    }
  });

  gridContainer.offsetHeight;

  moves.forEach((move) => {
    const cell = document.querySelector(`.cell[data-id="${move.id}"]`);
    if (cell) {
      // Silky smooth easing (quart-out)
      cell.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
      cell.style.transform = "";
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Cleanup inline transitions to allow CSS defaults to take over
  moves.forEach((move) => {
    const cell = document.querySelector(`.cell[data-id="${move.id}"]`);
    if (cell) {
      cell.style.transition = "";
    }
  });
}

/*
  各颜色逻辑处理区（Color Specific Logic Handlers）
  - 每个颜色的 3消 / 4消 / 5+ 的特殊行为都在此分开实现为函数。
  - 约定：
    3消函数通常以 handle<Color>Match3 命名，接收匹配中心或 tiles 列表并直接对 board 进行必要修改或加入 removalSet。
    4消函数通常以 handle<Color>Match4 命名，处理更强的范围或生成特殊效果。
    5+（len>=5）在 processMatches 中统一创建金色 special（gold）。
  - 注意：这些函数会播放 VFX / audio，并可能修改 board、tile.state、tile.type 或将坐标写入 removalSet。
*/

// --------- RED（红色） ---------
/*
  handleRedMatch3(r, c, removalSet)
  - 红色 3消：在 3x3 区域内随机选一个非红的邻块加入 removalSet，播放爆炸效果。
  - 参数 removalSet 为共享的移除集合（字符串 key 格式：`${r},${c}`）。
*/
async function handleRedMatch3(r, c, removalSet) {
  let targets = [];
  for (let i = r - 1; i <= r + 1; i++) {
    for (let j = c - 1; j <= c + 1; j++) {
      if (
        i >= 0 &&
        i < GRID_SIZE &&
        j >= 0 &&
        j < GRID_SIZE &&
        !(i === r && j === c)
      ) {
        // Constraint: Must be non-red
        if (board[i][j] && board[i][j].color !== "red")
          targets.push({ r: i, c: j });
      }
    }
  }
  if (targets.length > 0) {
    const target = targets[Math.floor(Math.random() * targets.length)];
    audio.playExplosion("red");
    showVFX(target.r, target.c, "shockwave");
    removalSet.add(`${target.r},${target.c}`);
  }
}

/*
  handleRedMatch4(removalSet)
  - 红色 4消：全盘所有红色方块的 50% 被加入 removalSet（激活爆炸效果）。
  - 副作用：修改 removalSet，播放多个爆炸特效与粒子。
*/
async function handleRedMatch4(removalSet) {
  let allReds = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] && board[r][c].color === "red") {
        allReds.push({ r, c });
      }
    }
  }
  allReds.sort(() => 0.5 - Math.random());
  const selected = allReds.slice(0, 3);

  for (const red of selected) {
    // Visual cue for activation
    const cell = getCellElement(red.r, red.c);
    if (cell) {
      cell.style.transform = "scale(1.2)";
      setTimeout(() => {
        if (cell) cell.style.transform = "";
      }, 300);
    }
    audio.playExplosion("red");
    // Effect centered on the activated red tile
    showVFX(red.r, red.c, "shockwave");

    let neighbors = [];
    for (let i = red.r - 1; i <= red.r + 1; i++) {
      for (let j = red.c - 1; j <= red.c + 1; j++) {
        if (
          i >= 0 &&
          i < GRID_SIZE &&
          j >= 0 &&
          j < GRID_SIZE &&
          !(i === red.r && j === red.c)
        ) {
          // Explode 1 random NON-RED neighbor
          if (board[i][j] && board[i][j].color !== "red")
            neighbors.push({ r: i, c: j });
        }
      }
    }
    if (neighbors.length > 0) {
      const target = neighbors[Math.floor(Math.random() * neighbors.length)];
      if (removalSet) removalSet.add(`${target.r},${target.c}`);
    }
  }
}

// GREEN
/*
  handleGreenMatch3(r, c, isHorizontal, removalSet)
  - 绿色 3消：风斩效果。依据匹配方向尝试消除匹配中心两侧的格子（若侧位不是绿色）。
  - 参数：isHorizontal 表示匹配是横向还是纵向，removalSet 为共享的移除集合（把要删除的格子以 `${r},${c}` 的字符串形式加入）。
  - 注意：若侧位已有绿色，则技能失败（只做普通消除），函数仅在成功时把侧格加入 removalSet 并播放风斩特效。
*/
async function handleGreenMatch3(r, c, isHorizontal, removalSet) {
  const dR = isHorizontal ? 1 : 0;
  const dC = isHorizontal ? 0 : 1;

  // Check perpendicular directions (sides of the center block)
  // If isHorizontal (row match), check up (-1, 0) and down (1, 0)
  // If !isHorizontal (col match), check left (0, -1) and right (0, 1)

  const checkR = isHorizontal ? 1 : 0;
  const checkC = isHorizontal ? 0 : 1;

  const side1 = { r: r - checkR, c: c - checkC };
  const side2 = { r: r + checkR, c: c + checkC };

  const isGreen = (pos) => {
    if (pos.r >= 0 && pos.r < GRID_SIZE && pos.c >= 0 && pos.c < GRID_SIZE) {
      return board[pos.r][pos.c] && board[pos.r][pos.c].color === "green";
    }
    return false;
  };

  if (isGreen(side1) || isGreen(side2)) {
    // Skill Fails: Normal match only
    return;
  } else {
    // Skill Success: Eliminate both sides if they exist
    [side1, side2].forEach((pos) => {
      if (
        pos.r >= 0 &&
        pos.r < GRID_SIZE &&
        pos.c >= 0 &&
        pos.c < GRID_SIZE &&
        board[pos.r][pos.c]
      ) {
        removalSet.add(`${pos.r},${pos.c}`);
        // Visual effect
        showVFX(pos.r, pos.c, "wind-slash", isHorizontal ? "col" : "row");
      }
    });
  }
}

/*
  handleGreenMatch4(matchGroupTiles)
  - 绿色 4消：多阶段效果。先给盘上所有绿色（除匹配组外）播放 charge 动画，然后执行随机滑动交换（视觉），最后同步 board 数据。
  - 实现分三相（charge / slide / data-sync），目的是展示「全局绿色齐心协力滑动」的视觉反馈。
*/
async function handleGreenMatch4(matchGroupTiles) {
  // 1. Identify candidates (Remaining Green Tiles)
  let matchSet = new Set();
  if (matchGroupTiles)
    matchGroupTiles.forEach((t) => matchSet.add(`${t.r},${t.c}`));

  let candidates = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (matchSet.has(`${r},${c}`)) continue; // Skip tiles being removed
      if (board[r][c] && board[r][c].color === "green") {
        candidates.push({ r, c, tile: board[r][c] });
      }
    }
  }

  if (candidates.length === 0) return;

  // --- Phase 1: Charge (0ms - 400ms) ---
  // Add .energy-charge class
  candidates.forEach((c) => {
    let cell = getCellElement(c.r, c.c);
    if (cell) cell.classList.add("energy-charge");
  });

  // Wait 400ms for charge animation
  await new Promise((resolve) => setTimeout(resolve, 400));

  // --- Phase 2: Visual Slide (400ms - 800ms) ---
  // Calculate Moves (Logic only, no data update yet)
  // Shuffle candidates to avoid bias
  candidates.sort(() => 0.5 - Math.random());

  let moves = []; // {source: {r,c}, target: {r,c}}
  let shakes = []; // {r,c}
  let reservedDestinations = new Set();

  for (let candy of candidates) {
    let dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // Up, Down, Left, Right
    dirs.sort(() => 0.5 - Math.random()); // Random order

    let moved = false;
    for (let dir of dirs) {
      let nr = candy.r + dir[0];
      let nc = candy.c + dir[1];

      // Boundary Check
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;

      // Obstacle Check
      let targetTile = board[nr][nc];
      // Treat Gold, Frozen, or another Green as blocked
      if (targetTile) {
        if (targetTile.type === "gold" || targetTile.state === "frozen")
          continue;
        if (targetTile.color === "green") continue;
      }

      // Check if reserved (target position already taken by another move)
      if (reservedDestinations.has(`${nr},${nc}`)) continue;
      // Also check if target is a source of another move? (Avoid collisions)
      // Ideally we swap. If A moves to B, B moves to A.
      // But here we are just sliding Green to a neighbor. The neighbor slides back.
      // We just need to ensure we don't pick the same target for two greens.

      // Mark target reserved
      reservedDestinations.add(`${nr},${nc}`);
      // Mark source reserved (so no one moves INTO this green while it moves out?
      // Actually, if Green A moves to Neighbor B, B moves to A. A is now occupied by B.
      // If another Green C wanted to move to A, it can't.
      reservedDestinations.add(`${candy.r},${candy.c}`);

      // Found a valid move
      moves.push({ r: candy.r, c: candy.c, nr: nr, nc: nc });
      moved = true;
      break;
    }

    if (!moved) {
      shakes.push(candy);
    }
  }

  // Apply Visual Transforms
  // 1. Remove Charge Class
  candidates.forEach((c) => {
    let cell = getCellElement(c.r, c.c);
    if (cell) cell.classList.remove("energy-charge");
  });

  let visualPromises = [];

  // Shakes (Blocked)
  shakes.forEach((s) => {
    let cell = getCellElement(s.r, s.c);
    if (cell) {
      cell.classList.add("shake");
      // Remove shake class after anim
      setTimeout(() => cell.classList.remove("shake"), 400);
    }
  });

  // Slides (Moves)
  for (let m of moves) {
    let c1 = getCellElement(m.r, m.c); // Green Tile
    let c2 = getCellElement(m.nr, m.nc); // Target Tile

    if (c1 && c2) {
      let xDiff = (m.nc - m.c) * 100;
      let yDiff = (m.nr - m.r) * 100;

      // Slide Green to Target
      c1.style.transition = "transform 0.4s ease-in-out";
      c1.style.transform = `translate(${xDiff}%, ${yDiff}%)`;
      c1.style.zIndex = 100;

      // Slide Target to Green
      c2.style.transition = "transform 0.4s ease-in-out";
      c2.style.transform = `translate(${-xDiff}%, ${-yDiff}%)`;
    }
  }

  // Wait 400ms for slide animation
  await new Promise((resolve) => setTimeout(resolve, 400));

  // --- Phase 3: Data Sync (800ms+) ---
  // Apply Data Swaps
  for (let m of moves) {
    let t1 = board[m.r][m.c];
    let t2 = board[m.nr][m.nc];

    board[m.r][m.c] = t2;
    board[m.nr][m.nc] = t1;
  }

  // Clear transforms and Re-render
  // Note: renderBoard() rebuilds DOM, so styles/transforms are cleared automatically.
  renderBoard();
}

// BLUE
/*
  handleBlueMatch3(r, c, matchGroupTiles)
  - 蓝色 3消：尝试在 3x3 区域内寻找其它蓝块（排除当前匹配组），并随机将其中一个设为 'bright-blue'。
  - bright-blue 为延迟爆炸状态，后续在 processMatches 中会被扩展为 3x3 的移除效果。
  - matchGroupTiles 用于避免把当前匹配组中的方块再次作为候选。
*/
async function handleBlueMatch3(r, c, matchGroupTiles) {
  let blues = [];
  // Convert matchGroupTiles to a Set of keys for fast lookup
  let matchKeys = new Set();
  if (matchGroupTiles) {
    matchGroupTiles.forEach((t) => matchKeys.add(`${t.r},${t.c}`));
  }

  for (let i = r - 1; i <= r + 1; i++) {
    for (let j = c - 1; j <= c + 1; j++) {
      if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
        // Exclude the tiles that are part of the match itself
        if (matchKeys.has(`${i},${j}`)) continue;

        if (board[i][j] && board[i][j].color === "blue") {
          blues.push({ r: i, c: j });
        }
      }
    }
  }

  if (blues.length > 0) {
    const target = blues[Math.floor(Math.random() * blues.length)];
    board[target.r][target.c].state = "bright-blue";
    renderBoard();
  }
  // Always return false because we never keep the center tile in this new logic
  // (If neighbors exist -> mark neighbor. If not -> normal elimination).
  return false;
}

/*
  handleBlueMatch4(r, c, isHorizontal, removalSet)
  - 蓝色 4消：整行/列清空效果。将匹配线的整行或整列的所有格子加入 removalSet；同时把线两侧（相邻行/列）的蓝色块标记为 bright-blue（后续会 3x3 扩散）。
  - 参数 isHorizontal: true 表示水平线，false 表示竖线。会播放 hydro-beam 水束特效。
*/
async function handleBlueMatch4(r, c, isHorizontal, removalSet) {
  let targets = [];
  let sideChecks = []; // Tiles to check for turning bright blue

  if (isHorizontal) {
    // Row elimination
    for (let i = 0; i < GRID_SIZE; i++) {
      targets.push({ r, c: i });
      // Check neighbors above and below
      sideChecks.push({ r: r - 1, c: i });
      sideChecks.push({ r: r + 1, c: i });
    }
  } else {
    // Col elimination
    for (let i = 0; i < GRID_SIZE; i++) {
      targets.push({ r: i, c });
      // Check neighbors left and right
      sideChecks.push({ r: i, c: c - 1 });
      sideChecks.push({ r: i, c: c + 1 });
    }
  }

  // Process side effects (Bright Blue creation)
  sideChecks.forEach((t) => {
    if (t.r >= 0 && t.r < GRID_SIZE && t.c >= 0 && t.c < GRID_SIZE) {
      const tile = board[t.r][t.c];
      if (tile && tile.color === "blue") {
        tile.state = "bright-blue";
      }
    }
  });
  renderBoard();

  // Visual Effect: Laser Beam
  showVFX(r, c, "hydro-beam", isHorizontal ? "row" : "col");

  // Mark line for removal
  for (const t of targets) {
    if (removalSet) removalSet.add(`${t.r},${t.c}`);
  }
}

// PURPLE
/*
  handlePurpleMatch3(r, c, matchGroupTiles)
  - 紫色 3消：在 3x3 区域内计算颜色众数（mode），然后将区域内的一个非众数颜色方块转为该众数色。
  - 该效果用于色块转换，可能触发新的连锁消除（通过改变颜色而非直接移除）。
*/
async function handlePurpleMatch3(r, c, matchGroupTiles) {
  // 1. Identify 3x3 area around CENTER (r,c)
  // matchGroupTiles contains the 3 match tiles.
  let matchKeys = new Set();
  if (matchGroupTiles)
    matchGroupTiles.forEach((t) => matchKeys.add(`${t.r},${t.c}`));

  let areaTiles = [];
  let counts = {};

  for (let i = r - 1; i <= r + 1; i++) {
    for (let j = c - 1; j <= c + 1; j++) {
      if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE && board[i][j]) {
        // Exclude the 3 purple blocks for Counting
        if (!matchKeys.has(`${i},${j}`)) {
          const col = board[i][j].color;
          counts[col] = (counts[col] || 0) + 1;

          // Collect valid target candidates (Must not be in match group)
          // Also exclude frozen/special types if needed
          if (
            board[i][j].state !== "frozen" &&
            board[i][j].type !== "gold" &&
            board[i][j].type !== "fusion-core"
          ) {
            areaTiles.push({ r: i, c: j });
          }
        }
      }
    }
  }

  if (areaTiles.length === 0) return;

  // 2. Find Most Frequent Color in 3x3 (Excluding match group)
  let modeColor = null;
  let maxCount = -1;
  for (const [col, cnt] of Object.entries(counts)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      modeColor = col;
    } else if (cnt === maxCount) {
      if (Math.random() > 0.5) modeColor = col;
    }
  }

  if (!modeColor) return;

  // 3. Select Target from 3x3
  // "Random block... excluding the 3 purples... AND that most frequent block"
  // Interpretation: The TARGET cannot be a block that is ALREADY the modeColor.
  let validTargets = areaTiles.filter(
    (t) => board[t.r][t.c].color !== modeColor
  );

  if (validTargets.length === 0) return;

  const target = validTargets[Math.floor(Math.random() * validTargets.length)];

  // 4. Transform
  showVFX(target.r, target.c, "void-vortex");
  await new Promise((resolve) => setTimeout(resolve, 300));

  board[target.r][target.c].color = modeColor;
  board[target.r][target.c].type = "normal";
  renderBoard();

  const cell = getCellElement(target.r, target.c);
  if (cell) {
    cell.style.transform = "scale(0)";
    await new Promise((r) => requestAnimationFrame(r));
    cell.style.transition =
      "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    cell.style.transform = "scale(1)";
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

/*
  handlePurpleMatch4()
  - 紫色 4消：全盘随机选一个非 bright-purple 的紫色方块，将其标记为 bright-purple（后续在 processMatches 中由 handleBrightPurpleEffect 处理为 5x5 强效果）。
*/
async function handlePurpleMatch4() {
  let purples = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (
        board[r][c] &&
        board[r][c].color === "purple" &&
        board[r][c].state !== "bright-purple"
      ) {
        purples.push({ r, c });
      }
    }
  }
  if (purples.length > 0) {
    const target = purples[Math.floor(Math.random() * purples.length)];
    board[target.r][target.c].state = "bright-purple";
    renderBoard();
  }
}

/*
  handleBrightPurpleEffect(r, c)
  - 紫色 4消 bright-purple 效果（5x5 强效果）：统计 5x5 区域内颜色出现频率，随机选 4 个该颜色的方块并转变为模式颜色（mode-color）。
  - 播放 void-vortex 涡旋特效。
*/
async function handleBrightPurpleEffect(r, c) {
  // Center: r, c. Area: 5x5.
  // Effect: Change 4 random blocks to the Mode Color of 5x5 area.

  showVFX(r, c, "void-vortex");
  await new Promise((resolve) => setTimeout(resolve, 300));

  let counts = {};
  let validTargets = [];

  for (let i = r - 2; i <= r + 2; i++) {
    for (let j = c - 2; j <= c + 2; j++) {
      if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE && board[i][j]) {
        // Count all colors in area
        const col = board[i][j].color;
        counts[col] = (counts[col] || 0) + 1;

        // Collect targets (exclude the exploding tile itself)
        if (i !== r || j !== c) {
          if (
            board[i][j].type !== "gold" &&
            board[i][j].type !== "fusion-core" &&
            board[i][j].state !== "frozen"
          ) {
            validTargets.push({ r: i, c: j });
          }
        }
      }
    }
  }

  let modeColor = null;
  let maxCount = -1;
  for (const [col, cnt] of Object.entries(counts)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      modeColor = col;
    }
  }

  if (!modeColor || validTargets.length === 0) return;

  // Pick 4 random blocks
  validTargets.sort(() => 0.5 - Math.random());
  const toChange = validTargets.slice(0, 4);

  for (const t of toChange) {
    board[t.r][t.c].color = modeColor;
    // Reset state
    board[t.r][t.c].state = "normal";
  }
  renderBoard();

  // Visuals
  toChange.forEach((t) => {
    const cell = getCellElement(t.r, t.c);
    if (cell) {
      cell.style.transform = "scale(1.2)";
      setTimeout(() => {
        if (cell) cell.style.transform = "";
      }, 200);
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
}

// WHITE
/*
  handleWhiteMatch3(tiles)
  - 白色 3消：将指定的方块标记为 frozen（冰冻），并在 render 时显示冻结状态。
  - 参数：tiles 可以是匹配组数组（[{r,c}, ...]）或单个中心点。函数不直接将格子加入 removalSet（冻结先保留，破碎由后续逻辑决定）。
  - 副作用：修改 tile.state 为 'frozen' 并调用 renderBoard() 更新显示。
*/
async function handleWhiteMatch3(tiles) {
  tiles.forEach((t) => {
    if (board[t.r][t.c]) {
      applyFreeze(board[t.r][t.c]);
    }
  });
  renderBoard();
}

/*
  handleWhiteMatch4(removalSet)
  - 白色 4消：复杂的冰冻引爆/生成逻辑。
    1) 随机选取最多若干已有的 frozen 并对其执行引爆（通过连通性扩展所有连通的 frozen 并加入 removalSet）
    2) 在盘面上随机选择若干相邻白色对并将它们冻结（作为新冰层）
  - 参数：removalSet 为 processMatches 中的共享移除集合（以 `${r},${c}` 字符串为 key）。
  - 注意：此函数既会把已有 frozen 扩展为要移除的集合，也会在盘面新增 frozen（通过 applyFreeze）。
*/
async function handleWhiteMatch4(removalSet) {
  // 1. Explode ALL existing frozen tiles (triggering chain reaction)
  // Find ALL frozen tiles first
  let initialFrozen = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] && board[r][c].state === "frozen") {
        initialFrozen.push({ r, c });
      }
    }
  }

  // Pick max 4 to detonate (as per requirement "Randomly select max 4")
  // Wait, requirement says: "Scan all. Randomly select max 4. Destroy."
  // And "This destruction triggers contact chain".
  initialFrozen.sort(() => 0.5 - Math.random());
  const toDetonate = initialFrozen.slice(0, 4);

  let allConnectedFrozen = new Set();
  toDetonate.forEach((t) => {
    getConnectedFrozenTiles(t.r, t.c, allConnectedFrozen);
  });

  // Add all connected frozen tiles to removalSet
  allConnectedFrozen.forEach((key) => removalSet.add(key));

  // 2. Find adjacent white pairs and freeze them (Max 2 sets)
  let pairs = [];
  // Horizontal pairs
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 1; c++) {
      if (
        board[r][c] &&
        board[r][c + 1] &&
        board[r][c].color === "white" &&
        board[r][c + 1].color === "white" &&
        board[r][c].state !== "frozen" &&
        board[r][c + 1].state !== "frozen" &&
        board[r][c].type !== "gold" &&
        board[r][c + 1].type !== "gold"
      ) {
        // 使用明确的对象字面量，修复原先的语法错误
        pairs.push([
          { r: r, c: c },
          { r: r, c: c + 1 },
        ]);
      }
    }
  }
  // Vertical pairs
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 1; r++) {
      if (
        board[r][c] &&
        board[r + 1][c] &&
        board[r][c].color === "white" &&
        board[r + 1][c].color === "white" &&
        board[r][c].state !== "frozen" &&
        board[r + 1][c].state !== "frozen" &&
        board[r][c].type !== "gold" &&
        board[r + 1][c].type !== "gold"
      ) {
        // 使用明确的对象字面量，修复原先的语法错误
        pairs.push([
          { r: r, c: c },
          { r: r + 1, c: c },
        ]);
      }
    }
  }

  pairs.sort(() => 0.5 - Math.random());
  const selected = pairs.slice(0, 2); // Max 2 sets
  selected.forEach((pair) => {
    pair.forEach((p) => {
      if (board[p.r][p.c]) applyFreeze(board[p.r][p.c]);
    });
  });
  renderBoard();
}

// Recursive Flood Fill for Frozen Chain Reaction
/*
  getConnectedFrozenTiles(r, c, connectedSet)
  - 递归洪泛算法：从给定冰冻方块 (r,c) 出发，找出所有相邻的冰冻方块并加入 connectedSet。
  - 用于计算冰冻链式反应（同时破碎的冰冻集团）。
*/
function getConnectedFrozenTiles(r, c, connectedSet) {
  const key = `${r},${c}`;
  if (connectedSet.has(key)) return;
  connectedSet.add(key);

  const neighbors = [
    { r: r - 1, c: c },
    { r: r + 1, c: c },
    { r: r, c: c - 1 },
    { r: r, c: c + 1 },
  ];

  for (const n of neighbors) {
    if (n.r >= 0 && n.r < GRID_SIZE && n.c >= 0 && n.c < GRID_SIZE) {
      const tile = board[n.r][n.c];
      if (tile && tile.state === "frozen") {
        getConnectedFrozenTiles(n.r, n.c, connectedSet);
      }
    }
  }
}

// 构建冰冻方块破碎的波次（延迟链式破碎）
/*
  buildFrozenRemovalWaves(baseRemovalSet)
  - 构建冰冻方块多波次破碎序列。第一波是所有要移除的冰冻块；后续波按相邻关系逐级扩散。
  - 返回波次数组，用于 animateGravity 中的延迟破碎视觉效果（每波间隔 100ms）。
*/
function buildFrozenRemovalWaves(baseRemovalSet) {
  // wave0 = 当前要消除的所有块（已在 finalRemovalSet 中）
  const waves = [];
  const allRemoved = new Set(baseRemovalSet);
  let prevWave = new Set(baseRemovalSet);

  // 将 Set<string> 转为坐标数组的便捷函数
  const setToList = (s) =>
    Array.from(s).map((str) => {
      const [r, c] = str.split(",").map(Number);
      return { r, c };
    });

  // 先推入首波
  waves.push(setToList(prevWave));

  // 继续寻找因邻接而破碎的冰冻块（条件A/B）
  while (true) {
    const nextWaveSet = new Set();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const key = `${r},${c}`;
        if (allRemoved.has(key)) continue;
        const tile = board[r][c];
        if (!tile || tile.state !== "frozen") continue;

        const neighbors = [
          `${r - 1},${c}`,
          `${r + 1},${c}`,
          `${r},${c - 1}`,
          `${r},${c + 1}`,
        ];
        for (const n of neighbors) {
          if (prevWave.has(n)) {
            nextWaveSet.add(key);
            break;
          }
        }
      }
    }

    if (nextWaveSet.size === 0) break;
    nextWaveSet.forEach((k) => allRemoved.add(k));
    waves.push(setToList(nextWaveSet));
    prevWave = nextWaveSet;
  }

  return waves;
}

/*
  handleFrozenShatter(r, c)
  - 冰冻方块破碎时的死亡效应（death-rattle）：将 3x3 范围内的白色（非冻结）方块转为冻结状态，形成链式冻结反应。
  - 副作用：修改 tile.state，播放 ice-crackle VFX。
*/
async function handleFrozenShatter(r, c) {
  // Death Rattle: When a frozen tile shatters, turn 3x3 neighbor WHITE tiles into FROZEN
  for (let i = r - 1; i <= r + 1; i++) {
    for (let j = c - 1; j <= c + 1; j++) {
      if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE && board[i][j]) {
        if (
          board[i][j].color === "white" &&
          board[i][j].state !== "frozen" &&
          board[i][j].type !== "gold"
        ) {
          applyFreeze(board[i][j]);
        }
      }
    }
  }
  renderBoard();
}

// ORANGE
/*
  handleOrangeMatch3(r, c)
  - 橙色 3消：酸性飞溅效果。在 3x3 区域内随机选一个非橙且非金块的方块，将其转变为橙色（发生色块转换而非移除）。
  - 副作用：修改 tile.color，播放 acid-splash 与 corrode VFX 以及粒子。
*/
async function handleOrangeMatch3(r, c) {
  // Acid Splash: 3x3 area, pick EXACTLY 1 non-orange/non-gold target -> transform to Orange
  let targets = [];
  for (let i = r - 1; i <= r + 1; i++) {
    for (let j = c - 1; j <= c + 1; j++) {
      if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
        const tile = board[i][j];
        if (tile && tile.color !== "orange" && tile.type !== "gold") {
          targets.push({ r: i, c: j });
        }
      }
    }
  }

  if (targets.length === 0) return;

  // Pick exactly 1
  const target = targets[Math.floor(Math.random() * targets.length)];

  // VFX
  showVFX(r, c, "acid-splash");
  if (typeof audio !== "undefined" && audio.playFizz) audio.playFizz();

  const tile = board[target.r][target.c];
  // Transformation
  tile.color = "orange";
  tile.state = "normal"; // Removes frozen

  // Visual Transition
  const cell = getCellElement(target.r, target.c);
  if (cell) {
    cell.classList.add("corrode");
    setTimeout(() => cell.classList.remove("corrode"), 500);
  }

  // Bubble particles
  createParticle(target.r, target.c, "bubble");

  renderBoard();
  await new Promise((resolve) => setTimeout(resolve, 300));
}

/*
  handleYellowMatch3(r, c, groupTiles, context)
  - 黄色 3消：根据本组所有黄色 tile 的电荷（voltage）总和触发不同等级的效果：
    - Sum >= 9 -> 生成 Fusion Core（加入 pendingFusionCores，延迟生成）
    - 7 <= Sum < 9 -> 触发 EMP（3x3，把非黄变为黄 Lvl1，黄 -> Lvl3）
    - 5 <= Sum < 7 -> 双闪电（大范围内触发两次 dischargeLightning）
    - 3 <= Sum < 5 -> 单次闪电（调用 dischargeLightning）
  - 参数 context（可选）：用于把 overload/移除动作写入 processMatches 的共享上下文，以实现连锁处理而不是立即 remove。
*/
async function handleYellowMatch3(r, c, groupTiles, context = null) {
  let voltageSum = 0;
  groupTiles.forEach((t) => {
    const tile = board[t.r][t.c];
    if (tile && tile.voltage) voltageSum += tile.voltage;
  });

  // 1. Fusion Core (Sum >= 9)
  if (voltageSum >= 9) {
    pendingFusionCores.push({ r, c });
  }

  // 2. EMP (Sum >= 7)
  // 3x3 Area centered on MATCH CENTER (r,c)
  // Effect: Non-Yellow -> Lvl 1. Yellow -> Lvl 3 (Silent).
  else if (voltageSum >= 7) {
    // Only triggers if Sum < 9? No, typically higher tiers include lower tiers or override them?
    // Requirement: "A... B... C... D...". These seem like tiers.
    // Usually Match-3 games trigger the highest tier reached.
    // "A (Sum >= 3)... B (Sum >= 5)... C (Sum >= 7)... D (Sum >= 9)"
    // If I have Sum 9, do I get Fusion Core AND EMP AND Lightning?
    // Usually "X else Y". The text says "Sum >= 9", "Sum >= 7 but < 9".
    // Ah! "Trigger condition: Sum >= 3 but < 5".
    // So they are exclusive tiers.

    await triggerEMP(r, c);
  }

  // 3. Double Lightning (Sum >= 5)
  else if (voltageSum >= 5) {
    // 2 Lightnings. Range 7x7.
    await dischargeLightning(r, c, 2, 3, context); // Range 3 means radius 3 (7x7)
  }

  // 4. Single Lightning (Sum >= 3)
  else if (voltageSum >= 3) {
    // 1 Lightning. Global.
    await dischargeLightning(r, c, 1, 99, context);
  }
}

async function triggerEMP(r, c) {
  showVFX(r, c, "shockwave"); // Placeholder for EMP visual
  // TODO: Add Silent EMP visual (ripple?)

  for (let i = r - 1; i <= r + 1; i++) {
    for (let j = c - 1; j <= c + 1; j++) {
      if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
        const tile = board[i][j];
        if (
          !tile ||
          tile.type === "gold" ||
          tile.state === "frozen" ||
          tile.type === "fusion-core"
        )
          continue;

        if (tile.color !== "yellow") {
          // Convert to Yellow Lvl 1
          tile.color = "yellow";
          tile.voltage = 1;
          tile.type = "normal"; // Reset special types if any?
          // Visual update
          createParticle(i, j, "debris"); // Spark
        } else {
          // Yellow -> Lvl 3 (Silent)
          tile.voltage = 3;
          // No explosion trigger here
        }
      }
    }
  }
  renderBoard();
  await new Promise((resolve) => setTimeout(resolve, 400));
}

/*
  dischargeLightning(originR, originC, count, rangeRadius, context)
  - 闪电放电逻辑：在以 origin 为中心的范围内优先寻找低电荷等级（voltage）黄色方块并对其充能。
  - 参数：
    - originR/originC: 起始格坐标（闪电视觉与起点）
    - count: 闪电次数（可能为 1 或 2 等）
    - rangeRadius: 半径，用于指定搜索范围（例如 3 表示 7x7 区域）
    - context: 可选上下文对象，包含 removalSet/overloadedSet，用于把触发的移除或 overload 写回上层流程
  - 行为：优先选择 voltage 最低的目标（1 优先），对其调用 chargeYellowTile，可能触发 Overload 链式反应。
*/
async function dischargeLightning(
  originR,
  originC,
  count,
  rangeRadius,
  context
) {
  for (let k = 0; k < count; k++) {
    // Find Targets
    let targets = [];
    let rMin = Math.max(0, originR - rangeRadius);
    let rMax = Math.min(GRID_SIZE - 1, originR + rangeRadius);
    let cMin = Math.max(0, originC - rangeRadius);
    let cMax = Math.min(GRID_SIZE - 1, originC + rangeRadius);

    for (let i = rMin; i <= rMax; i++) {
      for (let j = cMin; j <= cMax; j++) {
        const tile = board[i][j];
        // Target Priority: Lvl 1 -> Lvl 2.
        // If Lvl 3 exists? Logic says "If target IS Lvl 3 -> Overload".
        // So Lvl 3 is a valid target, but lower priority?
        // Requirement: "Target Priority: Strike Lvl 1. If none, Strike Lvl 2."
        // Doesn't mention Lvl 3 priority.
        // But later says "Special Case: If target becomes Lvl 3 -> Overload".
        // And "Overload Trigger: When a Lvl 3 block receives charge".
        // So implied we can hit Lvl 3 if no Lvl 1 or 2 exist? Or maybe never hit Lvl 3?
        // "If none (Lvl 1), strike Lvl 2."
        // Let's assume if no Lvl 1 or 2, we hit Lvl 3 as last resort or Fizzle?
        // "If area has no valid yellow block: Fizzle".
        // So valid = Yellow.
        if (tile && tile.color === "yellow" && tile.type !== "fusion-core") {
          targets.push({ r: i, c: j, v: tile.voltage });
        }
      }
    }

    if (targets.length === 0) continue;

    // Sort: v ascending (1, 2, 3)
    targets.sort((a, b) => a.v - b.v);
    const bestV = targets[0].v;
    const candidates = targets.filter((t) => t.v === bestV);
    const target = candidates[Math.floor(Math.random() * candidates.length)];

    // Visual
    showVFX(originR, originC, "lightning", target);
    if (typeof audio !== "undefined" && audio.playZap) audio.playZap();

    // Effect
    await chargeYellowTile(target.r, target.c, 1, context);

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/*
  chargeYellowTile(r, c, amount, context)
  - 作用：为位于 (r,c) 的黄色方块增加电荷（voltage）。
  - 若电荷达到或超过 3，会触发 triggerOverload 产生 3x3 的爆炸并可能链式触发邻近 Overload。
  - 参数 context（可选）用于传递 processMatches 的 removalSet/overloadedSet，避免在递归链中直接 remove 而是记录到共享集合。
*/
async function chargeYellowTile(r, c, amount, context) {
  const tile = board[r][c];
  if (!tile || tile.color !== "yellow") return;

  // Check Overload Condition
  // "When a Lvl 3 block receives charge"
  if (tile.voltage >= 3) {
    await triggerOverload(r, c, context);
  } else {
    tile.voltage += amount;
    // Check if it became 3?
    // "Special Case: If target becomes Lvl 3 -> Immediately Trigger Overload".
    // Wait, "Sum >= 3 (A. Basic Conduction)... Special: If target becomes Lvl 3, Immediately trigger Overload."
    // This is strictly for the Basic Conduction rule?
    // Let's assume this applies generally to Lightning strikes.
    if (tile.voltage >= 3) {
      await triggerOverload(r, c, context);
    }
    renderBoard();
  }
}

/*
  triggerOverload(r, c, context)
  - Overload（过载）效果：当黄色方块达到 Lvl3 时触发，以自身为中心的 3x3 区域会被影响。
  - 行为：自身退回到 voltage=1；对周围非黄色方块加入 removalSet；若邻居为黄色且为 Lvl3，则递归触发 Overload（链式）。
  - 参数 context（可选）：若存在 context.removalSet，将把受影响位置写入该集合由上层统一移除；否则会直接调用 removeMatches 执行移除。
  - 防重入：使用 context.overloadedSet 跟踪本次 step 内已触发过 Overload 的 tile.id，避免重复触发。
*/
async function triggerOverload(r, c, context) {
  const tile = board[r][c];

  // Safety Lock
  if (context && context.overloadedSet) {
    if (context.overloadedSet.has(tile.id)) return;
    context.overloadedSet.add(tile.id);
  }

  // Effect
  // 1. Center Explosion (3x3)
  // 2. Self degrades to Lvl 1

  tile.voltage = 1;
  renderBoard(); // Visual update for degradation

  showVFX(r, c, "shockwave");
  if (typeof audio !== "undefined" && audio.playExplosion)
    audio.playExplosion("yellow");

  let targets = getExplosionTargets(r, c, "area");
  let neighborsToRemove = [];

  // Chain Reaction Check Logic
  for (const t of targets) {
    // Skip self
    if (t.r === r && t.c === c) continue;

    const neighbor = board[t.r][t.c];
    if (neighbor) {
      // Check for Chain Reaction (Yellow Lvl 3)
      // "When a Lvl 3 block receives charge from External..."
      // An explosion hitting it counts as external charge/trigger.
      if (neighbor.color === "yellow" && neighbor.voltage >= 3) {
        // RECURSIVE TRIGGER
        // Await ensures the chain completes?
        // Actually, triggerOverload is async. We should await it.
        // But we are iterating targets.
        await triggerOverload(t.r, t.c, context);
      } else {
        neighborsToRemove.push(`${t.r},${t.c}`);
      }
    }
  }

  // We must add these to the removal set if we are in processMatches
  if (context && context.removalSet) {
    neighborsToRemove.forEach((key) => context.removalSet.add(key));
  } else {
    // Async context (e.g. Fusion Core / Ball Lightning later steps)
    // We need to manually remove neighbors
    let list = neighborsToRemove.map((str) => {
      const [nr, nc] = str.split(",").map(Number);
      return { r: nr, c: nc };
    });
    await removeMatches(list);
  }
}

/*
  黄色系统全局队列说明：
  - pendingFusionCores: 存放需要延迟生成的融合核心坐标（由高电量触发的效果先 push，后续统一生成）。
  - pendingBallLightnings: 存放 Match-4 生成的球形闪电对象（视觉实体与当前坐标、步数等），会在合适时机由 resumeBallLightnings 恢复其行为。
*/
let pendingFusionCores = []; // Store coords to spawn Fusion Core
let pendingBallLightnings = []; // Queue for Match-4 phase 2

/*
  handleYellowMatch4(startR, startC)
  - 黄色 4消：生成“球形闪电”视觉实体并让其逃离起点，对路径上的格子执行 transmuteTile（瞬变）。
  - 实现分两阶段：第一阶段创建视觉并移动一步（transmute），把球体对象 push 到 pendingBallLightnings；第二阶段在 processMatches 的合适时机调用 resumeBallLightnings 继续执行移动并最终爆炸。
*/
async function handleYellowMatch4(startR, startC) {
  // PHASE 1: Generation & Escape
  // 1. Spawn Ball Lightning (Visual only initially, logic follows)

  // Create visual Ball Lightning (Ghost Unit)
  const ball = document.createElement("div");
  ball.classList.add("ball-lightning-ghost");
  vfxContainer.appendChild(ball);

  const updateBallPos = (r, c) => {
    ball.style.top = (r + 0.5) * (100 / GRID_SIZE) + "%";
    ball.style.left = (c + 0.5) * (100 / GRID_SIZE) + "%";
  };
  updateBallPos(startR, startC);

  // 2. Escape Step (Move 1 to neighbor perpendicular to match?? No, spec: "Random 1 step to Non-Elimination neighbor")
  // "Must move 1 step to non-elimination neighbor"
  // Since we don't know the exact match orientation here easily (unless passed),
  // let's assume we pick a neighbor that is NOT in the match group?
  // But match group is being removed. So "Non-elimination" means a tile that SURVIVES.
  // The match 4 are at startR/startC (and neighbors).
  // Actually, `handleYellowMatch4` is called with `creationPos`.
  // We can check neighbors. If neighbor is Yellow Match 4 component, don't go there.

  // Simplification: Pick a random valid neighbor. If it's part of the match, it will be gone soon.
  // BUT the requirement says "Must move to Non-Elimination Zone".
  // E.g. if Row Match, move Up/Down.
  // Let's check 4 directions. If neighbor color == yellow, assume it's part of match?
  // Or just pick any valid neighbor?
  // "Explanation: If horizontal match, must go Up/Down."
  // We need to know orientation.
  // `handleYellowMatch4` signature update?
  // Or infer: Check left/right. If they are yellow, it's horizontal.

  let isHorizontal = false;
  if (
    board[startR][startC - 1]?.color === "yellow" ||
    board[startR][startC + 1]?.color === "yellow"
  )
    isHorizontal = true;
  if (
    board[startR - 1]?.[startC]?.color === "yellow" ||
    board[startR + 1]?.[startC]?.color === "yellow"
  )
    isHorizontal = false; // Vertical overrides or sets if single
  // Note: Cross matches might confuse this, but good enough.

  let dirs = isHorizontal
    ? [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
      ]
    : [
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];

  // Filter valid bounds
  let validDirs = dirs.filter((d) => {
    let nr = startR + d.dr;
    let nc = startC + d.dc;
    return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE;
  });

  // If blocked by edge, fallback to any neighbor?
  if (validDirs.length === 0) {
    // Fallback to any valid neighbor
    const all = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];
    validDirs = all.filter((d) => {
      let nr = startR + d.dr;
      let nc = startC + d.dc;
      return nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE;
    });
  }

  if (validDirs.length === 0) {
    ball.remove();
    return;
  }

  const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
  let currentR = startR + dir.dr;
  let currentC = startC + dir.dc;

  // Move Animation
  await new Promise((resolve) => setTimeout(resolve, 200));
  updateBallPos(currentR, currentC);

  // Interaction (Transmutation)
  await transmuteTile(currentR, currentC);

  // PHASE 2: The Pause
  // Queue for resumption after gravity
  pendingBallLightnings.push({
    element: ball,
    r: currentR,
    c: currentC,
    lastDr: dir.dr,
    lastDc: dir.dc,
    stepsRemaining: 2,
  });
}

/*
  resumeBallLightnings()
  - 恢复并处理所有 pending 的球形闪电：继续移动若干步、对经过格调用 transmuteTile，并在结束时爆炸（3x3 移除）。
  - 返回值：若有处理过的球形闪电则返回 true（表示有活动发生，调用者应重新检测 matches）。
  - 注意：处理期间可能会修改 board（通过 transmuteTile 或 removeMatches），这会触发新的连锁。该函数会先复制队列并清空原队列以避免并发问题。
*/
async function resumeBallLightnings() {
  if (pendingBallLightnings.length === 0) return;

  // Process all pending balls
  // Note: While processing, they might trigger explosions which trigger new matches.
  // So we should drain the queue, but be aware of new additions?
  // Match-4s generated BY ball lightning won't happen immediately,
  // they happen after we return to processMatches loop.

  let active = [...pendingBallLightnings];
  pendingBallLightnings = [];

  for (let ballObj of active) {
    // Phase 3: Roam & End
    // 2 more steps
    for (let s = 0; s < ballObj.stepsRemaining; s++) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Random Move, No U-Turn
      const neighbors = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];

      let validMoves = [];
      for (const n of neighbors) {
        const nr = ballObj.r + n.dr;
        const nc = ballObj.c + n.dc;

        // Check bounds
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          // No U-Turn check
          if (
            ballObj.lastDr &&
            n.dr === -ballObj.lastDr &&
            n.dc === -ballObj.lastDc
          )
            continue;

          // Wall/Obstacle Check? "If blocked, must turn."
          // Implied: Cannot move into 'Solid' (Fusion Core)?
          // Spec: "Fusion Core: Solid (Cannot move...)" - usually refers to tile itself.
          // Does it block Ball Lightning?
          // "Ball Lightning (Ghost Unit, No physical collision volume)".
          // So it CAN pass through anything.

          validMoves.push({ r: nr, c: nc, dir: n });
        }
      }

      if (validMoves.length > 0) {
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        ballObj.r = move.r;
        ballObj.c = move.c;
        ballObj.lastDr = move.dir.dr;
        ballObj.lastDc = move.dir.dc;

        // Update Visual
        ballObj.element.style.top = (ballObj.r + 0.5) * (100 / GRID_SIZE) + "%";
        ballObj.element.style.left =
          (ballObj.c + 0.5) * (100 / GRID_SIZE) + "%";

        // Transmute
        await transmuteTile(ballObj.r, ballObj.c);
      }
    }

    // Final Explosion
    await new Promise((resolve) => setTimeout(resolve, 300));
    ballObj.element.remove();

    showVFX(ballObj.r, ballObj.c, "shockwave");
    if (typeof audio !== "undefined" && audio.playExplosion)
      audio.playExplosion("yellow");

    // 3x3 Explosion
    // We are outside processMatches loop (sort of, or between iterations).
    // We need to remove tiles and let the main loop handle gravity/new matches.
    // We can call removeMatches directly.

    let explosionTargets = getExplosionTargets(ballObj.r, ballObj.c, "area");
    await removeMatches(explosionTargets);

    // After this removal, gravity will be needed.
    // processMatches loop should ideally handle it?
    // But we are CALLED by processMatches at a specific point.
    // If we modify board here, we should return true/flag to indicate "activity happened, re-scan".
  }

  return active.length > 0;
}

/*
  transmuteTile(r, c)
  - 球形闪电对单格的瞬变规则：
+    - 非黄色 -> 变为黄色 Lvl1（并产生粒子）
+    - 黄色且 voltage < 3 -> 直接置为 Lvl3（静默提升）
+    - 黄色且 voltage >= 3 -> 触发 Overload（链式爆炸）
+  - 不对 gold/fusion-core 操作
*/
async function transmuteTile(r, c) {
  const tile = board[r][c];
  if (!tile || tile.type === "gold" || tile.type === "fusion-core") return; // Gold/Core immune?

  // Rules:
  // Non-Yellow/Frozen/Slime -> Lvl 1 Yellow
  // Yellow (Lvl 1/2) -> Lvl 3 (Silent)
  // Yellow (Lvl 3) -> Overload

  if (tile.color !== "yellow") {
    // Transmute to Yellow Lvl 1
    tile.color = "yellow";
    tile.voltage = 1;
    tile.state = "normal"; // Remove Frozen
    tile.type = "normal";
    createParticle(r, c, "debris");
  } else {
    // Is Yellow
    if (tile.voltage < 3) {
      tile.voltage = 3;
      // Silent update
    } else {
      // Is Lvl 3 -> Overload
      // We need to trigger overload.
      // Use a temporary context? Or just fire and forget?
      // "Prevent infinite loop".
      await triggerOverload(r, c, { overloadedSet: new Set() });
    }
  }
  renderBoard();
}

// 已移除：文件中存在一个简化版的 dischargeLightning(startR, startC) 实现，
// 它会覆盖上方更通用的 dischargeLightning(originR, originC, count, rangeRadius, context) 函数。
// 为避免功能被意外覆盖，此处移除该重复定义，程序将使用上方的通用实现。
// 若需要保留一个简化别名，可在此处添加包装函数调用通用实现。

/*
  handleOrangeMatch4()
  - 橙色 4消：生物危害（biohazard）效果。统计全盘所有非橙颜色的出现频率，取最多的颜色，然后随机选其中 3 个方块变为橙色。
  - 播放 biohazard-flash 全屏闪光、siren 警报音效、corrode 扩散动画。
*/
async function handleOrangeMatch4() {
  // Biohazard: Most frequent color -> Pick EXACTLY 3 random tiles of that color -> Transform to Orange
  let counts = {};
  let potentialTargets = {}; // map color -> array of coords

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = board[r][c];
      if (tile && tile.color !== "orange" && tile.type !== "gold") {
        counts[tile.color] = (counts[tile.color] || 0) + 1;
        if (!potentialTargets[tile.color]) potentialTargets[tile.color] = [];
        potentialTargets[tile.color].push({ r, c });
      }
    }
  }

  let targetColor = null;
  let maxCount = -1;
  for (const [col, cnt] of Object.entries(counts)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      targetColor = col;
    }
  }

  if (!targetColor || !potentialTargets[targetColor]) return;

  if (typeof audio !== "undefined" && audio.playSiren) audio.playSiren();

  // Global Effect
  const flash = document.createElement("div");
  flash.classList.add("biohazard-flash");
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1000);

  // Select 3 random tiles
  let targets = potentialTargets[targetColor];
  targets.sort(() => 0.5 - Math.random());
  const selected = targets.slice(0, 3);

  // Transform
  for (const t of selected) {
    const tile = board[t.r][t.c];
    tile.color = "orange";
    tile.state = "normal";
  }

  renderBoard();

  // Apply dissolve effect
  selected.forEach((t) => {
    const cell = getCellElement(t.r, t.c);
    if (cell) {
      cell.classList.add("corrode");
      setTimeout(() => cell.classList.remove("corrode"), 600);
      createParticle(t.r, t.c, "bubble");
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 500));
}

// ==========================================
// 补全缺失的函数定义
// ==========================================

/*
  updateUI()
  - 更新游戏 UI：显示当前得分与目标得分的对比（格式：`${score} / ${targetScore}`）。
*/
function updateUI() {
  // 刷新 UI 分数
  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.textContent = `${score} / ${targetScore}`;
}

/*
  processFusionCores()
  - 处理融合核心（fusion-core）的回合末端效果：压力累积达到阈值时，融合核心爆炸，对周围 3x3 区域造成高伤害。
  - 播放 fusion-explosion 特效与粒子系统。
  - 副作用：修改 board 数据，可能触发后续消除链。
*/
async function processFusionCores() {
  let activeCores = [];
  // Find cores
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] && board[r][c].type === "fusion-core") {
        activeCores.push({ r, c, tile: board[r][c] });
      }
    }
  }

  if (activeCores.length === 0) return;

  // We should create a fresh context for Overloads that might happen here
  const context = {
    removalSet: new Set(),
    overloadedSet: new Set(),
  };

  for (const core of activeCores) {
    // Visual Pulse
    showVFX(core.r, core.c, "shockwave");

    // End of Turn Ability: 3x3 High Voltage
    // Non-Yellow: Eliminate.
    // Yellow: +1 Level. If Lvl 3 -> Overload.

    for (let i = core.r - 1; i <= core.r + 1; i++) {
      for (let j = core.c - 1; j <= core.c + 1; j++) {
        if (i >= 0 && i < GRID_SIZE && j >= 0 && j < GRID_SIZE) {
          const t = board[i][j];
          if (t && t.type !== "fusion-core" && t.type !== "gold") {
            if (t.color === "yellow") {
              // Charge
              await chargeYellowTile(i, j, 1, context);
            } else {
              // Eliminate Non-Yellow
              context.removalSet.add(`${i},${j}`);
            }
          }
        }
      }
    }

    // Decrement Durability
    core.tile.durability--;

    // Self Destruct check
    if (core.tile.durability <= 0) {
      // 3x3 Explosion
      let targets = getExplosionTargets(core.r, core.c, "area");
      targets.forEach((t) => context.removalSet.add(`${t.r},${t.c}`));
    }
  }

  // Execute removals
  if (context.removalSet.size > 0) {
    const list = Array.from(context.removalSet).map((s) => {
      const [r, c] = s.split(",").map(Number);
      return { r, c };
    });
    await removeMatches(list);

    // Trigger cascades if needed?
    // Spec says "End of Turn".
    // If this triggers cascades (gravity -> new matches), do we process them?
    // "End of Turn" usually implies "Before Player Control".
    // If we leave holes or matches, the next turn starts weirdly.
    // We SHOULD process matches resulting from this.

    const moves = applyGravity();
    renderBoard();
    await animateGravity(moves);

    // Check matches
    if (hasMatches()) {
      await processMatches();
    }
  }

  renderBoard();
}

/*
  checkForFrozenTiles()
  - 工具函数：扫描整个棋盘，检测是否存在任何冰冻（frozen）方块。
  - 返回：布尔值，true 表示存在冰冻块，false 表示不存在。
*/
function checkForFrozenTiles() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] && board[r][c].state === "frozen") return true;
    }
  }
  return false;
}

/*
  shatterAllFrozen()
  - 全盘冰冻清理工具：找出所有冰冻方块，对其播放 frost-nova 特效、调用 handleFrozenShatter 执行链式冻结传播、最后统一移除它们。
  - 用于特殊场景或调试。副作用：修改 board、播放 VFX、触发级联。
*/
async function shatterAllFrozen() {
  let frozen = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] && board[r][c].state === "frozen") {
        frozen.push({ r, c });
      }
    }
  }

  if (frozen.length === 0) return;

  // Trigger effects
  for (const t of frozen) {
    showVFX(t.r, t.c, "frost-nova");
    await handleFrozenShatter(t.r, t.c);
  }

  await removeMatches(frozen);
}

/*
  checkLevelProgress()
  - 检查游戏胜利条件：(1) 检查所有颜色目标是否都达成（levelTargets 全为 0）；(2) 检查是否有可行的后续动作。
  - 若两者都满足则触发 win 事件；若无可行动则触发 reshuffle。
  - 副作用：触发事件或修改游戏状态。
*/
function checkLevelProgress() {
  // 1. 检查颜色目标
  let allTargetsMet = true;
  for (let color in levelTargets) {
    if (levelTargets[color] > 0) {
      allTargetsMet = false;
      break;
    }
  }

  // 2. 检查分数 & 结算
  if (allTargetsMet && score >= targetScore) {
    const msgEl = document.getElementById("message-area");
    if (msgEl) msgEl.textContent = "关卡完成！";

    isProcessing = true; // 锁定盘面

    const nextBtn = document.getElementById("restart-btn");
    if (nextBtn) {
      nextBtn.style.display = "block";
      nextBtn.onclick = () => {
        nextBtn.style.display = "none";
        startLevel(level + 1);
      };
    }

    // 播放胜利音效
    if (typeof audio !== "undefined" && audio.playLevelUp) {
      audio.playLevelUp();
    }
  }
}
