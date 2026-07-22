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

type DownloadOption = {
  key: string;
  label: string;
  meta: string;
  url: string;
};

const latestReleaseUrl =
  "https://api.github.com/repos/dangjingtao/uichat-mira/releases/latest";
const fallbackReleaseUrl =
  "https://github.com/dangjingtao/uichat-mira/releases/latest";

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

  if (electronSetup) {
    options.push({
      key: "electron",
      label: "Windows 安装版",
      meta: "Electron · EXE · 推荐",
      url: electronSetup.browser_download_url,
    });
  }
  if (tauriNsis) {
    options.push({
      key: "tauri-nsis",
      label: "Tauri 安装版",
      meta: "轻量实验版 · EXE",
      url: tauriNsis.browser_download_url,
    });
  }
  if (tauriMsi) {
    options.push({
      key: "tauri-msi",
      label: "Tauri MSI",
      meta: "企业或批量部署",
      url: tauriMsi.browser_download_url,
    });
  }

  return {
    recommendedUrl: recommended?.browser_download_url || release?.html_url || fallbackReleaseUrl,
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
  if (value instanceof HTMLElement) value.textContent = version;
}

export default function ReleaseDownloadEnhancer() {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const downloads = useMemo(() => classifyDownloads(release), [release]);

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
    const original = document.querySelector<HTMLElement>(".release-download-button");
    if (!original?.parentElement) return;

    original.hidden = true;
    const host = document.createElement("div");
    host.className = "release-download-enhancer-root";
    original.parentElement.insertBefore(host, original.nextSibling);
    setMountNode(host);

    return () => {
      original.hidden = false;
      host.remove();
      setMountNode(null);
    };
  }, []);

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
        href={downloads.recommendedUrl}
        aria-label="下载 Mira Windows 推荐版"
      >
        <Download size={16} aria-hidden="true" />
        下载 Windows
      </a>
      <button
        className="btn btn-secondary release-download-toggle"
        type="button"
        aria-label="选择其他 Mira 下载版本"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open ? (
        <div className="release-download-menu" role="menu">
          {downloads.options.length ? (
            downloads.options.map((option) => (
              <a key={option.key} href={option.url} role="menuitem">
                <span>{option.label}</span>
                <small>{option.meta}</small>
              </a>
            ))
          ) : (
            <div className="release-download-empty">正在读取最新构建产物…</div>
          )}
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
