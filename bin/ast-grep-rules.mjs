#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
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

function resolveParser(packageName, languageName) {
  try {
    const packageJson = require.resolve(`${packageName}/package.json`);
    const parserRoot = dirname(packageJson);
    const packageRequire = createRequire(packageJson);
    const nodeGypBuild = packageRequire("node-gyp-build");

    return realpathSync(nodeGypBuild.path(parserRoot));
  } catch (error) {
    throw new Error(
      `Could not load the ${languageName} parser for ${describeRuntime()}. ` +
        "Prebuilt parsers cover glibc Linux x64, macOS x64/arm64, and " +
        "Windows x64. Other targets need Python and a native compiler. " +
        "After adding those tools, reinstall the hook environment or run " +
        `npm rebuild. ${error.message}`,
    );
  }
}

function renderConfig(parserPaths) {
  const templatePath = resolve(packageRoot, "sgconfig.yml");
  const replacements = new Map([
    ["__RULES_DIR__", resolve(packageRoot, "rules")],
    ["__UTILS_DIR__", resolve(packageRoot, "utils")],
    ["__SVELTE_PARSER_LIBRARY__", parserPaths.svelte],
    ["__TOML_PARSER_LIBRARY__", parserPaths.toml],
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

// Clippy reads its settings only from the first clippy.toml or .clippy.toml in
// the manifest directory or a parent, so ast-grep cannot report a missing one.
function findManifestsWithoutClippyConfig(paths) {
  const stopDir = process.cwd();

  return paths.filter((path) => {
    if (basename(path) !== "Cargo.toml" || !existsSync(path)) return false;

    for (let dir = dirname(resolve(path)); ; dir = dirname(dir)) {
      const config = ["clippy.toml", ".clippy.toml"]
        .map((name) => join(dir, name))
        .find((candidate) => existsSync(candidate));
      if (config) return readFileSync(config, "utf8").trim() === "";
      if (dir === stopDir || dirname(dir) === dir) return true;
    }
  });
}

const args = process.argv.slice(2);
const commandOption = args[0]?.match(/^--ast-grep-command=(scan|test)$/);
const command = commandOption?.[1] ?? "scan";
if (commandOption) args.shift();
const requireClippyConfigIndex = args.indexOf("--require-clippy-config");
if (requireClippyConfigIndex !== -1) args.splice(requireClippyConfigIndex, 1);

let tempDir;

try {
  const astGrep = resolveAstGrep();
  const parserPaths = {
    svelte: resolveParser("@tree-sitter-grammars/tree-sitter-svelte", "Svelte"),
    toml: resolveParser("@tree-sitter-grammars/tree-sitter-toml", "TOML"),
  };
  tempDir = mkdtempSync(join(tmpdir(), "ast-grep-rules-"));
  const configPath = join(tempDir, "sgconfig.yml");
  writeFileSync(configPath, renderConfig(parserPaths));

  const commandArgs = [
    command,
    "--config",
    configPath,
    "--custom-languages=allow",
  ];
  if (command === "scan") commandArgs.push("--color=never");
  commandArgs.push(...args);

  const result = spawnSync(astGrep, commandArgs, { stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;

  if (requireClippyConfigIndex !== -1) {
    const paths = args.filter((arg) => !arg.startsWith("-"));

    for (const manifest of findManifestsWithoutClippyConfig(paths)) {
      console.log(
        "error[clippy-require-config-file]: Add a clippy.toml with the " +
          "required settings next to this Cargo.toml or in a parent " +
          "directory; Clippy does not read its settings from Cargo.toml.",
      );
      console.log(`  ┌─ ${manifest}\n`);
      process.exitCode ||= 1;
    }
  }
} catch (error) {
  console.error(`Failed to run ast-grep rules: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
}
