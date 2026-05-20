#!/usr/bin/env python3
"""
Ralph v2 - 自主 AI Agent 循环执行器（含 Validator）
Coding 3.0 升级：崩溃恢复 + 成本追踪 + 显式 Story ID 传递 + prd.json 备份 + 级联失败处理
"""

import json
import re
import signal
import sys
import subprocess
import time
import os
import shutil
import atexit
from pathlib import Path
from datetime import datetime

# ─── 管道断裂防护（防止 | head -N 等管道截断导致进程静默退出）───
# Unix 上 SIGPIPE 默认会杀掉进程；Windows 无 SIGPIPE 但有 BrokenPipeError
if hasattr(signal, "SIGPIPE"):
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)

# Windows 控制台默认 GBK 编码，无法输出 emoji → 强制 UTF-8
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass



try:
    import dashboard
except ImportError:
    # dashboard.py 未复制到项目 → 降级：所有 dashboard 调用变为 no-op
    class _DashboardStub:
        @staticmethod
        def start(**kwargs): pass
        @staticmethod
        def set_state(**kwargs): pass
    dashboard = _DashboardStub()
    print("[WARN]  dashboard.py 未找到，监控面板不可用（不影响执行）")

# ─────────────────────────────────────────────
# 配置
# ─────────────────────────────────────────────
MAX_ITERATIONS = 50
TIMEOUT_SECONDS = 30 * 60          # 开发 Agent 超时：30 分钟
VALIDATOR_TIMEOUT_SECONDS = 60 * 60  # Validator 超时：60 分钟
MAX_BACKUPS = 10                   # prd.json 备份保留数量
AUDIT_POLL_INTERVAL = 30           # 审计门禁轮询间隔（秒）
AUDIT_TIMEOUT_SECONDS = 10800      # 审计门禁超时：3 小时
# RCA-006 修复(2026-05-15) · timeout 不再 silent skip · daemon 退出 · audit-gate.json 保留 pending
# 用户介入后可 ralph-tools.py approve / reject / force-reject · 或重启 daemon 自动崩溃恢复
# 详见 .agents/rca/RCA-006-audit-timeout-bypass.md


class AuditTimeoutError(Exception):
    """RCA-006(2026-05-15) · audit timeout 触发 · daemon 必须退出 · 不绕过 audit · 严格 Audit Gate 零容忍"""
    pass


class RateLimitDetected(Exception):
    """PRD-14 retro M-2 (2026-05-15) · Validator 撞 Anthropic rate limit · daemon 退出 + Step 4.5 路径触发"""
    pass


def _detect_rate_limit_in_validator_output(stdout: str) -> bool:
    """PRD-14 retro M-2 (2026-05-15) · 检测 Validator stdout 含 Anthropic rate limit 标记
    避免 ralph 进 retry hell · 浪费 30-90 min 等 reset
    用法: run_validator 异常退出后 · 检测 stdout · 若命中 → raise RateLimitDetected
    """
    import re
    patterns = [
        r"You've hit your limit",
        r"resets \d+(am|pm)",
        r"rate limit exceeded",
        r"You have exceeded the rate limit",
    ]
    return any(re.search(p, stdout, re.IGNORECASE) for p in patterns)

MAX_RETRIES = 5                    # 单个 story 最大重试次数（确定性兜底，不依赖 LLM）
MAX_PROGRESS_BYTES = 512 * 1024    # progress.txt 最大保留 512KB（超出时截断旧内容）

# 参数解析：正确处理 --key value 格式，防止 value 被当作位置参数
def _parse_args():
    """解析命令行参数，返回 (agent, model, no_audit_gate, daemon, with_dev_server)"""
    args = sys.argv[1:]
    agent = "claude"
    model = "sonnet"
    no_audit_gate = False
    daemon = False
    with_dev_server = True  # TD-095: 默认开启 dev server 管理
    i = 0
    while i < len(args):
        if args[i] == "--model" and i + 1 < len(args):
            model = args[i + 1]
            i += 2
        elif args[i] == "--no-audit-gate":
            no_audit_gate = True
            i += 1
        elif args[i] == "--daemon":
            daemon = True
            i += 1
        elif args[i] == "--with-dev-server":
            with_dev_server = True
            i += 1
        elif args[i] == "--no-dev-server":
            with_dev_server = False
            i += 1
        elif not args[i].startswith("--"):
            agent = args[i]  # 真正的位置参数：agent 类型
            i += 1
        else:
            i += 1  # 跳过未知 flag
    return agent, model, no_audit_gate, daemon, with_dev_server

AGENT, MODEL, NO_AUDIT_GATE, DAEMON_MODE, WITH_DEV_SERVER = _parse_args()

# ─────────────────────────────────────────────
# 路径配置
# ─────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent
CLAUDE_INSTRUCTION_FILE = SCRIPT_DIR / "CLAUDE.md"
VALIDATOR_INSTRUCTION_FILE = SCRIPT_DIR / "VALIDATOR.md"
PRD_FILE = SCRIPT_DIR / "prd.json"
PROGRESS_FILE = SCRIPT_DIR / "progress.txt"
LOCK_FILE = SCRIPT_DIR / "ralph-lock.json"
AUDIT_GATE_FILE = SCRIPT_DIR / "audit-gate.json"
COST_LOG_FILE = SCRIPT_DIR / "cost-log.jsonl"  # M-4 fallback · 实际写入用 _get_cost_log_path()
# TD-095: dev server pid/log 文件
DEV_SERVER_PID_FILE = SCRIPT_DIR / "dev-server.pid"
DEV_SERVER_LOG_FILE = SCRIPT_DIR / "dev-server.log"
BACKUP_DIR = SCRIPT_DIR / "backups"


# ─────────────────────────────────────────────
# PRD-5 retro M-1/M-2/M-4 helpers (2026-05-09 加)
# ─────────────────────────────────────────────

def _get_cost_log_path() -> "Path":
    """M-4 (PRD-5 retro · cost-log per-PRD 防跨 PRD 累积污染)
    按 prd.json branchName 推 PRD 编号写到独立 cost-log-{branch}.jsonl.
    """
    try:
        if PRD_FILE.exists():
            prd = json.loads(PRD_FILE.read_text(encoding="utf-8"))
            branch = (prd.get("branchName") or "").replace("/", "-")
            if branch:
                return SCRIPT_DIR / f"cost-log-{branch}.jsonl"
    except Exception:
        pass
    return COST_LOG_FILE


def _check_claude_health(timeout: int = 45) -> bool:
    """M-2 + RCA-004 (PRD-7 US-005 · 2026-05-10 · 全局 sync) + PRD-15 retro M-3 (QuanQn 2026-05-16 · cold start race fix):
    · 45s 内 'say OK' 测试 · 防 claude --print 系统级 hang
    · timeout 5s 在 PRD-6 实测会误杀 (claude --print cold start ≈ 10-15s · Mac M3 + 健康 CLI)
    · timeout 20s 在 QuanQn PRD-15 US-001 实测仍会偶撞边界(cold + 高负载 + Anthropic API 慢)→ retryCount 累加 5 次 BLOCKED bug
    · 45s 给 3x cold start 余量 · 真 hang (>30 min) 仍能快速探测
    返回 True if claude CLI 健康 · False if hang/timeout/error.
    """
    if AGENT == "codex":
        return True  # codex 不在范围
    try:
        cmd = build_cmd()
        result = subprocess.run(
            cmd,
            input="Say only OK and nothing else.",
            text=True,
            timeout=timeout,
            capture_output=True,
        )
        return result.returncode == 0 and "OK" in (result.stdout or "").upper()
    except Exception:
        return False


def _is_network_error(label: str, max_age_sec: int = 120) -> bool:
    """TD-009 (PRD-5 retro · 网络故障不算 retryCount)
    检测最新 agent log 末尾是否含 ECONNRESET / 503 / ETIMEDOUT 等网络错误关键词。
    必须 mtime 在 max_age_sec 内 (避免读旧 log 误判)。
    """
    try:
        safe_label = label.replace(" ", "_")
        matches = list(AGENT_LOG_DIR.glob(f"*_{safe_label}.log"))
        if not matches:
            return False
        latest = max(matches, key=lambda p: p.stat().st_mtime)
        if (time.time() - latest.stat().st_mtime) > max_age_sec:
            return False
        size = latest.stat().st_size
        with open(latest, "rb") as f:
            f.seek(max(0, size - 4096))
            tail = f.read().decode("utf-8", errors="replace")
        return any(p in tail for p in (
            "ECONNRESET",
            "503 Service Unavailable",
            "504 Gateway Timeout",
            "ETIMEDOUT",
            "ENETUNREACH",
            "EAI_AGAIN",
            "API Error: Unable to connect",
            "Anthropic API error: 503",
            "Anthropic API error: 502",
            "Anthropic API error: 429",
        ))
    except Exception:
        return False


def _write_blocked_audit_gate(has_pass: bool) -> bool:
    """M-1 (PRD-5 RCA-003 教训): BLOCKED 必须写 audit-gate(needs_attention) · 不静默 exit
    返回 True if 有 BLOCKED stories 已写入 audit-gate · False if 0 blocked.
    """
    try:
        if not PRD_FILE.exists():
            return False
        prd = json.loads(PRD_FILE.read_text(encoding="utf-8"))
        blocked = [s for s in prd.get("userStories", []) if s.get("blocked")]
        if not blocked:
            return False
        blocked_ids = [s.get("id") for s in blocked]
        audit_data = {
            "status": "blocked_needs_attention",
            "blocked_stories": blocked_ids,
            "has_passed": has_pass,
            "message": f"{len(blocked)} stories BLOCKED · 需用户介入决策 (approve / reject / split / quit)",
            "timestamp": datetime.now().isoformat(),
        }
        AUDIT_GATE_FILE.write_text(
            json.dumps(audit_data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"\n[AUDIT-GATE] BLOCKED audit-gate 已写入 · {len(blocked)} stories: {blocked_ids}")
        print(f"[AUDIT-GATE] 等用户决策 · 不静默 exit · 详 {AUDIT_GATE_FILE}")
        # macOS notify (best effort · 不阻塞)
        try:
            subprocess.run(
                ["osascript", "-e",
                 f'display notification "{len(blocked)} stories BLOCKED · 需 attention" with title "Ralph daemon"'],
                capture_output=True, timeout=3,
            )
        except Exception:
            pass
        return True
    except Exception as e:
        print(f"[WARN] 写 BLOCKED audit-gate 失败: {e}")
        return False


# ─────────────────────────────────────────────
# 命令构建
# ─────────────────────────────────────────────
def _find_claude_cli() -> str | None:
    """Windows 上 claude 可能作为 claude.exe / claude.cmd / 纯 claude(shim) 存在.
    按优先级查找: 原生 .exe > .cmd 批处理 > shim. Unix 直接找 claude.
    """
    import platform
    if platform.system() == "Windows":
        for name in ("claude.exe", "claude.cmd", "claude"):
            if shutil.which(name):
                return name
        return None
    return "claude" if shutil.which("claude") else None


def build_cmd() -> list[str]:
    """根据 AGENT 配置构建基础命令（prompt 通过 stdin 传递，不作为 CLI 参数）"""
    if AGENT == "codex":
        return ["codex", "exec", "--dangerously-bypass-approvals-and-sandbox"]
    claude_bin = _find_claude_cli() or "claude"
    return [claude_bin, "--print", "--dangerously-skip-permissions", "--model", MODEL]


def build_process_cmd() -> list[str]:
    """构建子进程命令.

    2026-05-04 修复: macOS `script -q /dev/null cmd` 会吞 stdin (PTY 不转发 stdin
    到 claude --print), 实测 echo pipe + claude --print 直接 Popen 正常工作.
    去掉 script wrapper, 所有平台都直接 Popen claude (--print 是非交互模式,
    不需要 PTY 颜色/进度条等).
    """
    return build_cmd()


# ─────────────────────────────────────────────
# prd.json 校验与恢复
# ─────────────────────────────────────────────
def validate_prd(path: Path | None = None) -> bool:
    """校验 prd.json 合法性：合法 JSON + userStories 列表 + 每项有 id"""
    target = path or PRD_FILE
    try:
        data = json.loads(target.read_text(encoding="utf-8"))
        stories = data.get("userStories", [])
        if not isinstance(stories, list) or len(stories) == 0:
            return False
        return all(isinstance(s, dict) and "id" in s for s in stories)
    except Exception:
        return False


def restore_prd() -> bool:
    """从 backups/ 中找最新的合法备份恢复 prd.json，返回是否成功"""
    if not BACKUP_DIR.exists():
        return False
    for bak in sorted(BACKUP_DIR.glob("prd.json.bak.*"),
                      key=lambda p: p.stat().st_mtime, reverse=True):
        if validate_prd(bak):
            shutil.copy2(bak, PRD_FILE)
            print(f"  [FIX] prd.json 已从备份恢复: {bak.name}")
            return True
    print("  [FAIL] 无可用的合法备份，请从 git 手动恢复: git show <commit>:scripts/ralph/prd.json")
    return False


# ─────────────────────────────────────────────
# prd.json 读写
# ─────────────────────────────────────────────
def read_prd() -> dict | None:
    """安全读取 prd.json，损坏时自动从备份恢复"""
    try:
        data = json.loads(PRD_FILE.read_text(encoding="utf-8"))
        stories = data.get("userStories", [])
        if isinstance(stories, list) and len(stories) > 0:
            return data
        raise ValueError("userStories 缺失或为空")
    except Exception as e:
        print(f"[WARN]  prd.json 读取失败: {e}")
        if restore_prd():
            try:
                return json.loads(PRD_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass
        return None


def write_prd_safe(prd: dict) -> bool:
    """
    原子写入 prd.json：写入临时文件 → 校验 → 替换原文件。
    防止写入中途崩溃导致 prd.json 损坏。返回是否成功。
    """
    content = json.dumps(prd, ensure_ascii=False, indent=2)
    tmp_path = PRD_FILE.with_suffix(".json.tmp")
    try:
        tmp_path.write_text(content, encoding="utf-8")
        # 校验临时文件合法性
        if not validate_prd(tmp_path):
            print("[WARN]  write_prd_safe: 写入数据未通过校验，放弃写入")
            tmp_path.unlink(missing_ok=True)
            return False
        # 原子替换（Windows 上 rename 不能覆盖，用 replace）
        tmp_path.replace(PRD_FILE)
        return True
    except OSError as e:
        # errno 28 = ENOSPC (磁盘满)
        if hasattr(e, 'errno') and e.errno == 28:
            print(f"[FAIL] 磁盘空间不足，无法写入 prd.json: {e}")
        else:
            print(f"[WARN]  write_prd_safe 写入失败: {e}")
        tmp_path.unlink(missing_ok=True)
        return False
    except Exception as e:
        print(f"[WARN]  write_prd_safe 写入失败: {e}")
        tmp_path.unlink(missing_ok=True)
        return False


def get_story_by_id(prd: dict, story_id: str) -> dict | None:
    """根据 ID 获取 story"""
    for story in prd.get("userStories", []):
        if story.get("id") == story_id:
            return story
    return None


def get_current_story_id() -> str | None:
    """返回 prd.json 中第一个 passes=False、blocked=False、且依赖已满足的 story ID"""
    prd = read_prd()
    if not prd:
        return None
    for story in prd.get("userStories", []):
        if story.get("passes", False) or story.get("blocked", False):
            continue
        # 检查 depends_on 依赖是否全部已通过
        depends_on = story.get("depends_on", [])
        deps_met = True
        for dep_id in depends_on:
            dep = get_story_by_id(prd, dep_id)
            if not dep or not dep.get("passes", False):
                deps_met = False
                break
        if deps_met:
            return story.get("id")
    return None


def all_stories_resolved() -> bool:
    """检查是否所有 story 都已完成或被 blocked"""
    prd = read_prd()
    if not prd:
        return False
    for story in prd.get("userStories", []):
        if not story.get("passes", False) and not story.get("blocked", False):
            return False
    return True


def any_story_passed() -> bool:
    """检查是否至少有一个 story 已通过"""
    prd = read_prd()
    if not prd:
        return False
    return any(s.get("passes", False) for s in prd.get("userStories", []))


# ─────────────────────────────────────────────
# P0: prd.json 备份机制
# ─────────────────────────────────────────────
def backup_prd(iteration: int) -> None:
    """在每次 iteration 开始前备份 prd.json，保留最近 MAX_BACKUPS 个"""
    if not PRD_FILE.exists():
        return
    if not validate_prd():
        print(f"  [WARN]  prd.json 不合法，跳过备份（防止污染 backups/）")
        return

    BACKUP_DIR.mkdir(exist_ok=True)

    # M2: 先清理旧备份腾出空间，再创建新备份（防止磁盘满时无法备份）
    backups = sorted(BACKUP_DIR.glob("prd.json.bak.*"), key=lambda p: p.stat().st_mtime)
    while len(backups) >= MAX_BACKUPS:
        oldest = backups.pop(0)
        try:
            oldest.unlink()
        except Exception:
            pass

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_name = f"prd.json.bak.{iteration:03d}.{timestamp}"
    backup_path = BACKUP_DIR / backup_name

    try:
        shutil.copy2(PRD_FILE, backup_path)
    except OSError as e:
        if hasattr(e, 'errno') and e.errno == 28:
            print(f"[FAIL] 磁盘空间不足，prd.json 备份失败: {e}")
        else:
            print(f"[WARN]  prd.json 备份失败: {e}")
    except Exception as e:
        print(f"[WARN]  prd.json 备份失败: {e}")


# ─────────────────────────────────────────────
# P0: 崩溃恢复 - Lock File 机制
# ─────────────────────────────────────────────
def is_pid_alive(pid: int) -> bool:
    """跨平台检测 PID 是否存活"""
    import platform
    if platform.system() == "Windows":
        try:
            result = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/NH"],
                capture_output=True, text=True, timeout=5
            )
            return str(pid) in result.stdout
        except Exception:
            return False
    else:
        try:
            os.kill(pid, 0)
            return True
        except (OSError, ProcessLookupError):
            return False


def write_lock(iteration: int, phase: str, story_id: str | None) -> None:
    """原子写入 lock file（temp + replace）"""
    lock_data = {
        "pid": os.getpid(),
        "iteration": iteration,
        "phase": phase,
        "story_id": story_id,
        "started_at": datetime.now().isoformat(),
        "created_at": time.time(),  # C2: Unix 时间戳，用于竞态检测
    }
    tmp_path = LOCK_FILE.with_suffix(".json.tmp")
    try:
        tmp_path.write_text(json.dumps(lock_data, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp_path.replace(LOCK_FILE)
    except Exception as e:
        print(f"[WARN]  写入 lock file 失败: {e}")
        tmp_path.unlink(missing_ok=True)


def read_lock() -> dict | None:
    """读取 lock file"""
    try:
        if LOCK_FILE.exists():
            return json.loads(LOCK_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return None


def clear_lock() -> None:
    """清除 lock file"""
    try:
        if LOCK_FILE.exists():
            LOCK_FILE.unlink()
    except Exception:
        pass


def check_crash_recovery() -> int:
    """
    检查是否有上次崩溃的遗留 lock file。
    返回值：应该从第几个 iteration 开始（1 = 从头开始）
    """
    lock = read_lock()
    if not lock:
        return 1

    old_pid = lock.get("pid", -1)
    old_iteration = lock.get("iteration", 1)
    old_phase = lock.get("phase", "unknown")
    old_story = lock.get("story_id", "unknown")
    old_time = lock.get("started_at", "unknown")

    # 如果旧进程还活着，说明已经有一个 ralph 在跑
    if is_pid_alive(old_pid) and old_pid != os.getpid():
        # C2: 竞态保护 — 如果 lock 创建不到 60 秒，信任 PID；
        # 超过 60 秒但 PID 存活可能是 PID 复用，给出警告但不阻断
        lock_age = time.time() - lock.get("created_at", 0)
        if lock_age < 60:
            print(f"[FAIL] 检测到另一个 Ralph 进程正在运行 (PID: {old_pid}, {int(lock_age)}s 前创建)")
            print(f"   如果确认无残留进程，请运行: python scripts/ralph/ralph-tools.py clear-lock")
            sys.exit(1)
        else:
            print(f"[WARN]  检测到旧 lock (PID: {old_pid}, {int(lock_age)}s 前创建)")
            print(f"   PID 仍存活但 lock 较旧，可能是 PID 复用。覆盖旧 lock 继续...")
            # 不退出，视为崩溃恢复

    # 旧进程已死 → 崩溃恢复
    print(f"\n{'='*64}")
    print(f"  [CYC] 检测到上次崩溃的遗留状态")
    print(f"     上次中断于: 迭代 {old_iteration}, 阶段: {old_phase}")
    print(f"     Story: {old_story}")
    print(f"     时间: {old_time}")
    print(f"{'='*64}")

    # 安全措施：developing/validating 阶段崩溃时，如果 story 的 passes=true 但验证未完成，
    # 必须重置为 false。但 waiting_audit 阶段不重置（story 已通过验证，只是等待审计）。
    if old_story and old_story != "unknown":
        prd = read_prd()
        if prd:
            s = get_story_by_id(prd, old_story)
            if s and s.get("passes", False) and old_phase != "waiting_audit":
                s["passes"] = False
                s["notes"] = (s.get("notes", "") + f"\n[崩溃恢复] {old_phase}阶段中断，passes 已重置为 false").strip()
                if write_prd_safe(prd):
                    print(f"  [WARN]  已重置 {old_story} passes → false（{old_phase}阶段崩溃，验证未完成）")

    if old_phase == "developing":
        print(f"  → 开发阶段中断，将从迭代 {old_iteration} 重试 {old_story}")
    elif old_phase == "validating":
        print(f"  → 验证阶段中断，将从迭代 {old_iteration} 重新开始")
    elif old_phase == "waiting_audit":
        gate = read_audit_gate()
        if gate and gate.get("status") == "approved":
            print(f"  → 审计已通过（崩溃前），清除门禁，继续下一个 Story")
            clear_audit_gate()
        elif gate and gate.get("status") == "rejected":
            print(f"  → 审计被驳回（崩溃前），将在主循环中处理")
        elif gate and gate.get("status") == "pending":
            print(f"  → 审计等待中断，将在主循环中恢复等待 {old_story}")
        else:
            # H1: audit-gate.json 不存在或损坏，但 phase 是 waiting_audit
            # story 已通过验证但审计信息丢失，重置 passes 让 Ralph 重新验证
            print(f"  → 审计门禁文件缺失/损坏，重置 {old_story} passes → false 以重新验证")
            if old_story and old_story != "unknown":
                _prd = read_prd()
                if _prd:
                    _s = get_story_by_id(_prd, old_story)
                    if _s and _s.get("passes", False):
                        _s["passes"] = False
                        _s["notes"] = (_s.get("notes", "") + "\n[崩溃恢复] waiting_audit 阶段中断且门禁文件缺失，passes 已重置").strip()
                        write_prd_safe(_prd)
    else:
        print(f"  → 未知阶段 ({old_phase})，将从迭代 {old_iteration} 重新开始")

    clear_lock()
    return old_iteration


# ─────────────────────────────────────────────
# P0: 成本追踪
# ─────────────────────────────────────────────
def log_cost(story_id: str | None, phase: str, duration_seconds: float,
             iteration: int) -> None:
    """
    记录每次 agent 调用的耗时到 cost-log.jsonl。
    注：Claude CLI --print 不输出 token 统计，此处记录可观测的维度（耗时、story、phase）。
    未来可通过捕获 stderr 或 API 日志补充 token 数据。
    """
    entry = {
        "timestamp": datetime.now().isoformat(),
        "iteration": iteration,
        "story_id": story_id,
        "phase": phase,
        "duration_seconds": round(duration_seconds, 1),
    }
    # M-4 (PRD-5 retro): per-PRD cost-log 防跨 PRD 污染
    cost_log_path = _get_cost_log_path()
    try:
        with open(cost_log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"[WARN]  成本日志写入失败: {e}")


def write_prd_metric(elapsed_seconds: float) -> None:
    """Coding 3.0 L3 进化:把本次 PRD 执行结果写入全局 metrics 文件供 /prime 跨 PRD 对比趋势。

    位置: ~/.claude/metrics/prd-success-rate.jsonl (每行一条记录)
    """
    try:
        prd = read_prd()
        if not prd:
            return
        stories = prd.get("userStories", [])
        total = len(stories)
        passed = sum(1 for s in stories if s.get("passes", False))
        blocked = sum(1 for s in stories if s.get("blocked", False))
        # 重试次数合计(Validator + Audit reject 累积)
        reject_count = sum(s.get("retryCount", 0) for s in stories)

        entry = {
            "timestamp": datetime.now().isoformat(),
            "project_root": str(PROJECT_ROOT),
            "branch": prd.get("branchName", "unknown"),
            "project": prd.get("project", "unknown"),
            "total": total,
            "passed": passed,
            "blocked": blocked,
            "reject_count": reject_count,
            "success_rate": round(passed / total, 3) if total > 0 else 0.0,
            "one_shot_rate": round((passed - sum(1 for s in stories if s.get("retryCount", 0) > 0)) / total, 3) if total > 0 else 0.0,
            "elapsed_seconds": round(elapsed_seconds, 1),
        }

        metrics_dir = Path.home() / ".claude" / "metrics"
        metrics_dir.mkdir(parents=True, exist_ok=True)
        metric_file = metrics_dir / "prd-success-rate.jsonl"
        with open(metric_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        print(f"  [TREND] PRD 指标已写入: {metric_file}")
    except Exception as e:
        print(f"[WARN]  PRD 指标写入失败 (不影响执行): {e}")


def check_audit_health(threshold: float = 0.2) -> None:
    """Coding 3.0 E-7: 退出时检查驳回率,超阈值打印警告"""
    prd = read_prd()
    if not prd:
        return
    stories = prd.get("userStories", [])
    if not stories:
        return
    total = len(stories)
    retried_pass = sum(1 for s in stories if s.get("passes") and s.get("retryCount", 0) > 0)
    blocked = sum(1 for s in stories if s.get("blocked"))
    reject_rate = (retried_pass + blocked) / total if total > 0 else 0.0
    if reject_rate > threshold:
        print(f"\n  [WARN]  审计健康度警告: 驳回率 {reject_rate*100:.1f}% > 阈值 {threshold*100:.0f}%")
        print(f"     详情: python scripts/ralph/ralph-tools.py audit-health")
        print(f"     建议: 运行 /prd-retro 做根因分析")


def print_next_step_hints(has_pass: bool) -> None:
    """Coding 3.0 自动化下一步提示 — 引导用户做 goal-verify 和 /prd-retro 跨 PRD 复盘"""
    print(f"\n{'─'*48}")
    print(f"  [GOAL] Coding 3.0 下一步建议")
    print(f"{'─'*48}")
    if has_pass:
        print(f"  Step 7: /goal-verify — 对比 PRD 与实际实现, 查 Tech Debt")
        print(f"  Step 8: /prd-retro   — 跨 PRD 复盘, 提炼可迁移 playbook")
        print(f"")
        print(f"  ℹ️  /prd-retro 会对比当前 PRD vs 上一个 PRD 成功率, 把新 patterns")
        print(f"     回传 progress.txt 给下一个 PRD 继承, 形成 L3 进化闭环")
    else:
        print(f"  所有 story BLOCKED, 建议先分析 prd.json 的 notes 找根因")
        print(f"  修复后运行: python scripts/ralph/ralph-tools.py reset <story-id>")
    print(f"{'─'*48}")
    check_audit_health()


def print_cost_summary() -> None:
    """打印成本摘要"""
    if not COST_LOG_FILE.exists():
        return

    try:
        entries = []
        for line in COST_LOG_FILE.read_text(encoding="utf-8").strip().split("\n"):
            if line.strip():
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue  # 跳过损坏的行

        if not entries:
            return

        total_dev = sum(e.get("duration_seconds", 0) for e in entries if e.get("phase") == "developing")
        total_val = sum(e.get("duration_seconds", 0) for e in entries if e.get("phase") == "validating")
        total = total_dev + total_val
        dev_count = sum(1 for e in entries if e.get("phase") == "developing")
        val_count = sum(1 for e in entries if e.get("phase") == "validating")

        print(f"\n{'─'*48}")
        print(f"  [STATS] 成本追踪摘要")
        print(f"{'─'*48}")
        print(f"  开发 Agent 调用: {dev_count} 次, 总耗时: {format_duration(total_dev)}")
        print(f"  验证 Agent 调用: {val_count} 次, 总耗时: {format_duration(total_val)}")
        print(f"  总计: {dev_count + val_count} 次调用, 总耗时: {format_duration(total)}")

        # 按 story 统计
        story_times: dict[str, float] = {}
        for e in entries:
            sid = e.get("story_id", "unknown")
            story_times[sid] = story_times.get(sid, 0) + e.get("duration_seconds", 0)

        if story_times:
            print(f"\n  按 Story 统计:")
            for sid, t in sorted(story_times.items()):
                print(f"    {sid}: {format_duration(t)}")
        print(f"{'─'*48}")

    except Exception as e:
        print(f"[WARN]  成本摘要生成失败: {e}")


# ─────────────────────────────────────────────
# P1: 级联失败处理
# ─────────────────────────────────────────────
def cascade_block_stories() -> None:
    """
    级联阻断：检查所有 pending story，如果其依赖已被 blocked 或不存在，将其也标记为 blocked。
    仅在依赖被永久 blocked 时触发阻断；依赖"未完成"不触发（等待依赖完成后自然满足）。
    在每次迭代开始时调用，确保 blocked 状态逐层传播。
    """
    prd = read_prd()
    if not prd:
        return

    any_modified = False
    # 循环直到收敛，处理多层级联（A→B→C）
    while True:
        modified = False
        for story in prd.get("userStories", []):
            if story.get("passes", False) or story.get("blocked", False):
                continue

            for dep_id in story.get("depends_on", []):
                dep_story = get_story_by_id(prd, dep_id)
                if not dep_story or dep_story.get("blocked", False):
                    story["blocked"] = True
                    dep_reason = "不存在" if not dep_story else "已 blocked"
                    existing_notes = story.get("notes", "").strip()
                    new_note = f"[级联阻断] 依赖 {dep_id} {dep_reason}"
                    story["notes"] = f"{existing_notes}\n{new_note}".strip() if existing_notes else new_note
                    modified = True
                    any_modified = True
                    print(f"  [BLOCK] {story.get('id')} 级联阻断: 依赖 {dep_id} {dep_reason}")
                    break
        if not modified:
            break

    if any_modified:
        if not write_prd_safe(prd):
            print(f"[WARN]  级联阻断更新 prd.json 失败")


# ─────────────────────────────────────────────
# P0: Audit Gate - 审计门禁
# ─────────────────────────────────────────────
def write_audit_gate(story_id: str) -> bool:
    """原子写入审计门禁文件，状态为 pending，等待 Opus 审查。返回是否写入成功。"""
    gate = {
        "story_id": story_id,
        "status": "pending",
        "timestamp": datetime.now().isoformat(),
    }
    tmp_path = AUDIT_GATE_FILE.with_suffix(".json.tmp")
    try:
        tmp_path.write_text(
            json.dumps(gate, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        tmp_path.replace(AUDIT_GATE_FILE)
    except Exception as e:
        print(f"[WARN]  写入审计门禁失败: {e}（跳过审计等待，直接继续）")
        tmp_path.unlink(missing_ok=True)
        return False

    # Coding 3.0 E-4: 输出特殊标记, 供 Opus 主对话的 Monitor 工具抓取自动唤醒.
    # 此行是 `tail -f ralph-output.log | grep "PENDING_DETECTED"` 的触发点.
    # 无需外部 watch-audit-gate.sh, ralph.py 内置即可.
    print(f"PENDING_DETECTED: {story_id} at {datetime.now().isoformat()}")

    print(f"\n{'─'*48}")
    print(f"  [LOCK] 审计门禁已激活: {story_id}")
    print(f"{'─'*48}")
    print(f"  等待 Opus 质量审查（4 维度）...")
    print(f"  Ralph 将每 {AUDIT_POLL_INTERVAL} 秒轮询一次，直到审计完成")
    print(f"")
    print(f"  审查通过后运行:")
    print(f"    python scripts/ralph/ralph-tools.py approve")
    print(f"  驳回（需重做）:")
    print(f"    python scripts/ralph/ralph-tools.py reject \"反馈内容\"")
    print(f"  查看状态:")
    print(f"    python scripts/ralph/ralph-tools.py audit-status")
    print(f"{'─'*48}")
    return True


def read_audit_gate() -> dict | None:
    """读取审计门禁文件，损坏时自动清除并警告"""
    try:
        if AUDIT_GATE_FILE.exists():
            return json.loads(AUDIT_GATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[WARN]  audit-gate.json 损坏 (JSONDecodeError: {e})，已清除")
        try:
            corrupted = AUDIT_GATE_FILE.with_suffix(".json.corrupted")
            shutil.copy2(AUDIT_GATE_FILE, corrupted)
            AUDIT_GATE_FILE.unlink()
        except Exception:
            pass
        return None
    except Exception:
        pass
    return None


def clear_audit_gate() -> None:
    """清除审计门禁文件"""
    try:
        if AUDIT_GATE_FILE.exists():
            AUDIT_GATE_FILE.unlink()
    except Exception:
        pass


def _check_existing_commit(story_id: str, since: str = "30 minutes ago") -> str | None:
    """TD-006 PATH-B: git log 查找 story_id 对应的已提交 commit.

    返回 7 位 commit hash 如果在 since 时间窗口内找到 [story_id] commit · 否则 None.
    since='30 minutes ago' 防跨 PRD 扫到上一 PRD 的残留 commit.
    """
    try:
        result = subprocess.run(
            ["git", "log", f"--since={since}", "--oneline"],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=str(PROJECT_ROOT),
        )
        if result.returncode != 0:
            return None
        pattern = re.compile(re.escape(f"[{story_id}]"))
        for line in result.stdout.splitlines():
            if pattern.search(line):
                parts = line.split(None, 1)
                if parts:
                    return parts[0]
        return None
    except Exception as e:
        print(f"  [WARN] _check_existing_commit 失败: {e}")
        return None


def _write_path_b_audit_gate(story_id: str, commit_hash: str) -> bool:
    """TD-006 PATH-B: 写入 audit-gate.json 触发 Opus 审查 (含 PATH-B 元数据).

    返回 True if 写入成功.
    """
    gate = {
        "story_id": story_id,
        "status": "pending",
        "commit_hash": commit_hash,
        "reason": "路径 B 自动触发: ralph 实际已 commit · daemon validate 误报",
        "timestamp": datetime.now().isoformat(),
    }
    tmp_path = AUDIT_GATE_FILE.with_suffix(".json.tmp")
    try:
        tmp_path.write_text(json.dumps(gate, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp_path.replace(AUDIT_GATE_FILE)
    except Exception as e:
        print(f"[WARN]  PATH-B audit-gate 写入失败: {e}")
        tmp_path.unlink(missing_ok=True)
        return False
    print(f"PENDING_DETECTED: {story_id} at {datetime.now().isoformat()}")
    print(f"\n{'─'*48}")
    print(f"  [PATH-B] 审计门禁已激活 (路径 B 自动触发): {story_id}")
    print(f"  commit: {commit_hash}")
    print(f"{'─'*48}")
    return True


def wait_for_audit(story_id: str, timeout: int | None = None) -> str:
    """
    轮询 audit-gate.json，等待 Opus 写入 approved 或 rejected。
    返回 "approved" 或 "rejected"。
    timeout 默认使用 AUDIT_TIMEOUT_SECONDS（3 小时）。
    RCA-006 修复(2026-05-15) · timeout 触发 raise AuditTimeoutError · daemon 必须退出
    audit-gate.json 保留 pending · 用户介入后重启 daemon 自动崩溃恢复
    """
    max_wait = timeout if timeout is not None else AUDIT_TIMEOUT_SECONDS
    poll_count = 0
    start = time.time()
    while True:
        gate = read_audit_gate()
        if gate and gate.get("story_id") == story_id:
            status = gate.get("status", "pending")
            if status == "approved":
                return "approved"
            elif status == "rejected":
                return "rejected"

        poll_count += 1
        elapsed = time.time() - start

        if poll_count % 10 == 0:  # 每 5 分钟提醒一次
            elapsed_min = int(elapsed // 60)
            remaining_min = max(0, int((max_wait - elapsed) // 60))
            print(f"  [WAIT] 已等待 {elapsed_min} 分钟，剩余 {remaining_min} 分钟超时 | 等待 Opus 审计 {story_id}...")

        # 超时保护:RCA-006(2026-05-15)修复 · 不再 silent skip · daemon 退出
        if elapsed >= max_wait:
            elapsed_min = int(elapsed // 60)
            print(f"  [CRITICAL] 审计门禁等待超时 ({elapsed_min} 分钟) · {story_id} 必须 manual review")
            print(f"             audit-gate.json 保留 pending · 用户介入选项:")
            print(f"             1. python scripts/ralph/ralph-tools.py approve · 重启 daemon 继续")
            print(f"             2. python scripts/ralph/ralph-tools.py reject \"反馈\" · 重启 daemon · retry")
            print(f"             3. python scripts/ralph/ralph-tools.py force-reject \"原因\" · 重启 daemon · 跳过深审")
            print(f"             4. python scripts/ralph/ralph-tools.py block {story_id} \"原因\" · 重启 daemon · 跳此 story")
            print(f"             详见 .agents/rca/RCA-006-audit-timeout-bypass.md")
            raise AuditTimeoutError(
                f"Audit timeout for {story_id} after {elapsed_min}min · "
                f"daemon must exit (RCA-006 zero-tolerance)"
            )

        time.sleep(AUDIT_POLL_INTERVAL)


def handle_audit_result(story_id: str) -> None:
    """处理审计结果：approved 继续，rejected 重置 story 状态，timeout 记录并继续"""
    gate = read_audit_gate()
    if not gate:
        return

    # 安全检查：确保 gate 中的 story_id 与预期一致
    gate_story = gate.get("story_id")
    if gate_story and gate_story != story_id:
        print(f"  [WARN]  审计门禁 story_id 不匹配: 预期 {story_id}, 实际 {gate_story}，清除过期门禁")
        clear_audit_gate()
        return

    status = gate.get("status", "pending")

    if status == "approved":
        print(f"  [OK] {story_id} 通过 Opus 质量审查")
        clear_audit_gate()

    elif status == "rejected":
        feedback = gate.get("feedback", "无具体反馈")
        print(f"  [FAIL] {story_id} 被 Opus 审计驳回")
        print(f"     反馈: {feedback}")

        # 重置 passes，写入反馈到 notes
        prd = read_prd()
        if prd:
            s = get_story_by_id(prd, story_id)
            if s:
                s["passes"] = False
                s["retryCount"] = s.get("retryCount", 0) + 1
                existing_notes = s.get("notes", "").strip()
                new_note = f"[Opus 审计驳回] {feedback}"
                s["notes"] = f"{existing_notes}\n{new_note}".strip() if existing_notes else new_note
                if write_prd_safe(prd):
                    print(f"     已重置 {story_id} passes → false，将在下一轮重新开发")
                else:
                    print(f"     [WARN]  重置 passes 失败")

        clear_audit_gate()

    # RCA-006(2026-05-15)修复 · status='pending' branch 删除 silent skip 逻辑
    # wait_for_audit 现在 raise AuditTimeoutError · main 流程 catch 后 sys.exit(2)
    # audit-gate.json 保留 pending · 用户介入后重启 daemon 自动崩溃恢复


# ─────────────────────────────────────────────
# P0: Tiered Context Injection - 构建动态 Prompt
# ─────────────────────────────────────────────
def build_developer_prompt(story_id: str | None) -> str:
    """
    构建开发 Agent 的 prompt：
    基础指令 + 当前 Story 上下文 + Codebase Patterns
    """
    base = CLAUDE_INSTRUCTION_FILE.read_text(encoding="utf-8")

    if not story_id:
        return base

    prd = read_prd()
    if not prd:
        return base

    story = get_story_by_id(prd, story_id)
    if not story:
        return base

    # 注入当前 story 的完整信息
    context_parts = [base]
    context_parts.append(f"\n\n## [LIST] 当前任务 Story（由编排器注入，无需自行从 prd.json 查找）\n")
    context_parts.append(f"- **Story ID**: {story.get('id')}")
    context_parts.append(f"- **Title**: {story.get('title')}")
    context_parts.append(f"- **Description**: {story.get('description')}")
    context_parts.append(f"- **Priority**: {story.get('priority')}")
    context_parts.append(f"- **Retry Count**: {story.get('retryCount', 0)}")

    criteria = story.get("acceptanceCriteria", [])
    if criteria:
        context_parts.append(f"- **Acceptance Criteria**:")
        for i, c in enumerate(criteria, 1):
            context_parts.append(f"  {i}. {c}")

    notes = story.get("notes", "")
    if notes:
        context_parts.append(f"\n### [WARN] 上次验证失败的反馈（优先阅读，针对性修复）：")
        context_parts.append(notes)

    # 注入 anti_patterns（2026-05-04 新增 — 反例库历史教训, 由 prd skill 从 ~/.claude/playbooks/reject-examples.jsonl 检索注入）
    anti_patterns = story.get("anti_patterns", [])
    if anti_patterns:
        context_parts.append(f"\n### [SHIELD] 历史反例 (anti_patterns) — 类似 story 的过往教训, 实现时主动避开:")
        for ap in anti_patterns[:5]:  # 上限 5 条防 prompt 过长
            if isinstance(ap, dict):
                lesson = ap.get("lesson", "")
                antipat = ap.get("antipattern", "")
                correct = ap.get("correct", "")
                src = f"(来自 {ap.get('source_prd', '?')} / {ap.get('source_story', '?')})"
                context_parts.append(f"- **教训** {src}: {lesson}")
                if antipat:
                    context_parts.append(f"  - 反例: `{antipat}`")
                if correct:
                    context_parts.append(f"  - 正确: `{correct}`")
            elif isinstance(ap, str):
                context_parts.append(f"- {ap}")

    # 注入 Codebase Patterns（如果 progress.txt 存在）
    if PROGRESS_FILE.exists():
        try:
            progress_text = PROGRESS_FILE.read_text(encoding="utf-8")
            # 提取 Codebase Patterns 段落
            if "## Codebase Patterns" in progress_text:
                pattern_start = progress_text.index("## Codebase Patterns")
                # 找下一个 ## 或文件结尾
                next_section = progress_text.find("\n## ", pattern_start + 1)
                if next_section == -1:
                    patterns = progress_text[pattern_start:]
                else:
                    patterns = progress_text[pattern_start:next_section]
                if patterns.strip():
                    context_parts.append(f"\n### [BOOK] Codebase Patterns（从历史迭代中学习到的模式）：")
                    context_parts.append(patterns.strip())
        except Exception:
            pass

    # 注入上游依赖 story 的 summary（如果有 depends_on）
    depends_on = story.get("depends_on", [])
    if depends_on:
        context_parts.append(f"\n### [LINK] 上游依赖 Stories（已完成，供参考）：")
        for dep_id in depends_on:
            dep_story = get_story_by_id(prd, dep_id)
            if dep_story and dep_story.get("passes", False):
                context_parts.append(f"- **{dep_id}**: {dep_story.get('title')} — [OK] 已完成")

    return "\n".join(context_parts)


def build_validator_prompt(story_id: str | None) -> str:
    """
    构建 Validator 的 prompt：
    基础指令 + 显式注入 story ID 和 acceptance criteria
    """
    base = VALIDATOR_INSTRUCTION_FILE.read_text(encoding="utf-8")

    if not story_id:
        return base

    prd = read_prd()
    if not prd:
        return base

    story = get_story_by_id(prd, story_id)
    if not story:
        return base

    # 显式注入 story 信息，Validator 无需从 progress.txt 猜测
    context_parts = [base]
    context_parts.append(f"\n\n## [LIST] 本次验证目标（由编排器注入）\n")
    context_parts.append(f"- **Story ID**: {story.get('id')}")
    context_parts.append(f"- **Title**: {story.get('title')}")
    context_parts.append(f"- **当前 retryCount**: {story.get('retryCount', 0)}")
    context_parts.append(f"- **Acceptance Criteria**:")
    for i, c in enumerate(story.get("acceptanceCriteria", []), 1):
        context_parts.append(f"  {i}. {c}")
    context_parts.append(f"\n[WARN] 注意：请直接验证以上 Story，不需要再从 progress.txt 推断 story ID。")

    return "\n".join(context_parts)


# ─────────────────────────────────────────────
# Agent 执行
# ─────────────────────────────────────────────
AGENT_LOG_DIR = SCRIPT_DIR / "agent-logs"


def run_agent(prompt: str, label: str, timeout: int) -> tuple[bool, int | None, float]:
    """
    通用 Agent 执行函数。
    返回 (是否超时, 进程退出码或None, 实际耗时秒数)
    - 正常完成: (False, 0, duration)
    - 非零退出: (False, code, duration)
    - 超时终止: (True, None, duration)
    - 启动异常: (False, None, duration)

    Prompt 通过 stdin 文件管道传递（解决 Windows CLI 参数长度限制 + 参数解析截断问题）。
    Agent 的 stdout/stderr 输出保存到 agent-logs/ 目录用于诊断。
    """
    cmd = build_process_cmd()

    # 为每次 agent 调用创建独立的日志文件和 prompt 文件
    AGENT_LOG_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    safe_label = label.replace(" ", "_")
    agent_log_path = AGENT_LOG_DIR / f"{ts}_{safe_label}.log"

    # 将 prompt 写入文件留存（用于调试），通过 subprocess.PIPE 传递给 agent
    # 注意：Windows 上 stdin=open(file) 无法正确传递给 .cmd 批处理包装器，
    # 必须用 subprocess.PIPE + 显式 write/close 来模拟 shell 管道行为
    prompt_file_path = AGENT_LOG_DIR / f"{ts}_{safe_label}_prompt.md"
    prompt_file_path.write_text(prompt, encoding="utf-8")
    print(f"  [NOTE] Prompt 已写入: {prompt_file_path} ({len(prompt)} 字符)")

    start_time = time.time()
    agent_log_file = None
    try:
        agent_log_file = open(agent_log_path, "w", encoding="utf-8")
        process = subprocess.Popen(
            cmd, cwd=str(PROJECT_ROOT),
            stdin=subprocess.PIPE,
            stdout=agent_log_file, stderr=subprocess.STDOUT,
        )
        # C5: 使用线程写入 stdin 防止大 prompt 阻塞管道
        import threading
        def _write_stdin():
            try:
                process.stdin.write(prompt.encode("utf-8"))
                process.stdin.close()
            except Exception as e:
                print(f"  [WARN]  写入 prompt 到 stdin 失败: {e}")
        stdin_thread = threading.Thread(target=_write_stdin, daemon=True)
        stdin_thread.start()

        # 等待 stdin 写入完成（防止大 prompt 未完全传递）
        stdin_thread.join(timeout=30)

        last_log_size = 0  # M5: 跟踪日志大小，检测 agent 无输出
        no_output_warned = False

        while True:
            ret_code = process.poll()
            if ret_code is not None:
                elapsed = time.time() - start_time
                agent_log_file.close()
                agent_log_file = None
                # 读取日志尾部用于诊断
                try:
                    log_tail = agent_log_path.read_text(encoding="utf-8", errors="replace")[-500:]
                except Exception:
                    log_tail = ""
                if ret_code != 0:
                    print(f"\n[WARN]  {label}非零退出码: {ret_code} (耗时: {format_duration(elapsed)})")
                    if log_tail:
                        print(f"   日志尾部: ...{log_tail[-200:]}")
                else:
                    print(f"\n[OK] {label}完成 (耗时: {format_duration(elapsed)})")
                    # 如果完成太快（< 30s），输出警告 — 可能 agent 没有实际工作
                    if elapsed < 30:
                        print(f"   [WARN]  耗时异常短（{int(elapsed)}s），agent 可能未正常执行")
                        if log_tail:
                            print(f"   日志尾部: ...{log_tail[-300:]}")
                print(f"   详细日志: {agent_log_path}")
                return False, ret_code, elapsed

            elapsed = time.time() - start_time
            if elapsed > timeout:
                print(f"\n[WARN]  {label}超时! 已运行 {int(elapsed)} 秒")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
                print(f"   进程已终止, 日志: {agent_log_path}")
                return True, None, elapsed

            # M5: 检测 agent 长时间无输出
            try:
                current_log_size = agent_log_path.stat().st_size
                if current_log_size == last_log_size and elapsed > 300 and not no_output_warned:
                    print(f"  [WARN]  Agent 已 5 分钟无新输出 (日志: {current_log_size} bytes)")
                    no_output_warned = True
                elif current_log_size != last_log_size:
                    last_log_size = current_log_size
                    no_output_warned = False
            except Exception:
                pass

            time.sleep(5)  # 5 秒轮询

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n[FAIL] {label}错误: {e}")
        return False, None, elapsed
    finally:
        # M6: 确保日志文件句柄始终被关闭
        if agent_log_file is not None:
            try:
                agent_log_file.close()
            except Exception:
                pass


def _append_progress_marker(text: str) -> None:
    """追加结构化进度标记到 progress.txt"""
    try:
        with open(PROGRESS_FILE, "a", encoding="utf-8") as f:
            f.write(f"\n{text}\n")
    except Exception:
        pass


def _truncate_progress_file() -> None:
    """H4: 如果 progress.txt 超过 MAX_PROGRESS_BYTES，截断保留后半部分。

    Coding 3.0 升级:优先保留 `## Codebase Patterns` 段(跨 PRD 知识,25% 成功率提升归因),
    剩余 budget 用于保留日志尾部。旧 progress.txt 无该段时回退到原逻辑。
    """
    try:
        if not PROGRESS_FILE.exists():
            return
        size = PROGRESS_FILE.stat().st_size
        if size <= MAX_PROGRESS_BYTES:
            return
        content = PROGRESS_FILE.read_text(encoding="utf-8", errors="replace")

        # 提取 Codebase Patterns 段(从 "## Codebase Patterns" 到下一个 "## " 前)
        patterns_segment = ""
        pat_start = content.find("## Codebase Patterns")
        if pat_start >= 0:
            next_section = content.find("\n## ", pat_start + 1)
            end = next_section if next_section > 0 else len(content)
            patterns_segment = content[pat_start:end].rstrip()

        # Patterns 段以外的内容(合并前后两段)
        if pat_start >= 0:
            other = content[:pat_start] + content[pat_start + len(patterns_segment):]
        else:
            other = content

        # 剩余 budget(扣除 patterns 和 header 预留)
        budget = MAX_PROGRESS_BYTES - len(patterns_segment) - 200

        if budget <= 0:
            # 极端情况:patterns 段本身已超限,只保留它
            header = f"[progress.txt 已截断: 原 {size} bytes,仅保留 Codebase Patterns]\n\n"
            PROGRESS_FILE.write_text(header + patterns_segment + "\n", encoding="utf-8")
            return

        # 保留 other 的尾部
        keep = other[-budget:] if len(other) > budget else other
        # 从最近换行符开始,避免截断半行
        first_newline = keep.find("\n")
        if first_newline > 0 and len(other) > budget:
            keep = keep[first_newline + 1:]

        if patterns_segment:
            header = f"[progress.txt 已截断: 原 {size} bytes → ~{len(patterns_segment) + len(keep)} bytes, Codebase Patterns 已保留]\n\n"
            new_content = header + patterns_segment + "\n\n" + keep
        else:
            # 旧文件无 Patterns 段,回退到原逻辑
            header = f"[progress.txt 已截断: 原 {size} bytes → {len(keep)} bytes]\n\n"
            new_content = header + keep
        PROGRESS_FILE.write_text(new_content, encoding="utf-8")
    except Exception:
        pass


def run_developer(iteration: int, story_id: str | None) -> tuple[bool, bool]:
    """调用开发 Agent，返回 (是否超时, 是否崩溃)"""
    print(f"\n{'='*64}\n  迭代 {iteration}/{MAX_ITERATIONS} | Story: {story_id or 'N/A'}\n{'='*64}")

    if not CLAUDE_INSTRUCTION_FILE.exists():
        print(f"[FAIL] 错误: {CLAUDE_INSTRUCTION_FILE} 不存在")
        return False, True

    # M-2 (PRD-5 RCA-003) + PRD-15 retro M-3 (QuanQn 2026-05-16 · cold start race fix):
    #   旧: 2 次 fail 即 crashed=True 累 retryCount → cold start 偶撞 5 次 BLOCKED bug
    #   新: 3 次 retry · 累计 wait ~210s · 真 hang(>5 min)才累 retryCount · 类比 _is_network_error 路径
    if not _check_claude_health():
        print(f"[WARN] claude CLI health check 失败 (1/3) · sleep 90s 等 cold start cache 暖")
        time.sleep(90)
        if not _check_claude_health():
            print(f"[WARN] claude CLI health check 失败 (2/3) · sleep 120s 最后重试 (cold start race 通常 2-3 min 自愈)")
            time.sleep(120)
            if not _check_claude_health():
                print(f"[FAIL] claude CLI 3 次 health check 全失败 (累计 wait 210s) · 真 hang · 标记 crashed")
                return False, True  # crashed=True · 真 hang 才累 retryCount · 不是 cold start race

    # TD-009 (PRD-5 retro): 网络故障不算 retryCount · exponential backoff · max 3 次内重试
    timed_out = False
    exit_code: int | None = None
    duration = 0.0
    for net_attempt in range(3):
        prompt = build_developer_prompt(story_id)
        timed_out, exit_code, duration = run_agent(prompt, "开发迭代", TIMEOUT_SECONDS)
        log_cost(story_id, "developing", duration, iteration)
        crashed = (not timed_out and exit_code is not None and exit_code != 0)
        if crashed and net_attempt < 2 and _is_network_error("开发迭代"):
            wait = min(2 ** net_attempt * 30, 120)  # 30s · 60s · 120s
            print(f"  [NET-ERR] 检测到网络故障 (ECONNRESET/503/ETIMEDOUT) · sleep {wait}s · 不算 retryCount · attempt {net_attempt+2}/3")
            time.sleep(wait)
            continue
        break
    crashed = (not timed_out and exit_code is not None and exit_code != 0)
    if crashed:
        print(f"  [WARN]  开发 Agent 异常退出 (code={exit_code})，跳过本轮验证")
    return timed_out, crashed


def run_validator(iteration: int, story_id: str | None) -> None:
    """调用 Validator Agent"""
    print(f"\n{'='*64}\n  验证迭代 {iteration} | Story: {story_id or 'N/A'}\n{'='*64}")

    if not VALIDATOR_INSTRUCTION_FILE.exists():
        print(f"[WARN]  警告: {VALIDATOR_INSTRUCTION_FILE} 不存在，跳过验证")
        return

    # M-2 (PRD-5 RCA-003) + PRD-15 retro M-3 (QuanQn 2026-05-16 · cold start race fix):
    #   旧: 2 次 fail skip validation · 但 main 路径 validator_failed → 累 retryCount
    #   新: 3 次 retry · 累计 wait ~210s · 真 hang 才 skip · 类比 _is_network_error 路径
    if not _check_claude_health():
        print(f"[WARN] claude CLI health check 失败 (1/3) · sleep 90s 等 cold start cache 暖")
        time.sleep(90)
        if not _check_claude_health():
            print(f"[WARN] claude CLI health check 失败 (2/3) · sleep 120s 最后重试")
            time.sleep(120)
            if not _check_claude_health():
                print(f"[FAIL] claude CLI 3 次 health check 全失败 (累计 wait 210s) · 跳过本轮 validation")
                return

    # TD-009 (PRD-5 retro): 网络故障不算 retryCount · max 3 次重试
    duration = 0.0
    for net_attempt in range(3):
        prompt = build_validator_prompt(story_id)
        timed_out, exit_code, duration = run_agent(prompt, "验证", VALIDATOR_TIMEOUT_SECONDS)
        crashed = (not timed_out and exit_code is not None and exit_code != 0)
        if crashed and net_attempt < 2 and _is_network_error("验证"):
            wait = min(2 ** net_attempt * 30, 120)
            print(f"  [NET-ERR] Validator 检测到网络故障 · sleep {wait}s · 不算 retryCount · attempt {net_attempt+2}/3")
            time.sleep(wait)
            continue
        break
    log_cost(story_id, "validating", duration, iteration)

    # 安全措施：Validator 未正常完成时（超时 / 非零退出 / 启动异常），不能信任 passes 状态
    # 同时递增 retryCount，防止 Validator 持续失败导致无限循环
    validator_failed = timed_out or exit_code is None or exit_code != 0

    # PRD-14 retro M-2 (2026-05-15) · Validator 撞 Anthropic rate limit 检测
    # 不算 ralph 错 · 是 infra block · daemon 退出 + 触发 Step 4.5 路径(Opus 直审 commit)
    if validator_failed and exit_code == 1:
        try:
            output_log = SCRIPT_DIR / "ralph-output.log"
            if output_log.exists():
                tail = output_log.read_text(encoding='utf-8', errors='ignore')[-5000:]
                if _detect_rate_limit_in_validator_output(tail):
                    print(f"  [RATE-LIMIT] Validator 撞 Anthropic rate limit · 触发 Step 4.5 路径")
                    print(f"  daemon 退出 · 不累加 retryCount(rate limit 是 infra block · 非 ralph 错)")
                    print(f"  用户介入选项:")
                    print(f"  1. Opus 走 OPUS-AUDIT-CHEATSHEET 5 步深审 commit · 手 patch prd.json passes=true")
                    print(f"  2. 等 rate limit reset 后重启 daemon · ralph 重新 dev")
                    print(f"  3. force-reject + 重启 daemon · ralph retry(等 reset 后)")
                    raise RateLimitDetected(f"Validator hit Anthropic rate limit for {story_id}")
        except RateLimitDetected:
            raise
        except Exception as e:
            print(f"  [WARN] rate limit 检测异常: {e} · 继续 normal validator failed flow")

    if validator_failed:
        if timed_out:
            reason = "超时"
        elif exit_code is None:
            reason = "启动失败"
        else:
            reason = f"异常退出(code={exit_code})"
        print(f"   Validator {reason}，检查 passes 状态")
        prd = read_prd()
        if prd:
            s = get_story_by_id(prd, story_id) if story_id else None
            if s:
                if s.get("passes", False):
                    s["passes"] = False
                s["retryCount"] = s.get("retryCount", 0) + 1
                existing = s.get("notes", "").strip()
                note = f"[Validator {reason}] 验证未完成，passes 重置，retryCount +1"
                s["notes"] = f"{existing}\n{note}".strip() if existing else note
                if write_prd_safe(prd):
                    print(f"   已重置 {story_id} passes → false, retryCount → {s['retryCount']}（Validator {reason}）")
                else:
                    print(f"   [WARN]  write_prd_safe 失败，retryCount 未持久化")


# ─────────────────────────────────────────────
# 工具函数
# ─────────────────────────────────────────────
def format_duration(seconds: float) -> str:
    """将秒数格式化为易读的时间字符串"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}小时 {m}分钟 {s}秒"
    elif m > 0:
        return f"{m}分钟 {s}秒"
    else:
        return f"{s}秒"


LOG_FILE = SCRIPT_DIR / "ralph-output.log"
LOG_MAX_BYTES = 50 * 1024 * 1024   # ralph-output.log 最大 50MB，超出时轮转


class _TeeWriter:
    """同时写 stdout 和日志文件，任一端断裂不影响另一端"""

    def __init__(self, original_stdout):
        self._stdout = original_stdout
        self._log = None
        try:
            self._log = open(LOG_FILE, "a", encoding="utf-8")
        except Exception:
            pass

    def rotate_if_needed(self):
        """日志文件超过阈值时轮转：当前文件 → .bak，重新打开新文件"""
        try:
            if not LOG_FILE.exists():
                return
            if LOG_FILE.stat().st_size < LOG_MAX_BYTES:
                return
            # 关闭当前句柄
            if self._log:
                self._log.close()
                self._log = None
            # 轮转：覆盖旧 .bak
            bak = LOG_FILE.with_suffix(".log.bak")
            try:
                LOG_FILE.replace(bak)
            except OSError:
                # Windows 上可能因句柄残留失败 → 截断代替轮转
                LOG_FILE.write_bytes(b"")
            # 重新打开
            self._log = open(LOG_FILE, "a", encoding="utf-8")
        except Exception:
            pass

    def write(self, data):
        # 写日志文件（始终可靠）
        if self._log:
            try:
                self._log.write(data)
                self._log.flush()
            except Exception:
                pass
        # 写原始 stdout（管道断裂时静默忽略）
        if self._stdout:
            try:
                self._stdout.write(data)
                self._stdout.flush()
            except (BrokenPipeError, OSError):
                self._stdout = None  # 管道已断，后续不再尝试

    def flush(self):
        if self._log:
            try:
                self._log.flush()
            except Exception:
                pass
        if self._stdout:
            try:
                self._stdout.flush()
            except (BrokenPipeError, OSError):
                self._stdout = None

    def close(self):
        if self._log:
            try:
                self._log.close()
            except Exception:
                pass


# ─────────────────────────────────────────────
# Daemon 模式：自守护进程（跨平台）
# ─────────────────────────────────────────────
def _daemon_relaunch():
    """
    --daemon 模式：以独立进程重新启动自身（去掉 --daemon 参数），
    确保 Ralph 不会因父 shell 退出而被杀掉。
    - Windows: CREATE_NEW_PROCESS_GROUP | DETACHED_PROCESS
    - Unix: start_new_session=True (等效于 setsid)
    """
    import platform

    # 构建子进程参数：去掉 --daemon，保留其他所有参数
    child_args = [sys.executable, str(Path(__file__).resolve())]
    child_args += [a for a in sys.argv[1:] if a != "--daemon"]

    try:
        log_handle = open(LOG_FILE, "a", encoding="utf-8")
    except OSError as e:
        print(f"[FAIL] 无法打开日志文件 {LOG_FILE}: {e}")
        print("  可能被其他进程锁定。请检查是否有另一个 Ralph 实例正在运行。")
        sys.exit(1)

    if platform.system() == "Windows":
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        proc = subprocess.Popen(
            child_args,
            cwd=str(PROJECT_ROOT),
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
        )
    else:
        proc = subprocess.Popen(
            child_args,
            cwd=str(PROJECT_ROOT),
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            start_new_session=True,
        )

    # 父进程 Popen 后立即关闭文件句柄（子进程已继承，父进程不再需要）
    # Windows 上不关闭会导致文件锁定，阻止日志轮转
    log_handle.close()

    print(f"Ralph 已在后台启动 (PID: {proc.pid})")
    print(f"  日志: {LOG_FILE}")
    print(f"  进度: python scripts/ralph/ralph-tools.py status")

    # 2026-05-04: 自动 fork watch-audit-gate.py 子进程,
    # 系统通知 audit pending → 不再依赖用户记得跑 /monitor-ralph (PRD-3 US-001 教训)
    _spawn_watch_audit_gate()

    # TD-095(2026-05-20): 自动 fork pnpm dev 子进程, 供 Validator e2e/browse 使用
    # 父进程(--daemon)调用后 sys.exit(0), 所以在父进程注册 _spawn_dev_server 并无意义
    # 实际在子进程(去掉 --daemon 后启动的真正 ralph 主进程)里调用 — 见 main() 入口
    # 这里仅打印提示, 让用户知道 dev server 会被管理
    dev_flag = "--with-dev-server" if WITH_DEV_SERVER else "--no-dev-server"
    print(f"  dev-server: {'auto-fork pnpm dev (可用 --no-dev-server 禁用)' if WITH_DEV_SERVER else '已禁用 (--no-dev-server)'}")

    print(f"  停止: taskkill /PID {proc.pid} /T /F" if platform.system() == "Windows"
          else f"  停止: kill {proc.pid}")
    sys.exit(0)


def _spawn_watch_audit_gate() -> None:
    """2026-05-04 新增: ralph.py daemon 启动时自动起 watch-audit-gate.py 子进程,
    监测 audit-gate.json pending 时通过系统通知唤醒用户/Opus,
    消除 Monitor session-only 的"忘记重跑"高频痛点 (PRD-3 US-001 53 分钟空转教训).

    优先项目本地 watch (sync 过来), fallback 全局 (~/.claude/scripts/ralph/).
    detached 子进程, 不阻塞 ralph.py.
    """
    import platform as _plat
    project_watch = SCRIPT_DIR / "watch-audit-gate.py"
    global_watch = Path.home() / ".claude" / "scripts" / "ralph" / "watch-audit-gate.py"
    watch_script = project_watch if project_watch.exists() else global_watch

    if not watch_script.exists():
        print(f"  [WARN] watch-audit-gate.py 未找到, 跳过自动监测启动")
        return

    cmd = [sys.executable, str(watch_script), str(PROJECT_ROOT), "15", "--daemon"]
    try:
        # watch --daemon 自身会 fork detached, 这里 wait() 取它的退出码 (它 fork 后 exit(0))
        result = subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            timeout=10,
        )
        if result.returncode == 0:
            print(f"  watch-audit-gate 已自动启动 (系统通知 audit pending 事件)")
        else:
            # watch 拿不到 lock (已有进程) → 友好提示, 不报错
            print(f"  [INFO] watch-audit-gate 未启动新实例 (可能已有同项目监测进程)")
    except Exception as e:
        print(f"  [WARN] watch-audit-gate 启动失败 (不影响 Ralph): {e}")


def _spawn_dev_server() -> None:
    """TD-095(2026-05-20): daemon 启动时 fork pnpm dev 子进程.
    - detached: 不随 ralph 父进程退出
    - pid 写 dev-server.pid
    - output redirect dev-server.log
    - atexit: daemon 退出时 SIGTERM dev server
    - 仅当 WITH_DEV_SERVER=True 且未检测到已有 dev server 时启动
    """
    import platform as _plat

    if not WITH_DEV_SERVER:
        return

    # 检查端口 5173 (vite 默认) 是否已占用 — 复用已有 dev server
    import socket
    try:
        with socket.create_connection(("localhost", 5173), timeout=2):
            print("  [dev-server] 已检测到 localhost:5173 就绪 · 复用现有实例")
            return
    except OSError:
        pass  # 未启动 → 继续 fork

    # 查找 pnpm 可执行文件
    pnpm_candidates = ["pnpm", "pnpm.cmd", "pnpm.exe"]
    pnpm_bin = shutil.which("pnpm") or next(
        (shutil.which(c) for c in pnpm_candidates if shutil.which(c)), None
    )
    if pnpm_bin is None:
        print("  [WARN] pnpm not found · skip dev server fork (TD-095)")
        return

    try:
        log_handle = open(DEV_SERVER_LOG_FILE, "a", encoding="utf-8")
    except OSError as e:
        print(f"  [WARN] 无法打开 dev-server.log: {e}")
        return

    # fork apps/web dev server
    web_dir = PROJECT_ROOT / "apps" / "web"
    if not web_dir.exists():
        log_handle.close()
        print("  [WARN] apps/web 不存在 · skip dev server fork")
        return

    cmd = [pnpm_bin, "dev"]
    try:
        if _plat.system() == "Windows":
            DETACHED_PROCESS = 0x00000008
            CREATE_NEW_PROCESS_GROUP = 0x00000200
            proc = subprocess.Popen(
                cmd,
                cwd=str(web_dir),
                stdout=log_handle,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
            )
        else:
            proc = subprocess.Popen(
                cmd,
                cwd=str(web_dir),
                stdout=log_handle,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                start_new_session=True,
            )
        log_handle.close()

        # 写 pid 文件
        DEV_SERVER_PID_FILE.write_text(str(proc.pid), encoding="utf-8")
        print(f"  [dev-server] pnpm dev 已启动 (PID: {proc.pid} · log: {DEV_SERVER_LOG_FILE})")

        # atexit: daemon 退出时 SIGTERM dev server
        def _stop_dev_server():
            try:
                pid = int(DEV_SERVER_PID_FILE.read_text(encoding="utf-8").strip())
                import signal as _sig
                if _plat.system() == "Windows":
                    subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"],
                                   capture_output=True)
                else:
                    os.kill(pid, _sig.SIGTERM)
                DEV_SERVER_PID_FILE.unlink(missing_ok=True)
                print(f"  [dev-server] SIGTERM sent (PID: {pid})")
            except Exception:
                pass  # best-effort — don't block daemon exit

        atexit.register(_stop_dev_server)

    except Exception as e:
        log_handle.close()
        print(f"  [WARN] dev server fork 失败 (不影响 Ralph): {e}")


# ─────────────────────────────────────────────
# 主循环
# ─────────────────────────────────────────────
def main():
    """主函数"""
    # --daemon 模式：以独立进程重启自身后退出，确保进程不随父 shell 死亡
    if DAEMON_MODE:
        _daemon_relaunch()
        return  # unreachable, _daemon_relaunch calls sys.exit(0)

    # 前置检查：Claude CLI 是否存在 (Windows 上尝试 claude.exe / claude.cmd / claude)
    cli_name = _find_claude_cli()
    if cli_name is None:
        print("[FAIL] 错误: 未找到 'claude' 命令(尝试 claude.exe / claude.cmd / claude 均失败)")
        print("  安装指南: https://docs.anthropic.com/en/docs/claude-code")
        sys.exit(1)
    print(f"[OK] Claude CLI: {cli_name}")

    # 管道断裂防护：stdout 同时写屏幕和日志文件，管道断了也不影响执行
    tee = _TeeWriter(sys.stdout)
    sys.stdout = tee
    sys.stderr = _TeeWriter(sys.stderr)

    print(f"启动 Ralph v2 - 最大迭代次数: {MAX_ITERATIONS}")
    audit_label = "启用" if not NO_AUDIT_GATE else "禁用(--no-audit-gate)"
    dev_label = "启用" if WITH_DEV_SERVER else "禁用(--no-dev-server)"
    print(f"  Agent: {AGENT} | Model: {MODEL} | 开发超时: {TIMEOUT_SECONDS//60}min | 验证超时: {VALIDATOR_TIMEOUT_SECONDS//60}min | 审计门禁: {audit_label} | dev-server: {dev_label}")

    # TD-095(2026-05-20): 自动 fork pnpm dev 子进程, 供 Validator e2e/browse 使用
    _spawn_dev_server()

    # 崩溃恢复检查
    start_iteration = check_crash_recovery()

    # 注册退出时清理 lock file + 关闭日志文件句柄
    atexit.register(clear_lock)
    atexit.register(lambda: tee.close())
    stderr_tee = sys.stderr
    atexit.register(lambda: stderr_tee.close() if hasattr(stderr_tee, 'close') else None)

    total_start_time = time.time()
    dashboard.start(max_iterations=MAX_ITERATIONS)

    for i in range(start_iteration, MAX_ITERATIONS + 1):
        try:
            # P-1: 日志轮转检查（每轮迭代开始时）
            if hasattr(sys.stdout, 'rotate_if_needed'):
                sys.stdout.rotate_if_needed()

            # P0: 审计门禁恢复检查（崩溃后重启时，若有未完成的审计则继续等待）
            if not NO_AUDIT_GATE:
                gate = read_audit_gate()
                if gate and gate.get("status") == "pending":
                    pending_story = gate.get("story_id", "?")
                    # 检查该 story 是否已被外部标记为 blocked/完成 → 过期门禁，直接清除
                    _prd = read_prd()
                    _gs = get_story_by_id(_prd, pending_story) if _prd else None
                    if _gs and _gs.get("blocked", False):
                        print(f"  [WARN]  审计门禁 {pending_story} 对应 story 已 blocked，清除过期门禁")
                        clear_audit_gate()
                    else:
                        print(f"\n  [LOCK] 检测到未完成的审计门禁: {pending_story}，恢复等待...")
                        write_lock(i, "waiting_audit", pending_story)
                        dashboard.set_state(phase="waiting_audit")
                        try:
                            wait_for_audit(pending_story)
                            handle_audit_result(pending_story)
                        except AuditTimeoutError as e:
                            # RCA-006(2026-05-15) · audit timeout · daemon 退出
                            print(f"\n[DAEMON EXIT] {e}")
                            print(f"  audit-gate.json 保留 pending · 用户介入后重启 daemon 自动崩溃恢复")
                            try:
                                with open(PROGRESS_FILE, 'a', encoding='utf-8') as f:
                                    from datetime import datetime as _dt
                                    f.write(f"\n## {_dt.now().strftime('%Y-%m-%d %H:%M')} - {pending_story} · [RCA-006 DAEMON EXIT]\n")
                                    f.write(f"- audit timeout(崩溃恢复时触发) · daemon 已退出\n")
                                    f.write(f"- 详见 .agents/rca/RCA-006-audit-timeout-bypass.md\n---\n\n")
                            except Exception:
                                pass
                            sys.exit(2)
                elif gate and gate.get("status") in ("approved", "rejected"):
                    pending_story = gate.get("story_id", "?")
                    handle_audit_result(pending_story)

            # P0: 备份 prd.json
            backup_prd(i)

            # P1: 级联阻断传播（依赖已 blocked 的 story 自动 blocked）
            cascade_block_stories()

            # 获取当前 story（已检查依赖是否满足）
            current_story = get_current_story_id()

            if current_story is None:
                # 没有待执行的 story 了
                if all_stories_resolved():
                    dashboard.set_state(phase="done")
                    elapsed = time.time() - total_start_time
                    has_pass = any_story_passed()
                    # M-1 (PRD-5 RCA-003 教训): BLOCKED 必须写 audit-gate · 不静默 exit
                    blocked_attn = _write_blocked_audit_gate(has_pass)
                    if has_pass and blocked_attn:
                        print("[OK] 部分 PASSED + 部分 BLOCKED · audit-gate(needs_attention) 写入 · 等用户决策")
                    elif has_pass:
                        print("[OK] 所有任务已完成 · 全部 PASSED")
                    else:
                        print("[BLOCK] 所有任务均已 BLOCKED，无一通过!")
                    print(f"[TIME]  总运行时间: {format_duration(elapsed)}")
                    print_cost_summary()
                    print_next_step_hints(has_pass)
                    clear_lock()
                    # 有 BLOCKED 时 exit 2 即使 has_pass · 让 CI 能 catch
                    sys.exit(0 if (has_pass and not blocked_attn) else 2)
                else:
                    # 诊断：可能是依赖循环或依赖了不存在的 story
                    prd_diag = read_prd()
                    stuck = []
                    if prd_diag:
                        for st in prd_diag.get("userStories", []):
                            if not st.get("passes", False) and not st.get("blocked", False):
                                stuck.append(st.get("id", "?"))
                    print(f"[WARN]  未找到可执行的 story，但仍有 {len(stuck)} 个未完成: {', '.join(stuck)}")
                    print("  可能原因：依赖循环或依赖了不存在的 story ID，请检查 prd.json 的 depends_on 字段")
                    break

            # P2: 确定性 MAX_RETRIES 兜底（不依赖 LLM Validator 的判断）
            prd_check = read_prd()
            if prd_check and current_story:
                s_check = get_story_by_id(prd_check, current_story)
                if s_check and s_check.get("retryCount", 0) >= MAX_RETRIES and not s_check.get("blocked", False):
                    # TD-006 PATH-B: 先检查 git log 是否已有该 story 的 commit
                    # PRD-25 retro M-1 升级(2026-05-20) · since 窗口 30min → 2h · 防 5 retry × 17min hang 累计超窗漏检 · US-008 实证 47 min commit-to-block 时差
                    existing_notes = s_check.get("notes", "") or ""
                    path_b_tried = "[PATH-B]" in existing_notes
                    commit_hash = _check_existing_commit(current_story, since="2 hours ago") if not path_b_tried else None
                    if commit_hash:
                        print(f"  [PATH-B] story={current_story} retry={s_check.get('retryCount', 0)} git_log_hit={commit_hash} · 自动 audit-gate(pending)")
                        # 设 passes=True: 代码已提交, 让 Opus 审查判断质量
                        s_check["passes"] = True
                        path_b_note = f"[PATH-B] commit={commit_hash} 自动触发 Opus 审查"
                        s_check["notes"] = f"{existing_notes}\n{path_b_note}".strip() if existing_notes else path_b_note
                        write_prd_safe(prd_check)
                        if not NO_AUDIT_GATE and _write_path_b_audit_gate(current_story, commit_hash):
                            write_lock(i, "waiting_audit", current_story)
                            dashboard.set_state(phase="waiting_audit")
                            try:
                                wait_for_audit(current_story)
                                handle_audit_result(current_story)
                            except AuditTimeoutError as e:
                                # RCA-006(2026-05-15) · PATH-B audit timeout · daemon 退出
                                print(f"\n[DAEMON EXIT] {e}")
                                print(f"  audit-gate.json 保留 pending · 用户介入后重启 daemon 自动崩溃恢复")
                                try:
                                    with open(PROGRESS_FILE, 'a', encoding='utf-8') as f:
                                        from datetime import datetime as _dt
                                        f.write(f"\n## {_dt.now().strftime('%Y-%m-%d %H:%M')} - {current_story} · [RCA-006 DAEMON EXIT · PATH-B]\n")
                                        f.write(f"- audit timeout(PATH-B 触发) · daemon 已退出\n")
                                        f.write(f"- 详见 .agents/rca/RCA-006-audit-timeout-bypass.md\n---\n\n")
                                except Exception:
                                    pass
                                sys.exit(2)
                        continue
                    # PATH-B 未命中 (无 commit 或已尝试过 PATH-B) → 原有 BLOCKED 行为
                    s_check["blocked"] = True
                    existing = s_check.get("notes", "").strip()
                    block_note = f"[编排器兜底] retryCount={s_check['retryCount']} >= MAX_RETRIES={MAX_RETRIES}，自动标记 blocked"
                    s_check["notes"] = f"{existing}\n{block_note}".strip() if existing else block_note
                    write_prd_safe(prd_check)
                    print(f"  [BLOCK] {current_story} 已达到最大重试次数 ({MAX_RETRIES})，自动标记 blocked")
                    cascade_block_stories()
                    continue

            # H3: 结构化进度标记 — iteration 开始
            iter_start = time.time()
            _append_progress_marker(f"--- [RALPH] Iteration {i} started: {current_story} at {datetime.now().strftime('%Y-%m-%d %H:%M')} ---")

            # ─── 第一步：开发 ───
            write_lock(i, "developing", current_story)
            dashboard.set_state(iteration=i, phase="developing", current_story=current_story)
            timed_out, crashed = run_developer(i, current_story)

            # RCA-006 (2026-05-12 · QuanQn PRD-9 US-002) · 跨 PRD-4/8/9 3 次同模式: dev 异常退出但 commit 已落地 · daemon 误 SKIP validator 累计 retryCount→BLOCKED
            # 修法 · 若 crashed/timed_out 且 git log 内 (since iter_start) 已有 [<story>] commit · 强制跑 validator 让产物说话 · 不允许 SKIP
            # PRD-25 retro M-1 升级(2026-05-20) · since 窗口 20min → 90min · 防 claude CLI health check 累计 hang 长时间 commit 已超窗 · US-008 实证 47min
            if (crashed or timed_out) and current_story:
                _commit_hash_force = _check_existing_commit(current_story, since="90 minutes ago")
                if _commit_hash_force:
                    _reason = "crashed" if crashed else "timed_out"
                    print(f"  [RCA-006] dev {_reason} but commit {_commit_hash_force} 落地 · 强制跑 Validator 不 SKIP")
                    crashed = False
                    timed_out = False

            if crashed:
                # 开发 Agent 崩溃（非零退出码），重置 passes + 递增 retryCount 防止无限循环
                if current_story:
                    prd_crash = read_prd()
                    if prd_crash:
                        s_crash = get_story_by_id(prd_crash, current_story)
                        if s_crash:
                            if s_crash.get("passes", False):
                                s_crash["passes"] = False
                            s_crash["retryCount"] = s_crash.get("retryCount", 0) + 1
                            existing = s_crash.get("notes", "").strip()
                            note = f"[Developer 崩溃] Agent 非零退出码，passes 重置，retryCount +1"
                            s_crash["notes"] = f"{existing}\n{note}".strip() if existing else note
                            if not write_prd_safe(prd_crash):
                                print(f"  [WARN]  write_prd_safe 失败，retryCount 未持久化")
                dashboard.set_state(phase="idle")
                print("[SKIP]  开发 Agent 崩溃，跳过验证，下一次迭代重试...")
                time.sleep(2)
                continue

            if timed_out:
                # 安全措施：Developer 超时时可能已设 passes=true（执行到一半），必须重置
                # 同时递增 retryCount，防止持续超时的 story 无限循环
                prd = read_prd()
                if prd and current_story:
                    s = get_story_by_id(prd, current_story)
                    if s:
                        if s.get("passes", False):
                            s["passes"] = False
                        s["retryCount"] = s.get("retryCount", 0) + 1
                        existing = s.get("notes", "").strip()
                        note = f"[Developer 超时] 开发未完成，passes 重置，retryCount +1"
                        s["notes"] = f"{existing}\n{note}".strip() if existing else note
                        if write_prd_safe(prd):
                            print(f"   已重置 {current_story} passes → false, retryCount → {s['retryCount']}（开发超时）")
                        else:
                            print(f"   [WARN]  write_prd_safe 失败，retryCount 未持久化")
                dashboard.set_state(phase="idle")
                print("[SKIP]  开发 Agent 超时，跳过验证，下一次迭代继续...")
                time.sleep(2)
                continue

            # ─── 第二步：验证 ───
            write_lock(i, "validating", current_story)
            dashboard.set_state(phase="validating")
            try:
                run_validator(i, current_story)
            except RateLimitDetected as e:
                # PRD-14 retro M-2 (2026-05-15) · Validator 撞 rate limit · daemon 退出走 Step 4.5
                print(f"\n[DAEMON EXIT] {e}")
                print(f"  代码已 commit(若有) · 走 Opus Step 4.5 直审路径")
                try:
                    with open(PROGRESS_FILE, 'a', encoding='utf-8') as f:
                        from datetime import datetime as _dt
                        f.write(f"\n## {_dt.now().strftime('%Y-%m-%d %H:%M')} - {current_story} · [PRD-14 M-2 RATE-LIMIT DAEMON EXIT]\n")
                        f.write(f"- Validator 撞 Anthropic rate limit · daemon 退出(不累加 retryCount)\n")
                        f.write(f"- 触发 Step 4.5 路径 · Opus 深审 commit · 手 patch prd.json passes=true\n")
                        f.write(f"- 详见 AGENTS.md §11.7.4 + 全局 CLAUDE.md\n---\n\n")
                except Exception:
                    pass
                sys.exit(2)

            # H2: 强制重新读取 prd.json（Validator 可能已修改）
            # ─── 第三步：审计门禁 ───
            if not NO_AUDIT_GATE:
                prd = read_prd()  # H2: 每次重新读取，不依赖缓存
                if prd and current_story:
                    s = get_story_by_id(prd, current_story)
                    if s and s.get("passes", False):
                        # Story 通过验证 → 激活审计门禁，等待 Opus 审查
                        gate_written = write_audit_gate(current_story)
                        if gate_written:
                            write_lock(i, "waiting_audit", current_story)
                            dashboard.set_state(phase="waiting_audit")
                            try:
                                wait_for_audit(current_story)
                                handle_audit_result(current_story)
                            except AuditTimeoutError as e:
                                # RCA-006(2026-05-15) · 主审计 timeout · daemon 退出零容忍
                                print(f"\n[DAEMON EXIT] {e}")
                                print(f"  audit-gate.json 保留 pending · 用户介入后重启 daemon 自动崩溃恢复")
                                try:
                                    with open(PROGRESS_FILE, 'a', encoding='utf-8') as f:
                                        from datetime import datetime as _dt
                                        f.write(f"\n## {_dt.now().strftime('%Y-%m-%d %H:%M')} - {current_story} · [RCA-006 DAEMON EXIT]\n")
                                        f.write(f"- audit timeout(主审计触发) · daemon 已退出\n")
                                        f.write(f"- 详见 .agents/rca/RCA-006-audit-timeout-bypass.md\n---\n\n")
                                except Exception:
                                    pass
                                sys.exit(2)

            # H3: 结构化进度标记 — iteration 结束
            iter_elapsed = time.time() - iter_start
            _append_progress_marker(f"--- [RALPH] Iteration {i} ended: {current_story} ({format_duration(iter_elapsed)}) ---")
            # H4: 定期截断 progress.txt
            if i % 5 == 0:
                _truncate_progress_file()

            # ─── 第四步：检查完成状态 ───
            dashboard.set_state(phase="idle")
            if all_stories_resolved():
                dashboard.set_state(phase="done")
                elapsed = time.time() - total_start_time
                has_pass = any_story_passed()
                # M-1 (PRD-5 RCA-003 教训): BLOCKED 必须写 audit-gate · 不静默 exit
                blocked_attn = _write_blocked_audit_gate(has_pass)
                if has_pass and blocked_attn:
                    print("[OK] 部分 PASSED + 部分 BLOCKED · audit-gate(needs_attention) 写入 · 等用户决策")
                elif has_pass:
                    print("[OK] 所有任务已完成 · 全部 PASSED")
                else:
                    print("[BLOCK] 所有任务均已 BLOCKED，无一通过!")
                print(f"[TIME]  总运行时间: {format_duration(elapsed)}")
                print_cost_summary()
                write_prd_metric(elapsed)
                print_next_step_hints(has_pass)
                clear_lock()
                # 有 BLOCKED 时 exit 2 即使 has_pass · 让 CI 能 catch
                sys.exit(0 if (has_pass and not blocked_attn) else 2)

        except KeyboardInterrupt:
            elapsed = time.time() - total_start_time
            print(f"\n\n[WARN]  用户中断")
            print(f"[TIME]  总运行时间: {format_duration(elapsed)}")
            print_cost_summary()
            clear_lock()
            sys.exit(130)

    elapsed = time.time() - total_start_time
    print(f"\n已达到最大迭代次数 ({MAX_ITERATIONS})")
    print(f"[TIME]  总运行时间: {format_duration(elapsed)}")
    print_cost_summary()
    clear_lock()
    sys.exit(1)


if __name__ == "__main__":
    main()
