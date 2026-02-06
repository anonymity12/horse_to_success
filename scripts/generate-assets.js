#!/usr/bin/env node

/**
 * 🎨 马到成功 — AI 美术资源生成脚本
 *
 * 使用 Gemini 2.5 Flash 生成游戏素材，自动去背景、裁切、拼接为 spritesheet。
 *
 * 用法:
 *   node scripts/generate-assets.js                   # 生成全部资源
 *   node scripts/generate-assets.js --only horse      # 只生成马
 *   node scripts/generate-assets.js --only horse,coin  # 只生成马和金币
 *   node scripts/generate-assets.js --skip-generate    # 跳过 AI 生成，只处理已有原始图
 *   node scripts/generate-assets.js --dry-run          # 只打印 prompt，不调用 API
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GeminiClient from './lib/gemini-client.js';
import { removeBlackBackground, trimAndResize } from './lib/image-processor.js';
import { buildSpritesheet, buildMetadata, saveSpritesheet } from './lib/spritesheet-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── 解析命令行参数 ────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    only: null,       // 只生成指定对象 (逗号分隔)
    skipGenerate: false, // 跳过 AI 生成步骤
    dryRun: false,    // 只打印 prompt 不调用
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--only' && args[i + 1]) {
      opts.only = args[++i].split(',').map(s => s.trim());
    } else if (args[i] === '--skip-generate') {
      opts.skipGenerate = true;
    } else if (args[i] === '--dry-run') {
      opts.dryRun = true;
    }
  }
  return opts;
}

// ─── 确保目录存在 ────────────────────────────────
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// ─── 主流程 ─────────────────────────────────────
async function main() {
  const opts = parseArgs();

  console.log('🐴 马到成功 — AI 美术资源生成');
  console.log('═'.repeat(50));

  // 1. 读取配置
  const manifestPath = path.join(__dirname, 'asset-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const { frameSize, outputDir, tmpDir, objects, globalSuffix } = manifest;

  const absOutputDir = path.resolve(ROOT, outputDir);
  const absTmpDir = path.resolve(ROOT, tmpDir);
  const rawDir = path.join(absTmpDir, 'raw');
  const nobgDir = path.join(absTmpDir, 'nobg');
  const trimmedDir = path.join(absTmpDir, 'trimmed');

  ensureDir(rawDir);
  ensureDir(nobgDir);
  ensureDir(trimmedDir);
  ensureDir(absOutputDir);

  // 过滤要生成的对象
  let objectNames = Object.keys(objects);
  if (opts.only) {
    objectNames = objectNames.filter(n => opts.only.includes(n));
    console.log(`📌 只生成: ${objectNames.join(', ')}`);
  }

  if (objectNames.length === 0) {
    console.log('❌ 没有匹配的对象可生成');
    process.exit(1);
  }

  // 2. AI 图片生成阶段
  if (!opts.skipGenerate) {
    console.log('\n🎨 阶段 1: AI 图片生成');
    console.log('─'.repeat(50));

    const client = opts.dryRun ? null : new GeminiClient({ maxConcurrency: 2 });

    for (const objName of objectNames) {
      const obj = objects[objName];
      console.log(`\n📦 [${objName}] — ${obj.frames.length} 帧`);

      for (const frame of obj.frames) {
        const prompt = obj.prompt.replace('{frame_desc}', frame.desc) + ', ' + globalSuffix;
        const rawPath = path.join(rawDir, `${objName}_${frame.name}.png`);

        // 如果已存在则跳过
        if (fs.existsSync(rawPath)) {
          console.log(`  ✅ ${frame.name} — 已存在，跳过`);
          continue;
        }

        if (opts.dryRun) {
          console.log(`  🔤 ${frame.name} prompt:`);
          console.log(`     ${prompt.substring(0, 120)}...`);
          continue;
        }

        console.log(`  🖼️  ${frame.name} — 生成中...`);
        try {
          const buffer = await client.generateImage(prompt);
          fs.writeFileSync(rawPath, buffer);
          console.log(`  ✅ ${frame.name} — 已保存 (${(buffer.length / 1024).toFixed(1)} KB)`);
        } catch (error) {
          console.error(`  ❌ ${frame.name} — 失败: ${error.message}`);
          // 继续处理其他帧
        }
      }
    }

    if (opts.dryRun) {
      console.log('\n🏁 dry-run 模式，不执行后续步骤');
      return;
    }
  } else {
    console.log('\n⏭️  跳过 AI 生成阶段 (--skip-generate)');
  }

  // 3. 图片处理阶段：去背景
  console.log('\n🔧 阶段 2: 去除黑色背景');
  console.log('─'.repeat(50));

  for (const objName of objectNames) {
    const obj = objects[objName];
    console.log(`\n📦 [${objName}]`);

    for (const frame of obj.frames) {
      const rawPath = path.join(rawDir, `${objName}_${frame.name}.png`);
      const nobgPath = path.join(nobgDir, `${objName}_${frame.name}.png`);

      if (!fs.existsSync(rawPath)) {
        console.log(`  ⚠️  ${frame.name} — 原始图不存在，跳过`);
        continue;
      }

      if (fs.existsSync(nobgPath)) {
        console.log(`  ✅ ${frame.name} — 已处理，跳过`);
        continue;
      }

      try {
        const rawBuffer = fs.readFileSync(rawPath);
        const nobgBuffer = await removeBlackBackground(rawBuffer);
        fs.writeFileSync(nobgPath, nobgBuffer);
        console.log(`  ✅ ${frame.name} — 已去背景`);
      } catch (error) {
        console.error(`  ❌ ${frame.name} — 去背景失败: ${error.message}`);
      }
    }
  }

  // 4. 图片处理阶段：裁切 + 统一尺寸
  console.log('\n✂️  阶段 3: 裁切并统一尺寸');
  console.log('─'.repeat(50));

  for (const objName of objectNames) {
    const obj = objects[objName];
    console.log(`\n📦 [${objName}] — 目标尺寸: ${frameSize.width}×${frameSize.height}`);

    for (const frame of obj.frames) {
      const nobgPath = path.join(nobgDir, `${objName}_${frame.name}.png`);
      const trimPath = path.join(trimmedDir, `${objName}_${frame.name}.png`);

      if (!fs.existsSync(nobgPath)) {
        console.log(`  ⚠️  ${frame.name} — 去背景图不存在，跳过`);
        continue;
      }

      if (fs.existsSync(trimPath)) {
        console.log(`  ✅ ${frame.name} — 已裁切，跳过`);
        continue;
      }

      try {
        const nobgBuffer = fs.readFileSync(nobgPath);
        const trimBuffer = await trimAndResize(nobgBuffer, frameSize.width, frameSize.height);
        fs.writeFileSync(trimPath, trimBuffer);
        console.log(`  ✅ ${frame.name} — 已裁切`);
      } catch (error) {
        console.error(`  ❌ ${frame.name} — 裁切失败: ${error.message}`);
      }
    }
  }

  // 5. 拼接 spritesheet
  console.log('\n🧩 阶段 4: 拼接 spritesheet');
  console.log('─'.repeat(50));

  for (const objName of objectNames) {
    const obj = objects[objName];
    console.log(`\n📦 [${objName}]`);

    const frameBuffers = [];
    const validFrames = [];
    let allFramesReady = true;

    for (const frame of obj.frames) {
      const trimPath = path.join(trimmedDir, `${objName}_${frame.name}.png`);

      if (!fs.existsSync(trimPath)) {
        console.log(`  ⚠️  ${frame.name} — 裁切图不存在，此对象无法拼接`);
        allFramesReady = false;
        break;
      }

      frameBuffers.push(fs.readFileSync(trimPath));
      validFrames.push(frame);
    }

    if (!allFramesReady || frameBuffers.length === 0) {
      console.log(`  ❌ [${objName}] 帧不完整，跳过拼接`);
      continue;
    }

    try {
      // 拼接
      const spritesheetBuffer = await buildSpritesheet(
        frameBuffers,
        frameSize.width,
        frameSize.height
      );

      // 生成元数据
      const metadata = buildMetadata(
        objName,
        validFrames,
        frameSize.width,
        frameSize.height
      );

      // 保存
      await saveSpritesheet(spritesheetBuffer, metadata, absOutputDir, objName);

    } catch (error) {
      console.error(`  ❌ [${objName}] 拼接失败: ${error.message}`);
    }
  }

  // 6. 完成
  console.log('\n' + '═'.repeat(50));
  console.log('🏁 资源生成完毕！');
  console.log(`📂 输出目录: ${absOutputDir}`);

  // 列出输出文件
  if (fs.existsSync(absOutputDir)) {
    const files = fs.readdirSync(absOutputDir);
    if (files.length > 0) {
      console.log('\n📄 输出文件:');
      for (const file of files) {
        const filePath = path.join(absOutputDir, file);
        const stat = fs.statSync(filePath);
        console.log(`   ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
      }
    }
  }
}

main().catch(error => {
  console.error('\n💥 致命错误:', error.message);
  process.exit(1);
});
