// ==========================================
// 【版本号管理】版本格式: MM.dd.HH.mm (月.日.小时.分钟)
// ⚠️ 每次修改代码时，必须更新下方版本号！
// 当前版本：v12.5.23.00 (2025年12月5日 23:00 修改)
// 历史版本：
//   - v12.5.23.00: 关卡编辑器全面完善（2025-12-05 23:00）- 添加游戏板布局编辑器、预览功能、撤销/重做、批量操作
//   - v12.5.22.30: 关卡编辑器完善（2025-12-05 22:30）- 添加 theme/specialRules 编辑、复制、排序、导入验证、UX 优化
//   - v12.5.22.00: 初版（2025-12-05 22:00）- 特效增强 + 版本号系统添加
// ==========================================
const GAME_VERSION = "12.5.23.00";

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

// 游戏状态保存相关常量
const LEVEL_STATE_KEY_PREFIX = "mymatch_level_state_v1_";

// 默认颜色权重配置（用于没有设置权重的关卡）
const DEFAULT_COLOR_WEIGHTS = {
  "red": 12,
  "blue": 12,
  "green": 12,
  "purple": 12,
  "white": 12,
  "orange": 20,
  "yellow": 20
};

// 当前关卡的颜色权重配置
let currentLevelWeights = {...DEFAULT_COLOR_WEIGHTS};

const gridContainer = document.getElementById("grid-container");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const messageArea = document.getElementById("message-area");
const versionDisplay = document.getElementById("version-display");
const targetPanel = document.getElementById("target-panel");

// VFX System: 用于放置所有视觉特效元素的容器（将在 DOMContentLoaded 中统一 append）
const vfxContainer = document.createElement("div");
vfxContainer.classList.add("vfx-container");

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
  
  // 在用户离开页面时保存游戏状态
  window.addEventListener('beforeunload', () => {
    // 在用户离开页面时保存游戏状态
    if (level && board) {
      saveGameState();
    }
  });
  
  // 添加权重输入框事件监听器（仅在编辑器中存在这些元素）
  const weightInputs = document.querySelectorAll('.color-weight-input');
  if (weightInputs.length > 0) {
    const weightsTotal = document.getElementById('weights-total');
    
    weightInputs.forEach(input => {
      // 添加事件监听器
      input.addEventListener('input', function() {
        const color = this.dataset.color;
        const weight = parseInt(this.value) || 0;
        
        // 更新当前权重配置
        currentLevelWeights[color] = weight;
        
        // 计算总权重
        const total = Object.values(currentLevelWeights).reduce((sum, w) => sum + w, 0);
        if (weightsTotal) {
          weightsTotal.textContent = total;
          weightsTotal.style.color = total === 100 ? 'green' : 'red';
        }
      });
    });
  }
  
  // 添加更新编辑器权重输入框的函数
  function updateEditorWeightInputs() {
    // 只在编辑器模式下更新权重输入框
    const weightInputs = document.querySelectorAll('.color-weight-input');
    if (weightInputs.length === 0) return; // 不在编辑器中，直接返回
    
    weightInputs.forEach(input => {
      const color = input.dataset.color;
      if (currentLevelWeights[color] !== undefined) {
        input.value = currentLevelWeights[color];
      }
    });
    
    // 更新总计显示
    const weightsTotal = document.getElementById('weights-total');
    if (weightsTotal) {
      const total = Object.values(currentLevelWeights).reduce((sum, w) => sum + w, 0);
      weightsTotal.textContent = total;
      weightsTotal.style.color = total === 100 ? 'green' : 'red';
    }
  }
});

function getWeightedRandomColor() {
  const totalWeight = Object.values(currentLevelWeights).reduce((sum, weight) => sum + weight, 0);
  let r = Math.random() * totalWeight;
  
  for (const [color, weight] of Object.entries(currentLevelWeights)) {
    if (r < weight) return color;
    r -= weight;
  }
  return COLORS[0];
}

function applyFreeze(tile) {
  if (tile.type === "gold") return; // Gold tiles are immune to freezing
  tile.state = "frozen";
}

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
      el.classList.add("void-vortex");
      vfxContainer.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  } else {
    vfxContainer.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
}

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
    const text = document.createElement("span");

    if (color.startsWith("__type__:")) {
      const typeName = color.replace("__type__:", "");
      icon.classList.add("target-icon", "target-type");
      icon.textContent = typeName;
      text.textContent = count > 0 ? `x ${count}` : "✔";
    } else if (COLORS.includes(color)) {
      icon.classList.add("target-icon", `color-${color}`);
      text.textContent = count > 0 ? count : "✔";
    } else {
      icon.classList.add("target-icon", "target-type");
      icon.textContent = color;
      text.textContent = count > 0 ? `x ${count}` : "✔";
    }

    item.appendChild(icon);
    item.appendChild(text);
    targetPanel.appendChild(item);
  }
}

function createBoard(initialLayout = null) {
  board = [];

  if (
    initialLayout &&
    Array.isArray(initialLayout) &&
    initialLayout.length === GRID_SIZE
  ) {
    for (let r = 0; r < GRID_SIZE; r++) {
      let row = [];
      const layoutRow = initialLayout[r];
      for (let c = 0; c < GRID_SIZE; c++) {
        const layoutTile = layoutRow && layoutRow[c];
        if (layoutTile && layoutTile.color) {
          let newTile = {
            id: nextTileId++,
            color: layoutTile.color,
            type: layoutTile.type || "normal",
            state: layoutTile.state || "normal",
          };
          if (layoutTile.voltage !== undefined) {
            newTile.voltage = layoutTile.voltage;
          } else if (layoutTile.color === "yellow") {
            newTile.voltage = Math.floor(Math.random() * 3) + 1;
          }
          if (layoutTile.durability !== undefined) {
            newTile.durability = layoutTile.durability;
          }
          row.push(newTile);
        } else {
          let color;
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
            newTile.voltage = Math.floor(Math.random() * 3) + 1;
          }
          row.push(newTile);
        }
      }
      board.push(row);
    }
    return;
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    let row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let color;
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
        newTile.voltage = Math.floor(Math.random() * 3) + 1;
      }
      row.push(newTile);
    }
    board.push(row);
  }
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
        if (tile.state !== "normal") {
          cell.classList.add(`state-${tile.state}`);
        }

        // Add voltage class for yellow tiles
        if (tile.color === "yellow" && tile.voltage) {
          cell.classList.add(`voltage-${tile.voltage}`);
        }

        // Add special classes for fusion core
        if (tile.type === "fusion-core") {
          cell.classList.add("type-fusion-core");
        }

        // Add gold class
        if (tile.type === "gold") {
          cell.classList.add("type-gold");
        }
      }

      gridContainer.appendChild(cell);
    }
  }
}