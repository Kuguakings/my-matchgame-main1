// ==========================================
// 游戏状态管理模块 (Game State Management)
// 负责游戏状态的保存、加载和恢复
// ==========================================

// 游戏状态保存相关常量
const LEVEL_STATE_KEY_PREFIX = "mymatch_level_state_v1_";

/**
 * 保存当前游戏状态到 localStorage
 * @param {number} level - 关卡ID
 * @param {number} score - 当前分数
 * @param {Array} board - 棋盘数据
 * @param {Object} levelTargets - 关卡目标
 * @param {number} targetScore - 目标分数
 */
function saveGameState(level, score, board, levelTargets, targetScore) {
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

/**
 * 从 localStorage 加载指定关卡的游戏状态
 * @param {number} levelId - 关卡ID
 * @returns {Object|null} 游戏状态对象，如果不存在或过期则返回 null
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

/**
 * 清除指定关卡的保存游戏状态
 * @param {number} levelId - 关卡ID
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

// 导出函数（通过 window 对象暴露，保持向后兼容）
window.GameStateManager = {
  saveGameState,
  loadGameState,
  clearGameState,
  LEVEL_STATE_KEY_PREFIX,
};

