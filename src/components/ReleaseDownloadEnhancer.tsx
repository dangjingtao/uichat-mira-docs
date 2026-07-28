import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Download, ExternalLink } from "lucide-react";
import { useLocation } from "react-router-dom";

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubRelease = {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
};

type DownloadSource = "github" | "r2";

type DownloadOption = {
  key: string;
  label: string;
  meta: string;
  githubUrl: string;
  r2Url: string;
};

const latestReleaseUrl =
  "https://api.github.com/repos/dangjingtao/uichat-mira/releases/latest";
const fallbackReleaseUrl =
  "https://github.com/dangjingtao/uichat-mira/releases/latest";
const r2PublicBaseUrl = "https://assets.tomz.io/mira/latest";
const mobileGithubApkUrl =
  "https://github.com/dangjingtao/uichat-mira-mobile/releases/download/dev-latest/uichat-mira-mobile-dev.apk";
const mobileR2ApkUrl =
  "https://assets.tomz.io/mira/mobile/dev/latest/uichat-mira-mobile-dev.apk";

function r2AssetName(asset: ReleaseAsset, releaseTag: string) {
  const version = releaseTag.replace(/^v/i, "");

  // GitHub release uploads normalize spaces in asset basenames to dots, while
  // the R2 sync keeps the original package filenames. Reconstruct only the
  // known product-name portion and leave version/extension dots untouched.
  if (/^electron-win_/i.test(asset.name) && version) {
    const githubSuffix = `UIChat.Mira.Setup.${version}.exe`;
    const r2Suffix = `UIChat Mira Setup ${version}.exe`;
    if (asset.name.endsWith(githubSuffix)) {
      return `${asset.name.slice(0, -githubSuffix.length)}${r2Suffix}`;
    }
  }

  if (/^tauri-windows_/i.test(asset.name)) {
    return asset.name.replace(
      /(_tauri_(?:nsis|msi)_)UIChat\.Mira_/i,
      "$1UIChat Mira_",
    );
  }

  return asset.name;
}

function r2AssetUrl(asset: ReleaseAsset, releaseTag: string) {
  return `${r2PublicBaseUrl}/${encodeURIComponent(r2AssetName(asset, releaseTag))}`;
}

function classifyDownloads(release: GitHubRelease | null) {
  const assets = (release?.assets || []).filter(
    (asset) => !/\.blockmap$/i.test(asset.name),
  );
  const releaseTag = release?.tag_name || "";

  const electronSetup = assets.find(
    (asset) =>
      /electron/i.test(asset.name) && /setup.*\.exe$/i.test(asset.name),
  );
  const tauriNsis = assets.find(
    (asset) =>
      /tauri/i.test(asset.name) &&
      /(?:nsis|setup)/i.test(asset.name) &&
      /\.exe$/i.test(asset.name),
  );
  const tauriMsi = assets.find(
    (asset) => /tauri/i.test(asset.name) && /\.msi$/i.test(asset.name),
  );
  const fallback = assets.find((asset) => /\.(exe|msi)$/i.test(asset.name));

  const recommended = electronSetup || tauriNsis || tauriMsi || fallback;
  const options: DownloadOption[] = [];

  const pushOption = (
    key: string,
    label: string,
    meta: string,
    asset?: ReleaseAsset,
  ) => {
    if (!asset) return;
    options.push({
      key,
      label,
      meta,
      githubUrl: asset.browser_download_url,
      r2Url: r2AssetUrl(asset, releaseTag),
    });
  };

  pushOption("electron", "Windows 安装版", "Electron · EXE · 推荐", electronSetup);
  pushOption("tauri-nsis", "Tauri 安装版", "轻量实验版 · EXE", tauriNsis);
  pushOption("tauri-msi", "Tauri MSI", "企业或批量部署", tauriMsi);
  options.push({
    key: "android-dev",
    label: "Android 测试版",
    meta: "React Native · APK · dev",
    githubUrl: mobileGithubApkUrl,
    r2Url: mobileR2ApkUrl,
  });

  return {
    recommendedGithubUrl:
      recommended?.browser_download_url || release?.html_url || fallbackReleaseUrl,
    recommendedR2Url: recommended
      ? r2AssetUrl(recommended, releaseTag)
      : fallbackReleaseUrl,
    options,
  };
}

export default function ReleaseDownloadEnhancer() {
  const location = useLocation();
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<DownloadSource>("github");

  const downloads = useMemo(() => classifyDownloads(release), [release]);
  const recommendedUrl =
    source === "r2"
      ? downloads.recommendedR2Url
      : downloads.recommendedGithubUrl;

  useEffect(() => {
    const controller = new AbortController();
    fetch(latestReleaseUrl, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
        return response.json() as Promise<GitHubRelease>;
      })
      .then(setRelease)
      .catch(() => {
        // Keep the stable latest-release fallback when GitHub is unavailable.
      });
    return () => controller.abort();
  }, []);

  // Mount exactly once for each rendered route. The previous implementation
  // watched the whole React tree with MutationObserver, which could trigger a
  // feedback loop because attaching the portal mutated the same tree it watched.
  useLayoutEffect(() => {
    const original = document.querySelector<HTMLElement>(".release-download-button");
    const parent = original?.parentElement;

    if (!original || !parent) {
      setMountNode(null);
      return;
    }

    original.style.setProperty("display", "none", "important");
    const host = document.createElement("div");
    host.className = "release-download-enhancer-root";
    parent.insertBefore(host, original.nextSibling);
    setMountNode(host);

    return () => {
      original.style.removeProperty("display");
      host.remove();
      setMountNode(null);
    };
  }, [location.pathname]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".release-download-split")) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!mountNode) return null;

  return createPortal(
    <div className={`release-download-split${open ? " is-open" : ""}`}>
      <a
        className="btn btn-secondary release-download-main"
        href={recommendedUrl}
        aria-label={`下载 Mira Windows 推荐版（${source === "r2" ? "R2 镜像" : "GitHub"}）`}
      >
        <Download size={16} aria-hidden="true" />
        下载 Windows
      </a>
      <button
        className="btn btn-secondary release-download-toggle"
        type="button"
        aria-label="选择下载来源和其他 Mira 安装包"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {open ? (
        <div className="release-download-menu" role="menu">
          <div className="release-download-source" aria-label="下载来源">
            <span>下载来源</span>
            <div className="release-download-source-options">
              <button
                type="button"
                className={source === "github" ? "active" : ""}
                aria-pressed={source === "github"}
                onClick={() => setSource("github")}
              >
                GitHub
              </button>
              <button
                type="button"
                className={source === "r2" ? "active" : ""}
                aria-pressed={source === "r2"}
                onClick={() => setSource("r2")}
              >
                R2 镜像
              </button>
            </div>
          </div>

          <div className="release-download-options">
            {downloads.options.length ? (
              downloads.options.map((option) => (
                <a
                  key={option.key}
                  href={source === "r2" ? option.r2Url : option.githubUrl}
                  role="menuitem"
                >
                  <span>{option.label}</span>
                  <small>
                    {option.meta} · {source === "r2" ? "R2 镜像" : "GitHub"}
                  </small>
                </a>
              ))
            ) : (
              <div className="release-download-empty">正在读取最新构建产物…</div>
            )}
          </div>

          <a
            className="release-download-all"
            href={release?.html_url || fallbackReleaseUrl}
            target="_blank"
            rel="noreferrer"
            role="menuitem"
          >
            <span>查看所有版本</span>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </div>,
    mountNode,
  );
}
