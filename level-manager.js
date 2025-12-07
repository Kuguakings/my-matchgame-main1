// ==========================================
// 关卡管理模块 - Level Management System
// 负责关卡的加载、配置和进度管理
// ==========================================

import { GameCore } from './game-core.js';
import { UIManager } from './ui.js';
import { VFXManager } from './vfx.js';

/**
 * 关卡管理类
 */
export class LevelManager {
  static currentLevelData = null;
  static levelsData = null;

  /**
   * 加载关卡数据
   */
  static async loadLevels() {
    try {
      // 尝试从外部API加载
      if (typeof loadLevels === "function") {
        await loadLevels();
      } else {
        // 直接加载本地levels.json文件
        console.log("加载本地关卡数据...");
        const response = await fetch('./levels.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        window.LEVELS = await response.json();
        console.log("本地关卡数据加载成功");
      }

      // 确保window.LEVELS存在且是数组
      if (!Array.isArray(window.LEVELS)) {
        window.LEVELS = [];
      }

      this.levelsData = window.LEVELS;
      console.log("关卡加载成功，关卡数量：", window.LEVELS.length);

      // 触发关卡加载完成事件
      document.dispatchEvent(new CustomEvent("levelsLoaded"));

    } catch (err) {
      console.error("关卡数据加载失败:", err);
      // 使用空数组作为回退
      window.LEVELS = [];
      this.levelsData = [];
      // 仍然触发事件，让游戏继续运行
      document.dispatchEvent(new CustomEvent("levelsLoaded"));
    }
  }

  /**
   * 根据ID获取关卡定义
   */
  static getLevelById(id) {
    if (!this.levelsData) return null;

    const numId = Number(id);
    return this.levelsData.find(level => level.id === numId) || null;
  }

  /**
   * 开始关卡
   */
  static async startLevel(id) {
    try {
      // 重置当前关卡权重为默认值
      GameCore.currentLevelWeights = { ...GameCore.DEFAULT_COLOR_WEIGHTS };

      // 标准化ID
      const want = Number(id) || 1;
      const lvlDef = this.getLevelById(want);

      // 检查是否有保存的游戏状态
      const savedState = await this.loadGameState(want);
      console.log("检查关卡状态:", want, savedState ? "有保存状态" : "无保存状态");

      if (savedState) {
        console.log("发现保存状态:", savedState);
        // 询问用户是否继续游戏
        const shouldContinue = confirm(
          `检测到关卡 ${want} 的未完成游戏进度，是否继续？\n\n分数: ${savedState.score}/${savedState.targetScore}`
        );

        if (shouldContinue) {
          console.log("用户选择继续游戏，开始恢复状态...");
          // 恢复游戏状态
          await this.restoreGameState(savedState);
          return;
        } else {
          console.log("用户选择不继续，清除保存状态...");
          // 用户选择不继续，清除保存的状态
          await this.clearGameState(want);
        }
      }

      // 重置游戏状态
      this.resetLevelState(want);

      // 如果关卡有自定义权重设置，则使用它
      if (lvlDef && lvlDef.specialRules && lvlDef.specialRules.colorWeights) {
        GameCore.currentLevelWeights = {
          ...GameCore.currentLevelWeights,
          ...lvlDef.specialRules.colorWeights,
        };
      }

      // 配置关卡目标
      this.configureLevelTargets(lvlDef, want);

      // 更新UI
      this.updateLevelUI();

      // 应用关卡主题
      const theme = lvlDef?.theme || "plain";
      this.applyLevelTheme(theme);

      // 播放背景音乐
      this.playLevelBGM(theme);

      // 渲染游戏板
      this.initializeGameBoard(lvlDef);

    } catch (error) {
      console.error("开始关卡时出错:", error);
      UIManager.showMessage("加载关卡失败，请重试", 3000);
    }
  }

  /**
   * 重置关卡状态
   */
  static resetLevelState(levelId) {
    GameCore.level = levelId;
    GameCore.score = 0;
    GameCore.selectedCell = null;
    GameCore.isProcessing = false;
    GameCore.levelTargets = {};
  }

  /**
   * 配置关卡目标
   */
  static configureLevelTargets(lvlDef, levelId) {
    if (lvlDef) {
      // 使用关卡定义的目标
      GameCore.targetScore = lvlDef.targetScore || 1000;

      // 解析目标（支持新旧格式）
      if (Array.isArray(lvlDef.targets) && lvlDef.targets.length) {
        for (const t of lvlDef.targets) {
          if (t.type === "score") {
            // 已经在上面处理
          } else if (t.type === "collect" && t.color) {
            GameCore.levelTargets[t.color] = t.count || 0;
          } else if (t.type === "clearType" && t.typeName) {
            GameCore.levelTargets[`__type__:${t.typeName}`] = t.count || 0;
          } else if (t.type === "destroy" && t.typeName) {
            GameCore.levelTargets[`__type__:${t.typeName}`] = t.count || 0;
          }
        }
      }

      // 如果没有定义目标，使用默认目标
      if (Object.keys(GameCore.levelTargets).length === 0) {
        this.generateDefaultTargets(levelId);
      }
    } else {
      // 后备逻辑
      GameCore.targetScore = 1000 + (levelId - 1) * 500;
      this.generateDefaultTargets(levelId);
    }
  }

  /**
   * 生成默认关卡目标
   */
  static generateDefaultTargets(levelId) {
    const baseCount = 5 + levelId * 2;

    if (levelId === 1) {
      GameCore.levelTargets["red"] = baseCount;
    } else if (levelId === 2) {
      GameCore.levelTargets["blue"] = baseCount;
      GameCore.levelTargets["green"] = baseCount;
    } else {
      const numColors = Math.min(3, 1 + Math.floor(levelId / 2));
      const shuffledColors = [...GameCore.COLORS].sort(() => 0.5 - Math.random());
      for (let i = 0; i < numColors; i++) {
        GameCore.levelTargets[shuffledColors[i]] = baseCount;
      }
    }
  }

  /**
   * 更新关卡UI
   */
  static updateLevelUI() {
    UIManager.updateLevel(GameCore.level);
    UIManager.updateScore(GameCore.score);

    // 更新消息区域
    this.updateLevelMessage();

    // 更新目标UI
    UIManager.updateTargetUI();
  }

  /**
   * 更新关卡消息
   */
  static updateLevelMessage() {
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
    for (const [k, v] of Object.entries(GameCore.levelTargets)) {
      if (k.startsWith("__type__:")) {
        parts.push(`清除 ${v} 个 ${k.replace("__type__:", "")}`);
      } else {
        parts.push(`消除 ${v} 个${colorNames[k] || k}方块`);
      }
    }

    if (GameCore.targetScore) {
      parts.push(`达到 ${GameCore.targetScore} 分`);
    }

    UIManager.showMessage(parts.join("，"));
  }

  /**
   * 应用关卡主题
   */
  static applyLevelTheme(theme) {
    // 移除所有主题类
    document.body.className = document.body.className.replace(/\btheme-\w+/g, '').trim();

    // 添加新主题类
    if (theme && theme !== "plain") {
      document.body.classList.add(`theme-${theme}`);
    }
  }

  /**
   * 播放关卡背景音乐
   */
  static playLevelBGM(theme) {
    try {
      if (typeof audio !== "undefined" && audio.playThemeBGM) {
        audio.playThemeBGM(theme);
      }
    } catch (e) {
      console.warn("背景音乐播放错误:", e);
    }
  }

  /**
   * 初始化游戏板
   */
  static initializeGameBoard(lvlDef) {
    // 隐藏菜单
    this.hideMenu();

    // 创建游戏板
    GameCore.createBoard(lvlDef?.initialBoard);

    // 渲染游戏板
    UIManager.renderBoard();

    // 添加进入动画
    UIManager.animateLevelEntrance();

    // 确保游戏容器可见
    setTimeout(() => {
      this.hideMenu();
      const gameContainer = document.getElementById("game-container");
      if (gameContainer) {
        gameContainer.classList.remove("hidden");
        gameContainer.style.opacity = "1";
      }
    }, 100);
  }

  /**
   * 检查关卡是否完成
   */
  static checkLevelCompletion() {
    // 检查分数目标
    if (GameCore.score < GameCore.targetScore) {
      return false;
    }

    // 检查收集目标
    for (const [targetType, requiredCount] of Object.entries(GameCore.levelTargets)) {
      if (targetType.startsWith("__type__:")) {
        // 类型清除目标（暂时跳过，复杂逻辑）
        continue;
      } else {
        // 颜色收集目标
        const currentCount = this._countTilesOnBoard(targetType);
        if (currentCount < requiredCount) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 完成关卡
   */
  static async completeLevel() {
    UIManager.showMessage("关卡完成！", 3000);

    // 解锁下一关
    const nextLevelId = GameCore.level + 1;
    await this.unlockLevel(nextLevelId);

    // 保存进度
    await this.saveProgress();

    // 显示胜利动画或其他效果
    setTimeout(() => {
      // 返回主菜单或自动进入下一关
      const autoJump = localStorage.getItem("autoJumpEnabled") === "true";
      if (autoJump && this.getLevelById(nextLevelId)) {
        this.startLevel(nextLevelId);
      } else {
        this.showMainMenu();
      }
    }, 2000);
  }

  /**
   * 隐藏菜单
   */
  static hideMenu() {
    // 隐藏主菜单
    const menu = document.getElementById("main-menu-screen");
    if (menu) menu.classList.add("hidden");

    // 隐藏菜单覆盖层
    const overlay = document.getElementById("menu-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.display = "none";
      }, 300);
    }

    // 显示游戏容器
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.classList.remove("hidden");
      gameContainer.style.opacity = "1";
    }
  }

  /**
   * 显示主菜单
   */
  static showMainMenu() {
    // 隐藏加载屏幕
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
    }

    // 隐藏游戏容器
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.classList.add("hidden");
      gameContainer.style.opacity = "0";
    }

    // 显示主菜单
    const mainMenu = document.getElementById("main-menu-screen");
    if (mainMenu) mainMenu.classList.remove("hidden");

    const overlay = document.getElementById("menu-overlay");
    if (overlay) {
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");
      overlay.style.display = "block";
      overlay.style.opacity = "1";
    }
  }

  /**
   * 存储相关方法代理
   */
  static async loadGameState(levelId) {
    return StorageManager.loadGameState(levelId);
  }

  static async saveGameState() {
    StorageManager.saveGameState();
  }

  static async clearGameState(levelId) {
    StorageManager.clearGameState(levelId);
  }

  static async restoreGameState(state) {
    StorageManager.restoreGameState(state);
  }

  static async unlockLevel(levelId) {
    return StorageManager.unlockLevel(levelId);
  }

  static async saveProgress() {
    StorageManager.saveProgress();
  }

  static async completeLevel() {
    const finalScore = GameCore.score;
    StorageManager.completeLevel(GameCore.level, finalScore);

    // 检查是否解锁下一关
    const nextLevelId = GameCore.level + 1;
    this.unlockLevel(nextLevelId);
  }

  /**
   * 统计棋盘上指定颜色的方块数量（私有方法）
   */
  static _countTilesOnBoard(color) {
    let count = 0;
    for (let r = 0; r < GameCore.GRID_SIZE; r++) {
      for (let c = 0; c < GameCore.GRID_SIZE; c++) {
        const tile = GameCore.board[r][c];
        if (tile && tile.color === color) {
          count++;
        }
      }
    }
    return count;
  }
}
