import sharp from 'sharp';

/**
 * 图片处理工具
 * - 去除纯黑背景
 * - 裁切透明边缘 + 统一尺寸
 */

/**
 * 去除黑色背景 — 将接近纯黑的像素 alpha 设为 0
 * @param {Buffer} inputBuffer - PNG 图片 Buffer
 * @param {number} threshold - 黑色阈值（r,g,b 均小于此值视为黑色），默认 35
 * @returns {Promise<Buffer>} 去背景后的 PNG Buffer
 */
export async function removeBlackBackground(inputBuffer, threshold = 35) {
  // 获取原始像素数据 (RGBA)
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // 遍历每个像素，将接近黑色的像素透明化
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r < threshold && g < threshold && b < threshold) {
      data[i + 3] = 0; // alpha = 0
    }
  }

  // 用处理后的像素数据重建 PNG
  return sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
    .png()
    .toBuffer();
}

/**
 * 裁切透明边缘并缩放到目标尺寸
 * @param {Buffer} inputBuffer - PNG 图片 Buffer
 * @param {number} targetWidth - 目标宽度
 * @param {number} targetHeight - 目标高度
 * @param {number} padding - 内边距百分比 (0-1)，默认 0.05 (5%)
 * @returns {Promise<Buffer>} 处理后的 PNG Buffer
 */
export async function trimAndResize(inputBuffer, targetWidth, targetHeight, padding = 0.05) {
  // 先 trim 掉透明边缘
  const trimmed = await sharp(inputBuffer)
    .trim()
    .toBuffer();

  // 计算留出内边距后的有效区域
  const padX = Math.floor(targetWidth * padding);
  const padY = Math.floor(targetHeight * padding);
  const fitWidth = targetWidth - padX * 2;
  const fitHeight = targetHeight - padY * 2;

  // 缩放到有效区域内，保持宽高比，透明填充
  return sharp(trimmed)
    .resize(fitWidth, fitHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: padY,
      bottom: padY,
      left: padX,
      right: padX,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
}
