import { readFileSync, writeFileSync } from "node:fs";

function replaceExact(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${count}`);
  }
  return source.replace(before, after);
}

function patchFile(path, mutate) {
  const before = readFileSync(path, "utf8");
  const after = mutate(before);
  if (after === before) throw new Error(`${path}: patch produced no changes`);
  writeFileSync(path, after, "utf8");
}

patchFile("src/App.tsx", (input) => {
  let source = input;

  source = replaceExact(
    source,
    `import {\n  Link,\n  Outlet,`,
    `import {\n  Link,\n  Navigate,\n  Outlet,`,
    "App router import",
  );

  source = replaceExact(
    source,
    `const githubUrl = "https://github.com/dangjingtao/uichat-mira";\nconst appBase = import.meta.env.BASE_URL;\nfunction docHref(path: string) {`,
    `const githubUrl = "https://github.com/dangjingtao/uichat-mira";\nconst appBase = import.meta.env.BASE_URL;\nconst MIRA_DOCS_AREA_KEY = "mira-docs-api";\nconst VISUAL_CONTENT_ROOT = "design-md";\nconst VISUAL_NAV_DIRECTORY = "视觉";\nfunction logicalSiteAreaKey(root: string) {\n  return root === VISUAL_CONTENT_ROOT ? MIRA_DOCS_AREA_KEY : root;\n}\nfunction navigationDirectory(doc: Doc) {\n  return doc.root === VISUAL_CONTENT_ROOT ? VISUAL_NAV_DIRECTORY : doc.directory;\n}\nfunction docHref(path: string) {`,
    "App logical area helpers",
  );

  source = replaceExact(
    source,
    `const siteAreaRoots = [\n  ...new Set([\n    ...pageDirectories.filter((root) => root !== "docs"),\n    ...extraRootDocs.map((doc) => doc.root),\n  ]),\n];\nconst siteAreas: SiteArea[] = siteAreaRoots.map((root) => {\n  const docs = extraRootDocs\n    .filter((doc) => doc.root === root)\n    .sort(compareDocs);\n  const first = docs[0];\n  const path = \`/\${root}\`;\n  return {\n    key: root,\n    title:\n      first?.nav ||\n      (root === "blogs"\n        ? "博客"\n        : root\n            .replace(/[-_]+/g, " ")\n            .replace(/\\b\\w/g, (letter) => letter.toUpperCase())),\n    description: root === "design-md" ? "" : first?.description || "",\n    docs,\n    path,\n    href: docHref(path),\n  };\n});`,
    `const siteAreaRoots = [\n  ...new Set(\n    [\n      ...pageDirectories.filter((root) => root !== "docs"),\n      ...extraRootDocs.map((doc) => doc.root),\n    ].map(logicalSiteAreaKey),\n  ),\n];\nconst siteAreas: SiteArea[] = siteAreaRoots\n  .map((root) => {\n    const docs = extraRootDocs\n      .filter((doc) => logicalSiteAreaKey(doc.root) === root)\n      .sort(compareDocs);\n    const first = docs.find((doc) => doc.root === root) ?? docs[0];\n    const path = \`/\${root}\`;\n    return {\n      key: root,\n      title:\n        first?.nav ||\n        (root === "blogs"\n          ? "博客"\n          : root\n              .replace(/[-_]+/g, " ")\n              .replace(/\\b\\w/g, (letter) => letter.toUpperCase())),\n      description: first?.description || "",\n      docs,\n      path,\n      href: docHref(path),\n    };\n  })\n  .filter((area) => area.docs.length > 0);`,
    "App site area composition",
  );

  source = replaceExact(
    source,
    `  const isActive = (item: LinkItem) => {\n    const target = item.href.slice(Math.max(appBase.length - 1, 0));\n    if (item.label === "文档")\n      return (\n        location.pathname === "/sitemap" ||\n        allDocs.some(\n          (doc) => doc.root === "docs" && doc.path === location.pathname,\n        )\n      );\n    return (\n      location.pathname === target || location.pathname.startsWith(\`\${target}/\`)\n    );\n  };\n  const currentDoc = allDocs.find((doc) => doc.path === location.pathname);`,
    `  const currentDoc = allDocs.find((doc) => doc.path === location.pathname);\n  const isActive = (item: LinkItem) => {\n    const target = item.href.slice(Math.max(appBase.length - 1, 0));\n    if (item.label === "文档")\n      return (\n        location.pathname === "/sitemap" ||\n        allDocs.some(\n          (doc) => doc.root === "docs" && doc.path === location.pathname,\n        )\n      );\n    if (\n      target === \`/\${MIRA_DOCS_AREA_KEY}\` &&\n      currentDoc?.root === VISUAL_CONTENT_ROOT\n    ) {\n      return true;\n    }\n    return (\n      location.pathname === target || location.pathname.startsWith(\`\${target}/\`)\n    );\n  };`,
    "App active top navigation",
  );

  source = replaceExact(
    source,
    `function docsByDirectory(docs: Doc[]) {\n  return [...new Set(docs.map((doc) => doc.directory))].map((directory) => ({\n    directory,\n    docs: docs.filter((doc) => doc.directory === directory).sort(compareDocs),\n  }));\n}`,
    `function docsByDirectory(docs: Doc[]) {\n  return [...new Set(docs.map(navigationDirectory))]\n    .map((directory) => ({\n      directory,\n      docs: docs\n        .filter((doc) => navigationDirectory(doc) === directory)\n        .sort(compareDocs),\n    }))\n    .sort((left, right) => {\n      if (left.directory === VISUAL_NAV_DIRECTORY) return 1;\n      if (right.directory === VISUAL_NAV_DIRECTORY) return -1;\n      return 0;\n    });\n}`,
    "App directory grouping",
  );

  source = replaceExact(
    source,
    `function AreaDocNav({ area, current }: { area: SiteArea; current: string }) {\n  const groups = Object.values(\n    area.docs.reduce<Record<string, Doc[]>>((result, doc) => {\n      (result[doc.directory] ??= []).push(doc);\n      return result;\n    }, {}),\n  ).map((docs) => docs.sort(compareDocs));\n  const groupKeys = [...new Set(area.docs.map((doc) => doc.directory))];\n  return (\n    <nav className="docnav">\n      <h5>目录</h5>\n      <div className="docnav-group">\n        <h5>\n          <Link\n            className={current === area.path ? "active" : ""}\n            to={area.path}\n          >\n            {area.title}\n          </Link>\n        </h5>\n      </div>\n      {groupKeys.map((directory, index) => (\n        <div className="docnav-group" key={directory || "root"}>\n          <h5>{directory ? directoryTitle(directory) : "文档"}</h5>\n          <ul>\n            {groups[index]?.map((doc) => (\n              <li key={doc.path}>\n                <Link\n                  className={current === doc.path ? "active" : ""}\n                  to={doc.path}\n                >\n                  {doc.title}\n                </Link>\n              </li>\n            ))}\n          </ul>\n        </div>\n      ))}\n    </nav>\n  );\n}`,
    `function AreaDocNav({ area, current }: { area: SiteArea; current: string }) {\n  const groups = docsByDirectory(area.docs);\n  return (\n    <nav className="docnav">\n      <h5>目录</h5>\n      <div className="docnav-group">\n        <h5>\n          <Link\n            className={current === area.path ? "active" : ""}\n            to={area.path}\n          >\n            {area.title}\n          </Link>\n        </h5>\n      </div>\n      {groups.map((group) => (\n        <div className="docnav-group" key={group.directory || "root"}>\n          <h5>{group.directory ? directoryTitle(group.directory) : "文档"}</h5>\n          <ul>\n            {group.docs.map((doc) => (\n              <li key={doc.path}>\n                <Link\n                  className={current === doc.path ? "active" : ""}\n                  to={doc.path}\n                >\n                  {doc.title}\n                </Link>\n              </li>\n            ))}\n          </ul>\n        </div>\n      ))}\n    </nav>\n  );\n}`,
    "App area sidebar",
  );

  source = replaceExact(
    source,
    `  const currentArea = siteAreas.find(\n    (area) =>\n      location.pathname === area.path ||\n      location.pathname.startsWith(\`\${area.path}/\`),\n  );`,
    `  const currentArea = currentDoc\n    ? siteAreas.find((area) => area.key === logicalSiteAreaKey(currentDoc.root))\n    : siteAreas.find(\n        (area) =>\n          currentPath === area.path || currentPath.startsWith(\`\${area.path}/\`),\n      );`,
    "App current logical area",
  );

  source = replaceExact(
    source,
    `          <Route path="/sitemap" element={<DocPage path="/sitemap" />} />\n          {siteAreas.map((area) => (`,
    `          <Route path="/sitemap" element={<DocPage path="/sitemap" />} />\n          <Route\n            path={\`/\${VISUAL_CONTENT_ROOT}\`}\n            element={<Navigate replace to={\`/\${MIRA_DOCS_AREA_KEY}\`} />}\n          />\n          {siteAreas.map((area) => (`,
    "App visual root redirect",
  );

  if (source.includes('description: root === "design-md"')) {
    throw new Error("App still contains the old design-md empty-area special case");
  }
  return source;
});

patchFile("src/site.config.ts", (input) => {
  let source = input;
  source = replaceExact(
    source,
    `  "mira-docs-api",\n  "design-md",\n  "blogs",`,
    `  "mira-docs-api",\n  "blogs",`,
    "top navigation order",
  );
  source = replaceExact(
    source,
    `export const directoryLabels: Record<string, string> = {\n  "视觉/product-design-system": "产品设计系统",\n  "视觉/theme": "主题",\n};`,
    `export const directoryLabels: Record<string, string> = {\n  视觉: "视觉",\n};`,
    "logical visual directory label",
  );
  return source;
});

patchFile("mira-docs-static.ts", (input) => {
  let source = input;

  source = replaceExact(
    source,
    `function docHref(path: string, context: MiraDocsStaticBuildContext): string {\n  return \`\${basePath(context.base)}\${path}\`;\n}\n`,
    `function docHref(path: string, context: MiraDocsStaticBuildContext): string {\n  return \`\${basePath(context.base)}\${path}\`;\n}\n\nconst MIRA_DOCS_AREA_KEY = "mira-docs-api";\nconst VISUAL_CONTENT_ROOT = "design-md";\nconst VISUAL_NAV_DIRECTORY = "视觉";\nfunction logicalStaticAreaKey(root: string): string {\n  return root === VISUAL_CONTENT_ROOT ? MIRA_DOCS_AREA_KEY : root;\n}\n`,
    "static logical area helpers",
  );

  source = replaceExact(
    source,
    `    ["Mira-Docs", "/mira-docs-api"],\n    ["视觉", "/design-md"],\n    ["博客", "/blogs"],`,
    `    ["MiraDocs", "/mira-docs-api"],\n    ["博客", "/blogs"],`,
    "static top navigation",
  );

  source = replaceExact(
    source,
    `function staticDirectory(doc: StaticDoc): string {\n  const parts = doc.path.split("/").filter(Boolean);\n  return parts.slice(1, -1).join("/");\n}\n`,
    `function staticDirectory(doc: StaticDoc): string {\n  const parts = doc.path.split("/").filter(Boolean);\n  return parts.slice(1, -1).join("/");\n}\n\nfunction staticNavigationDirectory(doc: StaticDoc): string {\n  return doc.root === VISUAL_CONTENT_ROOT\n    ? VISUAL_NAV_DIRECTORY\n    : staticDirectory(doc);\n}\n`,
    "static visual directory mapping",
  );

  source = replaceExact(
    source,
    `function staticDocNav(\n  doc: StaticDoc,\n  docs: StaticDoc[],\n  context: MiraDocsStaticBuildContext,\n): string {\n  const scoped = docs\n    .filter((candidate) => candidate.root === doc.root)\n    .sort(\n      (left, right) =>\n        left.order - right.order || left.path.localeCompare(right.path),\n    );\n  const groups = new Map<string, StaticDoc[]>();\n  for (const candidate of scoped) {\n    const directory = staticDirectory(candidate);\n    const group = groups.get(directory) || [];\n    group.push(candidate);\n    groups.set(directory, group);\n  }\n  const rootPath = doc.root === "docs" ? "/" : \`/\${doc.root}\`;\n  const rootTitle =\n    scoped.map((candidate) => dataString(candidate.data, "nav")).find(Boolean) ||\n    doc.group ||\n    doc.root;\n  const sections = [...groups.entries()]\n    .map(([directory, items]) => {\n      const links = items\n        .map(\n          (item) =>\n            \`<li><a\${item.path === doc.path ? ' class="active" aria-current="page"' : ""} href="\${docHref(item.path, context)}">\${miraDocsEscapeHtml(item.title)}</a></li>\`,\n        )\n        .join("");\n      return \`<div class="docnav-group"><h5>\${miraDocsEscapeHtml(staticDirectoryTitle(directory))}</h5><ul>\${links}</ul></div>\`;\n    })\n    .join("");\n  return \`<nav class="docnav"><h5>目录</h5><div class="docnav-group"><h5><a href="\${docHref(rootPath, context)}">\${miraDocsEscapeHtml(rootTitle)}</a></h5></div>\${sections}</nav>\`;\n}`,
    `function staticDocNav(\n  doc: StaticDoc,\n  docs: StaticDoc[],\n  context: MiraDocsStaticBuildContext,\n): string {\n  const logicalRoot = logicalStaticAreaKey(doc.root);\n  const scoped = docs\n    .filter((candidate) => logicalStaticAreaKey(candidate.root) === logicalRoot)\n    .sort(\n      (left, right) =>\n        left.order - right.order || left.path.localeCompare(right.path),\n    );\n  const groups = new Map<string, StaticDoc[]>();\n  for (const candidate of scoped) {\n    const directory = staticNavigationDirectory(candidate);\n    const group = groups.get(directory) || [];\n    group.push(candidate);\n    groups.set(directory, group);\n  }\n  const rootPath = logicalRoot === "docs" ? "/" : \`/\${logicalRoot}\`;\n  const rootTitle =\n    logicalRoot === MIRA_DOCS_AREA_KEY\n      ? "MiraDocs"\n      : scoped\n          .filter((candidate) => candidate.root === logicalRoot)\n          .map((candidate) => dataString(candidate.data, "nav"))\n          .find(Boolean) ||\n        doc.group ||\n        logicalRoot;\n  const sections = [...groups.entries()]\n    .sort(([left], [right]) => {\n      if (left === VISUAL_NAV_DIRECTORY) return 1;\n      if (right === VISUAL_NAV_DIRECTORY) return -1;\n      return 0;\n    })\n    .map(([directory, items]) => {\n      const links = items\n        .map(\n          (item) =>\n            \`<li><a\${item.path === doc.path ? ' class="active" aria-current="page"' : ""} href="\${docHref(item.path, context)}">\${miraDocsEscapeHtml(item.title)}</a></li>\`,\n        )\n        .join("");\n      return \`<div class="docnav-group"><h5>\${miraDocsEscapeHtml(staticDirectoryTitle(directory))}</h5><ul>\${links}</ul></div>\`;\n    })\n    .join("");\n  return \`<nav class="docnav"><h5>目录</h5><div class="docnav-group"><h5><a href="\${docHref(rootPath, context)}">\${miraDocsEscapeHtml(rootTitle)}</a></h5></div>\${sections}</nav>\`;\n}`,
    "static combined sidebar",
  );

  source = replaceExact(
    source,
    `  const title =\n    root === "blogs"\n      ? "博客"\n      : docs.find((doc: StaticDoc) => doc.root === root)?.title || root;\n  const links = docs\n    .filter((doc: StaticDoc) => doc.root === root)`,
    `  const title =\n    root === "blogs"\n      ? "博客"\n      : root === MIRA_DOCS_AREA_KEY\n        ? "MiraDocs"\n        : docs.find((doc: StaticDoc) => doc.root === root)?.title || root;\n  const links = docs\n    .filter((doc: StaticDoc) => logicalStaticAreaKey(doc.root) === root)`,
    "static combined area body",
  );

  source = replaceExact(
    source,
    `function homeBody(context: MiraDocsStaticBuildContext): string {\n  const main = \`<main class="doc-main seo-static-content"><div class="doc-title-block"><h1>本地优先的多模型智能体</h1><p class="doc-lede">UIChat Mira 让对话、模型、角色、文件、知识与工具在同一个持续上下文中协同工作。</p></div></main>\`;\n  return \`\${staticSiteHeader(context)}\${main}\`;\n}\n`,
    `function homeBody(context: MiraDocsStaticBuildContext): string {\n  const main = \`<main class="doc-main seo-static-content"><div class="doc-title-block"><h1>本地优先的多模型智能体</h1><p class="doc-lede">UIChat Mira 让对话、模型、角色、文件、知识与工具在同一个持续上下文中协同工作。</p></div></main>\`;\n  return \`\${staticSiteHeader(context)}\${main}\`;\n}\n\nfunction visualRootRedirectBody(context: MiraDocsStaticBuildContext): string {\n  const target = docHref(\`/\${MIRA_DOCS_AREA_KEY}\`, context);\n  const main = \`<main class="doc-main seo-static-content"><div class="doc-not-found"><div class="doc-eyebrow">MIRADOCS · VISUAL</div><h1>视觉文档已归入 MiraDocs</h1><p>产品设计系统与主题参考仍保留原有文章地址，现在统一由 MiraDocs 导航承载。</p><a class="btn btn-primary" href="\${target}">前往 MiraDocs</a></div><script>window.location.replace(\${JSON.stringify(target)});</script></main>\`;\n  return \`\${staticSiteHeader(context)}\${main}\`;\n}\n`,
    "static visual root redirect body",
  );

  source = replaceExact(
    source,
    `    {\n      path: "/",\n      title: "本地优先的多模型智能体",\n      description: "UIChat Mira 多模型本地智能体产品文档",\n      body: homeBody(context),\n      type: "website",\n      jsonLd: websiteJsonLd(context, "/"),\n    },\n  ];\n\n  const roots = [...new Set(docs.map((doc: StaticDoc) => doc.root))];\n  for (const root of roots) {\n    if (root === "docs") continue;\n    const rootDocs = docs.filter((doc: StaticDoc) => doc.root === root);`,
    `    {\n      path: "/",\n      title: "本地优先的多模型智能体",\n      description: "UIChat Mira 多模型本地智能体产品文档",\n      body: homeBody(context),\n      type: "website",\n      jsonLd: websiteJsonLd(context, "/"),\n    },\n    {\n      path: \`/\${VISUAL_CONTENT_ROOT}\`,\n      title: "视觉文档已归入 MiraDocs",\n      description: "产品设计系统与主题参考现由 MiraDocs 统一导航。",\n      body: visualRootRedirectBody(context),\n      type: "website",\n      robots: "noindex,follow",\n      jsonLd: websiteJsonLd(context, \`/\${VISUAL_CONTENT_ROOT}\`),\n    },\n  ];\n\n  const roots = [\n    ...new Set(docs.map((doc: StaticDoc) => logicalStaticAreaKey(doc.root))),\n  ];\n  for (const root of roots) {\n    if (root === "docs") continue;\n    const rootDocs = docs.filter(\n      (doc: StaticDoc) => logicalStaticAreaKey(doc.root) === root,\n    );`,
    "static logical area routes",
  );

  return source;
});

patchFile("scripts/verify-mira-docs-static-output.mjs", (input) => {
  let source = input;

  source = replaceExact(
    source,
    `  if ((html.match(/name="description"/g) || []).length !== 1) {\n    failures.push("首页 description meta 不是唯一值");\n  }\n}`,
    `  if ((html.match(/name="description"/g) || []).length !== 1) {\n    failures.push("首页 description meta 不是唯一值");\n  }\n  if (html.includes(">视觉</a>") || html.includes(">Design Md</a>")) {\n    failures.push("顶部导航仍残留独立视觉入口");\n  }\n  if (!html.includes(">MiraDocs</a>")) {\n    failures.push("顶部导航缺少 MiraDocs");\n  }\n}`,
    "static top navigation assertions",
  );

  source = replaceExact(
    source,
    `const designSystemRoute = "/design-md/视觉/product-design-system";`,
    `const visualRootRoute = "/design-md";\nconst visualRootPath = routeFile(visualRootRoute);\nif (!existsSync(visualRootPath)) {\n  failures.push("缺少视觉旧根路径兼容页");\n} else {\n  const html = readFileSync(visualRootPath, "utf8");\n  if (html.includes("EMPTY SECTION") || html.includes("页面不存在")) {\n    failures.push("视觉旧根路径仍渲染为空目录或 404");\n  }\n  if (!html.includes("视觉文档已归入 MiraDocs")) {\n    failures.push("视觉旧根路径没有明确迁移说明");\n  }\n  if (!html.includes("/mira-docs-api")) {\n    failures.push("视觉旧根路径没有指向 MiraDocs");\n  }\n}\n\nconst miraDocsAreaPath = routeFile("/mira-docs-api");\nif (!existsSync(miraDocsAreaPath)) {\n  failures.push("缺少 MiraDocs 区域静态页");\n} else {\n  const html = readFileSync(miraDocsAreaPath, "utf8");\n  if (!html.includes("/design-md/视觉/product-design-system")) {\n    failures.push("MiraDocs 区域没有纳入视觉内容");\n  }\n}\n\nconst designSystemRoute = "/design-md/视觉/product-design-system";`,
    "visual root and MiraDocs area assertions",
  );

  source = replaceExact(
    source,
    `  if (!html.includes("Mira 的设计系统")) {\n    failures.push("产品设计系统静态页缺少合并后的正文内容");\n  }\n}`,
    `  if (!html.includes("Mira 的设计系统")) {\n    failures.push("产品设计系统静态页缺少合并后的正文内容");\n  }\n  const docnav = html.match(/<nav class="docnav">[\\s\\S]*?<\\/nav>/)?.[0] || "";\n  if (!docnav.includes(">MiraDocs</a>")) {\n    failures.push("视觉文档侧栏没有归入 MiraDocs");\n  }\n  if (!docnav.includes("<h5>视觉</h5>")) {\n    failures.push("视觉文档侧栏缺少统一视觉分组");\n  }\n  if (docnav.includes("<h5>主题</h5>") || docnav.includes("<h5>产品设计系统</h5>")) {\n    failures.push("视觉文档侧栏仍残留迁移前的拆分目录");\n  }\n}`,
    "visual sidebar assertions",
  );

  return source;
});

patchFile("src/pages/mira-docs-api/guide/navigation.md", (input) => {
  return replaceExact(
    input,
    `\`\`\`\n\nVite 插件负责发现文件，\`src/content/mira-docs-adapter.ts\` 负责把通用 \`MiraDoc\` 映射成旧站需要的文档模型。`,
    `\`\`\`\n\n\`design-md\` 继续作为视觉内容的物理来源，因此既有 \`/design-md/...\` 文章地址保持不变；站点适配层只把它的导航归属映射到 MiraDocs。顶部不再生成独立视觉入口，MiraDocs 左栏统一显示“视觉”分组，物理目录不会变成空栏目。\n\nVite 插件负责发现文件，\`src/content/mira-docs-adapter.ts\` 负责把通用 \`MiraDoc\` 映射成旧站需要的文档模型。`,
    "navigation documentation",
  );
});

console.log("Applied guarded MiraDocs visual logical nesting migration.");
