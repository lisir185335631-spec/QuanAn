// PRD-10 US-005 · Admin SPA root with routing + tRPC provider
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { adminTrpc, adminTrpcClient, adminQueryClient } from './lib/admin-client';
import { AdminRoutes } from './router';
import './styles/admin.css';

export default function App() {
  return (
    <adminTrpc.Provider client={adminTrpcClient} queryClient={adminQueryClient}>
      <QueryClientProvider client={adminQueryClient}>
        <BrowserRouter>
          <AdminRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </adminTrpc.Provider>
  );
}
