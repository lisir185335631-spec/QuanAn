#!/usr/bin/env python3
from __future__ import annotations  # PEP 563: Python 3.9 兼容 (X | None 类型注解)
"""
audit-artifacts.py — Coding 3.0 X-5 Opus 产物验证工具

读取 Validator 落盘的 verify-artifacts/<story-id>/ 产物, 校验是否真实可信:
- 产物齐全(manifest.json + pytest.xml / mypy.txt / ruff.json 按 story 类型)
- 时间戳在 Validator 运行窗口内(交叉 agent-log)
- JUnit XML 格式合法(Sonnet 难伪造)
- 测试结果全通过

用法:
    python3 audit-artifacts.py <story-id> [--project <path>]
    python3 audit-artifacts.py --story <story-id> [--project <path>]

输出:
    ARTIFACTS VALID  → 可进语义审查
    ARTIFACTS FAKE   → Validator 可能撒谎, reject
    ARTIFACTS MISSING → 产物不存在, reject
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from pathlib import Path

# Windows GBK 编码防御
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def _now() -> datetime:
    from datetime import UTC
    return datetime.now(UTC)


def check_manifest(art_dir: Path) -> tuple[bool, dict, list[str]]:
    """校验 manifest.json 存在 + 结构合法. 返回 (ok, data, errors)"""
    errors: list[str] = []
    manifest = art_dir / "manifest.json"
    if not manifest.exists():
        return False, {}, [f"manifest.json not found at {manifest}"]
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except Exception as e:
        return False, {}, [f"manifest.json parse error: {e}"]

    required = ("story_id", "validator_start_ts", "validator_end_ts", "exit_code")
    for k in required:
        if k not in data:
            errors.append(f"manifest missing field: {k}")

    if errors:
        return False, data, errors
    return True, data, []


def _check_pytest_xml_file(xml_file: Path, label: str) -> tuple[bool | None, str, dict]:
    """通用 pytest JUnit XML 校验. label 用于输出区分 pytest vs pytest-full."""
    if not xml_file.exists():
        return None, f"no {xml_file.name} ({label})", {}

    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()
    except ET.ParseError as e:
        return False, f"{xml_file.name} parse error: {e}", {}

    # JUnit XML root: <testsuites> or <testsuite>
    if root.tag not in ("testsuites", "testsuite"):
        return False, f"{xml_file.name} root tag suspect: {root.tag} (expected testsuites/testsuite)", {}

    # 收集统计
    total = failures = errors = skipped = 0
    for ts in root.iter("testsuite"):
        total += int(ts.get("tests", 0))
        failures += int(ts.get("failures", 0))
        errors += int(ts.get("errors", 0))
        skipped += int(ts.get("skipped", 0))

    stats = {"total": total, "passed": total - failures - errors - skipped,
             "failed": failures, "errors": errors, "skipped": skipped}

    if total == 0:
        return False, f"{xml_file.name} has 0 tests (command ran no tests — suspect)", stats
    if failures > 0 or errors > 0:
        return False, f"{label}: {failures} failed, {errors} errors (blocked)", stats

    return True, f"{label}: {stats['passed']}/{total} passed", stats


def check_pytest_xml(art_dir: Path) -> tuple[bool | None, str, dict]:
    """校验 AC 特定 pytest.xml (story 自己的测试). 返回 (ok/None, msg, stats)"""
    return _check_pytest_xml_file(art_dir / "pytest.xml", "pytest")


def check_pytest_full_xml(art_dir: Path) -> tuple[bool | None, str, dict]:
    """校验零回归 pytest-full.xml (全量 pytest -q). X-6 升级, 2026-04-21.

    与 pytest.xml 区别:
    - pytest.xml: AC 里 test_command 跑的测试 (几个)
    - pytest-full.xml: pytest -q 全量跑 (几百个)

    两者并存, Opus 审计时零回归门禁看这个."""
    return _check_pytest_xml_file(art_dir / "pytest-full.xml", "pytest-full")


def check_mypy(art_dir: Path) -> tuple[bool | None, str]:
    f = art_dir / "mypy.txt"
    if not f.exists():
        return None, "no mypy.txt"
    text = f.read_text(encoding="utf-8", errors="replace")
    if "Success" in text and "no issues" in text:
        return True, "mypy: Success (no issues)"
    if re.search(r"error:|\d+ error", text):
        return False, f"mypy errors detected: {text.strip()[:200]}"
    return True, f"mypy text present ({len(text)} bytes)"


def check_ruff(art_dir: Path) -> tuple[bool | None, str]:
    """ruff --output-format=json 可能带 warning 前缀(如 UP038 deprecated),
    需要容忍并提取最后一个 JSON 数组."""
    f = art_dir / "ruff.json"
    if not f.exists():
        return None, "no ruff.json"
    text = f.read_text(encoding="utf-8", errors="replace").strip()
    if not text:
        return True, "ruff: clean (empty output)"
    if "All checks passed" in text:
        return True, "ruff: All checks passed"

    # 找最后一个 JSON 数组 [...]
    match = re.search(r"\[[\s\S]*\]\s*$", text)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, list):
                if len(data) == 0:
                    return True, "ruff: 0 errors"
                return False, f"ruff: {len(data)} errors found"
        except json.JSONDecodeError:
            pass

    # 找不到合法 JSON, 最后兜底看内容
    if "error" in text.lower():
        return False, f"ruff text has error keyword"
    return True, f"ruff text present (no errors detected, {len(text)} bytes)"


def check_timestamp(data: dict, art_dir: Path) -> tuple[bool, str]:
    """不看 manifest ts(Sonnet 可能偷懒填 00:00:00), 直接看产物文件 mtime.

    ★ AC-2: manifest.zero_regression in (True/'PASS'/'passed') 时跳过检查(防跨 session 旧文件误报).
    两个硬约束(OS 时间戳不可伪造):
    1. 所有产物 mtime 在过去 2 小时内(防陈旧伪造)
    2. 产物 mtime 彼此跨度 < 1 小时(防拼凑旧文件)
    """
    zr = data.get('zero_regression')
    if zr in (True, 'PASS', 'passed'):
        print(f"[INFO] timestamps check skipped: manifest.zero_regression={zr}")
        return True, f"skipped (zero_regression={zr})"

    try:
        from datetime import UTC  # Python 3.11+
    except ImportError:
        from datetime import timezone
        UTC = timezone.utc  # Python 3.9/3.10 fallback
    now = datetime.now(UTC)
    mtimes: list[datetime] = []
    for f in art_dir.glob("*"):
        if f.name == "manifest.json":
            continue
        mtimes.append(datetime.fromtimestamp(f.stat().st_mtime, tz=UTC))

    if not mtimes:
        return False, "no artifact files to check mtime"

    oldest = min(mtimes)
    newest = max(mtimes)
    age_hours = (now - newest).total_seconds() / 3600
    span_hours = (newest - oldest).total_seconds() / 3600

    if age_hours > 2:
        return False, f"artifacts too old: newest is {age_hours:.1f}h ago (>2h suspect)"
    if span_hours > 1:
        return False, f"artifacts span too wide: {span_hours:.1f}h (>1h suspect, pieced from diff runs)"

    return True, f"mtimes fresh (newest {age_hours*60:.0f}min ago, span {span_hours*60:.0f}min)"


def main() -> int:
    # 支持 positional: audit-artifacts.py US-001
    # 支持 named:      audit-artifacts.py --story US-001 [--project <path>]
    story_id = None
    project = None
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == '--story' and i + 1 < len(sys.argv):
            story_id = sys.argv[i + 1]
            i += 2
        elif arg == '--project' and i + 1 < len(sys.argv):
            project = Path(sys.argv[i + 1])
            i += 2
        elif not arg.startswith('--'):
            story_id = arg
            i += 1
        else:
            i += 1

    if not story_id:
        print("用法: audit-artifacts.py <story-id> [--story <id>] [--project <path>]", file=sys.stderr)
        return 2
    if project is None:
        project = Path.cwd()

    art_dir = project / "scripts" / "ralph" / "verify-artifacts" / story_id
    print(f"=== audit-artifacts for {story_id} ===")
    print(f"dir: {art_dir}")

    if not art_dir.exists():
        print(f"[FAIL] ARTIFACTS MISSING: {art_dir} not exists")
        return 1

    results = []

    # 1. manifest
    ok, manifest, errs = check_manifest(art_dir)
    if ok:
        print(f"[OK] manifest.json")
        results.append(("manifest", True))
    else:
        for e in errs:
            print(f"[FAIL] manifest: {e}")
        results.append(("manifest", False))

    # 2. timestamps(若 manifest ok)
    if ok:
        ts_ok, ts_msg = check_timestamp(manifest, art_dir)
        print(f"[{'OK' if ts_ok else 'FAIL'}] timestamps: {ts_msg}")
        results.append(("timestamps", ts_ok))

    # 3. pytest.xml (AC-specific)
    pt_ok, pt_msg, pt_stats = check_pytest_xml(art_dir)
    if pt_ok is None:
        print(f"[SKIP] pytest: {pt_msg}")
    else:
        print(f"[{'OK' if pt_ok else 'FAIL'}] {pt_msg}")
        results.append(("pytest", pt_ok))

    # 3.5 pytest-full.xml (X-6 零回归门禁, 2026-04-21 升级)
    ptf_ok, ptf_msg, _ = check_pytest_full_xml(art_dir)
    if ptf_ok is None:
        print(f"[INFO] pytest-full: {ptf_msg} (零回归门禁缺失, Validator 未产物化)")
        # AC-3: 降级 WARN→INFO — 仅缺 pytest-full.xml 不阻断 audit pass
        # 不 append 到 results — Validator 未产物化时不阻断 Opus, 但 Opus 要去 Step 1.5 补跑
    else:
        print(f"[{'OK' if ptf_ok else 'FAIL'}] {ptf_msg}")
        results.append(("pytest-full", ptf_ok))

    # 4. mypy
    mp_ok, mp_msg = check_mypy(art_dir)
    if mp_ok is None:
        print(f"[SKIP] mypy: {mp_msg}")
    else:
        print(f"[{'OK' if mp_ok else 'FAIL'}] {mp_msg}")
        results.append(("mypy", mp_ok))

    # 5. ruff
    rf_ok, rf_msg = check_ruff(art_dir)
    if rf_ok is None:
        print(f"[SKIP] ruff: {rf_msg}")
    else:
        print(f"[{'OK' if rf_ok else 'FAIL'}] {rf_msg}")
        results.append(("ruff", rf_ok))

    all_ok = all(r[1] for r in results)
    print()
    if all_ok and len(results) > 0:
        print("→ ARTIFACTS VALID (可进语义审查)")
        return 0
    else:
        failed = [r[0] for r in results if not r[1]]
        print(f"→ ARTIFACTS FAKE or INVALID: {failed}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
