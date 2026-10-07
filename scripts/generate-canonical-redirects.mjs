import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const distRoot = resolve(process.cwd(), "dist");
const sitemapPath = resolve(distRoot, "sitemap.xml");
const redirectsPath = resolve(distRoot, "_redirects");

if (!existsSync(sitemapPath)) {
  throw new Error("Cannot generate canonical redirects: dist/sitemap.xml is missing");
}

const sitemap = readFileSync(sitemapPath, "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const rules = [];

for (const value of urls) {
  const url = new URL(value);
  const pathname = url.pathname;
  if (pathname === "/" || !pathname.endsWith("/")) continue;

  const source = pathname.replace(/\/$/, "");
  if (!source) continue;
  rules.push(`${source} ${pathname} 301`);
}

const uniqueRules = [...new Set(rules)].sort();
if (uniqueRules.length > 2000) {
  throw new Error(
    `Canonical redirect count ${uniqueRules.length} exceeds Cloudflare Pages' 2,000 static redirect limit`,
  );
}

const output = [
  "# Generated from sitemap.xml. Do not edit by hand.",
  "# Canonical policy: document and section URLs end with a trailing slash.",
  ...uniqueRules,
  "",
].join("\n");

writeFileSync(redirectsPath, output);
console.log(`Generated ${uniqueRules.length} canonical trailing-slash redirects.`);
