# 🎵 自定义音乐使用指南

## 📁 文件夹结构

将你的自定义音乐文件放在 `music/` 文件夹下：

```
my-matchgame-main/
├── music/
│   ├── themes/              # 默认主题音乐（由AI生成）
│   │   ├── plain.mp3
│   │   ├── forest.mp3
│   │   ├── cave.mp3
│   │   └── ... (其他主题)
│   │
│   └── custom/              # 你的自定义音乐
│       ├── level1-special.mp3
│       ├── boss-fight.mp3
│       ├── relaxing-puzzle.wav
│       └── ... (任意命名)
│
├── index.html
├── src/
└── ...
```

## 🎮 在关卡编辑器中使用

### 步骤 1：准备音乐文件

1. **支持的格式**：MP3, WAV, OGG, M4A, WebM
2. **推荐格式**：MP3 (192 kbps) - 最佳兼容性
3. **文件大小**：建议 < 5MB（过大会影响加载速度）
4. **循环**：确保音乐可以无缝循环播放

### 步骤 2：将文件放入项目

将你的音乐文件复制到 `music/custom/` 文件夹（如果不存在则创建）

### 步骤 3：在编辑器中配置

1. 打开游戏，进入"关卡选择"
2. 点击"关卡编辑器"按钮
3. 选择你想编辑的关卡
4. 找到"自定义音乐 (customMusicPath)"字段
5. 输入相对路径，例如：
   ```
   music/custom/level1-special.mp3
   ```
6. 点击"💾 保存"按钮
7. 点击"👁️ 预览"测试音乐效果

### 步骤 4：导出并持久化

1. 点击"📤 导出"按钮下载 `levels-export.json`
2. 将下载的文件重命名为 `levels.json`
3. 替换项目中的 `src/js/levels.json` 文件

## 🎯 工作原理

### 自定义优先级机制

```
优先级 1: customMusicPath 存在 → 使用指定的自定义音乐
优先级 2: customMusicPath 为空 → 使用主题默认音乐（theme）
优先级 3: 主题未知 → 回退到 "plain" 默认音乐
```

### 示例配置

**关卡数据示例**：

```json
{
  "id": 5,
  "name": "Boss 关卡",
  "theme": "core",
  "customMusicPath": "music/custom/boss-fight.mp3",
  "moves": 30,
  "targets": [{ "type": "score", "count": 15000 }]
}
```

**效果**：

- 如果 `music/custom/boss-fight.mp3` 存在 → 播放自定义音乐
- 如果文件不存在或路径错误 → 自动回退到 `core` 主题的默认音乐
- 如果 `customMusicPath` 字段为空 → 直接使用 `core` 主题音乐

## ⚠️ 注意事项

### 路径格式

✅ **正确**：

```
music/custom/my-song.mp3
music/themes/forest.mp3
music/boss/final-battle.ogg
```

❌ **错误**：

```
/music/custom/my-song.mp3     (不要以 / 开头)
C:\music\my-song.mp3          (不要使用绝对路径)
../music/my-song.mp3          (不要使用相对路径 ../)
https://example.com/song.mp3  (目前不支持外部URL)
```

### 文件命名建议

- ✅ 使用英文和数字：`level-1-music.mp3`
- ✅ 使用连字符或下划线：`boss_fight.mp3`
- ❌ 避免中文：`关卡音乐.mp3` (可能导致兼容性问题)
- ❌ 避免空格：`level 1 music.mp3` (用 `-` 代替)

### 浏览器兼容性

| 格式 | Chrome | Firefox | Safari | Edge |
| ---- | ------ | ------- | ------ | ---- |
| MP3  | ✅     | ✅      | ✅     | ✅   |
| WAV  | ✅     | ✅      | ✅     | ✅   |
| OGG  | ✅     | ✅      | ⚠️     | ✅   |
| M4A  | ✅     | ⚠️      | ✅     | ✅   |

**推荐**：使用 MP3 格式以确保最佳兼容性

## 🎨 最佳实践

### 1. 音乐循环

确保音乐可以无缝循环，避免结尾和开头之间的停顿：

- 使用音频编辑软件（如 Audacity）调整
- 确保 BPM 一致
- 淡入淡出处理

### 2. 音量平衡

- 标准化音量（使用 Loudness Normalization）
- 推荐目标：-14 LUFS
- 避免音量突然变化

### 3. 文件大小优化

```bash
# 使用 FFmpeg 压缩 MP3（推荐）
ffmpeg -i input.mp3 -b:a 192k output.mp3

# 转换 WAV 到 MP3
ffmpeg -i input.wav -b:a 192k output.mp3

# 创建循环音频（重复2次）
ffmpeg -stream_loop 1 -i input.mp3 -c copy output-loop.mp3
```

### 4. 测试清单

- [ ] 文件路径正确
- [ ] 文件可以在浏览器中播放
- [ ] 音乐可以无缝循环
- [ ] 音量适中（不会太大或太小）
- [ ] 在多个浏览器中测试
- [ ] 使用"预览"功能测试效果

## 🔧 故障排除

### 问题：音乐不播放

**可能原因**：

1. 文件路径错误
2. 文件不存在
3. 浏览器自动播放策略限制
4. 文件格式不支持

**解决方法**：

1. 检查控制台（F12）的错误信息
2. 确认路径使用正斜杠 `/` 而非反斜杠 `\`
3. 尝试点击页面任意位置解锁自动播放
4. 转换为 MP3 格式

### 问题：音乐切换不流畅

**解决方法**：

- AudioManager 已内置淡入淡出效果（0.5 秒淡出 + 0.8 秒淡入）
- 如果仍有问题，检查文件是否过大

### 问题：音乐循环有停顿

**解决方法**：

- 使用音频编辑软件处理音频首尾
- 确保音频开头和结尾无静音段
- 使用循环点标记（Loop Points）

## 📚 相关文档

- [MUSIC_DESIGN_GUIDE.md](./MUSIC_DESIGN_GUIDE.md) - AI 音乐生成指南
- [MUSIC_PROMPTS_QUICK_REFERENCE.md](./MUSIC_PROMPTS_QUICK_REFERENCE.md) - 快速提示词参考
- [AUDIO_INTEGRATION_EXAMPLES.js](./AUDIO_INTEGRATION_EXAMPLES.js) - 代码集成示例
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - 功能实现总结

## 💡 示例场景

### 场景 1：为特殊关卡添加独特音乐

```json
{
  "id": 10,
  "name": "隐藏关卡",
  "theme": "mystic",
  "customMusicPath": "music/custom/secret-level.mp3"
}
```

### 场景 2：Boss 关卡使用高强度音乐

```json
{
  "id": 25,
  "name": "最终Boss",
  "theme": "core",
  "customMusicPath": "music/custom/final-boss-epic.mp3"
}
```

### 场景 3：轻松关卡使用舒缓音乐

```json
{
  "id": 3,
  "name": "休闲模式",
  "theme": "plain",
  "customMusicPath": "music/custom/chill-vibes.mp3"
}
```

---

**提示**：如果不设置 `customMusicPath`，游戏会自动使用主题 (`theme`) 对应的默认音乐，非常方便！
