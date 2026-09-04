import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(rootDir, "docs/.vuepress/dist");
// The Pages workflow generates notebook HTML from LucienZhang/website-binder
// and merges it into this path after the local VuePress build.
const deploymentProvidedPrefixes = ["/static/jupyter/"];

if (!existsSync(distDir)) {
  console.error("Build output is missing. Run `npm run build` first.");
  process.exit(1);
}

const htmlFiles = walk(distDir).filter((file) => extname(file) === ".html");
const failures = [];
let checkedLinks = 0;

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, "utf8");
  const attributes = html.matchAll(/\b(?:href|src)=(?:"([^"]*)"|'([^']*)')/g);

  for (const match of attributes) {
    const rawReference = decodeHtml(match[1] ?? match[2] ?? "");
    if (shouldIgnore(rawReference)) continue;

    checkedLinks += 1;
    const [rawPath] = rawReference.split(/[?#]/, 1);
    if (deploymentProvidedPrefixes.some((prefix) => rawPath.startsWith(prefix))) continue;
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      failures.push(`${routeFor(htmlFile)} -> invalid URL encoding: ${rawReference}`);
      continue;
    }

    const candidate = decodedPath.startsWith("/")
      ? join(distDir, decodedPath)
      : resolve(dirname(htmlFile), decodedPath);

    if (!isInsideDist(candidate) || !resolvesToOutput(candidate, decodedPath)) {
      failures.push(`${routeFor(htmlFile)} -> ${rawReference}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Found ${failures.length} broken internal reference(s):`);
  for (const failure of [...new Set(failures)].sort()) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Checked ${checkedLinks} internal references across ${htmlFiles.length} HTML files.`);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function shouldIgnore(reference) {
  return (
    reference === "" ||
    reference.startsWith("#") ||
    reference.startsWith("//") ||
    /^(?:[a-z][a-z\d+.-]*:)/i.test(reference)
  );
}

function resolvesToOutput(candidate, originalPath) {
  if (existsSync(candidate)) return true;
  if (originalPath.endsWith("/")) return existsSync(join(candidate, "index.html"));
  if (extname(candidate) === "") {
    return existsSync(`${candidate}.html`) || existsSync(join(candidate, "index.html"));
  }
  return false;
}

function isInsideDist(candidate) {
  const pathFromDist = relative(distDir, candidate);
  return pathFromDist === "" || (!pathFromDist.startsWith("..") && !pathFromDist.startsWith("/"));
}

function routeFor(file) {
  return `/${relative(distDir, file).replaceAll("\\", "/")}`;
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}
