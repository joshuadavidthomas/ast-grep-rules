# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project attempts to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
## [${version}]
### Added - for new features
### Changed - for changes in existing functionality
### Deprecated - for soon-to-be removed features
### Removed - for now removed features
### Fixed - for any bug fixes
### Security - in case of vulnerabilities
[${version}]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v${version}
-->

## [Unreleased]

### Added

- `rust-no-indexed-array-rebuild`, which reports array literals that rebuild a fixed-size chunk by indexing the same slice element by element, and directs authors to `split_first_chunk` or `try_into`.
- TypeScript ports of the [anti-slop](https://github.com/dmmulroy/anti-slop) Oxlint rules: chained type assertions, conditional empty-object spreads, known-value widening, `object` parameters, runtime `typeof`, `shape` in symbol names, `unknown` parameters, `unknown` type aliases, and widen-then-assert.

### Changed

- `typescript-no-record-string-unknown` now reports dictionary value holes spelled as `unknown`, `any`, `object`, or `{}`, including index signatures and `Readonly`/`NonNullable` wrappers.

## [0.6.0]

### Added

- `typescript-no-record-string-unknown`, which reports `Record<string, unknown>` in any type position and directs authors to declare the actual object shape or parse `unknown` input with a schema.

## [0.5.0]

### Added

- `pi-extension-no-console-log`, which reports direct terminal output from typed Pi extension entry points and points authors to `ctx.ui`, tool results, and renderers.
- `opencode-plugin-no-console-log` and `opencode-plugin-no-console-log-tsx`, which direct OpenCode plugin output to TUI feedback, structured server logs, or tool results.
- Product-scoped `pi` and `opencode` pre-commit hooks.

## [0.4.0]

### Changed

- Replace the `ast-grep-rules` pre-commit hook with the language-scoped `rust`, `typescript`, `svelte`, `html`, `python`, and `go` hooks, plus `all` for the full rule set. Projects can now install only the rule groups they use.

## [0.3.0]

### Added

- `rust-no-panicking-let-else`, which reports `let`-`else` branches that end in `panic!`, `unreachable!`, `todo!`, or `unimplemented!` instead of handling the failed pattern.

## [0.2.0]

### Added

- `rust-no-panicking-fallback`, which reports `unwrap_or_else` and `map_or_else` fallbacks that end in `panic!`, `unreachable!`, `todo!`, or `unimplemented!`.
- `rust-require-reasoned-clippy-suppression`, which requires a `reason` on Clippy `allow`, `expect`, and conditional `cfg_attr` suppressions.

### Changed

- Document use with prek and direct Node.js installation, including first-run setup, tracked-file behavior, and native parser requirements.
- Support the maintained Node.js 22, 24, and 26 release lines.
- Include the operating system, architecture, and libc in errors when ast-grep or the Svelte parser cannot load.

## [0.1.0]

### Added

- 22 language-prefixed ast-grep rules:
  - Rust, TypeScript, HTML, Svelte, Python, and Go checks for decorative divider comments.
  - Rust checks for `anyhow` in public APIs, `deny(warnings)`, `Deref` polymorphism, empty braced structs, `Option<bool>` fields, public struct fields, public tuple-newtype fields, single-field structs, single-member enums, string error variants, trivial whitespace helpers, visible Boolean arguments, and error enums without `thiserror::Error`.
  - TypeScript checks for generic error-message helpers and hand-written object type guards.
  - A Svelte check for deprecated `createEventDispatcher` use.
- A Node.js command that runs the pinned ast-grep CLI with the bundled rules and resolves the custom Svelte parser on each supported platform.
- TypeScript injection for plain and `lang="ts"` Svelte script blocks.
- A pre-commit hook that installs and runs the rule set without a project-local ast-grep config.
- `just scan` checks for blanket suppressions and stale suppression comments.
- Valid and invalid cases plus snapshots for every rule, with an integration test for Svelte parsing.
- GitHub Actions test runs on Linux, macOS, and Windows.
- Setup, use, rule reference, and contribution docs.

### New Contributors

- Josh Thomas <josh@joshthomas.dev> (maintainer)

[unreleased]: https://github.com/joshuadavidthomas/ast-grep-rules/compare/v0.6.0...HEAD
[0.1.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.1.0
[0.2.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.2.0
[0.3.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.3.0
[0.4.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.4.0
[0.5.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.5.0
[0.6.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.6.0
