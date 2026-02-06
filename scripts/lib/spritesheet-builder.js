import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 雪碧图拼接工具
 * - 将同一对象的所有帧横向拼接为一张 spritesheet
 * - 输出 PNG + JSON 元数据
 */

/**
 * 将多个帧拼接为横向 spritesheet
 * @param {Buffer[]} frameBuffers - 已处理好的帧 PNG Buffer 数组（统一尺寸）
 * @param {number} frameWidth - 单帧宽度
 * @param {number} frameHeight - 单帧高度
 * @returns {Promise<Buffer>} 拼接后的 spritesheet PNG Buffer
 */
export async function buildSpritesheet(frameBuffers, frameWidth, frameHeight) {
  const totalWidth = frameWidth * frameBuffers.length;

  // 创建底图（透明背景）
  const composites = frameBuffers.map((buffer, index) => ({
    input: buffer,
    left: index * frameWidth,
    top: 0
  }));

  return sharp({
    create: {
      width: totalWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * 生成 spritesheet 的 JSON 元数据（Phaser 3 兼容格式）
 * @param {string} objectName - 对象名称
 * @param {Array<{name: string, desc: string}>} frames - 帧配置列表
 * @param {number} frameWidth - 单帧宽度
 * @param {number} frameHeight - 单帧高度
 * @returns {object} JSON 元数据
 */
export function buildMetadata(objectName, frames, frameWidth, frameHeight) {
  return {
    name: objectName,
    frameWidth,
    frameHeight,
    frameCount: frames.length,
    // Phaser 3 可直接使用 frameWidth/frameHeight 加载 spritesheet
    // 这里额外提供帧名称映射方便动画配置
    frames: frames.map((frame, index) => ({
      name: frame.name,
      index,
      description: frame.desc
    })),
    // 预定义动画（如有多帧可用）
    animations: buildAnimations(objectName, frames)
  };
}

/**
 * 根据帧名称自动生成动画定义
 */
function buildAnimations(objectName, frames) {
  const animations = {};

  // 提取 run 帧组成跑步动画
  const runFrames = frames
    .map((f, i) => ({ ...f, index: i }))
    .filter(f => f.name.startsWith('run'));
  if (runFrames.length > 1) {
    animations.run = {
      frameRate: 10,
      repeat: -1,
      frames: runFrames.map(f => f.index)
    };
  }

  // 提取 attack 帧组成攻击动画
  const attackFrames = frames
    .map((f, i) => ({ ...f, index: i }))
    .filter(f => f.name.startsWith('attack'));
  if (attackFrames.length > 1) {
    animations.attack = {
      frameRate: 8,
      repeat: 0,
      frames: attackFrames.map(f => f.index)
    };
  }

  // 提取 spin 帧组成旋转动画
  const spinFrames = frames
    .map((f, i) => ({ ...f, index: i }))
    .filter(f => f.name.startsWith('spin'));
  if (spinFrames.length > 1) {
    animations.spin = {
      frameRate: 8,
      repeat: -1,
      frames: spinFrames.map(f => f.index)
    };
  }

  // 提取 open 帧组成打开动画
  const openFrames = frames
    .map((f, i) => ({ ...f, index: i }))
    .filter(f => f.name.startsWith('open'));
  if (openFrames.length > 0) {
    // 包含 idle 作为起始帧
    const idleIndex = frames.findIndex(f => f.name === 'idle');
    const allFrames = idleIndex >= 0
      ? [idleIndex, ...openFrames.map(f => f.index)]
      : openFrames.map(f => f.index);
    animations.open = {
      frameRate: 6,
      repeat: 0,
      frames: allFrames
    };
  }

  // idle 单帧也注册（方便引用）
  const idleFrame = frames.findIndex(f => f.name === 'idle');
  if (idleFrame >= 0) {
    animations.idle = {
      frameRate: 1,
      repeat: -1,
      frames: [idleFrame]
    };
  }

  return animations;
}

/**
 * 保存 spritesheet PNG + JSON 元数据到磁盘
 * @param {Buffer} spritesheetBuffer - spritesheet PNG Buffer
 * @param {object} metadata - JSON 元数据
 * @param {string} outputDir - 输出目录
 * @param {string} objectName - 对象名称（用作文件名）
 */
export async function saveSpritesheet(spritesheetBuffer, metadata, outputDir, objectName) {
  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  const pngPath = path.join(outputDir, `${objectName}.png`);
  const jsonPath = path.join(outputDir, `${objectName}.json`);

  fs.writeFileSync(pngPath, spritesheetBuffer);
  fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));

  console.log(`  📦 已保存: ${pngPath} (${(spritesheetBuffer.length / 1024).toFixed(1)} KB)`);
  console.log(`  📋 已保存: ${jsonPath}`);
}
