// PRD-10 US-005 · AuditDrawer unit tests (AC-15: 6 tests)
// PRD-26 US-004: updated to use props API (logs injected, no adminTrpc dep)
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';

import { AuditDrawer } from '@quanan/ui/admin';
import type { AuditRow } from '@quanan/ui/admin';

afterEach(cleanup);

const sampleRow: AuditRow = {
  id: 1,
  eventType: 'admin_login',
  eventCategory: 'auth',
  createdAt: new Date('2026-05-12T10:00:00'),
  payload: null,
};

describe('AuditDrawer', () => {
  it('does not render when open=false', () => {
    render(<AuditDrawer open={false} onClose={() => {}} logs={[]} />);
    expect(screen.queryByTestId('audit-drawer')).not.toBeInTheDocument();
  });

  it('renders drawer when open=true', () => {
    render(<AuditDrawer open={true} onClose={() => {}} logs={[]} />);
    expect(screen.getByTestId('audit-drawer')).toBeInTheDocument();
  });

  it('shows empty state when there are no rows', () => {
    render(<AuditDrawer open={true} onClose={() => {}} logs={[]} />);
    expect(screen.getByText('暂无审计记录')).toBeInTheDocument();
  });

  it('renders audit rows when logs are provided', () => {
    render(<AuditDrawer open={true} onClose={() => {}} logs={[sampleRow]} />);
    expect(screen.getByText('admin_login')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<AuditDrawer open={true} onClose={onClose} logs={[]} />);
    await userEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when ESC key is pressed', async () => {
    const onClose = vi.fn();
    render(<AuditDrawer open={true} onClose={onClose} logs={[]} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
