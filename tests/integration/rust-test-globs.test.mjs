import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const integrationDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(dirname(integrationDir));
const wrapperPath = resolve(packageRoot, "bin", "ast-grep-rules.mjs");

const source = `
fn from_match_arm(result: Result<u32, Error>) -> u32 {
    match result {
        Ok(value) => value,
        Err(error) => panic!("failed: {error}"),
    }
}

fn from_let_else(option: Option<u32>) -> u32 {
    let Some(value) = option else {
        panic!("missing")
    };
    value
}

fn from_fallback(option: Option<u32>) -> u32 {
    option.unwrap_or_else(|| panic!("missing"))
}
`;

const fixturePaths = [
  "src/lib.rs",
  "src/tests.rs",
  "tests/case.rs",
  "src/frame_test.rs",
  "src/frame_tests.rs",
];

function scan(fixtureDir) {
  return spawnSync(
    process.execPath,
    [wrapperPath, "--filter=^rust-no-panicking-", fixtureDir],
    {
      cwd: fixtureDir,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    },
  );
}

function outputOf(result) {
  return `${result.stdout}${result.stderr}`;
}

function pathLine(path) {
  return new RegExp(`(?:^|\\n).*\\/${path.replaceAll("/", "\\/")}\\b`);
}

test("Rust panicking rules skip test path globs", () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "ast-grep-rust-test-globs-"));

  try {
    mkdirSync(join(fixtureDir, "src"));
    mkdirSync(join(fixtureDir, "tests"));

    for (const path of fixturePaths) {
      writeFileSync(join(fixtureDir, path), source);
    }

    const result = scan(fixtureDir);
    const output = outputOf(result);

    assert.match(output, /error\[rust-no-panicking-match-arm\]/);
    assert.match(output, /error\[rust-no-panicking-let-else\]/);
    assert.match(output, /error\[rust-no-panicking-fallback\]/);
    assert.match(output, pathLine("src/lib.rs"));
    assert.doesNotMatch(output, pathLine("src/tests.rs"));
    assert.doesNotMatch(output, pathLine("tests/case.rs"));
    assert.doesNotMatch(output, pathLine("src/frame_test.rs"));
    assert.doesNotMatch(output, pathLine("src/frame_tests.rs"));
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});
