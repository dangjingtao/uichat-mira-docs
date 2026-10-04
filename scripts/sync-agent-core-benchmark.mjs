import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frozenSourceCommit = "bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0";
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

function resolveGitDir(repositoryRoot) {
  const dotGit = path.join(repositoryRoot, ".git");
  const stat = fs.statSync(dotGit);
  if (stat.isDirectory()) return dotGit;

  const pointer = fs.readFileSync(dotGit, "utf8").trim();
  const match = /^gitdir:\s+(.+)$/.exec(pointer);
  if (!match) {
    throw new Error(`Unsupported .git pointer in ${repositoryRoot}`);
  }
  return path.resolve(repositoryRoot, match[1]);
}

function readGitHeadCommit(repositoryRoot) {
  const gitDir = resolveGitDir(repositoryRoot);
  const head = fs.readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();

  if (/^[0-9a-f]{40}$/i.test(head)) return head.toLowerCase();

  const symbolic = /^ref:\s+(.+)$/.exec(head);
  if (!symbolic) {
    throw new Error(`Unsupported Git HEAD in ${repositoryRoot}: ${head}`);
  }

  const refPath = path.join(gitDir, ...symbolic[1].split("/"));
  if (fs.existsSync(refPath)) {
    const commit = fs.readFileSync(refPath, "utf8").trim();
    if (/^[0-9a-f]{40}$/i.test(commit)) return commit.toLowerCase();
  }

  const packedRefsPath = path.join(gitDir, "packed-refs");
  if (fs.existsSync(packedRefsPath)) {
    for (const line of fs.readFileSync(packedRefsPath, "utf8").split(/\r?\n/)) {
      const [commit, ref] = line.trim().split(/\s+/);
      if (
        ref === symbolic[1] &&
        /^[0-9a-f]{40}$/i.test(commit)
      ) {
        return commit.toLowerCase();
      }
    }
  }

  throw new Error(
    `Unable to resolve Git HEAD ref ${symbolic[1]} in ${repositoryRoot}`,
  );
}

for (const source of [caseSetPath, publicResultPath]) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing canonical benchmark source: ${source}`);
  }
}

const caseSet = JSON.parse(fs.readFileSync(caseSetPath, "utf8"));
const result = JSON.parse(fs.readFileSync(publicResultPath, "utf8"));
const sourceCommit = readGitHeadCommit(desktopRoot);
if (sourceCommit !== frozenSourceCommit) {
  throw new Error(
    `Mira Desktop source must be frozen at ${frozenSourceCommit}; got ${sourceCommit}`,
  );
}

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
