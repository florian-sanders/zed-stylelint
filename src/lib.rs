mod download;
mod error;
mod extension;
mod npm;
mod platform;

// Re-export for tests and external use
pub use error::{format_error, DownloadErrorCategory, ErrorContext};
pub use npm::{categorize_build_error, categorize_npm_error, NpmCommand, NpmOutput};
pub use platform::Platform;

// Internal modules
use extension::StylelintExtension;

zed_extension_api::register_extension!(StylelintExtension);
