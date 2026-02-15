use std::{env, fs};

use zed::settings::LspSettings;
use zed_extension_api::{self as zed, LanguageServerId, Result};

const LSP_VERSION: &str = "2.0.2";
const SERVER_PATH: &str = "stylelint-lsp/start-server.js";
const VERSION_PATH: &str = "stylelint-lsp/.lsp-version";
const BASE_REPO_URL: &str = "https://github.com/florian-sanders/zed-stylelint/releases/download/";

struct StylelintExtension;

impl StylelintExtension {
    fn current_version(&self) -> Option<String> {
        fs::read_to_string(VERSION_PATH).ok()
    }

    fn server_script_path(&self, language_server_id: &LanguageServerId) -> Result<String> {
        let current_version = self.current_version();
        let server_exists = fs::metadata(SERVER_PATH).is_ok_and(|stat| stat.is_file());

        if current_version.as_deref() != Some(LSP_VERSION) || !server_exists {
            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );

            let download_url = format!(
                "{BASE_REPO_URL}/{LSP_VERSION}/stylelint-language-server-v{LSP_VERSION}.tar.gz",
            );

            zed::download_file(
                &download_url,
                "stylelint-lsp",
                zed::DownloadedFileType::GzipTar,
            )
            .map_err(|e| format!("failed to download file: {e}"))?;

            fs::write(VERSION_PATH, LSP_VERSION)
                .map_err(|e| format!("failed to write version file: {e}"))?;
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
        _worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let server_path = self.server_script_path(language_server_id)?;
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
