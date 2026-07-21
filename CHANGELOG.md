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

[unreleased]: https://github.com/joshuadavidthomas/ast-grep-rules/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/joshuadavidthomas/ast-grep-rules/releases/tag/v0.1.0
