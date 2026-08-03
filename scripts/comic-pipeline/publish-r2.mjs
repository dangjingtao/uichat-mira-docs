#!/usr/bin/env node
import { handleCliError, parseCliArgs } from "./common.mjs";
import { publishComicToR2 } from "./publish-lib.mjs";

const { positional, options } = parseCliArgs(process.argv.slice(2));
const buildDir = positional[0];
if (!buildDir) {
  console.error("用法：pnpm comic:publish -- <build-directory> [--plan | --confirm] [--prefix mira/comics] [--keep-staging]");
  process.exit(2);
}
try {
  const result = await publishComicToR2(buildDir, {
    planOnly: Boolean(options.plan),
    confirm: Boolean(options.confirm),
    prefix: options.prefix,
    keepStaging: Boolean(options["keep-staging"]),
  });
  console.log(result.planOnly ? "发布计划已生成，未执行外部操作。" : "R2 发布完成。");
  console.log(`正式前缀：${result.livePrefix}`);
  if (result.manifestUrl) console.log(`Manifest：${result.manifestUrl}`);
} catch (error) {
  handleCliError(error);
}
