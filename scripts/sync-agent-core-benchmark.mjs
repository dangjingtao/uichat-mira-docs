import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const desktopRoot = path.resolve(
  process.env.MIRA_DESKTOP_ROOT || path.join(repoRoot, "..", "mira-desktop"),
);
const caseSetPath = path.join(
  desktopRoot,
  "docs/development/agent-core-benchmark-v0.1-case-set.json",
);
const publicResultPath = path.join(
  desktopRoot,
  "docs/development/benchmark-artifacts/formal-core-v0.1-2026-10-04/public-result.json",
);
const outPath = path.join(
  repoRoot,
  "src/data/agent-core-benchmark/core-v0.1.json",
);

for (const source of [caseSetPath, publicResultPath]) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing canonical benchmark source: ${source}`);
  }
}

const caseSet = JSON.parse(fs.readFileSync(caseSetPath, "utf8"));
const result = JSON.parse(fs.readFileSync(publicResultPath, "utf8"));
const sourceCommit = execFileSync(
  "git",
  ["-C", desktopRoot, "rev-parse", "HEAD"],
  { encoding: "utf8" },
).trim();

if (caseSet.caseSetVersion !== result.caseSetVersion) {
  throw new Error(
    `case-set/result mismatch: ${caseSet.caseSetVersion} != ${result.caseSetVersion}`,
  );
}
if (String(caseSet.benchmarkVersion) !== String(result.benchmarkVersion)) {
  throw new Error(
    `benchmark version mismatch: ${caseSet.benchmarkVersion} != ${result.benchmarkVersion}`,
  );
}

const publicCases = caseSet.cases.map((item) => ({
  id: item.id,
  title: item.title,
  difficulty: item.difficulty,
  calibrationCluster: item.calibrationCluster,
  calibrationRationale: item.calibrationRationale,
  scorerOwnership: item.scorerOwnership,
  timing: item.timing,
  public: item.public,
  officialParticipation: item.officialParticipation,
}));

const snapshot = {
  schemaVersion: "mira-agent-core-benchmark-site-snapshot/0.1",
  source: {
    repository: "uichat-mira/mira-desktop",
    commit: sourceCommit,
    contractPath: "docs/development/agent-core-benchmark-v0.1.md",
    caseSetPath: "docs/development/agent-core-benchmark-v0.1-case-set.json",
    publicResultPath:
      "docs/development/benchmark-artifacts/formal-core-v0.1-2026-10-04/public-result.json",
    formalReportPath:
      "docs/development/benchmark-artifacts/formal-core-v0.1-2026-10-04/report.md",
  },
  benchmarkVersion: caseSet.benchmarkVersion,
  caseSetVersion: caseSet.caseSetVersion,
  status: caseSet.status,
  selectionSummary: caseSet.selectionSummary,
  timingPolicy: {
    status: caseSet.timingPolicy.status,
    hostPolicy: caseSet.timingPolicy.hostPolicy,
    successBoundaryRule: caseSet.timingPolicy.successBoundaryRule,
    softFormula: caseSet.timingPolicy.softFormula,
    hardFormula: caseSet.timingPolicy.hardFormula,
    varianceRule: caseSet.timingPolicy.varianceRule,
  },
  judgeInputContract: caseSet.judgeInputContract,
  officialAggregation: caseSet.officialAggregation,
  cases: publicCases,
  result,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log(
  `Synced Agent Core Benchmark ${snapshot.caseSetVersion} from ${snapshot.source.repository}@${sourceCommit}`,
);
