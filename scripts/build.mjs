import { build, transform } from "esbuild";
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { audioManifest, criticalImageAssets } from "../src/asset-manifest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const docsDir = path.join(rootDir, "docs");
const docsAssetsDir = path.join(docsDir, "assets");
const docsDataDir = path.join(docsAssetsDir, "data");
const sourceDataDir = path.join(rootDir, "assets", "data");

async function ensureCleanDir(dir) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

async function buildJavaScript() {
  await build({
    entryPoints: [path.join(rootDir, "src", "app.js")],
    bundle: true,
    format: "esm",
    minify: true,
    target: ["es2020"],
    outfile: path.join(docsAssetsDir, "app.min.js"),
    legalComments: "none",
  });
}

async function buildCss() {
  const source = await readFile(path.join(rootDir, "src", "style.css"), "utf8");
  const result = await transform(source, {
    loader: "css",
    minify: true,
    legalComments: "none",
  });

  await writeFile(path.join(docsAssetsDir, "style.min.css"), result.code);
}

async function copyOptimizedAsset(fileName) {
  const sourcePath = path.join(sourceDataDir, fileName);
  const ext = path.extname(fileName).toLowerCase();
  const musicConfig = audioManifest.music;

  if (fileName === musicConfig.buildSource) {
    await buildMusicAssets(sourcePath, musicConfig);
    return;
  }

  const outputPath = path.join(docsDataDir, fileName);
  if (ext !== ".png") {
    await copyFile(sourcePath, outputPath);
    return;
  }

  const originalBuffer = await readFile(sourcePath);
  const optimizedBuffer = await sharp(originalBuffer)
    .png({
      compressionLevel: 9,
      effort: 10,
      adaptiveFiltering: true,
      palette: true,
      quality: 90,
    })
    .toBuffer();

  await writeFile(outputPath, optimizedBuffer.length < originalBuffer.length ? optimizedBuffer : originalBuffer);
}

async function compressMusicAsset(sourcePath, outputPath) {
  await new Promise((resolve, reject) => {
    const args = [
      sourcePath,
      "-o",
      outputPath,
      "-f",
      "m4af",
      "-d",
      "aac",
      "-b",
      "64000",
      "-q",
      "64",
      "-s",
      "3",
    ];

    const child = spawn("/usr/bin/afconvert", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(`afconvert exited with code ${code}\n${stderr}`));
        return;
      }

      const [sourceInfo, outputInfo] = await Promise.all([stat(sourcePath), stat(outputPath)]);
      if (outputInfo.size >= sourceInfo.size) {
        await copyFile(sourcePath, outputPath);
      }
      resolve();
    });
  });
}

async function buildMusicAssets(sourcePath, musicConfig) {
  const optimizedPath = path.join(docsDataDir, musicConfig.optimizedFile);
  const fallbackPath = path.join(docsDataDir, musicConfig.fallbackFile);

  await copyFile(sourcePath, fallbackPath);

  try {
    await compressMusicAsset(sourcePath, optimizedPath);
  } catch (error) {
    console.warn(`Music compression skipped: ${error.message}`);
  }
}

async function buildAssets() {
  const files = await readdir(sourceDataDir);
  await Promise.all(files.map((fileName) => copyOptimizedAsset(fileName)));
}

async function writeHtml() {
  const preloadLinks = criticalImageAssets
    .map(({ file }) => `    <link rel="preload" as="image" href="./assets/data/${file}" />`)
    .join("\n");
  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    />
    <title>SuperJumper HTML5</title>
${preloadLinks}
    <link rel="stylesheet" href="./assets/style.min.css" />
  </head>
  <body>
    <div class="wrap">
      <canvas id="game" width="320" height="480" aria-label="super jumper game"></canvas>
    </div>
    <script type="module" src="./assets/app.min.js"></script>
  </body>
</html>
`;

  await writeFile(path.join(docsDir, "index.html"), html);
  await writeFile(path.join(docsDir, ".nojekyll"), "");
}

async function writeBuildSummary() {
  const files = [
    path.join(docsAssetsDir, "app.min.js"),
    path.join(docsAssetsDir, "style.min.css"),
    ...criticalImageAssets.map(({ file }) => path.join(docsDataDir, file)),
    path.join(docsDataDir, "music.m4a"),
    path.join(docsDataDir, "music.mp3"),
  ];

  const lines = ["# Build Output", ""];
  for (const filePath of files) {
    try {
      const info = await stat(filePath);
      const relativePath = path.relative(rootDir, filePath);
      lines.push(`- ${relativePath}: ${info.size} bytes`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  await writeFile(path.join(docsDir, "BUILD_STATS.md"), `${lines.join("\n")}\n`);
}

async function main() {
  await ensureCleanDir(docsDir);
  await mkdir(docsAssetsDir, { recursive: true });
  await mkdir(docsDataDir, { recursive: true });

  await Promise.all([buildJavaScript(), buildCss(), buildAssets()]);
  await writeHtml();
  await writeBuildSummary();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
