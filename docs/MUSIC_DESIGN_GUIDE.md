# 🎵 Match-3 游戏主题背景音乐设计指南

## AI 音乐生成提示词库 (Suno/Udio)

---

## 📋 主题音乐生成表格

| #   | 主题 (Key)             | 情感/氛围描述          | BPM | 推荐乐器                     | Suno/Udio AI 提示词 (英文)                                                                                                                                                                                                                                                                         |
| --- | ---------------------- | ---------------------- | --- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Plain** (普通)       | 轻松、中性、开放感     | 110 | 钢琴、弦乐、打击乐           | `A simple, cheerful casual background music loop for a match-3 puzzle game. Features light piano melodies with subtle string accompaniment and soft percussion. Upbeat tempo around 110 BPM, perfect for relaxed gameplay. Genre: Indie Pop. Mood: Friendly and inviting. --loop`                  |
| 2   | **Forest** (森林)      | 自然、生机勃勃、冒险感 | 100 | 木管乐器、民族乐器、自然音效 | `A vibrant forest-themed background music loop for puzzle gameplay. Combines wooden flutes, warm strings, and nature ambient sounds like chirping birds and rustling leaves. Moderate tempo 100 BPM with organic, earthy vibes. Genre: World Music/Ambient. Mood: Natural and adventurous. --loop` |
| 3   | **Cave** (洞穴)        | 神秘、压抑、深沉感     | 95  | 电贝司、合成器、低音鼓       | `A mysterious cave-themed atmospheric music loop for puzzle action. Dark, moody synths create an underground feel with deep bass lines and subtle electronic pulses. Slow-paced 95 BPM. Genre: Dark Ambient/Synthwave. Mood: Mysterious and tense. --loop`                                         |
| 4   | **Storm** (风暴)       | 激烈、紧张、动感       | 130 | 交响乐队、电吉他、电子鼓     | `An intense storm-themed action music loop for high-energy puzzle gameplay. Dynamic strings with powerful brass, electric guitar riffs, and driving percussion. Fast-paced 130 BPM with dramatic tension. Genre: Epic Action/Orchestral. Mood: Intense and dramatic. --loop`                       |
| 5   | **Lab** (实验室)       | 科技感、未来风、前卫感 | 115 | 合成器、电子琴、数字鼓       | `A high-tech laboratory-themed background music loop for futuristic puzzle gameplay. Bright synthesizers, digital beeps, and modern electronic beats create a sci-fi atmosphere. Energetic 115 BPM. Genre: Synthwave/Cyberpunk. Mood: Futuristic and cutting-edge. --loop`                         |
| 6   | **Ice** (冰霜)         | 冷酷、清晰、优雅感     | 105 | 钢琴、冷色合成器、铃声       | `A cool, crystalline ice-themed ambient music loop for puzzle gameplay. Delicate piano notes layered with icy synth textures and soft bell sounds creating a frozen landscape feel. Elegant 105 BPM. Genre: Ambient/Minimalism. Mood: Cold and elegant. --loop`                                    |
| 7   | **Core** (核心)        | 威压、震撼、终极感     | 120 | 低音管、合成器、重型鼓       | `A powerful core/epicenter-themed boss music loop for intense puzzle gameplay. Deep, resonant tones from low brass and synths combined with heavy drums create an ominous, world-shaking feel. Moderate-fast 120 BPM. Genre: Epic/Cinematic. Mood: Powerful and ominous. --loop`                   |
| 8   | **Voltage** (电压)     | 高能、快速、紧凑感     | 140 | 电吉他、电子鼓、合成贝司     | `A high-voltage electrifying background music loop for fast-paced puzzle action. Punchy electronic beats, driving synth bass, and energetic guitar riffs create electric excitement. Very fast 140 BPM. Genre: Electronic/Industrial. Mood: Energetic and thrilling. --loop`                       |
| 9   | **Mystic** (神秘)      | 奇异、魔幻、超越感     | 100 | 竖琴、古乐器、神秘合成器     | `A mystical, magical background music loop for enchanted puzzle gameplay. Ethereal harp glissandos, mysterious synths, and distant flute whispers create an otherworldly ambiance. Contemplative 100 BPM. Genre: Magical/Fantasy. Mood: Mystical and enchanting. --loop`                           |
| 10  | **Ruins** (废墟)       | 沧桑、古老、遗失感     | 95  | 古琴、鼓、环境音效           | `An ancient ruins-themed atmospheric music loop for exploration puzzle gameplay. Echoing percussion, old-world instruments like sitar and tribal drums, with environmental decay sounds. Slow 95 BPM. Genre: Ambient/World. Mood: Ancient and melancholic. --loop`                                 |
| 11  | **Reactor** (反应堆)   | 机械、繁忙、压力感     | 125 | 合成器、节奏吉他、工业鼓     | `An industrial reactor-themed pulsing background music loop for intensive puzzle action. Mechanical synth sounds, rhythmic industrial percussion, and building tension create a high-pressure atmosphere. Fast 125 BPM. Genre: Industrial/Cyberpunk. Mood: Mechanized and pressuring. --loop`      |
| 12  | **Void** (虚空)        | 空旷、末日、虚无感     | 90  | 低频合成器、风声、脉冲音     | `A cosmic void-themed ambient background music loop for mind-bending puzzle gameplay. Sparse, deep pulsing synths with vast reverb, spacey textures, and subtle cosmic drones. Ultra-slow 90 BPM. Genre: Ambient/Drone. Mood: Vast and existential. --loop`                                        |
| 13  | **Main Menu** (主菜单) | 欢迎、热情、吸引感     | 105 | 钢琴、弦乐、柔和鼓           | `An inviting main menu theme loop for a match-3 puzzle game. Warm, welcoming piano melody with orchestral strings and soft percussion creates an inviting first impression. Smooth 105 BPM. Genre: Indie/Orchestral. Mood: Warm and inviting. --loop`                                              |
| 14  | **Idle** (待机)        | 轻松、无压力、舒适感   | 80  | 环境声、轻松乐器、自然音效   | `A relaxing idle/waiting screen background music loop. Very slow, ambient music with nature sounds, soft wind chimes, and peaceful ambient textures. Ultra-relaxed 80 BPM. Genre: Ambient/Chillout. Mood: Peaceful and comfortable. --loop`                                                        |

---

## 📌 提示词使用说明

### 1. **通用指南**

- 所有提示词都包含 `--loop` 标记，确保音乐适合**无缝循环播放**
- **BPM** 是推荐值，AI 生成时可在 ±10 范围内调整以获得最佳效果
- 建议生成 **30-60 秒的音乐段**，足够游戏循环多次

### 2. **导出格式**

- **推荐格式**：MP3 (最佳兼容性)
- **备选格式**：WAV (高保真)，OGG (较小文件)
- **建议比特率**：192 kbps MP3 或 128 kbps OGG

### 3. **文件组织结构**

```
music/
├── themes/
│   ├── plain.mp3
│   ├── forest.mp3
│   ├── cave.mp3
│   ├── storm.mp3
│   ├── lab.mp3
│   ├── ice.mp3
│   ├── core.mp3
│   ├── voltage.mp3
│   ├── mystic.mp3
│   ├── ruins.mp3
│   ├── reactor.mp3
│   ├── void.mp3
│   ├── main-menu.mp3
│   └── idle.mp3
└── sfx/
    ├── select.mp3
    ├── swap.mp3
    ├── match.mp3
    └── ...
```

### 4. **集成到 AudioManager**

在游戏启动时，关卡配置可以包含自定义音乐路径：

```javascript
// 示例关卡配置
{
  id: 5,
  name: "Lost Temple",
  theme: "ruins",
  customMusicPath: "music/themes/ruins.mp3",  // 可选
  moves: 30,
  targets: [{ type: "score", count: 5000 }]
}

// 播放关卡音乐（AudioManager 会自动选择最优源）
audioManager.playLevelMusic("ruins", level.customMusicPath);
```

### 5. **音质检查清单**

- ✅ 音乐在 30 秒后能无缝循环（无断裂或停顿）
- ✅ 音量平衡均匀（不应有突然的高峰或低谷）
- ✅ 音效与主菜单/游戏场景的音效音量兼容
- ✅ 没有过度压缩导致的音质损失

---

## 🎛️ 使用 Suno AI 的操作步骤

1. 访问 [Suno.ai](https://suno.ai) 或 [Udio.com](https://udio.com)
2. 选择"创建音乐"
3. **粘贴提示词**（从上表复制）
4. 调整参数：
   - **时长**：选择 30-60 秒
   - **风格标签**：根据表中的 Genre 选择对应分类
   - **启用循环模式**（如果可用）
5. 点击"生成"并等待 2-5 分钟
6. 试听并验证循环无缝
7. 下载为 MP3 格式

---

## 🔗 使用 Udio AI 的操作步骤

1. 访问 [Udio.com](https://udio.com)
2. 选择"新建"→"自定义创建"
3. 在"描述"字段粘贴提示词
4. 设置参数：
   - **风格**：根据 Genre 选择
   - **长度**：30-60 秒
   - **启用无缝循环**
5. 点击"生成"
6. 试听满意后点击"导出"
7. 选择 MP3 192kbps 下载

---

## 💡 优化建议

如果生成的音乐不满意，可以尝试以下调整：

| 问题         | 解决方案                                                           |
| ------------ | ------------------------------------------------------------------ |
| 音乐过于激烈 | 降低 BPM ±15，移除"energetic"、"intense"等词                       |
| 音乐过于沉闷 | 提升 BPM ±10，添加"uplifting"、"bright"等词                        |
| 循环不无缝   | 明确加入"--seamless loop"、"no fade out"指令                       |
| 乐器不够突出 | 在提示词中明确强调主要乐器，如"prominent piano"、"leading strings" |
| 文件过大     | 下载时选择更低比特率或更小的生成时长                               |

---

## 📥 集成提示

在 `game.js` 中使用：

```javascript
// 启动游戏时播放主菜单音乐
audioManager.playLevelMusic("main-menu");

// 进入关卡时切换音乐
async function startLevel(levelData) {
  await audioManager.playLevelMusic(levelData.theme, levelData.customMusicPath);
  // 开始游戏...
}

// 玩家暂停时暂停音乐
function pauseGame() {
  audioManager.pauseBgm();
}

// 恢复游戏
function resumeGame() {
  audioManager.resumeBgm();
}

// 关卡完成时切换到胜利音乐或下一关
function levelComplete() {
  audioManager.playLevelUp();
  setTimeout(() => {
    audioManager.playLevelMusic("idle"); // 或进入关卡选择
  }, 2000);
}
```

---

**生成日期**: 2025-12-10  
**设计者**: AI 音效导演  
**版本**: v1.0 - 初始设计
