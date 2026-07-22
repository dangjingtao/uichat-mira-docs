import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Download, ExternalLink } from "lucide-react";

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

function r2AssetUrl(asset: ReleaseAsset) {
  return `${r2PublicBaseUrl}/${encodeURIComponent(asset.name)}`;
}

function classifyDownloads(release: GitHubRelease | null) {
  const assets = (release?.assets || []).filter(
    (asset) => !/\.blockmap$/i.test(asset.name),
  );

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
      r2Url: r2AssetUrl(asset),
    });
  };

  pushOption("electron", "Windows 安装版", "Electron · EXE · 推荐", electronSetup);
  pushOption("tauri-nsis", "Tauri 安装版", "轻量实验版 · EXE", tauriNsis);
  pushOption("tauri-msi", "Tauri MSI", "企业或批量部署", tauriMsi);

  return {
    recommendedGithubUrl:
      recommended?.browser_download_url || release?.html_url || fallbackReleaseUrl,
    recommendedR2Url: recommended ? r2AssetUrl(recommended) : fallbackReleaseUrl,
    options,
  };
}

function syncDisplayedVersion(tagName?: string) {
  if (!tagName) return;
  const version = tagName.replace(/^v/i, "");
  const labels = Array.from(
    document.querySelectorAll<HTMLElement>(".author-intro-card span"),
  );
  const versionLabel = labels.find(
    (node) => node.textContent?.trim() === "产品版本",
  );
  const value = versionLabel?.previousElementSibling;
  if (value instanceof HTMLElement && value.textContent?.trim() !== version) {
    value.textContent = version;
  }
}

export default function ReleaseDownloadEnhancer() {
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
      .then((latest) => {
        setRelease(latest);
        syncDisplayedVersion(latest.tag_name);
      })
      .catch(() => {
        // Keep the stable release-page fallback when GitHub is unavailable.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let original: HTMLElement | null = null;
    let host: HTMLElement | null = null;

    const attach = () => {
      syncDisplayedVersion(release?.tag_name);
      const next = document.querySelector<HTMLElement>(".release-download-button");
      const parent = next?.parentElement;
      if (!next || !parent) {
        if (host && !host.isConnected) {
          host = null;
          original = null;
          setMountNode(null);
        }
        return;
      }
      if (next === original && host?.isConnected) return;

      if (original) original.style.removeProperty("display");
      host?.remove();

      original = next;
      // `.btn { display: inline-flex }` overrides the browser's `[hidden]` rule,
      // so hide the legacy button explicitly instead of relying on `hidden`.
      original.style.setProperty("display", "none", "important");
      host = document.createElement("div");
      host.className = "release-download-enhancer-root";
      parent.insertBefore(host, original.nextSibling);
      setMountNode(host);
    };

    attach();
    const root = document.getElementById("root");
    const observer = new MutationObserver(attach);
    if (root) observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (original) original.style.removeProperty("display");
      host?.remove();
      setMountNode(null);
    };
  }, [release?.tag_name]);

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
