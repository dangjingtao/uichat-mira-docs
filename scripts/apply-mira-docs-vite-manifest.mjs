import { readFileSync, writeFileSync } from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Cannot apply MiraDocs Vite manifest: missing ${label}`);
  }
  return source.replace(search, replacement);
}

const appPath = new URL("../src/App.tsx", import.meta.url);
let app = readFileSync(appPath, "utf8");

if (!app.includes("pageDirectories,\n  compareBlogDocs")) {
  app = replaceOnce(
    app,
    'import pageDirectories from "virtual:page-directories";\n',
    "",
    "legacy page directory import",
  );
  app = replaceOnce(
    app,
    `import {\n  allDocs,\n  compareBlogDocs,\n  compareDocs,\n  slug,\n  type AuthorKey,\n  type Doc,\n} from "./content/mira-docs-adapter";`,
    `import {\n  allDocs,\n  pageDirectories,\n  compareBlogDocs,\n  compareDocs,\n  slug,\n  type AuthorKey,\n  type Doc,\n} from "./content/mira-docs-adapter";`,
    "MiraDocs adapter import",
  );
  writeFileSync(appPath, app);
}

const vitePath = new URL("../vite.config.ts", import.meta.url);
let vite = readFileSync(vitePath, "utf8");

if (!vite.includes('from "@mira/docs/vite"')) {
  vite = replaceOnce(
    vite,
    'import { VitePWA } from "vite-plugin-pwa";\n',
    'import { VitePWA } from "vite-plugin-pwa";\nimport { miraDocs } from "@mira/docs/vite";\n',
    "MiraDocs Vite import",
  );

  const directoryPluginStart = vite.indexOf("function pageDirectoryManifest()");
  const blogDirectoryStart = vite.indexOf("const blogDirectoryByGroup", directoryPluginStart);
  if (directoryPluginStart < 0 || blogDirectoryStart < 0) {
    throw new Error("Cannot apply MiraDocs Vite manifest: missing legacy directory plugin block");
  }
  vite = vite.slice(0, directoryPluginStart) + vite.slice(blogDirectoryStart);

  vite = replaceOnce(
    vite,
    "      pageDirectoriesPlugin(),\n",
    `      miraDocs({\n        contentDir: "src/pages",\n        config: {\n          title: "UIChat Mira",\n          description: "本地优先的多模型智能体工作空间",\n          siteUrl,\n        },\n        staticRoutes: false,\n        exclude: (sourcePath) => /(^|\\/)README\\.md$/i.test(sourcePath),\n        route: (_sourcePath, doc) => {\n          const path = doc.path.replace(/^\\/docs(?=\\/|$)/, "");\n          return path || "/";\n        },\n      }),\n`,
    "legacy page directory plugin registration",
  );

  writeFileSync(vitePath, vite);
}

console.log("Applied MiraDocs Vite content manifest migration.");
