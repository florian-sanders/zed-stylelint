use zed_extension_api::process;

use crate::error::{format_error, ErrorContext};

/// Output from an npm command execution
#[derive(Debug)]
pub struct NpmOutput {
    pub status: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

impl NpmOutput {
    /// Check if the command succeeded (exit code 0)
    pub fn success(&self) -> bool {
        self.status == Some(0)
    }
}

/// Builder for npm commands
pub struct NpmCommand {
    npm_path: String,
    working_dir: String,
    command: NpmSubcommand,
}

#[derive(Debug, Clone)]
enum NpmSubcommand {
    Install,
    Run { script: String },
}

impl NpmCommand {
    /// Create a new npm command builder
    pub fn new(npm_path: impl Into<String>, working_dir: impl Into<String>) -> Self {
        Self {
            npm_path: npm_path.into(),
            working_dir: working_dir.into(),
            command: NpmSubcommand::Install,
        }
    }

    /// Set the command to `npm ci`
    pub fn install(mut self) -> Self {
        self.command = NpmSubcommand::Install;
        self
    }

    /// Set the command to `npm run <script>`
    pub fn run_script(mut self, script: impl Into<String>) -> Self {
        self.command = NpmSubcommand::Run {
            script: script.into(),
        };
        self
    }

    /// Execute the npm command and return output
    pub fn execute(self) -> Result<NpmOutput, String> {
        let args = match &self.command {
            NpmSubcommand::Install => vec!["ci".to_string()],
            NpmSubcommand::Run { script } => vec!["run".to_string(), script.clone()],
        };

        let output = process::Command::new(&self.npm_path)
            .args(&args)
            .arg("--prefix")
            .arg(&self.working_dir)
            .output()
            .map_err(|e| {
                format_error(
                    ErrorContext::NpmInstall,
                    &format!("Could not execute npm command: {e}"),
                )
            })?;

        Ok(NpmOutput {
            status: output.status,
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        })
    }
}

/// Error categorization for npm ci failures
pub fn categorize_npm_error(stderr: &str) -> &'static str {
    if stderr.contains("EACCES") || stderr.contains("permission denied") {
        "Permission denied during npm ci"
    } else if stderr.contains("ECONNREFUSED")
        || stderr.contains("ETIMEDOUT")
        || stderr.contains("ENOTFOUND")
    {
        "Network error during package download"
    } else if stderr.contains("EBADENGINE") {
        "Node.js version incompatible with package requirements"
    } else {
        "npm ci failed"
    }
}

/// Error categorization for build failures
pub fn categorize_build_error(stderr: &str, stdout: &str) -> &'static str {
    if stderr.contains("JavaScript heap out of memory")
        || stdout.contains("JavaScript heap out of memory")
    {
        "Build ran out of memory during TypeScript compilation"
    } else if stderr.contains("error TS") || stdout.contains("error TS") {
        "TypeScript compilation errors occurred"
    } else if stderr.contains("missing script: build-bundle")
        || stdout.contains("missing script: build-bundle")
    {
        "The build-bundle script is missing from package.json"
    } else {
        "Build bundle failed"
    }
}

/// Format npm error details based on error category
pub fn format_npm_error_details(output: &NpmOutput, category: &str) -> String {
    if category == "npm ci failed" {
        format!(
            "npm ci exited with code {:?}\n\nstdout: {}\nstderr: {}",
            output.status, output.stdout, output.stderr
        )
    } else {
        format!("{}\n\nOutput: {}", category, output.stderr)
    }
}

/// Format build error details based on error category
pub fn format_build_error_details(output: &NpmOutput, category: &str) -> String {
    if category == "Build bundle failed" {
        format!(
            "npm run build-bundle exited with code {:?}\n\nstdout: {}\nstderr: {}",
            output.status, output.stdout, output.stderr
        )
    } else {
        format!("{}\n\nOutput: {}", category, output.stderr)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categorize_npm_error_permission() {
        let stderr = "Error: EACCES: permission denied, mkdir '/foo'";
        assert_eq!(
            categorize_npm_error(stderr),
            "Permission denied during npm ci"
        );
    }

    #[test]
    fn test_categorize_npm_error_network() {
        assert_eq!(
            categorize_npm_error("ECONNREFUSED"),
            "Network error during package download"
        );
        assert_eq!(
            categorize_npm_error("ETIMEDOUT"),
            "Network error during package download"
        );
        assert_eq!(
            categorize_npm_error("ENOTFOUND"),
            "Network error during package download"
        );
    }

    #[test]
    fn test_categorize_npm_error_engine() {
        let stderr = "npm ERR! EBADENGINE";
        assert_eq!(
            categorize_npm_error(stderr),
            "Node.js version incompatible with package requirements"
        );
    }

    #[test]
    fn test_categorize_npm_error_generic() {
        assert_eq!(categorize_npm_error("some random error"), "npm ci failed");
    }

    #[test]
    fn test_categorize_build_error_memory() {
        let stderr = "FATAL ERROR: JavaScript heap out of memory";
        assert_eq!(
            categorize_build_error(stderr, ""),
            "Build ran out of memory during TypeScript compilation"
        );
    }

    #[test]
    fn test_categorize_build_error_typescript() {
        let stderr = "error TS2345: Argument of type 'string' is not assignable";
        assert_eq!(
            categorize_build_error(stderr, ""),
            "TypeScript compilation errors occurred"
        );
    }

    #[test]
    fn test_categorize_build_error_missing_script() {
        let stderr = "npm ERR! missing script: build-bundle";
        assert_eq!(
            categorize_build_error(stderr, ""),
            "The build-bundle script is missing from package.json"
        );
    }

    #[test]
    fn test_categorize_build_error_generic() {
        assert_eq!(
            categorize_build_error("", "some error"),
            "Build bundle failed"
        );
    }
}
