import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StepProgress, STEP_ORDER_KEYS } from '@/components/StepProgress';

describe('StepProgress', () => {
  it('renders 0/9 when completedSteps is empty', () => {
    render(<StepProgress completedSteps={[]} />);
    expect(screen.getByText(/0\/9/)).toBeInTheDocument();
  });

  it('renders 9/9 when all steps completed', () => {
    render(<StepProgress completedSteps={[...STEP_ORDER_KEYS]} />);
    expect(screen.getByText(/9\/9/)).toBeInTheDocument();
  });

  it('renders 3/9 when 3 steps completed', () => {
    render(<StepProgress completedSteps={['step1', 'step3', 'step3b']} />);
    expect(screen.getByText(/3\/9/)).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading=true', () => {
    render(<StepProgress completedSteps={[]} isLoading />);
    expect(screen.getByLabelText('加载中')).toBeInTheDocument();
    expect(screen.queryByText(/\/9/)).not.toBeInTheDocument();
  });

  it('renders all 9 step items', () => {
    render(<StepProgress completedSteps={[]} />);
    for (const key of STEP_ORDER_KEYS) {
      expect(screen.getByTestId(`step-${key}`)).toBeInTheDocument();
    }
  });

  it('marks completed step with data-status=completed', () => {
    render(<StepProgress completedSteps={['step1']} />);
    expect(screen.getByTestId('step-step1')).toHaveAttribute('data-status', 'completed');
  });

  it('marks first incomplete step with data-status=current', () => {
    render(<StepProgress completedSteps={['step1']} />);
    expect(screen.getByTestId('step-step3')).toHaveAttribute('data-status', 'current');
  });

  it('marks later steps as pending', () => {
    render(<StepProgress completedSteps={['step1']} />);
    expect(screen.getByTestId('step-step3b')).toHaveAttribute('data-status', 'pending');
  });

  it('STEP_ORDER_KEYS has exactly 9 entries', () => {
    expect(STEP_ORDER_KEYS.length).toBe(9);
  });

  it('accepts optional className prop without error', () => {
    render(<StepProgress completedSteps={[]} className="custom-class" />);
    expect(screen.getByText(/0\/9/)).toBeInTheDocument();
  });
});
