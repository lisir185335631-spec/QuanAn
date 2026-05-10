"""pytest unit tests for _cleanup_stale_verify_artifacts (US-002 · TD-020)."""
import os
import time
from pathlib import Path
from unittest.mock import patch

import pytest


def _import_cleanup():
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "ralph_module", Path(__file__).parent / "ralph.py"
    )
    mod = importlib.util.module_from_spec(spec)
    import sys
    sys.modules["ralph_module"] = mod
    spec.loader.exec_module(mod)
    return mod._cleanup_stale_verify_artifacts, mod


_cleanup, _ralph_mod = _import_cleanup()


def _make_file(path: Path, age_seconds: float) -> None:
    """Create a file with given mtime age (in seconds)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("dummy")
    mtime = time.time() - age_seconds
    os.utime(path, (mtime, mtime))


def _artifacts_dir(tmp_path: Path) -> Path:
    """Return the verify-artifacts directory under tmp_path."""
    d = tmp_path / "verify-artifacts"
    d.mkdir(exist_ok=True)
    return d


def test_removes_files_older_than_threshold(tmp_path):
    """Files older than threshold_hours are deleted."""
    va = _artifacts_dir(tmp_path)
    old_file = va / "US-001" / "old.txt"
    _make_file(old_file, age_seconds=25 * 3600)

    with patch.object(_ralph_mod, "SCRIPT_DIR", tmp_path):
        removed = _cleanup(threshold_hours=24)

    assert removed == 1
    assert not old_file.exists()


def test_keeps_files_within_threshold(tmp_path):
    """Files newer than threshold_hours are preserved."""
    va = _artifacts_dir(tmp_path)
    new_file = va / "US-001" / "new.txt"
    _make_file(new_file, age_seconds=1 * 3600)

    with patch.object(_ralph_mod, "SCRIPT_DIR", tmp_path):
        removed = _cleanup(threshold_hours=24)

    assert removed == 0
    assert new_file.exists()


def test_removes_only_stale_keeps_fresh(tmp_path):
    """Mixed: stale file removed, fresh file kept."""
    va = _artifacts_dir(tmp_path)
    stale = va / "US-002" / "stale.txt"
    fresh = va / "US-002" / "fresh.txt"
    _make_file(stale, age_seconds=48 * 3600)
    _make_file(fresh, age_seconds=2 * 3600)

    with patch.object(_ralph_mod, "SCRIPT_DIR", tmp_path):
        removed = _cleanup(threshold_hours=24)

    assert removed == 1
    assert not stale.exists()
    assert fresh.exists()


def test_multiple_story_dirs(tmp_path):
    """Handles multiple US-* subdirectories."""
    va = _artifacts_dir(tmp_path)
    for story in ("US-001", "US-003", "US-007"):
        _make_file(va / story / "artifact.txt", age_seconds=30 * 3600)

    with patch.object(_ralph_mod, "SCRIPT_DIR", tmp_path):
        removed = _cleanup(threshold_hours=24)

    assert removed == 3


def test_no_verify_artifacts_dir(tmp_path):
    """Returns 0 when verify-artifacts/ doesn't exist (directory absent)."""
    with patch.object(_ralph_mod, "SCRIPT_DIR", tmp_path):
        removed = _cleanup(threshold_hours=24)

    assert removed == 0


def test_empty_story_dir(tmp_path):
    """Empty US-* subdirectory causes no error, returns 0."""
    va = _artifacts_dir(tmp_path)
    (va / "US-001").mkdir(parents=True)

    with patch.object(_ralph_mod, "SCRIPT_DIR", tmp_path):
        removed = _cleanup(threshold_hours=24)

    assert removed == 0


def test_custom_threshold(tmp_path):
    """Custom threshold_hours is respected."""
    va = _artifacts_dir(tmp_path)
    file_2h = va / "US-001" / "file2h.txt"
    _make_file(file_2h, age_seconds=2 * 3600)

    with patch.object(_ralph_mod, "SCRIPT_DIR", tmp_path):
        # threshold=1h → 2h file should be deleted
        removed = _cleanup(threshold_hours=1)

    assert removed == 1
    assert not file_2h.exists()


def test_logs_cleanup_message(tmp_path, capsys):
    """Prints [CLEANUP] log line with correct count and threshold."""
    va = _artifacts_dir(tmp_path)
    stale = va / "US-001" / "f.txt"
    _make_file(stale, age_seconds=26 * 3600)

    with patch.object(_ralph_mod, "SCRIPT_DIR", tmp_path):
        _cleanup(threshold_hours=24)

    captured = capsys.readouterr()
    assert "[CLEANUP] Removed 1 stale files (>24h) in verify-artifacts/" in captured.out
