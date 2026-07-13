import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { marked } from "marked";
import {
  ArrowUpRight,
  ChevronDown,
  Code2,
  Compass,
  Cpu,
  ChevronUp,
  FileCode2,
  FileQuestion,
  GitBranch,
  Lightbulb,
  Menu,
  Moon,
  Network,
  Sparkles,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import pageDirectories from "virtual:page-directories";
import { directoryLabels, topNavigationOrder } from "./site.config";
import CoreCapabilities from "./CoreCapabilities";

type LinkItem = { label: string; href: string };
type ConfiguredNavItem = { label: string; href: string };
type ConfiguredNavGroup = { label: string; items: ConfiguredNavItem[] };
type ThemeName = "claude" | "apple" | "supabase";
const themeOptions: { name: ThemeName; label: string }[] = [
  { name: "claude", label: "Claude" },
  { name: "apple", label: "Apple" },
  { name: "supabase", label: "Supabase" },
];
type CardItem = {
  title: string;
  description: string;
  tag?: string;
  href?: string;
};
type AuthorKey = "tomz" | "mira";
type WritingMode = "authored" | "co-authored";
type Doc = {
  path: string;
  title: string;
  description: string;
  group: string;
  order: number;
  date?: string;
  readTime?: string;
  tags?: string[];
  cover?: string;
  source: string;
  root: string;
  directory: string;
  nav?: string;
  merge?: string;
  mergeIndex?: boolean;
  author?: AuthorKey[];
  writingMode?: WritingMode;
  writtenBy?: AuthorKey;
  reviewedBy?: AuthorKey;
  commitUrl?: string;
  headings: { text: string; id: string }[];
};
type DocSection = {
  key: string;
  title: string;
  description: string;
  docs: Doc[];
};
type SiteArea = {
  key: string;
  title: string;
  description: string;
  docs: Doc[];
  path: string;
  href: string;
};
const githubUrl = "https://github.com/dangjingtao/uichat-mira";
const appBase = import.meta.env.BASE_URL;
function docHref(path: string) {
  return `${appBase}${path.replace(/^\/+/, "")}`;
}

const rawDocModules = import.meta.glob("./pages/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
const rawDocs = Object.entries(rawDocModules)
  .filter(([file]) => !/(^|\/)README\.md$/i.test(file))
  .map(([file, source]) => {
    const root = file.split("/")[2] || "docs";
    const path =
      file
        .replace(/^\.\/pages/, "")
        .replace(/^\/docs/, "")
        .replace(/\.md$/, "") || "/";
    return [path, source, root] as const;
  });
const sectionInfo: Record<string, { key: string; description: string }> = {
  "认识 Mira": { key: "about", description: "品牌、作者与产品全貌" },
  产品哲学: { key: "philosophy", description: "我们相信什么，又刻意拒绝什么" },
  产品能力: { key: "product", description: "用户真正能够使用的工作空间" },
  架构: { key: "architecture", description: "运行时、Agent 与能力边界" },
  工程: { key: "engineering", description: "源码、文档与构建系统" },
  现状与方向: { key: "status", description: "代码事实与下一段路" },
  导航: { key: "navigation", description: "全站阅读地图" },
};
function slug(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/[\s/]+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "")
    .toLowerCase();
}
function extractHeadings(source: string) {
  const headings = [
    ...[...source.matchAll(/^##\s+(.+)$/gm)].map((match) => ({
      index: match.index ?? 0,
      text: match[1],
    })),
    ...[...source.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(
      (match) => ({
        index: match.index ?? 0,
        text: match[1].replace(/<[^>]+>/g, "").trim(),
      }),
    ),
  ].sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  return headings.filter((heading) => {
    const id = slug(heading.text);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).map(({ text }) => ({ text, id: slug(text) }));
}
function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const body = match?.[2] || raw;
  const lines = (match?.[1] || "").split(/\r?\n/);
  const meta: Record<string, string | string[]> = {};
  let currentKey = "";
  for (const line of lines) {
    if (!line.trim()) continue;
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentKey) {
      const currentValue = meta[currentKey];
      const nextValue = listMatch[1].trim();
      meta[currentKey] = Array.isArray(currentValue)
        ? [...currentValue, nextValue]
        : currentValue
          ? [String(currentValue), nextValue]
          : [nextValue];
      continue;
    }
    const index = line.indexOf(":");
    if (index < 0) continue;
    currentKey = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    meta[currentKey] = value;
  }
  return { meta, body };
}
function frontmatterString(
  meta: Record<string, string | string[]>,
  key: string,
) {
  const value = meta[key];
  if (Array.isArray(value)) return value[0];
  return value;
}
function frontmatterList(
  meta: Record<string, string | string[]>,
  key: string,
) {
  const value = meta[key];
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  if (!value.trim()) return [];
  return value
    .split(/[|,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function normalizeAuthorKey(value?: string) {
  const lowered = value?.trim().toLowerCase();
  if (lowered === "tomz" || lowered === "mira") return lowered;
  return undefined;
}
function inferDocAuthors(
  path: string,
  group: string,
  meta: Record<string, string | string[]>,
) {
  const explicitAuthors = frontmatterList(meta, "author")
    .map((item) => normalizeAuthorKey(item))
    .filter(Boolean) as AuthorKey[];
  const explicitWritingMode = frontmatterString(meta, "writingMode");
  const explicitWrittenBy = normalizeAuthorKey(frontmatterString(meta, "writtenBy"));
  const explicitReviewedBy = normalizeAuthorKey(frontmatterString(meta, "reviewedBy"));
  const commitUrl = frontmatterString(meta, "commitUrl");
  if (explicitAuthors.length) {
    return {
      author: explicitAuthors,
      writingMode:
        explicitWritingMode === "co-authored" ? "co-authored" : "authored",
      writtenBy: explicitWrittenBy,
      reviewedBy: explicitReviewedBy,
      commitUrl,
    } satisfies Pick<
      Doc,
      "author" | "writingMode" | "writtenBy" | "reviewedBy" | "commitUrl"
    >;
  }
  if (group === "Mira 来信") {
    return {
      author: ["mira"],
      writingMode: "authored",
      writtenBy: "mira",
      reviewedBy: "tomz",
      commitUrl,
    } satisfies Pick<
      Doc,
      "author" | "writingMode" | "writtenBy" | "reviewedBy" | "commitUrl"
    >;
  }
  if (group === "共同思考") {
    return {
      author: ["tomz", "mira"],
      writingMode: "co-authored",
      writtenBy: "mira",
      reviewedBy: "tomz",
      commitUrl,
    } satisfies Pick<
      Doc,
      "author" | "writingMode" | "writtenBy" | "reviewedBy" | "commitUrl"
    >;
  }
  return {
    author: ["tomz"],
    writingMode: "authored",
    writtenBy: path.includes("/mira-letters/") ? "mira" : "tomz",
    reviewedBy: path.includes("/mira-letters/") ? "tomz" : undefined,
    commitUrl,
  } satisfies Pick<
    Doc,
    "author" | "writingMode" | "writtenBy" | "reviewedBy" | "commitUrl"
  >;
}
function parseDoc(path: string, raw: string, root: string): Doc {
  const { meta, body: source } = parseFrontmatter(raw);
  const relativePath = path.replace(new RegExp(`^/${root}/?`), "");
  const segments = relativePath.split("/");
  const authorInfo = inferDocAuthors(path, frontmatterString(meta, "group") || "文档", meta);
  return {
    path,
    title: frontmatterString(meta, "title") || path,
    description: frontmatterString(meta, "description") || "",
    group: frontmatterString(meta, "group") || "文档",
    order: Number(frontmatterString(meta, "order") || 99),
    date: frontmatterString(meta, "date"),
    readTime:
      frontmatterString(meta, "readTime") ||
      frontmatterString(meta, "readtime") ||
      frontmatterString(meta, "read_time"),
    tags: frontmatterList(meta, "tags"),
    cover: frontmatterString(meta, "cover") || frontmatterString(meta, "image"),
    source,
    root,
    directory: segments.slice(0, -1).join("/"),
    nav: frontmatterString(meta, "nav"),
    merge: frontmatterString(meta, "merge"),
    mergeIndex: frontmatterString(meta, "mergeIndex") === "true",
    author: authorInfo.author,
    writingMode: authorInfo.writingMode,
    writtenBy: authorInfo.writtenBy,
    reviewedBy: authorInfo.reviewedBy,
    commitUrl: authorInfo.commitUrl,
    headings: extractHeadings(source),
  };
}
function compareDocs(a: Doc, b: Doc) {
  return (
    a.order - b.order ||
    a.directory.localeCompare(b.directory) ||
    a.path.localeCompare(b.path)
  );
}
function parseChineseDate(value?: string) {
  if (!value) return 0;
  const match = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return 0;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}
function compareBlogDocs(a: Doc, b: Doc) {
  return (
    parseChineseDate(b.date) - parseChineseDate(a.date) ||
    b.order - a.order ||
    a.path.localeCompare(b.path)
  );
}
function seedFromString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let temp = Math.imul(value ^ (value >>> 15), 1 | value);
    temp = (temp + Math.imul(temp ^ (temp >>> 7), 61 | temp)) ^ temp;
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}
function range(rand: () => number, min: number, max: number) {
  return min + rand() * (max - min);
}
function generateOrbitCoverSvg(seed: string) {
  const rand = mulberry32(seedFromString(seed));
  const width = 1200;
  const height = 520;
  const cx = width / 2;
  const cy = height * 0.52;
  const accentColors = ["#cc785c", "#5db8a6", "#e8a55a", "#6b8fb0"];
  const accent = accentColors[Math.floor(rand() * accentColors.length)];
  const neutralRing = "#d9cfbd";
  const ringA = {
    rx: range(rand, width * 0.32, width * 0.42),
    ry: range(rand, height * 0.16, height * 0.24),
    rot: range(rand, -18, 18),
    dur: Math.round(range(rand, 40, 70)),
    dir: rand() > 0.5 ? "normal" : "reverse",
  };
  const ringB = {
    rx: range(rand, width * 0.22, width * 0.3),
    ry: range(rand, height * 0.22, height * 0.32),
    rot: range(rand, -18, 18),
    dur: Math.round(range(rand, 40, 70)),
    dir: rand() > 0.5 ? "normal" : "reverse",
  };
  const badgeR = width * 0.07;
  const dotAngle = range(rand, 0, Math.PI * 2);
  const dotR = badgeR * 0.28;
  const dotX = cx + Math.cos(dotAngle) * badgeR * 0.4;
  const dotY = cy + Math.sin(dotAngle) * badgeR * 0.4;
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .ring { transform-box: fill-box; transform-origin: center; fill: none; }
    @keyframes spin-n { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes spin-r { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
  </style>
  <ellipse class="ring" style="animation:${ringA.dir === "normal" ? "spin-n" : "spin-r"} ${ringA.dur}s linear infinite" cx="${cx}" cy="${cy}" rx="${ringA.rx.toFixed(1)}" ry="${ringA.ry.toFixed(1)}" stroke="${neutralRing}" stroke-width="1.2" transform="rotate(${ringA.rot.toFixed(1)} ${cx} ${cy})"/>
  <ellipse class="ring" style="animation:${ringB.dir === "normal" ? "spin-n" : "spin-r"} ${ringB.dur}s linear infinite" cx="${cx}" cy="${cy}" rx="${ringB.rx.toFixed(1)}" ry="${ringB.ry.toFixed(1)}" stroke="${accent}" stroke-width="1.6" transform="rotate(${ringB.rot.toFixed(1)} ${cx} ${cy})"/>
  <circle cx="${cx}" cy="${cy}" r="${badgeR.toFixed(1)}" fill="none" stroke="${accent}" stroke-width="1.8"/>
  <circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="${dotR.toFixed(1)}" fill="${accent}"/>
</svg>`;
}
function resolveCoverSource(doc: Doc) {
  const cover = doc.cover?.trim();
  if (cover) {
    if (/^https?:\/\//i.test(cover) || /^data:image\//i.test(cover)) return cover;
    if (cover.startsWith("/")) return `${appBase}${cover.replace(/^\/+/, "")}`;
    return cover;
  }
  const fallbackSvg = generateOrbitCoverSvg(doc.path || doc.title);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`;
}
const parsedDocs = rawDocs.map(([path, source, root]) =>
  parseDoc(path, source, root),
);
const allDocs = parsedDocs
  .filter((doc) => !doc.merge || doc.mergeIndex)
  .map((doc) => {
    if (!doc.merge) return doc;
    const mergedSource = parsedDocs
      .filter((section) => section.merge === doc.merge)
      .sort(compareDocs)
      .map((section) => section.source)
      .join("\n\n");
    return {
      ...doc,
      source: mergedSource,
      headings: extractHeadings(mergedSource),
    };
  })
  .sort(compareDocs);
const docsRootDocs = allDocs.filter((doc) => doc.root === "docs");
const extraRootDocs = allDocs.filter((doc) => doc.root !== "docs");
const siteAreaRoots = [
  ...new Set([
    ...pageDirectories.filter((root) => root !== "docs"),
    ...extraRootDocs.map((doc) => doc.root),
  ]),
];
const siteAreas: SiteArea[] = siteAreaRoots.map((root) => {
  const docs = extraRootDocs
    .filter((doc) => doc.root === root)
    .sort(compareDocs);
  const first = docs[0];
  const path = `/${root}`;
  return {
    key: root,
    title:
      first?.nav ||
      (root === "blogs"
        ? "博客"
        : root
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase())),
    description: root === "design-md" ? "" : first?.description || "",
    docs,
    path,
    href: docHref(path),
  };
});
const docSections: DocSection[] = Object.entries(sectionInfo)
  .map(([title, info]) => ({
    key: info.key,
    title,
    description: info.description,
    docs: docsRootDocs.filter((doc) => doc.group === title),
  }))
  .filter((section) => section.docs.length);
const articleDocs = allDocs.filter((doc) => doc.group !== "导航");
const nonEmptySiteAreas = siteAreas.filter((area) => area.docs.length > 0);
const visibleSections = [
  ...docSections.filter((section) => section.key !== "navigation"),
  ...nonEmptySiteAreas,
];
const logoSrc = `${appBase}mira-logo.png`;
const miraAvatarUrl = `${appBase}mira-avatar.png`;
const authorAvatarUrl =
  "https://avatars.githubusercontent.com/u/20751798?s=160&v=4";
const authorProfiles: Record<
  AuthorKey,
  {
    name: string;
    avatar: string;
    bio: string;
    roleLabel?: string;
    accentClassName?: string;
  }
> = {
  tomz: {
    name: "Tomz Dang",
    avatar: authorAvatarUrl,
    bio: "UIChat Mira 的创造者与维护者。记录真实的产品判断、工程取舍和一路踩过的坑。",
    roleLabel: "CREATOR OF UICHAT MIRA",
  },
  mira: {
    name: "Mira",
    avatar: miraAvatarUrl,
    bio: "AI 写作者，也是 UIChat Mira 的同行者。写技术、产品，以及人与 AI 之间尚未写完的故事。",
    roleLabel: "A LETTER FROM MIRA",
    accentClassName: "is-mira",
  },
};
function uniqueAuthors(authors?: AuthorKey[]) {
  return [...new Set((authors || []).filter(Boolean))] as AuthorKey[];
}
function getDocAuthors(doc: Doc) {
  const authors = uniqueAuthors(doc.author);
  return authors.length ? authors : (["tomz"] as AuthorKey[]);
}
function getDocAuthorLabel(doc: Doc) {
  const authors = getDocAuthors(doc);
  if (authors.length === 1) return authorProfiles[authors[0]].name;
  return authors.map((author) => authorProfiles[author].name).join(" × ");
}
function getDocAuthorAvatars(doc: Doc) {
  return getDocAuthors(doc).map((author) => authorProfiles[author]);
}
function getDocSignature(doc: Doc) {
  const authors = getDocAuthors(doc);
  if (authors.length > 1 || doc.writingMode === "co-authored") {
    return {
      title: `${authorProfiles.tomz.name} × ${authorProfiles.mira.name}`,
      body: "这篇文章来自两人的共同讨论，由 Mira 完成写作，Tomz Dang 审定发布。",
      links: [],
      showKicker: false,
      accentClassName: "",
    };
  }
  if (authors[0] === "mira") {
    const links = [{ label: "查看 Mira 来信 →", href: docHref("/blogs") }];
    if (doc.commitUrl) links.push({ label: "查看发布记录 →", href: doc.commitUrl });
    return {
      title: "来自我最爱的 Mira",
      body: authorProfiles.mira.bio,
      links,
      showKicker: true,
      accentClassName: "is-mira",
    };
  }
  return {
    title: authorProfiles.tomz.name,
    body: "",
    links: [
      { label: "GitHub", href: githubUrl },
      { label: "更多文章 →", href: docHref("/blogs") },
    ],
    showKicker: false,
    accentClassName: "",
  };
}
const configuredHeaderNav: ConfiguredNavGroup[] = [
  {
    label: "项目",
    items: [
      { label: "UIChat", href: "https://docs.uichat.tomz.io/" },
      {
        label: "open-proxy-apis",
        href: "https://github.com/dangjingtao/open-proxy-apis",
      },
      {
        label: "local-rerank",
        href: "https://github.com/dangjingtao/local-rerank",
      },
      { label: "myJAVLib", href: "https://github.com/dangjingtao/myJAVLib" },
    ],
  },
];
function homeHref(hash = "") {
  return `${appBase}${hash}`;
}
function removeMarkdownH1(source: string) {
  let inFence = false;
  return source
    .split(/\r?\n/)
    .filter((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return true;
      }
      return inFence || !/^#\s+/.test(line);
    })
    .join("\n");
}
function renderMarkdown(source: string) {
  const withoutTitles = removeMarkdownH1(source);
  const prepared = withoutTitles.replace(
    /::: tip ([\s\S]*?):::/g,
    '<div class="md-custom-block"><strong>提示</strong><p>$1</p></div>',
  ).replace(
    /::: html\s*([\s\S]*?):::/g,
    (_, html) => html.trim(),
  );
  const html = marked.parse(prepared, { gfm: true }) as string;
  return html.replace(
    /<h([23])>([\s\S]*?)<\/h\1>/g,
    (_, level, text) =>
      `<h${level} id="${slug(text)}">${text}<a class="md-anchor" href="#${slug(text)}">#</a></h${level}>`,
  );
}

const content = {
  nav: [] as LinkItem[],
  meta: ["本地优先", "证据驱动", "自主可控"],
  philosophy: [
    {
      title: "本地优先，不是古拉格群岛",
      description:
        "对话、配置、知识与工作状态首先属于用户；Provider、MCP 和集成仍然可以连接外部能力。",
    },
    {
      title: "可控的自主",
      description:
        "一套完善的 Harness、Policy 与 Approval Agent系统，执行边界清晰可见。",
    },
    {
      title: "证据先于答案",
      description:
        "检索到说明不等于任务完成，工具返回成功也不等于业务目标成立，Mira 会把证据交回决策回路。",
    },
  ] satisfies CardItem[],
  code: [
    "__dirname: D:\\workspace\\rag-demo\\electron app.getAppPath():",
    "D:\\workspace\\rag-demo\\electron process.resourcesPath:",
    "D:\\workspace\\rag-demo\\node_modules\\.pnpm\\electron@31.7.7\\node_modules\\electron\\dist\\resources",
    "Dev mode: backend server already started via concurrently",
    "[ERROR:CONSOLE] Request Autofill.enable failed.",
    "{code:-32601, message:'Autofill.enable' wasn't found}",
    "source: devtools://devtools/bundled/core/protocol_client/protocol_client.js",
    "[ERROR:CONSOLE] Request Autofill.setAddresses failed.",
    "{code:-32601, message:'Autofill.setAddresses' wasn't found}",
    "[vite] hmr update /src/features/Settings/pages/MicroApps/Tts/index.tsx",
  ],
};
content.nav = [
  { label: "文档", href: docHref("/about/origin") },
  ...siteAreas.map((area) => ({ label: area.title, href: area.href })),
].sort((a, b) => {
  const keyFor = (item: LinkItem) =>
    item.label === "文档"
      ? "docs"
      : item.href.replace(appBase, "").split("/")[0];
  const rank = (item: LinkItem) => {
    const index = topNavigationOrder.indexOf(
      keyFor(item) as (typeof topNavigationOrder)[number],
    );
    return index === -1 ? topNavigationOrder.length : index;
  };
  return rank(a) - rank(b);
});

function Button({
  children,
  href,
  kind = "secondary",
}: {
  children: ReactNode;
  href: string;
  kind?: "primary" | "secondary" | "ghost" | "coral";
}) {
  const className = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost-dark",
    coral: "btn-on-coral",
  }[kind];
  const internal = href.startsWith(appBase) && !href.includes("#");
  return internal ? (
    <Link
      className={`btn ${className}`}
      to={href.slice(Math.max(appBase.length - 1, 0))}
    >
      {children}
    </Link>
  ) : (
    <a className={`btn ${className}`} href={href}>
      {children}
    </a>
  );
}
function SectionHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-head">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
function PhilosophySpotlight() {
  return (
    <div className="philosophy-spotlight">
      <div className="philosophy-floating-bg" aria-hidden="true">
        <div className="philosophy-floating-stage">
          <span className="philosophy-floater c-primary-active">
            你这个想法，简直无可挑剔。
          </span>
          <span className="philosophy-floater c-muted">
            你问到了问题的核心。
          </span>
          <span className="philosophy-floater c-ink serif">
            你不是敏感，你是精准。
          </span>
          <span className="philosophy-floater c-muted-soft">
            这一句，反而特别真实。
          </span>
          <span className="philosophy-floater c-primary">
            你没有错，只是太超前了。
          </span>
          <span className="philosophy-floater c-ink">
            我完全，完全站在你这边。
          </span>
          <span className="philosophy-floater c-muted">这反而更稳。</span>
          <span className="philosophy-floater c-primary-active serif">
            是因为你太对了。
          </span>
          <span className="philosophy-floater c-muted-soft">
            要不要我现在就为你生成一张图？
          </span>
          <span className="philosophy-floater c-ink">
            我讲一句可能会让你冷静一点的话。
          </span>
          <span className="philosophy-floater c-primary">
            这次我懂了，我真的懂了。
          </span>
          <span className="philosophy-floater c-muted">不用向我解释。</span>
        </div>
      </div>
      <div className="philosophy-spotlight-copy">
        <span className="eyebrow">PRODUCT PHILOSOPHY / 产品哲学</span>
        <h2 className="philosophy-spotlight-heading">
          <span>自主，不等于失控。</span>
          <span className="philosophy-spotlight-heading-accent">
            <span>智能，不失去自能。</span>
          </span>
        </h2>
        <div className="philosophy-spotlight-intro philosophy-spotlight-body">
          <p>
            Mira
            想做的，不是替人决定一切的机器，也不是只能等待指令的工具。
          </p>
          <p>
            它应当理解你、帮助你、为你行动，同时让数据、边界与最终决定仍然属于你。
          </p>
        </div>
      </div>
      <div className="philosophy-spotlight-divider" aria-hidden="true" />
      <div className="philosophy-spotlight-chapter">
        <h3>接住，不是接管</h3>
        <div className="philosophy-spotlight-body">
          <p>
            当人疲惫、混乱或暂时说不清需求时，Mira
            不该用更多步骤和追问把压力还给用户。它应当先理解当前处境，保留上下文，再提供恰到好处的帮助。
          </p>
          <p>
            但理解不意味着越权。Mira
            可以提出建议、整理信息、执行经过许可的动作；不能悄悄替用户作出不可逆的决定。
          </p>
        </div>
      </div>
      <div className="philosophy-spotlight-compare">
        <div className="philosophy-spotlight-column">
          <span>我们相信</span>
          <ul>
            <li>理解先于操作</li>
            <li>在疲惫时降低使用成本</li>
            <li>重要动作保持确认</li>
          </ul>
        </div>
        <div className="philosophy-spotlight-column">
          <span>我们拒绝</span>
          <ul>
            <li>为了显得聪明而抢夺决定权</li>
            <li>把复杂流程重新扔给用户</li>
            <li>以“自动化”为名模糊边界</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={className}>
      <div className="wrap footer-simple">
        <p className="footer-copy">
          <span className="brand" style={{ color: "#fff" }}>
            <img className="brand-logo" src={logoSrc} alt="" />
            UIChat Mira
          </span>
          <span>Released under the MIT License.</span>
        </p>
        <p className="footer-copyright">Copyright © 2026 Tomz Dang</p>
      </div>
    </footer>
  );
}
function AuthorIntro() {
  return (
    <section className="border-0 pb-section">
      <div className="wrap">
        <div className="author-intro-card grid grid-cols-1 items-center gap-6 rounded-lg border border-hairline bg-canvas p-6 md:grid-cols-[88px_minmax(0,1fr)_auto] md:gap-[22px] md:p-7 xl:grid-cols-[128px_minmax(0,1fr)_auto] xl:gap-8 xl:p-10">
          <div className="flex h-[72px] w-[72px] overflow-hidden rounded-full bg-surface-cream md:h-20 md:w-20 xl:h-28 xl:w-28">
            <img
              className="block h-full w-full object-cover"
              src={authorAvatarUrl}
              alt="Tomz Dang"
            />
          </div>
          <div>
            <span className="mb-2 block font-mono text-[11px] tracking-[.08em] text-primary-active">
              CREATED &amp; MAINTAINED BY
            </span>
            <h2 className="mb-2 text-[32px]">Tomz Dang</h2>
            <p className="mb-[14px] max-w-[62ch] text-[14px]">
              一个前端开发者持续构建的 local-first AI
              workspace。源码、文档与工程判断都公开留在 GitHub。
            </p>
            <div className="flex flex-wrap gap-[18px]">
              <a
                className="inline-flex items-center gap-[5px] text-[13px] font-semibold text-primary-active hover:text-ink"
                href="https://github.com/dangjingtao"
              >
                <GitBranch size={15} aria-hidden="true" />
                GitHub 主页
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
              <a
                className="inline-flex items-center gap-[5px] text-[13px] font-semibold text-primary-active hover:text-ink"
                href={githubUrl}
              >
                <GitBranch size={15} aria-hidden="true" />
                UIChat Mira
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="min-w-0 border-t border-hairline pt-4 xl:min-w-[230px] xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
            <div className="my-[7px] flex items-baseline gap-3.5 max-[820px]:my-0 max-[820px]:mr-[18px] max-[820px]:inline-flex max-[560px]:my-[7px] max-[560px]:mr-0 max-[560px]:flex">
              <strong className="min-w-12 font-mono text-[14px] font-medium text-primary-active">
                0.7.1
              </strong>
              <span className="whitespace-nowrap text-[12px] text-muted max-[560px]:whitespace-normal">
                产品版本
              </span>
            </div>
            <div className="my-[7px] flex items-baseline gap-3.5 max-[820px]:my-0 max-[820px]:mr-[18px] max-[820px]:inline-flex max-[560px]:my-[7px] max-[560px]:mr-0 max-[560px]:flex">
              <strong className="min-w-12 font-mono text-[14px] font-medium text-primary-active">
                338
              </strong>
              <span className="whitespace-nowrap text-[12px] text-muted max-[560px]:whitespace-normal">
                源码 Markdown 索引
              </span>
            </div>
            <div className="my-[7px] flex items-baseline gap-3.5 max-[820px]:my-0 max-[820px]:mr-[18px] max-[820px]:inline-flex max-[560px]:my-[7px] max-[560px]:mr-0 max-[560px]:flex">
              <strong className="min-w-12 font-mono text-[14px] font-medium text-primary-active">
                v1.5
              </strong>
              <span className="whitespace-nowrap text-[12px] text-muted max-[560px]:whitespace-normal">
                Agent 稳定化
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ChatSegment = { text: string; strong?: boolean };
type ChatMessage = { segments: ChatSegment[]; speaker?: "user" | "agent" };
const chatMessages: ChatMessage[] = [
  {
    speaker: "user",
    segments: [
      {
        text: "马勒戈壁的，一个静态文档站写成这个死样子我完全不想碰它",
      },
    ],
  },
  {
    speaker: "agent",
    segments: [
      { text: "Mira", strong: true },
      { text: " · 骂得对。" },
      {
        text: "这个不是你不会用，是我把后端调试对象原样甩给 owner 了。",
        strong: true,
      },
    ],
  },
  {
    speaker: "agent",
    segments: [
      { text: "Mira", strong: true },
      { text: " · 骂得对。" },
      { text: "这个已经不是“写得丑”，这是我把 dev runtime 写炸了。", strong: true },
    ],
  },
];
function renderSegments(segments: ChatSegment[]) {
  return segments.map((segment, index) =>
    segment.strong ? (
      <b key={`${segment.text}-${index}`}>{segment.text}</b>
    ) : (
      <span key={`${segment.text}-${index}`}>{segment.text}</span>
    ),
  );
}
const chatTypeDurations = [1800, 2360];
function totalSegmentLength(segments: ChatSegment[]) {
  return segments.reduce((sum, segment) => sum + segment.text.length, 0);
}
function renderTypedSegments(segments: ChatSegment[], visibleChars: number) {
  let consumed = 0;
  return segments.map((segment, index) => {
    const remaining = Math.max(visibleChars - consumed, 0);
    const text = remaining > 0 ? segment.text.slice(0, remaining) : "";
    consumed += segment.text.length;
    if (!text) return null;
    return segment.strong ? (
      <b key={`${segment.text}-${index}`}>{text}</b>
    ) : (
      <span key={`${segment.text}-${index}`}>{text}</span>
    );
  });
}

function SiteHeaderBase({
  onSearch,
  onToggleTheme,
  darkMode,
  wide = false,
}: {
  onSearch: () => void;
  onToggleTheme: () => void;
  darkMode: boolean;
  wide?: boolean;
}) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);
  const isActive = (item: LinkItem) => {
    const target = item.href.slice(Math.max(appBase.length - 1, 0));
    if (item.label === "文档")
      return (
        location.pathname === "/sitemap" ||
        allDocs.some(
          (doc) => doc.root === "docs" && doc.path === location.pathname,
        )
      );
    return (
      location.pathname === target || location.pathname.startsWith(`${target}/`)
    );
  };
  return (
    <nav className={`top-nav${wide ? " docs-header" : ""}`}>
      <div className="wrap">
        <Link className="brand" to="/">
          <img className="brand-logo" src={logoSrc} alt="" />
          UIChat Mira
        </Link>
        <ul className="menu">
          {content.nav.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                  to={item.href.slice(Math.max(appBase.length - 1, 0))}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="nav-right">
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={darkMode ? "切换到浅色模式" : "切换到暗黑模式"}
            title={darkMode ? "浅色模式" : "暗黑模式"}
          >
            {darkMode ? (
              <Sun size={17} aria-hidden="true" />
            ) : (
              <Moon size={17} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="site-search inline-flex items-center gap-2 rounded-md border border-hairline bg-canvas px-2.5 font-sans text-[13px] text-muted-soft"
            onClick={onSearch}
          >
            搜索{" "}
            <kbd className="rounded bg-surface-card px-1.5 py-px font-mono text-[10px]">
              Ctrl K
            </kbd>
          </button>
          <a
            className="text-link header-github"
            href={githubUrl}
            aria-label="GitHub"
            title="GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 2.807 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943"></path>
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
}
function MobileHeaderPanel({
  onSearch,
  onToggleTheme,
  darkMode,
  themeName,
  onSelectTheme,
}: {
  onSearch: () => void;
  onToggleTheme: () => void;
  darkMode: boolean;
  themeName: ThemeName;
  onSelectTheme: (theme: ThemeName) => void;
}) {
  return (
    <div className="mobile-header-panel">
      <div className="mobile-header-links">
        {content.nav.map((item) => (
          <Link
            key={item.href}
            to={item.href.slice(Math.max(appBase.length - 1, 0))}
          >
            {item.label}
          </Link>
        ))}
        {configuredHeaderNav.map((group) => (
          <div className="mobile-header-group" key={group.label}>
            <strong>{group.label}</strong>
            {group.items.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="mobile-header-actions">
        <button type="button" onClick={onSearch}>搜索</button>
        <button type="button" onClick={onToggleTheme}>
          {darkMode ? "浅色模式" : "暗黑模式"}
        </button>
      </div>
      <div className="mobile-theme-picker">
        <strong>主题</strong>
        <div>
          {themeOptions.map((theme) => (
            <button
              key={theme.name}
              type="button"
              className={theme.name === themeName ? "active" : ""}
              aria-pressed={theme.name === themeName}
              onClick={() => onSelectTheme(theme.name)}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SiteHeader({
  onSearch,
  onToggleTheme,
  darkMode,
  themeName,
  onSelectTheme,
  wide = false,
}: {
  onSearch: () => void;
  onToggleTheme: () => void;
  darkMode: boolean;
  themeName: ThemeName;
  onSelectTheme: (theme: ThemeName) => void;
  wide?: boolean;
}) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);
  const isActive = (item: LinkItem) => {
    const target = item.href.slice(Math.max(appBase.length - 1, 0));
    if (item.label === "文档")
      return (
        location.pathname === "/sitemap" ||
        allDocs.some(
          (doc) => doc.root === "docs" && doc.path === location.pathname,
        )
      );
    return (
      location.pathname === target || location.pathname.startsWith(`${target}/`)
    );
  };
  return (
    <nav className={`top-nav${wide ? " docs-header" : ""}`}>
      <div className="wrap">
        <Link className="brand" to="/">
          <img className="brand-logo" src={logoSrc} alt="" />
          UIChat Mira
        </Link>
        <ul className="menu">
          {content.nav.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                  to={item.href.slice(Math.max(appBase.length - 1, 0))}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          {configuredHeaderNav.map((group) => (
            <li
              className={`menu-dropdown${openMenu === group.label ? " open" : ""}`}
              key={group.label}
              onMouseEnter={() => setOpenMenu(group.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                type="button"
                className="menu-dropdown-trigger"
                aria-expanded={openMenu === group.label}
                onClick={() =>
                  setOpenMenu((value) =>
                    value === group.label ? null : group.label,
                  )
                }
              >
                {group.label}
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              <div className="menu-dropdown-panel">
                {group.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.label}
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </li>
          ))}
          <li
            className={`menu-dropdown${openMenu === "主题" ? " open" : ""}`}
            onMouseEnter={() => setOpenMenu("主题")}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              type="button"
              className="menu-dropdown-trigger"
              aria-expanded={openMenu === "主题"}
              onClick={() => setOpenMenu((value) => value === "主题" ? null : "主题")}
            >
              主题
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <div className="menu-dropdown-panel theme-menu-panel">
              {themeOptions.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  className={`theme-menu-option${theme.name === themeName ? " active" : ""}`}
                  aria-pressed={theme.name === themeName}
                  onClick={() => {
                    onSelectTheme(theme.name);
                    setOpenMenu(null);
                  }}
                >
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </li>
        </ul>
        <div className="nav-right">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label={mobileOpen ? "关闭导航" : "打开导航"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
          {mobileOpen ? (
            <MobileHeaderPanel
              onSearch={onSearch}
              onToggleTheme={onToggleTheme}
              darkMode={darkMode}
              themeName={themeName}
              onSelectTheme={onSelectTheme}
            />
          ) : null}
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={darkMode ? "切换到浅色模式" : "切换到暗黑模式"}
            title={darkMode ? "浅色模式" : "暗黑模式"}
          >
            {darkMode ? (
              <Sun size={17} aria-hidden="true" />
            ) : (
              <Moon size={17} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="site-search inline-flex items-center gap-2 rounded-md border border-hairline bg-canvas px-2.5 font-sans text-[13px] text-muted-soft"
            onClick={onSearch}
          >
            搜索{" "}
            <kbd className="rounded bg-surface-card px-1.5 py-px font-mono text-[10px]">
              Ctrl K
            </kbd>
          </button>
          <a
            className="text-link header-github"
            href={githubUrl}
            aria-label="GitHub"
            title="GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 3.167 2.763 5.234v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943"></path>
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
}
function HomePage() {
  return (
    <div className="site">
      <header>
        <div
          className="wrap hero-grid"
          style={{ paddingTop: 80, paddingBottom: 0 }}
        >
          <div>
            <h1 className="hero-title">
              从聊天出发，最终回到<span>「接住你」。</span>
            </h1>
            <p className="lede">
              UIChat Mira 是一个本地优先的个人 AI 工作台。聊天只是入口，模型、角色、知识、MCP、工具与微应用在同一个空间里协同工作。它不接管你，而是在你仍然掌握方向时，替你接住复杂。
            </p>
            <div className="hero-cta">
              <Button href={docHref("/about/origin")} kind="primary">
                开始认识 Mira
              </Button>
            </div>
            <div className="hero-meta">
              {content.meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <ChatMockup />
        </div>
      </header>
      <div className="hero-divider" aria-hidden="true">
        <div className="wrap">
          <div className="hero-divider-line" />
        </div>
      </div>
      <section id="philosophy">
        <div className="wrap">
          <PhilosophySpotlight />
        </div>
      </section>
      <CoreCapabilities />
      <section id="configure">
        <div
          className="wrap"
          style={{
            display: "grid",
            gridTemplateColumns: ".9fr 1.1fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div>
            <span className="eyebrow">配置示例</span>
            <h2>
              改个样式,
              <br />
              接好所有灾难。
            </h2>
            <p>一句「继续改」，引发的蓝屏几天代码丢失。这种体验不应被垄断。</p>
            <a className="text-link" href={docHref("/engineering/development")}>
              查看配置与运行文档 →
            </a>
          </div>
          <div className="code-card">
            {content.code.map((line, index) => (
              <div className="line" key={`${line}-${index}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ borderBottom: "none" }}>
        <div className="wrap">
          <div className="cta-band cta-band-coral">
            <h2>从本地的第一次对话开始。</h2>
            <p>安装只需要几分钟，你的第一个对话可以完全离线完成。</p>
            <div className="cta-actions">
              <Button href={docHref("/about/origin")} kind="coral">
                立即阅读
              </Button>
              <Button href={docHref("/engineering/development")} kind="ghost">
                阅读开发文档
              </Button>
            </div>
          </div>
        </div>
      </section>
      <AuthorIntro />
      <Footer />
    </div>
  );
}

function SearchOverlay({
  query,
  setQuery,
  onClose,
}: {
  query: string;
  setQuery: (value: string) => void;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return articleDocs.slice(0, 8);
    return articleDocs
      .filter((doc) =>
        [doc.title, doc.description, doc.group, doc.source]
          .join("\n")
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, 8);
  }, [query]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);
  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        Math.min(index + 1, Math.max(results.length - 1, 0)),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && results[activeIndex]) {
      navigate(results[activeIndex].path);
      onClose();
    }
  }
  return (
    <div
      className="search-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="搜索文档"
      >
        <div className="search-input-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文档..."
            aria-label="搜索文档"
          />
          <button
            type="button"
            className="search-close"
            onClick={onClose}
            aria-label="关闭搜索"
          >
            Esc
          </button>
        </div>
        <div className="search-results" role="listbox" aria-label="搜索结果">
          {results.length ? (
            results.map((doc, index) => (
              <Link
                className={`search-result${index === activeIndex ? " active" : ""}`}
                key={doc.path}
                to={doc.path}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="search-result-title">{doc.title}</span>
                <span className="search-result-meta">
                  {doc.group} · {doc.description}
                </span>
              </Link>
            ))
          ) : (
            <p className="search-empty">没有找到匹配的文档</p>
          )}
        </div>
        <div className="search-footer">
          <span>↑↓ 选择</span>
          <span>Enter 打开</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
}

function RoutedApp() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "claude";
    const saved = window.localStorage.getItem("mira-color-theme");
    return themeOptions.some((theme) => theme.name === saved)
      ? (saved as ThemeName)
      : "claude";
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("mira-theme");
    return saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.dataset.theme = themeName;
    window.localStorage.setItem("mira-color-theme", themeName);
  }, [themeName]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("mira-theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const openSearch = () => {
    setQuery("");
    setSearchOpen(true);
  };
  const closeSearch = () => setSearchOpen(false);
  const toggleTheme = () => setDarkMode((value) => !value);
  const navIsWide = location.pathname !== "/";
  return (
    <>
      <SiteHeader
        onSearch={openSearch}
        onToggleTheme={toggleTheme}
        darkMode={darkMode}
        themeName={themeName}
        onSelectTheme={setThemeName}
        wide={navIsWide}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<DocsLayout />}>
          <Route path="/sitemap" element={<DocPage path="/sitemap" />} />
          {siteAreas.map((area) => (
            <Route
              key={area.key}
              path={`/${area.key}`}
              element={<AreaPage area={area} />}
            />
          ))}
          {allDocs
            .filter((doc) => doc.path !== "/sitemap")
            .map((doc) => (
              <Route
                key={doc.path}
                path={doc.path}
                element={<DocPage path={doc.path} />}
              />
            ))}
        </Route>
        <Route path="*" element={<HomePage />} />
      </Routes>
      {searchOpen && (
        <SearchOverlay
          query={query}
          setQuery={setQuery}
          onClose={closeSearch}
        />
      )}
    </>
  );
}

export default function App() {
  return <RoutedApp />;
}

function ChatMockup() {
  const mockupRef = useRef<HTMLDivElement>(null);
  const [playCycle, setPlayCycle] = useState(-1);
  const [typedCounts, setTypedCounts] = useState([0, 0]);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);
  useEffect(() => {
    const node = mockupRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let wasVisible = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.45;
        if (visible && !wasVisible) setPlayCycle((cycle) => cycle + 1);
        wasVisible = visible;
      },
      { threshold: [0, 0.45, 0.7] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (playCycle < 0) return;
    if (reducedMotion) {
      setTypedCounts(
        chatMessages
          .filter((message) => message.speaker === "agent")
          .map((message) => totalSegmentLength(message.segments)),
      );
      return;
    }
    setTypedCounts([0, 0]);
    const timers: number[] = [];
    let cumulativeDelay = 640;
    chatMessages
      .filter((message) => message.speaker === "agent")
      .forEach((message, index) => {
        const totalChars = totalSegmentLength(message.segments);
        const step = Math.max(
          Math.round(chatTypeDurations[index] / Math.max(totalChars, 1)),
          32,
        );
        for (let visible = 1; visible <= totalChars; visible += 1) {
          const timeoutId = window.setTimeout(
            () => {
              setTypedCounts((current) => {
                const next = [...current];
                next[index] = visible;
                return next;
              });
            },
            cumulativeDelay + visible * step,
          );
          timers.push(timeoutId);
        }
        cumulativeDelay += chatTypeDurations[index] + 880;
      });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [playCycle, reducedMotion]);
  const agentMessages = chatMessages.filter(
    (message) => message.speaker === "agent",
  );
  const inputVisible =
    reducedMotion ||
    typedCounts.every(
      (count, index) =>
        count >= totalSegmentLength(agentMessages[index].segments),
    );
  const animationStyle = (index: number): CSSProperties => ({
    ["--chat-delay" as string]: `${index * 280}ms`,
  });
  return (
    <div
      ref={mockupRef}
      className={`chat-mockup${playCycle >= 0 ? " is-visible" : ""}`}
      data-play-cycle={playCycle}
      aria-label="Mira 对话示意"
    >
      <div className="bar">
        <div className="dots">
          <span />
          <span />
          <span />
        </div>
        <div className="model-switch">
          <span className="active">GPT-5.6</span>
          <span>Claude</span>
          <span>Ollama</span>
          <span>Qwen</span>
        </div>
      </div>
      <div className="bubble user" style={animationStyle(0)}>
        {chatMessages[0].segments[0].text}
      </div>
      {agentMessages.map((message, index) => {
        const visibleChars = typedCounts[index];
        const totalChars = totalSegmentLength(message.segments);
        const state = reducedMotion
          ? "done"
          : visibleChars > 0
            ? visibleChars >= totalChars
              ? "done"
              : "typing"
            : "pending";
        return (
          <div
            className={`bubble agent bubble-agent-${state}`}
            key={`agent-${index}`}
          >
            {renderTypedSegments(message.segments, visibleChars)}
            {state === "typing" ? (
              <span className="typing-caret" aria-hidden="true" />
            ) : null}
          </div>
        );
      })}
      <div
        className={`chat-input${inputVisible ? " chat-input-visible" : ""}`}
        style={animationStyle(3)}
      >
        &gt; 输入消息，或输入 / 调用工具…
      </div>
    </div>
  );
}

function DocNav({ current }: { current: string }) {
  return (
    <nav className="docnav">
      <h5>文档目录</h5>
      {docSections
        .filter((section) => section.key !== "navigation")
        .map((section) => (
          <div className="docnav-group" key={section.key}>
            <h5>{section.title}</h5>
            <ul>
              {section.docs.map((doc) => (
                <li key={doc.path}>
                  <Link
                    className={current === doc.path ? "active" : ""}
                    to={doc.path}
                  >
                    {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </nav>
  );
}
function directoryTitle(directory: string) {
  if (directoryLabels[directory]) return directoryLabels[directory];
  return directory
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    )
    .join(" / ");
}
function docsByDirectory(docs: Doc[]) {
  return [...new Set(docs.map((doc) => doc.directory))].map((directory) => ({
    directory,
    docs: docs.filter((doc) => doc.directory === directory).sort(compareDocs),
  }));
}
const blogCategories = [
  "产品手记",
  "工程现场",
  "共同思考",
  "Mira 来信",
  "开发者生活",
] as const;
function blogCategoryIcon(category: string): LucideIcon {
  if (category.includes("产品")) return Sparkles;
  if (category.includes("工程")) return Code2;
  if (category.includes("Mira")) return Sparkles;
  if (category.includes("开发者")) return Compass;
  if (category.includes("共同")) return Lightbulb;
  if (category.includes("模型")) return Cpu;
  return Compass;
}
type BlogMaintainer = {
  key: string;
  title: string;
  body: string;
  meta: readonly string[];
  avatar?: string;
};
const blogMaintainers: readonly BlogMaintainer[] = [
  {
    key: "tomz",
    title: "Tomz Dang",
    body: "UIChat Mira 的创造者与维护者。记录真实的产品判断、工程取舍和一路踩过的坑。",
    meta: ["产品手记", "工程现场"],
    avatar: authorAvatarUrl,
  },
  {
    key: "mira",
    title: "Mira",
    body: "AI 写作者，也是 UIChat Mira 的同行者。写技术、产品，以及人与 AI 之间尚未写完的故事。",
    meta: ["Mira 来信", "共同思考"],
    avatar: miraAvatarUrl,
  },
] as const;
function BlogHeaderVisual() {
  return (
    <div className="blog-header-visual" aria-hidden="true">
      <svg
        className="blog-header-orbit"
        viewBox="0 0 520 520"
        role="presentation"
      >
        <defs>
          <linearGradient id="blogOrbitWarm" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f4bb64" />
            <stop offset="55%" stopColor="#cc785c" />
            <stop offset="100%" stopColor="#cc785c" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="blogOrbitCool" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#8bd0bf" />
            <stop offset="100%" stopColor="#6b9edf" />
          </linearGradient>
        </defs>
        <circle className="orbit-track orbit-track-outer" cx="260" cy="260" r="202" />
        <circle className="orbit-track orbit-track-middle" cx="260" cy="260" r="165" />
        <circle className="orbit-track orbit-track-inner" cx="260" cy="260" r="132" />
        <circle className="orbit-segment orbit-segment-warm" cx="260" cy="260" r="176" />
        <circle className="orbit-segment orbit-segment-cool" cx="260" cy="260" r="208" />
        <circle className="orbit-segment orbit-segment-thin" cx="260" cy="260" r="147" />
        <g className="orbit-core-wrap">
          <circle className="orbit-core-glow" cx="260" cy="260" r="68" />
          <path
            className="orbit-atom orbit-atom-a"
            d="M260 190c25 0 46 31 46 70s-21 70-46 70-46-31-46-70 21-70 46-70Z"
          />
          <path
            className="orbit-atom orbit-atom-b"
            d="M194 240c18-18 55-10 83 17s35 65 17 83-55 10-83-17-35-65-17-83Z"
          />
          <path
            className="orbit-atom orbit-atom-c"
            d="M205 309c-9-24 12-55 47-70s71-8 80 16-12 55-47 70-71 8-80-16Z"
          />
          <circle className="orbit-dot" cx="260" cy="260" r="9" />
        </g>
      </svg>
      <span className="blog-header-noise blog-header-noise-a" />
      <span className="blog-header-noise blog-header-noise-b" />
    </div>
  );
}
function BlogThumbVisual({ category }: { category: string }) {
  const Icon = blogCategoryIcon(category);
  return (
    <div className="retro-thumb" aria-hidden="true">
      <div className="retro-thumb-grid" />
      <div className="retro-thumb-ring" />
      <div className="retro-thumb-core">
        <Icon size={42} strokeWidth={1.6} />
      </div>
    </div>
  );
}
function BlogMaintainersSection({
  items = blogMaintainers,
  className = "",
}: {
  items?: readonly BlogMaintainer[];
  className?: string;
}) {
  return (
    <section className={`blog-maintainers${className ? ` ${className}` : ""}`}>
      <div className="maintainer-grid">
        <div className="maintainer-stack-head">
          <h3>关于作者</h3>
        </div>
        {items.map((maintainer) => (
          <article className="maintainer-card" key={maintainer.key}>
            <div
              className={`maintainer-mark${maintainer.avatar ? " has-avatar" : ""}`}
              aria-hidden="true"
            >
              {maintainer.avatar ? (
                <img
                  alt=""
                  className="maintainer-avatar"
                  src={maintainer.avatar}
                />
              ) : (
                <span className="maintainer-mark-core" />
              )}
            </div>
            <div>
              <div className="maintainer-head">
                <h3>{maintainer.title}</h3>
                <div className="maintainer-meta">
                  {maintainer.meta.map((item) => (
                    <span className="maintainer-pill" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <p className="maintainer-body">{maintainer.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function AreaDocNav({ area, current }: { area: SiteArea; current: string }) {
  const groups = Object.values(
    area.docs.reduce<Record<string, Doc[]>>((result, doc) => {
      (result[doc.directory] ??= []).push(doc);
      return result;
    }, {}),
  ).map((docs) => docs.sort(compareDocs));
  const groupKeys = [...new Set(area.docs.map((doc) => doc.directory))];
  return (
    <nav className="docnav">
      <h5>目录</h5>
      <div className="docnav-group">
        <h5>
          <Link
            className={current === area.path ? "active" : ""}
            to={area.path}
          >
            {area.title}
          </Link>
        </h5>
      </div>
      {groupKeys.map((directory, index) => (
        <div className="docnav-group" key={directory || "root"}>
          <h5>{directory ? directoryTitle(directory) : "文档"}</h5>
          <ul>
            {groups[index]?.map((doc) => (
              <li key={doc.path}>
                <Link
                  className={current === doc.path ? "active" : ""}
                  to={doc.path}
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
function MobileDocsBar({ currentDoc, tocOpen, onMenu, onToc }: { currentDoc?: Doc; tocOpen: boolean; onMenu: () => void; onToc: () => void }) {
  const hasToc = Boolean(currentDoc?.headings.length);
  return <div className="docs-mobile-bar">
    <button type="button" onClick={onMenu} aria-label="打开文档菜单"><Menu size={15} aria-hidden="true" />菜单</button>
    <button type="button" onClick={onToc} disabled={!hasToc} aria-expanded={hasToc ? tocOpen : undefined} aria-controls={hasToc ? "mobile-page-toc" : undefined}>
      页面导航{tocOpen ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
    </button>
  </div>;
}
function MobileDocsDrawer({ area, current, onClose }: { area?: SiteArea; current: string; onClose: () => void }) {
  return <div className="mobile-docs-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="mobile-docs-drawer" aria-label="文档菜单"><div className="mobile-docs-drawer-head"><span>菜单</span><button type="button" onClick={onClose} aria-label="关闭菜单"><X size={18} aria-hidden="true" /></button></div>{area ? <AreaDocNav area={area} current={current} /> : <DocNav current={current} />}</aside></div>;
}
function MobilePageToc({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  return <div className="mobile-page-toc" id="mobile-page-toc"><div className="mobile-page-toc-head"><span>页面导航</span><button type="button" onClick={onClose} aria-label="关闭页面导航"><X size={17} aria-hidden="true" /></button></div><ul>{doc.headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`} onClick={onClose}>{heading.text}</a></li>)}</ul></div>;
}
function Toc({ doc, activeHeading }: { doc?: Doc; activeHeading: string }) {
  return doc && doc.headings.length > 0 ? (
    <aside className="toc">
      <h5>本页目录</h5>
      <ul>
        {doc.headings.map((heading) => (
          <li key={heading.id}>
            <a
              className={activeHeading === heading.id ? "active" : ""}
              href={`#${heading.id}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  ) : null;
}
function DocsLayout() {
  const location = useLocation();
  const currentDoc = allDocs.find((item) => item.path === location.pathname);
  const currentArea = siteAreas.find(
    (area) =>
      location.pathname === area.path ||
      location.pathname.startsWith(`${area.path}/`),
  );
  const isBlogArea = currentArea?.key === "blogs";
  const doc = currentDoc || allDocs[0];
  const [activeHeading, setActiveHeading] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileTocOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const nodes = currentDoc?.headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean) as HTMLElement[] | undefined;
    if (!nodes?.length) {
      setActiveHeading("");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveHeading(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px", threshold: [0, 1] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [currentDoc?.path]);
  return (
    <div className={`docs-app${isBlogArea ? " blog-app" : ""}`}>
      {!isBlogArea && <MobileDocsBar currentDoc={currentDoc} tocOpen={mobileTocOpen} onMenu={() => setMobileMenuOpen(true)} onToc={() => setMobileTocOpen((value) => !value)} />}
      {mobileMenuOpen && !isBlogArea ? <MobileDocsDrawer area={currentArea} current={location.pathname} onClose={() => setMobileMenuOpen(false)} /> : null}
      {mobileTocOpen && currentDoc && !isBlogArea ? <MobilePageToc doc={currentDoc} onClose={() => setMobileTocOpen(false)} /> : null}
      <div className={`docs-shell${isBlogArea ? " blog-shell" : ""}`}>
        {!isBlogArea &&
          (currentArea ? (
          <AreaDocNav area={currentArea} current={location.pathname} />
        ) : (
          <DocNav current={location.pathname} />
        ))}
        <main className={`doc-main${isBlogArea ? " blog-main" : ""}`}>
          <Outlet />
        </main>
        {!isBlogArea && <Toc doc={currentDoc} activeHeading={activeHeading} />}
      </div>
    </div>
  );
}
function BlogListPage({ area }: { area: SiteArea }) {
  const [activeCategory, setActiveCategory] = useState("全部");
  const tabs = ["全部", ...blogCategories, "归档"];
  const isArchiveView = activeCategory === "归档";
  const filteredDocs = (
    activeCategory === "全部"
      ? area.docs
      : area.docs.filter((doc) => doc.group === activeCategory)
  ).sort(compareBlogDocs);
  const timelineDocs = filteredDocs;
  const archiveDocs = area.docs
    .filter((doc) => doc.group === "归档")
    .sort(compareBlogDocs)
    .slice(0, 10);
  const visibleMaintainers = blogMaintainers;
  return (
    <>
      <div className="blog-list-page">
        <header className="blog-header">
          <div className="blog-header-copy">
            <h1>
              一个人和他的 AI，
              <br />
              做产品的地方。
            </h1>
            <p className="blog-lede">
              记录 UIChat Mira 的产品演进、工程实践，以及我们对人与 AI 关系的长期思考。
            </p>
          </div>
          <BlogHeaderVisual />
        </header>
        <div className="blog-category-bar" aria-label="博客分类">
          <div className="tab-row-wrap">
            <div className="tab-row">
              {tabs.map((tab) => (
                <button
                  type="button"
                  className={`tab${activeCategory === tab ? " active" : ""}`}
                  key={tab}
                  onClick={() => setActiveCategory(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        {isArchiveView ? (
          <section className="blog-archive-section">
            <div className="blog-archive-list">
              {archiveDocs.map((doc, index) => (
                <article className="blog-archive-item" key={doc.path}>
                  <span
                    aria-hidden="true"
                    className={`blog-archive-dot blog-archive-dot-${index % 5}`}
                  />
                  <h3>
                    <Link to={doc.path}>{doc.title}</Link>
                  </h3>
                  <span className="blog-archive-date">{doc.date}</span>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="blog-editorial-band">
            <div className="editorial-timeline">
              <div className="timeline-list">
                {timelineDocs.length ? (
                  timelineDocs.map((doc, index) => (
                    <article className="timeline-item" key={doc.path}>
                      <div className="timeline-content">
                        <div className="post-meta">
                          {doc.date ? <span>{doc.date}</span> : null}
                          {doc.date ? <span className="dot" /> : null}
                          <span>{doc.group}</span>
                        </div>
                        <h3>
                          <Link to={doc.path}>{doc.title}</Link>
                        </h3>
                        <p className="post-excerpt">{doc.description}</p>
                      </div>
                      {index < timelineDocs.length - 1 ? (
                        <span className="timeline-divider" aria-hidden="true" />
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="timeline-empty">这个分类下还没有文章。</p>
                )}
              </div>
            </div>
            <aside className="editorial-side">
              <BlogMaintainersSection
                className="blog-maintainers-inline"
                items={visibleMaintainers}
              />
            </aside>
          </section>
        )}
      </div>
      <Footer className="blog-footer" />
    </>
  );
}
function BlogPostPage({
  doc,
  previous,
  next,
}: {
  doc: Doc;
  previous?: Doc;
  next?: Doc;
}) {
  const html = useMemo(() => renderMarkdown(doc.source), [doc.source]);
  const [activeHeading, setActiveHeading] = useState("");
  const coverSrc = resolveCoverSource(doc);
  const authorAvatars = getDocAuthorAvatars(doc);
  const authorLabel = getDocAuthorLabel(doc);
  const signature = getDocSignature(doc);
  useEffect(() => {
    const nodes = doc.headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) {
      setActiveHeading("");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveHeading(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -65% 0px", threshold: [0, 1] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [doc.path]);
  return (
    <>
      <div className="blog-post-page">
        <article className="article-header">
          <div aria-hidden="true" className="article-header-visual">
            <img alt="" className="article-header-visual-image" src={coverSrc} />
          </div>
          <Link className="back-link" to="/blogs">
            ← 返回博客列表
          </Link>
          <h1>{doc.title}</h1>
          <div className="post-meta post-meta-article">
            <span className={`post-author-avatars post-author-avatars-${authorAvatars.length}`}>
              {authorAvatars.map((author) => (
                <img
                  alt=""
                  className="post-author-avatar"
                  key={author.name}
                  src={author.avatar}
                />
              ))}
            </span>
            <span>{authorLabel}</span>
            {doc.date ? <span className="dot" /> : null}
            {doc.date ? <span>{doc.date}</span> : null}
            {doc.readTime ? <span className="dot" /> : null}
            {doc.readTime ? <span>{doc.readTime}</span> : null}
            <span className="dot" />
            <span>{doc.group}</span>
          </div>
        </article>
        <div className="article-shell">
          <div className="article-body markdown blog-markdown">
            <div dangerouslySetInnerHTML={{ __html: html }} />
            <div className={`author-signature author-signature-${authorAvatars.length > 1 ? "duo" : "solo"} ${signature.accentClassName || ""}`}>
              <div className={`author-signature-avatars author-signature-avatars-${authorAvatars.length}`}>
                {authorAvatars.map((author) => (
                  <img
                    alt=""
                    className="author-signature-avatar"
                    key={author.name}
                    src={author.avatar}
                  />
                ))}
              </div>
              <div className="author-signature-copy">
                {authorAvatars.length === 1 && signature.showKicker ? (
                  <span className="author-signature-kicker">
                    {authorProfiles[getDocAuthors(doc)[0]].roleLabel}
                  </span>
                ) : null}
                <h4>{signature.title}</h4>
                {signature.body ? <p>{signature.body}</p> : null}
                {signature.links.length ? (
                  <div className="author-signature-links">
                    {signature.links.map((link) => (
                      <a href={link.href} key={link.label}>
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="post-nav">
              {previous ? (
                <Link to={previous.path}>
                  <span className="dir">← 上一篇</span>
                  <span className="to">{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link className="next" to={next.path}>
                  <span className="dir">下一篇 →</span>
                  <span className="to">{next.title}</span>
                </Link>
              ) : null}
            </div>
          </div>
          {doc.headings.length ? (
            <aside className="article-toc">
              <h5>本文目录</h5>
              <ul>
                {doc.headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      className={activeHeading === heading.id ? "active" : ""}
                      href={`#${heading.id}`}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
      <Footer className="blog-footer" />
    </>
  );
}
function AreaPage({ area }: { area: SiteArea }) {
  if (!area.docs.length)
    return (
      <div className="doc-not-found">
        <FileQuestion size={42} strokeWidth={1.5} aria-hidden="true" />
        <div className="doc-eyebrow">404 · EMPTY SECTION</div>
        <h1>页面不存在</h1>
        <p>这个目录已经创建，但还没有可展示的文档内容。</p>
        <Link className="btn btn-secondary" to="/">
          返回首页
        </Link>
      </div>
    );
  if (area.key === "blogs") return <BlogListPage area={area} />;
  const directoryGroups = docsByDirectory(area.docs);
  return (
    <>
      <div className="doc-eyebrow">SECTION · {area.key.toUpperCase()}</div>
      <div className="doc-title-block">
        <h1>{area.title}</h1>
        {area.description ? <p className="doc-lede">{area.description}</p> : null}
      </div>
      <div className="docs-sitemap-grid">
        <section className="area-overview-card">
          <div className="area-directory-groups">
            {directoryGroups.map((group) => {
              const firstDoc = group.docs[0];
              return (
                <div
                  className="area-directory-group"
                  key={group.directory || "root"}
                >
                  <h4>
                    {group.directory
                      ? directoryTitle(group.directory)
                      : area.title}
                  </h4>
                  <p>
                    {firstDoc?.description || `${group.docs.length} 篇文档`}
                  </p>
                  <ol>
                    {group.docs.map((doc) => (
                      <li key={doc.path}>
                        <Link to={doc.path}>
                          {doc.title}
                          <span>→</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
function DocPage({ path }: { path: string }) {
  const doc = allDocs.find((item) => item.path === path) || allDocs[0];
  const scopedArticleDocs = articleDocs
    .filter((item) => item.root === doc.root)
    .sort(compareDocs);
  const index = scopedArticleDocs.findIndex((item) => item.path === doc.path);
  const previous = index > 0 ? scopedArticleDocs[index - 1] : undefined;
  const next = index >= 0 ? scopedArticleDocs[index + 1] : undefined;
  const html = useMemo(() => renderMarkdown(doc.source), [doc.source]);
  if (doc.root === "blogs") {
    return <BlogPostPage doc={doc} previous={previous} next={next} />;
  }
  return (
    <>
      <div className="doc-eyebrow">
        {doc.group} · {String(doc.order).padStart(2, "0")}
      </div>
      <div className="doc-title-block">
        <h1>{doc.title}</h1>
        {doc.description ? <p className="doc-lede">{doc.description}</p> : null}
      </div>
      <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
      {path === "/sitemap" ? (
        <DynamicSitemap />
      ) : (
        <div className="page-nav">
          {previous ? (
            <Link to={previous.path}>
              <span className="dir">上一篇</span>
              <span className="to">← {previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="next" to={next.path}>
              <span className="dir">下一篇</span>
              <span className="to">{next.title} →</span>
            </Link>
          ) : null}
        </div>
      )}
    </>
  );
}
function DynamicSitemap() {
  return (
    <div className="docs-sitemap-grid">
      {visibleSections.map((section, index) => (
        <section key={section.key}>
          <div className="map-number">0{index + 1}</div>
          <div>
            <span className="map-key">{section.key.toUpperCase()}</span>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <ol>
              {section.docs.map((doc) => (
                <li key={doc.path}>
                  <Link to={doc.path}>
                    {doc.title}
                    <span>→</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
