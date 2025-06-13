use zed_extension_api::{
    http_client::{HttpMethod, HttpRequest, RedirectPolicy, fetch},
    serde_json,
    Result,
};

pub const STYLELINT_OPEN_VSX_URL: &str = "https://open-vsx.org/api/stylelint/vscode-stylelint";

pub fn fetch_latest_version() -> Result<String> {
    let req = HttpRequest {
        url: STYLELINT_OPEN_VSX_URL.to_string(),
        method: HttpMethod::Get,
        redirect_policy: RedirectPolicy::FollowAll,
        headers: vec![],
        body: None,
    };
    let api_response = fetch(&req).map_err(|e| format!("fetch failed: {e}"))?;
    let api_json: serde_json::Value = serde_json::from_slice(&api_response.body)
        .map_err(|e| format!("failed to parse JSON: {e}"))?;
    let latest_version = api_json["version"]
        .as_str()
        .ok_or("Failed to get version from Open VSX API")?;
    Ok(latest_version.to_string())
}
