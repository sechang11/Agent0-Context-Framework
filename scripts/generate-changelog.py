#!/usr/bin/env python3
"""
Regenerate CHANGELOG.md from MANIFEST.json's `changelog` array.

Single source of truth: MANIFEST.json. CHANGELOG.md is derived.

Run this after every version bump:
    python scripts/generate-changelog.py

Or via the framework's version command (which calls this script):
    /version --regenerate-changelog

Exit codes:
    0  CHANGELOG.md written successfully
    1  MANIFEST.json missing or malformed
    2  CHANGELOG.md write failed
"""

import json
import sys
from pathlib import Path

HEADER = """# Changelog

All notable changes to **Agent0-Context-Framework** are documented here.

This file is **generated from `MANIFEST.json`** by `scripts/generate-changelog.py`.
Don't edit it by hand — edit the `changelog` array in `MANIFEST.json`, then re-run
the script. The manifest is the source of truth; this file is for humans reading
the repo on GitHub.

Versions are dated (`YYYY-MM-DD`). Multiple releases on the same day get a letter
suffix (`2026-05-15a`, `2026-05-15b`).

"""


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    manifest_path = repo_root / "MANIFEST.json"
    changelog_path = repo_root / "CHANGELOG.md"

    if not manifest_path.exists():
        print(f"error: {manifest_path} does not exist", file=sys.stderr)
        return 1

    try:
        with manifest_path.open(encoding="utf-8") as f:
            manifest = json.load(f)
    except json.JSONDecodeError as exc:
        print(f"error: MANIFEST.json is malformed: {exc}", file=sys.stderr)
        return 1

    changelog = manifest.get("changelog", [])
    if not changelog:
        print("warning: manifest has no changelog entries", file=sys.stderr)

    lines: list[str] = [HEADER]

    for entry in changelog:
        version = entry.get("version", "(unknown)")
        notes = entry.get("notes", [])
        lines.append(f"## {version}\n")
        if not notes:
            lines.append("_No notes recorded._\n")
        else:
            for note in notes:
                lines.append(f"- {note}\n")
        lines.append("")  # blank line between versions

    output = "\n".join(lines).rstrip() + "\n"

    try:
        changelog_path.write_text(output, encoding="utf-8", newline="\n")
    except OSError as exc:
        print(f"error: could not write {changelog_path}: {exc}", file=sys.stderr)
        return 2

    print(f"regenerated {changelog_path.relative_to(repo_root)} "
          f"({len(changelog)} version(s), latest: {manifest.get('version', '?')})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
