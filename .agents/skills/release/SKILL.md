---
name: release
description: Cut a new release of ast-grep-rules from the CHANGELOG's Unreleased section.
disable-model-invocation: true
---

# Release

A release is one `:bookmark:` bump PR, squash-merged into `main` once CI is green, then a GitHub release whose tag points at the merge commit. Releases are immutable once published, so every check runs before step 7.

Do local work with whichever VCS the checkout uses (git, or jj when a `.jj/` directory is present), and use `gh` for GitHub.

## 1. Check the starting point

1. A fresh change based on the latest `origin/main`, with no unrelated edits in it.
2. `just test` passes.
3. `CHANGELOG.md` has entries under `## [Unreleased]`.

Done when all three hold. If one fails, stop and tell the user which one.

## 2. Pick the version

Read the current version from `package.json`. The project is on 0.x SemVer, and every rule is an error, so judge each `Unreleased` entry by one question: after upgrading, can a commit that passed the hook before now go **red**? Judge by effect, not by the changelog heading or how big the change is.

- **minor** (0.11.0 → 0.12.0) when any entry can turn a hook red or needs users to change their setup:
  - a new rule, however narrow;
  - a rule that now reports more, even when it is filed under `Fixed`;
  - a removed or renamed rule ID, which breaks `--off` flags and `ast-grep-ignore` comments that name it;
  - a new bundled ast-grep or parser version, since the matches can shift;
  - a changed CLI option, hook ID, or supported Node.js range;
  - a rule that now reports less, including false-positive fixes, because an `ast-grep-ignore` comment that matched the old finding becomes unused and fails under `--error=unused-suppression`.
- **patch** (0.11.0 → 0.11.1) when every entry leaves what each rule reports unchanged: message or note wording, docs, tests, tooling.

A new opt-in feature that can't fail anyone's hook, such as a new hook or flag, is still minor. That's what minor is for.

Done when every entry is classified and the user confirms the version. Name the entry that decided it. If an entry's effect is unclear from the changelog, read its commit diff before you classify it.

## 3. Bump the version

1. `npm version X.Y.Z --no-git-tag-version` updates `package.json` and `package-lock.json`.
2. In `CHANGELOG.md`:
   - Add `## [X.Y.Z]` directly below `## [Unreleased]`, so the existing entries move under the new heading and `Unreleased` is left empty.
   - Change the `[unreleased]:` link to compare `vX.Y.Z...HEAD`.
   - Add `[X.Y.Z]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/vX.Y.Z` as the last link.
3. In `README.md`, change the pinned install line to `#vX.Y.Z`.

Commit the bump as `:bookmark: bump version <old> -> X.Y.Z`.

Done when `rg -F "<old version>" --glob '!CHANGELOG.md'` prints nothing and the commit changes exactly those four files.

## 4. Open the PR

Push the bump commit to a new `release-vX.Y.Z` branch on `origin`, then:

```bash
gh pr create --head release-vX.Y.Z --base main \
  --title ":bookmark: bump version <old> -> X.Y.Z" \
  --body "<the X.Y.Z section of CHANGELOG.md>"
```

Done when `gh pr create` prints the PR URL and `gh pr diff <number> --name-only` lists exactly the four bumped files.

## 5. Wait for checks

```bash
gh pr checks <number> --watch --fail-fast
```

Right after the PR opens, `gh` can report that no checks exist yet. Wait a few seconds and run it again.

Done when every check passes. If one fails, stop: leave the PR open and give the user the failing check and its log (`gh run view <run-id> --log-failed`).

## 6. Merge

```bash
gh pr merge <number> --squash
gh pr view <number> --json state,mergeCommit --jq '.state, .mergeCommit.oid'
```

Done when the state is `MERGED` and you have the merge commit SHA.

## 7. Create the release

`gh release create` makes the tag when it doesn't exist. Pin it to the merge commit with `--target`:

```bash
gh release create vX.Y.Z --target <merge sha> --generate-notes
```

Done when `gh release view vX.Y.Z` shows the release and `gh api repos/joshuadavidthomas/ast-grep-rules/commits/vX.Y.Z --jq .sha` prints the merge commit's SHA. Give the user the PR and release URLs.
