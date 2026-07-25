import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { parseMiraDoc } from "@uichat-mira/docs";

const contentRoot = resolve(process.cwd(), "src/pages");

function markdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith(".md") && !/^README\.md$/i.test(entry.name)
      ? [path]
      : [];
  });
}

function legacyRoute(sourcePath) {
  const normalized = sourcePath.replace(/\\/g, "/").replace(/\.md$/i, "");
  const withoutDocsRoot = normalized.replace(/^docs\//, "");
  return `/${withoutDocsRoot}`.replace(/\/{2,}/g, "/");
}

const failures = [];
const routes = new Map();
const counts = new Map();
const files = markdownFiles(contentRoot);

for (const file of files) {
  const sourcePath = relative(contentRoot, file).replace(/\\/g, "/");
  const raw = readFileSync(file, "utf8");

  try {
    const doc = parseMiraDoc(sourcePath, raw);
    const route = legacyRoute(sourcePath);
    const previous = routes.get(route);

    if (previous) {
      failures.push(`重复路由 ${route}: ${previous}, ${sourcePath}`);
    } else {
      routes.set(route, sourcePath);
    }

    if (!doc.title.trim() || doc.title === doc.path) {
      failures.push(`缺少 title: ${sourcePath}`);
    }
    if (!doc.body.trim()) {
      failures.push(`正文为空: ${sourcePath}`);
    }

    counts.set(doc.type, (counts.get(doc.type) ?? 0) + 1);
  } catch (error) {
    failures.push(
      `${sourcePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

if (files.length === 0) {
  failures.push(`没有在 ${contentRoot} 找到 Markdown 内容`);
}

if (failures.length > 0) {
  console.error("MiraDocs 兼容检查失败：");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const summary = [...counts.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([type, count]) => `${type}=${count}`)
  .join(", ");

console.log(
  `MiraDocs compatibility passed: ${files.length} files, ${routes.size} routes (${summary}).`,
);
