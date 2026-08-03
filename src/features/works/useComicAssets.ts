import { useEffect, useState } from "react";
import {
  assetRoot,
  manifestAssetUrl,
  type ComicManifest,
} from "./work";

type AssetState = {
  manifest: ComicManifest | null;
  spriteUrl: string;
  loading: boolean;
  error: string;
};

function decodeBase64(value: string) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function useComicAssets(active = true): AssetState {
  const [state, setState] = useState<AssetState>({
    manifest: null,
    spriteUrl: "",
    loading: active,
    error: "",
  });

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let spriteUrl = "";

    async function load() {
      try {
        const manifestResponse = await fetch(manifestAssetUrl, { signal: controller.signal });
        if (!manifestResponse.ok) throw new Error(`manifest ${manifestResponse.status}`);
        const manifest = await manifestResponse.json() as ComicManifest;
        const chunks = await Promise.all(manifest.chunks.map(async (path) => {
          const response = await fetch(`${assetRoot}${path}`, { signal: controller.signal });
          if (!response.ok) throw new Error(`chunk ${response.status}`);
          return response.text();
        }));
        const spriteBytes = decodeBase64(chunks.join(""));
        spriteUrl = URL.createObjectURL(new Blob([spriteBytes], { type: "image/webp" }));
        setState({ manifest, spriteUrl, loading: false, error: "" });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ manifest: null, spriteUrl: "", loading: false, error: "画册资源加载失败，请刷新后重试。" });
      }
    }

    void load();
    return () => {
      controller.abort();
      if (spriteUrl) URL.revokeObjectURL(spriteUrl);
    };
  }, [active]);

  return state;
}
