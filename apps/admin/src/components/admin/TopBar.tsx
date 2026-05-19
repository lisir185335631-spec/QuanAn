// PRD-10 US-005 · TopBar 60px
// AC-2: 品牌 + activeAdminUser badge + role badge + logout dropdown + 🔔 audit drawer toggle

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminTrpc } from '../../lib/admin-client';

interface TopBarProps {
  onAuditDrawerToggle: () => void;
  auditDrawerOpen: boolean;
}

export function TopBar({ onAuditDrawerToggle, auditDrawerOpen }: TopBarProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: me } = adminTrpc.auth.me.useQuery();
  const logout = adminTrpc.auth.logout.useMutation({
    onSuccess: () => navigate('/login'),
  });

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

      {me && (
        <>
          <span className="admin-badge admin-badge--email">{me.email}</span>
          <span className="admin-badge admin-badge--role">{me.role}</span>
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
                logout.mutate();
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
