/**
 * ==========================================
 * 音频系统集成示例 (Audio System Integration Guide)
 * 展示如何在游戏中使用 AudioManager
 * ==========================================
 *
 * 在实际 game.js 中的使用方法：
 * 1. 确保 audio-manager.js 在 game.js 之前加载
 * 2. 使用全局 audioManager 对象进行音频控制
 * 3. 在用户交互事件中调用方法
 */

// ==========================================
// 初始化阶段
// ==========================================

/**
 * 游戏启动时调用
 * 在 DOMContentLoaded 事件中调用
 */
function initAudio() {
  console.log("[音频] 初始化音频系统");

  // 尝试解锁自动播放（如果还未解锁）
  if (!audioManager.autoplayUnlocked) {
    // 会在用户首次点击时自动调用
    console.log("[音频] 等待用户交互以解锁自动播放...");
  }

  // 设置初始音量
  audioManager.setBgmVolume(0.7); // 背景音乐 70% 音量
  audioManager.setSfxVolume(0.6); // 音效 60% 音量

  console.log("[音频] 音频系统已初始化");
}

// ==========================================
// 菜单/界面阶段
// ==========================================

/**
 * 显示主菜单时调用
 */
function showMainMenuWithMusic() {
  audioManager
    .playLevelMusic("main-menu")
    .then(() => {
      console.log("[菜单] 主菜单音乐已播放");
    })
    .catch((e) => {
      console.warn("[菜单] 主菜单音乐加载失败:", e);
    });
}

/**
 * 关闭主菜单时调用
 */
function hideMainMenu() {
  // 可选：停止或淡出音乐
  // audioManager.stopBgm();
}

/**
 * 显示关卡选择界面
 */
function showLevelSelectionMenu() {
  // 可保持当前音乐或切换到等待音乐
  audioManager
    .playLevelMusic("idle")
    .then(() => {
      console.log("[菜单] 关卡选择界面音乐已播放");
    })
    .catch((e) => {
      console.warn("[菜单] 关卡选择音乐加载失败:", e);
    });
}

// ==========================================
// 游戏玩法阶段
// ==========================================

/**
 * 启动关卡时调用
 * @param {Object} levelData - 关卡数据对象
 * @example
 * {
 *   id: 1,
 *   name: "入门练习",
 *   theme: "plain",
 *   customMusicPath: null,  // 或 "music/custom/my-level.mp3"
 *   moves: 25,
 *   targets: [{ type: "score", count: 5000 }]
 * }
 */
async function startLevel(levelData) {
  console.log(`[游戏] 启动关卡 ${levelData.id}: ${levelData.name}`);

  try {
    // 播放关卡主题音乐
    // 如果有自定义路径，优先使用；否则使用默认主题
    await audioManager.playLevelMusic(
      levelData.theme,
      levelData.customMusicPath
    );

    console.log(`[游戏] 关卡音乐已切换: ${levelData.theme}`);

    // 接下来初始化游戏界面和逻辑
    initGameBoard();
    renderBoard();
  } catch (e) {
    console.error("[游戏] 启动关卡失败:", e);
  }
}

/**
 * 玩家点击选择方块时调用
 * 播放"选择"音效
 */
function handleCellClick_WithAudio(r, c) {
  // 播放选择音效
  if (typeof audioManager !== "undefined") {
    audioManager.playSelect();
  }

  // 原有的逻辑...
  // selectCell(r, c);
}

/**
 * 交换方块时调用
 * 播放"交换"音效
 */
function swapCells_WithAudio(r1, c1, r2, c2) {
  // 播放交换音效
  if (typeof audioManager !== "undefined") {
    audioManager.playSwap();
  }

  // 原有的逻辑...
  // performSwap(r1, c1, r2, c2);
}

/**
 * 检测到匹配时调用
 * @param {number} combo - 连击数（1, 2, 3...）
 */
function onMatch_WithAudio(combo) {
  if (typeof audioManager !== "undefined") {
    audioManager.playMatch(combo);
  }

  console.log(`[游戏] 匹配! 连击数: ${combo}`);
}

/**
 * 检测到爆炸/消除时调用
 * @param {string} color - 方块颜色
 */
function onExplosion_WithAudio(color) {
  if (typeof audioManager !== "undefined") {
    audioManager.playExplosion(color);
  }
}

/**
 * 创建特殊方块时调用
 */
function onCreateSpecial_WithAudio() {
  if (typeof audioManager !== "undefined") {
    audioManager.playCreateSpecial();
  }
}

/**
 * 播放黄金方块激活音效
 */
function onGoldenTileActivate_WithAudio() {
  if (typeof audioManager !== "undefined") {
    audioManager.playWhirlwind();
  }
}

/**
 * 无法操作时调用（如冰冻方块、锁定）
 */
function onInvalidAction_WithAudio() {
  if (typeof audioManager !== "undefined") {
    audioManager.playInvalid();
  }
  console.log("[游戏] 无效操作");
}

// ==========================================
// 游戏暂停/恢复阶段
// ==========================================

/**
 * 玩家暂停游戏时调用
 */
function pauseGame_WithAudio() {
  console.log("[游戏] 游戏已暂停");

  if (typeof audioManager !== "undefined") {
    audioManager.pauseBgm();
    console.log("[音频] 背景音乐已暂停");
  }

  // 显示暂停菜单等...
}

/**
 * 玩家恢复游戏时调用
 */
function resumeGame_WithAudio() {
  console.log("[游戏] 游戏已恢复");

  if (typeof audioManager !== "undefined") {
    audioManager.resumeBgm();
    console.log("[音频] 背景音乐已恢复");
  }
}

// ==========================================
// 游戏结束/关卡完成阶段
// ==========================================

/**
 * 关卡成功完成时调用
 * @param {number} stars - 获得的星数（1-3）
 */
function levelComplete_WithAudio(stars) {
  console.log(`[游戏] 关卡完成! 获得 ${stars} 星`);

  if (typeof audioManager !== "undefined") {
    audioManager.playLevelUp();
    console.log("[音频] 关卡完成音效已播放");
  }

  // 显示完成界面
  setTimeout(() => {
    showLevelCompleteScreen(stars);
  }, 1000);
}

/**
 * 关卡失败时调用
 */
function levelFailed_WithAudio() {
  console.log("[游戏] 关卡失败");

  if (typeof audioManager !== "undefined") {
    // 可选：播放失败音效
    audioManager.playInvalid();
  }

  // 显示失败界面
  showLevelFailedScreen();
}

/**
 * 显示关卡完成屏幕后
 * 返回到关卡选择界面或下一关
 */
function onReturnToLevelSelection_WithAudio() {
  console.log("[菜单] 返回到关卡选择");

  if (typeof audioManager !== "undefined") {
    audioManager.playLevelMusic("idle");
  }

  showLevelSelectionMenu();
}

// ==========================================
// 设置/音量控制阶段
// ==========================================

/**
 * 用户调整背景音乐音量时调用
 * @param {number} volume - 0-1 的音量值
 */
function updateBgmVolume(volume) {
  if (typeof audioManager !== "undefined") {
    audioManager.setBgmVolume(volume);
    console.log(`[音频] BGM 音量已调整为: ${(volume * 100).toFixed(0)}%`);
  }
}

/**
 * 用户调整音效音量时调用
 * @param {number} volume - 0-1 的音量值
 */
function updateSfxVolume(volume) {
  if (typeof audioManager !== "undefined") {
    audioManager.setSfxVolume(volume);
    console.log(`[音频] SFX 音量已调整为: ${(volume * 100).toFixed(0)}%`);
  }
}

/**
 * 用户启用/禁用音乐
 * @param {boolean} enabled
 */
function setMusicEnabled(enabled) {
  if (typeof audioManager !== "undefined") {
    if (enabled) {
      audioManager.resumeBgm();
      console.log("[音频] 音乐已启用");
    } else {
      audioManager.pauseBgm();
      console.log("[音频] 音乐已禁用");
    }
  }
}

// ==========================================
// 集成到现有 game.js 的修改示例
// ==========================================

/**
 * 建议在 game.js 的 DOMContentLoaded 中添加：
 *
 * document.addEventListener("DOMContentLoaded", () => {
 *   // ... 现有代码 ...
 *
 *   // 新增：初始化音频系统
 *   initAudio();
 *
 *   // 播放主菜单音乐
 *   showMainMenuWithMusic();
 * });
 */

/**
 * 建议在现有的 handleCellClick 函数中修改为：
 *
 * function handleCellClick(e) {
 *   if (isProcessing) return;
 *
 *   const r = parseInt(e.target.dataset.row);
 *   const c = parseInt(e.target.dataset.col);
 *
 *   // 新增：音效
 *   audioManager.playSelect?.();
 *
 *   // ... 现有的选择逻辑 ...
 * }
 */

/**
 * 建议在现有的 swapCells 函数中修改为：
 *
 * async function swapCells(r1, c1, r2, c2) {
 *   // 新增：音效
 *   audioManager.playSwap?.();
 *
 *   // ... 现有的交换逻辑 ...
 * }
 */

// ==========================================
// 导出（如果使用模块化）
// ==========================================

// 如果需要在其他模块中使用，可以导出这些函数
// export {
//   initAudio,
//   showMainMenuWithMusic,
//   startLevel,
//   pauseGame_WithAudio,
//   resumeGame_WithAudio,
//   levelComplete_WithAudio,
//   updateBgmVolume,
//   updateSfxVolume
// };
