import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["assets/js"];
const files = roots.flatMap(root => collectJavaScriptFiles(root));
let hasFailure = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.status !== 0) {
    hasFailure = true;
    process.stderr.write(result.stderr || result.stdout || `${file} failed syntax check\n`);
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
