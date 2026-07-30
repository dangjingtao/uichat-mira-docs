import {
  extractHeadings,
  renderMiraMarkdown,
  type MiraDoc,
  type MiraDocsConfig,
} from "@uichat-mira/docs";
import {
  miraDocsAbsoluteAssetUrl,
  miraDocsAbsoluteRouteUrl,
  miraDocsEscapeHtml,
  type MiraDocsStaticBuildContext,
  type MiraDocsStaticBuildOptions,
  type MiraDocsStaticRoute,
} from "@uichat-mira/docs/vite";

type StaticDoc = MiraDoc & {
  root: string;
  source: string;
  authors: string[];
  readTime?: string;
  image?: string;
  merge?: string;
  mergeIndex?: boolean;
};

function dataString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  if (Array.isArray(value)) return value.length ? String(value[0]) : undefined;
  if (value == null || value === "") return undefined;
  return String(value);
}

function dataList(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(/[|,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function authorName(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "tomz") return "Tomz Dang";
  if (normalized === "mira") return "Mira";
  return value;
}

function authorAvatar(name: string): string {
  return name === "Mira"
    ? "https://assets.tomz.io/images/1784065334968-image-20260715054214404.webp"
    : "https://avatars.githubusercontent.com/u/20751798?s=160&v=4";
}

function staticDocs(docs: MiraDoc[]): StaticDoc[] {
  const parsed: StaticDoc[] = docs.map((doc: MiraDoc) => {
    const explicitAuthors = dataList(doc.data, "author").map(authorName);
    return {
      ...doc,
      root: doc.path.split("/")[1] || "docs",
      source: doc.body,
      authors: explicitAuthors.length ? explicitAuthors : ["Tomz Dang"],
      readTime:
        dataString(doc.data, "readTime") ||
        dataString(doc.data, "readtime") ||
        dataString(doc.data, "read_time"),
      image: doc.cover || dataString(doc.data, "image"),
      merge: dataString(doc.data, "merge"),
      mergeIndex: dataString(doc.data, "mergeIndex") === "true",
    };
  });

  return parsed
    .filter((doc: StaticDoc) => !doc.merge || doc.mergeIndex)
    .map((doc: StaticDoc) => {
      if (!doc.merge) return doc;
      const source = parsed
        .filter((section: StaticDoc) => section.merge === doc.merge)
        .sort((left: StaticDoc, right: StaticDoc) => left.order - right.order)
        .map((section: StaticDoc) => section.source)
        .join("\n\n");
      return {
        ...doc,
        source,
        body: source,
        headings: extractHeadings(source),
      };
    });
}

function basePath(base: string): string {
  return base === "/" ? "" : base.replace(/\/$/, "");
}

function docHref(path: string, context: MiraDocsStaticBuildContext): string {
  return `${basePath(context.base)}${path}`;
}

const MIRA_DOCS_AREA_KEY = "mira-docs-api";
const VISUAL_CONTENT_ROOT = "design-md";
const VISUAL_NAV_DIRECTORY = "视觉";
function logicalStaticAreaKey(root: string): string {
  return root === VISUAL_CONTENT_ROOT ? MIRA_DOCS_AREA_KEY : root;
}

function pageNavigation(
  previous: StaticDoc | undefined,
  next: StaticDoc | undefined,
  context: MiraDocsStaticBuildContext,
): string {
  if (!previous && !next) return "";
  const previousLink = previous
    ? `<a href="${docHref(previous.path, context)}"><span class="dir">上一篇</span><span class="to">← ${miraDocsEscapeHtml(previous.title)}</span></a>`
    : "<span></span>";
  const nextLink = next
    ? `<a class="next" href="${docHref(next.path, context)}"><span class="dir">下一篇</span><span class="to">${miraDocsEscapeHtml(next.title)} →</span></a>`
    : "";
  return `<div class="page-nav">${previousLink}${nextLink}</div>`;
}

function staticSiteHeader(context: MiraDocsStaticBuildContext): string {
  const links = [
    ["首页", "/"],
    ["文档", "/about/origin"],
    ["MiraDocs", "/mira-docs-api"],
    ["博客", "/blogs"],
  ] as const;
  const navigation = links
    .map(
      ([label, path]) =>
        `<li><a href="${docHref(path, context)}">${miraDocsEscapeHtml(label)}</a></li>`,
    )
    .join("");
  return `<nav class="top-nav docs-header seo-static-header"><div class="wrap"><a class="brand" href="${docHref("/", context)}"><img class="brand-logo" alt="" src="${docHref("/mira-logo.png", context)}" />UIChat Mira</a><ul class="menu">${navigation}</ul></div></nav>`;
}

function staticDirectory(doc: StaticDoc): string {
  const parts = doc.path.split("/").filter(Boolean);
  return parts.slice(1, -1).join("/");
}

function staticNavigationDirectory(doc: StaticDoc): string {
  return doc.root === VISUAL_CONTENT_ROOT
    ? VISUAL_NAV_DIRECTORY
    : staticDirectory(doc);
}

function staticDirectoryTitle(directory: string): string {
  if (!directory) return "文档";
  return directory
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/[-_]+/g, " "))
    .join(" / ");
}

function staticDocNav(
  doc: StaticDoc,
  docs: StaticDoc[],
  context: MiraDocsStaticBuildContext,
): string {
  const logicalRoot = logicalStaticAreaKey(doc.root);
  const scoped = docs
    .filter((candidate) => logicalStaticAreaKey(candidate.root) === logicalRoot)
    .sort(
      (left, right) =>
        left.order - right.order || left.path.localeCompare(right.path),
    );
  const groups = new Map<string, StaticDoc[]>();
  for (const candidate of scoped) {
    const directory = staticNavigationDirectory(candidate);
    const group = groups.get(directory) || [];
    group.push(candidate);
    groups.set(directory, group);
  }
  const rootPath = logicalRoot === "docs" ? "/" : `/${logicalRoot}`;
  const rootTitle =
    logicalRoot === MIRA_DOCS_AREA_KEY
      ? "MiraDocs"
      : scoped
          .filter((candidate) => candidate.root === logicalRoot)
          .map((candidate) => dataString(candidate.data, "nav"))
          .find(Boolean) ||
        doc.group ||
        logicalRoot;
  const sections = [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === VISUAL_NAV_DIRECTORY) return 1;
      if (right === VISUAL_NAV_DIRECTORY) return -1;
      return 0;
    })
    .map(([directory, items]) => {
      const links = items
        .map(
          (item) =>
            `<li><a${item.path === doc.path ? ' class="active" aria-current="page"' : ""} href="${docHref(item.path, context)}">${miraDocsEscapeHtml(item.title)}</a></li>`,
        )
        .join("");
      return `<div class="docnav-group"><h5>${miraDocsEscapeHtml(staticDirectoryTitle(directory))}</h5><ul>${links}</ul></div>`;
    })
    .join("");
  return `<nav class="docnav"><h5>目录</h5><div class="docnav-group"><h5><a href="${docHref(rootPath, context)}">${miraDocsEscapeHtml(rootTitle)}</a></h5></div>${sections}</nav>`;
}

function staticDocToc(doc: StaticDoc): string {
  if (!doc.headings.length) return "";
  const links = doc.headings
    .map(
      (heading) =>
        `<li class="toc-depth-${heading.depth}"><a href="#${miraDocsEscapeHtml(heading.id)}">${miraDocsEscapeHtml(heading.text)}</a></li>`,
    )
    .join("");
  return `<aside class="toc"><h5>本页目录</h5><ul>${links}</ul></aside>`;
}

function documentBody(
  doc: StaticDoc,
  previous: StaticDoc | undefined,
  next: StaticDoc | undefined,
  context: MiraDocsStaticBuildContext,
  docs: StaticDoc[],
): string {
  const body = renderMiraMarkdown(doc.source, { removeH1: true });
  const main = `<main class="doc-main seo-static-content"><div class="doc-eyebrow">${miraDocsEscapeHtml(doc.group)} · ${String(doc.order).padStart(2, "0")}</div><div class="doc-title-block"><h1>${miraDocsEscapeHtml(doc.title)}</h1>${doc.description ? `<p class="doc-lede">${miraDocsEscapeHtml(doc.description)}</p>` : ""}</div><article class="markdown">${body}</article>${pageNavigation(previous, next, context)}</main>`;
  return `${staticSiteHeader(context)}<div class="docs-app seo-static-docs-app"><div class="docs-shell">${staticDocNav(doc, docs, context)}${main}${staticDocToc(doc)}</div></div>`;
}

function articleToc(doc: StaticDoc): string {
  const headings = doc.headings.filter((heading) => heading.depth === 2);
  if (!headings.length) return "";
  const items = headings
    .map(
      (heading) =>
        `<li><a href="#${miraDocsEscapeHtml(heading.id)}">${miraDocsEscapeHtml(heading.text)}</a></li>`,
    )
    .join("");
  return `<aside class="article-toc"><h5>本文目录</h5><ul>${items}</ul></aside>`;
}

function articleBody(
  doc: StaticDoc,
  previous: StaticDoc | undefined,
  next: StaticDoc | undefined,
  context: MiraDocsStaticBuildContext,
): string {
  const body = renderMiraMarkdown(doc.source, { removeH1: true });
  const authors = doc.authors.join(" × ");
  const meta = [authors, doc.date, doc.readTime, doc.group]
    .filter(Boolean)
    .map((item) => `<span>${miraDocsEscapeHtml(String(item))}</span>`)
    .join('<span class="dot"></span>');
  const visual = doc.image
    ? `<div aria-hidden="true" class="article-header-visual"><img alt="" class="article-header-visual-image" src="${imageUrl(doc, context)}" /></div>`
    : "";
  const authorAvatars = doc.authors
    .map(
      (name) =>
        `<img alt="" class="author-signature-avatar" src="${authorAvatar(name)}" />`,
    )
    .join("");
  const authorCountClass = doc.authors.length > 1 ? "duo" : "solo";
  const main = `<main class="doc-main seo-static-content blog-post-page"><article class="article-header">${visual}<h1>${miraDocsEscapeHtml(doc.title)}</h1>${doc.description ? `<p class="doc-lede">${miraDocsEscapeHtml(doc.description)}</p>` : ""}<div class="post-meta post-meta-article">${meta}</div></article><div class="article-shell"><div class="article-body markdown blog-markdown">${body}<section class="author-signature author-signature-${authorCountClass}"><div class="author-signature-avatars author-signature-avatars-${doc.authors.length}">${authorAvatars}</div><div class="author-signature-copy"><h4>${miraDocsEscapeHtml(authors)}</h4></div></section>${pageNavigation(previous, next, context)}</div>${articleToc(doc)}</div></main>`;
  return `${staticSiteHeader(context)}<div class="docs-app blog-app seo-static-docs-app"><div class="docs-shell blog-shell">${main}</div></div>`;
}

function areaBody(
  root: string,
  docs: StaticDoc[],
  context: MiraDocsStaticBuildContext,
): string {
  const title =
    root === "blogs"
      ? "博客"
      : root === MIRA_DOCS_AREA_KEY
        ? "MiraDocs"
        : docs.find((doc: StaticDoc) => doc.root === root)?.title || root;
  const links = docs
    .filter((doc: StaticDoc) => logicalStaticAreaKey(doc.root) === root)
    .map(
      (doc: StaticDoc) =>
        `<li><a href="${docHref(doc.path, context)}">${miraDocsEscapeHtml(doc.title)}</a><p>${miraDocsEscapeHtml(doc.description)}</p></li>`,
    )
    .join("");
  const main = `<main class="doc-main seo-static-content"><div class="doc-title-block"><h1>${miraDocsEscapeHtml(title)}</h1></div><section class="docs-sitemap-grid"><section class="area-overview-card"><ol>${links}</ol></section></section></main>`;
  return `${staticSiteHeader(context)}<div class="docs-app seo-static-docs-app"><div class="docs-shell">${main}</div></div>`;
}

function homeBody(context: MiraDocsStaticBuildContext): string {
  const main = `<main class="doc-main seo-static-content"><div class="doc-title-block"><h1>本地优先的多模型智能体</h1><p class="doc-lede">UIChat Mira 让对话、模型、角色、文件、知识与工具在同一个持续上下文中协同工作。</p></div></main>`;
  return `${staticSiteHeader(context)}${main}`;
}

function visualRootRedirectBody(context: MiraDocsStaticBuildContext): string {
  const target = docHref(`/${MIRA_DOCS_AREA_KEY}`, context);
  const main = `<main class="doc-main seo-static-content"><div class="doc-not-found"><div class="doc-eyebrow">MIRADOCS · VISUAL</div><h1>视觉文档已归入 MiraDocs</h1><p>产品设计系统与主题参考仍保留原有文章地址，现在统一由 MiraDocs 导航承载。</p><a class="btn btn-primary" href="${target}">前往 MiraDocs</a></div><script>window.location.replace(${JSON.stringify(target)});</script></main>`;
  return `${staticSiteHeader(context)}${main}`;
}

function notFoundBody(context: MiraDocsStaticBuildContext): string {
  const main = `<main class="doc-main seo-static-content"><div class="doc-not-found"><h1>这条路径没有内容</h1><p>页面可能已经移动、被删除，或者地址输入有误。</p><a class="btn btn-primary" href="${basePath(context.base)}/">返回首页</a></div></main>`;
  return `${staticSiteHeader(context)}${main}`;
}

function imageUrl(
  doc: StaticDoc | undefined,
  context: MiraDocsStaticBuildContext,
): string {
  const image = doc?.image?.trim() || "mira-logo.png";
  if (/^https?:\/\//i.test(image)) return image;
  return miraDocsAbsoluteAssetUrl(
    context.config.siteUrl || "",
    context.base,
    image,
  );
}

function websiteJsonLd(
  context: MiraDocsStaticBuildContext,
  path: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UIChat Mira",
    url: miraDocsAbsoluteRouteUrl(
      context.config.siteUrl || "",
      context.base,
      path,
    ),
  };
}

function documentJsonLd(
  doc: StaticDoc,
  context: MiraDocsStaticBuildContext,
): Record<string, unknown> {
  const url = miraDocsAbsoluteRouteUrl(
    context.config.siteUrl || "",
    context.base,
    doc.path,
  );
  return {
    "@context": "https://schema.org",
    "@type": doc.root === "blogs" ? "Article" : "TechArticle",
    headline: doc.title,
    description: doc.description,
    url,
    image: imageUrl(doc, context),
    datePublished: doc.date,
    author: doc.authors.map((name: string) => ({ "@type": "Person", name })),
    publisher: { "@type": "Organization", name: "UIChat Mira" },
  };
}

function siblingDocs(
  doc: StaticDoc,
  docs: StaticDoc[],
): { previous?: StaticDoc; next?: StaticDoc } {
  const scoped = docs
    .filter((candidate) => candidate.root === doc.root)
    .sort(
      (left, right) =>
        left.order - right.order || left.path.localeCompare(right.path),
    );
  const index = scoped.findIndex((candidate) => candidate.path === doc.path);
  return {
    previous: index > 0 ? scoped[index - 1] : undefined,
    next: index >= 0 ? scoped[index + 1] : undefined,
  };
}

function routes(context: MiraDocsStaticBuildContext): MiraDocsStaticRoute[] {
  const docs = staticDocs(context.docs);
  const result: MiraDocsStaticRoute[] = [
    {
      path: "/",
      title: "本地优先的多模型智能体",
      description: "UIChat Mira 多模型本地智能体产品文档",
      body: homeBody(context),
      type: "website",
      jsonLd: websiteJsonLd(context, "/"),
    },
    {
      path: `/${VISUAL_CONTENT_ROOT}`,
      title: "视觉文档已归入 MiraDocs",
      description: "产品设计系统与主题参考现由 MiraDocs 统一导航。",
      body: visualRootRedirectBody(context),
      type: "website",
      robots: "noindex,follow",
      jsonLd: websiteJsonLd(context, `/${VISUAL_CONTENT_ROOT}`),
    },
  ];

  const roots = [
    ...new Set(docs.map((doc: StaticDoc) => logicalStaticAreaKey(doc.root))),
  ];
  for (const root of roots) {
    if (root === "docs") continue;
    const rootDocs = docs.filter(
      (doc: StaticDoc) => logicalStaticAreaKey(doc.root) === root,
    );
    const title = root === "blogs" ? "博客" : rootDocs[0]?.title || root;
    result.push({
      path: `/${root}`,
      title,
      description: rootDocs[0]?.description || "UIChat Mira 文档与博客",
      body: areaBody(root, rootDocs, context),
      type: "website",
      jsonLd: websiteJsonLd(context, `/${root}`),
    });
  }

  for (const doc of docs) {
    const { previous, next } = siblingDocs(doc, docs);
    result.push({
      path: doc.path,
      title: doc.title,
      description: doc.description || "UIChat Mira 文档",
      body:
        doc.root === "blogs"
          ? articleBody(doc, previous, next, context)
          : documentBody(doc, previous, next, context, docs),
      type: "article",
      image: doc.image,
      jsonLd: documentJsonLd(doc, context),
      doc,
    });
  }

  return result;
}

export const miraDocsStaticBuild: MiraDocsStaticBuildOptions = {
  routes,
  notFound: (context: MiraDocsStaticBuildContext): MiraDocsStaticRoute => ({
    path: "/404",
    title: "页面不存在",
    description: "你访问的页面不存在，可能已经移动、被删除，或者地址输入有误。",
    body: notFoundBody(context),
    type: "website",
    robots: "noindex,nofollow",
    jsonLd: websiteJsonLd(context, "/404"),
  }),
  locale: "zh_CN",
  siteName: "UIChat Mira",
  defaultImage: "mira-logo.png",
  image: {
    type: "image/png",
    width: 940,
    height: 760,
  },
  twitterCard: "summary_large_image",
  title: (route: MiraDocsStaticRoute, config: MiraDocsConfig): string =>
    `${route.title} · ${config.title}`,
  transformTemplate: (
    template: string,
    context: MiraDocsStaticBuildContext,
  ): string => {
    const assetBase = context.base === "/" ? "/" : context.base;
    return template.replace(
      /(href|src)="\/mira-logo\.png"/g,
      `$1="${assetBase}mira-logo.png"`,
    );
  },
  sitemap: true,
  robots: true,
};
