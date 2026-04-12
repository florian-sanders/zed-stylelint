use std::env;

use zed::settings::LspSettings;
use zed_extension_api::{self as zed, LanguageServerId, Result};

const MIN_SERVER_VERSION: &str = "1.0.0";
const NPM_PACKAGE_NAME: &str = "@stylelint/language-server";
const SERVER_PATH: &str =
    "node_modules/@stylelint/language-server/bin/stylelint-language-server.mjs";

struct StylelintExtension;

impl StylelintExtension {
    fn server_script_path(
        &self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<String> {
        // Read optional pinned version from worktree settings.
        let pinned_version = LspSettings::for_worktree("stylelint-lsp", worktree)
            .ok()
            .and_then(|s| s.settings)
            .and_then(|s| {
                s.as_object()
                    .and_then(|obj| obj.get("version"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            });

        // Resolve target version: explicit pin or latest from npm.
        let version = match &pinned_version {
            Some(v) => v.clone(),
            None => zed::npm_package_latest_version(NPM_PACKAGE_NAME)?,
        };

        let min = semver::Version::parse(MIN_SERVER_VERSION)
            .expect("MIN_SERVER_VERSION is a valid semver string");

        // Validate semver format. Only user-supplied values can be malformed.
        let requested = semver::Version::parse(&version).map_err(|e| {
            format!(
                "\"{version}\" is not a valid version number ({e}). \
                 Fix the `lsp.stylelint-lsp.settings.version` value in your Zed settings."
            )
        })?;

        // Reject versions below the minimum supported by this extension.
        if requested < min {
            return Err(if pinned_version.is_some() {
                format!(
                    "Stylelint Language Server {version} is not supported by this extension \
                     (minimum: {MIN_SERVER_VERSION}). \
                     Update `lsp.stylelint-lsp.settings.version` to {MIN_SERVER_VERSION} or later, \
                     or remove it to use the latest release."
                )
            } else {
                format!(
                    "The latest published version of {NPM_PACKAGE_NAME} ({version}) is not yet \
                     supported by this extension (minimum: {MIN_SERVER_VERSION}). \
                     Please open an issue at https://github.com/florian-sanders/zed-stylelint."
                )
            });
        }

        // Skip npm install if the package is already at the right version.
        let installed = zed::npm_package_installed_version(NPM_PACKAGE_NAME)?;
        if installed.as_deref() != Some(version.as_str()) {
            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );
            zed::npm_install_package(NPM_PACKAGE_NAME, &version).map_err(
                |e| match &pinned_version {
                    Some(_) => format!(
                        "Failed to install {NPM_PACKAGE_NAME}@{version}: {e}. \
                     Verify the version exists at \
                     https://www.npmjs.com/package/{NPM_PACKAGE_NAME}?activeTab=versions \
                     and update `lsp.stylelint-lsp.settings.version` accordingly."
                    ),
                    None => e,
                },
            )?;
        }

        Ok(SERVER_PATH.to_string())
    }
}

impl zed::Extension for StylelintExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let server_path = self.server_script_path(language_server_id, worktree)?;
        Ok(zed::Command {
            command: zed::node_binary_path()?,
            args: vec![
                env::current_dir()
                    .unwrap()
                    .join(&server_path)
                    .to_string_lossy()
                    .to_string(),
                "--stdio".to_string(),
            ],
            env: Default::default(),
        })
    }

    fn language_server_workspace_configuration(
        &mut self,
        server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<Option<zed::serde_json::Value>> {
        let settings = LspSettings::for_worktree(server_id.as_ref(), worktree)
            .ok()
            .and_then(|lsp_settings| lsp_settings.settings.clone())
            .unwrap_or_default();

        Ok(Some(settings))
    }
}

zed_extension_api::register_extension!(StylelintExtension);
