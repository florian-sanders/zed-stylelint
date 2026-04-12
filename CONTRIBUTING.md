# Contributing

Thank you for taking the time to contribute! 🎉

## Getting Started

1. Fork the repository and clone it locally.
2. Follow the [Developing an Extension Locally](https://zed.dev/docs/extensions/developing-extensions#developing-an-extension-locally) guide from the Zed docs to get your environment set up.
3. Make your changes, then verify everything is in order:
   ```sh
   cargo fmt
   cargo clippy --target wasm32-wasip1 -- -D warnings
   cargo build --release --target wasm32-wasip1
   ```

## Commit Messages

There are no strict commit message conventions. Write clear, descriptive commit messages that explain **what** changed and **why** — that's all that is expected.

## Changelog

If your change is relevant to end users (new feature, bug fix, breaking change, notable improvement…), please update [`CHANGELOG.md`](./CHANGELOG.md) manually:

- Add your entry under an `## [Unreleased]` section at the top of the file (create it if it doesn't exist yet).
- Use the existing section headings as a guide (e.g. `### ✨ Features`, `### 🐛 Bug Fixes`, `### 📚 Documentation`).
- Pure internal or housekeeping changes (CI tweaks, refactors with no user-facing impact) do not need a changelog entry.

Example:

```markdown
## [Unreleased]

### ✨ Features

* Short description of the change
  * Optional extra detail if needed
```

## Pull Requests

- Keep PRs focused — one logical change per PR makes review easier.
- Make sure CI passes (formatting, Clippy, build) before requesting a review.
- Reference any related issues in the PR description.
