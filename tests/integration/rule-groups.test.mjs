import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const integrationDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(dirname(integrationDir));
const wrapperPath = resolve(packageRoot, "bin", "ast-grep-rules.mjs");

const fixtures = new Map([
  ["rust", ["example.rs", "// =====\n"]],
  ["typescript", ["example.ts", "// =====\n"]],
  ["svelte", ["example.svelte", "<!-- ===== -->\n"]],
  ["html", ["example.html", "<!-- ===== -->\n"]],
  ["python", ["example.py", "# =====\n"]],
  ["go", ["example.go", "// =====\n"]],
]);

function scan(fixtureDir, group) {
  const args = [wrapperPath];
  if (group) args.push(`--filter=^${group}-`);
  args.push(fixtureDir);

  return spawnSync(process.execPath, args, {
    cwd: fixtureDir,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

function outputOf(result) {
  return `${result.stdout}${result.stderr}`;
}

test("language filters select only their rule group", () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "ast-grep-rule-groups-test-"));

  try {
    for (const [, [filename, source]] of fixtures) {
      writeFileSync(join(fixtureDir, filename), source);
    }

    for (const group of fixtures.keys()) {
      const result = scan(fixtureDir, group);
      const output = outputOf(result);

      assert.equal(result.status, 0, output);
      assert.match(output, new RegExp(`warning\\[${group}-no-code-barricade\\]`));

      for (const otherGroup of fixtures.keys()) {
        if (otherGroup === group) continue;
        assert.doesNotMatch(output, new RegExp(`warning\\[${otherGroup}-`));
      }
    }

    const allRules = scan(fixtureDir);
    const allOutput = outputOf(allRules);

    assert.equal(allRules.status, 0, allOutput);
    for (const group of fixtures.keys()) {
      assert.match(
        allOutput,
        new RegExp(`warning\\[${group}-no-code-barricade\\]`),
      );
    }
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});
