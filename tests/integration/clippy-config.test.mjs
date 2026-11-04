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

const rootManifest = `[workspace]
members = ["crates/*"]

[workspace.lints.clippy]
pedantic = { level = "warn", priority = -1 }
allow_attributes = "warn"
allow_attributes_without_reason = "warn"
clone_on_ref_ptr = "warn"
dbg_macro = "warn"
expect_used = "warn"
get_unwrap = "warn"
let_underscore_must_use = "warn"
map_err_ignore = "warn"
mem_forget = "warn"
mod_module_files = "warn"
multiple_unsafe_ops_per_block = "warn"
panic_in_result_fn = "warn"
todo = "warn"
undocumented_unsafe_blocks = "warn"
unimplemented = "warn"
unreachable = "warn"
unused_result_ok = "warn"
unwrap_in_result = "warn"
unwrap_used = "deny"
wildcard_enum_match_arm = "warn"

[package]
name = "app"

[lints]
workspace = true
`;

const memberManifest = `[package]
name = "member"

[lints]
workspace = true
`;

const clippyConfig = `accept-comment-above-attributes = true
accept-comment-above-statement = true
allow-expect-in-consts = true
allow-expect-in-tests = true
allow-unwrap-in-consts = true
`;

const manifests = ["Cargo.toml", join("crates", "member", "Cargo.toml")];

function scan(fixtureDir, paths, extraArgs = ["--require-clippy-config"]) {
  const result = spawnSync(
    process.execPath,
    [wrapperPath, "--filter=^clippy-", ...extraArgs, ...paths],
    { cwd: fixtureDir, encoding: "utf8" },
  );
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

function countOf(output, ruleId) {
  return output.match(new RegExp(`error\\[${ruleId}\\]`, "g"))?.length ?? 0;
}

test("the clippy hook requires lints and a clippy.toml", () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "ast-grep-rules-clippy-test-"));

  try {
    mkdirSync(join(fixtureDir, "crates", "member"), { recursive: true });
    writeFileSync(join(fixtureDir, "Cargo.toml"), rootManifest);
    writeFileSync(join(fixtureDir, manifests[1]), memberManifest);
    writeFileSync(join(fixtureDir, "clippy.toml"), clippyConfig);

    const configured = scan(fixtureDir, [...manifests, "clippy.toml"]);
    assert.equal(configured.status, 0, configured.output);

    rmSync(join(fixtureDir, "clippy.toml"));
    const missing = scan(fixtureDir, manifests);
    assert.equal(missing.status, 1, missing.output);
    assert.equal(countOf(missing.output, "clippy-require-config-file"), 2);
    assert.match(missing.output, /┌─ Cargo\.toml\n/);
    assert.match(missing.output, /┌─ crates[\\/]member[\\/]Cargo\.toml\n/);

    const unchecked = scan(fixtureDir, manifests, []);
    assert.equal(unchecked.status, 0, unchecked.output);

    writeFileSync(
      join(fixtureDir, "crates", "member", ".clippy.toml"),
      clippyConfig,
    );
    const memberOnly = scan(fixtureDir, manifests);
    assert.equal(countOf(memberOnly.output, "clippy-require-config-file"), 1);
    assert.match(memberOnly.output, /┌─ Cargo\.toml\n/);

    writeFileSync(join(fixtureDir, "clippy.toml"), "\n");
    const blank = scan(fixtureDir, manifests);
    assert.equal(countOf(blank.output, "clippy-require-config-file"), 1);
    assert.match(blank.output, /┌─ Cargo\.toml\n/);

    writeFileSync(
      join(fixtureDir, "clippy.toml"),
      "allow-expect-in-tests = true\n",
    );
    writeFileSync(
      join(fixtureDir, "crates", "member", "Cargo.toml"),
      '[package]\nname = "member"\n',
    );
    const partial = scan(fixtureDir, [...manifests, "clippy.toml"]);
    assert.equal(partial.status, 1, partial.output);
    assert.equal(countOf(partial.output, "clippy-require-config-file"), 0);
    assert.equal(countOf(partial.output, "clippy-require-lints"), 1);
    assert.equal(
      countOf(partial.output, "clippy-require-allow-expect-in-tests"),
      0,
    );
    assert.equal(
      countOf(partial.output, "clippy-require-allow-unwrap-in-consts"),
      1,
    );
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});
