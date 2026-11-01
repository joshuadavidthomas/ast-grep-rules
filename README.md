# ast-grep-rules

An opinionated set of [ast-grep](https://ast-grep.github.io/) rules for Rust, TypeScript, Svelte, HTML, Python, Go, Swift, Pi extensions, and OpenCode plugins.

The rules catch API design problems, weak error handling, deprecated Svelte patterns, SwiftUI performance and accessibility mistakes, and code clutter. Pre-commit users can choose rules by language or run the whole set.

## Use with prek or pre-commit

Install [prek](https://prek.j178.dev/) (recommended for faster installs and runs) or [pre-commit](https://pre-commit.com/#install). Both use the same `.pre-commit-config.yaml`.

Choose `all` to run every rule:

```yaml
repos:
  - repo: https://github.com/joshuadavidthomas/ast-grep-rules
    rev: main
    hooks:
      - id: all
```

Set `rev` to a release tag when you want a fixed version. To select rule groups instead, list only the hooks the project needs:

```yaml
repos:
  - repo: https://github.com/joshuadavidthomas/ast-grep-rules
    rev: main
    hooks:
      - id: pi
      - id: opencode
```

| Hook | Files checked | Rules selected |
| --- | --- | --- |
| `all` | All text files | Every rule |
| `rust` | Rust | IDs starting with `rust-` |
| `typescript` | TypeScript and Svelte script blocks | IDs starting with `typescript-` |
| `pi` | TypeScript Pi extensions | IDs starting with `pi-` |
| `opencode` | TypeScript and TSX OpenCode plugins | IDs starting with `opencode-` |
| `svelte` | Svelte | IDs starting with `svelte-` |
| `html` | HTML | IDs starting with `html-` |
| `python` | Python | IDs starting with `python-` |
| `go` | Go | IDs starting with `go-` |
| `swift` | Swift | IDs starting with `swift-` |

Language hooks include the shared checks for that language because shared rule IDs carry the same language prefix. For example, `rust` includes `rust-no-code-barricade`. Pi and OpenCode use product prefixes so each plugin ecosystem can run only its own rules.

With prek, install the Git hook and prepare its environment up front:

```sh
prek install --prepare-hooks
prek run all --all-files
```

The equivalent pre-commit commands are:

```sh
pre-commit install --install-hooks
pre-commit run all --all-files
```

Preparing the hook downloads an isolated Node.js environment, ast-grep, and the Svelte parser. Later runs reuse that environment. The project does not need Node.js or an `sgconfig.yml`.

Both tools scan tracked files. Add a new file to version control before expecting `--all-files` to include it. Every rule is an error, so any finding fails the hook. To keep a deliberate exception, put an `// ast-grep-ignore: <rule-id>` comment on the line above it and say why, or turn the rule off as shown below.

### Turn off rules

Pass ast-grep's `--off` option once for each rule:

```yaml
repos:
  - repo: https://github.com/joshuadavidthomas/ast-grep-rules
    rev: main
    hooks:
      - id: rust
        args:
          - --off=rust-no-single-field-struct
          - --off=rust-no-visible-bool-argument
```

## Use as a Node.js command

Install the tagged Git package in a project that uses Node.js 22, 24, or 26:

```sh
npm install --save-dev "github:joshuadavidthomas/ast-grep-rules#v0.9.0"
npx ast-grep-rules .
```

The command uses its packaged rules and configuration. Pass any [`ast-grep scan`](https://ast-grep.github.io/reference/cli/scan.html) options after the command.

## Run from this repository

Install a [maintained Node.js release](https://nodejs.org/en/about/previous-releases) (22, 24, or 26) and [just](https://just.systems/), then install the pinned ast-grep CLI and Svelte parser:

```sh
npm install
```

Scan a project:

```sh
just scan /path/to/project
```

`just scan` also reports blanket suppressions and stale suppression comments. To run the rule tests:

```sh
just test
```

Install [uv](https://docs.astral.sh/uv/) only if you need to audit the GitHub Actions workflows with Zizmor:

```sh
just lint
```

## Rule reference

All rules link to their definitions. Most definitions include a `note` with exceptions and replacement advice.

### Common

| Rule | Language | Severity | Reports |
| --- | --- | --- | --- |
| [`rust-no-code-barricade`](rules/common-no-code-barricade.yml) | Rust | error | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`typescript-no-code-barricade`](rules/common-no-code-barricade.yml) | TypeScript | error | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`html-no-code-barricade`](rules/common-no-code-barricade.yml) | HTML | error | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`svelte-no-code-barricade`](rules/common-no-code-barricade.yml) | Svelte | error | Decorative divider comments in Svelte templates. Use a plain section comment or split the file. |
| [`python-no-code-barricade`](rules/common-no-code-barricade.yml) | Python | error | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`go-no-code-barricade`](rules/common-no-code-barricade.yml) | Go | error | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`swift-no-code-barricade`](rules/common-no-code-barricade.yml) | Swift | error | Decorative divider comments made from repeated punctuation. Use `// MARK: - Section` or split the file. |

### Rust

These rules target patterns that rustc and Clippy do not report. A few overlap with off-by-default Clippy lints but match differently:

- `rust-no-dropped-error-source` also reports `.ok().ok_or(...)`, which `clippy::map_err_ignore` misses.
- `rust-no-panicking-fallback`, `rust-no-panicking-let-else`, and `rust-no-panicking-match-arm` report only a panic that stands in for handling a failed value, and skip tests. `clippy::panic` and related lints report every panic, and `clippy::match_wild_err_arm` covers only `Err(_)` arms.

| Rule | Severity | Reports |
| --- | --- | --- |
| [`rust-no-anyhow-in-public-api`](rules/rust-no-anyhow-in-public-api.yml) | error | Visible functions, trait methods, and type aliases that expose `anyhow`. Return an error type callers can inspect. |
| [`rust-no-deny-warnings`](rules/rust-no-deny-warnings.yml) | error | `#![deny(warnings)]`, which can break a build when a compiler or dependency adds a warning. Set explicit lint levels instead. |
| [`rust-no-deref-polymorphism`](rules/rust-no-deref-polymorphism.yml) | error | `Deref` implementations used for API forwarding. Reserve `Deref` for smart pointers and expose methods on other types. |
| [`rust-no-dropped-error-source`](rules/rust-no-dropped-error-source.yml) | error | `map_err(\|_\| Error::Variant)` and `.ok().ok_or(...)` that discard the original error. Carry the source in the new error instead. |
| [`rust-no-indexed-array-rebuild`](rules/rust-no-indexed-array-rebuild.yml) | error | `[bytes[0], bytes[1], ...]` array literals that index the same slice element by element. Take the chunk with `split_first_chunk` or `try_into` instead. |
| [`rust-no-option-bool-field`](rules/rust-no-option-bool-field.yml) | error | `Option<bool>` struct fields. Name the three states with an enum. |
| [`rust-no-panicking-fallback`](rules/rust-no-panicking-fallback.yml) | error | `unwrap_or_else` and `map_or_else` fallbacks that end in a panic or another diverging macro. Handle the failed or absent value instead. Skips test files and `#[cfg(test)]` items. |
| [`rust-no-panicking-let-else`](rules/rust-no-panicking-let-else.yml) | error | `let`-`else` branches that end in a panic or another diverging macro. Return, break, continue, or model the failed pattern. Skips test files and `#[cfg(test)]` items. |
| [`rust-no-panicking-match-arm`](rules/rust-no-panicking-match-arm.yml) | error | Match arms that end in a panic or another diverging macro. Return, propagate, or give the arm a real value. Skips test files and `#[cfg(test)]` items. |
| [`rust-no-public-struct-fields`](rules/rust-no-public-struct-fields.yml) | error | Visible fields on visible structs. Keep representation private unless the struct is passive data. |
| [`rust-no-public-tuple-newtype-field`](rules/rust-no-public-tuple-newtype-field.yml) | error | Visible tuple-newtype fields. Keep the field private and expose chosen constructors or accessors. |
| [`rust-no-single-field-struct`](rules/rust-no-single-field-struct.yml) | error | Named-field structs with one field. Use a tuple newtype unless an external schema or FFI needs the field name. |
| [`rust-no-single-member-enum`](rules/rust-no-single-member-enum.yml) | error | Enums with one variant, except `#[non_exhaustive]` enums. Use a struct or newtype, or add the missing variants. |
| [`rust-no-string-error-variant`](rules/rust-no-string-error-variant.yml) | error | Bare `String` payloads in variants of enums named `Error` or ending in `Error`. Keep structured fields or source errors. |
| [`rust-no-trivial-whitespace-helper`](rules/rust-no-trivial-whitespace-helper.yml) | error | Local helpers that only wrap standard whitespace checks. Inline the check or name the domain policy it implements. |
| [`rust-no-visible-bool-argument`](rules/rust-no-visible-bool-argument.yml) | error | `bool` parameters in visible functions and trait methods. Use a named enum or split the operation. |
| [`rust-require-thiserror-error-enum`](rules/rust-require-thiserror-error-enum.yml) | error | Error enums without a `thiserror::Error` derive. Derive it instead of hand-writing error behavior. |

### TypeScript

| Rule | Severity | Reports |
| --- | --- | --- |
| [`typescript-no-chained-type-assertions`](rules/typescript-no-chained-type-assertions.yml) | error | Nested `as` or angle-bracket assertions, except chains made only of `const`. Keep the original type or parse unknown input at its boundary. |
| [`typescript-no-conditional-empty-object-spread`](rules/typescript-no-conditional-empty-object-spread.yml) | error | Object spreads that use `{}` on one side of a ternary to omit a field. Write the property or build the object in later statements. |
| [`typescript-no-generic-error-message-helper`](rules/typescript-no-generic-error-message-helper.yml) | error | Helpers that reduce an unknown error to `error.message` or `String(error)`. Preserve the original error and write separate user-facing text. |
| [`typescript-no-hand-rolled-object-type-guard`](rules/typescript-no-hand-rolled-object-type-guard.yml) | error | Object type predicates over unknown input that rely on `typeof value === "object"`. Parse the expected shape with a schema validator. |
| [`typescript-no-known-value-widening`](rules/typescript-no-known-value-widening.yml) | error | A written literal, array, object, or function given an explicit `unknown`, `object`, `Record`, or anonymous object type. Keep inference, use `satisfies`, or name the owner type. |
| [`typescript-no-object-parameters`](rules/typescript-no-object-parameters.yml) | error | Function parameters typed as `object`. Use the owner type or parse the input at its boundary. |
| [`typescript-no-record-string-unknown`](rules/typescript-no-record-string-unknown.yml) | error | Dictionary types whose value is `unknown`, `any`, `object`, or `{}`, including index signatures and `Readonly`/`NonNullable` wrappers. Declare the actual value type, or keep the input `unknown` and parse it at the boundary. |
| [`typescript-no-runtime-typeof`](rules/typescript-no-runtime-typeof.yml) | error | Runtime `typeof` checks. Parse the value into a domain type at the I/O boundary. |
| [`typescript-no-shape-in-symbol-names`](rules/typescript-no-shape-in-symbol-names.yml) | error | The word `shape` in a TypeScript identifier. Name the owner type or the parsed domain value. |
| [`typescript-no-shape-in-symbol-names-tsx`](rules/typescript-no-shape-in-symbol-names.yml) | error | The same `shape` name check for TSX identifiers. |
| [`typescript-no-unknown-parameters`](rules/typescript-no-unknown-parameters.yml) | error | Parameters typed as `unknown`, except a parameter named `cause`. Give the input a named contract or parse it at the I/O boundary. |
| [`typescript-no-unknown-type-aliases`](rules/typescript-no-unknown-type-aliases.yml) | error | Type aliases that only rename `unknown`. Keep `unknown` visible or replace it with the parsed owner type. |
| [`typescript-no-widen-then-assert`](rules/typescript-no-widen-then-assert.yml) | error | A local `const` widened to `unknown`, `any`, `object`, or `Record<..., unknown>` and later asserted to a narrower type. Keep the precise type, or parse unknown input once at the boundary. |

### Swift

These rules target SwiftUI mistakes that compile cleanly, drawn from the [SwiftUI Pro](https://github.com/twostraws/SwiftUI-Agent-Skill) and [SwiftUI performance audit](https://github.com/Dimillian/Skills) agent skills. They need no iOS SDK, so they run where a compiler cannot report anything. The compiler never warns about the soft-deprecated APIs (`NavigationView`, `foregroundColor()`, `cornerRadius()`), and it warns about `onChange(of:perform:)` only in a macOS build that targets iOS 17 or later.

A few rules overlap with [SwiftLint](https://github.com/realm/SwiftLint) but match differently:

- `swift-no-on-tap-gesture` reports every `onTapGesture` that does not read the tap count or location, and asks for a `Button`. SwiftLint's `accessibility_trait_for_button` accepts a tap gesture that adds the `.isButton` or `.isLink` trait.
- `swift-no-icon-only-button` reports only `Button` and `Menu` labels made of a single `Image`. SwiftLint's opt-in `accessibility_label_for_image` reports any image without a label or a decorative marker.

| Rule | Severity | Reports |
| --- | --- | --- |
| [`swift-no-any-view`](rules/swift-no-any-view.yml) | error | `AnyView(...)`, which hides the view type from SwiftUI's diffing. Return `some View` from a `@ViewBuilder`, use `Group`, or make the container generic. |
| [`swift-no-corner-radius-modifier`](rules/swift-no-corner-radius-modifier.yml) | error | The soft-deprecated `cornerRadius()` modifier. Use `clipShape(.rect(cornerRadius:))`. |
| [`swift-no-eager-stack-in-scroll-view`](rules/swift-no-eager-stack-in-scroll-view.yml) | error | A `VStack` or `HStack` directly inside a `ScrollView` that contains a `ForEach`. Use `LazyVStack`, `LazyHStack`, or `List`. |
| [`swift-no-foreground-color`](rules/swift-no-foreground-color.yml) | error | The soft-deprecated `foregroundColor()` modifier. Use `foregroundStyle()`. |
| [`swift-no-formatter-in-view-body`](rules/swift-no-formatter-in-view-body.yml) | error | Foundation formatters such as `DateFormatter()` created inside `body` or another `some View` builder. Use `Text(value, format:)` or a shared formatter. |
| [`swift-no-icon-only-button`](rules/swift-no-icon-only-button.yml) | error | `Button` and `Menu` labels made of a single `Image` with no `accessibilityLabel`. Pass a title with `systemImage:` or use a `Label`, plus `.labelStyle(.iconOnly)` if needed. |
| [`swift-no-index-foreach-identity`](rules/swift-no-index-foreach-identity.yml) | error | `ForEach` and `List` over `indices`, `0..<items.count`, or `id: \.offset`. Identify rows by the element. |
| [`swift-no-navigation-view`](rules/swift-no-navigation-view.yml) | error | The deprecated `NavigationView`. Use `NavigationStack` or `NavigationSplitView`. |
| [`swift-no-observable-object`](rules/swift-no-observable-object.yml) | error | Types that conform to `ObservableObject`. Use the `@Observable` macro so views update only for the properties they read. |
| [`swift-no-on-tap-gesture`](rules/swift-no-on-tap-gesture.yml) | error | `onTapGesture` without a tap count or location. Use a `Button` so VoiceOver, keyboard, and Voice Control users can activate it. |
| [`swift-no-print-changes`](rules/swift-no-print-changes.yml) | error | Leftover `Self._printChanges()` and `Self._logChanges()` debugging calls. |
| [`swift-no-single-parameter-on-change`](rules/swift-no-single-parameter-on-change.yml) | error | The deprecated one-parameter `onChange(of:perform:)`. Use the zero- or two-parameter closure. |
| [`swift-no-unstable-view-id`](rules/swift-no-unstable-view-id.yml) | error | `.id()` given `UUID()`, `Date()`, `.now`, or a random value, which recreates the view on every update. Pass a stable identifier. |

### Pi

| Rule | Severity | Reports |
| --- | --- | --- |
| [`pi-extension-no-console-log`](rules/pi-extension-no-console-log.yml) | error | `console.log` in a typed Pi extension entry point. Use `ctx.ui`, tool result rendering, or a message or entry renderer. |

### OpenCode

| Rule | Severity | Reports |
| --- | --- | --- |
| [`opencode-plugin-no-console-log`](rules/opencode-plugin-no-console-log.yml) | error | `console.log` in TypeScript modules that import OpenCode's plugin API. Use TUI feedback, structured server logging, or a tool result. |
| [`opencode-plugin-no-console-log-tsx`](rules/opencode-plugin-no-console-log-tsx.yml) | error | The same OpenCode plugin check for TSX modules. |

### Svelte

| Rule | Severity | Reports |
| --- | --- | --- |
| [`svelte-no-create-event-dispatcher`](rules/svelte-no-create-event-dispatcher.yml) | error | `createEventDispatcher` imports and direct calls. Svelte 5 components should declare and call callback props. |

The wrapper registers [`tree-sitter-svelte`](https://github.com/tree-sitter-grammars/tree-sitter-svelte) as an ast-grep custom language, so Svelte rules can match component and template nodes such as `{#if}` and `{#each}` blocks. It injects every `<script>` body as TypeScript so script rules also work with plain and `lang="ts"` blocks.

The parser installs without a compiler on glibc Linux x64, macOS x64 and arm64, and Windows x64. Linux arm64 and Windows arm64 or 32-bit x86 build the parser from source and need Python plus a native compiler. The pinned ast-grep CLI does not support other targets such as musl Linux.

## Add or change a rule

1. Add the rule under `rules/<prefix>-<rule-id>.yml`.
2. Add valid and invalid examples under `tests/<prefix>-<rule-id>-test.yml`.
3. Run `just test`.
4. If the expected findings changed, run `just test --update-all` and review the snapshots in `tests/__snapshots__/`.
5. Add or update the rule in the reference above.

Use `common-` for files that contain rules for several languages and a language prefix such as `rust-` for files tied to one language. Start every rule ID with its language, such as `rust-no-deny-warnings`. Keep rule IDs stable, descriptive, and kebab-cased.

## Repository layout

- `rules/` contains the rule definitions.
- `tests/` contains valid and invalid examples, generated snapshots, and a real `.svelte` scan test.
- `sgconfig.yml` defines the rules, tests, custom Svelte language, and script injection.
- `bin/ast-grep-rules.mjs` resolves the native parser, renders the config paths, and runs the pinned ast-grep CLI.
- `.agents/skills/ast-grep/` contains the local agent guide for writing and debugging rules.

## License

ast-grep-rules is licensed under the MIT license. See [`LICENSE`](LICENSE) for details.
