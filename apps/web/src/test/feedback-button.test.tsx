import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FeedbackButton } from '@/components/FeedbackButton';

const mockMutate = vi.fn();

vi.mock('@/lib/trpc', () => ({
  trpc: {
    costLog: {
      logFeedback: {
        useMutation: () => ({ mutate: mockMutate, isPending: false }),
      },
    },
  },
}));

describe('FeedbackButton', () => {
  it('renders thumbs-up and thumbs-down buttons', () => {
    render(<FeedbackButton stepKey="step1" agentId="PositioningAgent" />);
    expect(screen.getByLabelText('有帮助')).toBeInTheDocument();
    expect(screen.getByLabelText('没帮助')).toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<FeedbackButton stepKey="step1" agentId="PositioningAgent" />);
    expect(screen.getByText('内容有帮助吗？')).toBeInTheDocument();
  });

  it('calls mutate with good type and agentId on thumbs-up click', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton stepKey="step1" agentId="PositioningAgent" />);
    await user.click(screen.getByLabelText('有帮助'));
    expect(mockMutate).toHaveBeenCalledWith({ stepKey: 'step1', agentId: 'PositioningAgent', type: 'good' });
  });

  it('calls mutate with bad type and agentId on thumbs-down click', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton stepKey="step2" agentId="web-client" />);
    await user.click(screen.getByLabelText('没帮助'));
    expect(mockMutate).toHaveBeenCalledWith({ stepKey: 'step2', agentId: 'web-client', type: 'bad' });
  });

  it('passes stepKey and agentId correctly for ip-plan', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton stepKey="ip-plan" agentId="web-client" />);
    await user.click(screen.getByLabelText('有帮助'));
    expect(mockMutate).toHaveBeenCalledWith({ stepKey: 'ip-plan', agentId: 'web-client', type: 'good' });
  });

  it('has data-testid feedback-buttons wrapper', () => {
    render(<FeedbackButton stepKey="step1" agentId="PositioningAgent" />);
    expect(screen.getByTestId('feedback-buttons')).toBeInTheDocument();
  });

  it('has data-testid feedback-good on thumbs-up button', () => {
    render(<FeedbackButton stepKey="step1" agentId="PositioningAgent" />);
    expect(screen.getByTestId('feedback-good')).toBeInTheDocument();
  });

  it('has data-testid feedback-bad on thumbs-down button', () => {
    render(<FeedbackButton stepKey="step1" agentId="PositioningAgent" />);
    expect(screen.getByTestId('feedback-bad')).toBeInTheDocument();
  });
});
