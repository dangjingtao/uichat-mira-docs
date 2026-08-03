import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  PIPELINE_VERSION,
  loadSharp,
  pathExists,
  readJson,
  sha256File,
  toPosix,
} from "./common.mjs";

async function walk(root, directory = root) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await walk(root, fullPath)));
    else output.push(toPosix(path.relative(root, fullPath)));
  }
  return output;
}

export async function verifyComicBuild(buildDirectory) {
  const buildDir = path.resolve(buildDirectory);
  const errors = [];
  const warnings = [];
  const manifestPath = path.join(buildDir, "manifest.json");
  const reportPath = path.join(buildDir, "report.json");
  if (!(await pathExists(manifestPath))) errors.push("构建目录缺少 manifest.json。");
  if (!(await pathExists(reportPath))) errors.push("构建目录缺少 report.json。");
  if (errors.length) return { buildDir, manifest: null, errors, warnings };

  const manifest = await readJson(manifestPath);
  if (manifest.schemaVersion !== 1) errors.push("manifest.schemaVersion 必须为 1。");
  if (manifest.pipelineVersion !== PIPELINE_VERSION) errors.push(`manifest.pipelineVersion 必须为 ${PIPELINE_VERSION}。`);
  if (!Array.isArray(manifest.pages)) errors.push("manifest.pages 必须是数组。");

  const sharp = await loadSharp();
  const referenced = new Set(["manifest.json", "report.json"]);
  const assets = [manifest.cover, ...(Array.isArray(manifest.pages) ? manifest.pages : [])].filter(Boolean);
  for (const asset of assets) {
    if (!Array.isArray(asset.sources) || !asset.sources.length) {
      errors.push(`资源 ${asset.number ?? "cover"} 缺少 sources。`);
      continue;
    }
    for (const source of asset.sources) {
      const relative = String(source.src || "");
      if (!relative || relative.startsWith("/") || relative.includes("..")) {
        errors.push(`非法资源路径：${relative || "<empty>"}。`);
        continue;
      }
      referenced.add(relative);
      const filePath = path.join(buildDir, relative);
      if (!(await pathExists(filePath))) {
        errors.push(`manifest 引用了不存在的文件：${relative}。`);
        continue;
      }
      const fileStat = await stat(filePath);
      if (fileStat.size !== source.bytes) errors.push(`${relative} 文件大小与 manifest 不一致。`);
      if ((await sha256File(filePath)) !== source.sha256) errors.push(`${relative} SHA-256 与 manifest 不一致。`);
      try {
        const metadata = await sharp(filePath).metadata();
        if (metadata.width !== source.width || metadata.height !== source.height) errors.push(`${relative} 尺寸与 manifest 不一致。`);
      } catch (error) {
        errors.push(`${relative} 无法解码：${String(error)}`);
      }
      if (asset.original?.width && source.width > asset.original.width) errors.push(`${relative} 宽度超过源图。`);
    }
  }

  for (const file of await walk(buildDir)) {
    if (!referenced.has(file)) warnings.push(`构建目录含未被 manifest 引用的文件：${file}。`);
  }
  return { buildDir, manifest, errors, warnings };
}
