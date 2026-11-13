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
from django.db.models import Q

def run(request, pk):
    Thing.objects.filter(owner=request.user).update(seen=True)
    Thing.objects.get(pk=pk, owner=request.user)
    Thing.objects.create(owner=request.user)
    Thing.objects.select_for_update().get(pk=pk)
    return Q(owner=request.user)
`;

const rules = [
  "django-no-query-outside-models",
  "django-no-get-with-filter",
  "django-no-create-outside-managers",
  "django-no-select-for-update-outside-models",
  "django-no-q-outside-models",
];

const reportedPaths = ["app/views.py", "app/services.py", "app/management/commands/sync.py"];

const skippedPaths = [
  "app/models.py",
  "app/models/thing.py",
  "app/managers.py",
  "app/managers/thing.py",
  "app/querysets.py",
  "app/querysets/thing.py",
  "app/migrations/0002_backfill.py",
  "app/tests.py",
  "app/tests/test_views.py",
  "app/test_services.py",
  "app/views_tests.py",
  "conftest.py",
];

// FilterSet modules may query and build Q objects, but not create or lock rows.
const filterPaths = ["app/filters.py", "app/filters/thing.py"];
const filterRules = new Set(["django-no-create-outside-managers", "django-no-select-for-update-outside-models"]);

function scan(fixtureDir) {
  return spawnSync(
    process.execPath,
    [wrapperPath, "--filter=^django-", "--json=compact", fixtureDir],
    { cwd: fixtureDir, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } },
  );
}

function normalize(path) {
  return path.replaceAll("\\", "/");
}

test("Django rules skip model, manager, queryset, migration, and test modules", () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), "ast-grep-django-globs-"));

  try {
    for (const path of [...reportedPaths, ...skippedPaths, ...filterPaths]) {
      mkdirSync(dirname(join(fixtureDir, path)), { recursive: true });
      writeFileSync(join(fixtureDir, path), source);
    }

    const result = scan(fixtureDir);
    assert.equal(result.status, 1, result.stderr);

    const found = new Set(
      JSON.parse(result.stdout).map(
        (match) => `${normalize(match.file).replace(/^.*?(app\/|conftest)/, "$1")} ${match.ruleId}`,
      ),
    );

    for (const path of reportedPaths) {
      for (const rule of rules) assert.ok(found.has(`${path} ${rule}`), `${path} ${rule}`);
    }

    for (const path of skippedPaths) {
      for (const rule of rules) assert.ok(!found.has(`${path} ${rule}`), `${path} ${rule}`);
    }

    for (const path of filterPaths) {
      for (const rule of rules) {
        assert.equal(found.has(`${path} ${rule}`), filterRules.has(rule), `${path} ${rule}`);
      }
    }
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});
