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
    render(<FeedbackButton stepKey="step1" />);
    expect(screen.getByLabelText('有帮助')).toBeInTheDocument();
    expect(screen.getByLabelText('没帮助')).toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<FeedbackButton stepKey="step1" />);
    expect(screen.getByText('内容有帮助吗？')).toBeInTheDocument();
  });

  it('calls mutate with good type on thumbs-up click', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton stepKey="step1" />);
    await user.click(screen.getByLabelText('有帮助'));
    expect(mockMutate).toHaveBeenCalledWith({ stepKey: 'step1', type: 'good' });
  });

  it('calls mutate with bad type on thumbs-down click', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton stepKey="step2" />);
    await user.click(screen.getByLabelText('没帮助'));
    expect(mockMutate).toHaveBeenCalledWith({ stepKey: 'step2', type: 'bad' });
  });

  it('passes stepKey correctly for ip-plan', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton stepKey="ip-plan" />);
    await user.click(screen.getByLabelText('有帮助'));
    expect(mockMutate).toHaveBeenCalledWith({ stepKey: 'ip-plan', type: 'good' });
  });

  it('has data-testid feedback-buttons wrapper', () => {
    render(<FeedbackButton stepKey="step1" />);
    expect(screen.getByTestId('feedback-buttons')).toBeInTheDocument();
  });

  it('has data-testid feedback-good on thumbs-up button', () => {
    render(<FeedbackButton stepKey="step1" />);
    expect(screen.getByTestId('feedback-good')).toBeInTheDocument();
  });

  it('has data-testid feedback-bad on thumbs-down button', () => {
    render(<FeedbackButton stepKey="step1" />);
    expect(screen.getByTestId('feedback-bad')).toBeInTheDocument();
  });
});
