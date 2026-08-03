#!/usr/bin/env node
import { handleCliError, parseCliArgs, printIssues } from "./common.mjs";
import { verifyComicBuild } from "./verify-lib.mjs";

const { positional, options } = parseCliArgs(process.argv.slice(2));
const buildDir = positional[0];
if (!buildDir) {
  console.error("用法：pnpm comic:verify -- <build-directory> [--json]");
  process.exit(2);
}
try {
  const result = await verifyComicBuild(buildDir);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    printIssues(result);
    if (!result.errors.length) console.log(`构建目录有效：${result.buildDir}`);
  }
  if (result.errors.length) process.exitCode = 1;
} catch (error) {
  handleCliError(error);
}
