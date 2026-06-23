from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path


def _branch_list_path() -> Path | None:
    current = Path(__file__).resolve()
    for parent in current.parents:
        candidate = parent / "frontend" / "src" / "lib" / "branchList.ts"
        if candidate.exists():
            return candidate
    return None


@lru_cache(maxsize=1)
def _branch_labels() -> dict[str, str]:
    path = _branch_list_path()
    if not path:
        return {}

    text = path.read_text(encoding="utf-8", errors="ignore")
    labels: dict[str, str] = {}
    for match in re.finditer(
        r"value:\s*([0-9]+),\s*label:\s*[\"']([^\"']+)[\"']",
        text,
        flags=re.MULTILINE,
    ):
        code, label = match.groups()
        labels[code] = label
    return labels


def format_bank_branch(value: object) -> str:
    code = str(value or "").strip()
    if not code:
        return ""

    label = _branch_labels().get(code)
    if not label:
        return code
    return f"{label} ({code})"
