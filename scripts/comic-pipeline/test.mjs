#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { buildComic } from "./build-lib.mjs";
import { inspectComicSource } from "./inspect-lib.mjs";
import { publishComicToR2 } from "./publish-lib.mjs";
import { verifyComicBuild } from "./verify-lib.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "mira-comic-pipeline-"));
const source = path.join(root, "source");
const output = path.join(root, "output");
try {
  await mkdir(path.join(source, "pages"), { recursive: true });
  await writeFile(path.join(source, "work.json"), `${JSON.stringify({
    schemaVersion: 1,
    id: "fixture-comic",
    edition: "v1",
    title: "Fixture",
    subtitle: "Pipeline",
    expectedPages: 4,
    missingPages: [3],
    readingDirection: "ltr",
    expectedAspectRatio: 1.38,
  }, null, 2)}\n`);
  const makeImage = (filePath, background) => sharp({
    create: { width: 800, height: 580, channels: 3, background },
  }).png().toFile(filePath);
  await makeImage(path.join(source, "cover.png"), "#b96b52");
  await makeImage(path.join(source, "pages", "001.png"), "#d8c7ad");
  await makeImage(path.join(source, "pages", "002.png"), "#c7b69f");
  await makeImage(path.join(source, "pages", "004.png"), "#b6a58f");

  const inspection = await inspectComicSource(source);
  assert.deepEqual(inspection.errors, []);
  assert.equal(inspection.summary.availablePages, 3);
  assert.deepEqual(inspection.summary.missingPages, [3]);

  const built = await buildComic(source, { output });
  assert.equal(built.manifest.pages.length, 3);
  assert.ok(built.manifest.pages.every((page) => page.sources.every((item) => item.width <= page.original.width)));
  const verified = await verifyComicBuild(output);
  assert.deepEqual(verified.errors, []);
  const manifest = JSON.parse(await readFile(path.join(output, "manifest.json"), "utf8"));
  assert.equal(manifest.releaseFingerprint.length, 64);

  const publishPlan = await publishComicToR2(output, { planOnly: true });
  assert.equal(publishPlan.livePrefix, "mira/comics/fixture-comic/current");
  assert.equal(publishPlan.planOnly, true);
  console.log("comic pipeline fixture passed");
} finally {
  await rm(root, { recursive: true, force: true });
}
