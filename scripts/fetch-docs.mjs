/**
 * 构建期文档同步脚本
 *
 * 从 ErisPulse 仓库的 docs/ 目录拉取全部多语言文档与 _meta 映射索引，
 * 写入 src/content/docs/ 供 Astro Content Collection 在构建时摄入。
 *
 * 用法：
 *   node scripts/fetch-docs.mjs            # 拉取 Develop/v2 分支
 *   node scripts/fetch-docs.mjs main       # 指定分支
 *
 * 机制：使用 git sparse-checkout 只拉取 docs/ 子目录，避免克隆整个仓库。
 */

import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";

const REPO = "https://github.com/ErisPulse/ErisPulse.git";
const BRANCH = process.argv[2] || "Develop/v2";
const DOCS_SUBDIR = "docs";
const DEST = resolve("src/content/docs");
// 使用项目内临时目录（兼容 Windows UNC 路径限制）
const TMP = resolve(".docs-cache");
const TMP_REPO = resolve(TMP, "repo");

function run(cmd, cwd) {
  try {
    execSync(cmd, { stdio: "pipe", cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
  } catch (e) {
    const stderr = e.stderr?.toString?.() || "";
    const stdout = e.stdout?.toString?.() || "";
    console.error(`[fetch-docs] 命令失败: ${cmd}`);
    if (stdout) console.error(stdout);
    if (stderr) console.error(stderr);
    throw e;
  }
}

try {
  console.log(`[fetch-docs] 克隆 ErisPulse@${BRANCH} 的 ${DOCS_SUBDIR}/ 目录...`);

  // 清理旧的临时目录
  if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP_REPO, { recursive: true });

  run(`git clone --no-checkout --depth 1 --filter=blob:none --sparse "${REPO}" .`, TMP_REPO);
  run(`git sparse-checkout set ${DOCS_SUBDIR}`, TMP_REPO);
  run(`git checkout ${BRANCH}`, TMP_REPO);

  const srcDir = join(TMP_REPO, DOCS_SUBDIR);
  if (!existsSync(srcDir)) {
    throw new Error(`仓库中未找到 ${DOCS_SUBDIR}/ 目录（分支 ${BRANCH}）`);
  }

  // 清空目标目录后整体复制
  if (existsSync(DEST)) {
    rmSync(DEST, { recursive: true, force: true });
  }
  cpSync(srcDir, DEST, { recursive: true });

  console.log(`[fetch-docs] 完成：文档已写入 ${DEST}`);
} catch (e) {
  console.error(`[fetch-docs] 失败:`, e);
  process.exitCode = 1;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
