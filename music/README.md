# 🎵 Music 文件夹

## 📁 文件夹说明

### `themes/` - 默认主题音乐

存放由 AI 生成的默认主题背景音乐。每个主题对应一个音乐文件。

**预期文件列表**：

- `plain.mp3` - 普通主题
- `forest.mp3` - 森林主题
- `cave.mp3` - 洞穴主题
- `storm.mp3` - 风暴主题
- `lab.mp3` - 实验室主题
- `ice.mp3` - 冰霜主题
- `core.mp3` - 核心主题
- `voltage.mp3` - 电压主题
- `mystic.mp3` - 神秘主题
- `ruins.mp3` - 废墟主题
- `reactor.mp3` - 反应堆主题
- `void.mp3` - 虚空主题
- `main-menu.mp3` - 主菜单音乐
- `idle.mp3` - 待机音乐

**如何生成**：
请参考 [`docs/MUSIC_DESIGN_GUIDE.md`](../docs/MUSIC_DESIGN_GUIDE.md) 使用 AI 音乐生成工具（如 Suno 或 Udio）生成这些音乐。

### `custom/` - 自定义音乐

存放你自己的自定义音乐文件。

**示例文件**：

- `level1-special.mp3` - 第 1 关特殊音乐
- `boss-fight.mp3` - Boss 战音乐
- `puzzle-ambient.wav` - 解谜氛围音乐
- `victory-theme.ogg` - 胜利主题

**如何使用**：
请参考 [`docs/CUSTOM_MUSIC_GUIDE.md`](../docs/CUSTOM_MUSIC_GUIDE.md)

## 🎯 快速开始

### 1. 准备音乐文件

- 格式：MP3, WAV, OGG（推荐 MP3 192kbps）
- 长度：30-90 秒为佳
- 循环：确保首尾可以无缝衔接

### 2. 放置文件

- **默认音乐** → `music/themes/`
- **自定义音乐** → `music/custom/`

### 3. 在编辑器中配置

1. 打开游戏 → 关卡选择 → 关卡编辑器
2. 选择关卡
3. 在"自定义音乐 (customMusicPath)"字段输入路径
   ```
   music/custom/your-music.mp3
   ```
4. 保存并预览

## 📝 注意事项

1. **路径格式**：使用正斜杠 `/`，例如 `music/custom/song.mp3`
2. **文件命名**：建议使用英文、数字、连字符，避免中文和空格
3. **文件大小**：建议 < 5MB，过大会影响加载速度
4. **版权**：确保你有权使用这些音乐文件

## 🔗 相关文档

- [自定义音乐使用指南](../docs/CUSTOM_MUSIC_GUIDE.md)
- [AI 音乐生成指南](../docs/MUSIC_DESIGN_GUIDE.md)
- [音乐提示词快速参考](../docs/MUSIC_PROMPTS_QUICK_REFERENCE.md)

## 📦 文件清单模板

将此文件保存为 `music-checklist.txt`，帮助你追踪需要生成的音乐：

```
默认主题音乐 (themes/):
[ ] plain.mp3      - 普通
[ ] forest.mp3     - 森林
[ ] cave.mp3       - 洞穴
[ ] storm.mp3      - 风暴
[ ] lab.mp3        - 实验室
[ ] ice.mp3        - 冰霜
[ ] core.mp3       - 核心
[ ] voltage.mp3    - 电压
[ ] mystic.mp3     - 神秘
[ ] ruins.mp3      - 废墟
[ ] reactor.mp3    - 反应堆
[ ] void.mp3       - 虚空
[ ] main-menu.mp3  - 主菜单
[ ] idle.mp3       - 待机

自定义音乐 (custom/):
[ ] (你的文件名).mp3
[ ] (你的文件名).mp3
```

---

**开始创作你的游戏音乐吧！** 🎮🎵
