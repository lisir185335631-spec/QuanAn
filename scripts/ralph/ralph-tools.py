#!/usr/bin/env python3
"""
Ralph Tools - 确定性工具脚本（Coding 3.0）

提供 prd.json 的机械化操作，替代 LLM 解析，节省 token、避免解析错误。

用法:
  python ralph-tools.py next-story          # 返回下一个待执行 story ID
  python ralph-tools.py status              # 打印所有 story 状态摘要
  python ralph-tools.py story US-001        # 打印指定 story 的详细信息
  python ralph-tools.py block US-001 "原因" # 标记指定 story 为 blocked
  python ralph-tools.py reset US-001        # 重置指定 story 的 passes/retryCount
  python ralph-tools.py deps                # 显示依赖关系图
  python ralph-tools.py waves               # 分析 Wave 执行计划（拓扑排序 + 并行度分析）
  python ralph-tools.py validate            # 执行结构化验证（Plan Checker 的 CLI 版本）
  python ralph-tools.py approve             # 审计门禁：通过当前 story 的质量审查
  python ralph-tools.py reject "反馈内容"   # 审计门禁：驳回当前 story（附反馈）
  python ralph-tools.py force-reject "反馈" # 强制驳回（忽略当前状态）
  python ralph-tools.py audit-status        # 审计门禁：查看当前门禁状态
  python ralph-tools.py audit-health [N]    # 驳回率健康检查,阈值默认 0.2
  python ralph-tools.py check-risk          # 检查 risk_level 是否需升档(防 low 档 rubber-stamp,2026-05-04)
  python ralph-tools.py clear-lock          # 清除残留的 ralph-lock.json
  python ralph-tools.py cost                # 查看成本追踪摘要
"""

from __future__ import annotations  # PEP 563: 让 X | None 类型注解在 3.9 也能跑

import json
import sys
from datetime import datetime
from pathlib import Path

# Windows 控制台默认 GBK 编码，无法输出 emoji → 强制 UTF-8
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

SCRIPT_DIR = Path(__file__).parent.resolve()
PRD_FILE = SCRIPT_DIR / "prd.json"
AUDIT_GATE_FILE = SCRIPT_DIR / "audit-gate.json"
LOCK_FILE = SCRIPT_DIR / "ralph-lock.json"
COST_LOG_FILE = SCRIPT_DIR / "cost-log.jsonl"


def read_prd() -> dict:
    if not PRD_FILE.exists():
        print(f"[FAIL] prd.json 不存在: {PRD_FILE}", file=sys.stderr)
        sys.exit(1)
    try:
        return json.loads(PRD_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[FAIL] prd.json 格式错误: {e}", file=sys.stderr)
        sys.exit(1)


def write_prd(prd: dict) -> None:
    """原子写入 prd.json（temp + replace）"""
    content = json.dumps(prd, ensure_ascii=False, indent=2)
    tmp_path = PRD_FILE.with_suffix(".json.tmp")
    try:
        tmp_path.write_text(content, encoding="utf-8")
        # 基本校验
        check = json.loads(tmp_path.read_text(encoding="utf-8"))
        stories = check.get("userStories", [])
        if not isinstance(stories, list) or len(stories) == 0 or not all(isinstance(s, dict) and "id" in s for s in stories):
            print("[WARN]  写入数据校验失败（stories 为空或缺少 id），放弃写入", file=sys.stderr)
            tmp_path.unlink(missing_ok=True)
            sys.exit(1)
        tmp_path.replace(PRD_FILE)
    except json.JSONDecodeError as e:
        print(f"[FAIL] 写入数据 JSON 无效: {e}", file=sys.stderr)
        tmp_path.unlink(missing_ok=True)
        sys.exit(1)
    except (OSError, PermissionError) as e:
        print(f"[FAIL] 写入 prd.json 失败 (文件可能被锁定): {e}", file=sys.stderr)
        tmp_path.unlink(missing_ok=True)
        sys.exit(1)


def get_story(prd: dict, story_id: str) -> dict | None:
    for s in prd.get("userStories", []):
        if s.get("id") == story_id:
            return s
    return None


# ─── 子命令 ───────────────────────────────────

def cmd_next_story():
    """返回下一个待执行 story ID（exits 0 + stdout），或 exits 1 如果没有"""
    prd = read_prd()
    for story in prd.get("userStories", []):
        if not story.get("passes", False) and not story.get("blocked", False):
            # 检查依赖
            depends_on = story.get("depends_on", [])
            deps_met = True
            for dep_id in depends_on:
                dep = get_story(prd, dep_id)
                if not dep or not dep.get("passes", False):
                    deps_met = False
                    break
            if deps_met:
                print(story.get("id", "?"))
                return
    print("(none)", file=sys.stderr)
    sys.exit(1)


def cmd_status():
    """打印所有 story 状态"""
    prd = read_prd()
    stories = prd.get("userStories", [])

    print(f"Project: {prd.get('project', 'N/A')}")
    print(f"Branch:  {prd.get('branchName', 'N/A')}")
    print(f"Stories: {len(stories)}")
    print()

    passed = blocked = pending = 0
    for s in stories:
        sid = s.get("id", "?")
        title = s.get("title", "?")[:50]
        retries = s.get("retryCount", 0)

        if s.get("blocked", False):
            icon = "[BLOCK]"
            status = "BLOCKED"
            blocked += 1
        elif s.get("passes", False):
            icon = "[OK]"
            status = "PASSED"
            passed += 1
        else:
            icon = "[WAIT]"
            status = f"PENDING (retries: {retries})"
            pending += 1

        deps = s.get("depends_on", [])
        dep_str = f" [depends: {','.join(deps)}]" if deps else ""
        print(f"  {icon} {sid} | {status} | {title}{dep_str}")

    print(f"\n  Summary: [OK] {passed} passed, [WAIT] {pending} pending, [BLOCK] {blocked} blocked")

    if pending == 0 and blocked == 0:
        print("  [DONE] All stories resolved!")
    elif pending == 0 and blocked > 0:
        print(f"  [WARN]  All remaining stories are blocked ({blocked})")


def cmd_story(story_id: str):
    """打印指定 story 详情"""
    prd = read_prd()
    story = get_story(prd, story_id)
    if not story:
        print(f"[FAIL] Story {story_id} 不存在", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(story, ensure_ascii=False, indent=2))


def cmd_block(story_id: str, reason: str):
    """标记 story 为 blocked"""
    prd = read_prd()
    story = get_story(prd, story_id)
    if not story:
        print(f"[FAIL] Story {story_id} 不存在", file=sys.stderr)
        sys.exit(1)

    story["blocked"] = True
    existing_notes = story.get("notes", "").strip()
    new_note = f"[手动标记 BLOCKED] {reason}"
    story["notes"] = f"{existing_notes}\n{new_note}".strip() if existing_notes else new_note
    write_prd(prd)
    print(f"[OK] {story_id} 已标记为 blocked: {reason}")


def cmd_reset(story_id: str):
    """重置 story 的 passes/retryCount/blocked/notes"""
    prd = read_prd()
    story = get_story(prd, story_id)
    if not story:
        print(f"[FAIL] Story {story_id} 不存在", file=sys.stderr)
        sys.exit(1)

    story["passes"] = False
    story["retryCount"] = 0
    story["blocked"] = False
    story["notes"] = ""
    write_prd(prd)
    print(f"[OK] {story_id} 已重置为初始状态")


def cmd_deps():
    """显示依赖关系图"""
    prd = read_prd()
    stories = prd.get("userStories", [])

    has_deps = False
    for s in stories:
        deps = s.get("depends_on", [])
        if deps:
            has_deps = True
            sid = s.get("id", "?")
            dep_str = ", ".join(deps)
            status = "[OK]" if s.get("passes") else ("[BLOCK]" if s.get("blocked") else "[WAIT]")
            print(f"  {status} {sid} ← depends on [{dep_str}]")

    if not has_deps:
        print("  (无依赖关系，所有 story 独立)")

    # 检查循环依赖
    dep_map = {}
    for s in stories:
        dep_map[s.get("id", "")] = s.get("depends_on", [])

    def has_cycle(node, visited, path):
        if node in path:
            return True
        if node in visited:
            return False
        visited.add(node)
        path.add(node)
        for dep in dep_map.get(node, []):
            if has_cycle(dep, visited, path):
                return True
        path.remove(node)
        return False

    visited = set()
    for sid in dep_map:
        if has_cycle(sid, visited, set()):
            print(f"\n  [FAIL] 检测到循环依赖! 涉及 {sid}")
            return

    print("\n  [OK] 无循环依赖")


def cmd_waves():
    """分析并显示 Wave 执行计划（基于 depends_on 的拓扑排序）"""
    prd = read_prd()
    stories = prd.get("userStories", [])

    if not stories:
        print("  (无 stories)")
        return

    # 过滤掉缺少 id 字段的畸形 story（防止 KeyError）
    stories = [s for s in stories if "id" in s]
    if not stories:
        print("  (无有效 stories —— 所有 story 缺少 id 字段)")
        return

    # 构建依赖图 + 查找表（避免 O(n²) 线性扫描）
    all_ids = {s["id"] for s in stories}
    story_map = {s["id"]: s for s in stories}
    priority_map = {s["id"]: s.get("priority", 999) for s in stories}
    dep_map = {}
    for s in stories:
        sid = s["id"]
        deps = [d for d in s.get("depends_on", []) if d in all_ids]
        dep_map[sid] = deps

    # Kahn 拓扑排序 → 分 wave
    in_degree = {sid: 0 for sid in all_ids}
    reverse_deps: dict[str, list[str]] = {sid: [] for sid in all_ids}
    for sid, deps in dep_map.items():
        in_degree[sid] = len(deps)
        for dep in deps:
            reverse_deps[dep].append(sid)

    waves: list[list[str]] = []
    ready = [sid for sid, deg in in_degree.items() if deg == 0]
    ready.sort(key=lambda sid: priority_map.get(sid, 999))

    while ready:
        waves.append(sorted(ready, key=lambda sid: priority_map.get(sid, 999)))
        next_ready = []
        for sid in ready:
            for dependent in reverse_deps[sid]:
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    next_ready.append(dependent)
        ready = next_ready

    # 检查是否有 story 没被排入（循环依赖）
    assigned = set()
    for w in waves:
        assigned.update(w)
    unassigned = all_ids - assigned
    if unassigned:
        print(f"  [FAIL] 以下 story 有循环依赖，无法排入 wave: {', '.join(unassigned)}")

    # 输出 wave 计划
    print(f"  Wave 执行计划 ({len(waves)} waves, {len(stories)} stories)")
    print()

    for i, wave in enumerate(waves, 1):
        status_counts = {"pass": 0, "blocked": 0, "pending": 0}
        for sid in wave:
            s = story_map.get(sid)
            if s and s.get("blocked"):
                status_counts["blocked"] += 1
            elif s and s.get("passes"):
                status_counts["pass"] += 1
            else:
                status_counts["pending"] += 1

        parallel_label = "可并行" if len(wave) > 1 else "串行"
        print(f"  Wave {i} ({parallel_label}, {len(wave)} stories):")
        for sid in wave:
            s = story_map.get(sid)
            title = s.get("title", "?")[:45] if s else "?"
            icon = "[OK]" if s and s.get("passes") else ("[BLOCK]" if s and s.get("blocked") else "[WAIT]")
            deps = s.get("depends_on", []) if s else []
            dep_str = f" ← [{','.join(deps)}]" if deps else ""
            print(f"    {icon} {sid}: {title}{dep_str}")
        print()

    # 统计
    parallelizable = sum(1 for w in waves if len(w) > 1)
    max_parallel = max(len(w) for w in waves) if waves else 0
    serial_time = len(stories)
    parallel_time = len(waves)
    speedup = serial_time / parallel_time if parallel_time > 0 else 1

    print(f"  [STATS] 统计:")
    print(f"    - 可并行的 wave 数: {parallelizable}/{len(waves)}")
    print(f"    - 最大并行度: {max_parallel}")
    print(f"    - 理论加速比: {speedup:.1f}x (串行 {serial_time} 步 → 并行 {parallel_time} 步)")


def cmd_approve():
    """审计门禁：通过当前 story 的质量审查，Ralph 将继续执行"""
    if not AUDIT_GATE_FILE.exists():
        print("[FAIL] 没有待审核的审计门禁", file=sys.stderr)
        sys.exit(1)

    try:
        gate = json.loads(AUDIT_GATE_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[FAIL] 读取审计门禁失败: {e}", file=sys.stderr)
        sys.exit(1)

    if gate.get("status") != "pending":
        print(f"[WARN]  审计门禁状态为 {gate.get('status')}，非 pending", file=sys.stderr)
        sys.exit(1)

    gate["status"] = "approved"
    gate["approved_at"] = datetime.now().isoformat()
    # 原子写入 audit-gate.json（ralph.py 正在轮询此文件）
    tmp_gate = AUDIT_GATE_FILE.with_suffix(".json.tmp")
    tmp_gate.write_text(json.dumps(gate, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_gate.replace(AUDIT_GATE_FILE)
    print(f"[OK] {gate.get('story_id', '?')} 审计已通过，Ralph 将继续执行下一个 Story")


def _append_reject_example(gate: dict, feedback: str) -> None:
    """2026-05-04 新增: reject feedback 自动入库到全局反例库,
    供 prd skill 在转 prd.json 时按关键词检索注入到新 story 的 anti_patterns 字段.
    跨 PRD / 跨项目沉淀知识, 解决"类似 story 重复踩同一坑"的问题.

    位置: ~/.claude/playbooks/reject-examples.jsonl
    失败静默, 不影响 reject 主流程.
    """
    try:
        story_id = gate.get("story_id", "?")
        prd = read_prd()
        story = get_story(prd, story_id) if prd else None

        # 项目根 = SCRIPT_DIR.parent.parent (scripts/ralph/ -> project root)
        project_root = SCRIPT_DIR.parent.parent
        prd_slug = ""
        if prd:
            prd_slug = prd.get("branchName", "?").replace("ralph/", "")

        entry = {
            "timestamp": datetime.now().isoformat(),
            "project": prd.get("project", "?") if prd else "?",
            "project_root": str(project_root),
            "branch": prd.get("branchName", "?") if prd else "?",
            "prd_slug": prd_slug,
            "story_id": story_id,
            "story_title": story.get("title", "?") if story else "?",
            "story_description": (story.get("description", "?") or "")[:300] if story else "?",
            "acceptance_criteria_excerpt": (story.get("acceptanceCriteria", []) or [])[:3] if story else [],
            "risk_level": story.get("risk_level", "?") if story else "?",
            "files_to_create": story.get("files_to_create", []) if story else [],
            "files_to_modify": story.get("files_to_modify", []) if story else [],
            "retry_count": story.get("retryCount", 0) if story else 0,
            "feedback": feedback,
        }

        playbooks_dir = Path.home() / ".claude" / "playbooks"
        playbooks_dir.mkdir(parents=True, exist_ok=True)
        examples_file = playbooks_dir / "reject-examples.jsonl"
        with open(examples_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        print(f"  [LOG] reject 反例已入库: {examples_file}", file=sys.stderr)
    except Exception as e:
        print(f"  [WARN] 反例库入库失败 (不影响 reject 主流程): {e}", file=sys.stderr)


def cmd_reject(feedback: str):
    """审计门禁：驳回当前 story，Ralph 将重新开发。

    [LIST] 推荐使用 REJECT-TEMPLATE.md 的标准模板(~/.claude/scripts/ralph/REJECT-TEMPLATE.md):
       Blocker → 当前实现(行号+代码) → 目标代码 → **绝对不能**(反例列表) → 验证方式
    模板化的 feedback 可显著降低第二次 reject 概率(PRD-2 实证)。

    2026-05-04: 自动入库到 ~/.claude/playbooks/reject-examples.jsonl 跨 PRD 沉淀.
    """
    if not AUDIT_GATE_FILE.exists():
        print("[FAIL] 没有待审核的审计门禁", file=sys.stderr)
        sys.exit(1)

    # 提示模板使用(非强制,但在 feedback 过短时警告)
    if len(feedback) < 200:
        print(
            f"[WARN]  feedback 长度仅 {len(feedback)} 字符,可能过简。\n"
            f"   推荐用模板:~/.claude/scripts/ralph/REJECT-TEMPLATE.md\n"
            f"   关键元素:Blocker + 当前代码(行号) + 目标代码 + '绝对不能'反例 + 验证方式",
            file=sys.stderr,
        )

    try:
        gate = json.loads(AUDIT_GATE_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[FAIL] 读取审计门禁失败: {e}", file=sys.stderr)
        sys.exit(1)

    if gate.get("status") != "pending":
        print(f"[WARN]  审计门禁状态为 {gate.get('status')}，非 pending", file=sys.stderr)
        sys.exit(1)

    # 2026-05-04 新增: 入库反例到全局 playbook (在写 audit-gate 之前, 防止 audit-gate 写完后 race)
    _append_reject_example(gate, feedback)

    gate["status"] = "rejected"
    gate["feedback"] = feedback
    gate["rejected_at"] = datetime.now().isoformat()
    # 原子写入 audit-gate.json（ralph.py 正在轮询此文件）
    tmp_gate = AUDIT_GATE_FILE.with_suffix(".json.tmp")
    tmp_gate.write_text(json.dumps(gate, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_gate.replace(AUDIT_GATE_FILE)
    print(f"[FAIL] {gate.get('story_id', '?')} 审计已驳回，Ralph 将根据反馈重新开发")
    print(f"   反馈: {feedback}")


def cmd_audit_status():
    """审计门禁：查看当前门禁状态"""
    if not AUDIT_GATE_FILE.exists():
        print("  没有活跃的审计门禁")
        return

    try:
        gate = json.loads(AUDIT_GATE_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[FAIL] 读取审计门禁失败: {e}", file=sys.stderr)
        sys.exit(1)

    status = gate.get("status", "?")
    icon = {"pending": "[LOCK]", "approved": "[OK]", "rejected": "[FAIL]"}.get(status, "[?]")

    print(f"  {icon} 审计门禁状态")
    print(f"  Story:     {gate.get('story_id', '?')}")
    print(f"  Status:    {status}")
    print(f"  Timestamp: {gate.get('timestamp', '?')}")
    if gate.get("feedback"):
        print(f"  Feedback:  {gate['feedback']}")
    if gate.get("approved_at"):
        print(f"  Approved:  {gate['approved_at']}")
    if gate.get("rejected_at"):
        print(f"  Rejected:  {gate['rejected_at']}")


def cmd_clear_lock():
    """清除残留的 ralph-lock.json"""
    if not LOCK_FILE.exists():
        print("  没有残留的 lock file")
        return

    pid_alive = False
    try:
        lock = json.loads(LOCK_FILE.read_text(encoding="utf-8"))
        old_pid = lock.get("pid")
        print(f"  Lock file 信息:")
        print(f"    PID:       {lock.get('pid', '?')}")
        print(f"    Phase:     {lock.get('phase', '?')}")
        print(f"    Story:     {lock.get('story_id', '?')}")
        print(f"    Started:   {lock.get('started_at', '?')}")
        # 检测 PID 是否仍然存活
        if old_pid:
            try:
                import platform as _plat
                if _plat.system() == "Windows":
                    import subprocess as _sp
                    result = _sp.run(["tasklist", "/FI", f"PID eq {old_pid}", "/NH"],
                                     capture_output=True, text=True, timeout=5)
                    pid_alive = str(old_pid) in result.stdout
                else:
                    import os as _os
                    _os.kill(int(old_pid), 0)
                    pid_alive = True
            except (OSError, ProcessLookupError, ValueError):
                pass  # 进程不存在或 PID 无效
            except Exception:
                pass
    except Exception:
        print("  清除损坏的 lock file")

    if pid_alive:
        print(f"  [WARN]  警告: PID {old_pid} 仍然存活! 清除 lock 后可能导致多个 Ralph 实例并发运行。")
        print(f"  [WARN]  建议先终止该进程，再清除 lock file。")
        print(f"  如确认要强制清除，请手动删除: {LOCK_FILE}")
        return

    LOCK_FILE.unlink(missing_ok=True)
    print("  [OK] lock file 已清除")


def cmd_audit_health(reject_threshold: float = 0.2):
    """Coding 3.0 E-7: 审计健康度检查 — 驳回率统计 + 阈值警告

    驳回率 = (retryCount > 0 的 story 数 + blocked 数) / 总 story 数
    阈值:默认 20%,超过触发 WARN 建议做 /prd-retro 根因分析。
    """
    prd = read_prd()
    stories = prd.get("userStories", [])
    if not stories:
        print("  (无 stories)")
        return

    total = len(stories)
    one_shot = sum(1 for s in stories if s.get("passes") and s.get("retryCount", 0) == 0)
    retried_pass = sum(1 for s in stories if s.get("passes") and s.get("retryCount", 0) > 0)
    blocked = sum(1 for s in stories if s.get("blocked"))
    pending = total - one_shot - retried_pass - blocked

    reject_count = retried_pass + blocked
    reject_rate = reject_count / total if total > 0 else 0.0
    one_shot_rate = one_shot / total if total > 0 else 0.0

    print(f"  [STATS] 审计健康度报告")
    print(f"  {'─' * 40}")
    print(f"  总 Story 数:       {total}")
    print(f"  一轮通过:          {one_shot} ({one_shot_rate*100:.1f}%)")
    print(f"  多轮通过(retried): {retried_pass}")
    print(f"  Blocked:           {blocked}")
    print(f"  Pending:           {pending}")
    print(f"  驳回率:            {reject_rate*100:.1f}% (阈值: {reject_threshold*100:.0f}%)")
    print()

    if reject_rate > reject_threshold:
        print(f"  [WARN]  驳回率 {reject_rate*100:.1f}% 超过阈值 {reject_threshold*100:.0f}%")
        print(f"  建议: 跑 /prd-retro 做根因分析,查是否有:")
        print(f"    - AC 设计缺陷(多个 story 同类 reject)")
        print(f"    - AGENTS.md 红线遗漏(应在 plan-check 阶段预埋)")
        print(f"    - Locked Decisions 冲突")
        sys.exit(2)  # 非零退出码,CI 集成时可用
    else:
        print(f"  [OK] 审计健康度正常")


def cmd_cost():
    """查看成本追踪摘要"""
    if not COST_LOG_FILE.exists():
        print("  没有成本日志 (cost-log.jsonl 不存在)")
        return

    try:
        entries = []
        for line in COST_LOG_FILE.read_text(encoding="utf-8").strip().split("\n"):
            if line.strip():
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

        if not entries:
            print("  成本日志为空")
            return

        total_dev = sum(e.get("duration_seconds", 0) for e in entries if e.get("phase") == "developing")
        total_val = sum(e.get("duration_seconds", 0) for e in entries if e.get("phase") == "validating")
        total = total_dev + total_val
        dev_count = sum(1 for e in entries if e.get("phase") == "developing")
        val_count = sum(1 for e in entries if e.get("phase") == "validating")

        def fmt(seconds):
            h, m, s = int(seconds // 3600), int((seconds % 3600) // 60), int(seconds % 60)
            if h > 0: return f"{h}h {m}m {s}s"
            elif m > 0: return f"{m}m {s}s"
            return f"{s}s"

        print(f"  [STATS] 成本追踪摘要")
        print(f"  {'─' * 40}")
        print(f"  开发 Agent: {dev_count} 次, 耗时 {fmt(total_dev)}")
        print(f"  验证 Agent: {val_count} 次, 耗时 {fmt(total_val)}")
        print(f"  总计:       {dev_count + val_count} 次, 耗时 {fmt(total)}")

        # 按 story 统计
        story_times: dict[str, dict] = {}
        for e in entries:
            sid = e.get("story_id", "unknown")
            if sid not in story_times:
                story_times[sid] = {"dev": 0, "val": 0, "count": 0}
            if e.get("phase") == "developing":
                story_times[sid]["dev"] += e.get("duration_seconds", 0)
            elif e.get("phase") == "validating":
                story_times[sid]["val"] += e.get("duration_seconds", 0)
            story_times[sid]["count"] += 1

        if story_times:
            print(f"\n  按 Story:")
            for sid, t in sorted(story_times.items()):
                total_s = t["dev"] + t["val"]
                print(f"    {sid}: {fmt(total_s)} ({t['count']} 次调用, dev={fmt(t['dev'])}, val={fmt(t['val'])})")

        # 重试统计（与 dashboard costSummary.total_retries 一致）
        story_dev_calls = {}
        for e in entries:
            if e.get("phase") == "developing":
                sid = e.get("story_id", "unknown")
                story_dev_calls[sid] = story_dev_calls.get(sid, 0) + 1
        total_retries = sum(max(0, v - 1) for v in story_dev_calls.values())
        if total_retries > 0:
            print(f"\n  重试次数: {total_retries}")

        # 时间范围
        first_ts = entries[0].get("timestamp", "?")
        last_ts = entries[-1].get("timestamp", "?")
        print(f"\n  时间范围: {first_ts[:19]} ~ {last_ts[:19]}")

    except Exception as e:
        print(f"[FAIL] 读取成本日志失败: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_force_reject(feedback: str):
    """强制驳回审计门禁（忽略当前状态，即使不是 pending 也写入 rejected）"""
    if not AUDIT_GATE_FILE.exists():
        print("[FAIL] 没有审计门禁文件", file=sys.stderr)
        sys.exit(1)

    try:
        gate = json.loads(AUDIT_GATE_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"[FAIL] 读取审计门禁失败: {e}", file=sys.stderr)
        sys.exit(1)

    old_status = gate.get("status", "?")
    gate["status"] = "rejected"
    gate["feedback"] = feedback
    gate["rejected_at"] = datetime.now().isoformat()
    gate["force_rejected"] = True
    # 原子写入 audit-gate.json
    tmp_gate = AUDIT_GATE_FILE.with_suffix(".json.tmp")
    tmp_gate.write_text(json.dumps(gate, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_gate.replace(AUDIT_GATE_FILE)
    print(f"[FAIL] {gate.get('story_id', '?')} 强制驳回 (原状态: {old_status})")
    print(f"   反馈: {feedback}")


def cmd_validate():
    """结构化验证 prd.json（Plan Checker 的 CLI 版本）"""
    prd = read_prd()
    errors = []
    warnings = []

    # 顶层字段
    if not prd.get("project"):
        errors.append("缺少 project 字段")
    if not prd.get("branchName"):
        errors.append("缺少 branchName 字段")
    elif not prd["branchName"].startswith("ralph/"):
        errors.append(f"branchName 必须以 ralph/ 开头，当前: {prd['branchName']}")

    stories = prd.get("userStories", [])
    if not stories:
        errors.append("userStories 为空")

    required_fields = ["id", "title", "description", "acceptanceCriteria",
                       "priority", "passes", "notes", "retryCount", "blocked", "depends_on"]

    all_ids = [st.get("id") for st in stories]
    prev_priority = 0
    for s in stories:
        sid = s.get("id", "?")

        # 必填字段
        for field in required_fields:
            if field not in s:
                errors.append(f"{sid}: 缺少字段 {field}")

        # ID 格式
        if not str(s.get("id", "")).startswith("US-"):
            errors.append(f"{sid}: ID 格式应为 US-NNN")

        # 初始值
        if s.get("passes") is not False:
            errors.append(f"{sid}: passes 初始值应为 false")
        if s.get("retryCount", 0) != 0:
            errors.append(f"{sid}: retryCount 初始值应为 0")
        if s.get("blocked") is not False:
            errors.append(f"{sid}: blocked 初始值应为 false")
        if s.get("notes", "") != "":
            warnings.append(f"{sid}: notes 初始值应为空字符串")

        # Priority 递增
        p = s.get("priority", 0)
        if p != prev_priority + 1:
            warnings.append(f"{sid}: priority={p}，期望 {prev_priority + 1}（不连续）")
        prev_priority = p

        # Acceptance criteria
        criteria = s.get("acceptanceCriteria", [])
        if len(criteria) < 2:
            warnings.append(f"{sid}: 仅有 {len(criteria)} 条 criteria，建议至少 2 条")
        if len(criteria) > 8:
            warnings.append(f"{sid}: 有 {len(criteria)} 条 criteria，story 可能太大")

        has_typecheck = any("typecheck" in str(c).lower() for c in criteria)
        if not has_typecheck:
            errors.append(f"{sid}: 缺少 'Typecheck passes' criteria")

        # 模糊表述检测（英文 + 中文）
        vague = ["works correctly", "good ux", "handle edge cases",
                 "works as expected", "properly implemented",
                 "should work", "looks good", "is correct",
                 "正常工作", "工作正常", "良好体验", "良好的ux", "处理边缘情况",
                 "按预期工作", "正确实现", "应该可以", "没问题"]
        for c in criteria:
            c_lower = str(c).lower()
            for v in vague:
                if v in c_lower:
                    errors.append(f"{sid}: criteria 包含模糊表述 '{v}'")

        # 粒度检查
        title = s.get("title", "")
        if " and " in title.lower() or "和" in title or "以及" in title or "同时" in title:
            warnings.append(f"{sid}: 标题包含连接词，可能需要拆分: {title}")

        desc = s.get("description", "")
        if len(desc.split()) > 100:
            warnings.append(f"{sid}: description 超过 100 词，story 可能太大")

        # depends_on 验证
        deps = s.get("depends_on", [])
        for dep in deps:
            if dep not in all_ids:
                errors.append(f"{sid}: depends_on 引用了不存在的 {dep}")
            else:
                dep_story = next((st for st in stories if st.get("id") == dep), None)
                if dep_story and dep_story.get("priority", 0) >= p:
                    errors.append(f"{sid}: 依赖 {dep} 的 priority >= 自身，执行顺序错误")

    # 输出
    print(f"{'='*48}")
    print(f"  Plan Check Report")
    print(f"{'='*48}")

    if errors:
        print(f"\n  [FAIL] 错误 ({len(errors)}):")
        for e in errors:
            print(f"    - {e}")

    if warnings:
        print(f"\n  [WARN]  警告 ({len(warnings)}):")
        for w in warnings:
            print(f"    - {w}")

    if not errors and not warnings:
        print(f"\n  [OK] 全部通过!")

    print(f"\n  [STATS] 统计: {len(stories)} stories, {len(errors)} errors, {len(warnings)} warnings")

    conclusion = "PASS" if not errors else "FAIL"
    if not errors and warnings:
        conclusion = "WARN"
    print(f"  [GOAL] 结论: [{conclusion}]")
    print(f"{'='*48}")

    sys.exit(1 if errors else 0)


def cmd_check_risk():
    """2026-05-04 新增: 检查 prd.json 中 risk_level 是否需要升档.

    Coding 3.0 防 low 档 rubber-stamp 污染下游. 规则 (见 AUDIT-CHECKLIST-TEMPLATE.md §Z):
    1. low + downstream≥3 + 关键词(model/schema/protocol/...) → foundation
    2. low + downstream≥5 (任意关键词) → medium 起步
    3. medium + downstream≥5 + 关键词 → foundation
    4. 缺 risk_level 字段 → 警告

    退出码: 0 全部合理 / 1 prd.json 错 / 2 有 story 建议升档 (CI 友好)
    """
    prd = read_prd()
    stories = prd.get("userStories", [])
    if not stories:
        print("  (无 stories)")
        return

    # 计算每个 story 的 downstream count (反向 depends_on)
    downstream: dict[str, int] = {s.get("id", ""): 0 for s in stories}
    for s in stories:
        for dep_id in s.get("depends_on", []):
            if dep_id in downstream:
                downstream[dep_id] += 1

    # foundation 关键词集合 (model/schema/protocol/共享类)
    foundation_keywords = [
        "model", "schema", "protocol", "shared type", "shared",
        "字段", "结构", "fixture", "__init__", "conftest",
        "锁", "协议", "常量", "枚举", "enum", "constant",
    ]

    suggestions: list[tuple[str, str, int, list[str]]] = []
    missing_risk: list[str] = []

    for s in stories:
        sid = s.get("id", "?")
        title = s.get("title", "")
        desc = s.get("description", "")
        text = f"{title} {desc}".lower()
        risk = s.get("risk_level")
        ds_count = downstream.get(sid, 0)

        if not risk:
            missing_risk.append(sid)
            continue

        hit_keywords = [k for k in foundation_keywords if k in text]
        is_foundation_kw = len(hit_keywords) > 0

        if risk == "low" and ds_count >= 3 and is_foundation_kw:
            suggestions.append((sid, "low → foundation", ds_count, hit_keywords))
        elif risk == "low" and ds_count >= 5:
            suggestions.append((sid, "low → medium", ds_count, hit_keywords))
        elif risk == "medium" and ds_count >= 5 and is_foundation_kw:
            suggestions.append((sid, "medium → foundation", ds_count, hit_keywords))

    print(f"  [CHECK] risk_level 升档检查 (Coding 3.0 — 防 low 档 rubber-stamp 污染下游)")
    print(f"  {'─' * 60}")

    if missing_risk:
        print(f"\n  [WARN] {len(missing_risk)} 个 story 缺 risk_level 字段 (建议补齐):")
        for sid in missing_risk:
            print(f"    - {sid}")

    if suggestions:
        print(f"\n  [SUGGEST] {len(suggestions)} 个 story 建议升档:")
        for sid, upgrade, ds, kws in suggestions:
            kw_str = ", ".join(kws[:3]) if kws else "无关键词"
            print(f"    - {sid} {upgrade} (downstream={ds}, 关键词: {kw_str})")
        print(f"\n  规则:")
        print(f"    - low + downstream≥3 + 关键词命中 → foundation")
        print(f"    - low + downstream≥5 (任意) → medium 起步")
        print(f"    - medium + downstream≥5 + 关键词命中 → foundation")
        print(f"\n  应用方式:")
        print(f"    - 编辑 prd.json 修改 risk_level 字段")
        print(f"    - 同时在 notes 加: '[risk-upgrade] X → Y due to downstream=N + <关键词>'")
        print(f"    - 或在 plan-check 时让 Opus 决策")
        sys.exit(2)

    if not missing_risk and not suggestions:
        print(f"  [OK] risk_level 分档合理, 无需升档")


# ─── 入口 ─────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1]

    if cmd == "next-story":
        cmd_next_story()
    elif cmd == "status":
        cmd_status()
    elif cmd == "story":
        if len(sys.argv) < 3:
            print("用法: ralph-tools.py story <story-id>", file=sys.stderr)
            sys.exit(1)
        cmd_story(sys.argv[2])
    elif cmd == "block":
        if len(sys.argv) < 4:
            print("用法: ralph-tools.py block <story-id> <reason>", file=sys.stderr)
            sys.exit(1)
        cmd_block(sys.argv[2], sys.argv[3])
    elif cmd == "reset":
        if len(sys.argv) < 3:
            print("用法: ralph-tools.py reset <story-id>", file=sys.stderr)
            sys.exit(1)
        cmd_reset(sys.argv[2])
    elif cmd == "deps":
        cmd_deps()
    elif cmd == "waves":
        cmd_waves()
    elif cmd == "validate":
        cmd_validate()
    elif cmd == "approve":
        cmd_approve()
    elif cmd == "reject":
        if len(sys.argv) < 3:
            print("用法: ralph-tools.py reject <feedback>", file=sys.stderr)
            sys.exit(1)
        cmd_reject(sys.argv[2])
    elif cmd == "audit-status":
        cmd_audit_status()
    elif cmd == "audit-health":
        threshold = float(sys.argv[2]) if len(sys.argv) >= 3 else 0.2
        cmd_audit_health(threshold)
    elif cmd == "check-risk":
        cmd_check_risk()
    elif cmd == "force-reject":
        if len(sys.argv) < 3:
            print("用法: ralph-tools.py force-reject <feedback>", file=sys.stderr)
            sys.exit(1)
        cmd_force_reject(sys.argv[2])
    elif cmd == "clear-lock":
        cmd_clear_lock()
    elif cmd == "cost":
        cmd_cost()
    else:
        print(f"[FAIL] 未知命令: {cmd}", file=sys.stderr)
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
