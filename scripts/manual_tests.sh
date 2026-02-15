#!/bin/bash
#
# Manual Integration Test Script for Zed Stylelint Extension
# 
# These tests cannot be automated because they require:
# - Zed editor runtime environment (WASM)
# - Network access to GitHub
# - npm/Node.js installation
# - Actual file system operations
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

EXTENSION_DIR="${HOME}/.local/share/zed/extensions/stylelint"
WORK_DIR="$(pwd)"

echo "=========================================="
echo "Zed Stylelint Extension - Manual Test Suite"
echo "=========================================="
echo ""

# Helper functions
print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test 1: Clean Install
run_test_1() {
    print_test "Scenario 1: Clean Install"
    echo "  Setup: Clearing all cached files..."
    
    rm -rf "${EXTENSION_DIR}"
    echo "  - Removed extension directory"
    
    echo ""
    echo "  Expected behavior:"
    echo "    1. Downloads source from GitHub (~5-15s)"
    echo "    2. Extracts to working directory"
    echo "    3. Discovers directory dynamically"
    echo "    4. Runs npm install (~30-60s)"
    echo "    5. Runs build-bundle (~10-20s)"
    echo "    6. Creates .installed_version marker"
    echo "    7. Returns correct server path"
    echo ""
    echo "  Next step: Open Zed and install the extension"
    echo "  Then: Open a CSS file and verify language server starts"
    echo ""
    read -p "  Press Enter when ready to verify (check Zed logs)..."
}

# Test 2: Cache Hit
run_test_2() {
    print_test "Scenario 2: Cache Hit"
    echo "  Setup: Extension already installed from Test 1"
    echo ""
    echo "  Expected behavior:"
    echo "    - Skips download"
    echo "    - Skips build"
    echo "    - Reads .installed_version"
    echo "    - Returns cached path immediately (< 1s)"
    echo "    - Language server starts successfully"
    echo ""
    echo "  Verification: Check Zed logs for 'CheckingForUpdate' -> immediate startup"
    echo ""
    read -p "  Press Enter when ready to verify..."
}

# Test 3: Version Change
run_test_3() {
    print_test "Scenario 3: Version Change"
    echo "  Setup: Modify REQUIRED_VERSION in src/lib.rs, keep cache"
    echo ""
    echo "  Steps:"
    echo "    1. Edit src/lib.rs and change REQUIRED_VERSION"
    echo "    2. Rebuild: cargo build --target wasm32-wasip1"
    echo "    3. Copy extension.wasm to Zed extensions directory"
    echo ""
    echo "  Expected behavior:"
    echo "    - Detects version mismatch"
    echo "    - Proceeds with full workflow (download, install, build)"
    echo "    - Updates .installed_version"
    echo "    - Language server starts successfully"
    echo ""
    read -p "  Press Enter when ready..."
}

# Test 4: Corrupted Cache
run_test_4() {
    print_test "Scenario 4: Corrupted Cache"
    echo "  Setup: Delete start-server.js but keep .installed_version"
    echo ""
    
    # Find the dist directory
    DIST_DIR=$(find "${EXTENSION_DIR}" -name "dist" -type d 2>/dev/null | head -1 || true)
    if [ -n "$DIST_DIR" ]; then
        SERVER_JS="${DIST_DIR}/start-server.js"
        if [ -f "$SERVER_JS" ]; then
            rm "$SERVER_JS"
            echo "  - Deleted ${SERVER_JS}"
        fi
    else
        echo "  - Could not find dist directory, skipping deletion"
    fi
    
    echo ""
    echo "  Expected behavior:"
    echo "    - Detects missing binary"
    echo "    - Proceeds with download and build"
    echo "    - Recovers gracefully"
    echo ""
    read -p "  Press Enter when ready to verify..."
}

# Test 5: Network Failure
run_test_5() {
    print_test "Scenario 5: Network Failure During Download"
    echo "  Setup: Disconnect internet before starting"
    echo ""
    echo "  Steps:"
    echo "    1. Clear cache: rm -rf ${EXTENSION_DIR}"
    echo "    2. Disconnect from internet"
    echo "    3. Open Zed and install extension"
    echo ""
    echo "  Expected behavior:"
    echo "    - Shows clear error message about network issue"
    echo "    - Suggests checking connection"
    echo "    - Does not crash"
    echo ""
    read -p "  Press Enter when ready (reconnect internet after test)..."
}

# Test 6: Build Failure
run_test_6() {
    print_test "Scenario 6: Build Failure"
    echo "  Setup: (Hard to simulate - requires intentional breaking)"
    echo ""
    echo "  Options:"
    echo "    A) Corrupt package.json before npm install"
    echo "    B) Modify source to introduce TypeScript errors"
    echo "    C) Fill disk to cause out-of-space error"
    echo ""
    echo "  Expected behavior:"
    echo "    - npm install errors shown clearly"
    echo "    - Or build-bundle errors shown clearly"
    echo "    - Installation status shows failure"
    echo "    - User can retry"
    echo ""
    echo "  NOTE: This test is optional and may be skipped"
    read -p "  Press Enter to skip or describe your setup..."
}

# Test 7: Language Server Functionality
run_test_7() {
    print_test "Scenario 7: Language Server Functionality"
    echo "  Setup: Create a CSS file with Stylelint errors"
    echo ""
    
    TEST_FILE="/tmp/test-stylelint.css"
    cat > "$TEST_FILE" << 'EOF'
/* Test file with intentional stylelint errors */
.foo {
  color: red;
  color: blue;  /* Duplicate property */
}

.bar {
  COLOR: red;  /* Uppercase property name */
}
EOF
    
    echo "  Created test file: ${TEST_FILE}"
    echo ""
    echo "  Expected behavior:"
    echo "    - Language server starts"
    echo "    - Diagnostics appear for stylelint errors"
    echo "    - Configuration is respected"
    echo ""
    echo "  Open this file in Zed to verify diagnostics appear"
    echo ""
    read -p "  Press Enter when ready to verify..."
}

# Main menu
show_menu() {
    echo ""
    echo "Select a test scenario:"
    echo "  1) Clean Install"
    echo "  2) Cache Hit"
    echo "  3) Version Change"
    echo "  4) Corrupted Cache"
    echo "  5) Network Failure"
    echo "  6) Build Failure"
    echo "  7) Language Server Functionality"
    echo "  a) Run all tests in sequence"
    echo "  q) Quit"
    echo ""
}

# Run all tests
run_all_tests() {
    run_test_1
    run_test_2
    run_test_3
    run_test_4
    run_test_5
    run_test_6
    run_test_7
    
    echo ""
    echo "=========================================="
    echo "All test scenarios completed!"
    echo "=========================================="
}

# Main loop
while true; do
    show_menu
    read -p "Enter choice: " choice
    
    case $choice in
        1) run_test_1 ;;
        2) run_test_2 ;;
        3) run_test_3 ;;
        4) run_test_4 ;;
        5) run_test_5 ;;
        6) run_test_6 ;;
        7) run_test_7 ;;
        a|A) run_all_tests ;;
        q|Q) echo "Goodbye!"; exit 0 ;;
        *) echo "Invalid choice" ;;
    esac
done
