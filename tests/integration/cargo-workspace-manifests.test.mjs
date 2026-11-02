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

const pinnedMember = `[package]
name = "member"
edition = "2024"

[dependencies]
wasm-bindgen = "0.2"
`;

test("the wrapper checks member Cargo manifests only", () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "ast-grep-rules-cargo-workspace-test-"));

  try {
    mkdirSync(join(fixtureDir, "crates", "member"), { recursive: true });
    mkdirSync(join(fixtureDir, "crates", "inherited"), { recursive: true });
    writeFileSync(
      join(fixtureDir, "Cargo.toml"),
      `[workspace]
members = ["crates/*"]

[workspace.package]
edition = "2024"

[workspace.dependencies]
wasm-bindgen = "0.2"

[package]
name = "root"
edition = "2024"

[dependencies]
clap = "4"
`,
    );
    writeFileSync(
      join(fixtureDir, "crates", "member", "Cargo.toml"),
      pinnedMember,
    );
    writeFileSync(
      join(fixtureDir, "crates", "inherited", "Cargo.toml"),
      `[package]
name = "inherited"
edition.workspace = true

[dependencies]
wasm-bindgen = { workspace = true, features = ["serde-serialize"] }
`,
    );
    writeFileSync(
      join(fixtureDir, "crates", "member", "other.toml"),
      pinnedMember,
    );

    const result = spawnSync(
      process.execPath,
      [wrapperPath, "--filter=^cargo-workspace-", fixtureDir],
      { cwd: fixtureDir, encoding: "utf8" },
    );
    const output = `${result.stdout}${result.stderr}`;

    assert.equal(result.status, 1, output);
    assert.equal(
      output.match(/error\[cargo-workspace-require-dependency\]/g)?.length,
      1,
      output,
    );
    assert.equal(
      output.match(/error\[cargo-workspace-require-package-field\]/g)?.length,
      1,
      output,
    );
    assert.equal(
      output.match(/crates[\\/]member[\\/]Cargo\.toml:\d+:\d+/g)?.length,
      2,
      output,
    );
    assert.doesNotMatch(output, /inherited|other\.toml/);
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});
