const COLORS = ["红色", "蓝色", "绿色", "紫色", "白色", "橙色", "黄色"];

// 修改颜色权重配置
const COLOR_WEIGHTS = {
  "红色": 18,
  "蓝色": 18,
  "绿色": 18,
  "紫色": 18,
  "白色": 18,
  "橙色": 5,
  "黄色": 5
};

function getWeightedRandomColor() {
  const totalWeight = Object.values(COLOR_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let r = Math.random() * totalWeight;
  
  for (const [color, weight] of Object.entries(COLOR_WEIGHTS)) {
    if (r < weight) return color;
    r -= weight;
  }
  return COLORS[0];
}

// 确保上传函数正确调用
async function uploadLevels() {
  try {
    const response = await fetch('/api/levels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ levels: currentLevels }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('关卡上传成功');
    } else {
      console.error('关卡上传失败:', result.error);
    }
  } catch (error) {
    console.error('上传过程中发生错误:', error);
  }
}

function loadLevels() {
  return new Promise((resolve, reject) => {
    // 添加缓存控制，强制刷新
    fetch('/api/levels?_=' + Date.now(), { // 添加时间戳避免缓存
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.levels && data.levels.length > 0) {
        // 清除现有关卡数据，确保完全更新
        currentLevels = [...data.levels];
        // 强制重新渲染关卡列表
        renderLevelList();
        resolve();
      } else {
        reject(new Error('Failed to load levels'));
      }
    })
    .catch(error => {
      console.error('Error loading levels:', error);
      reject(error);
    });
  });
}

// 在DOM加载完成后添加强制刷新逻辑
document.addEventListener("DOMContentLoaded", () => {
  
  // 添加强制刷新按钮或自动刷新逻辑
  const refreshButton = document.createElement("button");
  refreshButton.textContent = "刷新关卡";
  refreshButton.style.cssText = "position: absolute; top: 10px; right: 10px; z-index: 100;";
  refreshButton.addEventListener("click", async () => {
    try {
      await loadLevels();
      console.log("关卡已刷新");
    } catch (error) {
      console.error("刷新失败:", error);
    }
  });
  document.body.appendChild(refreshButton);

  // 同时尝试在页面加载时强制刷新
  setTimeout(() => {
    loadLevels().catch(console.error);
  }, 1000);
});

function saveGameState() {
  const state = {
    level: level,
    board: board.map(row => row.map(tile => ({
      id: tile.id,
      color: tile.color,
      type: tile.type,
      state: tile.state,
      voltage: tile.voltage,
      durability: tile.durability
    }))),
    score: score,
    targetScore: targetScore,
    levelTargets: { ...levelTargets },
    timestamp: Date.now()
  };
  
  localStorage.setItem(`${LEVEL_STATE_KEY_PREFIX}${level}`, JSON.stringify(state));
}

function loadGameState() {
  const savedState = localStorage.getItem(`${LEVEL_STATE_KEY_PREFIX}${level}`);
  if (!savedState) return false;
  
  const state = JSON.parse(savedState);
  // 检查是否过期（24小时）
  if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
    localStorage.removeItem(`${LEVEL_STATE_KEY_PREFIX}${level}`);
    return false;
  }
  
  level = state.level;
  board = state.board.map(row => row.map(tile => ({
    ...tile,
    id: nextTileId++
  })));
  score = state.score;
  targetScore = state.targetScore;
  levelTargets = { ...state.levelTargets };
  
  updateTargetUI();
  updateUI();
  renderBoard();
  return true;
}

function initGame() {
  // 尝试加载游戏状态
  if (loadGameState()) {
    console.log("Loaded game state for level", level);
  } else {
    // 如果没有保存状态，初始化新游戏
    createBoard();
    updateTargetUI();
    updateUI();
    renderBoard();
  }
}
