import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  ComicPipelineError,
  displayDimensions,
  loadSharp,
  pathExists,
  readJson,
  sha256File,
  uniqueSortedNumbers,
} from "./common.mjs";

const PAGE_FILE_PATTERN = /^(\d{3})\.(png|jpe?g|webp|tiff?)$/i;
const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"]);
const COVER_NAMES = ["cover.png", "cover.jpg", "cover.jpeg", "cover.webp", "cover.tif", "cover.tiff"];

function validateConfig(config, errors) {
  if (!config || typeof config !== "object") {
    errors.push("work.json 必须是对象。");
    return;
  }
  if (config.schemaVersion !== 1) errors.push("work.json.schemaVersion 必须为 1。");
  for (const key of ["id", "edition", "title", "subtitle"]) {
    if (typeof config[key] !== "string" || !config[key].trim()) errors.push(`work.json.${key} 必须是非空字符串。`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(config.id || ""))) errors.push("work.json.id 只能包含小写字母、数字与连字符。");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(String(config.edition || ""))) errors.push("work.json.edition 只能包含字母、数字、点、下划线与连字符。");
  if (!Number.isInteger(config.expectedPages) || config.expectedPages <= 0) errors.push("work.json.expectedPages 必须是正整数。");
  if (!["ltr", "rtl"].includes(config.readingDirection)) errors.push("work.json.readingDirection 必须是 ltr 或 rtl。");
  if (config.expectedAspectRatio !== undefined && (!Number.isFinite(config.expectedAspectRatio) || config.expectedAspectRatio <= 0)) {
    errors.push("work.json.expectedAspectRatio 必须是正数。");
  }
}

async function inspectImage(sharp, filePath) {
  const metadata = await sharp(filePath, { failOn: "error" }).metadata();
  const { width, height } = displayDimensions(metadata);
  if (!width || !height) throw new ComicPipelineError(`图片尺寸无效：${filePath}`);
  return {
    path: filePath,
    width,
    height,
    aspectRatio: width / height,
    bytes: (await stat(filePath)).size,
    sha256: await sha256File(filePath),
    format: metadata.format || path.extname(filePath).slice(1).toLowerCase(),
  };
}

export async function inspectComicSource(sourceDirectory) {
  const sourceDir = path.resolve(sourceDirectory);
  const configPath = path.join(sourceDir, "work.json");
  if (!(await pathExists(configPath))) throw new ComicPipelineError(`缺少 work.json：${configPath}`);

  const errors = [];
  const warnings = [];
  const rawConfig = await readJson(configPath);
  validateConfig(rawConfig, errors);
  const config = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
  config.missingPages = uniqueSortedNumbers(config.missingPages);
  const pagesDir = path.join(sourceDir, "pages");

  if (Number.isInteger(config.expectedPages)) {
    for (const page of config.missingPages) {
      if (page < 1 || page > config.expectedPages) errors.push(`missingPages 包含范围外页码：${page}。`);
    }
  }

  let coverPath = null;
  for (const name of COVER_NAMES) {
    const candidate = path.join(sourceDir, name);
    if (await pathExists(candidate)) {
      coverPath = candidate;
      break;
    }
  }
  if (!coverPath) errors.push("缺少 cover.png / cover.jpg / cover.webp 等封面文件。");
  if (!(await pathExists(pagesDir))) errors.push(`缺少 pages 目录：${pagesDir}`);
  if (errors.length) return { sourceDir, config, cover: null, pages: [], errors, warnings, summary: null };

  const grouped = new Map();
  for (const entry of await readdir(pagesDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) continue;
    const match = PAGE_FILE_PATTERN.exec(entry.name);
    if (!match) {
      errors.push(`页面文件名必须是三位页码：${entry.name}。`);
      continue;
    }
    const number = Number(match[1]);
    const candidates = grouped.get(number) || [];
    candidates.push({ number, name: entry.name, path: path.join(pagesDir, entry.name) });
    grouped.set(number, candidates);
  }

  for (const [number, candidates] of grouped.entries()) {
    if (candidates.length > 1) errors.push(`页码 ${String(number).padStart(3, "0")} 存在重复文件：${candidates.map((item) => item.name).join("、")}。`);
  }

  const actualNumbers = [...grouped.keys()].sort((a, b) => a - b);
  const declaredMissing = new Set(config.missingPages);
  if (Number.isInteger(config.expectedPages)) {
    for (let page = 1; page <= config.expectedPages; page += 1) {
      const exists = grouped.has(page);
      if (!exists && !declaredMissing.has(page)) errors.push(`缺少第 ${page} 页，但 missingPages 未声明。`);
      if (exists && declaredMissing.has(page)) errors.push(`第 ${page} 页存在，但同时被声明为缺页。`);
    }
    for (const page of actualNumbers) if (page < 1 || page > config.expectedPages) errors.push(`页面 ${page} 超出 expectedPages=${config.expectedPages}。`);
  }
  if (!actualNumbers.length) errors.push("pages 目录没有有效页面。");

  const sharp = await loadSharp();
  let cover = null;
  try {
    cover = await inspectImage(sharp, coverPath);
  } catch (error) {
    errors.push(`无法解码封面：${String(error instanceof Error ? error.message : error)}`);
  }
  const pages = [];
  for (const number of actualNumbers) {
    try {
      pages.push({ number, ...(await inspectImage(sharp, grouped.get(number)[0].path)) });
    } catch (error) {
      errors.push(`无法解码第 ${number} 页：${String(error instanceof Error ? error.message : error)}`);
    }
  }

  const expectedRatio = Number(config.expectedAspectRatio || 0);
  const overrides = new Set(uniqueSortedNumbers(config.aspectRatioOverrides));
  for (const page of pages) {
    if (page.width < 960) warnings.push(`第 ${page.number} 页源图宽度仅 ${page.width}px，无法生成 960px 阅读档。`);
    if (!expectedRatio) continue;
    const deviation = Math.abs(page.aspectRatio - expectedRatio) / expectedRatio;
    if (deviation > 0.05 && !overrides.has(page.number)) {
      errors.push(`第 ${page.number} 页比例偏差超过 5%；人工确认后加入 aspectRatioOverrides。`);
    } else if (deviation > 0.02) {
      warnings.push(`第 ${page.number} 页比例 ${page.aspectRatio.toFixed(4)} 偏离预期 ${expectedRatio} 超过 2%。`);
    }
  }

  const widths = pages.map((page) => page.width);
  const heights = pages.map((page) => page.height);
  return {
    sourceDir,
    config,
    cover,
    pages,
    errors,
    warnings,
    summary: {
      id: config.id,
      edition: config.edition,
      expectedPages: config.expectedPages,
      availablePages: pages.length,
      missingPages: config.missingPages,
      widthRange: widths.length ? [Math.min(...widths), Math.max(...widths)] : [0, 0],
      heightRange: heights.length ? [Math.min(...heights), Math.max(...heights)] : [0, 0],
    },
  };
}

export function printInspection(result) {
  for (const warning of result.warnings) console.warn(`WARN  ${warning}`);
  for (const error of result.errors) console.error(`ERROR ${error}`);
  if (!result.summary) return;
  console.log(`作品：${result.summary.id} @ ${result.summary.edition}`);
  console.log(`页面：${result.summary.availablePages}/${result.summary.expectedPages}`);
  console.log(`缺页：${result.summary.missingPages.length ? result.summary.missingPages.join(", ") : "无"}`);
  console.log(`宽度：${result.summary.widthRange[0]}–${result.summary.widthRange[1]}px`);
  console.log(`高度：${result.summary.heightRange[0]}–${result.summary.heightRange[1]}px`);
}
