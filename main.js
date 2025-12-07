// ==========================================
// 主入口文件 - Main Entry Point
// 协调所有模块，处理游戏的主要逻辑和初始化
// ==========================================

import { GameCore } from './game-core.js';
import { UIManager } from './ui.js';
import { VFXManager } from './vfx.js';
import { LevelManager } from './level-manager.js';
import { StorageManager } from './storage.js';

/**
 * 游戏主控制器
 */
class GameController {
  constructor() {
    this.matchLogic = null; // 将在后续导入
    this.isInitialized = false;
  }

  /**
   * 初始化游戏
   */
  async init() {
    if (this.isInitialized) return;

    try {
      console.log("初始化游戏...");

      // 初始化UI元素
      UIManager.initElements();

      // 加载设置
      StorageManager.loadSettings();

      // 加载关卡数据
      await LevelManager.loadLevels();

      // 加载进度
      StorageManager.loadProgress();

      // 初始化事件监听器
      this.initEventListeners();

      // 开始加载流程
      this.startLoading();

      this.isInitialized = true;
      console.log("游戏初始化完成");

    } catch (error) {
      console.error("游戏初始化失败:", error);
    }
  }

  /**
   * 开始加载流程
   */
  startLoading() {
    // 显示加载进度
    this.updateLoadingProgress(50);

    // 等待关卡加载完成后再显示主菜单
    const checkLevelsLoaded = () => {
      if (Array.isArray(window.LEVELS) && window.LEVELS.length > 0) {
        this.updateLoadingProgress(100);
        setTimeout(() => {
          this.showMainMenu();
        }, 200);
      } else {
        // 如果还没加载完成，继续等待
        setTimeout(checkLevelsLoaded, 100);
      }
    };

    checkLevelsLoaded();
  }

  /**
   * 更新加载进度
   */
  updateLoadingProgress(progress) {
    GameCore.loadingProgress = progress;
    const progressBar = document.getElementById("loading-progress-bar");
    const progressText = document.getElementById("loading-progress-text");

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (progressText) {
      progressText.textContent = `${progress}%`;
    }
  }

  /**
   * 显示主菜单
   */
  showMainMenu() {
    LevelManager.showMainMenu();
  }

  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    // DOM内容加载完成事件
    document.addEventListener("DOMContentLoaded", () => {
      this.onDOMContentLoaded();
    });

    // 关卡加载完成事件
    document.addEventListener("levelsLoaded", () => {
      this.onLevelsLoaded();
    });

    // 窗口关闭前保存游戏状态
    window.addEventListener("beforeunload", () => {
      StorageManager.saveGameState();
    });
  }

  /**
   * DOM内容加载完成处理
   */
  onDOMContentLoaded() {
    // 设置菜单按钮事件
    this.setupMenuButtons();

    // 如果关卡已加载，渲染菜单
    if (Array.isArray(window.LEVELS) && window.LEVELS.length) {
      this.renderLevelMenu();
    }
  }

  /**
   * 关卡加载完成处理
   */
  onLevelsLoaded() {
    this.renderLevelMenu();
  }

  /**
   * 设置菜单按钮事件
   */
  setupMenuButtons() {
    // 打开菜单按钮
    const openBtn = document.getElementById("open-menu-btn");
    if (openBtn) {
      openBtn.addEventListener("click", () => this.showMenu());
    }

    // 关闭菜单按钮
    const closeBtn = document.getElementById("btn-close-menu");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.hideMenu();
        // 如果是从主菜单进入的，返回主菜单
        const mainMenuScreen = document.getElementById("main-menu-screen");
        if (mainMenuScreen && mainMenuScreen.classList.contains("hidden")) {
          this.showMainMenu();
        }
      });
    }

    // 关卡按钮
    const levelsBtn = document.getElementById("btn-levels");
    if (levelsBtn) {
      levelsBtn.addEventListener("click", () => {
        const panel = document.getElementById("level-panel");
        if (panel) panel.classList.remove("hidden");
        this.renderLevelMenu();
      });
    }

    // 返回主菜单按钮
    const backBtn = document.getElementById("btn-back-to-main");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        const panel = document.getElementById("level-panel");
        if (panel) panel.classList.add("hidden");
      });
    }

    // 开始游戏按钮
    const startBtn = document.getElementById("start-game-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        this.hideMenu();
        this.showMainMenu();
      });
    }

    // 选择关卡按钮
    const selectLevelBtn = document.getElementById("select-level-btn");
    if (selectLevelBtn) {
      selectLevelBtn.addEventListener("click", () => {
        const panel = document.getElementById("level-panel");
        if (panel) panel.classList.remove("hidden");
        this.renderLevelMenu();
      });
    }

    // 设置按钮
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        this.showSettings();
      });
    }

    // 退出按钮
    const quitBtn = document.getElementById("quit-btn");
    if (quitBtn) {
      quitBtn.addEventListener("click", () => {
        if (confirm("确定要退出游戏吗？")) {
          StorageManager.saveGameState();
          window.close();
        }
      });
    }
  }

  /**
   * 显示菜单
   */
  showMenu() {
    const overlay = document.getElementById("menu-overlay");
    const menu = document.getElementById("main-menu-screen");

    if (overlay) {
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");
      overlay.style.display = "block";
      setTimeout(() => {
        overlay.style.opacity = "1";
      }, 10);
    }

    if (menu) {
      menu.classList.remove("hidden");
    }
  }

  /**
   * 隐藏菜单
   */
  hideMenu() {
    const overlay = document.getElementById("menu-overlay");

    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.display = "none";
      }, 300);
    }
  }

  /**
   * 渲染关卡菜单
   */
  renderLevelMenu() {
    const levelPanel = document.getElementById("level-panel");
    if (!levelPanel) return;

    levelPanel.innerHTML = "<h3>选择关卡</h3>";

    if (!window.LEVELS || !Array.isArray(window.LEVELS)) {
      levelPanel.innerHTML += "<p>关卡数据加载中...</p>";
      return;
    }

    const levelGrid = document.createElement("div");
    levelGrid.classList.add("level-grid");

    window.LEVELS.forEach(level => {
      const levelCard = document.createElement("div");
      levelCard.classList.add("level-card");

      if (level.unlocked) {
        levelCard.classList.add("unlocked");
        levelCard.addEventListener("click", () => {
          LevelManager.startLevel(level.id);
        });
      } else {
        levelCard.classList.add("locked");
      }

      levelCard.innerHTML = `
        <div class="level-number">${level.id}</div>
        <div class="level-stars">${"★".repeat(level.starRating || 0)}</div>
        ${level.completed ? '<div class="level-completed">✓</div>' : ''}
      `;

      levelGrid.appendChild(levelCard);
    });

    levelPanel.appendChild(levelGrid);
  }

  /**
   * 显示设置菜单
   */
  showSettings() {
    // 这里可以实现设置菜单的显示逻辑
    alert("设置功能开发中...");
  }

  /**
   * 处理单元格点击（游戏逻辑）
   */
  async handleCellClick(event) {
    if (GameCore.isProcessing) return;

    const r = parseInt(event.target.dataset.row);
    const c = parseInt(event.target.dataset.col);

    if (isNaN(r) || isNaN(c)) return;

    // 如果还没有选择单元格，选择当前单元格
    if (GameCore.selectedCell === null) {
      const tile = GameCore.board[r]?.[c];
      if (tile) {
        UIManager.selectCell(r, c);
      }
      return;
    }

    // 如果点击的是已选择的单元格，取消选择
    if (GameCore.selectedCell.r === r && GameCore.selectedCell.c === c) {
      UIManager.deselectCell();
      return;
    }

    // 尝试交换方块
    const selectedR = GameCore.selectedCell.r;
    const selectedC = GameCore.selectedCell.c;

    if (Math.abs(selectedR - r) + Math.abs(selectedC - c) === 1) {
      // 相邻方块，执行交换
      await this.swapTiles(selectedR, selectedC, r, c);
    } else {
      // 非相邻方块，选择新方块
      UIManager.selectCell(r, c);
    }
  }

  /**
   * 交换方块
   */
  async swapTiles(r1, c1, r2, c2) {
    // 这里需要实现交换逻辑和匹配检测
    // 暂时显示占位符
    console.log(`Swapping tiles: (${r1},${c1}) <-> (${r2},${c2})`);

    UIManager.deselectCell();

    // TODO: 实现完整的交换和匹配逻辑
  }

  /**
   * 更新游戏分数
   */
  updateScore(newScore) {
    GameCore.score = newScore;
    UIManager.updateScore(newScore);

    // 检查关卡完成
    if (LevelManager.checkLevelCompletion()) {
      LevelManager.completeLevel();
    }
  }
}

// 创建全局游戏控制器实例
window.gameController = new GameController();

// 初始化游戏
window.gameController.init();

// 导出给其他模块使用
export { GameController };
