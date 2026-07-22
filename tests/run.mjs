import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(testsDir);
const wrapperPath = resolve(packageRoot, "bin", "ast-grep-rules.mjs");

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run([
  wrapperPath,
  "--ast-grep-command=test",
  ...process.argv.slice(2),
]);
run([
  "--test",
  resolve(testsDir, "integration", "package-install.test.mjs"),
  resolve(testsDir, "integration", "rule-groups.test.mjs"),
  resolve(testsDir, "integration", "svelte-parser.test.mjs"),
]);
