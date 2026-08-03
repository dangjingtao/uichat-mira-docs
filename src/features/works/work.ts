export const workRoute = "/works/yuguang-vol-1";
export const progressKey = "mira:works:yuguang-vol-1:progress";
export const comicAssetRoot = "https://assets.tomz.io/mira/comics/yuguang-vol-1/current/";
export const manifestAssetUrl = `${comicAssetRoot}manifest.json`;
export const coverFallbackUrl = `${import.meta.env.BASE_URL}works-data/yuguang-vol-1/cover.webp`;

export const pageNumbers = Array.from({ length: 32 }, (_, index) => index + 1);

export type PageNumber = number;
export type ComicSource = {
  width: number;
  height: number;
  src: string;
  bytes: number;
  sha256: string;
};
export type ComicOriginal = {
  width: number;
  height: number;
  aspectRatio: number;
  bytes: number;
  sha256: string;
};
export type ComicPage = {
  number: number;
  original: ComicOriginal;
  sources: ComicSource[];
};
export type ComicManifest = {
  schemaVersion: number;
  pipelineVersion: string;
  id: string;
  edition: string;
  title: string;
  subtitle: string;
  expectedPages: number;
  availablePages: number;
  missingPages: number[];
  readingDirection: "ltr" | "rtl";
  releaseFingerprint: string;
  cover: {
    original: ComicOriginal;
    sources: ComicSource[];
  };
  pages: ComicPage[];
};

export const work = {
  id: "yuguang-vol-1",
  title: "余光·上",
  subtitle: "第一次讲话",
  authors: "Tomz Dang × Mira",
  edition: "upper-final-2026-08-03",
  status: "正式发行",
  description:
    "男人第一次走进那家小店。上册收录封面与 32 页正文，以他的目光讲述第一次讲话之前与之后。",
  missingPages: [] as const,
  pageCount: pageNumbers.length,
};

export function comicAssetUrl(path: string) {
  return new URL(path, comicAssetRoot).toString();
}

export function pickComicSource(sources: ComicSource[], targetWidth: number) {
  const ordered = [...sources].sort((left, right) => left.width - right.width);
  return ordered.find((source) => source.width >= targetWidth) ?? ordered.at(-1) ?? null;
}

export function comicSrcSet(sources: ComicSource[]) {
  return [...sources]
    .sort((left, right) => left.width - right.width)
    .map((source) => `${comicAssetUrl(source.src)} ${source.width}w`)
    .join(", ");
}

export function readSavedPage() {
  if (typeof window === "undefined") return 1;
  const saved = Number(window.localStorage.getItem(progressKey));
  return pageNumbers.includes(saved) ? saved : 1;
}
