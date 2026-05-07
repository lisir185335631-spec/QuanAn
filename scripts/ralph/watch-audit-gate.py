#!/usr/bin/env python3
"""
watch-audit-gate.py
Coding 3.0 自动审查监测 + 系统通知 (2026-05-04 升级).

模式:
  - 前台模式 (默认): poll audit-gate.json, 输出 PENDING_DETECTED/APPROVED/REJECTED 到 stdout
  - --daemon 模式 (新增): fork detached 子进程, 父进程退出, 子进程后台 poll
  - 默认开启系统通知 (macOS osascript / Linux notify-send / Windows beep)
  - --no-notify: 禁用系统通知 (CI / 测试用)
  - 自动 lock file 防止同项目多实例 (~/.claude/watch-audit-<hash>.lock)

用法:
    python3 watch-audit-gate.py <project-root> [interval] [--daemon] [--no-notify]

示例:
    # 前台跑, 默认通知
    python3 watch-audit-gate.py /Users/x/my-project 15

    # 后台跑 (推荐 ralph.py daemon 启动时自动调用)
    python3 watch-audit-gate.py /Users/x/my-project 15 --daemon

    # 后台跑无通知
    python3 watch-audit-gate.py /Users/x/my-project 15 --daemon --no-notify

输出格式 (单行一事件, 写入 stdout / 后台模式写入 ~/.claude/watch-audit.log):
    [SCAN] watch-audit-gate START project=... interval=15s notify=True
    PENDING_DETECTED: US-003 at 2026-04-20T20:45:17
    APPROVED: US-003 at 2026-04-20T20:55:12
    REJECTED: US-003 at 2026-04-20T21:00:33

相比旧版:
  - 新增 --daemon (detached 子进程, 不依赖父 shell)
  - 新增系统通知 (macOS/Linux/Windows)
  - 新增 lock file (防多实例)
  - bash 版 (watch-audit-gate.sh) 保留作 Unix 兼容 fallback
"""

from __future__ import annotations  # PEP 563: 让 X | None 类型注解在 3.9 也能跑

import hashlib
import json
import os
import platform
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# Windows 控制台 UTF-8
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def _fmt_ts() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _notify_pending(story_id: str, project_name: str) -> None:
    """系统级通知 (macOS / Linux / Windows). 失败静默忽略, 不影响监测."""
    title = f"Ralph Audit Gate: {story_id}"
    msg = f"Pending review in {project_name}"

    sys_name = platform.system()
    try:
        if sys_name == "Darwin":
            # macOS: osascript notification + say (语音播报)
            subprocess.Popen(
                [
                    "osascript",
                    "-e",
                    f'display notification "{msg}" with title "{title}" sound name "Glass"',
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            subprocess.Popen(
                ["say", f"Audit gate pending: {story_id.replace('-', ' dash ')}"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        elif sys_name == "Linux":
            subprocess.Popen(
                ["notify-send", title, msg],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        elif sys_name == "Windows":
            ps = (
                '$ErrorActionPreference="SilentlyContinue"; '
                '[reflection.assembly]::loadwithpartialname("System.Windows.Forms") | Out-Null; '
                '[System.Media.SystemSounds]::Asterisk.Play()'
            )
            subprocess.Popen(
                ["powershell.exe", "-NoProfile", "-Command", ps],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
    except Exception:
        pass  # 通知失败不影响监测


def _get_lock_path(project_root: Path) -> Path:
    """每个项目一个 lock, 路径用 hash 避免特殊字符问题"""
    project_hash = hashlib.md5(str(project_root).encode()).hexdigest()[:8]
    return Path.home() / ".claude" / f"watch-audit-{project_hash}.lock"


def _is_pid_alive(pid: int) -> bool:
    if platform.system() == "Windows":
        try:
            r = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/NH"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            return str(pid) in r.stdout
        except Exception:
            return False
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def _acquire_lock(lock_path: Path) -> bool:
    """尝试取 lock. True 成功, False 已有活进程."""
    if lock_path.exists():
        try:
            old_pid = int(lock_path.read_text(encoding="utf-8").strip())
            if _is_pid_alive(old_pid):
                print(f"[WARN] 已有 watch 进程 (PID: {old_pid}), 跳过启动", file=sys.stderr)
                return False
        except Exception:
            pass  # lock 损坏, 直接覆盖
    try:
        lock_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path.write_text(str(os.getpid()), encoding="utf-8")
        return True
    except Exception as e:
        print(f"[WARN] 写 lock 失败: {e}", file=sys.stderr)
        return False


def _release_lock(lock_path: Path) -> None:
    try:
        if lock_path.exists():
            lock_path.unlink()
    except Exception:
        pass


def watch(project_root: Path, interval: int = 15, notify: bool = True) -> None:
    gate_file = project_root / "scripts" / "ralph" / "audit-gate.json"
    project_name = project_root.name

    print(
        f"[SCAN] watch-audit-gate START project={project_root} interval={interval}s notify={notify}",
        flush=True,
    )

    last_story: str | None = None
    last_status: str | None = None

    while True:
        if gate_file.exists():
            try:
                data = json.loads(gate_file.read_text(encoding="utf-8"))
                status = data.get("status", "?")
                story = data.get("story_id", "?")
                ts = data.get("timestamp", "?")

                if status == "pending" and story != "?":
                    if story != last_story or last_status != "pending":
                        print(f"PENDING_DETECTED: {story} at {ts}", flush=True)
                        if notify:
                            _notify_pending(story, project_name)
                        last_story = story
                        last_status = "pending"
                elif status in ("approved", "rejected"):
                    if last_status == "pending":
                        marker = "APPROVED" if status == "approved" else "REJECTED"
                        print(f"{marker}: {last_story} at {_fmt_ts()}", flush=True)
                    last_status = status
            except (json.JSONDecodeError, OSError):
                pass  # 文件瞬态损坏, 继续 poll
        else:
            if last_status != "no_gate":
                last_status = "no_gate"
                last_story = None

        time.sleep(interval)


def _daemonize(args: list[str]) -> None:
    """fork detached 子进程, 父进程立即退出. 跨平台 (Windows / Unix)."""
    log_file = Path.home() / ".claude" / "watch-audit.log"
    log_file.parent.mkdir(parents=True, exist_ok=True)

    try:
        log_handle = open(log_file, "a", encoding="utf-8")
    except Exception as e:
        print(f"[FAIL] 打开 watch 日志失败: {e}", file=sys.stderr)
        sys.exit(1)

    child_args = [sys.executable, str(Path(__file__).resolve())] + [
        a for a in args if a != "--daemon"
    ]

    if platform.system() == "Windows":
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        proc = subprocess.Popen(
            child_args,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
        )
    else:
        proc = subprocess.Popen(
            child_args,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            start_new_session=True,
        )

    log_handle.close()
    print(f"[OK] watch-audit-gate 已后台启动 (PID: {proc.pid})")
    print(f"  日志: {log_file}")
    if platform.system() == "Windows":
        print(f"  停止: taskkill /PID {proc.pid} /F")
    else:
        print(f"  停止: kill {proc.pid}")
    sys.exit(0)


def main():
    args = sys.argv[1:]
    if any(a in ("-h", "--help") for a in args):
        print(__doc__)
        sys.exit(0)
    if not args:
        print(
            "用法: watch-audit-gate.py <project-root> [interval] [--daemon] [--no-notify]",
            file=sys.stderr,
        )
        sys.exit(2)

    daemon_mode = "--daemon" in args
    notify = "--no-notify" not in args
    pos_args = [a for a in args if not a.startswith("--")]

    if not pos_args:
        print("[FAIL] 未指定项目路径", file=sys.stderr)
        sys.exit(1)
    project = Path(pos_args[0]).resolve()
    if not project.exists():
        print(f"[FAIL] 项目路径不存在: {project}", file=sys.stderr)
        sys.exit(1)

    interval = 15
    if len(pos_args) >= 2:
        try:
            interval = int(pos_args[1])
        except ValueError:
            pass

    if daemon_mode:
        _daemonize(args)
        return  # unreachable

    lock_path = _get_lock_path(project)
    if not _acquire_lock(lock_path):
        sys.exit(1)

    try:
        watch(project, interval, notify=notify)
    except KeyboardInterrupt:
        print(f"\n[STOP] watch-audit-gate STOP at {_fmt_ts()}", flush=True)
    finally:
        _release_lock(lock_path)


if __name__ == "__main__":
    main()
