import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import {
  COVER_WIDTHS,
  PAGE_WIDTHS,
  PIPELINE_VERSION,
  ComicPipelineError,
  candidateWidths,
  loadSharp,
  sha256File,
  sha256Text,
  writeJson,
} from "./common.mjs";
import { inspectComicSource } from "./inspect-lib.mjs";
import { verifyComicBuild } from "./verify-lib.mjs";

async function buildVariants({ sharp, input, outputDirectory, baseName, widths, source }) {
  await mkdir(outputDirectory, { recursive: true });
  const sources = [];
  const warnings = [];
  for (const requestedWidth of candidateWidths(source.width, widths)) {
    const temporaryPath = path.join(outputDirectory, `${baseName}-${requestedWidth}.tmp.webp`);
    await sharp(input, { failOn: "error" })
      .rotate()
      .toColourspace("srgb")
      .resize({ width: requestedWidth, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: 84, effort: 5, smartSubsample: true })
      .toFile(temporaryPath);
    const metadata = await sharp(temporaryPath).metadata();
    const digest = await sha256File(temporaryPath);
    const finalName = `${baseName}-${metadata.width}.${digest.slice(0, 8)}.webp`;
    const finalPath = path.join(outputDirectory, finalName);
    await rename(temporaryPath, finalPath);
    const bytes = (await stat(finalPath)).size;
    if (bytes > source.bytes) warnings.push(`${finalName} 比源文件更大。`);
    sources.push({ width: metadata.width, height: metadata.height, src: finalName, bytes, sha256: digest });
  }
  return { sources, warnings };
}

function fingerprintPayload(config, cover, pages) {
  return {
    schemaVersion: config.schemaVersion,
    id: config.id,
    edition: config.edition,
    expectedPages: config.expectedPages,
    missingPages: config.missingPages,
    readingDirection: config.readingDirection,
    expectedAspectRatio: config.expectedAspectRatio ?? null,
    cover: cover.sha256,
    pages: pages.map((page) => [page.number, page.sha256]),
  };
}

export async function buildComic(sourceDirectory, options = {}) {
  const inspection = await inspectComicSource(sourceDirectory);
  if (inspection.errors.length) throw new ComicPipelineError("源图检查失败。", inspection.errors);
  const { config, cover, pages } = inspection;
  const outputDir = path.resolve(options.output || path.join(process.cwd(), ".mira-cache", "comics", config.id, config.edition));
  const stagingDir = `${outputDir}.staging-${randomUUID()}`;
  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });
  const sharp = await loadSharp();
  const warnings = [...inspection.warnings];

  try {
    const coverBuild = await buildVariants({
      sharp,
      input: cover.path,
      outputDirectory: path.join(stagingDir, "cover"),
      baseName: "cover",
      widths: COVER_WIDTHS,
      source: cover,
    });
    warnings.push(...coverBuild.warnings);

    const pageEntries = [];
    for (const page of pages) {
      const name = String(page.number).padStart(3, "0");
      const pageBuild = await buildVariants({
        sharp,
        input: page.path,
        outputDirectory: path.join(stagingDir, "pages"),
        baseName: name,
        widths: PAGE_WIDTHS,
        source: page,
      });
      warnings.push(...pageBuild.warnings);
      pageEntries.push({
        number: page.number,
        original: {
          width: page.width,
          height: page.height,
          aspectRatio: Number(page.aspectRatio.toFixed(6)),
          bytes: page.bytes,
          sha256: page.sha256,
        },
        sources: pageBuild.sources.map((item) => ({ ...item, src: `pages/${item.src}` })),
      });
    }

    const releaseFingerprint = sha256Text(JSON.stringify(fingerprintPayload(config, cover, pages)));
    const manifest = {
      schemaVersion: 1,
      pipelineVersion: PIPELINE_VERSION,
      id: config.id,
      edition: config.edition,
      title: config.title,
      subtitle: config.subtitle,
      expectedPages: config.expectedPages,
      availablePages: pages.length,
      missingPages: config.missingPages,
      readingDirection: config.readingDirection,
      releaseFingerprint,
      cover: {
        original: {
          width: cover.width,
          height: cover.height,
          aspectRatio: Number(cover.aspectRatio.toFixed(6)),
          bytes: cover.bytes,
          sha256: cover.sha256,
        },
        sources: coverBuild.sources.map((item) => ({ ...item, src: `cover/${item.src}` })),
      },
      pages: pageEntries,
    };
    const imageBytes = [manifest.cover, ...manifest.pages].flatMap((asset) => asset.sources).reduce((sum, item) => sum + item.bytes, 0);
    const report = {
      schemaVersion: 1,
      pipelineVersion: PIPELINE_VERSION,
      builtAt: new Date().toISOString(),
      sourceDirectory: path.basename(inspection.sourceDir),
      outputDirectory: ".",
      releaseFingerprint,
      summary: inspection.summary,
      warnings,
      output: {
        files: 2 + manifest.cover.sources.length + manifest.pages.reduce((sum, page) => sum + page.sources.length, 0),
        imageBytes,
      },
    };

    await writeJson(path.join(stagingDir, "manifest.json"), manifest);
    await writeJson(path.join(stagingDir, "report.json"), report);
    const verification = await verifyComicBuild(stagingDir);
    if (verification.errors.length) throw new ComicPipelineError("构建产物校验失败。", verification.errors);
    report.warnings.push(...verification.warnings);
    await writeJson(path.join(stagingDir, "report.json"), report);

    await rm(outputDir, { recursive: true, force: true });
    await mkdir(path.dirname(outputDir), { recursive: true });
    await rename(stagingDir, outputDir);
    return { outputDir, manifest, report, warnings: report.warnings };
  } catch (error) {
    await rm(stagingDir, { recursive: true, force: true });
    throw error;
  }
}
