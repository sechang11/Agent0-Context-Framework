#!/usr/bin/env bash
#
# Agent0-Context-Framework — status line script.
#
# Prints a one-line summary of the current project's framework state.
# Designed to be invoked by Claude Code's `statusLine.command` setting,
# so the framework version is visible at the bottom of every session
# without typing /version each time.
#
# Output formats:
#   Agent0 v2026-05-20a (solo)       # framework adopted, solo mode
#   Agent0 v2026-05-20a (review)     # framework adopted, review mode (default — also shown explicitly)
#   (empty)                            # project not adopted, or not in a git repo
#
# Non-adopted projects and non-git directories print nothing — the
# status line stays clean instead of showing a confusing "not adopted"
# message.
#
# Installation (once per machine):
#
#   1. Copy this script somewhere stable. Recommended:
#        mkdir -p ~/.agent0
#        cp scripts/statusline.sh ~/.agent0/statusline.sh
#        chmod +x ~/.agent0/statusline.sh
#
#   2. Add to Claude Code's settings.json (~/.claude/settings.json):
#        {
#          "statusLine": {
#            "type": "command",
#            "command": "~/.agent0/statusline.sh"
#          }
#        }
#
#   3. Restart Claude Code. The version line shows at the bottom of
#      every session in any framework-adopted project.
#
# The script is a no-op for projects that haven't adopted the framework
# and for non-git directories, so installing it globally is safe.
#
set -eo pipefail

# Resolve the main tree path (works inside worktrees and the main tree).
# If not in a git repo at all, exit silently.
if main_tree=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null | xargs dirname 2>/dev/null); then
    :
else
    exit 0
fi

# If no main tree resolved (edge case), exit silently
[[ -z "$main_tree" ]] && exit 0

version_file="$main_tree/.github/.framework-version"
mode_file="$main_tree/.github/.agent0-mode"

# If the project isn't framework-adopted, output nothing.
[[ ! -f "$version_file" ]] && exit 0

version=$(head -1 "$version_file" 2>/dev/null | tr -d '[:space:]')
[[ -z "$version" ]] && exit 0

# Determine mode: solo if marker file says so, otherwise review (the default).
# Always display the mode explicitly so it's never ambiguous.
mode="review"
if [[ -f "$mode_file" ]]; then
    file_mode=$(head -1 "$mode_file" 2>/dev/null | tr -d '[:space:]')
    if [[ -n "$file_mode" ]]; then
        mode="$file_mode"
    fi
fi

echo "Agent0 v${version} (${mode})"
