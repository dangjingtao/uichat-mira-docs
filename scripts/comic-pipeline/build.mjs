#!/usr/bin/env node
import { handleCliError, parseCliArgs } from "./common.mjs";
import { buildComic } from "./build-lib.mjs";

const { positional, options } = parseCliArgs(process.argv.slice(2));
const sourceDir = positional[0];
if (!sourceDir) {
  console.error("用法：pnpm comic:build -- <source-directory> [--output <directory>]");
  process.exit(2);
}
try {
  const result = await buildComic(sourceDir, { output: options.output });
  for (const warning of result.warnings) console.warn(`WARN  ${warning}`);
  console.log(`构建完成：${result.outputDir}`);
  console.log(`版本指纹：${result.manifest.releaseFingerprint}`);
  console.log(`图片体积：${result.report.output.imageBytes} bytes`);
} catch (error) {
  handleCliError(error);
}
