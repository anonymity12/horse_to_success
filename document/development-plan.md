# 🐴 马到成功 — 游戏开发计划

> 版本: v2.0 规划
> 日期: 2026-02-06
> 技术栈: Phaser 3.80 + Vite 5 + Node.js (ws)
> AI 图片服务: Gemini 2.5 Flash (Image Generation)
> 多人联机: Node.js + ws 库部署在云服务器

---

## 一、现状分析

### 当前架构

- **画布**: 800×600 横屏，Arcade 物理引擎（未实际使用物理特性）
- **场景流**: BootScene → MenuScene → GameScene ↔ GameOverScene
- **实体**: 全部继承 `Phaser.GameObjects.Text`（Emoji 渲染）
  - `Horse` 🐴 64px，50×50 碰撞框，3 泳道切换
  - `Obstacle` 🦁🏺🗿🧱 48px，40×40 碰撞框，70% 概率生成
  - `Collectible` 🧧🪙 40px，30×30 碰撞框，30% 概率生成
- **无任何图片/音频资产**，无后端服务

### 已知问题

| # | 问题 | 位置 |
|---|------|------|
| 1 | `gameOver()` 方法存在但从未调用，游戏无死亡条件 | `GameScene.js` |
| 2 | `ScoreManager` 使用 localStorage key `'ma-dao-cheng-gong-highscore'`，而场景中使用 `'highScore'`，两套 key 冲突 | `ScoreManager.js` / `GameScene.js` / `MenuScene.js` |
| 3 | `AudioManager` 全部是 stub，未被任何场景实例化 | `AudioManager.js` |
| 4 | 仅支持键盘操作，无触屏/滑动支持 | `GameScene.js` |
| 5 | 遍历 group children 时删除元素可能导致跳帧 | `GameScene.js` update() |

---

## 二、开发阶段总览

| 阶段 | 内容 | 优先级 | 预估工时 |
|------|------|--------|----------|
| **P0** | 竖屏适配 + Bug 修复 | 🔴 最高 | 2-3 天 |
| **P1** | AI 美术资源生成脚本 | 🟠 高 | 3-4 天 |
| **P2** | 游戏细节打磨（碰撞反馈/音效/动画） | 🟡 中 | 3-4 天 |
| **P3** | 城市里程碑 + 关卡系统 | 🟡 中 | 3-4 天 |
| **P4** | 多人联机对战 | 🟢 常规 | 5-7 天 |

---

## 三、P0 — 竖屏适配 + Bug 修复

### 3.1 竖屏画布改造

**目标**: 将 800×600 横屏改为适合手机竖屏的比例 420×750。

| 改动项 | 当前值 | 目标值 | 文件 |
|--------|--------|--------|------|
| 画布尺寸 | 800×600 | 420×750 | `config.js` |
| Scale 模式 | 无 | `Phaser.Scale.FIT` + `autoCenter: CENTER_BOTH` | `config.js` |
| 泳道宽度 | 150px | 120px | `main.js` `window.gameConfig.laneWidth` |
| 马的初始位置 | (400, 450) | (210, 580) | `GameScene.js` |
| UI 布局 | 左上角/右上角 | 重新适配全部场景 | 所有 Scene |

**具体步骤**:

1. **修改 `config.js`** — 画布改为 `width: 420, height: 750`，添加 `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`。

2. **修改 `main.js`** — `window.gameConfig.laneWidth` 从 150 改为 120。

3. **适配 `GameScene.js`**:
   - `createLanes()`: 泳道起始 X 改为 `(420 - 120*3)/2 = 30`，泳道中心 `[90, 210, 330]`。
   - `createBackground()`: `fillRect` 尺寸改为 `420×750`，云朵 X 范围改为 `0-420`。
   - `createUI()`: 速度文字 X 重新定位，适配窄屏。
   - Horse 初始位置改为 `(210, 580)`（中间泳道，屏幕下方约 77%）。
   - 对象清理阈值从 `y > 650` 改为 `y > 800`。

4. **适配 `MenuScene.js`** — 灯笼位置的硬编码改为相对值。

5. **适配 `GameOverScene.js`** — 背景 `fillRect(0,0,800,600)` 改为动态尺寸。

6. **添加触摸控制** — 在 `GameScene.create()` 中增加滑动检测:
   - `pointerdown` 记录起始 X
   - `pointerup` 计算 deltaX，阈值 30px，左滑/右滑调用 `horse.moveLeft/moveRight`

7. **CSS 适配 `index.html`** — `#game-container` 添加 `max-width: 420px; margin: 0 auto;`，移动端 viewport 确保 `user-scalable=no`。

### 3.2 Bug 修复

1. **统一 localStorage key** — 将所有场景中的 `'highScore'` 改为统一使用 `ScoreManager`。

2. **实现死亡条件** — 在 `GameScene` 中添加 `this.health = 3`（生命值系统），`hitObstacle()` 中 `health--`，归零后调用 `gameOver()`。

3. **修复遍历删除问题** — 将 `this.obstacles.children.entries.forEach(...)` 改为 `.slice()` 副本遍历。

4. **添加碰撞无敌帧** — `Horse` 增加 `invincible` 属性，碰撞后闪烁 + 1 秒无敌。

---

## 四、P1 — AI 美术资源生成脚本

### 4.1 概述

新建 `scripts/` 目录，实现一个 Node.js CLI 工具，调用 **Gemini 2.5 Flash** 的图片生成能力，自动生产游戏所需的 spritesheet 资源。

### 4.2 目录结构

```
scripts/
  generate-assets.js       # 主脚本入口
  asset-manifest.json      # 资源配置清单
  lib/
    gemini-client.js       # Gemini API 封装
    image-processor.js     # 去背景 + 裁切
    spritesheet-builder.js # 拼接雪碧图
  .tmp/                    # 临时文件（gitignore）
    raw/                   # AI 原始输出
    nobg/                  # 去背景后
    trimmed/               # 裁切统一尺寸后
public/
  assets/
    sprites/               # 最终输出的 spritesheet
      horse.png
      horse.json
      obstacles.png
      collectibles.png
```

### 4.3 资源配置清单 `asset-manifest.json`

```json
{
  "frameSize": { "width": 128, "height": 128 },
  "objects": {
    "horse": {
      "frames": ["run1", "run2", "run3", "run4", "idle", "jump", "hit"],
      "prompt": "a cartoon Chinese horse character running, {frame_desc}, festive Chinese New Year style, red and gold colors"
    },
    "lion": {
      "frames": ["idle", "attack1", "attack2"],
      "prompt": "a Chinese stone lion guardian, {frame_desc}, ornate traditional style"
    },
    "redpack": {
      "frames": ["idle", "open1", "open2"],
      "prompt": "a Chinese red envelope hongbao, {frame_desc}, gold decorations"
    },
    "coin": {
      "frames": ["spin1", "spin2", "spin3", "spin4"],
      "prompt": "a Chinese gold coin yuanbao, {frame_desc}, shiny metallic"
    }
  },
  "globalSuffix": "on a pure solid black background (#000000), no gradient, no shadow, centered, pixel art style, clean edges"
}
```

### 4.4 实现步骤

1. **`gemini-client.js`** — 封装 Gemini 2.5 Flash 图片生成 API：
   - 使用 `@google/generative-ai` SDK
   - 输入: prompt 字符串 → 输出: PNG Buffer
   - 处理速率限制（RPM/RPD），失败自动重试 3 次，指数退避
   - 支持并发控制（信号量，最多 3 并发）

2. **`image-processor.js`** — 基于 `sharp` 库的图片处理：
   - `removeBlackBg(inputBuffer)`: 转 RGBA，遍历像素，`r<30 && g<30 && b<30` 的像素 alpha 置 0
   - `trimAndResize(inputBuffer, width, height)`: `sharp.trim()` 去透明边缘 → `resize()` 到目标帧尺寸，`fit: 'contain'`, 透明填充

3. **`spritesheet-builder.js`** — 雪碧图拼接：
   - 输入: 同一对象的所有帧 Buffer 数组 + 帧尺寸
   - 使用 `sharp.composite()` 横向拼接所有帧
   - 输出: 拼接后的 PNG + JSON 元数据 `{ frameWidth, frameHeight, frameCount, animations: {...} }`
   - PNG 压缩: `sharp.png({ compressionLevel: 9, palette: true })`

4. **`generate-assets.js`** 主流程：
   - 读取 `asset-manifest.json`
   - 对每个对象的每个帧: 拼装 prompt（替换 `{frame_desc}`，追加 `globalSuffix`） → 调用 Gemini → 保存 raw
   - 批量去背景 → 批量裁切 → 按对象拼接 spritesheet → 输出到 `public/assets/sprites/`

5. **`package.json`** 添加脚本和依赖:
   ```json
   "scripts": {
     "generate-assets": "node scripts/generate-assets.js"
   },
   "devDependencies": {
     "@google/generative-ai": "latest",
     "sharp": "latest"
   }
   ```

### 4.5 接入游戏

1. **`BootScene.preload()`** — 添加 spritesheet 加载:
   ```js
   this.load.spritesheet('horse', 'assets/sprites/horse.png', { frameWidth: 128, frameHeight: 128 })
   ```

2. **改造实体类** — `Horse`、`Obstacle`、`Collectible` 从继承 `Phaser.GameObjects.Text` 改为 `Phaser.GameObjects.Sprite`，在构造函数中使用 `this.anims.create()` 配置动画（idle/run/hit 等状态），`update()` 中根据状态播放对应动画。

3. **降级兼容** — 如果 spritesheet 加载失败，回退到 Emoji 文本渲染（保留当前逻辑作为 fallback）。

---

## 五、P2 — 游戏细节打磨

### 5.1 碰撞闪烁 + 无敌帧

**文件**: `GameScene.js` `hitObstacle()` + `Horse.js`

- 在 `Horse` 上添加 `invincible` 属性（默认 false）
- `hitObstacle()` 中:
  - 设置 `this.horse.invincible = true`
  - 播放 alpha 闪烁 tween: `alpha` 在 0.2↔1 之间，`duration: 80ms`，`yoyo: true`，`repeat: 8`（约 1.3 秒）
  - tween 完成后 `invincible = false`
- `update()` 中碰撞检测增加 `if (this.horse.invincible) return` 前置判断

### 5.2 怪兽预警音效

**文件**: `AudioManager.js` + `GameScene.js`

1. **接入 AudioManager** — 在 `GameScene.create()` 中 `this.audioManager = new AudioManager(this)`

2. **Web Audio 合成警告音** — 在 `AudioManager` 中添加 `playWarningBeep()` 方法:
   - 使用 `window.AudioContext` 创建一个 200ms 的低频方波音（频率 220Hz，增益渐弱）
   - 无需加载外部文件

3. **触发时机** — `spawnObjects()` 中，当生成 🦁 类型障碍物时:
   - 调用 `this.audioManager.playWarningBeep()`
   - 同时在障碍物上方显示 "⚠️" 文字提示，1 秒后淡出

4. **收集音效** — `collectItem()` 中播放一个高频短促的叮咚声（`playCollectSound()`，频率 880Hz，100ms）

5. **BGM** — 可选：用 Web Audio API 合成一段简单的循环旋律，或后续加载 mp3

### 5.3 红包金币汇集动画

**文件**: `GameScene.js` `collectItem()`

当拾取 🧧 或 🪙 时:

1. 在拾取位置创建 6-8 个小金币文本对象（🪙，fontSize 16px）
2. 每个金币随机偏移后，通过 tween 沿弧线飞向 UI 区域的分数/金币计数器位置
3. 飞行时长 400-600ms（随机错开），缓动 `Power2.easeIn`
4. 到达目标后销毁粒子，触发计数器文字的 scale 弹跳动画（1→1.4→1，200ms）
5. 如果已切换为 Sprite 渲染，则使用 Phaser 粒子发射器（`this.add.particles()`）实现更流畅的效果

### 5.4 触摸控制冲刺按钮

- 在屏幕底部中央添加半透明 "⚡加速" 按钮
- 按下后消耗 10 金币，触发 3 秒 1.5× 速度加成
- 冷却时间 10 秒，冷却中按钮置灰

---

## 六、P3 — 城市里程碑 + 关卡系统

### 6.1 城市数据

**新建文件**: `src/data/cities.js`

定义约 40 个中国城市里程碑节点，按距离递增排列:

```
距离(m)  城市
200     安仁镇
500     浏阳市
1000    株洲市
2000    长沙市（省会）
3500    武汉市
5000    郑州市
8000    石家庄市
12000   北京市
18000   哈尔滨市
25000   乌鲁木齐市
...
```

覆盖: 小镇 → 县级市 → 地级市 → 省会 → 直辖市 → 边远省会，形成完整的"从小地方跑向大城市"的叙事。

### 6.2 里程碑 UI

**文件**: `GameScene.js`

- 在顶部 UI 区域添加"当前城市"和"下一个城市"显示
- 到达里程碑时:
  - 屏幕中央弹出城市名称 + 🎉，停留 1.5 秒后淡出
  - 播放欢庆音效
  - 可选: 短暂的背景颜色/主题变化

### 6.3 关卡系统

**新建文件**: `src/data/levels.js`

```javascript
export default [
  { id: 1, name: '第一关：奔向省城', targetCity: '长沙市', targetDistance: 2000, baseSpeed: 250, speedIncrease: 3, obstacleRate: 0.6 },
  { id: 2, name: '第二关：中部崛起', targetCity: '武汉市', targetDistance: 3500, baseSpeed: 300, speedIncrease: 5, obstacleRate: 0.65 },
  { id: 3, name: '第三关：进京赶考', targetCity: '北京市', targetDistance: 12000, baseSpeed: 350, speedIncrease: 7, obstacleRate: 0.75 },
  // ...更多关卡
]
```

**新建场景**: `src/scenes/LevelSelectScene.js`
- 展示关卡列表（线性城市连线地图），已通关的显示 ✅
- 选择关卡后传参启动 `GameScene`

**修改 `GameScene.js`**:
- `init(data)` 接收关卡配置
- `create()` 中用关卡配置覆盖 `window.gameConfig` 默认值
- 到达目标城市距离时触发"过关"而非无限跑
- 过关后进入新的 `LevelCompleteScene`（或复用 `GameOverScene` 增加过关状态）

### 6.4 关卡进度持久化

- 使用 localStorage key `'ma-dao-cheng-gong-progress'` 存储 JSON: `{ unlockedLevel: 3, stars: { 1: 3, 2: 2 } }`
- 每关根据到达时间/金币数评 1-3 星

---

## 七、P4 — 多人联机对战

### 7.1 架构设计

```
┌──────────┐     WebSocket      ┌──────────────┐
│  Client  │ ◄──────────────► │  Node.js     │
│ (Phaser) │                    │  WS Server   │
└──────────┘                    │  (ws 库)     │
┌──────────┐     WebSocket      │              │
│  Client  │ ◄──────────────► │  房间管理     │
└──────────┘                    │  状态广播     │
┌──────────┐     WebSocket      │  排行榜      │
│  Client  │ ◄──────────────► │              │
└──────────┘                    └──────────────┘
```

### 7.2 服务端

**新建目录**: `server/`

```
server/
  index.js           # 入口，HTTP + WebSocket 服务
  Room.js            # 房间类（玩家列表、状态管理、计时）
  Player.js          # 玩家类（id、name、state）
  protocol.js        # 消息协议定义
  package.json       # 服务端依赖（ws）
```

**消息协议 `protocol.js`**:

| 方向 | 类型 | 数据 |
|------|------|------|
| C→S | `join` | `{ playerName, roomCode? }` |
| S→C | `room_joined` | `{ roomId, players[], countdown }` |
| S→C | `game_start` | `{ seed, levelConfig }` |
| C→S | `state_update` | `{ distance, coins, speed, currentCity }` |
| S→C | `players_state` | `{ players: [{ id, name, distance, coins, city }] }` |
| C→S | `boost_used` | `{}` |
| S→C | `player_finished` | `{ playerId, finalDistance, rank }` |
| S→C | `game_end` | `{ rankings: [] }` |

**房间逻辑**:
- 最多 4 人一个房间
- 支持随机匹配（等待 10 秒或满 4 人开始）和房间码邀请
- 服务端每 200ms 收集所有玩家状态并广播
- 游戏时长限制 120 秒，时间到所有人结束
- 使用相同的随机种子保证障碍物生成一致

### 7.3 客户端

**新建文件**: `src/net/MultiplayerManager.js`

```javascript
class MultiplayerManager {
  connect(serverUrl)           // 建立 WebSocket 连接
  joinRoom(playerName, code?)  // 加入/创建房间
  sendState(state)             // 上报本地状态（throttle 200ms）
  onPlayersState(callback)     // 注册接收其他玩家状态回调
  onGameStart(callback)
  onGameEnd(callback)
  disconnect()
}
```

**新建场景**: `src/scenes/MultiplayerLobbyScene.js`
- 输入玩家名称
- 选择"随机匹配"或"输入房间码"
- 显示等待中的玩家列表
- 倒计时后跳转 GameScene（多人模式）

### 7.4 对手状态 HUD（竖屏布局）

**文件**: `GameScene.js` `createUI()`

在右上角绘制半透明面板:

```
┌──────────────────────┐
│  ┌──────────────┐    │
│  │ 🐴 玩家A     │    │  ← 右上角对手面板
│  │  1250m  💰32 │    │     宽 130px
│  │ 🐴 玩家B     │    │     半透明黑底 alpha 0.6
│  │  980m   💰28 │    │     字号 12-14px
│  └──────────────┘    │
│                      │
│  ☁️                  │
│       ☁️             │
│                      │
│   🦁                 │
│         🧧           │
│                      │
│      🐴              │  ← 玩家角色（下方 77%）
│                      │
│  分数:125  距离:850m  │  ← 底部状态栏
│     [ ⚡加速 ]       │  ← 冲刺按钮
└──────────────────────┘
     420 × 750
```

- 面板使用 `Phaser.GameObjects.Graphics` 绘制圆角矩形
- 每个对手一行: 名称（截断 4 字） + 里程 + 金币
- 当对手使用加速时名称旁显示 ⚡ 图标闪烁
- 对手到达新城市时在面板中短暂高亮

### 7.5 加速冲刺机制

- 玩家点击"⚡加速"按钮 → 消耗 10 金币 → 3 秒内速度 ×1.5
- `Horse` 类添加 `boost()` 方法，修改速度倍率 + 播放冲刺特效（尾部拖影）
- 冷却 10 秒，UI 显示冷却进度圆弧
- 加速状态通过 WebSocket 同步给其他玩家

---

## 八、新增依赖汇总

### 前端 (`package.json`)

| 包名 | 用途 | 阶段 |
|-------|------|------|
| `phaser` ^3.80.1 | 游戏引擎（已有） | — |
| `vite` ^5.0.0 | 构建工具（已有） | — |

### 脚本工具 (`package.json` devDependencies)

| 包名 | 用途 | 阶段 |
|-------|------|------|
| `@google/generative-ai` | Gemini 2.5 Flash API | P1 |
| `sharp` | 图片处理（去背景/裁切/拼接/压缩） | P1 |

### 服务端 (`server/package.json`)

| 包名 | 用途 | 阶段 |
|-------|------|------|
| `ws` | WebSocket 服务 | P4 |
| `uuid` | 生成房间 ID / 玩家 ID | P4 |

---

## 九、新增/修改文件清单

| 文件 | 操作 | 阶段 |
|------|------|------|
| `src/config.js` | 修改（竖屏尺寸 + Scale） | P0 |
| `src/main.js` | 修改（laneWidth 调整） | P0 |
| `src/scenes/GameScene.js` | 修改（布局适配 + 触控 + 碰撞闪烁 + 音效 + 汇集动画 + 里程碑UI + 联机HUD） | P0-P4 |
| `src/scenes/MenuScene.js` | 修改（布局适配 + 多人入口） | P0/P4 |
| `src/scenes/BootScene.js` | 修改（加载 spritesheet） | P1 |
| `src/scenes/GameOverScene.js` | 修改（布局适配 + 关卡过关状态） | P0/P3 |
| `src/entities/Horse.js` | 修改（Sprite 改造 + invincible + boost） | P0/P1/P4 |
| `src/entities/Obstacle.js` | 修改（Sprite 改造 + 类型属性） | P1 |
| `src/entities/Collectible.js` | 修改（Sprite 改造） | P1 |
| `src/utils/AudioManager.js` | 修改（Web Audio 实现） | P2 |
| `src/utils/ScoreManager.js` | 修改（统一 key + 集成） | P0 |
| `index.html` | 修改（CSS 竖屏适配） | P0 |
| `src/data/cities.js` | **新建** | P3 |
| `src/data/levels.js` | **新建** | P3 |
| `src/scenes/LevelSelectScene.js` | **新建** | P3 |
| `src/net/MultiplayerManager.js` | **新建** | P4 |
| `src/scenes/MultiplayerLobbyScene.js` | **新建** | P4 |
| `scripts/generate-assets.js` | **新建** | P1 |
| `scripts/asset-manifest.json` | **新建** | P1 |
| `scripts/lib/gemini-client.js` | **新建** | P1 |
| `scripts/lib/image-processor.js` | **新建** | P1 |
| `scripts/lib/spritesheet-builder.js` | **新建** | P1 |
| `server/index.js` | **新建** | P4 |
| `server/Room.js` | **新建** | P4 |
| `server/Player.js` | **新建** | P4 |
| `server/protocol.js` | **新建** | P4 |
| `server/package.json` | **新建** | P4 |
| `public/assets/sprites/` | **新建目录** | P1 |
| `public/assets/audio/` | **新建目录**（可选） | P2 |

---

## 十、待确认事项

1. **Gemini API 认证方式** — 使用 Google AI Studio 的 API Key 还是 Vertex AI 的服务账号？影响 `gemini-client.js` 实现。
2. **WebSocket 服务器部署目标** — 云服务器选型（阿里云/腾讯云等），是否需要 Nginx 反向代理 + SSL (wss://) 配置。
3. **关卡城市数据** — 是否需要覆盖全国所有省份代表城市？还是挑选 30-40 个有代表性的即可？
