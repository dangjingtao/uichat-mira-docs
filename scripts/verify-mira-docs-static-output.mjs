import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { parseMiraDoc } from "@uichat-mira/docs";

const root = process.cwd();
const pagesRoot = resolve(root, "src/pages");
const distRoot = resolve(root, "dist");
const siteUrl = "https://tomz.io";
const expectedBase = `/${(process.env.EXPECTED_BASE || "uichat-mira-docs").replace(/^\/+|\/+$/g, "")}`;

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

function dataString(data, key) {
  const value = data[key];
  if (Array.isArray(value)) return value.length ? String(value[0]) : undefined;
  if (value == null || value === "") return undefined;
  return String(value);
}

function routeFor(sourcePath, doc) {
  const path = doc.path.replace(/^\/docs(?=\/|$)/, "");
  return path || "/";
}

function routeFile(route) {
  if (route === "/") return resolve(distRoot, "index.html");
  return resolve(distRoot, route.replace(/^\//, ""), "index.html");
}

function routeUrl(route) {
  return `${siteUrl}${expectedBase}${route === "/" ? "/" : `${route}/`}`;
}

const failures = [];
const visibleRoutes = new Set(["/"]);
const docsByRoute = new Map();
for (const file of markdownFiles(pagesRoot)) {
  const sourcePath = relative(pagesRoot, file).replace(/\\/g, "/");
  const doc = parseMiraDoc(sourcePath, readFileSync(file, "utf8"));
  const merge = dataString(doc.data, "merge");
  const mergeIndex = dataString(doc.data, "mergeIndex") === "true";
  if (merge && !mergeIndex) continue;
  const route = routeFor(sourcePath, doc);
  visibleRoutes.add(route);
  docsByRoute.set(route, doc);
}

for (const route of visibleRoutes) {
  const file = routeFile(route);
  if (!existsSync(file)) failures.push(`缺少静态页面: ${route} -> ${file}`);
}

const indexPath = resolve(distRoot, "index.html");
const notFoundPath = resolve(distRoot, "404.html");
const sitemapPath = resolve(distRoot, "sitemap.xml");
const robotsPath = resolve(distRoot, "robots.txt");
for (const file of [indexPath, notFoundPath, sitemapPath, robotsPath]) {
  if (!existsSync(file)) failures.push(`缺少构建产物: ${file}`);
}

if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, "utf8");
  if (!html.includes(`<link rel="canonical" href="${siteUrl}${expectedBase}/">`)) {
    failures.push("首页 canonical 缺失或 base 不正确");
  }
  if (!html.includes('property="og:site_name" content="UIChat Mira"')) {
    failures.push("首页缺少 UIChat Mira Open Graph 站点信息");
  }
  if (!html.includes('type="application/ld+json"')) {
    failures.push("首页缺少 JSON-LD");
  }
  if ((html.match(/name="description"/g) || []).length !== 1) {
    failures.push("首页 description meta 不是唯一值");
  }
}

if (existsSync(notFoundPath)) {
  const html = readFileSync(notFoundPath, "utf8");
  if (!html.includes('content="noindex,nofollow"')) {
    failures.push("404 页面没有 noindex,nofollow");
  }
}

const designSystemRoute = "/design-md/视觉/product-design-system";
const designSystemPath = routeFile(designSystemRoute);
if (existsSync(designSystemPath)) {
  const html = readFileSync(designSystemPath, "utf8");
  if (html.includes("::: html")) {
    failures.push("产品设计系统静态页泄漏了 ::: html 容器标记");
  }
  if (!html.includes('class="claude-visual"')) {
    failures.push("产品设计系统静态页没有恢复原始 HTML 视觉内容");
  }
  if (!html.includes("Mira 的设计系统")) {
    failures.push("产品设计系统静态页缺少合并后的正文内容");
  }
  if ((html.match(/<h1>产品设计系统<\/h1>/g) || []).length !== 1) {
    failures.push("产品设计系统静态页标题重复或缺失");
  }
}

const blogEntry = [...docsByRoute.entries()].find(([route]) =>
  route.startsWith("/blogs/"),
);
if (blogEntry) {
  const [route, doc] = blogEntry;
  const file = routeFile(route);
  if (existsSync(file)) {
    const html = readFileSync(file, "utf8");
    if (!html.includes('class="article-header"')) {
      failures.push(`博客静态页缺少文章头: ${route}`);
    }
    if (!html.includes("post-meta post-meta-article")) {
      failures.push(`博客静态页缺少作者、日期和分类信息: ${route}`);
    }
    if (!html.includes("author-signature")) {
      failures.push(`博客静态页缺少作者署名区: ${route}`);
    }
    if (doc.date && !html.includes(String(doc.date))) {
      failures.push(`博客静态页缺少发布日期: ${route}`);
    }
    if (doc.group && !html.includes(String(doc.group))) {
      failures.push(`博客静态页缺少文章分类: ${route}`);
    }
  }
}

if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  for (const route of visibleRoutes) {
    const url = routeUrl(route);
    if (!sitemap.includes(`<loc>${url}</loc>`)) {
      failures.push(`sitemap 缺少路由: ${route}`);
    }
  }
}

if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, "utf8");
  const expected = `Sitemap: ${siteUrl}${expectedBase}/sitemap.xml`;
  if (!robots.includes(expected)) failures.push("robots.txt sitemap 地址不正确");
}

if (failures.length) {
  console.error("MiraDocs 静态产物检查失败：");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `MiraDocs static output passed: ${visibleRoutes.size} routes, article rendering/canonical/JSON-LD/404/sitemap/robots verified.`,
);
