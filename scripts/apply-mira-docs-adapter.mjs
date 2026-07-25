import { readFileSync, writeFileSync } from "node:fs";

const appPath = new URL("../src/App.tsx", import.meta.url);
let source = readFileSync(appPath, "utf8");

if (source.includes('from "./content/mira-docs-adapter"')) {
  console.log("MiraDocs adapter is already applied.");
  process.exit(0);
}

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Cannot apply MiraDocs adapter: missing ${label}`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  'import { directoryLabels, logoUrl, topNavigationOrder } from "./site.config";\n',
  `import { directoryLabels, logoUrl, topNavigationOrder } from "./site.config";\nimport {\n  allDocs,\n  compareBlogDocs,\n  compareDocs,\n  slug,\n  type AuthorKey,\n  type Doc,\n} from "./content/mira-docs-adapter";\n`,
  "site config import",
);

const typeBlock = /type AuthorKey = "tomz" \| "mira";\ntype WritingMode = "authored" \| "co-authored";\ntype Doc = \{[\s\S]*?\n\};\n(?=type DocSection)/;
if (!typeBlock.test(source)) {
  throw new Error("Cannot apply MiraDocs adapter: missing legacy Doc model");
}
source = source.replace(typeBlock, "");

const rawStart = source.indexOf("const rawDocModules =");
const sectionStart = source.indexOf("const sectionInfo", rawStart);
if (rawStart < 0 || sectionStart < 0) {
  throw new Error("Cannot apply MiraDocs adapter: missing raw Markdown loader");
}
source = source.slice(0, rawStart) + source.slice(sectionStart);

const parserStart = source.indexOf("function slug(value: string)");
const utilityStart = source.indexOf("function seedFromString", parserStart);
if (parserStart < 0 || utilityStart < 0) {
  throw new Error("Cannot apply MiraDocs adapter: missing legacy parser block");
}
source = source.slice(0, parserStart) + source.slice(utilityStart);

const parsedStart = source.indexOf("const parsedDocs =");
const docsRootStart = source.indexOf("const docsRootDocs =", parsedStart);
if (parsedStart < 0 || docsRootStart < 0) {
  throw new Error("Cannot apply MiraDocs adapter: missing parsed document block");
}
source = source.slice(0, parsedStart) + source.slice(docsRootStart);

writeFileSync(appPath, source);
console.log("Applied MiraDocs content adapter to src/App.tsx.");
