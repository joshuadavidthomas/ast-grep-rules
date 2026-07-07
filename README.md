# ast-grep-rules

Common [ast-grep](https://ast-grep.github.io/) rules I use across projects.

## What's here

- `rules/`: reusable ast-grep rules.
- `tests/`: rule fixtures for `sg test`.
- `sgconfig.yml`: ast-grep config that wires rules and tests together.
- `.agents/skills/ast-grep/`: local agent skill for writing and debugging rules.

## Usage

Install ast-grep, then run the test suite:

```sh
just test
```

Run the rules against a project:

```sh
sg scan --config sgconfig.yml /path/to/project
```

## Adding a rule

1. Add the rule YAML under `rules/`.
2. Add matching valid and invalid examples under `tests/`.
3. Run `just test` and review any snapshot changes.

## License

ast-grep-rules is licensed under the MIT license. See [`LICENSE`](LICENSE) for more information.
