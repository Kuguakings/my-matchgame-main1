// ==========================================
// 【版本号管理】版本格式: MM.dd.HH.mm (月.日.小时.分钟)
// ⚠️ 每次修改代码时，必须更新下方版本号！
// 当前版本：v12.5.23.15 (2025年12月5日 23:15 修改)
// 历史版本：
//   - v12.5.23.15: 主题系统实现、编辑器优化（2025-12-05 23:15）- 关卡主题应用到界面、编辑器退出按钮、设置优化
//   - v12.5.23.00: 关卡编辑器全面完善（2025-12-05 23:00）- 添加游戏板布局编辑器、预览功能、撤销/重做、批量操作
//   - v12.5.22.30: 关卡编辑器完善（2025-12-05 22:30）- 添加 theme/specialRules 编辑、复制、排序、导入验证、UX 优化
//   - v12.5.22.00: 初版（2025-12-05 22:00）- 特效增强 + 版本号系统添加
// ==========================================
const GAME_VERSION = "12.5.23.15";

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
// 红、白、蓝、紫、绿各占16%（共80%）
// 橙色和黄色各占10%（共20%）
const DEFAULT_COLOR_WEIGHTS = {
  red: 16,
  blue: 16,
  green: 16,
  purple: 16,
  white: 16,
  orange: 10,
  yellow: 10,
};

// 当前关卡的颜色权重配置
let currentLevelWeights = { ...DEFAULT_COLOR_WEIGHTS };

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

// 加载状态管理
let loadingProgress = 0;
let isLoadingComplete = false;

/*
  initLoadingScreen()
  - 初始化加载屏幕UI
*/
function initLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  const startBtn = document.getElementById("start-game-btn");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      hideLoadingScreen();
      showMainMenu();
    });
  }
}

/*
  startLoading()
  - 开始加载流程，显示进度条
*/
function startLoading() {
  updateLoadingProgress(0);

  // 模拟加载进度
  const loadingSteps = [
    { progress: 20, task: "初始化游戏引擎..." },
    { progress: 40, task: "加载游戏资源..." },
    { progress: 60, task: "加载关卡数据..." },
    { progress: 80, task: "准备游戏界面..." },
    { progress: 100, task: "加载完成！" },
  ];

  let currentStep = 0;
  const stepInterval = setInterval(() => {
    if (currentStep < loadingSteps.length) {
      const step = loadingSteps[currentStep];
      updateLoadingProgress(step.progress, step.task);
      currentStep++;

      if (step.progress === 100) {
        clearInterval(stepInterval);
        // 实际加载数据
        loadGameData().then(() => {
          isLoadingComplete = true;
          showStartButton();
        });
      }
    }
  }, 300);
}

/*
  updateLoadingProgress(progress, task)
  - 更新加载进度条
*/
function updateLoadingProgress(progress, task = "") {
  loadingProgress = progress;
  const progressBar = document.getElementById("loading-progress-bar");
  const progressText = document.getElementById("loading-progress-text");

  if (progressBar) {
    // 创建或更新进度条填充元素
    let fillElement = progressBar.querySelector(".progress-fill");
    if (!fillElement) {
      fillElement = document.createElement("div");
      fillElement.className = "progress-fill";
      fillElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(90deg, #4ecdc4, #45b7d1);
        border-radius: 4px;
        transition: width 0.3s ease;
        width: 0%;
      `;
      progressBar.appendChild(fillElement);
    }
    fillElement.style.width = `${progress}%`;
  }

  if (progressText) {
    progressText.textContent = task || `${progress}%`;
  }
}

/*
  loadGameData()
  - 加载游戏数据（设置和关卡）
*/
function loadGameData() {
  return new Promise((resolve) => {
    // Load user settings and levels
    try {
      loadSettings();
    } catch (e) {
      console.warn("loadSettings failed:", e);
    }

    if (typeof loadLevels === "function") {
      loadLevels()
        .then(() => {
          // 数据加载完成后初始化游戏（但不显示菜单，等待用户点击开始游戏）
          initGame();
          resolve();
        })
        .catch((err) => {
          console.warn("loadLevels failed:", err);
          // 即使失败也初始化游戏
          initGame();
          resolve();
        });
    } else {
      // 如果没有 loadLevels 函数，直接初始化
      initGame();
      resolve();
    }
  });
}

/*
  showStartButton()
  - 显示开始游戏按钮
*/
function showStartButton() {
  const startBtn = document.getElementById("start-game-btn");
  if (startBtn) {
    startBtn.classList.remove("hidden");
    startBtn.style.animation = "fadeIn 0.5s ease-in";
  }
}

/*
  hideLoadingScreen()
  - 隐藏加载屏幕
*/
function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.add("hidden");
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);
  }
}

/*
  showMainMenu()
  - 显示主菜单
*/
function showMainMenu() {
  const mainMenuScreen = document.getElementById("main-menu-screen");
  if (mainMenuScreen) {
    mainMenuScreen.style.opacity = "0";
    mainMenuScreen.classList.remove("hidden");
    mainMenuScreen.style.display = "flex";
    // 淡入动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mainMenuScreen.style.transition = "opacity 0.3s ease-in";
        mainMenuScreen.style.opacity = "1";
      });
    });
  }

  // 隐藏游戏容器
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    gameContainer.style.transition = "opacity 0.3s ease-out";
    gameContainer.style.opacity = "0";
    setTimeout(() => {
      gameContainer.classList.add("hidden");
    }, 300);
  }
}

/*
  hideMainMenu()
  - 隐藏主菜单
*/
function hideMainMenu() {
  const mainMenuScreen = document.getElementById("main-menu-screen");
  if (mainMenuScreen) {
    mainMenuScreen.style.transition = "opacity 0.3s ease-out";
    mainMenuScreen.style.opacity = "0";
    setTimeout(() => {
      mainMenuScreen.classList.add("hidden");
    }, 300);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 初始化加载屏幕
  initLoadingScreen();

  // 开始加载流程
  startLoading();

  // 确保 gridContainer 存在
  if (!gridContainer) {
    console.error("gridContainer not found in DOMContentLoaded!");
    return;
  }

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
  window.addEventListener("beforeunload", () => {
    // 在用户离开页面时保存游戏状态
    if (level && board) {
      saveGameState();
    }
  });

  // 添加权重输入框事件监听器（仅在编辑器中存在这些元素）
  const weightInputs = document.querySelectorAll(".color-weight-input");
  if (weightInputs.length > 0) {
    const weightsTotal = document.getElementById("weights-total");

    weightInputs.forEach((input) => {
      // 添加事件监听器
      input.addEventListener("input", function () {
        const color = this.dataset.color;
        const weight = parseInt(this.value) || 0;

        // 更新当前权重配置
        currentLevelWeights[color] = weight;

        // 计算总权重
        const total = Object.values(currentLevelWeights).reduce(
          (sum, w) => sum + w,
          0
        );
        if (weightsTotal) {
          weightsTotal.textContent = total;
          weightsTotal.style.color = total === 100 ? "green" : "red";
        }
      });
    });
  }

  // 添加更新编辑器权重输入框的函数
  function updateEditorWeightInputs() {
    // 只在编辑器模式下更新权重输入框
    const weightInputs = document.querySelectorAll(".color-weight-input");
    if (weightInputs.length === 0) return; // 不在编辑器中，直接返回

    weightInputs.forEach((input) => {
      const color = input.dataset.color;
      if (currentLevelWeights[color] !== undefined) {
        input.value = currentLevelWeights[color];
      }
    });

    // 更新总计显示
    const weightsTotal = document.getElementById("weights-total");
    if (weightsTotal) {
      const total = Object.values(currentLevelWeights).reduce(
        (sum, w) => sum + w,
        0
      );
      weightsTotal.textContent = total;
      weightsTotal.style.color = total === 100 ? "green" : "red";
    }
  }

  // 注意：数据加载和游戏初始化现在由 startLoading() 和 loadGameData() 处理
  // 不再在这里直接调用 loadLevels 和 initGame
});

/*
  getWeightedRandomColor()
  - 按当前关卡的权重随机返回一个颜色字符串。
  - 返回值为 COLORS 数组内的一项。
*/
function getWeightedRandomColor() {
  const totalWeight = Object.values(currentLevelWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  let r = Math.random() * totalWeight;

  for (const [color, weight] of Object.entries(currentLevelWeights)) {
    if (r < weight) return color;
    r -= weight;
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

/*
  createParticle(r, c, type)
  - 作用：在格子 (r,c) 位置生成一次短暂的粒子特效（DOM 元素），用于碎裂、飞溅等视觉反馈。
  - 参数：
*/

// 添加更新编辑器权重输入框的函数
function updateEditorWeightInputs() {
  // 只在编辑器模式下更新权重输入框
  const weightInputs = document.querySelectorAll(".color-weight-input");
  if (weightInputs.length === 0) return; // 不在编辑器中，直接返回

  weightInputs.forEach((input) => {
    const color = input.dataset.color;
    if (currentLevelWeights[color] !== undefined) {
      input.value = currentLevelWeights[color];
    }
  });

  // 更新总计显示
  const weightsTotal = document.getElementById("weights-total");
  if (weightsTotal) {
    const total = Object.values(currentLevelWeights).reduce(
      (sum, w) => sum + w,
      0
    );
    weightsTotal.textContent = total;
    weightsTotal.style.color = total === 100 ? "green" : "red";
  }
}

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
      // Fallback: if we cannot compute exact cell bounds, just show a simple vortex element
      el.classList.add("void-vortex");
      vfxContainer.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  } else {
    // 默认特效展示（未知 type）: 简单添加元素并短时间移除
    vfxContainer.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }
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
    const text = document.createElement("span");

    // 支持三类 key：颜色 key（red/blue...），命名空间类型 key (__type__:name)，以及其它自定义 key
    if (color.startsWith("__type__:")) {
      const typeName = color.replace("__type__:", "");
      icon.classList.add("target-icon", "target-type");
      icon.textContent = typeName;
      text.textContent = count > 0 ? `x ${count}` : "✔";
    } else if (COLORS.includes(color)) {
      icon.classList.add("target-icon", `color-${color}`);
      text.textContent = count > 0 ? count : "✔";
    } else {
      // generic type name
      icon.classList.add("target-icon", "target-type");
      icon.textContent = color;
      text.textContent = count > 0 ? `x ${count}` : "✔";
    }

    item.appendChild(icon);
    item.appendChild(text);
    targetPanel.appendChild(item);
  }
}

/*
  createBoard(initialLayout)
  - 初始化并返回一个新的棋盘（写入全局 board 变量），避免初始三连消。
  - 每个 tile 包含字段：id, color, type, state，黄色会有 voltage 属性。
  - 如果提供了 initialLayout（来自关卡数据的 initialBoard），则使用该布局，否则随机生成。
*/
function createBoard(initialLayout = null) {
  board = [];

  // If initial layout provided, use it
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
          // Use provided tile
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
          // Fill empty spots with random tiles
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

  // Random generation (original logic)
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
  - 按当前关卡的权重随机返回一个颜色字符串。
  - 返回值为 COLORS 数组内的一项。
*/
function getWeightedRandomColor() {
  const totalWeight = Object.values(currentLevelWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  let r = Math.random() * totalWeight;

  for (const [color, weight] of Object.entries(currentLevelWeights)) {
    if (r < weight) return color;
    r -= weight;
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
  // 防御性检查：确保 gridContainer 存在
  if (!gridContainer) {
    console.error(
      "renderBoard: gridContainer not found! DOM may not be loaded."
    );
    // 尝试重新获取
    const retryContainer = document.getElementById("grid-container");
    if (retryContainer) {
      console.log("renderBoard: Successfully retried getting gridContainer");
      // 注意：这里不能直接赋值给 const，但可以继续使用 retryContainer
      retryContainer.innerHTML = "";
      retryContainer.appendChild(vfxContainer);
      // 继续使用 retryContainer 进行渲染
      _renderBoardCells(retryContainer);
      return;
    }
    return;
  }

  // 防御性检查：确保 board 数组已正确初始化
  if (!board || !Array.isArray(board) || board.length !== GRID_SIZE) {
    console.error("Board not properly initialized, recreating...");
    createBoard();
    // 如果重新创建后还是有问题，再次检查
    if (!board || !Array.isArray(board) || board.length !== GRID_SIZE) {
      console.error("Failed to create board, aborting render");
      return;
    }
  }

  gridContainer.innerHTML = "";
  gridContainer.appendChild(vfxContainer);

  _renderBoardCells(gridContainer);
}

function _renderBoardCells(container) {
  if (!container) {
    console.error("_renderBoardCells: container is null");
    return;
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    // 确保每一行都存在
    if (!board[r] || !Array.isArray(board[r])) {
      console.error(
        `Board row ${r} not properly initialized, recreating board...`
      );
      createBoard();
      // 重新创建后继续渲染（board 已重新创建）
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = board[r] && board[r][c] ? board[r][c] : null;

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

      // 添加进入动画类（初始状态）
      cell.classList.add("cell-entering");
      container.appendChild(cell);
    }
  }
}

/*
  animateLevelEntrance()
  - 为游戏网格添加进入动画效果
  - 使用淡入+缩放动画，按行列顺序依次出现
*/
function animateLevelEntrance() {
  const cells = gridContainer.querySelectorAll(".cell, .cell-placeholder");
  if (!cells || cells.length === 0) return;

  // 清除之前的动画类
  cells.forEach((cell) => {
    cell.classList.remove("cell-entering");
  });

  // 为每个单元格添加延迟动画
  cells.forEach((cell, index) => {
    const r = parseInt(cell.dataset.row) || 0;
    const c = parseInt(cell.dataset.col) || 0;

    // 计算延迟：基于位置，从中心向外扩散
    const centerR = GRID_SIZE / 2;
    const centerC = GRID_SIZE / 2;
    const distance = Math.sqrt(
      Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2)
    );
    const maxDistance = Math.sqrt(
      Math.pow(GRID_SIZE / 2, 2) + Math.pow(GRID_SIZE / 2, 2)
    );
    const delay = (distance / maxDistance) * 400; // 总动画时长约400ms

    // 设置动画延迟
    cell.style.animationDelay = `${delay}ms`;
    cell.classList.add("cell-entering");

    // 动画结束后移除类
    setTimeout(() => {
      cell.classList.remove("cell-entering");
      cell.style.animationDelay = "";
    }, delay + 300);
  });
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
      // 不再使用旧的playMatch，改用方块消除音效（在removeMatches中播放）
      // audio.playMatch(combo);

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

      // 播放方块消除音效（使用try-catch防止音效错误影响游戏）
      try {
        if (
          typeof audio !== "undefined" &&
          audio.playBlockDestroy &&
          tile.color
        ) {
          audio.playBlockDestroy(tile.color);
        }
      } catch (e) {
        console.warn("音效播放错误:", e);
      }
    }

    if (tile && levelTargets[tile.color] && levelTargets[tile.color] > 0) {
      levelTargets[tile.color]--;
      targetsUpdated = true;
    }

    // 支持按 tile.type / 特殊类型目标递减（关卡目标中以 "__type__:name" 存储）
    if (tile && tile.type) {
      const typeKey = "__type__:" + tile.type;
      if (levelTargets[typeKey] && levelTargets[typeKey] > 0) {
        levelTargets[typeKey]--;
        targetsUpdated = true;
      } else if (levelTargets[tile.type] && levelTargets[tile.type] > 0) {
        // 兼容直接使用 typeName 作为 key 的情况
        levelTargets[tile.type]--;
        targetsUpdated = true;
      }
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
  const selected = allReds.slice(0, Math.ceil(allReds.length * 0.5)); // 选择50%的红色方块

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
    return false;
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
    return true;
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

  if (areaTiles.length === 0) return false;

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

  if (!modeColor) return false;

  // 3. Select Target from 3x3
  // "Random block... excluding the 3 purples... AND that most frequent block"
  // Interpretation: The TARGET cannot be a block that is ALREADY the modeColor.
  let validTargets = areaTiles.filter(
    (t) => board[t.r][t.c].color !== modeColor
  );

  if (validTargets.length === 0) return false;

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

  return true;
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
    return true;
  }
  return false;
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
  return true;
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
  return true;
}

// Recursive Flood Fill for Frozen Chain Reaction
/*
  getConnectedFrozenTiles(r, c, connectedSet)
  - 递归洪泛算法：从给定冰冻方块 (r,c) 出发，找出所有相邻的冰冻方块并加入 connectedSet。
  - 用于计算冰冻链式反应（同时破碎的冰冻集团）。
*/
function getConnectedFrozenTiles(r, c, connectedSet) {
  // 边界检查和安全检查
  if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;

  const key = `${r},${c}`;
  if (connectedSet.has(key)) return;

  const tile = board[r][c];
  // 确保方块存在且是冰冻状态
  if (!tile || tile.state !== "frozen") return;

  connectedSet.add(key);

  const neighbors = [
    { r: r - 1, c: c },
    { r: r + 1, c: c },
    { r: r, c: c - 1 },
    { r: r, c: c + 1 },
  ];

  for (const n of neighbors) {
    // 添加边界检查
    if (n.r >= 0 && n.r < GRID_SIZE && n.c >= 0 && n.c < GRID_SIZE) {
      const neighborTile = board[n.r][n.c];
      // 确保邻居方块存在且是冰冻状态
      if (neighborTile && neighborTile.state === "frozen") {
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
  // 波次为空的情况处理
  if (!baseRemovalSet || baseRemovalSet.size === 0) {
    return [];
  }

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
  // 添加最大迭代次数防止无限循环
  let iterations = 0;
  const maxIterations = 100;

  while (iterations < maxIterations) {
    iterations++;
    const nextWaveSet = new Set();

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const key = `${r},${c}`;
        if (allRemoved.has(key)) continue;

        const tile = board[r][c];
        // 确保方块存在且是冰冻状态
        if (!tile || tile.state !== "frozen") continue;

        const neighbors = [
          `${r - 1},${c}`,
          `${r + 1},${c}`,
          `${r},${c - 1}`,
          `${r},${c + 1}`,
        ];

        for (const n of neighbors) {
          // 检查邻居是否在前一波中
          if (prevWave.has(n)) {
            nextWaveSet.add(key);
            break;
          }
        }
      }
    }

    // 如果没有更多的波次，结束循环
    if (nextWaveSet.size === 0) break;

    // 添加到已移除集合和波次列表
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
        // 添加额外的安全检查，确保方块存在且有效
        const tile = board[i][j];
        if (
          tile &&
          tile.color === "white" &&
          tile.state !== "frozen" &&
          tile.type !== "gold" &&
          tile.type !== "fusion-core"
        ) {
          applyFreeze(tile);
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

  if (targets.length === 0) return false;

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

  return true;
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

  if (!targetColor || !potentialTargets[targetColor]) return false;

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
  return true;
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
      // 计算并保存当前关卡的星级（如果关卡数据提供了星级阈值）
      try {
        const curLevel = getLevelById(level);
        if (curLevel) {
          const thresholds = Array.isArray(curLevel.stars)
            ? curLevel.stars
            : [];
          let earned = 0;
          for (let i = 0; i < thresholds.length; i++) {
            if (score >= thresholds[i]) earned = i + 1;
          }
          // 保留最高星级
          curLevel._stars = Math.max(curLevel._stars || 0, earned);
        }
      } catch (e) {
        console.warn("计算星级时出错", e);
      }

      // 自动解锁下一关并保存进度；根据用户设置决定是否自动跳转
      try {
        const nextId =
          window.LevelManager && LevelManager.getNextLevel
            ? LevelManager.getNextLevel(level)
            : level + 1;
        if (nextId) {
          if (window.LevelManager && LevelManager.unlockLevel) {
            LevelManager.unlockLevel(nextId);
          } else {
            // 兼容性回退：直接设置关卡 unlocked 字段
            const nl = getLevelById(nextId);
            if (nl) nl.unlocked = true;
            saveProgress();
          }
        }

        // 持久化当前进度（包括可能更新的 _stars）
        try {
          saveProgress();
          // 清除保存的游戏状态，因为关卡已完成
          clearGameState(level);
        } catch (e) {
          /* noop */
        }

        // 刷新菜单显示（若菜单存在渲染函数）
        if (typeof renderLevelMenu === "function") renderLevelMenu();

        // 若用户设置了自动跳转，则短延迟后进入下一关
        if (window.GameSettings && window.GameSettings.autoJumpNext && nextId) {
          setTimeout(() => startLevel(nextId), 300);
        }
      } catch (e) {
        console.warn("解锁下一关时出错", e);
      }

      // 更新菜单显示并跳转到下一关
      nextBtn.onclick = () => {
        nextBtn.style.display = "none";
        const nextId =
          window.LevelManager && LevelManager.getNextLevel
            ? LevelManager.getNextLevel(level)
            : level + 1;
        if (nextId) startLevel(nextId);
      };

      // 持久化进度并刷新菜单（如存在 renderLevelMenu）
      try {
        saveProgress();
        // 清除保存的游戏状态，因为关卡已完成
        clearGameState(level);
      } catch (e) {
        /* noop */
      }
      if (typeof renderLevelMenu === "function") renderLevelMenu();
    }

    // 播放胜利音效
    if (typeof audio !== "undefined" && audio.playLevelUp) {
      audio.playLevelUp();
    }
  }
}

// ==========================================
// 关卡加载器与进度管理 (Levels Loader & Progress)
// - 自动尝试 fetch `levels.json`，若失败回退到内置简易关卡，确保在 file:// 情况下也能测试。
// - 提供 `window.LevelManager` 全局对象以便控制台或菜单调用：
//     LevelManager.loadLevels(), .saveProgress(), .loadProgress(), .getLevelById(id), .unlockLevel(id), .getNextLevel(id)
// ==========================================

const LEVELS_URL = "/api/levels"; // 指向 API 端点
const LEVELS_PROGRESS_KEY = "mymatch_levels_progress_v1";
const SETTINGS_KEY = "mymatch_settings_v1";

// 简易回退关卡（当 fetch 失败或未通过 http 服务时使用）
const _embeddedFallbackLevels = [
  {
    id: 1,
    name: "入门练习",
    unlocked: true,
    moves: 25,
    targets: [{ type: "score", count: 5000 }],
    theme: "plain",
    stars: [3000, 6000, 10000],
    description: "内置回退：第1关",
  },
];

window.LEVELS = [];

// 全局设置（持久化到 localStorage）
window.GameSettings = {
  autoJumpNext: false, // 完成关卡后是否自动跳转到下一关（默认 false）
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s && typeof s === "object") {
      window.GameSettings = Object.assign(window.GameSettings, s);
    }
  } catch (e) {
    console.warn("加载设置失败", e);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(window.GameSettings));
  } catch (e) {
    console.warn("保存设置失败", e);
  }
}

async function loadLevels() {
  try {
    // 添加时间戳以避免缓存
    const urlWithTimestamp = `${LEVELS_URL}?t=${Date.now()}`;
    const resp = await fetch(urlWithTimestamp, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const result = await resp.json();

    // 检查响应格式
    if (result.success && Array.isArray(result.levels)) {
      window.LEVELS = result.levels;
    } else if (Array.isArray(result)) {
      // 直接返回数组的兼容处理
      window.LEVELS = result;
    } else {
      throw new Error("API 返回格式错误");
    }

    console.log("关卡加载成功，关卡数量：", window.LEVELS.length);
  } catch (err) {
    console.warn("无法通过 API 加载关卡，使用内置回退关卡。错误：", err);
    window.LEVELS = _embeddedFallbackLevels.slice();
  }

  // 在加载关卡后应用本地进度覆盖（若有）
  loadProgress();

  // 触发事件，供菜单/调试监听
  document.dispatchEvent(
    new CustomEvent("levelsLoaded", { detail: { levels: window.LEVELS } })
  );
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(LEVELS_PROGRESS_KEY);
    if (!raw) return;
    const prog = JSON.parse(raw);
    if (!prog || typeof prog !== "object") return;

    // 处理解锁信息
    if (Array.isArray(prog.unlocked)) {
      const unlockedSet = new Set(prog.unlocked);
      window.LEVELS.forEach((l) => {
        l.unlocked = !!unlockedSet.has(l.id);
      });
    }

    // 处理星级/得分等可选信息
    if (prog.stars && typeof prog.stars === "object") {
      window.LEVELS.forEach((l) => {
        l._stars = prog.stars[l.id] || 0;
      });
    }
    console.log("本地关卡进度加载完成");
  } catch (err) {
    console.warn("解析本地进度时发生错误：", err);
  }
}

function saveProgress() {
  try {
    const unlocked = window.LEVELS.filter((l) => l.unlocked).map((l) => l.id);
    const stars = {};
    window.LEVELS.forEach((l) => {
      if (l._stars) stars[l.id] = l._stars;
    });
    const payload = { unlocked, stars, updatedAt: Date.now() };
    localStorage.setItem(LEVELS_PROGRESS_KEY, JSON.stringify(payload));
    console.log("已保存关卡进度");
  } catch (err) {
    console.warn("保存关卡进度失败：", err);
  }
}

/*
  saveGameState()
  - 保存当前游戏状态到 localStorage，包括棋盘、分数等
*/
function saveGameState() {
  try {
    // 只有在游戏进行中才保存状态
    if (!level || !board) return;

    const gameState = {
      level: level,
      score: score,
      board: board,
      levelTargets: levelTargets,
      targetScore: targetScore,
      savedAt: Date.now(),
    };

    const key = LEVEL_STATE_KEY_PREFIX + level;
    localStorage.setItem(key, JSON.stringify(gameState));
    console.log(`游戏状态已保存: 关卡 ${level}`);
  } catch (err) {
    console.warn("保存游戏状态失败：", err);
  }
}

/*
  loadGameState(levelId)
  - 从 localStorage 加载指定关卡的游戏状态
*/
function loadGameState(levelId) {
  try {
    const key = LEVEL_STATE_KEY_PREFIX + levelId;
    const savedState = localStorage.getItem(key);
    if (!savedState) return null;

    const state = JSON.parse(savedState);

    // 检查状态是否有效（例如不超过一天）
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - state.savedAt > oneDay) {
      // 状态过期，清除它
      clearGameState(levelId);
      return null;
    }

    return state;
  } catch (err) {
    console.warn("加载游戏状态失败：", err);
    return null;
  }
}

/*
  clearGameState(levelId)
  - 清除指定关卡的保存游戏状态
*/
function clearGameState(levelId) {
  try {
    const key = LEVEL_STATE_KEY_PREFIX + levelId;
    localStorage.removeItem(key);
    console.log(`游戏状态已清除: 关卡 ${levelId}`);
  } catch (err) {
    console.warn("清除游戏状态失败：", err);
  }
}

/*
  restoreGameState(state)
  - 恢复游戏状态
*/
function restoreGameState(state) {
  // 恢复游戏状态
  level = state.level;
  score = state.score;
  board = state.board;
  levelTargets = state.levelTargets;
  targetScore = state.targetScore;

  // 更新UI
  if (levelDisplay) levelDisplay.textContent = level;
  if (scoreDisplay) scoreDisplay.textContent = `${score} / ${targetScore}`;

  // 更新目标面板
  updateTargetUI();

  // 渲染棋盘
  renderBoard();

  // 确保菜单被隐藏
  hideMenu();

  console.log(`游戏状态已恢复: 关卡 ${level}`);
}

function getLevelById(id) {
  return window.LEVELS.find((l) => l.id === Number(id)) || null;
}

function unlockLevel(id) {
  const lvl = getLevelById(id);
  if (!lvl) return false;
  if (!lvl.unlocked) {
    lvl.unlocked = true;
    saveProgress();
  }
  return true;
}

function getNextLevel(currentId) {
  const ids = window.LEVELS.map((l) => l.id).sort((a, b) => a - b);
  const idx = ids.indexOf(Number(currentId));
  if (idx === -1) return ids.length ? ids[0] : null;
  return ids[idx + 1] || null;
}

// 对外暴露简易 API
window.LevelManager = {
  loadLevels,
  loadProgress,
  saveProgress,
  getLevelById,
  unlockLevel,
  getNextLevel,
  _rawKey: LEVELS_PROGRESS_KEY,
};

/*
  startLevel(id)
  - 负责初始化指定关卡：设置 `level`, `score`, `targetScore`, `levelTargets`，并刷新 UI（目标面板/分数/棋盘）。
  - 优先使用 `levels.json` 中定义的关卡数据；若未找到则使用简单的程序化回退策略。
*/
function startLevel(id) {
  // 重置当前关卡权重为默认值
  currentLevelWeights = { ...DEFAULT_COLOR_WEIGHTS };

  // normalize id
  const want = Number(id) || 1;
  const lvlDef = getLevelById(want);

  // 检查是否有保存的游戏状态
  const savedState = loadGameState(want);
  if (savedState) {
    // 询问用户是否继续游戏
    const shouldContinue = confirm(
      `检测到关卡 ${want} 的未完成游戏进度，是否继续？`
    );
    if (shouldContinue) {
      // 恢复游戏状态
      restoreGameState(savedState);
      return;
    } else {
      // 用户选择不继续，清除保存的状态
      clearGameState(want);
    }
  }

  // reset common runtime state
  level = want;
  score = 0;
  selectedCell = null;
  isProcessing = false;
  levelTargets = {};

  // 如果关卡有自定义权重设置，则使用它
  if (lvlDef && lvlDef.specialRules && lvlDef.specialRules.colorWeights) {
    currentLevelWeights = {
      ...currentLevelWeights,
      ...lvlDef.specialRules.colorWeights,
    };
  }

  // Update editor weight inputs if editor is open
  updateEditorWeightInputs();

  // Configure level based on definition (or fallback)
  if (lvlDef) {
    // Use level-defined properties
    targetScore = lvlDef.targetScore || 1000;

    // Parse targets (support both legacy and new formats)
    if (Array.isArray(lvlDef.targets) && lvlDef.targets.length) {
      for (const t of lvlDef.targets) {
        if (t.type === "score") {
          // Already handled by targetScore
        } else if (t.type === "collect" && t.color) {
          levelTargets[t.color] = t.count || 0;
        } else if (t.type === "clearType" && t.typeName) {
          levelTargets[`__type__:${t.typeName}`] = t.count || 0;
        } else if (t.type === "destroy" && t.typeName) {
          levelTargets[`__type__:${t.typeName}`] = t.count || 0;
        }
      }
    }

    // Fallback if no targets defined
    if (Object.keys(levelTargets).length === 0) {
      const baseCount = 5 + want * 2;
      if (want === 1) {
        levelTargets["red"] = baseCount;
      } else if (want === 2) {
        levelTargets["blue"] = baseCount;
        levelTargets["green"] = baseCount;
      } else {
        const numColors = Math.min(3, 1 + Math.floor(want / 2));
        const shuffledColors = [...COLORS].sort(() => 0.5 - Math.random());
        for (let i = 0; i < numColors; i++)
          levelTargets[shuffledColors[i]] = baseCount;
      }
    }
  } else {
    // Fallback logic for undefined levels
    targetScore = 1000 + (want - 1) * 500;
    const baseCount = 5 + want * 2;
    if (want === 1) {
      levelTargets["red"] = baseCount;
    } else if (want === 2) {
      levelTargets["blue"] = baseCount;
      levelTargets["green"] = baseCount;
    } else {
      const numColors = Math.min(3, 1 + Math.floor(want / 2));
      const shuffledColors = [...COLORS].sort(() => 0.5 - Math.random());
      for (let i = 0; i < numColors; i++)
        levelTargets[shuffledColors[i]] = baseCount;
    }
  }

  // Update UI
  if (levelDisplay) levelDisplay.textContent = level;
  if (scoreDisplay) scoreDisplay.textContent = `${score} / ${targetScore}`;

  // Summary in message area
  if (messageArea) {
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
    for (const [k, v] of Object.entries(levelTargets)) {
      if (k.startsWith("__type__:")) {
        parts.push(`清除 ${v} 个 ${k.replace("__type__:", "")}`);
      } else {
        parts.push(`消除 ${v} 个${colorNames[k] || k}方块`);
      }
    }
    if (targetScore) parts.push(`达到 ${targetScore} 分`);
    messageArea.textContent = parts.join("，");
  }

  // Ensure menu is hidden when starting a level (do this first)
  hideMenu();

  // 应用关卡主题到游戏界面
  const theme = lvlDef?.theme || "plain";
  applyLevelTheme(theme);

  // 播放主题背景音乐（使用try-catch防止音效错误影响游戏）
  try {
    if (typeof audio !== "undefined" && audio.playThemeBGM) {
      audio.playThemeBGM(theme);
    }
  } catch (e) {
    console.warn("背景音乐播放错误:", e);
  }

  // render UI and board
  updateTargetUI();
  createBoard(lvlDef?.initialBoard);
  renderBoard();

  // 添加进入动画
  animateLevelEntrance();

  // 再次确保菜单被隐藏（防御性，延迟一点确保 DOM 更新完成）
  setTimeout(() => {
    hideMenu();
    // 确保游戏容器可见，添加淡入动画
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.classList.remove("hidden");
      gameContainer.style.opacity = "0";
      gameContainer.style.display = "flex";
      // 淡入动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gameContainer.style.transition = "opacity 0.3s ease-in";
          gameContainer.style.opacity = "1";
        });
      });
    }
  }, 50);
}

/*
  applyLevelTheme(theme)
  - 应用关卡主题到游戏界面（背景和边框）
*/
function applyLevelTheme(theme) {
  const gridContainer = document.getElementById("grid-container");
  const gameContainer = document.getElementById("game-container");

  if (!gridContainer) return;

  // 移除所有主题类
  gridContainer.classList.remove(
    "theme-plain",
    "theme-forest",
    "theme-cave",
    "theme-storm",
    "theme-lab",
    "theme-ice",
    "theme-core",
    "theme-voltage",
    "theme-mystic",
    "theme-ruins",
    "theme-reactor",
    "theme-void"
  );

  // 应用新主题
  const themeClass = `theme-${theme || "plain"}`;
  gridContainer.classList.add(themeClass);

  // 也可以应用到游戏容器背景
  if (gameContainer) {
    gameContainer.classList.remove(
      "theme-plain",
      "theme-forest",
      "theme-cave",
      "theme-storm",
      "theme-lab",
      "theme-ice",
      "theme-core",
      "theme-voltage",
      "theme-mystic",
      "theme-ruins",
      "theme-reactor",
      "theme-void"
    );
    gameContainer.classList.add(themeClass);
  }
}

/*
  initGame()
  - 游戏初始化入口：在关卡与设置加载后调用，渲染菜单
  - 注意：现在不再直接显示菜单，而是等待用户从主菜单选择
*/
function initGame() {
  // Ensure levels are loaded
  const levels =
    Array.isArray(window.LEVELS) && window.LEVELS.length ? window.LEVELS : [];
  // Render menu UI
  try {
    renderLevelMenu();
  } catch (e) {
    console.warn("renderLevelMenu failed during init", e);
  }

  // 初始化主菜单按钮事件（延迟执行确保DOM已创建）
  setTimeout(() => {
    initMainMenuButtons();
  }, 100);
}

/*
  initMainMenuButtons()
  - 初始化主菜单按钮事件
*/
function initMainMenuButtons() {
  // 选择关卡按钮
  const selectLevelBtn = document.getElementById("btn-select-level");
  if (selectLevelBtn) {
    selectLevelBtn.addEventListener("click", () => {
      hideMainMenu();
      showLevelSelection();
    });
  }

  // 设置按钮
  const settingsBtn = document.getElementById("btn-settings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      showSettings();
    });
  }

  // 退出游戏按钮
  const quitBtn = document.getElementById("btn-quit-game");
  if (quitBtn) {
    quitBtn.addEventListener("click", () => {
      if (confirm("确定要退出游戏吗？")) {
        // 可以在这里添加退出逻辑，比如返回加载屏幕或关闭窗口
        window.location.reload();
      }
    });
  }

  // 关卡编辑器按钮已移至关卡列表右上角，见关卡列表初始化代码

  // 返回主菜单按钮（从关卡选择界面）
  const backToMainBtn = document.getElementById("btn-back-to-main-menu");
  if (backToMainBtn) {
    backToMainBtn.addEventListener("click", () => {
      hideLevelSelection();
      showMainMenu();
    });
  }

  // 关闭设置按钮
  const closeSettingsBtn = document.getElementById("btn-close-settings");
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener("click", () => {
      hideSettings();
    });
  }
}

/*
  showLevelSelection()
  - 显示关卡选择界面
*/
function showLevelSelection() {
  const overlay = document.getElementById("menu-overlay");
  if (overlay) {
    overlay.style.opacity = "0";
    overlay.classList.remove("hidden");
    overlay.style.display = "flex";
    // 淡入动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = "opacity 0.3s ease-in";
        overlay.style.opacity = "1";
      });
    });
    renderLevelMenu();

    // 初始化关卡编辑器按钮（在菜单按钮组中）
    const editorBtn = document.getElementById("btn-level-editor-panel");
    if (editorBtn && !editorBtn.hasAttribute("data-initialized")) {
      editorBtn.setAttribute("data-initialized", "true");
      editorBtn.addEventListener("click", () => {
        try {
          openLevelEditor();
        } catch (e) {
          console.warn("打开关卡编辑器失败", e);
        }
      });
    }
  }
}

/*
  hideLevelSelection()
  - 隐藏关卡选择界面
*/
function hideLevelSelection() {
  const overlay = document.getElementById("menu-overlay");
  if (overlay) {
    overlay.style.transition = "opacity 0.3s ease-out";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.classList.add("hidden");
      overlay.style.display = "none";
    }, 300);
  }
}

/*
  showSettings()
  - 显示设置界面
*/
function showSettings() {
  const overlay = document.getElementById("settings-overlay");
  if (overlay) {
    overlay.style.opacity = "0";
    overlay.classList.remove("hidden");
    overlay.style.display = "flex";
    // 淡入动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = "opacity 0.3s ease-in";
        overlay.style.opacity = "1";
      });
    });
    renderSettings();
  }
}

/*
  hideSettings()
  - 隐藏设置界面
*/
function hideSettings() {
  const overlay = document.getElementById("settings-overlay");
  if (overlay) {
    overlay.style.transition = "opacity 0.3s ease-out";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.classList.add("hidden");
      overlay.style.display = "none";
    }, 300);
  }
}

/*
  renderSettings()
  - 渲染设置界面内容
*/
function renderSettings() {
  const settingsContent = document.getElementById("settings-content");
  if (!settingsContent) return;

  settingsContent.innerHTML = `
    <div class="settings-section">
      <h3>游戏设置</h3>
      <label style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
        <input type="checkbox" id="auto-jump-setting" ${
          window.GameSettings?.autoJumpNext ? "checked" : ""
        }>
        <span>自动跳转下一关（完成关卡后自动进入下一关）</span>
      </label>
    </div>
    <div class="settings-section">
      <h3>关于</h3>
      <p>元素消消乐 v${GAME_VERSION}</p>
      <p>一款经典的消除类游戏</p>
    </div>
  `;

  // 绑定自动跳转设置
  const autoJumpCheckbox = document.getElementById("auto-jump-setting");
  if (autoJumpCheckbox) {
    autoJumpCheckbox.addEventListener("change", (e) => {
      window.GameSettings = window.GameSettings || {};
      window.GameSettings.autoJumpNext = !!e.target.checked;
      saveSettings();
    });
  }
}

/*
  showMenu()
  - 兼容旧代码，直接调用showLevelSelection
*/
function showMenu() {
  showLevelSelection();
}

// 注意：下面还有一个showMenu定义，需要删除重复

// levels 加载已在顶部 DOMContentLoaded 回调中处理（避免重复调用）

// ---------------------------
// 菜单控制与关卡渲染 (Menu Controller + Renderer)
// - 依赖 window.LEVELS 与 LevelManager
// ---------------------------
function renderLevelMenu() {
  const grid = document.getElementById("level-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const levels =
    Array.isArray(window.LEVELS) && window.LEVELS.length ? window.LEVELS : [];
  // 遍历所有关卡并渲染卡片
  // 每张卡片包含：缩略图 / 名称 / 步数与星级 / 简短描述 / 徽章（锁定/已通过）
  levels.forEach((l) => {
    const card = document.createElement("div");
    card.className = "level-card" + (l.unlocked ? "" : " locked");

    const thumb = document.createElement("div");
    thumb.className = "level-thumb";
    // 如果提供了缩略图则使用之；否则使用一个深色渐变作为占位符。
    if (l.thumbnail) {
      thumb.style.backgroundImage = `url('${l.thumbnail}')`;
      thumb.setAttribute("role", "img");
      thumb.setAttribute("aria-label", `关卡 ${l.id} 缩略图`);
    } else {
      thumb.style.background = "linear-gradient(135deg,#1b1b1b,#333)";
      thumb.style.display = "flex";
      thumb.style.alignItems = "center";
      thumb.style.justifyContent = "center";
      const ph = document.createElement("div");
      ph.textContent = l.id;
      ph.style.color = "#666";
      ph.style.fontSize = "18px";
      ph.style.fontWeight = "600";
      thumb.appendChild(ph);
    }

    const name = document.createElement("div");
    name.className = "level-name";
    name.textContent = `${l.id}. ${l.name}`;

    const meta = document.createElement("div");
    meta.className = "level-meta";

    const info = document.createElement("div");
    info.className = "level-info";
    info.textContent = l.moves ? `${l.moves} 步 · ` : "";

    // 简短描述（显示在卡片上以帮助玩家快速了解该关卡），超过长度则截断
    const desc = document.createElement("div");
    desc.className = "level-desc";
    desc.textContent = l.description || "";
    desc.title = l.description || "";
    desc.style.fontSize = "12px";
    desc.style.color = "#bbb";
    desc.style.marginTop = "6px";
    if (desc.textContent.length > 60) {
      desc.textContent = desc.textContent.slice(0, 58) + "…";
    }

    const starsWrap = document.createElement("div");
    starsWrap.className = "level-stars";

    const maxStars = Array.isArray(l.stars) ? l.stars.length : 0;
    const achieved = l._stars || 0;

    // helper: create inline SVG star (filled or empty)
    function createStarSvg(filled) {
      const SVG_NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("class", "star-svg" + (filled ? " filled" : " empty"));
      svg.setAttribute("width", "18");
      svg.setAttribute("height", "18");
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute(
        "d",
        "M12 .587l3.668 7.431L24 9.748l-6 5.848L19.335 24 12 19.897 4.665 24 6 15.596 0 9.748l8.332-1.73L12 .587z"
      );
      if (filled) {
        path.setAttribute("fill", "currentColor");
      } else {
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "1");
      }
      svg.appendChild(path);
      return svg;
    }

    for (let i = 1; i <= Math.max(1, maxStars); i++) {
      const starSvg = createStarSvg(i <= achieved);
      // accessibility: announce filled/empty via aria-hidden and container label
      starSvg.setAttribute("aria-hidden", "true");
      starsWrap.appendChild(starSvg);
    }

    // aria/info: 包含名称、星级与简短描述，便于辅助设备读取
    starsWrap.setAttribute("aria-label", `星级: ${achieved}/${maxStars}`);

    meta.appendChild(info);
    meta.appendChild(starsWrap);

    // 卡片徽章：解锁/通过状态
    const badge = document.createElement("div");
    badge.className = "level-badge";
    if (!l.unlocked) {
      badge.textContent = "锁定";
      badge.classList.add("locked-badge");
    } else if (achieved > 0) {
      badge.textContent = `已通过 ${achieved}★`;
      badge.classList.add("passed-badge");
    } else {
      // 已解锁但未通过：显示小提示
      badge.textContent = "已解锁";
      badge.classList.add("unlocked-badge");
    }
    badge.setAttribute("aria-hidden", "true");
    // attach badge to card (positioning via CSS)
    card.appendChild(badge);

    // accessibility: tooltip for card
    // 卡片的 title 包含更多信息（便于鼠标悬停时查看）
    card.setAttribute(
      "title",
      `${l.id}. ${l.name} — 星级 ${achieved}/${maxStars}` +
        (l.description ? ` — ${l.description}` : "")
    );

    // 卡片对辅助技术的完整描述
    card.setAttribute(
      "aria-label",
      `${l.id} ${l.name}，星级 ${achieved} / ${maxStars}。${
        l.description || ""
      }`
    );

    card.appendChild(thumb);
    card.appendChild(name);
    card.appendChild(meta);
    card.appendChild(desc);

    if (l.unlocked) {
      card.addEventListener("click", () => {
        hideLevelSelection();
        hideMainMenu();
        // 显示游戏容器
        const gameContainer = document.getElementById("game-container");
        if (gameContainer) {
          gameContainer.classList.remove("hidden");
          gameContainer.style.display = "flex";
        }
        setTimeout(() => startLevel(l.id), 80);
      });
    }

    grid.appendChild(card);
  });
}

// showMenu函数已在上面定义，此处删除重复定义

/* =====================
   简易关卡编辑器（JSON 编辑器）
   - 目的：提供一个仅本地使用的编辑器，允许你查看/编辑 `window.LEVELS` 的 JSON，导入/导出，并立即在菜单中生效。
   - 实现策略：使用一个模态窗口包含 textarea（JSON），提供 Apply、Export、Import、Close 操作。
   - 注意：该编辑器不会直接写磁盘上的 `levels.json`，请使用 Export 导出文件并手动替换仓库文件以提交变更。
   ===================== */
function openLevelEditor() {
  // 如果已存在 overlay 则直接显示（带动画）
  const existingOverlay = document.getElementById("level-editor-overlay");
  if (existingOverlay) {
    existingOverlay.style.opacity = "0";
    existingOverlay.classList.remove("hidden");
    // 淡入动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        existingOverlay.style.transition = "opacity 0.3s ease-in";
        existingOverlay.style.opacity = "1";
      });
    });
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "level-editor-overlay";
  overlay.className = "editor-overlay";

  const panel = document.createElement("div");
  panel.className = "editor-panel";

  // Left: level list + controls
  const left = document.createElement("div");
  left.className = "editor-left";

  const title = document.createElement("h3");
  title.textContent = "关卡编辑器";

  const list = document.createElement("div");
  list.id = "editor-level-list";
  list.className = "editor-level-list";

  const addBtn = document.createElement("button");
  addBtn.className = "editor-button primary";
  addBtn.textContent = "➕ 添加";
  addBtn.addEventListener("click", () => {
    const newId =
      (window.LEVELS || []).reduce((m, v) => Math.max(m, v.id || 0), 0) + 1;
    const newLevel = {
      id: newId,
      name: `新关卡 ${newId}`,
      unlocked: false,
      theme: "plain",
      moves: 20,
      targetScore: 5000,
      targets: [{ type: "score", count: 5000 }],
      stars: [3000, 6000, 10000],
      thumbnail: "",
      description: "",
      specialRules: {},
    };
    window.LEVELS = window.LEVELS || [];
    window.LEVELS.push(newLevel);
    renderLevelList();
    selectLevelByIndex(window.LEVELS.length - 1);
  });

  const copyBtn = document.createElement("button");
  copyBtn.className = "editor-button secondary";
  copyBtn.textContent = "📋 复制";
  copyBtn.addEventListener("click", () => {
    if (selectedIndex == null) return alert("请先选择要复制的关卡");
    const sourceLevel = window.LEVELS[selectedIndex];
    if (!sourceLevel) return;

    // Create a deep copy
    const copiedLevel = JSON.parse(JSON.stringify(sourceLevel));

    // Generate new ID (max existing ID + 1)
    const newId =
      (window.LEVELS || []).reduce((m, v) => Math.max(m, v.id || 0), 0) + 1;
    copiedLevel.id = newId;
    copiedLevel.name = (copiedLevel.name || "未命名") + " (副本)";
    copiedLevel.unlocked = false; // 复制的关卡默认锁定

    // Insert after current level
    window.LEVELS.splice(selectedIndex + 1, 0, copiedLevel);
    renderLevelList();
    selectLevelByIndex(selectedIndex + 1);
    renderLevelMenu();
  });

  // Sort controls - 合并为一个按钮组
  const sortControls = document.createElement("div");
  sortControls.style.display = "flex";
  sortControls.style.gap = "0.5rem";
  sortControls.style.marginTop = "0.5rem";

  const moveUpBtn = document.createElement("button");
  moveUpBtn.className = "editor-button secondary";
  moveUpBtn.textContent = "↑";
  moveUpBtn.style.flex = "1";
  moveUpBtn.title = "上移";
  moveUpBtn.addEventListener("click", () => {
    if (selectedIndex == null || selectedIndex === 0) return;
    const temp = window.LEVELS[selectedIndex];
    window.LEVELS[selectedIndex] = window.LEVELS[selectedIndex - 1];
    window.LEVELS[selectedIndex - 1] = temp;
    renderLevelList();
    selectLevelByIndex(selectedIndex - 1);
    renderLevelMenu();
  });

  const moveDownBtn = document.createElement("button");
  moveDownBtn.className = "editor-button secondary";
  moveDownBtn.textContent = "↓";
  moveDownBtn.style.flex = "1";
  moveDownBtn.title = "下移";
  moveDownBtn.addEventListener("click", () => {
    if (selectedIndex == null || selectedIndex >= window.LEVELS.length - 1)
      return;
    const temp = window.LEVELS[selectedIndex];
    window.LEVELS[selectedIndex] = window.LEVELS[selectedIndex + 1];
    window.LEVELS[selectedIndex + 1] = temp;
    renderLevelList();
    selectLevelByIndex(selectedIndex + 1);
    renderLevelMenu();
  });

  sortControls.appendChild(moveUpBtn);
  sortControls.appendChild(moveDownBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "editor-button danger";
  deleteBtn.textContent = "删除";
  deleteBtn.addEventListener("click", () => {
    if (selectedIndex == null) return alert("请先选择要删除的关卡");
    if (!confirm("确认删除当前选中的关卡？此操作无法撤销（仅修改内存）"))
      return;
    window.LEVELS.splice(selectedIndex, 1);
    selectedIndex = null;
    renderLevelList();
    clearForm();
    renderLevelMenu();
  });

  // Batch operations state and controls (must be defined before use)
  let batchMode = false;
  let selectedIndices = new Set();

  const batchControls = document.createElement("div");
  batchControls.style.display = "none"; // Hidden by default
  batchControls.style.flexDirection = "column";
  batchControls.style.gap = "0.5rem";
  batchControls.style.marginTop = "0.75rem";
  batchControls.style.padding = "0.75rem";
  batchControls.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  batchControls.style.borderRadius = "8px";
  batchControls.style.border = "1px solid rgba(255, 255, 255, 0.1)";

  const batchSelectAllBtn = document.createElement("button");
  batchSelectAllBtn.textContent = "☑️ 全选";
  batchSelectAllBtn.className = "editor-button secondary";
  batchSelectAllBtn.addEventListener("click", () => {
    if (selectedIndices.size === window.LEVELS.length) {
      selectedIndices.clear();
    } else {
      selectedIndices = new Set(window.LEVELS.map((_, i) => i));
    }
    renderLevelList();
    updateBatchControls();
  });

  const batchUnlockBtn = document.createElement("button");
  batchUnlockBtn.textContent = "🔓 批量解锁";
  batchUnlockBtn.className = "editor-button primary";
  batchUnlockBtn.disabled = true;
  batchUnlockBtn.addEventListener("click", () => {
    if (selectedIndices.size === 0) return;
    selectedIndices.forEach((idx) => {
      if (window.LEVELS[idx]) {
        window.LEVELS[idx].unlocked = true;
      }
    });
    renderLevelList();
    renderLevelMenu();
    alert(`已解锁 ${selectedIndices.size} 个关卡`);
  });

  const batchLockBtn = document.createElement("button");
  batchLockBtn.textContent = "🔒 批量锁定";
  batchLockBtn.className = "editor-button secondary";
  batchLockBtn.disabled = true;
  batchLockBtn.addEventListener("click", () => {
    if (selectedIndices.size === 0) return;
    selectedIndices.forEach((idx) => {
      if (window.LEVELS[idx]) {
        window.LEVELS[idx].unlocked = false;
      }
    });
    renderLevelList();
    renderLevelMenu();
    alert(`已锁定 ${selectedIndices.size} 个关卡`);
  });

  const batchDeleteBtn = document.createElement("button");
  batchDeleteBtn.textContent = "🗑️ 批量删除";
  batchDeleteBtn.className = "editor-button danger";
  batchDeleteBtn.disabled = true;
  batchDeleteBtn.addEventListener("click", () => {
    if (selectedIndices.size === 0) return;
    if (
      !confirm(
        `确认删除选中的 ${selectedIndices.size} 个关卡？此操作无法撤销！`
      )
    )
      return;

    // Delete in reverse order to maintain indices
    const sortedIndices = Array.from(selectedIndices).sort((a, b) => b - a);
    sortedIndices.forEach((idx) => {
      window.LEVELS.splice(idx, 1);
    });

    selectedIndices.clear();
    selectedIndex = null;
    clearForm();
    renderLevelList();
    renderLevelMenu();
    alert(`已删除 ${sortedIndices.length} 个关卡`);
  });

  batchControls.appendChild(batchSelectAllBtn);
  batchControls.appendChild(batchUnlockBtn);
  batchControls.appendChild(batchLockBtn);
  batchControls.appendChild(batchDeleteBtn);

  function updateBatchControls() {
    const count = selectedIndices.size;
    batchUnlockBtn.disabled = count === 0;
    batchLockBtn.disabled = count === 0;
    batchDeleteBtn.disabled = count === 0;
    batchSelectAllBtn.textContent =
      count === window.LEVELS.length ? "取消全选" : "全选";
  }

  // 重新组织左侧布局，更美观
  left.appendChild(title);
  left.appendChild(list);

  // 主要操作按钮组
  const mainActions = document.createElement("div");
  mainActions.style.display = "flex";
  mainActions.style.flexDirection = "column";
  mainActions.style.gap = "0.5rem";
  mainActions.appendChild(addBtn);
  mainActions.appendChild(copyBtn);
  mainActions.appendChild(sortControls);
  mainActions.appendChild(deleteBtn);

  left.appendChild(mainActions);
  left.appendChild(batchControls);

  // Right: form
  const right = document.createElement("div");
  right.className = "editor-right";

  const form = document.createElement("form");
  form.id = "level-editor-form";
  form.className = "editor-form";

  // Utility to create labeled input
  function labeled(labelText, inputEl) {
    const wrap = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.display = "block";
    label.style.marginBottom = "4px";
    wrap.appendChild(label);
    wrap.appendChild(inputEl);
    return wrap;
  }

  const idInput = document.createElement("input");
  idInput.type = "number";
  idInput.disabled = true;
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  const unlockedInput = document.createElement("input");
  unlockedInput.type = "checkbox";
  const movesInput = document.createElement("input");
  movesInput.type = "number";
  movesInput.min = 1;
  const targetScoreInput = document.createElement("input");
  targetScoreInput.type = "number";
  targetScoreInput.min = 0;
  const descInput = document.createElement("textarea");
  descInput.rows = 3;
  // Theme selector
  const themeInput = document.createElement("select");
  const themeOptions = [
    { value: "plain", label: "普通 (plain)" },
    { value: "forest", label: "森林 (forest)" },
    { value: "cave", label: "洞穴 (cave)" },
    { value: "storm", label: "风暴 (storm)" },
    { value: "lab", label: "实验室 (lab)" },
    { value: "ice", label: "冰霜 (ice)" },
    { value: "core", label: "核心 (core)" },
    { value: "voltage", label: "电压 (voltage)" },
    { value: "mystic", label: "神秘 (mystic)" },
    { value: "ruins", label: "废墟 (ruins)" },
    { value: "reactor", label: "反应堆 (reactor)" },
    { value: "void", label: "虚空 (void)" },
  ];
  themeOptions.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    themeInput.appendChild(o);
  });
  const starsRow = document.createElement("div");
  starsRow.style.display = "flex";
  starsRow.style.gap = "6px";
  const starInputs = [];
  for (let i = 0; i < 3; i++) {
    const s = document.createElement("input");
    s.type = "number";
    s.min = 0;
    s.placeholder = `星级${i + 1}`;
    starInputs.push(s);
    starsRow.appendChild(s);
  }

  // Thumbnail
  const thumbPreview = document.createElement("img");
  thumbPreview.className = "editor-thumb-preview";
  const thumbInput = document.createElement("input");
  thumbInput.type = "file";
  thumbInput.accept = "image/*";
  thumbInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = (ev) => {
      thumbPreview.src = ev.target.result;
      // set to a temp store until apply
      currentDraft.thumbnail = ev.target.result;
    };
    fr.readAsDataURL(f);
  });

  // 清除缩略图按钮（仅修改内存预览，不写磁盘）
  const clearThumbBtn = document.createElement("button");
  clearThumbBtn.type = "button";
  clearThumbBtn.addEventListener("click", () => {
    thumbPreview.src = "";
    currentDraft.thumbnail = "";
  });

  // Targets editor
  const targetsContainer = document.createElement("div");
  targetsContainer.id = "targets-container";
  targetsContainer.className = "targets-container";

  function renderTargetsEditor(arr) {
    targetsContainer.innerHTML = "";
    (arr || []).forEach((t, idx) => {
      const row = document.createElement("div");
      row.className = "targets-row";

      const typeSel = document.createElement("select");
      const optMap = {
        score: "分数",
        collect: "收集（颜色）",
        clearType: "清除类型",
        destroy: "摧毁（对象）",
      };
      ["score", "collect", "clearType", "destroy"].forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = optMap[opt] || opt;
        if (t.type === opt) o.selected = true;
        typeSel.appendChild(o);
      });

      // fieldA: for score -> none; for collect -> color select; for clearType/destroy -> object type select (with 自定义)
      const fieldASelect = document.createElement("select");
      const fieldACustom = document.createElement("input");
      fieldACustom.type = "text";
      fieldACustom.placeholder = "自定义...";
      fieldACustom.style.display = "none";

      const fieldB = document.createElement("input");
      fieldB.type = "number";
      fieldB.min = 0;

      // Prepare color options from global COLORS
      const colorNamesMap = {
        red: "红色",
        blue: "蓝色",
        green: "绿色",
        purple: "紫色",
        white: "白色",
        orange: "橙色",
        yellow: "黄色",
      };

      function populateColorOptions(sel, selectedVal) {
        sel.innerHTML = "";
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "-- 请选择颜色 --";
        sel.appendChild(emptyOpt);
        (window.COLORS || COLORS || []).forEach((c) => {
          const o = document.createElement("option");
          o.value = c;
          o.textContent = colorNamesMap[c] || c;
          if (selectedVal === c) o.selected = true;
          sel.appendChild(o);
        });
      }

      // Common object types for clearType/destroy
      const EDITOR_OBJECT_TYPES = ["rock", "ice", "crate", "barrel", "gem"];
      const objectTypeNames = {
        rock: "岩石 (rock)",
        ice: "冰块 (ice)",
        crate: "箱子 (crate)",
        barrel: "木桶 (barrel)",
        gem: "宝石 (gem)",
      };

      function populateObjectOptions(sel, selectedVal) {
        sel.innerHTML = "";
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "-- 请选择对象类型 --";
        sel.appendChild(emptyOpt);
        EDITOR_OBJECT_TYPES.forEach((k) => {
          const o = document.createElement("option");
          o.value = k;
          o.textContent = objectTypeNames[k] || k;
          if (selectedVal === k) o.selected = true;
          sel.appendChild(o);
        });
        const custom = document.createElement("option");
        custom.value = "__custom__";
        custom.textContent = "自定义...";
        sel.appendChild(custom);
      }

      function updateFields() {
        const ty = typeSel.value;
        if (ty === "score") {
          fieldASelect.style.display = "none";
          fieldACustom.style.display = "none";
          fieldB.value = t.count || 0;
        } else if (ty === "collect") {
          populateColorOptions(fieldASelect, t.color || "");
          fieldASelect.style.display = "inline-block";
          fieldACustom.style.display = "none";
          fieldB.value = t.count || 0;
        } else if (ty === "clearType" || ty === "destroy") {
          populateObjectOptions(fieldASelect, t.typeName || "");
          // If current typeName is not within EDITOR_OBJECT_TYPES, show custom
          if (t.typeName && !EDITOR_OBJECT_TYPES.includes(t.typeName)) {
            fieldASelect.value = "__custom__";
            fieldACustom.style.display = "inline-block";
            fieldACustom.value = t.typeName;
          } else {
            fieldASelect.style.display = "inline-block";
            fieldACustom.style.display = "none";
            fieldACustom.value = "";
          }
          fieldB.value = t.count || 0;
        }
      }

      typeSel.addEventListener("change", () => {
        updateFields();
      });

      // fieldASelect change handler (to show custom input when needed)
      fieldASelect.addEventListener("change", () => {
        if (fieldASelect.value === "__custom__") {
          fieldACustom.style.display = "inline-block";
        } else {
          fieldACustom.style.display = "none";
        }
      });

      const removeT = document.createElement("button");
      removeT.className = "editor-button danger";
      removeT.textContent = "✕";
      removeT.title = "删除目标";
      removeT.style.padding = "0.5rem";
      removeT.style.minWidth = "2.5rem";
      removeT.addEventListener("click", () => {
        arr.splice(idx, 1);
        renderTargetsEditor(arr);
      });

      row.appendChild(typeSel);
      row.appendChild(fieldASelect);
      row.appendChild(fieldACustom);
      row.appendChild(fieldB);
      row.appendChild(removeT);

      // Keep references for saving later
      row._get = () => {
        const ty = typeSel.value;
        const b = Number(fieldB.value) || 0;
        if (ty === "score") return { type: "score", count: b };
        if (ty === "collect") {
          const col = fieldASelect.value || fieldACustom.value.trim() || "";
          return { type: "collect", color: col, count: b };
        }
        // clearType or destroy
        const typeName =
          fieldASelect.value === "__custom__"
            ? fieldACustom.value.trim()
            : fieldASelect.value || fieldACustom.value.trim();
        return { type: ty, typeName: typeName, count: b };
      };

      targetsContainer.appendChild(row);
      updateFields();
    });
  }

  const addTargetBtn = document.createElement("button");
  addTargetBtn.className = "editor-button primary";
  addTargetBtn.textContent = "➕ 添加目标";
  addTargetBtn.type = "button";
  addTargetBtn.addEventListener("click", () => {
    currentDraft.targets = currentDraft.targets || [];
    currentDraft.targets.push({ type: "score", count: 1000 });
    renderTargetsEditor(currentDraft.targets);
  });

  // Bottom controls
  const actions = document.createElement("div");
  actions.className = "editor-actions";

  const applyBtn = document.createElement("button");
  applyBtn.className = "editor-button primary";
  applyBtn.textContent = "💾 保存";
  applyBtn.type = "button";
  applyBtn.addEventListener("click", () => {
    // validation & write back
    if (selectedIndex == null) return alert("请先选择一个关卡或新建");
    const lvl = window.LEVELS[selectedIndex];
    // basic validation
    const name = nameInput.value.trim();
    if (!name) return alert("关卡名称不能为空");

    // validate star thresholds are non-decreasing
    const starVals = starInputs.map((s) => Math.max(0, Number(s.value) || 0));
    for (let i = 1; i < starVals.length; i++) {
      if (starVals[i] < starVals[i - 1])
        return alert("星级阈值应为非降序（从低到高）");
    }

    // targets validation
    const rows = Array.from(targetsContainer.children);
    const newTargets = rows.map((r) => r._get());
    for (const t of newTargets) {
      if (!t.type) return alert("目标类型非法");
      if (typeof t.count !== "number" || isNaN(t.count) || t.count < 0)
        return alert("目标的 count 必须为非负数");
      // For collect/clearType/destroy: if count>0 then require identifier
      if (t.type === "collect" && t.count > 0 && !(t.color && t.color.length))
        return alert("收集目标在数量大于 0 时必须指定颜色（例如 red）");
      if (
        (t.type === "clearType" || t.type === "destroy") &&
        t.count > 0 &&
        !(t.typeName && t.typeName.length)
      )
        return alert(
          "清除/摧毁类目标在数量大于 0 时必须指定对象类型（例如 rock）"
        );
    }

    // Collect color weights
    const colorWeights = {};
    let weightsTotal = 0;
    COLORS.forEach((color) => {
      const val = parseFloat(weightInputs[color].value) || 0;
      colorWeights[color] = val;
      weightsTotal += val;
    });

    // Validate weights total (allow small floating point errors)
    if (Math.abs(weightsTotal - 100) > 0.1) {
      return alert(
        `方块权重总和必须为100%，当前为 ${weightsTotal.toFixed(
          1
        )}%。请调整权重值。`
      );
    }

    // Validate and parse specialRules
    let specialRules = {};
    const specialRulesText = specialRulesInput.value.trim();
    if (specialRulesText) {
      try {
        const parsed = JSON.parse(specialRulesText);
        if (typeof parsed !== "object" || Array.isArray(parsed)) {
          return alert("specialRules 必须是 JSON 对象（不能是数组或其他类型）");
        }
        specialRules = parsed;
      } catch (e) {
        return alert("specialRules JSON 格式错误：" + e.message);
      }
    }

    // Save colorWeights to specialRules
    specialRules.colorWeights = colorWeights;

    lvl.name = name;
    lvl.unlocked = unlockedInput.checked;
    lvl.theme = themeInput.value || "plain";
    lvl.moves = Math.max(1, Number(movesInput.value) || 1);
    lvl.targetScore = Math.max(0, Number(targetScoreInput.value) || 0);
    lvl.description = descInput.value;
    lvl.stars = starVals;
    lvl.thumbnail = currentDraft.thumbnail || lvl.thumbnail || "";
    lvl.targets = newTargets;
    lvl.specialRules = specialRules;

    // Save initial board layout
    const initialBoard = [];
    let hasAnyTile = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = boardEditorCells[r * GRID_SIZE + c];
        const color = cell.dataset.color;
        if (color) {
          hasAnyTile = true;
          row.push({ color: color, type: "normal", state: "normal" });
        } else {
          row.push(null);
        }
      }
      initialBoard.push(row);
    }
    lvl.initialBoard = hasAnyTile ? initialBoard : undefined;

    // Save to history before applying
    saveToHistory();

    // refresh list and keep selection
    renderLevelList();
    selectLevelByIndex(selectedIndex);

    // notify listeners and re-render menu
    document.dispatchEvent(
      new CustomEvent("levelsLoaded", { detail: { levels: window.LEVELS } })
    );
    renderLevelMenu();
    alert(
      "已将修改保存到内存（若需持久化，请点击 Export 下载 JSON 并替换项目文件）。"
    );
  });

  // 合并导入/导出按钮
  const importExportGroup = document.createElement("div");
  importExportGroup.style.display = "flex";
  importExportGroup.style.gap = "0.5rem";
  importExportGroup.style.flexWrap = "wrap";

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "📤 导出";
  exportBtn.type = "button";
  exportBtn.className = "editor-button secondary";
  exportBtn.addEventListener("click", () => {
    const data = JSON.stringify(window.LEVELS, null, 2);
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "levels-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // 合并上传/配置API按钮
  const uploadApiGroup = document.createElement("div");
  uploadApiGroup.style.display = "flex";
  uploadApiGroup.style.gap = "0.5rem";
  uploadApiGroup.style.flexWrap = "wrap";

  const uploadBtn = document.createElement("button");
  uploadBtn.textContent = "☁️ 上传";
  uploadBtn.type = "button";
  uploadBtn.className = "editor-button primary";
  uploadBtn.disabled = false;

  // API endpoint configuration (用户可以在设置中配置)
  let API_ENDPOINT = localStorage.getItem("level_editor_api_endpoint") || "";

  uploadBtn.addEventListener("click", async () => {
    if (!API_ENDPOINT) {
      const endpoint = prompt(
        "请输入 API 端点地址（例如：https://your-project.vercel.app/api/levels）\n" +
          "留空则跳过上传："
      );
      if (!endpoint) return;
      API_ENDPOINT = endpoint.trim();
      localStorage.setItem("level_editor_api_endpoint", API_ENDPOINT);
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "上传中...";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          levels: window.LEVELS,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ 上传成功！已保存 ${window.LEVELS.length} 个关卡。`);
      } else {
        throw new Error(result.error || "上传失败");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `❌ 上传失败：${error.message}\n\n请检查：\n1. API 端点地址是否正确\n2. 网络连接是否正常\n3. 服务器是否正常运行`
      );
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "上传到服务器";
    }
  });

  const configApiBtn = document.createElement("button");
  configApiBtn.textContent = "⚙️ 配置";
  configApiBtn.type = "button";
  configApiBtn.className = "editor-button secondary";
  configApiBtn.addEventListener("click", () => {
    const current = API_ENDPOINT || "未设置";
    const newEndpoint = prompt(
      `当前 API 端点：${current}\n\n请输入新的 API 端点地址：\n（留空则清除配置）`,
      API_ENDPOINT
    );
    if (newEndpoint !== null) {
      if (newEndpoint.trim()) {
        API_ENDPOINT = newEndpoint.trim();
        localStorage.setItem("level_editor_api_endpoint", API_ENDPOINT);
        alert("API 端点已更新！");
      } else {
        API_ENDPOINT = "";
        localStorage.removeItem("level_editor_api_endpoint");
        alert("API 端点已清除！");
      }
    }
  });

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".json,application/json";
  importInput.addEventListener("change", (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) {
          throw new Error("文件顶层应为数组格式");
        }

        // Validate each level
        const errors = [];
        const idSet = new Set();

        parsed.forEach((level, index) => {
          if (!level || typeof level !== "object") {
            errors.push(`关卡 #${index + 1}: 必须是对象`);
            return;
          }

          // Check required fields
          if (typeof level.id !== "number" || level.id <= 0) {
            errors.push(`关卡 #${index + 1}: id 必须是正整数`);
          } else if (idSet.has(level.id)) {
            errors.push(`关卡 #${index + 1}: id ${level.id} 重复`);
          } else {
            idSet.add(level.id);
          }

          if (typeof level.name !== "string" || !level.name.trim()) {
            errors.push(`关卡 #${index + 1}: name 必须是非空字符串`);
          }

          if (typeof level.moves !== "number" || level.moves < 1) {
            errors.push(`关卡 #${index + 1}: moves 必须是大于 0 的整数`);
          }

          if (level.targets && !Array.isArray(level.targets)) {
            errors.push(`关卡 #${index + 1}: targets 必须是数组`);
          }

          if (
            level.stars &&
            (!Array.isArray(level.stars) || level.stars.length !== 3)
          ) {
            errors.push(`关卡 #${index + 1}: stars 必须是包含 3 个数字的数组`);
          }

          if (level.theme && typeof level.theme !== "string") {
            errors.push(`关卡 #${index + 1}: theme 必须是字符串`);
          }

          if (
            level.specialRules &&
            (typeof level.specialRules !== "object" ||
              Array.isArray(level.specialRules))
          ) {
            errors.push(`关卡 #${index + 1}: specialRules 必须是对象`);
          }
        });

        if (errors.length > 0) {
          const errorMsg =
            "导入验证失败，发现以下错误：\n\n" +
            errors.slice(0, 10).join("\n") +
            (errors.length > 10
              ? `\n\n... 还有 ${errors.length - 10} 个错误`
              : "");
          alert(errorMsg);
          return;
        }

        // Sort by ID to maintain order
        parsed.sort((a, b) => (a.id || 0) - (b.id || 0));

        window.LEVELS = parsed;
        renderLevelList();
        renderLevelMenu();
        alert(`成功导入 ${parsed.length} 个关卡！`);

        // Reset file input
        importInput.value = "";
      } catch (err) {
        let errorMsg = "导入失败：";
        if (err instanceof SyntaxError) {
          errorMsg += "JSON 格式错误 - " + err.message;
        } else {
          errorMsg += err.message;
        }
        alert(errorMsg);
      }
    };
    fr.readAsText(f, "utf-8");
  });

  const previewBtn = document.createElement("button");
  previewBtn.textContent = "👁️ 预览";
  previewBtn.type = "button";
  previewBtn.className = "editor-button primary";
  previewBtn.addEventListener("click", () => {
    if (selectedIndex == null) return alert("请先选择一个关卡");

    // Save current draft first
    const lvl = window.LEVELS[selectedIndex];
    if (!lvl) return;

    // Temporarily save current edits to a temp level for preview
    const tempLevel = JSON.parse(JSON.stringify(lvl));
    tempLevel.name = nameInput.value.trim() || tempLevel.name;
    tempLevel.unlocked = true; // Force unlock for preview
    tempLevel.theme = themeInput.value || "plain";
    tempLevel.moves = Math.max(1, Number(movesInput.value) || 1);
    tempLevel.targetScore = Math.max(0, Number(targetScoreInput.value) || 0);
    tempLevel.description = descInput.value;
    const starVals = starInputs.map((s) => Math.max(0, Number(s.value) || 0));
    tempLevel.stars = starVals;
    tempLevel.thumbnail = currentDraft.thumbnail || tempLevel.thumbnail || "";

    // Save targets
    const rows = Array.from(targetsContainer.children);
    const newTargets = rows.map((r) => r._get());
    tempLevel.targets = newTargets;

    // Collect color weights for preview
    const colorWeights = {};
    COLORS.forEach((color) => {
      const val = parseFloat(weightInputs[color].value) || 0;
      colorWeights[color] = val;
    });

    // Save specialRules
    let specialRules = {};
    const specialRulesText = specialRulesInput.value.trim();
    if (specialRulesText) {
      try {
        const parsed = JSON.parse(specialRulesText);
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          specialRules = parsed;
        }
      } catch (e) {
        // Ignore parse errors for preview
      }
    }
    specialRules.colorWeights = colorWeights;
    tempLevel.specialRules = specialRules;

    // Save initial board layout
    const initialBoard = [];
    let hasAnyTile = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      const row = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = boardEditorCells[r * GRID_SIZE + c];
        const color = cell.dataset.color;
        if (color) {
          hasAnyTile = true;
          row.push({ color: color, type: "normal", state: "normal" });
        } else {
          row.push(null);
        }
      }
      initialBoard.push(row);
    }
    if (hasAnyTile) {
      tempLevel.initialBoard = initialBoard;
    }

    // Temporarily add to levels array and start it
    const originalLevels = [...window.LEVELS];
    const previewId = 99999; // Use a high ID for preview
    tempLevel.id = previewId;

    // Check if preview level already exists, remove it
    window.LEVELS = window.LEVELS.filter((l) => l.id !== previewId);
    window.LEVELS.push(tempLevel);

    // Close editor and start preview
    overlay.classList.add("hidden");

    // Small delay to ensure editor is closed
    setTimeout(() => {
      startLevel(previewId);
      // Restore original levels after a moment (in case user wants to continue editing)
      setTimeout(() => {
        window.LEVELS = originalLevels;
        renderLevelMenu();
      }, 100);
    }, 100);
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.title = "关闭 (ESC)";
  closeBtn.addEventListener("click", () => {
    overlay.style.transition = "opacity 0.3s ease-out";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 300);
  });

  // ESC key to close
  const handleKeyDown = (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
      overlay.classList.add("hidden");
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // Clean up event listener when overlay is removed (optional, but good practice)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.add("hidden");
    }
  });

  // Import button wrapper
  const importLabel = document.createElement("label");
  importLabel.className = "editor-button secondary";
  importLabel.style.cursor = "pointer";
  importLabel.textContent = "📥 导入";
  importLabel.appendChild(importInput);
  importInput.style.display = "none";

  const historyControls = document.createElement("div");
  historyControls.style.display = "flex";
  historyControls.style.gap = "4px";
  historyControls.style.marginBottom = "8px";

  // Undo/Redo buttons - 简化文本
  const undoBtn = document.createElement("button");
  undoBtn.textContent = "↶ 撤销";
  undoBtn.className = "editor-button secondary";
  undoBtn.type = "button";
  undoBtn.disabled = true;
  undoBtn.title = "撤销 (Ctrl+Z)";

  const redoBtn = document.createElement("button");
  redoBtn.textContent = "↷ 重做";
  redoBtn.className = "editor-button secondary";
  redoBtn.type = "button";
  redoBtn.disabled = true;
  redoBtn.title = "重做 (Ctrl+Y)";

  historyControls.appendChild(undoBtn);
  historyControls.appendChild(redoBtn);

  // 组织按钮组
  uploadApiGroup.appendChild(uploadBtn);
  uploadApiGroup.appendChild(configApiBtn);

  importExportGroup.appendChild(exportBtn);
  importExportGroup.appendChild(importLabel);

  // 清除缩略图按钮简化
  clearThumbBtn.textContent = "🗑️ 清除";
  clearThumbBtn.className = "editor-button secondary";

  // 关闭按钮
  closeBtn.textContent = "✕ 关闭";
  closeBtn.className = "editor-button secondary";

  // 按逻辑分组添加按钮
  actions.appendChild(historyControls);
  actions.appendChild(applyBtn);
  actions.appendChild(previewBtn);
  actions.appendChild(importExportGroup);
  actions.appendChild(uploadApiGroup);
  actions.appendChild(clearThumbBtn);
  actions.appendChild(closeBtn);

  // Build form layout with help text
  form.appendChild(labeled("ID", idInput));
  const nameHelp = document.createElement("div");
  nameHelp.style.fontSize = "0.85em";
  nameHelp.style.color = "#999";
  nameHelp.style.marginTop = "2px";
  nameHelp.textContent = "关卡显示名称";
  const nameWrap = labeled("名称", nameInput);
  nameWrap.appendChild(nameHelp);
  form.appendChild(nameWrap);

  form.appendChild(
    (() => {
      const w = document.createElement("div");
      w.appendChild(unlockedInput);
      w.appendChild(document.createTextNode(" 解锁（玩家可直接游玩）"));
      return w;
    })()
  );

  const themeHelp = document.createElement("div");
  themeHelp.style.fontSize = "0.85em";
  themeHelp.style.color = "#999";
  themeHelp.style.marginTop = "2px";
  themeHelp.textContent = "关卡视觉主题风格";
  const themeWrap = labeled("主题 (theme)", themeInput);
  themeWrap.appendChild(themeHelp);
  form.appendChild(themeWrap);

  const movesHelp = document.createElement("div");
  movesHelp.style.fontSize = "0.85em";
  movesHelp.style.color = "#999";
  movesHelp.style.marginTop = "2px";
  movesHelp.textContent = "玩家可用的最大移动次数";
  const movesWrap = labeled("步数 (moves)", movesInput);
  movesWrap.appendChild(movesHelp);
  form.appendChild(movesWrap);

  const scoreHelp = document.createElement("div");
  scoreHelp.style.fontSize = "0.85em";
  scoreHelp.style.color = "#999";
  scoreHelp.style.marginTop = "2px";
  scoreHelp.textContent =
    "完成关卡所需的最低分数（可选，也可通过 targets 设置）";
  const scoreWrap = labeled("分数目标 (targetScore)", targetScoreInput);
  scoreWrap.appendChild(scoreHelp);
  form.appendChild(scoreWrap);

  form.appendChild(labeled("描述", descInput));

  const starsHelp = document.createElement("div");
  starsHelp.style.fontSize = "0.85em";
  starsHelp.style.color = "#999";
  starsHelp.style.marginTop = "2px";
  starsHelp.textContent = "1星/2星/3星所需的分数阈值（必须递增）";
  const starsWrap = labeled("星级阈值 (从低到高)", starsRow);
  starsWrap.appendChild(starsHelp);
  form.appendChild(starsWrap);

  const thumbWrap = document.createElement("div");
  thumbWrap.appendChild(thumbPreview);
  thumbWrap.appendChild(thumbInput);
  form.appendChild(
    labeled("缩略图 (会以 DataURL 存入 thumbnail 字段)", thumbWrap)
  );

  form.appendChild(document.createElement("hr"));
  form.appendChild(document.createTextNode("目标 (targets) :"));
  form.appendChild(targetsContainer);
  form.appendChild(addTargetBtn);

  // Color Weights Editor
  form.appendChild(document.createElement("hr"));
  const weightsLabel = document.createElement("div");
  weightsLabel.style.marginBottom = "8px";
  weightsLabel.innerHTML =
    "<strong>方块权重配置 (colorWeights)</strong> <span style='font-size: 0.9em; color: #999;'>(总和必须为100%)</span>";

  const weightsContainer = document.createElement("div");
  weightsContainer.style.display = "grid";
  weightsContainer.style.gridTemplateColumns = "repeat(2, 1fr)";
  weightsContainer.style.gap = "8px";
  weightsContainer.style.marginBottom = "8px";
  weightsContainer.style.padding = "12px";
  weightsContainer.style.backgroundColor = "#1a1a1a";
  weightsContainer.style.borderRadius = "4px";

  const weightInputs = {};
  const colorNamesForEditor = {
    red: "红色 (Red)",
    blue: "蓝色 (Blue)",
    green: "绿色 (Green)",
    purple: "紫色 (Purple)",
    white: "白色 (White)",
    orange: "橙色 (Orange)",
    yellow: "黄色 (Yellow)",
  };

  COLORS.forEach((color) => {
    const weightRow = document.createElement("div");
    weightRow.style.display = "flex";
    weightRow.style.alignItems = "center";
    weightRow.style.gap = "8px";

    const label = document.createElement("label");
    label.textContent = colorNamesForEditor[color] || color;
    label.style.flex = "1";
    label.style.minWidth = "120px";

    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = 100;
    input.step = 1;
    input.style.width = "80px";
    input.style.padding = "4px";
    input.dataset.color = color;
    input.value = DEFAULT_COLOR_WEIGHTS[color] || 0; // 初始化默认值
    weightInputs[color] = input;

    const percentLabel = document.createElement("span");
    percentLabel.textContent = "%";
    percentLabel.style.color = "#999";

    weightRow.appendChild(label);
    weightRow.appendChild(input);
    weightRow.appendChild(percentLabel);
    weightsContainer.appendChild(weightRow);
  });

  const weightsTotal = document.createElement("div");
  weightsTotal.style.marginTop = "8px";
  weightsTotal.style.padding = "8px";
  weightsTotal.style.backgroundColor = "#0a0a0a";
  weightsTotal.style.borderRadius = "4px";
  weightsTotal.style.fontWeight = "bold";
  weightsTotal.innerHTML = '总计: <span id="editor-weights-total">100</span>%';

  // 实时更新总权重
  function updateWeightsTotal() {
    const total = COLORS.reduce((sum, color) => {
      const val = parseFloat(weightInputs[color].value) || 0;
      return sum + val;
    }, 0);
    const totalSpan = document.getElementById("editor-weights-total");
    if (totalSpan) {
      totalSpan.textContent = total.toFixed(1);
      totalSpan.style.color =
        Math.abs(total - 100) < 0.1 ? "#4caf50" : "#f44336";
    }
  }

  // 为所有权重输入框添加事件监听
  COLORS.forEach((color) => {
    weightInputs[color].addEventListener("input", updateWeightsTotal);
    weightInputs[color].addEventListener("change", updateWeightsTotal);
  });

  // 初始化总权重显示（延迟执行以确保DOM已创建）
  setTimeout(() => updateWeightsTotal(), 0);

  const weightsWrap = document.createElement("div");
  weightsWrap.appendChild(weightsLabel);
  weightsWrap.appendChild(weightsContainer);
  weightsWrap.appendChild(weightsTotal);
  form.appendChild(weightsWrap);

  // Special Rules editor
  form.appendChild(document.createElement("hr"));
  const specialRulesLabel = document.createElement("div");
  specialRulesLabel.style.marginBottom = "4px";
  specialRulesLabel.innerHTML =
    "<strong>特殊规则 (specialRules)</strong> <span style='font-size: 0.9em; color: #999;'>(JSON 对象格式)</span>";
  const specialRulesInput = document.createElement("textarea");
  specialRulesInput.rows = 6;
  specialRulesInput.style.fontFamily = "monospace";
  specialRulesInput.style.fontSize = "12px";
  specialRulesInput.placeholder = '例如: {"spawnRate": 0.5, "maxCombo": 10}';
  const specialRulesHelp = document.createElement("div");
  specialRulesHelp.style.fontSize = "0.85em";
  specialRulesHelp.style.color = "#999";
  specialRulesHelp.style.marginTop = "4px";
  specialRulesHelp.textContent =
    "提示: 留空或输入 {} 表示无特殊规则。必须是有效的 JSON 对象格式。";
  const specialRulesWrap = document.createElement("div");
  specialRulesWrap.appendChild(specialRulesLabel);
  specialRulesWrap.appendChild(specialRulesInput);
  specialRulesWrap.appendChild(specialRulesHelp);
  form.appendChild(specialRulesWrap);

  // Color names map (shared for board editor and form population)
  const colorNamesMap = {
    red: "红",
    blue: "蓝",
    green: "绿",
    purple: "紫",
    white: "白",
    orange: "橙",
    yellow: "黄",
  };

  // Initial Board Layout Editor
  form.appendChild(document.createElement("hr"));
  const boardLabel = document.createElement("div");
  boardLabel.style.marginBottom = "4px";
  boardLabel.innerHTML = "<strong>初始游戏板布局 (initialBoard)</strong>";
  const boardHelp = document.createElement("div");
  boardHelp.style.fontSize = "0.85em";
  boardHelp.style.color = "#999";
  boardHelp.style.marginBottom = "8px";
  boardHelp.textContent =
    "点击格子设置方块颜色，右键清除。留空则使用随机生成。";

  const boardEditorContainer = document.createElement("div");
  boardEditorContainer.id = "board-editor-container";
  boardEditorContainer.style.display = "grid";
  boardEditorContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  boardEditorContainer.style.gap = "2px";
  boardEditorContainer.style.width = "360px";
  boardEditorContainer.style.maxWidth = "100%";
  boardEditorContainer.style.margin = "8px 0";
  boardEditorContainer.style.padding = "8px";
  boardEditorContainer.style.backgroundColor = "#111";
  boardEditorContainer.style.borderRadius = "4px";
  boardEditorContainer.style.border = "1px solid #333";

  const boardEditorCells = [];
  let selectedColorForBoard = "red";

  // Color picker for board editor
  const colorPickerRow = document.createElement("div");
  colorPickerRow.style.display = "flex";
  colorPickerRow.style.gap = "4px";
  colorPickerRow.style.marginBottom = "8px";
  colorPickerRow.style.flexWrap = "wrap";

  const colorPickerLabel = document.createElement("span");
  colorPickerLabel.textContent = "选择颜色: ";
  colorPickerLabel.style.marginRight = "8px";
  colorPickerRow.appendChild(colorPickerLabel);

  COLORS.forEach((color) => {
    const colorBtn = document.createElement("button");
    colorBtn.textContent = colorNamesMap[color] || color;
    colorBtn.style.padding = "4px 8px";
    colorBtn.style.borderRadius = "4px";
    colorBtn.style.border = "1px solid #444";
    colorBtn.style.backgroundColor = `var(--color-${color})`;
    colorBtn.style.color = color === "white" ? "#000" : "#fff";
    colorBtn.style.cursor = "pointer";
    colorBtn.style.fontSize = "11px";
    colorBtn.dataset.color = color;

    if (color === selectedColorForBoard) {
      colorBtn.style.border = "2px solid #fff";
      colorBtn.style.boxShadow = "0 0 8px rgba(255,255,255,0.5)";
    }

    colorBtn.addEventListener("click", (e) => {
      e.preventDefault();
      selectedColorForBoard = color;
      colorPickerRow.querySelectorAll("button").forEach((btn) => {
        btn.style.border = "1px solid #444";
        btn.style.boxShadow = "none";
      });
      colorBtn.style.border = "2px solid #fff";
      colorBtn.style.boxShadow = "0 0 8px rgba(255,255,255,0.5)";
    });

    colorPickerRow.appendChild(colorBtn);
  });

  const clearBoardBtn = document.createElement("button");
  clearBoardBtn.textContent = "清空布局";
  clearBoardBtn.className = "editor-button";
  clearBoardBtn.style.marginLeft = "auto";
  clearBoardBtn.addEventListener("click", () => {
    boardEditorCells.forEach((cell) => {
      cell.dataset.color = "";
      cell.style.backgroundColor = "#222";
      cell.textContent = "";
    });
  });
  colorPickerRow.appendChild(clearBoardBtn);

  // Create 9x9 grid
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement("div");
      cell.style.aspectRatio = "1";
      cell.style.backgroundColor = "#222";
      cell.style.border = "1px solid #444";
      cell.style.cursor = "pointer";
      cell.style.display = "flex";
      cell.style.alignItems = "center";
      cell.style.justifyContent = "center";
      cell.style.fontSize = "10px";
      cell.style.position = "relative";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.dataset.color = "";

      cell.addEventListener("click", (e) => {
        e.preventDefault();
        if (selectedColorForBoard) {
          cell.dataset.color = selectedColorForBoard;
          cell.style.backgroundColor = `var(--color-${selectedColorForBoard})`;
          cell.textContent =
            colorNamesMap[selectedColorForBoard] ||
            selectedColorForBoard[0].toUpperCase();
        }
      });

      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        cell.dataset.color = "";
        cell.style.backgroundColor = "#222";
        cell.textContent = "";
      });

      boardEditorCells.push(cell);
      boardEditorContainer.appendChild(cell);
    }
  }

  const boardEditorWrap = document.createElement("div");
  boardEditorWrap.appendChild(boardLabel);
  boardEditorWrap.appendChild(boardHelp);
  boardEditorWrap.appendChild(colorPickerRow);
  boardEditorWrap.appendChild(boardEditorContainer);
  form.appendChild(boardEditorWrap);

  form.appendChild(actions);
  right.appendChild(form);

  // 右上角退出按钮
  const closeTopBtn = document.createElement("button");
  closeTopBtn.textContent = "✕";
  closeTopBtn.className = "editor-close-top";
  closeTopBtn.title = "关闭编辑器";
  closeTopBtn.addEventListener("click", () => {
    overlay.style.transition = "opacity 0.3s ease-out";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 300);
  });

  panel.appendChild(left);
  panel.appendChild(right);
  panel.appendChild(closeTopBtn); // 添加到panel最后，确保在最上层
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // 添加淡入动画
  overlay.style.opacity = "0";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.transition = "opacity 0.3s ease-in";
      overlay.style.opacity = "1";
    });
  });

  // state
  let selectedIndex = null;
  let currentDraft = {};

  // Undo/Redo system
  let historyStack = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  function saveToHistory() {
    if (selectedIndex == null) return;
    const snapshot = {
      levelData: JSON.parse(JSON.stringify(window.LEVELS[selectedIndex])),
      timestamp: Date.now(),
    };

    // Remove any history after current index (when user does new action after undo)
    historyStack = historyStack.slice(0, historyIndex + 1);

    // Add new snapshot
    historyStack.push(snapshot);
    historyIndex++;

    // Limit history size
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift();
      historyIndex--;
    }

    updateUndoRedoButtons();
  }

  function undo() {
    if (historyIndex <= 0 || selectedIndex == null) return;
    historyIndex--;
    const snapshot = historyStack[historyIndex];
    if (snapshot && snapshot.levelData) {
      window.LEVELS[selectedIndex] = JSON.parse(
        JSON.stringify(snapshot.levelData)
      );
      populateForm(selectedIndex);
      renderLevelList();
      renderLevelMenu();
    }
    updateUndoRedoButtons();
  }

  function redo() {
    if (historyIndex >= historyStack.length - 1 || selectedIndex == null)
      return;
    historyIndex++;
    const snapshot = historyStack[historyIndex];
    if (snapshot && snapshot.levelData) {
      window.LEVELS[selectedIndex] = JSON.parse(
        JSON.stringify(snapshot.levelData)
      );
      populateForm(selectedIndex);
      renderLevelList();
      renderLevelMenu();
    }
    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= historyStack.length - 1;
  }

  function resetHistory() {
    historyStack = [];
    historyIndex = -1;
    updateUndoRedoButtons();
  }

  // Add event listeners to undo/redo buttons (buttons already defined above)
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);

  // Keyboard shortcuts
  const handleEditorKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && !overlay.classList.contains("hidden")) {
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    }
  };
  document.addEventListener("keydown", handleEditorKeyDown);

  function clearForm() {
    idInput.value = "";
    nameInput.value = "";
    unlockedInput.checked = false;
    themeInput.value = "plain";
    movesInput.value = "";
    targetScoreInput.value = "";
    descInput.value = "";
    starInputs.forEach((s) => (s.value = ""));
    thumbPreview.src = "";
    specialRulesInput.value = "";
    // Reset weights to default
    COLORS.forEach((color) => {
      if (weightInputs[color]) {
        weightInputs[color].value = DEFAULT_COLOR_WEIGHTS[color] || 0;
      }
    });
    updateWeightsTotal();
    boardEditorCells.forEach((cell) => {
      cell.dataset.color = "";
      cell.style.backgroundColor = "#222";
      cell.textContent = "";
    });
    targetsContainer.innerHTML = "";
    currentDraft = {};
  }

  function populateForm(idx) {
    const lvl = window.LEVELS[idx];
    if (!lvl) return;
    const prevIndex = selectedIndex;
    selectedIndex = idx;

    // Reset history when switching levels
    if (prevIndex !== idx) {
      resetHistory();
      saveToHistory(); // Save initial state
    }

    currentDraft = JSON.parse(JSON.stringify(lvl));
    idInput.value = lvl.id;
    nameInput.value = lvl.name || "";
    unlockedInput.checked = !!lvl.unlocked;
    themeInput.value = lvl.theme || "plain";
    movesInput.value = lvl.moves || 20;
    targetScoreInput.value =
      lvl.targetScore ||
      (lvl.targets && lvl.targets.find((t) => t.type === "score")?.count) ||
      0;
    descInput.value = lvl.description || "";
    const sarr = Array.isArray(lvl.stars) ? lvl.stars : [];
    for (let i = 0; i < 3; i++) starInputs[i].value = sarr[i] || 0;
    thumbPreview.src = lvl.thumbnail || "";
    currentDraft.thumbnail = lvl.thumbnail || "";
    currentDraft.targets = Array.isArray(lvl.targets)
      ? JSON.parse(JSON.stringify(lvl.targets))
      : [];

    // Load colorWeights
    const weights = lvl.specialRules?.colorWeights || DEFAULT_COLOR_WEIGHTS;
    COLORS.forEach((color) => {
      if (weightInputs[color]) {
        weightInputs[color].value = weights[color] || 0;
      }
    });
    updateWeightsTotal();

    // Load specialRules (excluding colorWeights to avoid duplication)
    if (lvl.specialRules && typeof lvl.specialRules === "object") {
      try {
        const specialRulesCopy = { ...lvl.specialRules };
        delete specialRulesCopy.colorWeights; // Remove colorWeights as it's handled separately
        const rulesStr = JSON.stringify(specialRulesCopy, null, 2);
        specialRulesInput.value = rulesStr === "{}" ? "" : rulesStr;
      } catch (e) {
        specialRulesInput.value = "";
      }
    } else {
      specialRulesInput.value = "";
    }

    // Load initial board layout
    boardEditorCells.forEach((cell) => {
      cell.dataset.color = "";
      cell.style.backgroundColor = "#222";
      cell.textContent = "";
    });
    if (lvl.initialBoard && Array.isArray(lvl.initialBoard)) {
      for (let r = 0; r < GRID_SIZE && r < lvl.initialBoard.length; r++) {
        const row = lvl.initialBoard[r];
        if (Array.isArray(row)) {
          for (let c = 0; c < GRID_SIZE && c < row.length; c++) {
            const tile = row[c];
            if (tile && tile.color) {
              const cell = boardEditorCells[r * GRID_SIZE + c];
              cell.dataset.color = tile.color;
              cell.style.backgroundColor = `var(--color-${tile.color})`;
              cell.textContent =
                colorNamesMap[tile.color] || tile.color[0].toUpperCase();
            }
          }
        }
      }
    }

    renderTargetsEditor(currentDraft.targets);
  }

  function selectLevelByIndex(idx) {
    // highlight in list
    // Note: list.children includes the batch-mode-toggle, so we need to filter it out
    const items = Array.from(list.children).filter(
      (child) => !child.classList.contains("batch-mode-toggle")
    );
    items.forEach((it, i) => {
      if (i === idx) it.classList.add("selected");
      else it.classList.remove("selected");
    });
    if (idx != null) populateForm(idx);
  }

  function renderLevelList() {
    list.innerHTML = "";

    // Batch mode toggle
    if (!list.querySelector(".batch-mode-toggle")) {
      const batchToggle = document.createElement("div");
      batchToggle.className = "batch-mode-toggle";
      batchToggle.style.marginBottom = "8px";
      batchToggle.style.padding = "4px";
      const batchCheckbox = document.createElement("input");
      batchCheckbox.type = "checkbox";
      batchCheckbox.id = "batch-mode-checkbox";
      batchCheckbox.addEventListener("change", (e) => {
        batchMode = e.target.checked;
        selectedIndices.clear();
        renderLevelList();
        updateBatchControls();
      });
      const batchLabel = document.createElement("label");
      batchLabel.htmlFor = "batch-mode-checkbox";
      batchLabel.textContent = "批量选择模式";
      batchLabel.style.cursor = "pointer";
      batchLabel.style.marginLeft = "4px";
      batchToggle.appendChild(batchCheckbox);
      batchToggle.appendChild(batchLabel);
      list.appendChild(batchToggle);
    }

    (window.LEVELS || []).forEach((l, i) => {
      const it = document.createElement("div");
      it.className = "editor-list-item";
      it.style.display = "flex";
      it.style.alignItems = "center";
      it.style.gap = "6px";

      if (batchMode) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedIndices.has(i);
        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            selectedIndices.add(i);
          } else {
            selectedIndices.delete(i);
          }
          updateBatchControls();
        });
        checkbox.addEventListener("click", (e) => e.stopPropagation());
        it.appendChild(checkbox);
      }

      const label = document.createElement("span");
      label.textContent = `${l.id}. ${l.name || "未命名"}`;
      label.style.flex = "1";
      label.style.cursor = "pointer";
      label.addEventListener("click", () => {
        if (batchMode) {
          const checkbox = it.querySelector("input[type='checkbox']");
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event("change"));
          }
        } else {
          selectLevelByIndex(i);
        }
      });
      it.appendChild(label);

      if (i === selectedIndex && !batchMode) {
        it.classList.add("selected");
      }

      list.appendChild(it);
    });
  }

  // Show/hide batch controls based on mode
  const originalRenderLevelList = renderLevelList;
  renderLevelList = function () {
    originalRenderLevelList();
    batchControls.style.display = batchMode ? "flex" : "none";
    updateBatchControls();
  };

  // initial render
  renderLevelList();

  // expose helper to outside for tests
  window._openLevelEditor_internal = { renderLevelList };
}

function hideMenu() {
  const overlay = document.getElementById("menu-overlay");
  if (!overlay) {
    console.warn("hideMenu: menu-overlay not found");
    return;
  }
  overlay.style.transition = "opacity 0.3s ease-out";
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
  }, 300);
}

document.addEventListener("DOMContentLoaded", () => {
  // Hook up menu buttons
  const openBtn = document.getElementById("open-menu-btn");
  const closeBtn = document.getElementById("btn-close-menu");
  const levelsBtn = document.getElementById("btn-levels");
  const backBtn = document.getElementById("btn-back-to-main");

  if (openBtn) openBtn.addEventListener("click", () => showMenu());
  if (closeBtn)
    closeBtn.addEventListener("click", () => {
      hideMenu();
      // 如果是从主菜单进入的，返回主菜单
      const mainMenuScreen = document.getElementById("main-menu-screen");
      if (mainMenuScreen && mainMenuScreen.classList.contains("hidden")) {
        showMainMenu();
      }
    });
  if (backBtn)
    backBtn.addEventListener("click", () => {
      const panel = document.getElementById("level-panel");
      if (panel) panel.classList.add("hidden");
    });
  if (levelsBtn)
    levelsBtn.addEventListener("click", () => {
      const panel = document.getElementById("level-panel");
      if (panel) panel.classList.remove("hidden");
      try {
        // 不再在关卡列表中插入设置和编辑器按钮，这些功能已移至设置菜单和关卡列表右上角
      } catch (e) {
        console.warn("插入设置控件失败", e);
      }
      renderLevelMenu();
    });

  // If levels are already loaded, render menu content quietly
  if (Array.isArray(window.LEVELS) && window.LEVELS.length) {
    renderLevelMenu();
  }

  // Listen for levelsLoaded event
  document.addEventListener("levelsLoaded", (e) => {
    renderLevelMenu();
  });
});
