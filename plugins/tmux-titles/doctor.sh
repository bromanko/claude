#!/bin/bash
# Doctor script for tmux-titles plugin
# Checks for required binaries and environment setup

set -e

PLUGIN_NAME="tmux-titles"
ERRORS=0

echo "Running doctor checks for $PLUGIN_NAME plugin..."

# Check for tmux binary
if command -v tmux &> /dev/null; then
    echo "tmux is installed ($(tmux -V))"
else
    echo "tmux is not installed"
    ERRORS=$((ERRORS + 1))
fi

# Check if running in tmux
if [ -n "$TMUX" ]; then
    echo "Running in tmux session"
else
    echo "Not running in tmux session"
    echo "   This plugin only works inside tmux"
fi

if [ $ERRORS -eq 0 ]; then
    echo "All checks passed for $PLUGIN_NAME plugin"
    exit 0
else
    echo "$ERRORS check(s) failed for $PLUGIN_NAME plugin"
    exit 1
fi
