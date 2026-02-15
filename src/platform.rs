/// Platform detection for handling OS-specific paths
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Platform {
    Windows,
    Unix,
}

impl Platform {
    /// Detect platform from a node binary path
    pub fn from_node_path(node_path: &str) -> Self {
        if node_path.ends_with("node.exe") {
            Platform::Windows
        } else {
            Platform::Unix
        }
    }

    /// Get the npm binary name for this platform
    pub fn npm_binary(self) -> &'static str {
        match self {
            Platform::Windows => "npm.cmd",
            Platform::Unix => "npm",
        }
    }

    /// Derive the npm path from a node path
    ///
    /// # Examples
    ///
    /// Windows:
    /// ```
    /// use stylelint::platform::Platform;
    /// let platform = Platform::from_node_path("C:\\Program Files\\nodejs\\node.exe");
    /// assert_eq!(platform.derive_npm_path("C:\\Program Files\\nodejs\\node.exe"), "C:\\Program Files\\nodejs\\npm.cmd");
    /// ```
    ///
    /// Unix:
    /// ```
    /// use stylelint::platform::Platform;
    /// let platform = Platform::from_node_path("/usr/local/bin/node");
    /// assert_eq!(platform.derive_npm_path("/usr/local/bin/node"), "/usr/local/bin/npm");
    /// ```
    pub fn derive_npm_path(self, node_path: &str) -> String {
        match self {
            Platform::Windows => node_path.replace("node.exe", self.npm_binary()),
            Platform::Unix => node_path.replace("node", self.npm_binary()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_windows() {
        assert_eq!(
            Platform::from_node_path("C:\\Program Files\\nodejs\\node.exe"),
            Platform::Windows
        );
        assert_eq!(
            Platform::from_node_path("C:\\Users\\test\\node.exe"),
            Platform::Windows
        );
    }

    #[test]
    fn test_detect_unix() {
        assert_eq!(
            Platform::from_node_path("/usr/local/bin/node"),
            Platform::Unix
        );
        assert_eq!(Platform::from_node_path("/usr/bin/node"), Platform::Unix);
    }

    #[test]
    fn test_windows_npm_path() {
        let platform = Platform::Windows;
        assert_eq!(
            platform.derive_npm_path("C:\\Program Files\\nodejs\\node.exe"),
            "C:\\Program Files\\nodejs\\npm.cmd"
        );
    }

    #[test]
    fn test_unix_npm_path() {
        let platform = Platform::Unix;
        assert_eq!(
            platform.derive_npm_path("/usr/local/bin/node"),
            "/usr/local/bin/npm"
        );
        assert_eq!(platform.derive_npm_path("/usr/bin/node"), "/usr/bin/npm");
    }
}
