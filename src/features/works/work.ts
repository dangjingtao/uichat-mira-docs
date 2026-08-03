export const workRoute = "/works/yuguang-vol-1";
export const progressKey = "mira:works:yuguang-vol-1:progress";
export const assetRoot = `${import.meta.env.BASE_URL}works-data/yuguang-vol-1/`;
export const coverAssetUrl = `${assetRoot}cover.webp`;
export const manifestAssetUrl = `${assetRoot}manifest.json`;

export const pageNumbers = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 23, 24, 25, 26, 27, 28, 29, 30,
] as const;

export type PageNumber = (typeof pageNumbers)[number];
export type ComicSpritePage = {
  number: PageNumber;
  col: number;
  row: number;
};
export type ComicManifest = {
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
  chunks: string[];
  pages: ComicSpritePage[];
  missingPages: number[];
};

export const work = {
  id: "yuguang-vol-1",
  title: "余光·上",
  subtitle: "第一次讲话",
  authors: "Tomz Dang × Mira",
  edition: "experiment-2026-08-03",
  status: "实验预览",
  description:
    "男人第一次走进那家小店。当前实验版收录 29 张已完成页面，保留原页码，第 22 页尚未完成。",
  missingPages: [22] as const,
  pageCount: pageNumbers.length,
};

export function readSavedPage() {
  if (typeof window === "undefined") return 1;
  const saved = Number(window.localStorage.getItem(progressKey));
  return pageNumbers.includes(saved as PageNumber) ? saved : 1;
}
