import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(rootDir, "docs/.vuepress/dist");
const routeBaseline = join(rootDir, ".ai/baseline/2026-09-04/routes.txt");
const routeAdditions = join(rootDir, ".ai/baseline/route-additions.txt");
const requiredArtifacts = [
  "index.html",
  "404.html",
  "zh/index.html",
  "ml/mnist.html",
  "misc/bim.html",
  "programming/algorithms/overview.html",
  "programming/prog-lang/overview.html",
  "static/IFCwasm/web-ifc.wasm",
  "static/IFCwasm/web-ifc-mt.wasm",
  "static/bim/building.ifc",
  "static/js/d3.js",
  "static/js/nv.d3.js",
  "static/js/pseudocode.js",
  "static/css/pseudocode.min.css",
  "static/fonts/Slidefu-Regular.woff2",
];

const failures = [];

if (!existsSync(distDir)) {
  failures.push("build output directory docs/.vuepress/dist is missing");
} else {
  for (const artifact of requiredArtifacts) {
    const path = join(distDir, artifact);
    if (!existsSync(path) || statSync(path).size === 0) {
      failures.push(`required artifact is missing or empty: /${artifact}`);
    }
  }

  const expectedRoutes = (readFileSync(routeBaseline, "utf8") + "\n" + readFileSync(routeAdditions, "utf8"))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const actualRoutes = walk(distDir)
    .filter((file) => extname(file) === ".html")
    .map((file) => `/${relative(distDir, file).replaceAll("\\", "/")}`)
    .sort();

  const missingRoutes = expectedRoutes.filter((route) => !actualRoutes.includes(route));
  const unexpectedRoutes = actualRoutes.filter((route) => !expectedRoutes.includes(route));
  if (missingRoutes.length > 0 || unexpectedRoutes.length > 0) {
    failures.push(
      `route baseline mismatch (missing: ${missingRoutes.join(", ") || "none"}; unexpected: ${unexpectedRoutes.join(", ") || "none"})`,
    );
  }
}

if (failures.length > 0) {
  console.error("Build output verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${requiredArtifacts.length} critical artifacts and the historical routes plus declared additions.`);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
