# 🐴 马到成功 (Horse Rush - Spring Festival Edition)

一个充满新春喜庆氛围的跑酷小游戏，使用 PhaserJS 开发。

## 🎮 游戏玩法

- 控制一匹马在3条泳道上奔跑
- 使用 ← → 方向键或 A/D 键切换泳道
- 收集红包和金币获得分数
- 躲避障碍物，撞到会减速
- 距离越远，速度越快，挑战越大！

## 🛠️ 技术栈

- **游戏引擎**: Phaser 3
- **构建工具**: Vite
- **开发语言**: JavaScript

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 📁 项目结构

```
ma-dao-cheng-gong/
├── index.html          # 入口HTML
├── package.json        # 项目配置
├── vite.config.js      # Vite配置
├── src/
│   ├── main.js         # 游戏入口
│   ├── config.js       # 游戏配置
│   ├── scenes/
│   │   ├── BootScene.js      # 启动场景
│   │   ├── MenuScene.js      # 主菜单
│   │   ├── GameScene.js      # 游戏主场景
│   │   └── GameOverScene.js  # 游戏结束
│   ├── entities/
│   │   ├── Horse.js          # 马角色
│   │   ├── Obstacle.js       # 障碍物
│   │   └── Collectible.js    # 收集物
│   └── utils/
│       ├── ScoreManager.js   # 分数管理
│       └── AudioManager.js   # 音频管理
└── assets/             # 资源文件（暂时为空，使用代码生成）
```

## 🎨 美术资源

当前版本使用 Emoji 和文本占位符：
- 🐴 马
- 🧧 红包
- 🪙 金币
- 🦁 石狮子（障碍）
- 🏺 花瓶（障碍）
- 🏮 灯笼（装饰）

后期可替换为AI生成的精美图片资源。

## 📝 开发计划

- [x] 基础项目结构
- [x] 核心跑酷机制
- [x] 碰撞检测系统
- [x] 分数系统
- [ ] 音效和背景音乐
- [ ] 难度曲线优化
- [ ] 特效和粒子系统
- [ ] 多皮肤系统
- [ ] 微信小游戏适配

## 📄 License

MIT

---