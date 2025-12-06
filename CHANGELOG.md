# Changelog

## [1.1.1](https://github.com/florian-sanders/zed-stylelint/compare/1.1.0...1.1.1) (2025-12-06)


### Other

* The parameter is incorrect. (os error 87) ([04685d1](https://github.com/florian-sanders/zed-stylelint/commit/04685d1eac2a0faff01a18942054b7c2e8df9f42))


## [1.1.0](https://github.com/florian-sanders/zed-stylelint/compare/1.0.2...1.1.0) (2025-10-28)


### ✨ Features

* **languages:** Support astro and other languages ([ae51415](https://github.com/florian-sanders/zed-stylelint/commit/ae51415f9f3dd38bc024fa83d3914fc231793ebb)) - Fixes [#48](https://github.com/florian-sanders/zed-stylelint/issues/48) 
  * Add support for sass, postcss, jsx, tsx, svelte, astro, html,
and markdown in the stylelint-lsp language server configuration.
also add comments to categorize language groups.


## [1.0.2](https://github.com/florian-sanders/zed-stylelint/compare/1.0.1...1.0.2) (2025-09-25)


### 🐛 Bug Fixes

* **zed_extension_api:** Bump for enhanced windows support ([199d67f](https://github.com/florian-sanders/zed-stylelint/commit/199d67f18a4c5cd895f24fff8a8ed250f4050a9b)) - Fixes [#11](https://github.com/florian-sanders/zed-stylelint/issues/11) 
  * - the language server path on windows should be properly set from now
  on.


## [1.0.1](https://github.com/florian-sanders/zed-stylelint/compare/1.0.0...1.0.1) (2025-07-14)


### 🐛 Bug Fixes

* **extension.toml:** Add `typescript` to supported languages ([76b0c74](https://github.com/florian-sanders/zed-stylelint/commit/76b0c74827a24691c976724c2e124e14e1304d57))


## [1.0.0](https://github.com/florian-sanders/zed-stylelint/compare/0.0.4...1.0.0) (2025-07-05)


### ✨ Features

* Get `vscode-stylelint` from `open-vsx` ([f69b19c](https://github.com/florian-sanders/zed-stylelint/commit/f69b19c5eda5c5d31ed0a9e774295ecc98cb3d64)) - Fixes [#13](https://github.com/florian-sanders/zed-stylelint/issues/13) 
  * This removes the need for a fork of the `vscode-stylelint` extension

### 📚 Documentation

* **README:** Remove the "limitations" section ([ddf9b30](https://github.com/florian-sanders/zed-stylelint/commit/ddf9b300308f1ae36ca3d27af5a617ca90bca12c))
  * Issues mentioned in the limitations section have been resolved so it is
no longer relevant


## [0.0.4](https://github.com/florian-sanders/zed-stylelint/compare/0.0.3...0.0.4) (2025-03-30)


### 🐛 Bug Fixes

* **extension.toml:** Add `vue.js` to supported languages ([adbaaaf](https://github.com/florian-sanders/zed-stylelint/commit/adbaaaf60ffee4a72540dc37a6887f0d64a6ab89)) - Fixes [#9](https://github.com/florian-sanders/zed-stylelint/issues/9) 

### 📚 Documentation

* **README:** Add section about vue.js support ([ad15780](https://github.com/florian-sanders/zed-stylelint/commit/ad15780f9b0f1bb47673d9c089cc0eceaac45962)) - Fixes [#9](https://github.com/florian-sanders/zed-stylelint/issues/9) 


## [0.0.3](https://github.com/florian-sanders/zed-stylelint/compare/0.0.2...0.0.3) (2025-03-10)


### 🐛 Bug Fixes

* **extension.toml:** Add `less` to supported languages ([69ec199](https://github.com/florian-sanders/zed-stylelint/commit/69ec1999494f1c4aa718d9b11192af4f3c71903c)) - Fixes [#4](https://github.com/florian-sanders/zed-stylelint/issues/4) 

### 📚 Documentation

* **README:** Add missing `stylelint` section in settings ([31960f3](https://github.com/florian-sanders/zed-stylelint/commit/31960f310d5907d817a410ce5e9cc5fd2e5240d6)) - Fixes [#6](https://github.com/florian-sanders/zed-stylelint/issues/6) 


## [0.0.1](https://github.com/florian-sanders/zed-stylelint/compare/...0.0.1) (2025-02-28)


### ♻️ Refactoring

* Change npm package name ([346583a](https://github.com/florian-sanders/zed-stylelint/commit/346583ac6748fff0aad902b4732a472670ef96a8))

### ✨ Features

* Init 0.1.0 ([8c18108](https://github.com/florian-sanders/zed-stylelint/commit/8c181086f883d0397016d086e9bb7ca6cfc69910))

### 🐛 Bug Fixes

* Adapt to github repo renaming ([187c44d](https://github.com/florian-sanders/zed-stylelint/commit/187c44d5e55ecb15d1927af9feaa8081cc2999b3))

* Switch to npm package instead of github release ([e0bf9f5](https://github.com/florian-sanders/zed-stylelint/commit/e0bf9f5f436b0519bd3d2300078e5cec55f7f664)) - Fixes [#2](https://github.com/florian-sanders/zed-stylelint/issues/2) 

* **dependencies:** Upgrade `zed_extension_api` to `0.2.0` ([ba88a12](https://github.com/florian-sanders/zed-stylelint/commit/ba88a12e7b0f64a610eeba7f2b2db2f0dd087f13))

* **languages:** Add scss ([6d7ad84](https://github.com/florian-sanders/zed-stylelint/commit/6d7ad845a34662093547bdd81cfeaffea99e658c))

### 📚 Documentation

* **README:** Update for release ([b285281](https://github.com/florian-sanders/zed-stylelint/commit/b285281df9dbce1163b06099eb592319d13005dc))

* **description:** Add proper description ([a4790f7](https://github.com/florian-sanders/zed-stylelint/commit/a4790f7e5d4cdbfb121d99caf2d797a51efc6655))

* **README:** Fix `fixall` on save example ([4e6935f](https://github.com/florian-sanders/zed-stylelint/commit/4e6935f65b729051d1b2b783fff0ae39e222a56e))

* **README:** Remove `how to install` section ([b84cfc1](https://github.com/florian-sanders/zed-stylelint/commit/b84cfc15a377e985fb422bcf3e5af63b795c4f16))
  * The extension has been released to this section is obsolete


