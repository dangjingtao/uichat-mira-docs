import path from "node:path";
import { spawnSync } from "node:child_process";
import { ComicPipelineError } from "./common.mjs";
import { verifyComicBuild } from "./verify-lib.mjs";

function requireEnvironment(names, environment) {
  const missing = names.filter((name) => !String(environment[name] || "").trim());
  if (missing.length) throw new ComicPipelineError("R2 发布环境变量不完整。", missing.map((name) => `缺少 ${name}`));
}

function sanitizePrefix(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function runAws(args, environment, { planOnly = false, capture = false } = {}) {
  const printable = ["aws", ...args].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
  if (planOnly) {
    console.log(`[plan] ${printable}`);
    return { stdout: "" };
  }
  const result = spawnSync("aws", args, {
    env: environment,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error) throw new ComicPipelineError(`无法执行 AWS CLI：${printable}`, [result.error.message]);
  if (result.status !== 0) throw new ComicPipelineError(`AWS CLI 执行失败：${printable}`, [result.stderr || `exit ${result.status}`]);
  return { stdout: result.stdout || "" };
}

export async function publishComicToR2(buildDirectory, options = {}) {
  const buildDir = path.resolve(buildDirectory);
  const verification = await verifyComicBuild(buildDir);
  if (verification.errors.length) throw new ComicPipelineError("拒绝发布：构建目录校验失败。", verification.errors);
  const manifest = verification.manifest;
  const planOnly = Boolean(options.planOnly);
  if (!planOnly && !options.confirm) throw new ComicPipelineError("发布需要显式 --confirm；未执行外部操作。");

  const environment = {
    ...process.env,
    AWS_RETRY_MODE: process.env.AWS_RETRY_MODE || "standard",
    AWS_MAX_ATTEMPTS: process.env.AWS_MAX_ATTEMPTS || "5",
    AWS_EC2_METADATA_DISABLED: "true",
  };
  if (!planOnly) requireEnvironment(["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "R2_ACCOUNT_ID", "R2_BUCKET"], environment);

  const accountId = environment.R2_ACCOUNT_ID || "<R2_ACCOUNT_ID>";
  const bucket = environment.R2_BUCKET || "<R2_BUCKET>";
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const root = sanitizePrefix(options.prefix || environment.R2_COMICS_PREFIX || "mira/comics");
  const livePrefix = `${root}/${manifest.id}/current`;
  const stageId = `${manifest.edition}-${manifest.releaseFingerprint.slice(0, 12)}-${Date.now()}`;
  const stagingPrefix = `${root}/.staging/${manifest.id}/${stageId}`;
  const liveUri = `s3://${bucket}/${livePrefix}/`;
  const stagingUri = `s3://${bucket}/${stagingPrefix}/`;
  const common = ["--endpoint-url", endpoint, "--only-show-errors"];

  console.log(`R2 staging: ${stagingPrefix}`);
  console.log(`R2 live:    ${livePrefix}`);

  runAws(["s3", "sync", `${buildDir}${path.sep}`, stagingUri, "--delete", "--cache-control", "private, max-age=0, no-store", ...common], environment, { planOnly });
  const stageDiff = runAws(["s3", "sync", `${buildDir}${path.sep}`, stagingUri, "--delete", "--dryrun", "--size-only", ...common], environment, { planOnly, capture: true });
  if (!planOnly && stageDiff.stdout.trim()) throw new ComicPipelineError("R2 staging 与本地构建不一致。", [stageDiff.stdout]);

  runAws([
    "s3", "sync", stagingUri, liveUri,
    "--exclude", "manifest.json",
    "--exclude", "report.json",
    "--cache-control", "public, max-age=31536000, immutable",
    ...common,
  ], environment, { planOnly });
  runAws([
    "s3", "cp", `${stagingUri}report.json`, `${liveUri}report.json`,
    "--content-type", "application/json; charset=utf-8",
    "--cache-control", "public, max-age=60, must-revalidate",
    ...common,
  ], environment, { planOnly });
  // manifest 是版本切换点：所有新资源存在后才更新。
  runAws([
    "s3", "cp", `${stagingUri}manifest.json`, `${liveUri}manifest.json`,
    "--content-type", "application/json; charset=utf-8",
    "--cache-control", "public, max-age=60, must-revalidate",
    ...common,
  ], environment, { planOnly });
  // manifest 切换后再删除旧资源，最终使正式目录与 staging 完全一致。
  runAws(["s3", "sync", stagingUri, liveUri, "--delete", "--size-only", ...common], environment, { planOnly });
  const liveDiff = runAws(["s3", "sync", stagingUri, liveUri, "--delete", "--dryrun", "--size-only", ...common], environment, { planOnly, capture: true });
  if (!planOnly && liveDiff.stdout.trim()) throw new ComicPipelineError("R2 正式目录提升后仍有差异。", [liveDiff.stdout]);

  if (!options.keepStaging) runAws(["s3", "rm", stagingUri, "--recursive", ...common], environment, { planOnly });
  const publicBase = String(environment.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  return {
    livePrefix,
    stagingPrefix,
    manifestUrl: publicBase ? `${publicBase}/${livePrefix}/manifest.json` : null,
    planOnly,
  };
}
