#!/usr/bin/env bash
#
# Agent0-Context-Framework — bootstrap installer
#
# Run this in an EXISTING project root to install (or update) the framework's
# distributable files. Same algorithm as the /update-framework slash command,
# but in pure bash so you can run it before that slash command exists.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/scripts/bootstrap.sh | bash
#
# Or, after cloning the framework:
#   ./scripts/bootstrap.sh /path/to/target/project
#
# Exit codes:
#   0  success
#   1  missing dependency (curl or python)
#   2  refused to bootstrap (looks like the framework repo itself)
#   3  manifest fetch failed
#   4  download failed during install
#
set -euo pipefail

REPO_RAW_BASE="${REPO_RAW_BASE:-https://raw.githubusercontent.com/sechang11/Agent0-Context-Framework/main/}"

# ---------------------------------------------------------------------------
# Preflight

need() { command -v "$1" >/dev/null 2>&1 || { echo >&2 "error: '$1' is required but not on PATH."; exit 1; }; }
need curl

PY=""
if command -v python3 >/dev/null 2>&1; then PY=python3
elif command -v python  >/dev/null 2>&1; then PY=python
else echo >&2 "error: python (3.x) is required for JSON parsing."; exit 1
fi

# Pick a target directory: $1 if given, else cwd.
TARGET="${1:-$PWD}"
if [[ ! -d "$TARGET" ]]; then
  echo >&2 "error: target directory does not exist: $TARGET"
  exit 1
fi
cd "$TARGET"

# Refuse to bootstrap into the framework's own repo (you don't want to overwrite
# your authoritative copies with the published ones).
if [[ -f "MANIFEST.json" ]] && grep -q '"Agent0-Context-Framework"' MANIFEST.json 2>/dev/null; then
  echo >&2 "error: this directory looks like the Agent0-Context-Framework repo itself."
  echo >&2 "       refusing to overwrite. Run bootstrap inside a target project instead."
  exit 2
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Agent0-Context-Framework bootstrap"
echo "  target: $TARGET"
echo "  source: $REPO_RAW_BASE"
echo ""

# ---------------------------------------------------------------------------
# Fetch manifest

echo "==> fetching MANIFEST.json"
if ! curl -fsSL "${REPO_RAW_BASE}MANIFEST.json" -o "$TMPDIR/manifest.json"; then
  echo >&2 "error: failed to fetch manifest from ${REPO_RAW_BASE}MANIFEST.json"
  exit 3
fi

VERSION=$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1]))['version'])" "$TMPDIR/manifest.json")
echo "    manifest version: $VERSION"
echo ""

# ---------------------------------------------------------------------------
# Walk file list

FILES=$("$PY" -c "
import json,sys
m = json.load(open(sys.argv[1]))
for f in m['files']:
    print(f['path'] + '|' + f['class'])
" "$TMPDIR/manifest.json")

added=0; added_slots=0; updated=0; uptodate=0; skipped=0

while IFS='|' read -r path cls; do
  [[ -z "$path" ]] && continue
  url="${REPO_RAW_BASE}${path}"

  if [[ -f "$path" ]]; then
    if [[ "$cls" == "template" ]]; then
      printf "  skip  (template, exists)  %s\n" "$path"
      skipped=$((skipped+1))
      continue
    fi
    # additive: compare and update if changed
    if ! curl -fsSL "$url" -o "$TMPDIR/file.tmp"; then
      echo >&2 "error: download failed for $url"; exit 4
    fi
    if cmp -s "$path" "$TMPDIR/file.tmp"; then
      printf "  ok    (up-to-date)        %s\n" "$path"
      uptodate=$((uptodate+1))
    else
      cp "$TMPDIR/file.tmp" "$path"
      printf "  UPDATE                    %s\n" "$path"
      updated=$((updated+1))
    fi
  else
    mkdir -p "$(dirname "$path")"
    if ! curl -fsSL "$url" -o "$path"; then
      echo >&2 "error: download failed for $url"; exit 4
    fi
    if [[ "$cls" == "template" ]]; then
      printf "  ADD   (slots to fill)     %s\n" "$path"
      added_slots=$((added_slots+1))
    else
      printf "  ADD                       %s\n" "$path"
      added=$((added+1))
    fi
  fi
done <<< "$FILES"

# ---------------------------------------------------------------------------
# Record baseline

mkdir -p .github
echo "$VERSION" > .github/.framework-version

# ---------------------------------------------------------------------------
# Summary

echo ""
echo "==> done"
printf "    added:           %d\n" "$added"
printf "    added (slots):   %d   (fill the PROJECT slots — or re-run /adopt-framework)\n" "$added_slots"
printf "    updated:         %d\n" "$updated"
printf "    up-to-date:      %d\n" "$uptodate"
printf "    skipped (template, customized): %d\n" "$skipped"
echo ""
echo "    baseline: $VERSION  (written to .github/.framework-version)"
echo ""
echo "Next: open this project in Claude Code. From now on, run /update-framework"
echo "      to pull future additive updates — no need to re-curl this script."
