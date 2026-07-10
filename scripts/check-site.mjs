import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync
} from "node:fs";
import {
  dirname,
  extname,
  join,
  relative,
  resolve
} from "node:path";

const root = process.cwd();
const files = collectFiles(root).filter(file => !isIgnored(file));
const htmlFiles = files.filter(file => extname(file).toLowerCase() === ".html");
const cssFiles = files.filter(file => extname(file).toLowerCase() === ".css");
const javascriptFiles = files.filter(file => [".js", ".mjs"].includes(extname(file).toLowerCase()));
const failures = [];

for (const file of htmlFiles) {
  const source = readFileSync(file, "utf8");

  checkDuplicateIds(file, source);
  checkDocumentClosingTag(file, source);
  checkJekyllIncludes(file, source);
  checkLocalReferences(file, source, /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi);
  checkBlankTargetSafety(file, source);
}

function checkJekyllIncludes(file, source) {
  const includePattern = /\{%\s*include\s+([^\s%]+)[^%]*%\}/g;

  for (const match of source.matchAll(includePattern)) {
    const includePath = resolve(root, "_includes", match[1]);

    if (!existsSync(includePath)) {
      fail(file, `Jekyll include does not exist: ${match[1]}`);
    }
  }

  const projectPath = relative(root, file).replaceAll("\\", "/");
  const isJekyllPartial = projectPath.startsWith("_includes/");
  const isPublicDocument = /<!doctype\s+html/i.test(source) && !projectPath.startsWith("admin/");

  if (!isJekyllPartial && source.includes("{%") && !source.startsWith("---")) {
    fail(file, "file contains Liquid tags but has no YAML front matter");
  }

  if (isPublicDocument && !source.includes("{% include navbar.html %}")) {
    fail(file, "public document is missing the shared navbar include");
  }

  if (isPublicDocument && !source.includes("{% include footer.html %}")) {
    fail(file, "public document is missing the shared footer include");
  }
}

for (const file of cssFiles) {
  const source = readFileSync(file, "utf8");

  checkLocalReferences(file, source, /url\(\s*["']?([^"')]+)["']?\s*\)/gi);
}

for (const file of javascriptFiles) {
  const source = readFileSync(file, "utf8");
  const importPattern = /(?:\bfrom\s+|\bimport\s*)["'](\.[^"']+)["']/g;

  for (const match of source.matchAll(importPattern)) {
    checkPathExists(file, match[1], "module import");
  }
}

if (failures.length > 0) {
  failures.forEach(failure => process.stderr.write(`${failure}\n`));
  process.exit(1);
}

console.log(
  `Checked ${htmlFiles.length} HTML files, ${cssFiles.length} CSS files, and ${javascriptFiles.length} JavaScript files.`
);

function checkDuplicateIds(file, source) {
  const ids = new Map();
  const idPattern = /\bid\s*=\s*["']([^"']+)["']/gi;

  for (const match of source.matchAll(idPattern)) {
    const id = match[1];
    ids.set(id, (ids.get(id) || 0) + 1);
  }

  for (const [id, count] of ids) {
    if (count > 1) {
      fail(file, `duplicate id "${id}" (${count} occurrences)`);
    }
  }
}

function checkDocumentClosingTag(file, source) {
  if (/<!doctype\s+html/i.test(source) && !/<\/html>\s*$/i.test(source)) {
    fail(file, "full HTML document is missing a closing </html> tag");
  }
}

function checkLocalReferences(file, source, pattern) {
  for (const match of source.matchAll(pattern)) {
    const reference = match[1].trim();

    if (reference.toLowerCase().startsWith("javascript:")) {
      fail(file, `unsafe javascript: reference "${reference}"`);
      continue;
    }

    if (shouldIgnoreReference(reference)) continue;

    checkPathExists(file, reference, "local reference");
  }
}

function checkBlankTargetSafety(file, source) {
  const anchorPattern = /<a\b[^>]*\btarget\s*=\s*["']_blank["'][^>]*>/gi;

  for (const match of source.matchAll(anchorPattern)) {
    const tag = match[0];
    const rel = tag.match(/\brel\s*=\s*["']([^"']*)["']/i)?.[1] || "";

    if (!rel.split(/\s+/).includes("noopener")) {
      fail(file, "target=\"_blank\" link is missing rel=\"noopener\"");
    }
  }
}

function checkPathExists(file, reference, label) {
  const cleanReference = reference.split(/[?#]/, 1)[0];

  if (!cleanReference) return;

  const target = cleanReference.startsWith("/")
    ? resolve(root, cleanReference.slice(1))
    : resolve(dirname(file), cleanReference);

  if (!existsSync(target)) {
    fail(file, `${label} does not exist: ${reference}`);
  }
}

function shouldIgnoreReference(reference) {
  return !reference
    || reference.startsWith("#")
    || reference.includes("${")
    || reference.includes("{{")
    || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference);
}

function fail(file, message) {
  failures.push(`${relative(root, file)}: ${message}`);
}

function collectFiles(directory) {
  return readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);
    const stats = statSync(path);

    return stats.isDirectory() ? collectFiles(path) : [path];
  });
}

function isIgnored(file) {
  const path = relative(root, file).replaceAll("\\", "/");

  return path.startsWith(".git/")
    || path.startsWith("node_modules/")
    || path.startsWith("dist/")
    || path.startsWith("build/");
}
