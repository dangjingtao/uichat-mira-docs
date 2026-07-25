import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { miraDocs } from "@uichat-mira/docs/vite";
import { miraDocsStaticBuild } from "./mira-docs-static";
import { seo as seoConfig, siteUrl } from "./src/site.config";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const pagesRoot = resolve(projectRoot, "src/pages");

const blogDirectoryByGroup: Record<string, string> = {
  "产品手记": "product-journal",
  "工程现场": "engineering",
  "共同思考": "shared-thinking",
  "Mira 来信": "mira-letters",
  "开发者生活": "developer-life",
  "一起学智能体": "agent-learning",
};

function markdownFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory()
      ? markdownFiles(path)
      : entry.name.endsWith(".md")
        ? [path]
        : [];
  });
}

function blogDirectoryCheck() {
  return {
    name: "blog-directory-check",
    buildStart(this: any) {
      const blogsRoot = resolve(pagesRoot, "blogs");
      for (const file of markdownFiles(blogsRoot)) {
        const relative = file.slice(blogsRoot.length + 1).replace(/\\/g, "/");
        const directory = relative.split("/")[0];
        const source = readFileSync(file, "utf8");
        const group = source.match(/^group:\s*(.+)$/m)?.[1]?.trim();
        const expected = group ? blogDirectoryByGroup[group] : undefined;
        if (expected && directory !== expected) {
          this.warn(
            `博客目录与分类不一致：${relative}，group 为“${group}”，建议放入 blogs/${expected}/。目录移动会改变文章 URL，请单独确认。`,
          );
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  // Cloudflare Pages injects CF_PAGES=1. Treat it as a root deployment even if
  // an external build setting accidentally invokes the github-pages mode.
  // GitHub Actions does not set CF_PAGES, so the repository base remains intact.
  const isCloudflarePages = process.env.CF_PAGES === "1";
  const isGitHubPagesBuild = mode === "github-pages" && !isCloudflarePages;
  const base = isGitHubPagesBuild ? "/uichat-mira-docs/" : "/";

  return {
    server: {
      port: 5174,
    },
    plugins: [
      miraDocs({
        contentDir: "src/pages",
        config: {
          title: "UIChat Mira",
          description: "本地优先的多模型智能体工作空间",
          siteUrl,
        },
        staticRoutes: seoConfig.enabled ? miraDocsStaticBuild : false,
        exclude: (sourcePath) => /(^|\/)README\.md$/i.test(sourcePath),
        route: (_sourcePath, doc) => {
          const path = doc.path.replace(/^\/docs(?=\/|$)/, "");
          return path || "/";
        },
      }),
      blogDirectoryCheck(),
      react(),
      tailwindcss(),
      VitePWA({
        // Auto-update prevents a stale service worker from keeping an old HTML
        // shell that points at hashed assets removed by a newer deployment.
        registerType: "autoUpdate",
        includeAssets: [
          "favicon-32x32.png",
          "apple-touch-icon.png",
          "pwa-icon-192.png",
          "pwa-icon-512.png",
          "pwa-maskable-512.png",
        ],
        manifest: {
          name: "UIChat Mira",
          short_name: "Mira",
          description: "本地优先的多模型智能体工作空间",
          lang: "zh-CN",
          start_url: "./",
          scope: "./",
          display: "standalone",
          theme_color: "#cc785c",
          background_color: "#faf9f5",
          icons: [
            {
              src: "pwa-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    base,
  };
});
