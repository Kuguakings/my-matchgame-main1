// ==========================================
// 游戏核心模块 - Core Game Logic
// 版本：v12.5.23.15 (2025年12月5日 23:15 修改)
// ==========================================

/**
 * 游戏核心常量和状态管理
 */
export class GameCore {
  // 游戏版本
  static GAME_VERSION = "12.5.23.15";

  // 游戏板配置
  static GRID_SIZE = 9;
  static COLORS = [
    "red",
    "blue",
    "green",
    "purple",
    "white",
    "orange",
    "yellow",
  ];

  // 游戏状态
  static board = [];
  static score = 0;
  static level = 1;
  static targetScore = 1000;
  static selectedCell = null; // Store {r, c} of selected cell
  static isProcessing = false; // Lock interaction during animations/gravity
  static nextTileId = 0; // Unique ID for animations

  // 关卡目标数据
  static levelTargets = {}; // { color: count }

  // 存储相关常量
  static LEVEL_STATE_KEY_PREFIX = "mymatch_level_state_v1_";

  // 默认颜色权重配置（用于没有设置权重的关卡）
  static DEFAULT_COLOR_WEIGHTS = {
    red: 16,
    blue: 16,
    green: 16,
    purple: 16,
    white: 16,
    orange: 10,
    yellow: 10,
  };

  // 当前关卡的颜色权重配置
  static currentLevelWeights = { ...GameCore.DEFAULT_COLOR_WEIGHTS };

  // 加载状态管理
  static loadingProgress = 0;
  static isLoadingComplete = false;

  /**
   * 重置游戏状态
   */
  static resetGameState() {
    this.board = [];
    this.score = 0;
    this.level = 1;
    this.targetScore = 1000;
    this.selectedCell = null;
    this.isProcessing = false;
    this.nextTileId = 0;
    this.levelTargets = {};
    this.currentLevelWeights = { ...this.DEFAULT_COLOR_WEIGHTS };
    this.loadingProgress = 0;
    this.isLoadingComplete = false;
  }

  /**
   * 创建新的游戏板
   */
  static createBoard(initialLayout = null) {
    this.board = [];
    for (let r = 0; r < this.GRID_SIZE; r++) {
      this.board[r] = [];
      for (let c = 0; c < this.GRID_SIZE; c++) {
        if (initialLayout && initialLayout[r] && initialLayout[r][c]) {
          // 使用提供的初始布局
          this.board[r][c] = { ...initialLayout[r][c] };
        } else {
          // 生成随机方块
          const color = this.getWeightedRandomColor();
          this.board[r][c] = {
            color: color,
            id: this.nextTileId++,
            state: "normal",
          };
        }
      }
    }

    // 确保初始布局没有立即可以消除的匹配
    if (!initialLayout) {
      this.ensureNoInitialMatches();
    }
  }

  /**
   * 确保初始布局没有立即可以消除的匹配
   */
  static ensureNoInitialMatches() {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      let hasMatches = false;

      // 检查所有可能的匹配
      for (let r = 0; r < this.GRID_SIZE; r++) {
        for (let c = 0; c < this.GRID_SIZE; c++) {
          if (this.checkMatchAt(r, c)) {
            hasMatches = true;
            // 重新生成这个位置的方块
            this.board[r][c] = {
              color: this.getWeightedRandomColor(),
              id: this.nextTileId++,
              state: "normal",
            };
          }
        }
      }

      if (!hasMatches) {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn("无法生成无初始匹配的布局");
    }
  }

  /**
   * 检查指定位置是否有匹配
   */
  static checkMatchAt(r, c) {
    const tile = this.board[r]?.[c];
    if (!tile) return false;

    // 检查水平匹配（向右）
    let horizontalCount = 1;
    for (let i = c + 1; i < this.GRID_SIZE; i++) {
      if (this.board[r][i]?.color === tile.color) {
        horizontalCount++;
      } else {
        break;
      }
    }

    // 检查垂直匹配（向下）
    let verticalCount = 1;
    for (let i = r + 1; i < this.GRID_SIZE; i++) {
      if (this.board[i]?.[c]?.color === tile.color) {
        verticalCount++;
      } else {
        break;
      }
    }

    return horizontalCount >= 3 || verticalCount >= 3;
  }

  /**
   * 获取单元格元素
   */
  static getCellElement(r, c) {
    return document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  }

  /**
   * 检查坐标是否在游戏板范围内
   */
  static isValidPosition(r, c) {
    return r >= 0 && r < this.GRID_SIZE && c >= 0 && c < this.GRID_SIZE;
  }

  /**
   * 获取加权随机颜色
   */
  static getWeightedRandomColor() {
    const weights = this.currentLevelWeights;
    const totalWeight = Object.values(weights).reduce(
      (sum, weight) => sum + weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const color of this.COLORS) {
      random -= weights[color];
      if (random <= 0) {
        return color;
      }
    }

    return this.COLORS[0]; // fallback
  }

  /**
   * 应用冻结状态到方块
   */
  static applyFreeze(tile) {
    if (!tile) return;
    tile.state = "frozen";
    tile.freezeId = this.nextTileId++;
  }
}
