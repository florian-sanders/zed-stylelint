use std::fmt::{self, Display};

/// Error context for providing helpful error messages
#[derive(Debug, Clone, Copy)]
pub enum ErrorContext {
    Download,
    NpmInstall,
    BuildBundle,
    DirectoryAccess,
    NodeDetection,
}

impl ErrorContext {
    fn error_prefix(self) -> &'static str {
        match self {
            ErrorContext::Download => "Failed to download Stylelint language server",
            ErrorContext::NpmInstall => "Failed to install npm dependencies",
            ErrorContext::BuildBundle => "Failed to build Stylelint language server",
            ErrorContext::DirectoryAccess => "Failed to access extension directory",
            ErrorContext::NodeDetection => "Failed to detect Node.js/npm",
        }
    }

    fn troubleshooting_hints(self) -> &'static str {
        match self {
            ErrorContext::Download => {
                "\n\nTroubleshooting:\n\
                 - Check your internet connection\n\
                 - If you're behind a proxy, check your proxy settings\n\
                 - GitHub API rate limit may be exceeded; try again later\n\
                 - Verify the version exists on GitHub"
            }
            ErrorContext::NpmInstall => {
                "\n\nTroubleshooting:\n\
                 - Ensure Node.js and npm are properly installed\n\
                 - Check your internet connection for package downloads\n\
                 - Try clearing npm cache: npm cache clean --force\n\
                 - Check for permission issues in the extension directory"
            }
            ErrorContext::BuildBundle => {
                "\n\nTroubleshooting:\n\
                 - Ensure you have sufficient disk space\n\
                 - Check available memory (build may require significant RAM)\n\
                 - Verify Node.js version compatibility\n\
                 - Try restarting Zed and try again"
            }
            ErrorContext::DirectoryAccess => {
                "\n\nTroubleshooting:\n\
                 - Check disk permissions for the extension directory\n\
                 - Ensure sufficient disk space is available\n\
                 - Try restarting Zed with elevated permissions if needed"
            }
            ErrorContext::NodeDetection => {
                "\n\nTroubleshooting:\n\
                 - Ensure Node.js is installed and in your PATH\n\
                 - Restart Zed after installing Node.js\n\
                 - Check that npm is installed alongside Node.js"
            }
        }
    }
}

impl Display for ErrorContext {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.error_prefix())
    }
}

/// Creates a user-friendly error message with context and troubleshooting hints
pub fn format_error(context: ErrorContext, details: &str) -> String {
    format!(
        "{}\n\nError details: {}{}",
        context,
        details,
        context.troubleshooting_hints()
    )
}

/// Categories of download errors for specific handling
#[derive(Debug, Clone, PartialEq)]
pub enum DownloadErrorCategory {
    VersionNotFound,
    RateLimit,
    Timeout,
    Other(String),
}

impl DownloadErrorCategory {
    /// Classify a download error from its message
    pub fn classify(error_msg: &str) -> Self {
        if error_msg.contains("404") || error_msg.contains("Not Found") {
            DownloadErrorCategory::VersionNotFound
        } else if error_msg.contains("403") || error_msg.contains("rate limit") {
            DownloadErrorCategory::RateLimit
        } else if error_msg.contains("timeout") || error_msg.contains("timed out") {
            DownloadErrorCategory::Timeout
        } else {
            DownloadErrorCategory::Other(error_msg.to_string())
        }
    }

    /// Get a user-friendly error message for this category
    pub fn user_message(&self, version: &str) -> String {
        match self {
            DownloadErrorCategory::VersionNotFound => {
                format!("Version '{}' was not found on GitHub. The version may have been removed or renamed.", version)
            }
            DownloadErrorCategory::RateLimit => {
                "GitHub API rate limit exceeded. Please try again later.".to_string()
            }
            DownloadErrorCategory::Timeout => {
                "Download timed out. This may be due to slow network conditions.".to_string()
            }
            DownloadErrorCategory::Other(msg) => format!("Download failed: {}", msg),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_context_display() {
        assert_eq!(
            format!("{}", ErrorContext::Download),
            "Failed to download Stylelint language server"
        );
        assert_eq!(
            format!("{}", ErrorContext::NpmInstall),
            "Failed to install npm dependencies"
        );
    }

    #[test]
    fn test_format_error_includes_prefix() {
        let err = format_error(ErrorContext::Download, "network timeout");
        assert!(err.contains("Failed to download"));
        assert!(err.contains("network timeout"));
        assert!(err.contains("Troubleshooting"));
    }

    #[test]
    fn test_download_error_classify() {
        assert_eq!(
            DownloadErrorCategory::classify("404 Not Found"),
            DownloadErrorCategory::VersionNotFound
        );
        assert_eq!(
            DownloadErrorCategory::classify("403 rate limit exceeded"),
            DownloadErrorCategory::RateLimit
        );
        assert_eq!(
            DownloadErrorCategory::classify("Request timed out"),
            DownloadErrorCategory::Timeout
        );
    }

    #[test]
    fn test_download_error_user_message() {
        let not_found = DownloadErrorCategory::VersionNotFound;
        assert!(not_found.user_message("1.6.0").contains("1.6.0"));

        let rate_limit = DownloadErrorCategory::RateLimit;
        assert!(rate_limit.user_message("any").contains("rate limit"));
    }
}
