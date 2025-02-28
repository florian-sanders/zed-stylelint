# Zed Stylelint Language Server Extension

## Disclaimer

This extension relies on [a fork of the stylelint/vscode-stylelint extension](https://github.com/florian-sanders/vscode-stylelint-prebundled).

The VSCode extension has been forked because:

- The [stylelint/vscode-stylelint](https://github.com/stylelint/vscode-stylelint) is a TypeScript project that needs to be built (transpiled to JavaScript), and bundled. At the moment, there is nothing exposed by [zed_extension_api](https://docs.rs/zed_extension_api/latest/zed_extension_api/index.html) to do these steps easily.
  - This is why the fork is actually just the same code as the original repo but with the addition of the bundled code (in the `dist` directory).
- The Language Server is not published as a standalone project,
- The [stylelint/vscode-stylelint](https://github.com/stylelint/vscode-stylelint) is not published on `npm`.

## How to configure?

### General LSP settings

Settings and configuration tweaks are explained in details in the [stylelint/vscode-styelint README](https://github.com/stylelint/vscode-stylelint/blob/main/README.md).

In your global or local settings, enable the language server by adding a `stylelint-lsp` section in `lsp` section.

Settings can be passed to the LSP server by adding a `settings` section inside `stylelint-lsp`.

For instance:
```JSON
// settings.json
{
  "lsp": {
    "stylelint-lsp": {
      "settings": {
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

## Limitations

- Code actions to disable rules (inline / entire file) do not work (see [#1](https://github.com/florian-sanders/zed-stylelint/issues/1#issuecomment-2508215176) for more info)

## Acknowledgment

This extension code is heavily inspired by the [`html` extension in zed](https://github.com/zed-industries/zed/tree/main/extensions/html).

As said above, the whole language server code comes from [stylelint/vscode-stylelint](https://github.com/stylelint/vscode-stylelint) so all the credits go to them really!
