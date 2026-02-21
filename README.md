# Zed Stylelint Extension

This extension provides Stylelint support for Zed by wrapping the official [vscode-stylelint](https://github.com/stylelint/vscode-stylelint) language server. **We do not own the language server source code** - this is a Zed wrapper that automatically synchronizes with official vscode-stylelint releases.

## Installation

Install from Zed's extension marketplace. The extension automatically downloads and updates the prebuilt language server from GitHub releases.

## How to configure?

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

```JSON
// settings.json
{
  "languages": {
    // language identifier for these settings, see https://zed.dev/docs/configuring-languages#language-specific-settings for more info
    "CSS": {
      "code_actions_on_format": {
        "source.fixAll.stylelint": true
      }
    }
  }
}
```

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

## What This Extension Does

This extension acts as a bridge between Zed and the official vscode-stylelint language server. It:

- Automatically downloads the prebuilt language server from GitHub releases
- Keeps the language server synchronized with official vscode-stylelint releases
- Provides Zed-specific integration and configuration

## Acknowledgment

This extension code is heavily inspired by the [`html` extension in zed](https://github.com/zed-industries/zed/tree/main/extensions/html).

As said above, the whole language server code comes from [stylelint/vscode-stylelint](https://github.com/stylelint/vscode-stylelint) so credit goes to them really!

## Version Information

The extension version is synchronized with the vscode-stylelint language server version. The prebuilt language server is available as assets attached to each release of this extension.

Check the [Releases page](https://github.com/florian-sanders/zed-stylelint/releases) for the latest version and download links.
