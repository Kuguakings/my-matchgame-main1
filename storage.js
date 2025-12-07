// ==========================================
// 存储模块 - Storage Management System
// 负责游戏状态、设置和进度的持久化存储
// ==========================================

import { GameCore } from './game-core.js';
import { UIManager } from './ui.js';
import { LevelManager } from './level-manager.js';

/**
 * 存储管理类
 */
export class StorageManager {
  // 存储键常量
  static SETTINGS_KEY = "mymatch_settings_v1";
  static LEVELS_PROGRESS_KEY = "mymatch_progress_v1";

  /**
   * 保存游戏状态
   */
  static saveGameState() {
    try {
      // 只有在游戏进行中才保存状态
      if (!GameCore.level || !GameCore.board) return;

      const gameState = {
        level: GameCore.level,
        score: GameCore.score,
        board: GameCore.board,
        levelTargets: GameCore.levelTargets,
        targetScore: GameCore.targetScore,
        savedAt: Date.now(),
      };

      const key = GameCore.LEVEL_STATE_KEY_PREFIX + GameCore.level;
      localStorage.setItem(key, JSON.stringify(gameState));
      console.log(`游戏状态已保存: 关卡 ${GameCore.level}`);
    } catch (err) {
      console.warn("保存游戏状态失败：", err);
    }
  }

  /**
   * 加载游戏状态
   */
  static loadGameState(levelId) {
    try {
      const key = GameCore.LEVEL_STATE_KEY_PREFIX + levelId;
      const savedState = localStorage.getItem(key);
      if (!savedState) return null;

      const state = JSON.parse(savedState);

      // 检查状态是否有效（例如不超过一天）
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - state.savedAt > oneDay) {
        // 状态过期，清除它
        this.clearGameState(levelId);
        return null;
      }

      return state;
    } catch (err) {
      console.warn("加载游戏状态失败：", err);
      return null;
    }
  }

  /**
   * 清除游戏状态
   */
  static clearGameState(levelId) {
    try {
      const key = GameCore.LEVEL_STATE_KEY_PREFIX + levelId;
      localStorage.removeItem(key);
      console.log(`游戏状态已清除: 关卡 ${levelId}`);
    } catch (err) {
      console.warn("清除游戏状态失败：", err);
    }
  }

  /**
   * 恢复游戏状态
   */
  static async restoreGameState(state) {
    try {
      console.log("开始恢复游戏状态...", state);

      // 恢复游戏状态
      GameCore.level = state.level;
      GameCore.score = state.score;
      GameCore.board = state.board;
      GameCore.levelTargets = state.levelTargets;
      GameCore.targetScore = state.targetScore;

      console.log("游戏状态数据已恢复，准备更新UI...");

      // 更新UI显示
      UIManager.updateLevel(GameCore.level);
      UIManager.updateScore(GameCore.score);
      UIManager.updateVersion();

      // 更新目标面板
      UIManager.updateTargetUI();

      // 隐藏菜单并显示游戏容器
      LevelManager.hideMenu();

      // 确保游戏容器可见
      const gameContainer = document.getElementById("game-container");
      if (gameContainer) {
        gameContainer.classList.remove("hidden");
        gameContainer.style.opacity = "1";
        console.log("游戏容器已设置为可见");
      } else {
        console.error("找不到游戏容器元素!");
      }

      // 等待一小段时间确保DOM更新
      await new Promise(resolve => setTimeout(resolve, 100));

      // 渲染棋盘
      console.log("开始渲染棋盘...");
      UIManager.renderBoard();

      // 应用关卡主题（如果有关卡定义）
      const lvlDef = LevelManager.getLevelById(GameCore.level);
      if (lvlDef?.theme) {
        LevelManager.applyLevelTheme(lvlDef.theme);
      }

      // 播放关卡背景音乐
      LevelManager.playLevelBGM(lvlDef?.theme || "plain");

      console.log(`游戏状态已恢复: 关卡 ${GameCore.level}, 分数: ${GameCore.score}`);

      // 确保事件监听器设置正确
      setTimeout(() => {
        if (window.gameController) {
          console.log("游戏控制器已初始化，状态恢复完成");
        } else {
          console.warn("游戏控制器未初始化，可能影响游戏功能");
        }
      }, 500);

    } catch (error) {
      console.error("恢复游戏状态失败:", error);
      // 如果恢复失败，重新开始关卡
      console.log("由于恢复失败，重新开始关卡...");
      LevelManager.startLevel(state.level);
    }
  }

  /**
   * 加载设置
   */
  static loadSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (raw) {
        const settings = JSON.parse(raw);
        // 合并到全局设置对象
        if (typeof window.GameSettings !== "undefined") {
          Object.assign(window.GameSettings, settings);
        }
      }
    } catch (e) {
      console.warn("loadSettings failed:", e);
    }
  }

  /**
   * 保存设置
   */
  static saveSettings() {
    try {
      if (typeof window.GameSettings !== "undefined") {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(window.GameSettings));
      }
    } catch (e) {
      console.warn("保存设置失败", e);
    }
  }

  /**
   * 加载关卡进度
   */
  static loadProgress() {
    try {
      const raw = localStorage.getItem(this.LEVELS_PROGRESS_KEY);
      if (raw) {
        const progress = JSON.parse(raw);
        console.log("本地关卡进度加载完成");

        // 应用进度到关卡数据
        if (window.LEVELS && Array.isArray(window.LEVELS)) {
          window.LEVELS.forEach(level => {
            const levelProgress = progress[level.id];
            if (levelProgress) {
              level.unlocked = levelProgress.unlocked || false;
              level.completed = levelProgress.completed || false;
              level.bestScore = levelProgress.bestScore || 0;
              level.starRating = levelProgress.starRating || 0;
            }
          });
        }
      }
    } catch (err) {
      console.warn("解析本地进度时发生错误：", err);
    }
  }

  /**
   * 保存关卡进度
   */
  static saveProgress() {
    try {
      const payload = {};

      if (window.LEVELS && Array.isArray(window.LEVELS)) {
        window.LEVELS.forEach(level => {
          payload[level.id] = {
            unlocked: level.unlocked || false,
            completed: level.completed || false,
            bestScore: level.bestScore || 0,
            starRating: level.starRating || 0,
          };
        });
      }

      localStorage.setItem(this.LEVELS_PROGRESS_KEY, JSON.stringify(payload));
      console.log("已保存关卡进度");
    } catch (err) {
      console.warn("保存关卡进度失败：", err);
    }
  }

  /**
   * 解锁关卡
   */
  static unlockLevel(id) {
    const lvl = this.getLevelById(id);
    if (!lvl) return false;

    if (!lvl.unlocked) {
      lvl.unlocked = true;
      console.log(`关卡 ${id} 已解锁`);

      // 保存进度
      this.saveProgress();
      return true;
    }

    return false;
  }

  /**
   * 完成关卡
   */
  static completeLevel(levelId, finalScore) {
    const lvl = this.getLevelById(levelId);
    if (!lvl) return;

    lvl.completed = true;

    // 更新最佳分数
    if (!lvl.bestScore || finalScore > lvl.bestScore) {
      lvl.bestScore = finalScore;
    }

    // 计算星级评分
    const starRating = this.calculateStarRating(levelId, finalScore);
    if (starRating > (lvl.starRating || 0)) {
      lvl.starRating = starRating;
    }

    // 保存进度
    this.saveProgress();

    console.log(`关卡 ${levelId} 完成！分数：${finalScore}，星级：${starRating}`);
  }

  /**
   * 计算星级评分
   */
  static calculateStarRating(levelId, score) {
    try {
      const targetScore = GameCore.targetScore || 1000;
      const ratio = score / targetScore;

      if (ratio >= 2.0) return 3; // 超过目标分200%
      if (ratio >= 1.5) return 2; // 超过目标分150%
      if (ratio >= 1.0) return 1; // 达到目标分

      return 0;
    } catch (e) {
      console.warn("计算星级时出错", e);
      return 0;
    }
  }

  /**
   * 获取关卡定义（辅助方法）
   */
  static getLevelById(id) {
    return window.LEVELS?.find((l) => l.id === Number(id)) || null;
  }

  /**
   * 导出关卡进度数据
   */
  static exportProgress() {
    try {
      const data = {
        settings: localStorage.getItem(this.SETTINGS_KEY),
        progress: localStorage.getItem(this.LEVELS_PROGRESS_KEY),
        gameStates: {},
      };

      // 导出所有游戏状态
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(GameCore.LEVEL_STATE_KEY_PREFIX)) {
          data.gameStates[key] = localStorage.getItem(key);
        }
      }

      return JSON.stringify(data, null, 2);
    } catch (err) {
      console.error("导出进度失败：", err);
      return null;
    }
  }

  /**
   * 导入关卡进度数据
   */
  static importProgress(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      // 导入设置
      if (data.settings) {
        localStorage.setItem(this.SETTINGS_KEY, data.settings);
      }

      // 导入进度
      if (data.progress) {
        localStorage.setItem(this.LEVELS_PROGRESS_KEY, data.progress);
      }

      // 导入游戏状态
      if (data.gameStates) {
        Object.entries(data.gameStates).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }

      // 重新加载数据
      this.loadSettings();
      this.loadProgress();

      return true;
    } catch (err) {
      console.error("导入进度失败：", err);
      return false;
    }
  }

  /**
   * 清除所有存储数据
   */
  static clearAllData() {
    try {
      // 清除设置
      localStorage.removeItem(this.SETTINGS_KEY);

      // 清除进度
      localStorage.removeItem(this.LEVELS_PROGRESS_KEY);

      // 清除所有游戏状态
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(GameCore.LEVEL_STATE_KEY_PREFIX) ||
                    key.startsWith("mymatch_"))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log("已清除所有游戏数据");
      return true;
    } catch (err) {
      console.error("清除数据失败：", err);
      return false;
    }
  }
}
