// PRD-10 US-002 · Admin SPA root with routing + tRPC provider
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

import { adminTrpc, adminTrpcClient, adminQueryClient } from '@/lib/admin-client';
import Login from '@/pages/Login';

function AdminShell() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
        background: '#0a0a0a',
        color: '#e0e0e0',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ color: '#d4af37', marginBottom: '0.5rem' }}>QuanQn Admin</h1>
      <p style={{ color: '#888' }}>PRD-10 · admin 子系统 · US-002 session 就绪</p>
    </div>
  );
}

export default function App() {
  return (
    <adminTrpc.Provider client={adminTrpcClient} queryClient={adminQueryClient}>
      <QueryClientProvider client={adminQueryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminShell />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </adminTrpc.Provider>
  );
}
