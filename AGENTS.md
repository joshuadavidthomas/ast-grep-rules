# AGENTS.md

- Put rules in `rules/<prefix>-<rule-id>.yml`.
- Put tests in `tests/<prefix>-<rule-id>-test.yml`.
- Keep rule IDs stable, descriptive, and kebab-cased. The rule ID does not have to match the file name.
- For language-specific rules, prefix the filename with `<language>-`. For rules that apply across multiple languages, prefix with `common-`.
- Every new rule needs valid and invalid examples.

## Commands

```bash
just test               # Run all ast-grep rule tests.
just test --update-all  # Update snapshot baselines after reviewing expected rule output.
```

## ast-grep guidance

- Prefer precise structural patterns over broad text-style matches.
- Start with the simplest `pattern`; use `kind`, `has`, `inside`, and composite rules only when needed.
- Add `stopBy: end` to relational rules unless the search is intentionally bounded.
- Keep messages actionable: name the problem and what to do instead.
- Review generated snapshot changes before keeping them.

See the `ast-grep` skill for more detailed information and guidance.
