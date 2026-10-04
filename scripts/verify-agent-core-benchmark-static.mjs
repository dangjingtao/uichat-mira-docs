import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(repoRoot, "dist");
const snapshot = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "src/data/agent-core-benchmark/core-v0.1.json"),
    "utf8",
  ),
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log("PASS " + message);
}

const routes = {
  overview: "guide/benchmark/index.html",
  cases: "guide/benchmark/cases/index.html",
  method: "guide/benchmark/method/index.html",
  results: "guide/benchmark/results/index.html",
};

const html = {};
for (const [name, relative] of Object.entries(routes)) {
  const file = path.join(distRoot, relative);
  assert(fs.existsSync(file), "static benchmark " + name + " exists");
  html[name] = fs.readFileSync(file, "utf8");
}

assert(
  html.overview.includes("Mira Agent Core Benchmark") &&
    html.overview.includes(snapshot.caseSetVersion) &&
    html.overview.includes(snapshot.source.commit),
  "overview exposes version and exact canonical source commit",
);

for (const item of snapshot.cases) {
  assert(
    html.cases.includes(item.id) && html.cases.includes(item.title),
    "cases page exposes " + item.id,
  );
}

assert(
  html.results.includes("16/17") &&
    html.results.includes("ADV-02") &&
    html.results.includes("incomplete"),
  "results page preserves incomplete formal status",
);
assert(
  html.method.includes("canonical") &&
    html.method.includes("adapted") &&
    html.method.includes("noncanonical") &&
    html.method.includes("post_cutoff_completion"),
  "method page distinguishes execution and cutoff semantics",
);

const benchmarkHtml = Object.values(html).join("\n");
const privatePayloadMarkers = [
  '"executorFacts"',
  '"workspaceBefore"',
  '"workspaceAfter"',
  '"executionEvents"',
  '"streamFrames"',
  '"toolEvents"',
  "execution-events.ndjson",
  "workspace-manifest.before.json",
  "workspace-manifest.after.json",
  "judge-input.json",
  "trajectory.jsonl",
  "artifact:final-answer",
  "trajectory:",
];

for (const marker of privatePayloadMarkers) {
  assert(
    !benchmarkHtml.includes(marker),
    "benchmark static pages exclude private payload marker " + marker,
  );
}

const leakedSnapshotPaths = [
  path.join(distRoot, "data/agent-core-benchmark/core-v0.1.json"),
  path.join(distRoot, "src/data/agent-core-benchmark/core-v0.1.json"),
];
for (const file of leakedSnapshotPaths) {
  assert(!fs.existsSync(file), "source snapshot is not emitted as public asset");
}

console.log("Agent Core Benchmark static projection verification passed.");
