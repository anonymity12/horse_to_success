const levels = [
  {
    id: 'lvl1',
    name: '新春热身',
    description: '跑到北京，感受年味起点',
    targetDistance: 800,
    baseSpeed: 260,
    speedIncrease: 4,
    spawnInterval: 1700
  },
  {
    id: 'lvl2',
    name: '京津疾驰',
    description: '穿越京津走廊，红包更多',
    targetDistance: 1400,
    baseSpeed: 280,
    speedIncrease: 5,
    spawnInterval: 1500
  },
  {
    id: 'lvl3',
    name: '江南夜跑',
    description: '一路南下至南京，速度更快',
    targetDistance: 2200,
    baseSpeed: 300,
    speedIncrease: 6,
    spawnInterval: 1350
  },
  {
    id: 'lvl4',
    name: '沪杭快线',
    description: '抵达魔都与西湖，障碍更密集',
    targetDistance: 3000,
    baseSpeed: 320,
    speedIncrease: 7,
    spawnInterval: 1250
  },
  {
    id: 'endless',
    name: '无尽模式',
    description: '不限距离，尽情奔跑',
    targetDistance: null,
    baseSpeed: 320,
    speedIncrease: 7,
    spawnInterval: 1200
  }
];

export default levels;
