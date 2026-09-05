import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const statusPath = resolve(process.cwd(), "src/pages/docs/status/current.md");
const sourcePackagePath = resolve(
  process.cwd(),
  process.env.MIRA_SOURCE_PACKAGE || ".source/uichat-mira/package.json",
);
const sourceRoot = resolve(
  process.cwd(),
  process.env.MIRA_SOURCE_ROOT || ".source/uichat-mira",
);
const maxAgeDays = Number(process.env.CURRENT_STATUS_MAX_AGE_DAYS || "14");
const failures = [];
const warnings = [];

if (!existsSync(statusPath)) {
  failures.push("Current implementation page not found: " + statusPath);
}
if (!existsSync(sourcePackagePath)) {
  failures.push(
    "Mira dev source package not found: " + sourcePackagePath +
      ". Checkout dangjingtao/uichat-mira@dev and set MIRA_SOURCE_PACKAGE.",
  );
}

let raw = "";
let sourcePackage = {};
if (failures.length === 0) {
  raw = readFileSync(statusPath, "utf8");
  sourcePackage = JSON.parse(readFileSync(sourcePackagePath, "utf8"));
}

const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
if (raw && !frontmatterMatch) {
  failures.push("Current implementation page is missing frontmatter.");
}

const frontmatter = frontmatterMatch?.[1] || "";
const scalar = (key) => {
  const match = frontmatter.match(new RegExp("^" + key + ":\\s*(.+)$", "m"));
  if (!match) return "";
  return match[1].trim().replace(/^["']|["']$/g, "");
};

const sourceBranch = scalar("sourceBranch");
const sourceVersion = scalar("sourceVersion");
const sourceCommit = scalar("sourceCommit");
const verifiedAt = scalar("verifiedAt");
const actualVersion =
  typeof sourcePackage.version === "string" ? sourcePackage.version.trim() : "";

if (sourceBranch !== "dev") {
  failures.push('sourceBranch must be dev, got "' + (sourceBranch || "<missing>") + '".');
}
if (!actualVersion) {
  failures.push("Mira dev package.json does not contain a valid version.");
} else if (sourceVersion !== actualVersion) {
  failures.push(
    "Current implementation version is stale: docs=" +
      (sourceVersion || "<missing>") + ", dev=" + actualVersion + ".",
  );
}

const verifiedMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(verifiedAt);
if (!verifiedMatch) {
  failures.push('verifiedAt must use YYYY-MM-DD, got "' + (verifiedAt || "<missing>") + '".');
} else {
  const verifiedMs = Date.parse(verifiedAt + "T00:00:00Z");
  const ageDays = Math.floor((Date.now() - verifiedMs) / 86400000);
  if (ageDays < -1) {
    failures.push("verifiedAt is in the future: " + verifiedAt + ".");
  } else if (ageDays > maxAgeDays) {
    failures.push(
      "Current implementation verification is " + ageDays +
        " days old; maximum allowed age is " + maxAgeDays + " days.",
    );
  }
}

if (actualVersion && !raw.includes("当前根包版本为 \`" + actualVersion + "\`")) {
  failures.push("Current implementation body does not state root version " + actualVersion + ".");
}
if (verifiedMatch) {
  const zhDate =
    Number(verifiedMatch[1]) + " 年 " +
    Number(verifiedMatch[2]) + " 月 " +
    Number(verifiedMatch[3]) + " 日";
  if (!raw.includes(zhDate)) {
    failures.push("Current implementation body does not state verification date " + zhDate + ".");
  }
}

let actualCommit = "";
try {
  actualCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  warnings.push("Could not resolve checked-out Mira dev commit; sourceCommit audit skipped.");
}

if (sourceCommit && actualCommit && sourceCommit !== actualCommit) {
  warnings.push(
    "Mira dev advanced since the recorded audit commit: docs=" +
      sourceCommit.slice(0, 7) + ", dev=" + actualCommit.slice(0, 7) +
      ". Version and verification-age gates still decide freshness.",
  );
}

for (const warning of warnings) {
  console.warn("Current status freshness warning: " + warning);
}

if (failures.length > 0) {
  console.error("Current implementation freshness check failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log(
  "Current implementation freshness passed: dev version " + actualVersion +
    ", verified " + verifiedAt + ", max age " + maxAgeDays + " days.",
);
