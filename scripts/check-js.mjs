import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SourceTextModule } from "node:vm";

const roots = ["assets/js"];
const files = roots.flatMap(root => collectJavaScriptFiles(root));
let hasFailure = false;

for (const file of files) {
  try {
    new SourceTextModule(readFileSync(file, "utf8"), {
      identifier: pathToFileURL(resolve(file)).href
    });
  } catch (error) {
    hasFailure = true;
    process.stderr.write(`${file} failed syntax check\n${error.stack || error}\n`);
  }
}

if (hasFailure) {
  process.exit(1);
}

console.log(`Checked ${files.length} JavaScript files.`);

function collectJavaScriptFiles(directory) {
  return readdirSync(directory)
    .flatMap(entry => {
      const path = join(directory, entry);
      const stats = statSync(path);

      if (stats.isDirectory()) {
        return collectJavaScriptFiles(path);
      }

      return path.endsWith(".js") ? [path] : [];
    });
}
