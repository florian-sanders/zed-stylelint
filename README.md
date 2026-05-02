# Zed Stylelint Extension

This extension provides Stylelint support for Zed by wrapping the official [vscode-stylelint](https://github.com/stylelint/vscode-stylelint) language server. **We do not own the language server source code** - this is a Zed wrapper that automatically synchronizes with official vscode-stylelint releases.

## Installation

Install from Zed's extension marketplace. The extension automatically downloads the language server from the official [`@stylelint/language-server`](https://npmx.dev/package/@stylelint/language-server) npm package published by the [vscode-stylelint](https://github.com/stylelint/vscode-stylelint) team. By default the latest published version is used and kept up to date.

## How to configure?

### Language server version

By default the extension installs the **latest published** version of `@stylelint/language-server`. If you need to lock it to a specific release, set the `version` field inside `lsp.stylelint-lsp.settings`:

```json
// settings.json
{
  "lsp": {
    "stylelint-lsp": {
      "settings": {
        "version": "1.6.0"
      }
    }
  }
}
```

The value must be a valid semver string matching a published version of the package. To browse available versions, search the [vscode-stylelint releases](https://github.com/stylelint/vscode-stylelint/releases?q=%40stylelint%2Flanguage-server&expanded=true) page (look for tags named `@stylelint/language-server@<version>`).

> **Note:** not every language server version is compatible with every version of this extension. If you set `version` to a value that is too old, the extension will refuse to start and display an error message telling you the minimum version it accepts. If you genuinely need an older language server version, install an earlier release of the zed-stylelint extension from the [Releases page](https://github.com/florian-sanders/zed-stylelint/releases) — older releases have a lower minimum.

### General LSP settings

Settings and configuration tweaks are explained in details in the [stylelint/vscode-stylelint README](https://github.com/stylelint/vscode-stylelint/blob/main/README.md).

In your global or local settings, enable the language server by adding a `stylelint-lsp` section in `lsp` section.

Settings can be passed to the LSP server by adding a `settings` section inside `stylelint-lsp`.

For instance:
```JSON
// settings.json
{
  "lsp": {
    "stylelint-lsp": {
      "settings": {
        "stylelint": {
          // these are the default settings, you shouldn't need to set most of them, only add them as needed
          "config": null,
          "configFile": "",
          "configBasedir": "",
          "customSyntax": "",
          "ignoreDisables": false,
          "packageManager": "npm",
          "reportDescriptionlessDisables": false,
          "reportInvalidScopeDisables": false,
          "reportNeedlessDisables": false,
          "snippet": ["css", "postcss"],
          "stylelintPath": "",
          // if you are using a plugin to process other syntaxes (for instance scss, or css-in-js)
          // you also need to set the syntax in your stylelint config or in the `customSyntax` setting above
          // then specify the language identifier related to your custom syntax (for instance `javascript` for `css-in-js`)
          // for more info refer to: https://github.com/stylelint/vscode-stylelint?tab=readme-ov-file#%EF%B8%8F-only-css-and-postcss-are-validated-by-default
          "validate": ["css", "postcss"]
        }
      }
    }
  }
}
```

### Fix on save

To fix all Stylelint issues on format, enable the related code action from your global or local Zed settings as follows:

```json
  // Zed / project settings.json
  "languages": {
    // language identifier for these settings, see https://zed.dev/docs/configuring-languages#language-specific-settings for more info
    "CSS": {
      "formatter": [
        // you may add any other formatter / command before or after in the array
        {
          "external": {
            "command": "prettier",
            "arguments": ["--stdin-filepath", "{buffer_path}"],
          },
        },
        // this is what enables auto fix on save
        { "code_action": "source.fixAll.stylelint" },
      ],
    },
  },
```

More info: [Formatters - Zed docs](https://zed.dev/docs/reference/all-settings#formatter)

### Vue.js compatibility

To use this extension with Vue.js files in Zed:

1. Install the [Vue.js extension for Zed](https://github.com/zed-extensions/vue) which is required for Vue file support.

2. Configure the Stylelint LSP settings to validate Vue files by adding `"vue.js"` to the validate array (note the `.js` suffix - this is the language identifier used by the Vue extension):

```json
"lsp": {
  "stylelint-lsp": {
    "settings": {
      "stylelint": {
        ...
        "validate": ["css", "postcss", "vue.js"]
        ...
      }
    }
  }
}
```

3. Set up (postcss-html)[https://github.com/ota-meshi/postcss-html] custom syntax for Vue files in your project. You can do this in one of two ways:
  - Add the `customSyntax` setting in your project's Stylelint config file,
  - Configure it in your Zed settings via the LSP settings (`lsp.stylelint-lsp.settings.stylelint.customSyntax`).

If you're using [stylelint-config-recommended-vue](https://github.com/ota-meshi/stylelint-config-recommended-vue), the custom syntax is already bundled and configured for you.

Note that unlike in VSCode, you need to explicitly set the custom syntax in Zed, but the dependency requirements are the same for both editors.

### Disabling unrequested autocomplete (snippets)

The source language server provides snippets via autocomplete to generate disable stylelint comments.

If you experience autocomplete popping up constantly in CSS context, you may disable this feature by setting this:

```json
// zed or project settings.json
"lsp": {
  "stylelint-lsp": {
    "settings": {
      "stylelint": {
        "snippet": [],
      },
    },
  },
},
```

Note that generating disable comments is still available through code actions.

More info:
- [Issue #60](https://github.com/florian-sanders/zed-stylelint/issues/60)
- [Source language server docs](https://github.com/stylelint/vscode-stylelint#stylelintsnippet)

## What This Extension Does

This extension acts as a bridge between Zed and the official vscode-stylelint language server. It:

- Automatically downloads the language server from the official [`@stylelint/language-server`](https://npmx.dev/package/@stylelint/language-server) npm package
- Always uses the latest published version by default, keeping you up to date with official vscode-stylelint releases
- Allows pinning the language server to a specific version via `lsp.stylelint-lsp.settings.version` (see [Language server version](#language-server-version) above)
- Provides Zed-specific integration and configuration

## Acknowledgment

This extension code is heavily inspired by the [`html` extension in zed](https://github.com/zed-industries/zed/tree/main/extensions/html).

As said above, the whole language server code comes from [stylelint/vscode-stylelint](https://github.com/stylelint/vscode-stylelint) so credit goes to them really!

## Version Information

The language server is the official [`@stylelint/language-server`](https://npmx.dev/package/@stylelint/language-server) npm package, maintained by the [vscode-stylelint](https://github.com/stylelint/vscode-stylelint) team. Each version of this extension declares a minimum supported language server version — attempting to use an older server version will result in a descriptive error.

Check the [vscode-stylelint releases](https://github.com/stylelint/vscode-stylelint/releases?q=%40stylelint%2Flanguage-server&expanded=true) page to browse available language server versions.
