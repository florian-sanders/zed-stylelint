use std::{env, fs};
use zed::settings::LspSettings;
use zed_extension_api::{self as zed, LanguageServerId, Result};

const SERVER_PATH: &str = "dist/start-server.js";

struct StylelintExtension {
    did_find_server: bool,
}

impl StylelintExtension {
    fn server_exists(&self) -> bool {
        fs::metadata(SERVER_PATH).map_or(false, |stat| stat.is_file())
    }

    fn server_script_path(&mut self, language_server_id: &LanguageServerId) -> Result<String> {
        let server_exists = self.server_exists();
        if self.did_find_server && server_exists {
            return Ok(SERVER_PATH.to_string());
        }

        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::CheckingForUpdate,
        );
        let release = zed::latest_github_release(
            "florian-sanders/vscode-stylelint",
            zed::GithubReleaseOptions {
                require_assets: false,
                pre_release: false,
            },
        )?;

        let asset_name = format!("{}.zip", release.version);

        let version_dir = format!("vscode-stylelint-{}", release.version);

        if !server_exists
            || zed::npm_package_installed_version("vscode-stylelint")?.as_ref()
                != Some(&release.version)
        {
            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );

            let download_url = format!(
                "https://github.com/florian-sanders/vscode-stylelint/archive/refs/tags/{}",
                asset_name
            );

            zed::download_file(&download_url, ".", zed::DownloadedFileType::Zip)
                .map_err(|e| format!("failed to download file: {e}"))?;
        }

        self.did_find_server = true;
        Ok(format!("{version_dir}/{SERVER_PATH}"))
    }
}

impl zed::Extension for StylelintExtension {
    fn new() -> Self {
        Self {
            did_find_server: false,
        }
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
            env: vec![Default::default()],
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

zed::register_extension!(StylelintExtension);
