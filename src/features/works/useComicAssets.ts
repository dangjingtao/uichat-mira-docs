import { useEffect, useState } from "react";
import {
  comicAssetUrl,
  manifestAssetUrl,
  pickComicSource,
  type ComicManifest,
} from "./work";

type AssetState = {
  manifest: ComicManifest | null;
  coverUrl: string;
  loading: boolean;
  error: string;
};

export function useComicAssets(active = true): AssetState {
  const [state, setState] = useState<AssetState>({
    manifest: null,
    coverUrl: "",
    loading: active,
    error: "",
  });

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(manifestAssetUrl, {
          signal: controller.signal,
          cache: "no-cache",
        });
        if (!response.ok) throw new Error(`manifest ${response.status}`);
        const manifest = await response.json() as ComicManifest;
        if (manifest.id !== "yuguang-vol-1" || manifest.availablePages !== 32) {
          throw new Error("unexpected manifest");
        }
        const cover = pickComicSource(manifest.cover.sources, 960);
        if (!cover) throw new Error("cover missing");
        setState({
          manifest,
          coverUrl: comicAssetUrl(cover.src),
          loading: false,
          error: "",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          manifest: null,
          coverUrl: "",
          loading: false,
          error: "画册资源加载失败，请刷新后重试。",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [active]);

  return state;
}
