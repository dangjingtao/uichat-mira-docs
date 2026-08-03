import { createHash } from "node:crypto";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const PIPELINE_VERSION = 1;
export const PAGE_WIDTHS = [320, 960, 1600];
export const COVER_WIDTHS = [320, 480, 960, 1600];

export class ComicPipelineError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ComicPipelineError";
    this.details = details;
  }
}

export function parseCliArgs(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const [key, inlineValue] = token.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return { positional, options };
}

export async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch (error) {
    throw new ComicPipelineError("无法加载 sharp。请先执行 pnpm install。", [
      String(error instanceof Error ? error.message : error),
    ]);
  }
}

export async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new ComicPipelineError(`无法读取 JSON：${filePath}`, [String(error)]);
  }
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function sha256File(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

export function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function displayDimensions(metadata) {
  let width = Number(metadata.width || 0);
  let height = Number(metadata.height || 0);
  if ([5, 6, 7, 8].includes(Number(metadata.orientation))) [width, height] = [height, width];
  return { width, height };
}

export function uniqueSortedNumbers(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter(Number.isInteger))].sort((a, b) => a - b);
}

export function candidateWidths(sourceWidth, candidates) {
  return [...new Set([...candidates.filter((value) => value <= sourceWidth), sourceWidth])]
    .filter((value) => Number.isInteger(value) && value > 0)
    .sort((a, b) => a - b);
}

export async function fileInfo(filePath) {
  const fileStat = await stat(filePath);
  return { bytes: fileStat.size, sha256: await sha256File(filePath) };
}

export function printIssues({ errors = [], warnings = [] }) {
  for (const warning of warnings) console.warn(`WARN  ${warning}`);
  for (const error of errors) console.error(`ERROR ${error}`);
}

export function handleCliError(error) {
  if (error instanceof ComicPipelineError) {
    console.error(error.message);
    for (const detail of error.details) console.error(`ERROR ${detail}`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}
