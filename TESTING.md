# Testing Guide for Zed Stylelint Extension

## Overview

This project uses a hybrid testing approach:
- **Automated Unit Tests**: Pure logic functions that can run with `cargo test`
- **Manual Integration Tests**: Full workflow tests requiring Zed runtime environment

## Automated Tests

### Running Unit Tests

```bash
cargo test
```

All pure logic functions have been extracted to `src/test_helpers.rs` and include comprehensive unit tests:

- **Directory matching**: `is_stylelint_dir()` - Tests vscode-stylelint directory detection
- **Match validation**: `validate_single_match()` - Tests single/multiple/no match scenarios  
- **Version compatibility**: `is_version_compatible()` - Tests version string comparison with trimming
- **Path derivation**: `derive_npm_path()` - Tests Windows/Unix npm path derivation from node path
- **Error categorization**: 
  - `categorize_npm_error()` - Categorizes npm permission/network/engine errors
  - `categorize_build_error()` - Categorizes build memory/TypeScript/script errors
  - `categorize_download_error()` - Categorizes download 404/rate-limit/timeout errors

### Test Coverage

```
running 19 tests
test test_helpers::tests::test_categorize_build_error_generic ... ok
test test_helpers::tests::test_categorize_build_error_memory ... ok
test test_helpers::tests::test_categorize_build_error_missing_script ... ok
test test_helpers::tests::test_categorize_build_error_typescript ... ok
test test_helpers::tests::test_categorize_download_error_404 ... ok
test test_helpers::tests::test_categorize_download_error_generic ... ok
test test_helpers::tests::test_categorize_download_error_rate_limit ... ok
test test_helpers::tests::test_categorize_download_error_timeout ... ok
test test_helpers::tests::test_categorize_npm_error_engine ... ok
test test_helpers::tests::test_categorize_npm_error_generic ... ok
test test_helpers::tests::test_categorize_npm_error_network ... ok
test test_helpers::tests::test_categorize_npm_error_permission ... ok
test test_helpers::tests::test_derive_npm_path_unix ... ok
test test_helpers::tests::test_derive_npm_path_windows ... ok
test test_helpers::tests::test_is_stylelint_dir ... ok
test test_helpers::tests::test_is_version_compatible ... ok
test test_helpers::tests::test_validate_single_match_empty ... ok
test test_helpers::tests::test_validate_single_match_multiple ... ok
test test_helpers::tests::test_validate_single_match_success ... ok
```

## Manual Integration Tests

### Why Manual?

These tests cannot be automated because they require:
1. **Zed WASM Runtime**: The extension compiles to `wasm32-wasip1` and uses `zed_extension_api`
2. **Network Access**: Downloading from GitHub API
3. **Node.js/npm**: Installing and building the language server
4. **File System**: Real directory operations and caching
5. **Zed Editor**: Language server protocol integration

### Running Manual Tests

```bash
./scripts/manual_tests.sh
```

This interactive script guides you through all 7 test scenarios from the test plan.

### Test Scenarios

#### Scenario 1: Clean Install
**What it tests**: Full download → extract → npm install → build workflow

**Setup**: Clear all cached files
```bash
rm -rf ~/.local/share/zed/extensions/stylelint
```

**Expected**:
- Downloads source from GitHub (~5-15s)
- Extracts automatically via Zed API
- Discovers directory dynamically
- Runs npm install (~30-60s)
- Runs build-bundle (~10-20s)
- Creates `.installed_version` marker
- Returns server path
- Language server starts

**Verify**: Check Zed logs for installation progress

#### Scenario 2: Cache Hit
**What it tests**: Fast path when server is already installed

**Setup**: Run immediately after successful Scenario 1

**Expected**:
- Skips download (no network activity)
- Skips build (no npm operations)
- Reads `.installed_version` file
- Returns cached path immediately (< 1s)
- Language server starts

**Verify**: Check Zed logs for "CheckingForUpdate" → immediate startup

#### Scenario 3: Version Change
**What it tests**: Reinstallation when REQUIRED_VERSION changes

**Setup**: 
1. Modify `REQUIRED_VERSION` constant in `src/lib.rs`
2. Rebuild: `cargo build --target wasm32-wasip1`
3. Copy `extension.wasm` to Zed extensions

**Expected**:
- Detects version mismatch (cached != required)
- Proceeds with full workflow
- Updates `.installed_version` marker
- Language server starts with new version

**Verify**: Check that old version is replaced, new version marker created

#### Scenario 4: Corrupted Cache
**What it tests**: Recovery when binary is missing but marker exists

**Setup**:
```bash
# Find and delete start-server.js but keep .installed_version
find ~/.local/share/zed/extensions/stylelint -name "start-server.js" -delete
```

**Expected**:
- Detects missing binary during cache check
- Proceeds with download and build
- Recovers gracefully
- Language server starts

**Verify**: Check that rebuild occurs without errors

#### Scenario 5: Network Failure
**What it tests**: Graceful handling of network issues

**Setup**: 
1. Clear cache
2. Disconnect from internet
3. Attempt to install extension

**Expected**:
- Shows clear error message about network issue
- Suggests checking connection
- Does not crash or panic
- Provides helpful troubleshooting hints

**Verify**: Check error message is user-friendly

#### Scenario 6: Build Failure
**What it tests**: Error handling when npm or build fails

**Setup**: Hard to simulate, options include:
- Corrupt package.json before npm install
- Introduce TypeScript errors in source
- Fill disk to cause out-of-space

**Expected**:
- npm install errors shown clearly with context
- Or build-bundle errors shown clearly
- Installation status shows failure
- User can retry

**Verify**: Error messages are helpful and actionable

#### Scenario 7: Language Server Functionality
**What it tests**: Actual linting works end-to-end

**Setup**: Create test CSS file:
```css
.foo {
  color: red;
  color: blue;  /* Duplicate property - should warn */
}
```

**Expected**:
- Language server starts automatically
- Diagnostics appear for stylelint errors
- Configuration from `.stylelintrc` is respected
- Works with CSS, SCSS, Sass, Less files

**Verify**: Red squiggles appear in editor, problems panel shows issues

## Build Verification

Before releasing, verify:

```bash
# Build for WASM target
cargo build --target wasm32-wasip1

# Verify no warnings (except unused code that's intentional)
cargo build --target wasm32-wasip1 2>&1 | grep -i warning

# Run all unit tests
cargo test

# Check extension.wasm was created
ls -la extension.wasm
```

## Pre-Release Checklist

- [ ] All 19 unit tests pass
- [ ] Build completes without errors
- [ ] No `unwrap()` or `expect()` that could panic in production code
- [ ] Manual tests 1-4 completed successfully
- [ ] Manual test 7 (functionality) verified
- [ ] Error messages are helpful and actionable
- [ ] Performance acceptable (< 2s on cache hit)

## Limitations

### What We Can't Test Automatically

1. **Zed Extension API**: The `zed_extension_api` crate only works inside Zed's WASM runtime
2. **Network Operations**: GitHub downloads, npm package fetching
3. **Node.js/npm**: Requires actual Node installation
4. **File System**: Real directory operations
5. **Language Server Protocol**: LSP communication with Zed

### Why This Is OK

- Core logic is well-tested (19 unit tests)
- Error categorization ensures good error messages
- Manual test script provides structured testing
- Most bugs will be in error handling (tested) not core logic

## Continuous Integration

The automated unit tests can be run in CI:

```yaml
# .github/workflows/test.yml (example)
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: dtolnay/rust-action@stable
      - run: cargo test
      - run: cargo build --target wasm32-wasip1
```

Note: Full integration tests still require manual verification.
