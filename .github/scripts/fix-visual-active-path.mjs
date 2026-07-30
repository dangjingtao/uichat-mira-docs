import { readFileSync, writeFileSync } from "node:fs";

const path = "src/App.tsx";
const before = readFileSync(path, "utf8");
const oldLine = '  const currentDoc = allDocs.find((doc) => doc.path === location.pathname);';
const newLine = '  const currentDoc = allDocs.find(\n    (doc) => doc.path === decodedPathname(location.pathname),\n  );';
const count = before.split(oldLine).length - 1;
if (count !== 1) {
  throw new Error(`Expected one SiteHeader currentDoc match, found ${count}`);
}
writeFileSync(path, before.replace(oldLine, newLine), "utf8");
console.log("Applied encoded visual path guard.");
