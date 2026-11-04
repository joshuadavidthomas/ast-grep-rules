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

- Rust rules against storing and passing bare bools: `rust-no-bool-field`, `rust-no-bool-parameter`, `rust-no-bool-tuple`, `rust-no-bool-literal-argument`, and `rust-no-fallible-bool-return`. They skip test files and `#[cfg(test)]` items. `rust-no-bool-field` also skips single-`bool` variant payloads such as `Bool(bool)`.
- Cargo rules for member crate manifests in a workspace: `cargo-workspace-require-dependency` reports dependencies that give a version, `path`, or `git` source instead of `workspace = true`, and `cargo-workspace-require-package-field` reports `[package]` `edition`, `rust-version`, `license`, or `repository` values that do not inherit from the workspace. Manifests with a `[workspace]` table are skipped.
- A `cargo-workspace` pre-commit hook that runs only the Cargo workspace rules on `Cargo.toml` files.
- TOML as an ast-grep custom language, parsed with `@tree-sitter-grammars/tree-sitter-toml`.
- Clippy configuration rules for single crates and workspaces. `clippy-require-lints` reports a package that neither inherits workspace lints nor has a `[lints.clippy]` table. One rule per lint, such as `clippy-require-unwrap-used`, reports a `[lints.clippy]` or `[workspace.lints.clippy]` table that does not enable it, and one rule per setting, such as `clippy-require-allow-expect-in-tests`, reports a `clippy.toml` that does not set it.
- A `clippy` pre-commit hook for `Cargo.toml`, `clippy.toml`, and `.clippy.toml` files. It also reports a `Cargo.toml` with no `clippy.toml` in its directory or a parent, through the wrapper's new `--require-clippy-config` option.
- Shared utility rules in `utils/`, loaded through `utilDirs`.

### Removed

- `rust-no-visible-bool-argument`. `rust-no-bool-parameter` reports the same `bool`, `&bool`, and `Option<bool>` parameters, plus those in private functions. It skips closure predicates such as `impl Fn(u32) -> bool` and test code, which the old rule reported. Replace `--off=rust-no-visible-bool-argument` with `--off=rust-no-bool-parameter`.
- `rust-no-option-bool-field`. `rust-no-bool-field` reports the same `Option<bool>` fields, plus plain `bool`, `AtomicBool`, `Cell<bool>`, and `Vec<bool>` fields and enum variant fields. It skips test code, which the old rule reported. Replace `--off=rust-no-option-bool-field` with `--off=rust-no-bool-field`.

## [0.10.0]

### Changed

- Every rule is now an error, so any finding fails the hook. Warnings never failed the hook and prek hides the output of passing hooks, so a warning rule was effectively off. Suppress a deliberate exception with an inline `ast-grep-ignore` comment that says why, or turn the rule off with `--off`.
- Rule messages are imperatives (Do not … / Use … instead of …) instead of suggestions.

### Fixed

- `swift-no-index-foreach-identity` no longer reports the indices of a static constant reached through its type, such as `ForEach(Self.speeds.indices, id: \.self)` or `ForEach(Avatar.palette.indices, id: \.self)`.

## [0.9.0]

### Added

- Swift rules for SwiftUI performance, accessibility, and deprecated API: `swift-no-any-view`, `swift-no-corner-radius-modifier`, `swift-no-eager-stack-in-scroll-view`, `swift-no-foreground-color`, `swift-no-formatter-in-view-body`, `swift-no-icon-only-button`, `swift-no-index-foreach-identity`, `swift-no-navigation-view`, `swift-no-observable-object`, `swift-no-on-tap-gesture`, `swift-no-print-changes`, `swift-no-single-parameter-on-change`, `swift-no-unstable-view-id`.
- `swift-no-code-barricade`, the shared divider-comment check for Swift.
- The deprecated-API Swift rules (`swift-no-navigation-view`, `swift-no-foreground-color`, `swift-no-corner-radius-modifier`, `swift-no-single-parameter-on-change`) are errors, so they fail the hook; the other SwiftUI rules are warnings.
- A `swift` pre-commit hook that runs only the Swift rules.

### Changed

- Run the bundled rules with ast-grep 0.51.0.

## [0.8.0]

### Changed

- Run the bundled rules with ast-grep 0.50.0.
- Document the Rust rules that overlap with off-by-default Clippy lints and how they differ.

### Removed

- `rust-require-reasoned-clippy-suppression`. Clippy's `allow_attributes_without_reason` covers the same attributes for every lint, not only Clippy's. Enable it, and `allow_attributes` to prefer `expect`.
- `rust-no-empty-braced-struct`. Clippy's `empty_structs_with_brackets` reports the same structs, plus empty tuple structs.

## [0.7.1]

### Fixed

- `typescript-no-shape-in-symbol-names-tsx` no longer reports JSX attribute names such as `<Button shape="square" />`, which belong to the rendered component's API rather than the code being scanned.

## [0.7.0]

### Added

- `rust-no-panicking-match-arm`, which reports match arms that end in `panic!`, `unreachable!`, `todo!`, or `unimplemented!` instead of handling the failed pattern, and skips test files and items under `#[cfg(test)]` or a test attribute.
- `rust-no-dropped-error-source`, which reports `map_err` closures that ignore the source error and `.ok().ok_or(...)` chains, and directs authors to carry the source in the new error.
- `rust-no-indexed-array-rebuild`, which reports array literals that rebuild a fixed-size chunk by indexing the same slice element by element, and directs authors to `split_first_chunk` or `try_into`.
- TypeScript ports of the [anti-slop](https://github.com/dmmulroy/anti-slop) Oxlint rules: chained type assertions, conditional empty-object spreads, known-value widening, `object` parameters, runtime `typeof`, `shape` in symbol names, `unknown` parameters, `unknown` type aliases, and widen-then-assert.

### Changed

- `rust-no-panicking-fallback` and `rust-no-panicking-let-else` now skip test files (`tests.rs`, `tests/`, `*_test.rs`, `*_tests.rs`) and items under `#[cfg(test)]` or a test attribute.
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

[unreleased]: https://github.com/joshuadavidthomas/ast-grep-rules/compare/v0.10.0...HEAD
[0.1.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.1.0
[0.2.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.2.0
[0.3.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.3.0
[0.4.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.4.0
[0.5.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.5.0
[0.6.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.6.0
[0.7.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.7.0
[0.7.1]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.7.1
[0.8.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.8.0
[0.9.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.9.0
[0.10.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.10.0
