use std::{env, fs, path::PathBuf};

use crate::error::{format_error, DownloadErrorCategory, ErrorContext};

const CACHE_DIR: &str = "stylelint-lsp";
const TEMP_BUILD_DIR: &str = ".build";
const DIST_DIR: &str = "dist";
const SERVER_FILE_NAME: &str = "start-server.js";
const VERSION_MARKER_PATH: &str = ".installed_version";
const STYLELINT_GITHUB_URL: &str =
    "https://api.github.com/repos/stylelint/vscode-stylelint/zipball";

/// Manages caching of the language server build
pub struct Cache {
    cache_dir: PathBuf,
    temp_build_dir: PathBuf,
    required_version: String,
}

impl Cache {
    /// Create a new cache manager for the required version
    pub fn new(required_version: impl Into<String>) -> Result<Self, String> {
        let work_dir = env::current_dir().map_err(|e| {
            format_error(
                ErrorContext::DirectoryAccess,
                &format!("Could not determine current working directory: {e}"),
            )
        })?;

        let cache_dir = work_dir.join(CACHE_DIR);
        let temp_build_dir = cache_dir.join(TEMP_BUILD_DIR);

        Ok(Self {
            cache_dir,
            temp_build_dir,
            required_version: required_version.into(),
        })
    }

    /// Get the path to the cache directory
    pub fn cache_dir(&self) -> &PathBuf {
        &self.cache_dir
    }

    /// Check if a valid cached build exists
    pub fn find_cached_build(&self) -> Option<String> {
        // Check if .installed_version exists and matches required version
        let version_marker = self.cache_dir.join(VERSION_MARKER_PATH);
        if !version_marker.exists() {
            return None;
        }

        let cached_version = fs::read_to_string(&version_marker).ok()?;
        if !self.is_version_compatible(&cached_version) {
            return None;
        }

        // Check if server file exists in the dist directory
        let server_path = self.server_path();
        if server_path.exists() {
            return Some(server_path.to_string_lossy().to_string());
        }

        None
    }

    /// Mark the build as complete by writing the version marker
    pub fn mark_complete(&self) -> Result<(), String> {
        let version_marker = self.cache_dir.join(VERSION_MARKER_PATH);

        fs::write(&version_marker, &self.required_version).map_err(|e| {
            format_error(
                ErrorContext::DirectoryAccess,
                &format!("Could not write version marker file: {e}"),
            )
        })
    }

    /// Find the extracted source directory in the temp build directory
    pub fn find_source_directory(&self) -> Result<String, String> {
        let entries = fs::read_dir(&self.temp_build_dir).map_err(|e| {
            format_error(
                ErrorContext::DirectoryAccess,
                &format!("Could not read temp build directory: {e}"),
            )
        })?;

        let matches: Vec<String> = entries
            .filter_map(|entry| entry.ok())
            .filter(|entry| entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
            .filter_map(|entry| entry.file_name().to_str().map(|s| s.to_string()))
            .filter(|name| is_stylelint_dir(name))
            .collect();

        validate_single_match(matches).map_err(|e| format_error(ErrorContext::Download, &e))
    }

    /// Get the path to the source directory (inside temp build dir)
    pub fn source_path(&self, source_dir: &str) -> PathBuf {
        self.temp_build_dir.join(source_dir)
    }

    /// Get the path to the dist directory in the source (during build)
    pub fn source_dist_path(&self, source_dir: &str) -> PathBuf {
        self.temp_build_dir.join(source_dir).join(DIST_DIR)
    }

    /// Get the path to the final dist directory (in cache root)
    pub fn dist_path(&self) -> PathBuf {
        self.cache_dir.join(DIST_DIR)
    }

    /// Get the path to the final server file (in cache dist directory)
    pub fn server_path(&self) -> PathBuf {
        self.cache_dir.join(DIST_DIR).join(SERVER_FILE_NAME)
    }

    /// Move the dist directory from temp build to cache root and cleanup temp directory
    pub fn cleanup_and_move_dist(&self, source_dir: &str) -> Result<(), String> {
        let source_dist = self.source_dist_path(source_dir);
        let target_dist = self.dist_path();

        // Verify the dist directory exists in the source
        if !source_dist.exists() {
            return Err(format_error(
                ErrorContext::BuildBundle,
                &format!(
                    "Build output directory not found at expected location: {}",
                    source_dist.display()
                ),
            ));
        }

        // Remove any existing dist directory in the cache
        if target_dist.exists() {
            fs::remove_dir_all(&target_dist).map_err(|e| {
                format_error(
                    ErrorContext::DirectoryAccess,
                    &format!(
                        "Could not remove existing dist directory {}: {e}",
                        target_dist.display()
                    ),
                )
            })?;
        }

        // Move the entire dist directory to the cache root
        fs::rename(&source_dist, &target_dist).map_err(|e| {
            format_error(
                ErrorContext::DirectoryAccess,
                &format!(
                    "Could not move dist directory from {} to {}: {e}",
                    source_dist.display(),
                    target_dist.display()
                ),
            )
        })?;

        // Clean up the temp build directory
        self.cleanup_temp_build()?;

        Ok(())
    }

    /// Clean up the temporary build directory
    fn cleanup_temp_build(&self) -> Result<(), String> {
        if self.temp_build_dir.exists() {
            fs::remove_dir_all(&self.temp_build_dir).map_err(|e| {
                format_error(
                    ErrorContext::DirectoryAccess,
                    &format!(
                        "Could not remove temp build directory {}: {e}",
                        self.temp_build_dir.display()
                    ),
                )
            })?;
        }
        Ok(())
    }

    fn is_version_compatible(&self, cached: &str) -> bool {
        cached.trim() == self.required_version
    }
}

/// Download the language server from GitHub
pub fn download_language_server(
    language_server_id: &zed_extension_api::LanguageServerId,
    version: &str,
) -> Result<(), String> {
    use zed_extension_api::{self as zed, DownloadedFileType};

    zed::set_language_server_installation_status(
        language_server_id,
        &zed::LanguageServerInstallationStatus::Downloading,
    );

    let download_url = format!("{}/{}", STYLELINT_GITHUB_URL, version);

    // Ensure the cache directory exists
    let cache = Cache::new(version)?;
    if !cache.cache_dir().exists() {
        fs::create_dir_all(cache.cache_dir()).map_err(|e| {
            format_error(
                ErrorContext::DirectoryAccess,
                &format!("Could not create cache directory: {e}"),
            )
        })?;
    }

    zed::download_file(
        &download_url,
        &format!("{}/{}", CACHE_DIR, TEMP_BUILD_DIR),
        DownloadedFileType::Zip,
    )
    .map_err(|e: String| {
        let error_details = DownloadErrorCategory::classify(&e);
        let full_error = error_details.user_message(version);
        format_error(ErrorContext::Download, &full_error)
    })
}

/// Checks if a directory name matches the vscode-stylelint pattern
fn is_stylelint_dir(name: &str) -> bool {
    name.contains("vscode-stylelint")
}

/// Validates that exactly one match exists and returns it
fn validate_single_match(matches: Vec<String>) -> Result<String, String> {
    match matches.len() {
        0 => Err("Download completed but no vscode-stylelint directory was found".to_string()),
        1 => Ok(matches.into_iter().next().unwrap()),
        _ => Err(format!(
            "Multiple vscode-stylelint directories found: {:?}. This may indicate a corrupted download.",
            matches
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_stylelint_dir() {
        assert!(is_stylelint_dir("stylelint-vscode-stylelint-abc123"));
        assert!(is_stylelint_dir("vscode-stylelint-1.2.3"));
        assert!(!is_stylelint_dir("some-other-dir"));
        assert!(!is_stylelint_dir(""));
    }

    #[test]
    fn test_validate_single_match_success() {
        let matches = vec!["vscode-stylelint-abc123".to_string()];
        assert_eq!(
            validate_single_match(matches).unwrap(),
            "vscode-stylelint-abc123"
        );
    }

    #[test]
    fn test_validate_single_match_empty() {
        let matches: Vec<String> = vec![];
        assert!(validate_single_match(matches).is_err());
    }

    #[test]
    fn test_validate_single_match_multiple() {
        let matches = vec![
            "vscode-stylelint-abc".to_string(),
            "vscode-stylelint-def".to_string(),
        ];
        assert!(validate_single_match(matches).is_err());
    }
}
