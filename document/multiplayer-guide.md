# 多人联机玩法与服务端运行指南

## 一、多人游戏玩法说明

### 1.1 模式入口
- 主菜单点击“🌐 多人联机”进入联机大厅。
- 支持两种方式：
  - 随机匹配：自动分配房间。
  - 房间码：输入 4 位房间码加入指定房间。

### 1.2 匹配与开局
- 每个房间最多 4 人。
- 进入房间后，10 秒倒计时自动开局；满 4 人立即开局。
- 开局时服务器下发统一随机种子与关卡参数（联机模式专用）。

### 1.3 对战目标
- 120 秒内比拼跑酷成绩。
- 统计指标：距离（主排名）、金币、速度状态。
- 结束条件：
  - 时间到，服务器强制结束。
  - 全员完成（如主动结束或到达目标）也会提前结束。

### 1.4 对手面板说明
- 右上角显示对手列表：
  - 昵称（最多 4 字）
  - 当前距离与金币
  - 使用加速时显示 ⚡ 图标

### 1.5 计分与胜负
- 排名基于距离从高到低。
- 若玩家提前结束，使用最终距离参与排名。

---

## 二、服务端运行指南

### 2.1 目录结构
```
server/
  index.js
  Room.js
  Player.js
  protocol.js
  package.json
```

### 2.2 安装依赖
在项目根目录执行：
```
cd server
npm install
```

### 2.3 启动服务
```
npm start
```
默认监听端口：`8080`

可通过环境变量指定端口：
```
set PORT=9000
npm start
```

### 2.4 客户端连接地址
前端默认使用：
```
ws://localhost:8080
```
若部署到公网，请修改前端配置：
- 位置：`src/main.js`
- 字段：`window.gameConfig.multiplayerServerUrl`
- 示例：`wss://your-domain.com/ws`

---

## 三、部署提示（生产环境）

1. 使用 HTTPS + WSS（建议使用 Nginx 或云服务反代）。
2. 设置防火墙开放 WebSocket 端口。
3. 建议配置进程守护（如 PM2）。

---

## 四、联机协议概览（供调试）

| 方向 | 类型 | 数据 |
|------|------|------|
| C→S | `join` | `{ playerName, roomCode? }` |
| S→C | `room_joined` | `{ roomId, playerId, players[] }` |
| S→C | `game_start` | `{ seed, levelConfig }` |
| C→S | `state_update` | `{ distance, coins, speed, city }` |
| S→C | `players_state` | `{ players: [{ id, name, distance, coins, city, boostActive }] }` |
| C→S | `boost_used` | `{}` |
| C→S | `player_finished` | `{ finalDistance }` |
| S→C | `game_end` | `{ rankings }` |
