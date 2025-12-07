// ==========================================
// UI模块 - User Interface Management
// 负责游戏界面的渲染、交互和视觉反馈
// ==========================================

import { GameCore } from './game-core.js';

/**
 * UI管理类
 */
export class UIManager {
  // DOM元素引用
  static gridContainer = null;
  static scoreDisplay = null;
  static levelDisplay = null;
  static messageArea = null;
  static versionDisplay = null;
  static targetPanel = null;
  static vfxContainer = null;

  /**
   * 初始化UI元素引用
   */
  static initElements() {
    this.gridContainer = document.getElementById("grid-container");
    this.scoreDisplay = document.getElementById("score");
    this.levelDisplay = document.getElementById("level");
    this.messageArea = document.getElementById("message-area");
    this.versionDisplay = document.getElementById("version-display");
    this.targetPanel = document.getElementById("target-panel");

    // 初始化VFX容器
    this.vfxContainer = document.createElement("div");
    this.vfxContainer.classList.add("vfx-container");
  }

  /**
   * 更新分数显示
   */
  static updateScore(score) {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = score;
    }
  }

  /**
   * 更新关卡显示
   */
  static updateLevel(level) {
    if (this.levelDisplay) {
      this.levelDisplay.textContent = level;
    }
  }

  /**
   * 更新版本显示
   */
  static updateVersion() {
    if (this.versionDisplay) {
      this.versionDisplay.textContent = GameCore.GAME_VERSION;
    }
  }

  /**
   * 显示消息
   */
  static showMessage(message, duration = 2000) {
    if (this.messageArea) {
      this.messageArea.textContent = message;
      this.messageArea.classList.remove("hidden");

      if (duration > 0) {
        setTimeout(() => {
          this.messageArea.classList.add("hidden");
        }, duration);
      }
    }
  }

  /**
   * 渲染游戏板
   */
  static renderBoard() {
    // 防御性检查：确保 gridContainer 存在
    if (!this.gridContainer) {
      console.error("renderBoard: gridContainer not found! DOM may not be loaded.");
      // 尝试重新获取
      const retryContainer = document.getElementById("grid-container");
      if (retryContainer) {
        console.log("renderBoard: Successfully retried getting gridContainer");
        retryContainer.innerHTML = "";
        retryContainer.appendChild(this.vfxContainer);
        this._renderBoardCells(retryContainer);
        // 重新应用选中状态
        if (GameCore.selectedCell) {
          const cell = GameCore.getCellElement(GameCore.selectedCell.r, GameCore.selectedCell.c);
          if (cell) {
            cell.classList.add("selected");
          }
        }
        return;
      }
      return;
    }

    // 防御性检查：确保 board 数组已正确初始化
    if (!GameCore.board || !Array.isArray(GameCore.board) || GameCore.board.length !== GameCore.GRID_SIZE) {
      console.error("Board not properly initialized, recreating...");
      GameCore.createBoard();
      if (!GameCore.board || !Array.isArray(GameCore.board) || GameCore.board.length !== GameCore.GRID_SIZE) {
        console.error("Failed to create board, aborting render");
        return;
      }
    }

    this.gridContainer.innerHTML = "";
    this.gridContainer.appendChild(this.vfxContainer);

    this._renderBoardCells(this.gridContainer);

    // 设置单元格点击事件监听器
    this.setupCellClickListeners();

    // 重新应用选中状态（如果存在）
    if (GameCore.selectedCell) {
      const cell = GameCore.getCellElement(GameCore.selectedCell.r, GameCore.selectedCell.c);
      if (cell) {
        cell.classList.add("selected");
      }
    }
  }

  /**
   * 渲染游戏板单元格（私有方法）
   */
  static _renderBoardCells(container) {
    if (!container) {
      console.error("_renderBoardCells: container is null");
      return;
    }

    for (let r = 0; r < GameCore.GRID_SIZE; r++) {
      // 确保每一行都存在
      if (!GameCore.board[r] || !Array.isArray(GameCore.board[r])) {
        console.error(`Board row ${r} not properly initialized, recreating board...`);
        GameCore.createBoard();
      }

      for (let c = 0; c < GameCore.GRID_SIZE; c++) {
        const tile = GameCore.board[r] && GameCore.board[r][c] ? GameCore.board[r][c] : null;

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

          // 添加点击事件监听器（将在main.js中设置）
        } else {
          // Placeholder for empty space
          cell.classList.add("cell-placeholder");
        }

        container.appendChild(cell);
      }
    }
  }

  /**
   * 处理单元格点击事件
   */
  static handleCellClick(e) {
    // 这里需要导入游戏逻辑模块来处理点击
    // 暂时保留占位符
    const r = parseInt(e.target.dataset.row);
    const c = parseInt(e.target.dataset.col);
    console.log(`Cell clicked: (${r}, ${c})`);
    // 实际的点击处理逻辑将在main.js中实现
  }

  /**
   * 选择单元格
   */
  static selectCell(r, c) {
    // 取消之前的选择
    this.deselectCell();

    GameCore.selectedCell = { r, c };
    const cell = GameCore.getCellElement(r, c);
    if (cell) {
      cell.classList.add("selected");
    }
  }

  /**
   * 取消选择单元格
   */
  static deselectCell() {
    if (GameCore.selectedCell) {
      const cell = GameCore.getCellElement(GameCore.selectedCell.r, GameCore.selectedCell.c);
      if (cell) {
        cell.classList.remove("selected");
      }
      GameCore.selectedCell = null;
    }
  }

  /**
   * 更新目标UI
   */
  static updateTargetUI() {
    if (!this.targetPanel) return;

    this.targetPanel.innerHTML = "";

    const targets = GameCore.levelTargets;
    if (Object.keys(targets).length === 0) {
      this.targetPanel.innerHTML = "<p>无目标要求</p>";
      return;
    }

    for (const [color, count] of Object.entries(targets)) {
      const targetDiv = document.createElement("div");
      targetDiv.classList.add("target-item");

      const currentCount = this._countTilesOnBoard(color);
      const isCompleted = currentCount >= count;

      targetDiv.innerHTML = `
        <div class="target-color color-${color}"></div>
        <span class="target-text ${isCompleted ? 'completed' : ''}">
          ${currentCount}/${count}
        </span>
      `;

      this.targetPanel.appendChild(targetDiv);
    }
  }

  /**
   * 统计棋盘上指定颜色的方块数量
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

  /**
   * 设置单元格点击事件监听器
   */
  static setupCellClickListeners() {
    if (!this.gridContainer) return;

    const cells = this.gridContainer.querySelectorAll('.cell');
    cells.forEach(cell => {
      // 移除现有的监听器（如果有）
      cell.removeEventListener('click', this.handleCellClick);

      // 添加新的监听器
      cell.addEventListener('click', (e) => {
        // 这里将调用全局的游戏控制器
        if (window.gameController && window.gameController.handleCellClick) {
          window.gameController.handleCellClick(e);
        }
      });
    });
  }

  /**
   * 关卡进入动画
   */
  static animateLevelEntrance() {
    const cells = this.gridContainer.querySelectorAll(".cell, .cell-placeholder");
    if (!cells || cells.length === 0) return;

    // 清除之前的动画类
    cells.forEach((cell) => {
      cell.classList.remove("cell-entering");
    });

    // 为每个单元格添加延迟动画
    cells.forEach((cell) => {
      const r = parseInt(cell.dataset.row) || 0;
      const c = parseInt(cell.dataset.col) || 0;

      // 计算延迟：基于位置，从中心向外扩散
      const centerR = GameCore.GRID_SIZE / 2;
      const centerC = GameCore.GRID_SIZE / 2;
      const distance = Math.sqrt(
        Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2)
      );
      const maxDistance = Math.sqrt(
        Math.pow(GameCore.GRID_SIZE / 2, 2) + Math.pow(GameCore.GRID_SIZE / 2, 2)
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
}
