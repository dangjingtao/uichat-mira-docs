import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const verifier = fileURLToPath(new URL("./verify-current-status.mjs", import.meta.url));

function todayFixture() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  return {
    iso: [
      year,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-"),
    zh: year + " 年 " + month + " 月 " + day + " 日",
  };
}

function runVerifier({ sourceVersion = "0.100.1", actualVersion = "0.101.0", policy = "" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "mira-current-status-"));
  const statusPath = join(root, "src/pages/docs/status/current.md");
  const sourcePackagePath = join(root, ".source/uichat-mira/package.json");
  const { iso, zh } = todayFixture();

  mkdirSync(dirname(statusPath), { recursive: true });
  mkdirSync(dirname(sourcePackagePath), { recursive: true });

  const sourceVersionLine = sourceVersion
    ? "sourceVersion: " + sourceVersion + "\n"
    : "";
  writeFileSync(
    statusPath,
    [
      "---",
      "title: 当前实现快照",
      "sourceBranch: dev",
      sourceVersionLine.trimEnd(),
      "sourceCommit: abcdef1234567890",
      "verifiedAt: " + iso,
      "---",
      "",
      "# 当前实现快照",
      "",
      "本页核对日期为 " + zh + "。",
      "",
      "当前根包版本为 \`" + (sourceVersion || actualVersion) + "\`。",
      "",
    ].filter(Boolean).join("\n"),
  );
  writeFileSync(
    sourcePackagePath,
    JSON.stringify({ name: "ui-chat-mira", version: actualVersion }),
  );

  return spawnSync(process.execPath, [verifier], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "true",
      GITHUB_ACTIONS: "true",
      MIRA_SOURCE_PACKAGE: sourcePackagePath,
      MIRA_SOURCE_ROOT: join(root, ".source/missing-root"),
      ...(policy ? { CURRENT_STATUS_FRESHNESS_POLICY: policy } : {}),
    },
  });
}

test("scheduled warning mode reports version drift without failing", () => {
  const result = runVerifier({ policy: "warn" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Current implementation version is stale/);
  assert.match(result.stdout, /::warning title=Current implementation snapshot is stale::/);
  assert.match(result.stdout, /completed with non-blocking warnings/);
});

test("strict mode still fails when the snapshot is stale", () => {
  const result = runVerifier();

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Current implementation freshness check failed/);
  assert.match(result.stderr, /Current implementation version is stale/);
});

test("warning mode still fails for malformed snapshot metadata", () => {
  const result = runVerifier({ sourceVersion: "", actualVersion: "0.101.0", policy: "warn" });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /sourceVersion is missing/);
});
