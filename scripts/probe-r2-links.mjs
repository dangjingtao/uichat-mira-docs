import { spawnSync } from "node:child_process";

const releaseUrl = "https://api.github.com/repos/dangjingtao/uichat-mira/releases/latest";
const r2Base = "https://assets.tomz.io/mira/latest";

function r2Url(asset) {
  const encodedName = new URL(asset.browser_download_url).pathname.split("/").pop();
  return `${r2Base}/${encodedName}`;
}

function probe(url) {
  const result = spawnSync(
    "curl",
    [
      "--silent",
      "--show-error",
      "--location",
      "--head",
      "--output",
      "/dev/null",
      "--write-out",
      "%{http_code}",
      url,
    ],
    { encoding: "utf8" },
  );
  return {
    status: Number(result.stdout.trim() || 0),
    error:
      result.status === 0
        ? null
        : result.stderr.trim() || `curl exit ${result.status}`,
  };
}

const response = await fetch(releaseUrl, {
  headers: {
    Accept: "application/vnd.github+json",
    "User-Agent": "uichat-mira-docs-r2-probe",
  },
});
if (!response.ok) {
  throw new Error(`GitHub release API returned ${response.status}`);
}

const release = await response.json();
const assets = (release.assets || []).filter(
  (asset) => !/\.blockmap$/i.test(asset.name),
);
const electron = assets.find(
  (asset) => /electron/i.test(asset.name) && /setup.*\.exe$/i.test(asset.name),
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
const recommended = electron || tauriNsis || tauriMsi || fallback;

const entries = [
  ["recommended", recommended],
  ["electron", electron],
  ["tauri-nsis", tauriNsis],
  ["tauri-msi", tauriMsi],
].map(([key, asset]) => {
  if (!asset) {
    return { key, asset: null, url: null, status: 0, error: "asset not found" };
  }
  const url = r2Url(asset);
  return { key, asset: asset.name, url, ...probe(url) };
});

console.log("R2_PROBE_REPORT_START");
console.log(
  JSON.stringify(
    {
      tag: release.tag_name,
      release: release.html_url,
      entries,
    },
    null,
    2,
  ),
);
console.log("R2_PROBE_REPORT_END");

if (entries.some((entry) => entry.status < 200 || entry.status >= 400)) {
  process.exitCode = 1;
}
