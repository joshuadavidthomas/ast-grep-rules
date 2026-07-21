#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const scriptPath = realpathSync(fileURLToPath(import.meta.url));
const packageRoot = dirname(dirname(scriptPath));
const require = createRequire(import.meta.url);

function describeRuntime() {
  const libc =
    process.platform === "linux"
      ? process.report?.getReport()?.header?.glibcVersionRuntime
        ? "glibc"
        : "musl or unknown libc"
      : undefined;

  return [process.platform, process.arch, libc].filter(Boolean).join("/");
}

function resolveAstGrep() {
  try {
    const packageJson = require.resolve("@ast-grep/cli/package.json");
    const packageRequire = createRequire(packageJson);
    const { resolveBinaryPath } = packageRequire("./postinstall.js");
    const binaryPath = resolveBinaryPath();

    if (!binaryPath) {
      throw new Error("no matching optional binary package was installed");
    }

    return binaryPath;
  } catch (error) {
    throw new Error(
      `Could not load ast-grep for ${describeRuntime()}. ` +
        "Supported targets are glibc Linux x64/arm64, macOS x64/arm64, " +
        "and Windows x64/arm64/ia32. If this target is supported, reinstall " +
        `without --no-optional. ${error.message}`,
    );
  }
}

function resolveSvelteParser() {
  try {
    const packageJson = require.resolve(
      "@tree-sitter-grammars/tree-sitter-svelte/package.json",
    );
    const parserRoot = dirname(packageJson);
    const packageRequire = createRequire(packageJson);
    const nodeGypBuild = packageRequire("node-gyp-build");

    return realpathSync(nodeGypBuild.path(parserRoot));
  } catch (error) {
    throw new Error(
      `Could not load the Svelte parser for ${describeRuntime()}. ` +
        "Prebuilt parsers cover glibc Linux x64, macOS x64/arm64, and " +
        "Windows x64. Other targets need Python and a native compiler. " +
        "After adding those tools, reinstall the hook environment or run " +
        `npm rebuild. ${error.message}`,
    );
  }
}

function renderConfig(parserPath) {
  const templatePath = resolve(packageRoot, "sgconfig.yml");
  const replacements = new Map([
    ["__RULES_DIR__", resolve(packageRoot, "rules")],
    ["__SVELTE_PARSER_LIBRARY__", parserPath],
    ["__TESTS_DIR__", resolve(packageRoot, "tests")],
  ]);
  let config = readFileSync(templatePath, "utf8");

  for (const [placeholder, path] of replacements) {
    if (!config.includes(placeholder)) {
      throw new Error(`Missing ${placeholder} in ${templatePath}.`);
    }
    config = config.replace(placeholder, JSON.stringify(path));
  }

  return config;
}

const args = process.argv.slice(2);
const commandOption = args[0]?.match(/^--ast-grep-command=(scan|test)$/);
const command = commandOption?.[1] ?? "scan";
if (commandOption) args.shift();

let tempDir;

try {
  const astGrep = resolveAstGrep();
  const parserPath = resolveSvelteParser();
  tempDir = mkdtempSync(join(tmpdir(), "ast-grep-rules-"));
  const configPath = join(tempDir, "sgconfig.yml");
  writeFileSync(configPath, renderConfig(parserPath));

  const commandArgs = [command, "--config", configPath];
  if (command === "scan") commandArgs.push("--color=never");
  commandArgs.push(...args);

  const result = spawnSync(astGrep, commandArgs, { stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(`Failed to run ast-grep rules: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
}
