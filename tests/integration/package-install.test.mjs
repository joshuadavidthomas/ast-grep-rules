import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const integrationDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = dirname(dirname(integrationDir));
const npmCli = process.env.npm_execpath;

function run(args, cwd) {
  const command = npmCli ? process.execPath : "npm";
  const commandArgs = npmCli ? [npmCli, ...args] : args;

  return spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    shell: !npmCli && process.platform === "win32",
  });
}

test(
  "the packed command installs and scans a Svelte component",
  { timeout: 180_000 },
  () => {
    const tempDir = mkdtempSync(join(tmpdir(), "ast-grep-rules-package-test-"));
    const consumerDir = join(tempDir, "consumer");

    try {
      const packed = run(
        ["pack", "--json", "--pack-destination", tempDir],
        packageRoot,
      );
      assert.equal(packed.status, 0, `${packed.stdout}${packed.stderr}`);

      const [{ filename }] = JSON.parse(packed.stdout);
      mkdirSync(consumerDir);
      writeFileSync(
        join(consumerDir, "package.json"),
        '{"name":"ast-grep-rules-consumer","private":true}\n',
      );
      writeFileSync(
        join(consumerDir, "App.svelte"),
        `<script>
  import { createEventDispatcher } from "svelte";
</script>

<button>Save</button>
`,
      );

      const installed = run(
        [
          "install",
          "--no-audit",
          "--no-fund",
          join(tempDir, filename),
        ],
        consumerDir,
      );
      assert.equal(
        installed.status,
        0,
        `${installed.stdout}${installed.stderr}`,
      );

      const binName =
        process.platform === "win32" ? "ast-grep-rules.cmd" : "ast-grep-rules";
      assert.ok(existsSync(join(consumerDir, "node_modules", ".bin", binName)));

      const scanned = run(
        ["exec", "--offline", "--", "ast-grep-rules", "App.svelte"],
        consumerDir,
      );
      const output = `${scanned.stdout}${scanned.stderr}`;

      assert.equal(scanned.status, 0, output);
      assert.match(output, /App\.svelte/);
      assert.match(output, /warning\[svelte-no-create-event-dispatcher\]/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  },
);
