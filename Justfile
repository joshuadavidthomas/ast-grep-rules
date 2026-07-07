set dotenv-load
set unstable

# List all available commands
[private]
default:
    @just --list --list-submodules

# Run all tests
test *ARGS:
    sg test {{ ARGS }}
