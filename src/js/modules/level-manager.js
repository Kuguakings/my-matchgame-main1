// ==========================================
// 关卡管理模块 (Level Manager)
// 负责关卡的加载、进度管理和关卡操作
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

// 初始化全局变量
if (!window.LEVELS) {
  window.LEVELS = [];
}

// 全局设置（持久化到 localStorage）
if (!window.GameSettings) {
  window.GameSettings = {
    autoJumpNext: false, // 完成关卡后是否自动跳转到下一关（默认 false）
  };
}

/**
 * 加载用户设置
 */
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

/**
 * 保存用户设置
 */
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(window.GameSettings));
  } catch (e) {
    console.warn("保存设置失败", e);
  }
}

/**
 * 从 API 或本地加载关卡数据
 */
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

/**
 * 加载关卡进度（解锁状态、星级等）
 */
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

/**
 * 保存关卡进度（解锁状态、星级等）
 */
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

/**
 * 根据ID获取关卡定义
 * @param {number} id - 关卡ID
 * @returns {Object|null} 关卡定义对象
 */
function getLevelById(id) {
  return window.LEVELS.find((l) => l.id === Number(id)) || null;
}

/**
 * 解锁指定关卡
 * @param {number} id - 关卡ID
 * @returns {boolean} 是否成功解锁
 */
function unlockLevel(id) {
  const lvl = getLevelById(id);
  if (!lvl) return false;
  if (!lvl.unlocked) {
    lvl.unlocked = true;
    saveProgress();
  }
  return true;
}

/**
 * 获取下一关的ID
 * @param {number} currentId - 当前关卡ID
 * @returns {number|null} 下一关ID，如果没有则返回 null
 */
function getNextLevel(currentId) {
  const ids = window.LEVELS.map((l) => l.id).sort((a, b) => a - b);
  const idx = ids.indexOf(Number(currentId));
  if (idx === -1) return ids.length ? ids[0] : null;
  return ids[idx + 1] || null;
}

// 对外暴露简易 API（保持向后兼容）
window.LevelManager = {
  loadLevels,
  loadProgress,
  saveProgress,
  getLevelById,
  unlockLevel,
  getNextLevel,
  loadSettings,
  saveSettings,
  _rawKey: LEVELS_PROGRESS_KEY,
};

