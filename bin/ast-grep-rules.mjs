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

function resolveAstGrep() {
  const packageJson = require.resolve("@ast-grep/cli/package.json");
  const packageRequire = createRequire(packageJson);
  const { resolveBinaryPath } = packageRequire("./postinstall.js");
  const binaryPath = resolveBinaryPath();

  if (!binaryPath) {
    throw new Error(
      "The @ast-grep/cli native binary is missing. Reinstall without --no-optional.",
    );
  }

  return binaryPath;
}

function resolveSvelteParser() {
  const packageJson = require.resolve(
    "@tree-sitter-grammars/tree-sitter-svelte/package.json",
  );
  const parserRoot = dirname(packageJson);
  const packageRequire = createRequire(packageJson);
  const nodeGypBuild = packageRequire("node-gyp-build");

  return realpathSync(nodeGypBuild.path(parserRoot));
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
