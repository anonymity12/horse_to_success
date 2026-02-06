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
import sharp from 'sharp';
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
    seeds: {},        // map objectName -> seed image path (local)
    clean: null,      // 清理指定对象资源（object or comma list or 'all'）
    rawSize: null,    // optional: resize raw generated images to WxH (e.g. '512' or '512x512')
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--only' && args[i + 1]) {
      opts.only = args[++i].split(',').map(s => s.trim());
    } else if (args[i] === '--skip-generate') {
      opts.skipGenerate = true;
    } else if (args[i] === '--seed' && args[i + 1]) {
      // format: object=path  e.g. --seed horse=assets/ref/horse0.png
      const pair = args[++i];
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const obj = pair.substring(0, idx).trim();
        const p = pair.substring(idx + 1).trim();
        if (obj && p) {
          opts.seeds[obj] = p;
        }
      }
    } else if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (args[i] === '--clean' && args[i + 1]) {
      opts.clean = args[++i];
    } else if (args[i] === '--raw-size' && args[i + 1]) {
      opts.rawSize = args[++i];
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

  // 如果传入 --clean，则只清理对应对象并退出
  if (opts.clean) {
    const toClean = opts.clean === 'all' ? Object.keys(objects) : opts.clean.split(',').map(s => s.trim()).filter(Boolean);
    console.log('\n🧹 清理资源 - 对象: ' + toClean.join(', '));

    for (const name of toClean) {
      if (!objects[name]) {
        console.log(`  ⚠️ 跳过未知对象: ${name}`);
        continue;
      }

      // 删除原始、去背景、裁切临时文件
      const patterns = [
        path.join(rawDir, `${name}_*`),
        path.join(nobgDir, `${name}_*`),
        path.join(trimmedDir, `${name}_*`)
      ];

      for (const patternPath of patterns) {
        const dir = path.dirname(patternPath);
        const base = path.basename(patternPath).replace('*', '');
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir).filter(f => f.startsWith(base));
        for (const f of files) {
          try {
            fs.unlinkSync(path.join(dir, f));
            console.log(`    ✅ 已删除: ${path.join(dir, f)}`);
          } catch (err) {
            console.log(`    ⚠️ 无法删除: ${path.join(dir, f)} (${err.message})`);
          }
        }
      }

      // 删除输出 spritesheet + json
      const outPng = path.join(absOutputDir, `${name}.png`);
      const outJson = path.join(absOutputDir, `${name}.json`);
      for (const ofp of [outPng, outJson]) {
        if (fs.existsSync(ofp)) {
          try {
            fs.unlinkSync(ofp);
            console.log(`    ✅ 已删除输出: ${ofp}`);
          } catch (err) {
            console.log(`    ⚠️ 无法删除输出: ${ofp} (${err.message})`);
          }
        }
      }
    }

    console.log('\n🧹 清理完成');
    return;
  }

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
      // For chained-reference generation, pass previous raw frame as visual reference
      // and also append a short textual summary of the previous frame to the prompt
      let previousRawPath = null;
      let previousFrameDesc = null;
      for (let fi = 0; fi < obj.frames.length; fi++) {
        const frame = obj.frames[fi];
        let prompt = obj.prompt.replace('{frame_desc}', frame.desc) + ', ' + globalSuffix;
        // If manifest requests textual chaining and we have a previous frame description,
        // append a compact summary to bias the generation toward continuity.
        if (obj.reference_chain && previousFrameDesc) {
          const summary = previousFrameDesc.replace(/\s+/g, ' ').trim();
          prompt += ` Previous frame summary: "${summary}". Keep camera, palette, costume and proportions identical; only apply a minimal motion delta to limbs, mane and tail.`;
        }
        const rawPath = path.join(rawDir, `${objName}_${frame.name}.png`);

        // 如果已存在则跳过
        if (fs.existsSync(rawPath)) {
          console.log(`  ✅ ${frame.name} — 已存在，跳过`);
          // update previousRawPath to current so later frames can reference it
          previousRawPath = rawPath;
          continue;
        }

        if (opts.dryRun) {
          console.log(`  🔤 ${frame.name} prompt:`);
          console.log(`     ${prompt.substring(0, 200)}...`);
          // still set previousRawPath to null (no image created)
          continue;
        }

        console.log(`  🖼️  ${frame.name} — 生成中...`);
        try {
          let refBuffer = null;
          // Seed path (CLI) is used as the visual reference for the very first frame
          // of an object when provided via --seed object=path or --seed all=path.
          if (fi === 0) {
            const seedPath = opts.seeds[objName] || opts.seeds.all;
            if (seedPath) {
              const resolved = path.resolve(ROOT, seedPath);
              if (fs.existsSync(resolved)) {
                try {
                  refBuffer = fs.readFileSync(resolved);
                  console.log(`    🔗 使用种子参考图: ${resolved}`);
                } catch (err) {
                  console.log(`    ⚠️ 无法读取种子图 ${resolved}, 将尝试使用前一帧或无参考`);
                }
              } else {
                console.log(`    ⚠️ 种子图不存在: ${resolved}`);
              }
            }
          }

          // Only use previous frame as visual reference when manifest requests chaining
          if (!refBuffer && obj.reference_chain && previousRawPath && fs.existsSync(previousRawPath)) {
            try {
              refBuffer = fs.readFileSync(previousRawPath);
            } catch (err) {
              refBuffer = null;
            }
          }

          // Generate image (client will fallback to prompt-only if it can't accept the image part)
          let buffer = await client.generateImage(prompt, refBuffer);

          // If user requested raw resizing, resize the returned image to the specified size
          if (opts.rawSize) {
            try {
              let w = null, h = null;
              if (/^\d+x\d+$/i.test(opts.rawSize)) {
                const parts = opts.rawSize.split('x').map(n => parseInt(n, 10));
                w = parts[0]; h = parts[1];
              } else if (/^\d+$/i.test(opts.rawSize)) {
                w = h = parseInt(opts.rawSize, 10);
              }

              if (w && h) {
                buffer = await sharp(buffer)
                  .resize(w, h, { fit: 'contain', background: { r:0,g:0,b:0, alpha:0 } })
                  .png()
                  .toBuffer();
                console.log(`    🔽 raw 已缩放至 ${w}x${h}`);
              }
            } catch (err) {
              console.log(`    ⚠️ raw 缩放失败: ${err.message}`);
            }
          }

          fs.writeFileSync(rawPath, buffer);
          console.log(`  ✅ ${frame.name} — 已保存 (${(buffer.length / 1024).toFixed(1)} KB)`);
          // set this frame as previous for next
          previousRawPath = rawPath;
          // save concise previous-frame description for textual chaining
          previousFrameDesc = `${frame.name}: ${frame.desc}`;
        } catch (error) {
          console.error(`  ❌ ${frame.name} — 失败: ${error.message}`);
          // continue to next frame without updating previousRawPath
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
