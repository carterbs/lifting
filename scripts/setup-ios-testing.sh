#!/bin/bash
# Setup script for iOS Simulator testing with Claude Code
# This installs the dependencies needed for the ios-simulator MCP server

set -e

echo "=== iOS Simulator Testing Setup ==="
echo ""

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "ERROR: Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

XCODE_VERSION=$(xcodebuild -version | head -1)
echo "Found: $XCODE_VERSION"

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "ERROR: Homebrew is not installed. Please install from https://brew.sh"
    exit 1
fi
echo "Found: Homebrew"

# Install idb-companion via Homebrew
echo ""
echo "Installing idb-companion (Facebook iOS Development Bridge)..."
if brew list idb-companion &> /dev/null; then
    echo "  idb-companion already installed"
else
    brew tap facebook/fb
    brew install idb-companion
    echo "  idb-companion installed"
fi

# Install idb Python client
echo ""
echo "Installing idb Python client..."
if pip3 show fb-idb &> /dev/null; then
    echo "  fb-idb already installed"
else
    pip3 install fb-idb
    echo "  fb-idb installed"
fi

# Verify idb is working
echo ""
echo "Verifying idb installation..."
if command -v idb &> /dev/null; then
    echo "  idb command available"
else
    echo "  WARNING: idb command not found in PATH"
    echo "  You may need to add Python bin to PATH or restart your terminal"
fi

# Check for available simulators
echo ""
echo "Available iOS Simulators:"
xcrun simctl list devices available | head -20
echo "..."

# Test ios-simulator-mcp
echo ""
echo "Testing ios-simulator-mcp..."
if npx -y ios-simulator-mcp --help &> /dev/null 2>&1; then
    echo "  ios-simulator-mcp is working"
else
    echo "  ios-simulator-mcp installed (will start when Claude Code connects)"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Restart Claude Code to pick up the new MCP server configuration"
echo "2. Boot an iOS Simulator: xcrun simctl boot 'iPhone 15 Pro'"
echo "3. Open Simulator app: open -a Simulator"
echo "4. Use the /explore-ios skill to start exploratory testing"
echo ""
echo "MCP Tools available:"
echo "  - ui_describe_all: Get accessibility tree (like Playwright browser_snapshot)"
echo "  - ui_tap, ui_swipe, ui_type: User interactions"
echo "  - screenshot: Capture current screen"
echo "  - install_app, launch_app: App lifecycle"
echo ""
