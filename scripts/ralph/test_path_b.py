"""
AC-6 / AC-7 mock tests for TD-006 PATH-B: _check_existing_commit + _write_path_b_audit_gate.

Run:
  python3 scripts/ralph/test_path_b.py
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

# Allow importing from project ralph
sys.path.insert(0, str(Path(__file__).parent))

import ralph as _ralph_module


class TestCheckExistingCommit(unittest.TestCase):
    """AC-1, AC-6, AC-7, AC-8"""

    def _run_check(self, git_stdout: str, story_id: str, since: str = "30 minutes ago") -> str | None:
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = git_stdout
        with patch("ralph.subprocess.run", return_value=mock_result):
            return _ralph_module._check_existing_commit(story_id, since=since)

    def test_ac6_commit_found(self):
        """AC-6: git log has [US-006] commit → returns hash."""
        git_output = "3c6b28a feat: [US-006] - TD-003 audit-artifacts.py\n"
        result = self._run_check(git_output, "US-006")
        self.assertEqual(result, "3c6b28a", f"Expected '3c6b28a', got {result!r}")
        print("  [PASS] AC-6: commit found → hash returned")

    def test_ac7_no_commit(self):
        """AC-7: git log has no [US-006] commit → returns None (BLOCKED path maintained)."""
        git_output = "abc1234 feat: [US-001] - some other story\n"
        result = self._run_check(git_output, "US-006")
        self.assertIsNone(result, f"Expected None, got {result!r}")
        print("  [PASS] AC-7: no commit → None returned")

    def test_ac8_cross_prd_window(self):
        """AC-8: since='30 minutes ago' scopes out old commits not in window."""
        # Simulate git returning empty (commits outside window filtered by git itself)
        result = self._run_check("", "US-006", since="30 minutes ago")
        self.assertIsNone(result)
        print("  [PASS] AC-8: empty git output → None (cross-PRD window respected)")

    def test_ac7_git_nonzero_exit(self):
        """AC-7: git exits non-zero → returns None gracefully."""
        mock_result = MagicMock()
        mock_result.returncode = 128
        mock_result.stdout = ""
        with patch("ralph.subprocess.run", return_value=mock_result):
            result = _ralph_module._check_existing_commit("US-006")
        self.assertIsNone(result)
        print("  [PASS] AC-7 (git error): returncode=128 → None")

    def test_multi_story_picks_correct(self):
        """Ensure only the queried story ID is matched (not partial substring)."""
        git_output = (
            "aaa1111 feat: [US-0060] - unrelated story\n"
            "bbb2222 feat: [US-006] - correct story\n"
        )
        result = self._run_check(git_output, "US-006")
        self.assertEqual(result, "bbb2222")
        print("  [PASS] multi-story: exact [US-006] match, not [US-0060]")


class TestWritePathBAuditGate(unittest.TestCase):
    """AC-3: writes audit-gate.json with PATH-B metadata."""

    def test_ac3_writes_pending_with_metadata(self):
        """AC-3: audit-gate.json written with status=pending + commit_hash + reason."""
        with tempfile.TemporaryDirectory() as tmpdir:
            gate_file = Path(tmpdir) / "audit-gate.json"
            original_gate = _ralph_module.AUDIT_GATE_FILE
            _ralph_module.AUDIT_GATE_FILE = gate_file
            try:
                result = _ralph_module._write_path_b_audit_gate("US-006", "3c6b28a")
                self.assertTrue(result, "Expected True (write succeeded)")
                self.assertTrue(gate_file.exists(), "audit-gate.json should exist")
                gate = json.loads(gate_file.read_text())
                self.assertEqual(gate["status"], "pending")
                self.assertEqual(gate["story_id"], "US-006")
                self.assertEqual(gate["commit_hash"], "3c6b28a")
                self.assertIn("路径 B", gate["reason"])
                print("  [PASS] AC-3: audit-gate.json written with pending + PATH-B metadata")
            finally:
                _ralph_module.AUDIT_GATE_FILE = original_gate


if __name__ == "__main__":
    print("Running PATH-B mock tests (AC-6, AC-7, AC-8, AC-3)...\n")
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(TestCheckExistingCommit))
    suite.addTests(loader.loadTestsFromTestCase(TestWritePathBAuditGate))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
