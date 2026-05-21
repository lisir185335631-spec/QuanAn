// @quanan/ui/admin · TopBar — 60px header, no app-layer deps
// Props-injected: userEmail, userRole, onLogout from AdminLayout

import { useState, useRef, useEffect } from 'react';

interface TopBarProps {
  userEmail: string;
  userRole: string;
  onAuditDrawerToggle: () => void;
  auditDrawerOpen: boolean;
  onLogout: () => void;
}

export function TopBar({
  userEmail,
  userRole,
  onAuditDrawerToggle,
  auditDrawerOpen,
  onLogout,
}: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="admin-topbar" role="banner">
      <span className="admin-topbar__brand">QuanAn Admin</span>

      <div className="admin-topbar__spacer" />

      {userEmail && (
        <>
          <span className="admin-badge admin-badge--email">{userEmail}</span>
          <span className="admin-badge admin-badge--role">{userRole}</span>
        </>
      )}

      <button
        type="button"
        className="admin-topbar__bell"
        aria-label="审计记录"
        aria-pressed={auditDrawerOpen}
        onClick={onAuditDrawerToggle}
        title="审计记录"
      >
        🔔
      </button>

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="admin-topbar__btn"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-label="用户菜单"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          ▼
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: 4,
              minWidth: 120,
              zIndex: 300,
            }}
          >
            <button
              type="button"
              role="menuitem"
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                color: '#e0e0e0',
                cursor: 'pointer',
                fontSize: 13,
                textAlign: 'left',
              }}
              onClick={() => {
                setDropdownOpen(false);
                onLogout();
              }}
            >
              退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
