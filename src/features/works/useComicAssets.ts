import { publishedManifest } from "./published-manifest";
import {
  comicAssetUrl,
  pickComicSource,
  type ComicManifest,
} from "./work";

type AssetState = {
  manifest: ComicManifest | null;
  coverUrl: string;
  loading: boolean;
  error: string;
};

const cover = pickComicSource(publishedManifest.cover.sources, 960);
const publishedAssets: AssetState = {
  manifest: publishedManifest,
  coverUrl: cover ? comicAssetUrl(cover.src) : "",
  loading: false,
  error: cover ? "" : "画册封面资源不完整。",
};

const inactiveAssets: AssetState = {
  manifest: null,
  coverUrl: "",
  loading: false,
  error: "",
};

export function useComicAssets(active = true): AssetState {
  return active ? publishedAssets : inactiveAssets;
}
