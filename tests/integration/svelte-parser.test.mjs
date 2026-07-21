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

test("the wrapper scans plain and TypeScript Svelte scripts", () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "ast-grep-rules-svelte-test-"));

  try {
    writeFileSync(
      join(fixtureDir, "plain.svelte"),
      `<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
</script>

{#if dispatch}
  <button>Save</button>
{/if}
`,
    );
    writeFileSync(
      join(fixtureDir, "typescript.svelte"),
      `<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{ save: void }>();
</script>

{#each [dispatch] as send}
  <button>Save</button>
{/each}
`,
    );

    const result = spawnSync(process.execPath, [wrapperPath, fixtureDir], {
      cwd: fixtureDir,
      encoding: "utf8",
    });
    const output = `${result.stdout}${result.stderr}`;

    assert.equal(result.status, 0, output);
    assert.match(output, /plain\.svelte/);
    assert.match(output, /typescript\.svelte/);
    assert.equal(
      output.match(/warning\[svelte-no-create-event-dispatcher\]/g)?.length,
      4,
      output,
    );
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});
