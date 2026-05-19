// PRD-10 US-002 · Admin Login page
// AC-9: email input + mock OAuth button (DEV only) + Google stub disabled
// AC-17~21: browser-verifiable login flow

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminTrpc } from '@/lib/admin-client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const navigate = useNavigate();

  const login = adminTrpc.auth.login.useMutation({
    onSuccess: () => {
      setToast({ msg: 'Login successful', type: 'success' });
      navigate('/admin');
    },
    onError: (err: { message?: string }) => {
      setToast({ msg: err.message ?? 'Login failed', type: 'error' });
    },
  });

  function handleMockLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setToast({ msg: 'Email is required', type: 'error' });
      return;
    }
    setToast(null);
    login.mutate({ email });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          padding: '2rem',
          width: 360,
        }}
      >
        <h1 style={{ color: '#d4af37', marginBottom: '0.25rem', fontSize: '1.5rem' }}>
          QuanAn Admin
        </h1>
        <p style={{ color: '#555', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          管理员登录
        </p>

        <form onSubmit={handleMockLogin}>
          <label
            htmlFor="admin-email"
            style={{ display: 'block', marginBottom: '0.25rem', color: '#aaa', fontSize: '0.85rem' }}
          >
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="super@quanan.com"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              background: '#1c1c1c',
              border: '1px solid #333',
              borderRadius: 4,
              color: '#e0e0e0',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
              marginBottom: '1rem',
            }}
          />

          {/* Mock OAuth button — dev only (AC-9) */}
          {import.meta.env.DEV && (
            <button
              type="submit"
              disabled={login.isPending}
              style={{
                width: '100%',
                padding: '0.6rem',
                background: login.isPending ? '#2a2a2a' : '#d4af37',
                color: login.isPending ? '#888' : '#0a0a0a',
                border: 'none',
                borderRadius: 4,
                cursor: login.isPending ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              {login.isPending ? '登录中…' : 'mock OAuth 登录'}
            </button>
          )}

          {/* Google Workspace OAuth — stub, disabled until PRR */}
          <button
            type="button"
            disabled
            title="Google Workspace OAuth · PRR required"
            style={{
              width: '100%',
              padding: '0.6rem',
              background: '#1c1c1c',
              color: '#444',
              border: '1px solid #2a2a2a',
              borderRadius: 4,
              cursor: 'not-allowed',
            }}
          >
            Google Workspace 登录（上线前配置）
          </button>
        </form>

        {toast && (
          <div
            role="alert"
            style={{
              marginTop: '1rem',
              padding: '0.5rem 0.75rem',
              background: toast.type === 'error' ? '#2a1010' : '#102a10',
              border: `1px solid ${toast.type === 'error' ? '#5a2020' : '#205a20'}`,
              borderRadius: 4,
              color: toast.type === 'error' ? '#ff6b6b' : '#6bff6b',
              fontSize: '0.85rem',
            }}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}
