set dotenv-load
set unstable

# List all available commands
[private]
default:
    @just --list --list-submodules

# Audit GitHub Actions workflows
lint *ARGS:
    uvx prek run --all-files --show-diff-on-failure --color always {{ ARGS }}

# Run all tests with the pinned ast-grep and Svelte parser
test *ARGS:
    npm test -- {{ ARGS }}

# Scan a project with the rule set and suppression hygiene checks
scan *ARGS:
    npm run scan -- --warning=no-suppress-all --error=unused-suppression {{ ARGS }}
