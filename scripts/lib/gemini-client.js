import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Gemini 2.5 Flash 图片生成客户端
 * - 读取 .env 中的 GEMINI_API_KEY
 * - 速率限制 + 指数退避重试
 * - 并发控制（信号量）
 */

// 从 .env 文件读取 API Key
function loadApiKey() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('未找到 .env 文件，请在项目根目录创建 .env 并设置 GEMINI_API_KEY');
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*['"]?([^'"\n\r]+)['"]?/);
  if (!match) {
    throw new Error('.env 文件中未找到 GEMINI_API_KEY');
  }
  return match[1].trim();
}

// 简易信号量，控制并发数
class Semaphore {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  release() {
    this.current--;
    if (this.queue.length > 0) {
      this.current++;
      const next = this.queue.shift();
      next();
    }
  }
}

// 延时工具
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class GeminiClient {
  constructor({ maxConcurrency = 1 } = {}) {
    const apiKey = loadApiKey();
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: 120_000 }, // 120 秒超时（图片生成较慢）
    });
    this.semaphore = new Semaphore(maxConcurrency);
    this.maxRetries = 5;
    this.baseDelay = 5000; // 基础重试延迟 5 秒
  }

  /**
   * 生成图片
   * @param {string} prompt - 图片生成提示词
   * @returns {Promise<Buffer>} PNG 图片 Buffer
   */
  async generateImage(prompt) {
    await this.semaphore.acquire();

    try {
      return await this._generateWithRetry(prompt);
    } finally {
      this.semaphore.release();
    }
  }

  async _generateWithRetry(prompt) {
    let lastError;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          console.log(`    ⏳ 重试第 ${attempt} 次，等待 ${delay / 1000}s...`);
          await sleep(delay);
        }

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: prompt,
          config: {
            responseModalities: ['Text', 'Image'],
          },
        });

        // 从响应中提取图片数据
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageData = part.inlineData.data;
            return Buffer.from(imageData, 'base64');
          }
        }

        throw new Error('Gemini 响应中未包含图片数据');
      } catch (error) {
        lastError = error;

        // 速率限制错误 (429) 特殊处理
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          console.log(`    ⚠️ 速率限制，等待 ${delay / 1000}s 后重试...`);
          await sleep(delay);
          continue;
        }

        // 其他可重试错误
        if (attempt < this.maxRetries - 1) {
          console.log(`    ⚠️ 生成失败: ${error.message}，准备重试...`);
          continue;
        }
      }
    }

    throw new Error(`图片生成失败（已重试 ${this.maxRetries} 次）: ${lastError.message}`);
  }
}
