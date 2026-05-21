// @quanan/ui/admin · StatusBar — 24px bottom bar, no app-layer deps

interface StatusBarProps {
  role?: string;
}

export function StatusBar({ role = '...' }: StatusBarProps) {
  return (
    <footer className="admin-statusbar" role="contentinfo" aria-label="系统状态">
      <span className="admin-statusbar__field">
        ENV=<span className="admin-statusbar__value--warn">dev</span>
      </span>
      <span className="admin-statusbar__field">
        RLS=<span className="admin-statusbar__value--ok">ON</span>
      </span>
      <span className="admin-statusbar__field">
        WAF=<span className="admin-statusbar__value--warn">stub</span>
      </span>
      <span className="admin-statusbar__field">
        MFA=<span className="admin-statusbar__value--warn">stub</span>
      </span>
      <span className="admin-statusbar__field">
        Role=<span className="admin-statusbar__value--warn">{role}</span>
      </span>
    </footer>
  );
}
