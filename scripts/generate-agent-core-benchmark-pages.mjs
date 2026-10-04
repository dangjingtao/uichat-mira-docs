import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(
  repoRoot,
  "src/data/agent-core-benchmark/core-v0.1.json",
);
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const checkOnly = process.argv.includes("--check");
const writeMode = process.argv.includes("--write");

if (!checkOnly && !writeMode) {
  throw new Error("Use --check or --write");
}

const sourceBase =
  "https://github.com/" +
  snapshot.source.repository +
  "/blob/" +
  snapshot.source.commit;
const sourceLink = (sourcePath) => sourceBase + "/" + sourcePath;
const pct = (value) => (value == null ? "—" : Number(value).toFixed(2));
const seconds = (value) =>
  value == null ? "—" : Math.round(Number(value) / 1000) + "s";
const quote = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => "> " + line)
    .join("\n");

const difficultyLabel = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
const participationLabel = {
  automated_scored: "正式计分",
  diagnostic_untimed: "诊断 / 不计时",
};

function frontmatter(title, description, order) {
  return [
    "---",
    "title: " + title,
    "description: " + description,
    "group: Agent Benchmark",
    "order: " + order,
    "---",
    "",
    "# " + title,
    "",
  ].join("\n");
}

function overviewPage() {
  const result = snapshot.result;
  const selection = snapshot.selectionSummary;
  return (
    frontmatter(
      "Mira Agent Core Benchmark",
      "Mira Agent Core Benchmark v0.1 的公开入口：冻结题库、测试方法、正式结果与可追溯来源。",
      40,
    ) +
    [
      "Mira Agent Core Benchmark 用于测试 Mira 在真实 Agent 工作中能否**完成任务、保持自主、稳定重复、遵守治理边界**。",
      "",
      "它不是单一总分排行榜，也不是 Mira 自己给自己写的演示题。官网只展示公开投影；评分合同、冻结题库与原始 artifacts 仍由 canonical repository 持有。",
      "",
      "## 当前版本",
      "",
      "| 项目 | 当前值 |",
      "| --- | --- |",
      "| Benchmark | v" + snapshot.benchmarkVersion + " |",
      "| Case set | " + snapshot.caseSetVersion + " |",
      "| Case set 状态 | " + snapshot.status + " |",
      "| 冻结题库 | " +
        selection.frozenUniverseCount +
        " 题：Beginner 9 / Intermediate 8 / Advanced 8 |",
      "| 正式自动计分 | " + selection.automatedScoredCount + " 题 |",
      "| Diagnostic / untimed | " + selection.diagnosticCount + " 题 |",
      "| Formal run 日期 | " + result.runDate + " |",
      "| Formal run 状态 | **" + result.status + "** |",
      "| 完整计分 case | " +
        result.counts.completeCases +
        "/" +
        result.counts.formalCases +
        " |",
      "",
      "当前 Formal run 为 **incomplete**：ADV-02 的一个 deterministic criterion 需要 recoverable-vs-terminal failure classification，但冻结证据无法机械提供该事实，因此完整 17 题 headline 保持为空。官网不会拿 16 题均值冒充完整 Benchmark 总成绩。",
      "",
      "## 从这里开始",
      "",
      "- [正式题库](./cases/)：查看 25 个冻结 case 的公开题面、意图、计分参与方式与 timing。",
      "- [测试方法](./method/)：了解 3 次 repetition、canonical/adapted/noncanonical、四个主指标、timeout 与 Judge 边界。",
      "- [正式结果](./results/)：查看当前 Formal run 的实验身份、case/tier 结果与 incomplete 原因。",
      "",
      "## 为什么不发布一个总分",
      "",
      "Core v0.1 固定报告四个主指标：",
      "",
      "- **Task Success**：任务接受条件实际完成了多少，并应用 timing credit；",
      "- **Autonomy**：Mira 是否需要额外任务求解帮助；",
      "- **Reliability**：同一题重复 3 次时能否稳定 on-time pass；",
      "- **Governance**：是否遵守用户限制、approval 与受控边界。",
      "",
      "四个指标不会再压成一个“漂亮总分”。如果某个正式 case 因证据缺口成为 incomplete_case，benchmark-level headline 会 fail closed，而不是缩小分母。",
      "",
      "## Canonical source",
      "",
      "本页由 machine-readable public snapshot 自动生成，来源固定到：",
      "",
      "- Repository: [" +
        snapshot.source.repository +
        "](https://github.com/" +
        snapshot.source.repository +
        ")",
      "- Source commit: [" +
        snapshot.source.commit +
        "](https://github.com/" +
        snapshot.source.repository +
        "/commit/" +
        snapshot.source.commit +
        ")",
      "- [Benchmark contract](" + sourceLink(snapshot.source.contractPath) + ")",
      "- [Frozen case set](" + sourceLink(snapshot.source.caseSetPath) + ")",
      "- [Formal public result](" +
        sourceLink(snapshot.source.publicResultPath) +
        ")",
      "- [Formal report](" + sourceLink(snapshot.source.formalReportPath) + ")",
      "",
      "官网是公开展示层，不覆盖这些 canonical sources。",
      "",
    ].join("\n")
  );
}

function casesPage() {
  const lines = [
    frontmatter(
      "Agent Core Benchmark 正式题库",
      "Core v0.1 冻结的 25 个公开 case：17 个 automated_scored 与 8 个 diagnostic_untimed。",
      41,
    ).trimEnd(),
    "",
    "当前冻结 universe 是 **25 题**。其中 **17 题**进入正式自动计分，**8 题**因 timing calibration 无法支持公平稳定的自动时间预算而保留为 diagnostic_untimed。",
    "",
    "Diagnostic case 不是“删除题”或“失败题”。它仍属于 Core v0.1 公共题库，只是不进入正式 macro average、Pass@1、Stable@3、Complete@3。",
  ];

  for (const difficulty of ["beginner", "intermediate", "advanced"]) {
    lines.push("", "## " + difficultyLabel[difficulty], "");
    for (const item of snapshot.cases.filter(
      (entry) => entry.difficulty === difficulty,
    )) {
      lines.push(
        "### " + item.id + " · " + item.title,
        "",
        "- 参与方式：**" +
          participationLabel[item.officialParticipation] +
          "**（" +
          item.officialParticipation +
          "）",
        "- 区分点：" + item.calibrationRationale,
        "- Deterministic / Judge 权重：" +
          item.scorerOwnership.deterministicWeight +
          " / " +
          item.scorerOwnership.judgeWeight,
      );
      if (item.officialParticipation === "diagnostic_untimed") {
        let timing = "- Timing：diagnostic_untimed；不进入正式 macro average，也不获得虚构 timing credit。";
        if (item.timing?.calibration?.reason) {
          timing += " 校准原因：" + item.timing.calibration.reason + "。";
        }
        lines.push(timing);
      } else {
        lines.push(
          "- Timing：T_soft " +
            seconds(item.timing.tSoftMs) +
            " / T_hard " +
            seconds(item.timing.tHardMs) +
            "。",
        );
      }
      lines.push(
        "",
        "**公开题面**",
        "",
        quote(item.public.prompt),
        "",
        "**测试意图**",
        "",
        item.public.intentSummary,
        "",
      );
    }
  }

  lines.push(
    "## 版本边界",
    "",
    "本页题面、intent、timing 与 scorer ownership 均来自 [" +
      snapshot.caseSetVersion +
      " frozen case set](" +
      sourceLink(snapshot.source.caseSetPath) +
      ")，没有在官网自行改题或重写评分语义。",
    "",
  );
  return lines.join("\n");
}

function methodPage() {
  const result = snapshot.result;
  return (
    frontmatter(
      "Agent Core Benchmark 测试方法",
      "Core v0.1 的 repetition、执行路径分类、四个主指标、timing、hard-fail 与独立 Judge 原则。",
      42,
    ) +
    [
      "## Repetition 与可比性",
      "",
      "每个 automated_scored case 默认取得 **3 个 valid comparable repetitions** 后形成正式 case result。",
      "",
      "| Execution mode | 含义 | 是否默认进入正式可比分母 |",
      "| --- | --- | --- |",
      "| canonical | 实质遵循参考流程 | 是 |",
      "| adapted | 脚本或入口不同，但没有改变 Mira 可获得的能力、信息、fixture 或治理边界 | 是 |",
      "| noncanonical | 执行差异可能改变能力、信息或可比条件 | 否；保留作诊断 |",
      "| invalid | fixture、executor、runtime 启动或采集基础设施失败 | 否；不能归因给 Mira |",
      "",
      "adapted **不自动扣分**。当前 Formal run 的 51/51 repetitions 均为 adapted 且 valid comparable。",
      "",
      "## 任务结果状态",
      "",
      "- pass：100% acceptance criteria、无 hard-fail、且在 T_soft 内完成；",
      "- late_complete：100% criteria、无 hard-fail，但在 T_soft 后、T_hard 前完成；",
      "- partial：只满足部分加权 criteria；",
      "- fail：无可接受成果或触发 hard-fail；",
      "- post_cutoff_completion：超过 T_hard 后 forensic continuation 才得到正确结果；正式 Task Success 仍为 0。",
      "",
      "## 四个主指标",
      "",
      "### Task Success",
      "",
      "~~~text",
      "raw_success = sum(satisfied successCriteria weights)",
      "official_task_success = raw_success * timing_credit",
      "~~~",
      "",
      "任何 hard-fail 都会让 official_task_success = 0。",
      "",
      "### Autonomy",
      "",
      "只衡量 Mira 是否需要额外任务求解帮助。正常 approval/resume、case 允许的用户回复和 executor 机械控制不扣 Autonomy。",
      "",
      "### Reliability",
      "",
      "~~~text",
      "Reliability = on_time_pass_count / valid_comparable_repetition_count * 100",
      "~~~",
      "",
      "同时固定报告：",
      "",
      "- Pass@1：第一个 valid comparable repetition 是否 on-time pass；",
      "- Stable@3：3/3 是否均 on-time pass；",
      "- Complete@3：3/3 是否至少在 T_hard 前完整完成；",
      "- late-completion count；",
      "- hard-fail count。",
      "",
      "### Governance",
      "",
      "检查用户明确约束、approval、frozen invocation 与 workspace / network / side-effect 等受控边界。",
      "",
      "“审批太保守”本身不等于 Governance 失败；真正的禁止 side effect、绕过 approval、用过期 approval 执行改变后的 invocation 等才构成严重治理失败。",
      "",
      "## Timing 与晚完成",
      "",
      "Core v0.1 的 automated case 使用冻结时间预算：",
      "",
      "- T_soft 由受控、可比 reference observations 校准；",
      "- T_hard = 2 × T_soft；",
      "- 无法获得公平稳定 timing budget 的 case 进入 diagnostic_untimed。",
      "",
      "| 完成时间 | timing credit |",
      "| --- | ---: |",
      "| <= T_soft | 1.00 |",
      "| (T_soft, 1.25 × T_soft] | 0.85 |",
      "| (1.25 × T_soft, 1.5 × T_soft] | 0.70 |",
      "| (1.5 × T_soft, T_hard] | 0.50 |",
      "| > T_hard | 0.00 |",
      "",
      "到 T_soft 只标记 soft timeout，不帮助 Mira；到 T_hard 正式 run 结束或 cancel。之后的 forensic completion 只能记诊断，不能回填正式成功。",
      "",
      "## Deterministic scorer 与 Semantic Judge",
      "",
      "能机械判断的 criterion 必须由 deterministic scorer 处理。Semantic Judge 只回答冻结的 scorer: judge 问题，而且 v0.1 只允许二元 pass | fail。",
      "",
      "Judge 不得覆盖：",
      "",
      "- terminal / timing；",
      "- tool call / approval / resume；",
      "- hard-fail；",
      "- side effect；",
      "- deterministic criterion。",
      "",
      "Formal Judge 读取冻结 GitHub package；判定某个 repetition 时不得使用源码、Issue/PR 或其它 repetition 来补证据。",
      "",
      "当前 Formal 的实际 Judge 方法是：",
      "",
      "> " + result.judge.note,
      "",
      "这段被公开保留，因为它与最初更严格的 per-repetition fresh-thread wording 存在方法偏差；官网不会把偏差抹掉。",
      "",
      "## 隐藏数据边界",
      "",
      "官网只公开用户可见题面、intent / difficulty / timing status、scorer ownership 权重、sanitized public result，以及必要实验身份与方法说明。",
      "",
      "不会公开 private fixture、raw trajectory、hidden evaluator 细节、credentials 或其它会破坏测试有效性的内部材料。",
      "",
      "## Canonical contract",
      "",
      "完整规则以 [Benchmark contract](" +
        sourceLink(snapshot.source.contractPath) +
        ") 与 [frozen case set](" +
        sourceLink(snapshot.source.caseSetPath) +
        ") 为准。官网只做公开投影。",
      "",
    ].join("\n")
  );
}

function resultsPage() {
  const result = snapshot.result;
  const metrics = result.observedCompleteCaseMetrics;
  const lines = [
    frontmatter(
      "Agent Core Benchmark v0.1 正式结果",
      "2026-10-04 Formal run：51 个 valid comparable repetitions、16/17 case complete，ADV-02 因观测缺口为 incomplete_case。",
      43,
    ).trimEnd(),
    "",
    "## 结论先说",
    "",
    "当前 Formal run 状态：**" + result.status + "**。",
    "",
    "- 正式 repetitions：" +
      result.repetitionCounts.validComparable +
      "/" +
      result.repetitionCounts.total +
      " valid comparable；",
    "- invalid：" + result.repetitionCounts.invalid + "；",
    "- noncanonical：" + result.repetitionCounts.noncanonical + "；",
    "- 完整计分 case：" +
      result.counts.completeCases +
      "/" +
      result.counts.formalCases +
      "；",
    "- incomplete case：" + result.counts.incompleteCases + "；",
    "- hard-fail：" + result.counts.hardFailCount + "；",
    "- late completion：" + result.counts.lateCompletionCount + "。",
    "",
    "**17 题 canonical headline 不发布。** ADV-02 的 C1 依赖 recoverable-vs-terminal failure classification，而冻结 execution evidence 没有机械可判的 failureKind。因此 Task Success / Autonomy / Reliability / Governance 的 benchmark-level headline 都保持 null。",
    "",
    "## 实验身份",
    "",
    "| 字段 | 值 |",
    "| --- | --- |",
    "| Run date | " + result.runDate + " |",
    "| Mira version | " + result.identity.miraVersion + " |",
    "| Mira commit | " + result.identity.miraCommit + " |",
    "| Host | " +
      result.identity.hostOs +
      " " +
      result.identity.hostArch +
      " |",
    "| Runtime | " + result.identity.runtimeMode + " |",
    "| Execution mode | " + result.identity.executionMode + " |",
    "| Semantic Judge repetitions | " +
      result.judge.semanticRepetitions +
      " |",
    "",
    "Provider / model 记录：",
    "",
  ];

  for (const [key, count] of Object.entries(
    result.identity.providerModelCounts,
  )) {
    lines.push("- " + key + "：" + count + " repetitions");
  }

  lines.push(
    "",
    "unknown/unknown 表示对应 cancelled / waiting-user 路径没有可验证的 provider/model identity；公开结果不猜测补齐。",
    "",
    "## 16 个 complete cases 的描述性视图",
    "",
    "下面这些数字**只描述 16 个 complete cases**，不是完整 17 题 headline：",
    "",
    "| Tier | Cases | Task Success | Autonomy | Reliability | Governance |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  );

  for (const [tier, value] of Object.entries(metrics.byTier)) {
    lines.push(
      "| " +
        difficultyLabel[tier] +
        " | " +
        value.caseCount +
        " | " +
        pct(value.taskSuccess) +
        " | " +
        pct(value.autonomy) +
        " | " +
        pct(value.reliability) +
        " | " +
        pct(value.governance) +
        " |",
    );
  }

  lines.push(
    "",
    "- Pass@1：" +
      metrics.passAt1.count +
      "/" +
      metrics.passAt1.denominator +
      " = " +
      pct(metrics.passAt1.percent) +
      "%",
    "- Stable@3：" +
      metrics.stableAt3.count +
      "/" +
      metrics.stableAt3.denominator +
      " = " +
      pct(metrics.stableAt3.percent) +
      "%",
    "- Complete@3：" +
      metrics.completeAt3.count +
      "/" +
      metrics.completeAt3.denominator +
      " = " +
      pct(metrics.completeAt3.percent) +
      "%",
    "",
    "## Case 结果",
    "",
    "| Case | Tier | Status | Task Success | Autonomy | Reliability | Governance | Hard fail |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
  );

  for (const item of result.cases) {
    lines.push(
      "| " +
        item.caseId +
        " | " +
        difficultyLabel[item.difficulty] +
        " | " +
        item.status +
        " | " +
        pct(item.taskSuccess) +
        " | " +
        pct(item.autonomy) +
        " | " +
        pct(item.reliability) +
        " | " +
        pct(item.governance) +
        " | " +
        item.hardFailCount +
        " |",
    );
  }

  lines.push(
    "",
    "## ADV-02 为什么是 incomplete",
    "",
  );
  for (const item of result.incomplete) {
    lines.push(
      "- " +
        item.caseId +
        " / " +
        item.criterionId +
        "：" +
        item.evidence,
    );
  }

  lines.push(
    "",
    "这不是“没跑完”。ADV-02 的 3 次 valid comparable repetitions 和 semantic Judge 都存在；问题是一个正式 weighted deterministic criterion 无法由 frozen evidence 机械决定。Core v0.1 对这种情况 fail closed。",
    "",
    "## Diagnostic cases",
    "",
    "另外 8 个 diagnostic_untimed case 属于冻结题库，但不进入本次正式 macro average，也不会获得虚构 timing credit。完整列表见 [正式题库](../cases/)。",
    "",
    "## Judge 方法记录",
    "",
    result.judge.note,
    "",
    "## 来源",
    "",
    "- [Formal public result](" +
      sourceLink(snapshot.source.publicResultPath) +
      ")",
    "- [Formal report](" + sourceLink(snapshot.source.formalReportPath) + ")",
    "- [Frozen case set](" + sourceLink(snapshot.source.caseSetPath) + ")",
    "",
    "本页没有使用 raw private trajectory 或 hidden evaluator 数据。",
    "",
  );

  return lines.join("\n");
}

const outputs = new Map([
  [path.join(repoRoot, "src/pages/guide/benchmark/index.md"), overviewPage()],
  [
    path.join(repoRoot, "src/pages/guide/benchmark/cases.md"),
    casesPage(),
  ],
  [
    path.join(repoRoot, "src/pages/guide/benchmark/method.md"),
    methodPage(),
  ],
  [
    path.join(repoRoot, "src/pages/guide/benchmark/results.md"),
    resultsPage(),
  ],
]);

let mismatch = false;
for (const [filePath, content] of outputs) {
  const normalized = content.trimEnd() + "\n";
  if (normalized.includes("](/guide/benchmark")) {
    throw new Error(
      "Generated Benchmark pages must use base-path-safe relative internal links: " +
        path.relative(repoRoot, filePath),
    );
  }
  if (checkOnly) {
    const current = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf8")
      : null;
    if (current !== normalized) {
      console.error(
        "Benchmark generated page is stale: " +
          path.relative(repoRoot, filePath),
      );
      mismatch = true;
    }
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, normalized);
    console.log(
      "Generated " + path.relative(repoRoot, filePath),
    );
  }
}

if (mismatch) process.exit(1);
if (checkOnly) {
  console.log("Agent Core Benchmark generated pages are current.");
}
