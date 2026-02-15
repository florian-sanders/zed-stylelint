use zed::settings::LspSettings;
use zed_extension_api::{self as zed, LanguageServerId, Result};

use crate::{
    download::{Cache, download_language_server},
    error::{ErrorContext, format_error},
    npm::{
        NpmCommand, categorize_build_error, categorize_npm_error, format_build_error_details,
        format_npm_error_details,
    },
    platform::Platform,
};

const REQUIRED_VERSION: &str = "2.0.2";

pub struct StylelintExtension;

impl StylelintExtension {
    pub fn new() -> Self {
        Self
    }

    fn get_npm_path(&self) -> Result<String> {
        let node_path = zed::node_binary_path().map_err(|e| {
            format_error(
                ErrorContext::NodeDetection,
                &format!("Could not locate Node.js binary: {e}"),
            )
        })?;

        let platform = Platform::from_node_path(&node_path);
        Ok(platform.derive_npm_path(&node_path))
    }

    fn run_npm_install(
        &self,
        language_server_id: &LanguageServerId,
        cache: &Cache,
        source_dir: &str,
    ) -> Result<()> {
        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::Downloading,
        );

        let npm_path = self.get_npm_path()?;
        let full_source_path = cache.source_path(source_dir);

        let output = NpmCommand::new(npm_path, full_source_path.to_string_lossy().to_string())
            .install()
            .execute()?;

        if !output.success() {
            let category = categorize_npm_error(&output.stderr);
            let error_details = format_npm_error_details(&output, category);
            return Err(format_error(ErrorContext::NpmInstall, &error_details));
        }

        Ok(())
    }

    fn run_build_bundle(
        &self,
        language_server_id: &LanguageServerId,
        cache: &Cache,
        source_dir: &str,
    ) -> Result<()> {
        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::Downloading,
        );

        let npm_path = self.get_npm_path()?;
        let full_source_path = cache.source_path(source_dir);

        let output = NpmCommand::new(npm_path, full_source_path.to_string_lossy().to_string())
            .run_script("build-bundle")
            .execute()?;

        if !output.success() {
            let category = categorize_build_error(&output.stderr, &output.stdout);
            let error_details = format_build_error_details(&output, category);
            return Err(format_error(ErrorContext::BuildBundle, &error_details));
        }

        // Check if the dist directory was created in the source directory
        let source_dist_path = cache.source_dist_path(source_dir);
        if !source_dist_path.exists() {
            return Err(format_error(
                ErrorContext::BuildBundle,
                &format!(
                    "Build completed but dist directory not found at {}",
                    source_dist_path.display()
                ),
            ));
        }

        Ok(())
    }

    fn server_script_path(&self, language_server_id: &LanguageServerId) -> Result<String> {
        let cache = Cache::new(REQUIRED_VERSION)?;

        // 1. Check cache
        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::CheckingForUpdate,
        );

        if let Some(cached_path) = cache.find_cached_build() {
            return Ok(cached_path);
        }

        // 2. Download
        download_language_server(language_server_id, REQUIRED_VERSION)?;

        // 3. Find directory
        let extracted_dir = cache.find_source_directory()?;

        // 4. Install dependencies
        self.run_npm_install(language_server_id, &cache, &extracted_dir)?;

        // 5. Build bundle
        self.run_build_bundle(language_server_id, &cache, &extracted_dir)?;

        // 6. Move dist output to cache root and cleanup temp build
        cache.cleanup_and_move_dist(&extracted_dir)?;

        // 7. Mark cache
        cache.mark_complete()?;

        // 8. Return server path
        Ok(cache.server_path().to_string_lossy().to_string())
    }
}

impl zed::Extension for StylelintExtension {
    fn new() -> Self {
        Self::new()
    }

    fn language_server_command(
        &mut self,
        language_server_id: &LanguageServerId,
        _worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let server_path = self.server_script_path(language_server_id)?;

        Ok(zed::Command {
            command: zed::node_binary_path()?,
            args: vec![server_path, "--stdio".to_string()],
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
