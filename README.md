# ast-grep-rules

An opinionated set of [ast-grep](https://ast-grep.github.io/) rules for Rust, TypeScript, Svelte, HTML, Python, and Go projects.

The rules catch API design problems, weak error handling, deprecated Svelte patterns, and code clutter. Use the whole set or turn off rules that do not fit a project.

## Use with pre-commit

Install [pre-commit](https://pre-commit.com/#install), then add the hook to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/joshuadavidthomas/ast-grep-rules
    rev: v0.1.0
    hooks:
      - id: ast-grep-rules
```

Install the hook and run it against the repository:

```sh
pre-commit install
pre-commit run ast-grep-rules --all-files
```

The hook brings its own ast-grep install, Svelte parser, and configuration. The project using it does not need an `sgconfig.yml`.

### Turn off rules

Pass ast-grep's `--off` option once for each rule:

```yaml
repos:
  - repo: https://github.com/joshuadavidthomas/ast-grep-rules
    rev: v0.1.0
    hooks:
      - id: ast-grep-rules
        args:
          - --off=no-single-field-struct
          - --off=no-visible-bool-argument
```

## Run from this repository

Install Node.js 18 or newer and [just](https://just.systems/), then install the pinned ast-grep CLI and Svelte parser:

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

## Rule reference

All rules link to their definitions. Most definitions include a `note` with exceptions and replacement advice.

### Common

| Rule | Language | Severity | Reports |
| --- | --- | --- | --- |
| [`no-code-barricade-rust`](rules/common-no-code-barricade.yml) | Rust | warning | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`no-code-barricade-typescript`](rules/common-no-code-barricade.yml) | TypeScript | warning | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`no-code-barricade-html`](rules/common-no-code-barricade.yml) | HTML | warning | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`no-code-barricade-svelte`](rules/common-no-code-barricade.yml) | Svelte | warning | Decorative divider comments in Svelte templates. Use a plain section comment or split the file. |
| [`no-code-barricade-python`](rules/common-no-code-barricade.yml) | Python | warning | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |
| [`no-code-barricade-go`](rules/common-no-code-barricade.yml) | Go | warning | Decorative divider comments made from repeated punctuation. Use a plain section comment or split the file. |

### Rust

| Rule | Severity | Reports |
| --- | --- | --- |
| [`no-anyhow-in-public-api`](rules/rust-no-anyhow-in-public-api.yml) | warning | Visible functions, trait methods, and type aliases that expose `anyhow`. Return an error type callers can inspect. |
| [`no-deny-warnings`](rules/rust-no-deny-warnings.yml) | warning | `#![deny(warnings)]`, which can break a build when a compiler or dependency adds a warning. Set explicit lint levels instead. |
| [`no-deref-polymorphism`](rules/rust-no-deref-polymorphism.yml) | warning | `Deref` implementations used for API forwarding. Reserve `Deref` for smart pointers and expose methods on other types. |
| [`no-empty-braced-struct`](rules/rust-no-empty-braced-struct.yml) | warning | Empty braced structs. Use a unit struct unless braces carry a schema, FFI, or code-generation contract. |
| [`no-option-bool-field`](rules/rust-no-option-bool-field.yml) | warning | `Option<bool>` struct fields. Name the three states with an enum. |
| [`no-public-struct-fields`](rules/rust-no-public-struct-fields.yml) | warning | Visible fields on visible structs. Keep representation private unless the struct is passive data. |
| [`no-public-tuple-newtype-field`](rules/rust-no-public-tuple-newtype-field.yml) | warning | Visible tuple-newtype fields. Keep the field private and expose chosen constructors or accessors. |
| [`no-single-field-struct`](rules/rust-no-single-field-struct.yml) | warning | Named-field structs with one field. Use a tuple newtype unless an external schema or FFI needs the field name. |
| [`no-single-member-enum`](rules/rust-no-single-member-enum.yml) | warning | Enums with one variant, except `#[non_exhaustive]` enums. Use a struct or newtype, or add the missing variants. |
| [`no-string-error-variant`](rules/rust-no-string-error-variant.yml) | warning | Bare `String` payloads in variants of enums named `Error` or ending in `Error`. Keep structured fields or source errors. |
| [`no-trivial-whitespace-helper`](rules/rust-no-trivial-whitespace-helper.yml) | error | Local helpers that only wrap standard whitespace checks. Inline the check or name the domain policy it implements. |
| [`no-visible-bool-argument`](rules/rust-no-visible-bool-argument.yml) | warning | `bool` parameters in visible functions and trait methods. Use a named enum or split the operation. |
| [`require-thiserror-error-enum`](rules/rust-require-thiserror-error-enum.yml) | warning | Error enums without a `thiserror::Error` derive. Derive it instead of hand-writing error behavior. |

### TypeScript

| Rule | Severity | Reports |
| --- | --- | --- |
| [`no-generic-error-message-helper`](rules/typescript-no-generic-error-message-helper.yml) | error | Helpers that reduce an unknown error to `error.message` or `String(error)`. Preserve the original error and write separate user-facing text. |
| [`no-hand-rolled-object-type-guard`](rules/typescript-no-hand-rolled-object-type-guard.yml) | error | Object type predicates over unknown input that rely on `typeof value === "object"`. Parse the expected shape with a schema validator. |

### Svelte

| Rule | Severity | Reports |
| --- | --- | --- |
| [`no-create-event-dispatcher`](rules/svelte-no-create-event-dispatcher.yml) | warning | `createEventDispatcher` imports and direct calls. Svelte 5 components should declare and call callback props. |

The wrapper registers [`tree-sitter-svelte`](https://github.com/tree-sitter-grammars/tree-sitter-svelte) as an ast-grep custom language, so Svelte rules can match component and template nodes such as `{#if}` and `{#each}` blocks. It injects every `<script>` body as TypeScript so script rules also work with plain and `lang="ts"` blocks.

The parser package includes native builds for Linux x64, macOS x64 and arm64, and Windows x64. On Linux arm64 and Windows arm64 or 32-bit x86, installation builds the parser from source and needs a native compiler. The pinned ast-grep CLI does not support other targets such as musl Linux.

## Add or change a rule

1. Add the rule under `rules/<prefix>-<rule-id>.yml`.
2. Add valid and invalid examples under `tests/<prefix>-<rule-id>-test.yml`.
3. Run `just test`.
4. If the expected findings changed, run `just test --update-all` and review the snapshots in `tests/__snapshots__/`.
5. Add or update the rule in the reference above.

Use `common-` for rules that cover several languages and a language prefix such as `rust-` for rules tied to one language. Keep rule IDs stable, descriptive, and kebab-cased.

## Repository layout

- `rules/` contains the rule definitions.
- `tests/` contains valid and invalid examples, generated snapshots, and a real `.svelte` scan test.
- `sgconfig.yml` defines the rules, tests, custom Svelte language, and script injection.
- `bin/ast-grep-rules.mjs` resolves the native parser, renders the config paths, and runs the pinned ast-grep CLI.
- `.agents/skills/ast-grep/` contains the local agent guide for writing and debugging rules.

## License

ast-grep-rules is licensed under the MIT license. See [`LICENSE`](LICENSE) for details.
