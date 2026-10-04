import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(
  repoRoot,
  "src/data/agent-core-benchmark/core-v0.1.json",
);
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log("PASS " + message);
}

assert(
  snapshot.schemaVersion === "mira-agent-core-benchmark-site-snapshot/0.1",
  "snapshot schema",
);
assert(snapshot.benchmarkVersion === "0.1", "benchmark version v0.1");
assert(snapshot.caseSetVersion === "core-v0.1", "case-set core-v0.1");
assert(snapshot.status === "frozen", "case-set is frozen");
assert(/^[0-9a-f]{40}$/.test(snapshot.source.commit), "exact source commit");
assert(snapshot.cases.length === 25, "25 frozen public cases");

const countsByDifficulty = snapshot.cases.reduce((acc, item) => {
  acc[item.difficulty] = (acc[item.difficulty] || 0) + 1;
  return acc;
}, {});
assert(
  countsByDifficulty.beginner === 9 &&
    countsByDifficulty.intermediate === 8 &&
    countsByDifficulty.advanced === 8,
  "9 beginner / 8 intermediate / 8 advanced",
);

const official = snapshot.cases.filter(
  (item) => item.officialParticipation === "automated_scored",
);
const diagnostic = snapshot.cases.filter(
  (item) => item.officialParticipation === "diagnostic_untimed",
);
assert(official.length === 17, "17 automated_scored cases");
assert(diagnostic.length === 8, "8 diagnostic_untimed cases");

const allowedCaseKeys = new Set([
  "id",
  "title",
  "difficulty",
  "calibrationCluster",
  "calibrationRationale",
  "scorerOwnership",
  "timing",
  "public",
  "officialParticipation",
]);

for (const item of snapshot.cases) {
  for (const key of Object.keys(item)) {
    assert(
      allowedCaseKeys.has(key),
      "case " + item.id + " uses public key " + key,
    );
  }
  assert(
    typeof item.public?.prompt === "string" && item.public.prompt.length > 0,
    "case " + item.id + " has public prompt",
  );
  assert(
    typeof item.public?.intentSummary === "string" &&
      item.public.intentSummary.length > 0,
    "case " + item.id + " has public intent",
  );
  if (item.officialParticipation === "automated_scored") {
    assert(
      Number.isFinite(item.timing?.tSoftMs) &&
        Number.isFinite(item.timing?.tHardMs),
      "case " + item.id + " has frozen timing",
    );
  } else {
    assert(
      item.timing?.status === "diagnostic_untimed",
      "case " + item.id + " remains diagnostic_untimed",
    );
  }
}

const forbiddenKeyPattern =
  /(credential|secret|rawtrajectory|raw_trajectory|hiddenevaluator|hidden_evaluator|fixturepayload|fixture_payload)/i;

function inspectKeys(value, pointer = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, pointer + "[" + index + "]"));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeyPattern.test(key)) {
      throw new Error("Forbidden public snapshot key at " + pointer + "." + key);
    }
    inspectKeys(child, pointer + "." + key);
  }
}
inspectKeys(snapshot);
console.log("PASS no forbidden private payload keys");

assert(
  snapshot.result?.schemaVersion ===
    "mira-agent-core-benchmark-formal-public-result/0.1",
  "formal public result schema",
);
assert(
  snapshot.result?.status === "incomplete",
  "formal result explicitly incomplete",
);
assert(
  snapshot.result?.counts?.formalCases === 17 &&
    snapshot.result?.counts?.completeCases === 16 &&
    snapshot.result?.counts?.incompleteCases === 1,
  "formal result 16 complete + 1 incomplete",
);
assert(
  snapshot.result?.canonicalHeadline?.taskSuccess === null &&
    snapshot.result?.canonicalHeadline?.autonomy === null &&
    snapshot.result?.canonicalHeadline?.reliability === null &&
    snapshot.result?.canonicalHeadline?.governance === null,
  "incomplete run keeps canonical headline null",
);
assert(
  snapshot.result?.judge?.executionMode === "mixed_blank_judge_threads",
  "Judge methodology projection is explicit",
);

const generated = [
  "src/pages/guide/benchmark/index.md",
  "src/pages/guide/benchmark/cases.md",
  "src/pages/guide/benchmark/method.md",
  "src/pages/guide/benchmark/results.md",
];
for (const relative of generated) {
  assert(fs.existsSync(path.join(repoRoot, relative)), relative + " exists");
}

const casesMarkdown = fs.readFileSync(
  path.join(repoRoot, "src/pages/guide/benchmark/cases.md"),
  "utf8",
);
for (const item of snapshot.cases) {
  const promptLines = String(item.public.prompt)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  assert(
    casesMarkdown.includes(item.id) &&
      promptLines.every((line) => casesMarkdown.includes(line)),
    "generated cases page contains " + item.id,
  );
}

const resultsMarkdown = fs.readFileSync(
  path.join(repoRoot, "src/pages/guide/benchmark/results.md"),
  "utf8",
);
assert(
  resultsMarkdown.includes("51/51 valid comparable") &&
    resultsMarkdown.includes("16/17") &&
    resultsMarkdown.includes("ADV-02"),
  "results page exposes formal completeness honestly",
);

console.log("Agent Core Benchmark public projection verification passed.");
