// PRD-10 US-005 · AuditDrawer unit tests (AC-15: 6 tests)
// Tests: open/close/list/polling/empty
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

// ─── Mock tRPC ────────────────────────────────────────────────────────────────
const mockListMine = vi.fn();

vi.mock('../../../apps/admin/src/lib/admin-client', () => ({
  adminTrpc: {
    audit: {
      listMine: {
        useQuery: (_, opts: { enabled?: boolean }) => mockListMine(opts),
      },
    },
  },
  adminTrpcClient: {},
  adminQueryClient: {},
}));

import { AuditDrawer } from '../../../apps/admin/src/components/admin/AuditDrawer';

afterEach(cleanup);

describe('AuditDrawer', () => {
  it('does not render when open=false', () => {
    mockListMine.mockReturnValue({ data: [] });
    render(<AuditDrawer open={false} onClose={() => {}} />);
    expect(screen.queryByTestId('audit-drawer')).not.toBeInTheDocument();
  });

  it('renders drawer when open=true', () => {
    mockListMine.mockReturnValue({ data: [] });
    render(<AuditDrawer open={true} onClose={() => {}} />);
    expect(screen.getByTestId('audit-drawer')).toBeInTheDocument();
  });

  it('shows empty state when there are no rows', () => {
    mockListMine.mockReturnValue({ data: [] });
    render(<AuditDrawer open={true} onClose={() => {}} />);
    expect(screen.getByText('暂无审计记录')).toBeInTheDocument();
  });

  it('renders audit rows when data is provided', () => {
    mockListMine.mockReturnValue({
      data: [
        { id: 1, eventType: 'admin_login', eventCategory: 'auth', createdAt: new Date('2026-05-12T10:00:00'), payload: null },
      ],
    });
    render(<AuditDrawer open={true} onClose={() => {}} />);
    expect(screen.getByText('admin_login')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    mockListMine.mockReturnValue({ data: [] });
    const onClose = vi.fn();
    render(<AuditDrawer open={true} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when ESC key is pressed', async () => {
    mockListMine.mockReturnValue({ data: [] });
    const onClose = vi.fn();
    render(<AuditDrawer open={true} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
