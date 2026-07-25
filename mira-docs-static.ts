import { marked } from "marked";
import type { MiraDoc, MiraDocsConfig } from "@mira/docs";
import {
  miraDocsAbsoluteAssetUrl,
  miraDocsAbsoluteRouteUrl,
  miraDocsEscapeHtml,
  type MiraDocsStaticBuildContext,
  type MiraDocsStaticBuildOptions,
  type MiraDocsStaticRoute,
} from "@mira/docs/vite";

type StaticDoc = MiraDoc & {
  root: string;
  source: string;
  authors: string[];
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

function staticDocs(docs: MiraDoc[]): StaticDoc[] {
  const parsed: StaticDoc[] = docs.map((doc: MiraDoc) => ({
    ...doc,
    root: doc.path.split("/")[1] || "docs",
    source: doc.body,
    authors: dataList(doc.data, "author").length
      ? dataList(doc.data, "author")
      : ["Tomz Dang"],
    image: doc.cover || dataString(doc.data, "image"),
    merge: dataString(doc.data, "merge"),
    mergeIndex: dataString(doc.data, "mergeIndex") === "true",
  }));

  return parsed
    .filter((doc: StaticDoc) => !doc.merge || doc.mergeIndex)
    .map((doc: StaticDoc) => {
      if (!doc.merge) return doc;
      const source = parsed
        .filter((section: StaticDoc) => section.merge === doc.merge)
        .sort((left: StaticDoc, right: StaticDoc) => left.order - right.order)
        .map((section: StaticDoc) => section.source)
        .join("\n\n");
      return { ...doc, source, body: source };
    });
}

function basePath(base: string): string {
  return base === "/" ? "" : base.replace(/\/$/, "");
}

function documentBody(doc: StaticDoc): string {
  const body = marked.parse(doc.source) as string;
  return `<main class="doc-main seo-static-content"><div class="doc-eyebrow">${miraDocsEscapeHtml(doc.group)}</div><div class="doc-title-block"><h1>${miraDocsEscapeHtml(doc.title)}</h1>${doc.description ? `<p class="doc-lede">${miraDocsEscapeHtml(doc.description)}</p>` : ""}</div><article class="markdown">${body}</article></main>`;
}

function areaBody(
  root: string,
  docs: StaticDoc[],
  context: MiraDocsStaticBuildContext,
): string {
  const title =
    root === "blogs"
      ? "博客"
      : docs.find((doc: StaticDoc) => doc.root === root)?.title || root;
  const links = docs
    .filter((doc: StaticDoc) => doc.root === root)
    .map(
      (doc: StaticDoc) =>
        `<li><a href="${basePath(context.base)}${doc.path}">${miraDocsEscapeHtml(doc.title)}</a><p>${miraDocsEscapeHtml(doc.description)}</p></li>`,
    )
    .join("");
  return `<main class="doc-main seo-static-content"><div class="doc-title-block"><h1>${miraDocsEscapeHtml(title)}</h1></div><section class="docs-sitemap-grid"><section class="area-overview-card"><ol>${links}</ol></section></section></main>`;
}

function homeBody(): string {
  return `<main class="doc-main seo-static-content"><div class="doc-title-block"><h1>本地优先的多模型智能体</h1><p class="doc-lede">UIChat Mira 让对话、模型、角色、文件、知识与工具在同一个持续上下文中协同工作。</p></div></main>`;
}

function notFoundBody(context: MiraDocsStaticBuildContext): string {
  return `<main class="doc-main seo-static-content"><div class="doc-not-found"><h1>这条路径没有内容</h1><p>页面可能已经移动、被删除，或者地址输入有误。</p><a class="btn btn-primary" href="${basePath(context.base)}/">返回首页</a></div></main>`;
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

function routes(context: MiraDocsStaticBuildContext): MiraDocsStaticRoute[] {
  const docs = staticDocs(context.docs);
  const result: MiraDocsStaticRoute[] = [
    {
      path: "/",
      title: "本地优先的多模型智能体",
      description: "UIChat Mira 多模型本地智能体产品文档",
      body: homeBody(),
      type: "website",
      jsonLd: websiteJsonLd(context, "/"),
    },
  ];

  const roots = [...new Set(docs.map((doc: StaticDoc) => doc.root))];
  for (const root of roots) {
    if (root === "docs") continue;
    const rootDocs = docs.filter((doc: StaticDoc) => doc.root === root);
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
    result.push({
      path: doc.path,
      title: doc.title,
      description: doc.description || "UIChat Mira 文档",
      body: documentBody(doc),
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
