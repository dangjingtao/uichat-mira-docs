#!/usr/bin/env node
import { handleCliError, parseCliArgs } from "./common.mjs";
import { inspectComicSource, printInspection } from "./inspect-lib.mjs";

const { positional, options } = parseCliArgs(process.argv.slice(2));
const sourceDir = positional[0];
if (!sourceDir) {
  console.error("用法：pnpm comic:inspect -- <source-directory> [--json]");
  process.exit(2);
}
try {
  const result = await inspectComicSource(sourceDir);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else printInspection(result);
  if (result.errors.length) process.exitCode = 1;
} catch (error) {
  handleCliError(error);
}
