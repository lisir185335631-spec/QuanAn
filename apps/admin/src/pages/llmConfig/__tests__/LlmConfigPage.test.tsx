// PRD-29.6 US-001 · LlmConfigPage 单元测试
// AC-8: render + Save + masked + indicator

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LlmConfigPage from '../LlmConfigPage';

const { mockListSystemConfig, mockUpdateMutation } = vi.hoisted(() => ({
  mockListSystemConfig: vi.fn(),
  mockUpdateMutation: vi.fn(),
}));

vi.mock('@/lib/admin-client', () => {
  return {
    adminTrpc: {
      useUtils: () => ({}),
      featureFlags: {
        listSystemConfig: { useQuery: mockListSystemConfig },
        updateSystemConfig: { useMutation: mockUpdateMutation },
      },
    },
    adminQueryClient: {},
    adminTrpcClient: {},
  };
});

const mockMutate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockListSystemConfig.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() });
  mockUpdateMutation.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
  });
});

describe('LlmConfigPage', () => {
  it('renders without crash', () => {
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    expect(screen.getByText(/LLM 配置/)).toBeInTheDocument();
  });

  it('renders 2 Save buttons', () => {
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    const saveBtns = screen.getAllByTestId(/^save-btn-/);
    expect(saveBtns).toHaveLength(2);
  });

  it('shows Anthropic API Key label', () => {
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    expect(screen.getByText('Anthropic API Key')).toBeInTheDocument();
  });

  it('shows OpenAI API Key label', () => {
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    expect(screen.getByText('OpenAI API Key')).toBeInTheDocument();
  });

  it('inputs are type=password', () => {
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    const inputs = screen.getAllByTestId(/^input-/);
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  it('shows masked value when key is set', () => {
    mockListSystemConfig.mockReturnValue({
      data: [
        {
          id: 1,
          configKey: 'LLM_ANTHROPIC_API_KEY',
          configValue: 'sk-ant-api03-xxxxxxxxxxxx',
          isEmergency: false,
          description: null,
          updatedByAdminId: 1,
          updatedByEmail: null,
          updatedAt: new Date(),
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    });
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    const masked = screen.getByTestId('masked-value-LLM_ANTHROPIC_API_KEY');
    expect(masked.textContent).toContain('***');
    expect(masked.textContent).toContain('sk-ant');
  });

  it('shows 已设置 indicator when key is set', () => {
    mockListSystemConfig.mockReturnValue({
      data: [
        {
          id: 1,
          configKey: 'LLM_ANTHROPIC_API_KEY',
          configValue: 'sk-ant-api03-xxxxxxxxxxxx',
          isEmergency: false,
          description: null,
          updatedByAdminId: 1,
          updatedByEmail: null,
          updatedAt: new Date(),
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    });
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    const statusLabel = screen.getByTestId('status-label-LLM_ANTHROPIC_API_KEY');
    expect(statusLabel.textContent).toBe('已设置');
  });

  it('shows 未设置 indicator when key is not set', () => {
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    const statusLabel = screen.getByTestId('status-label-LLM_ANTHROPIC_API_KEY');
    expect(statusLabel.textContent).toBe('未设置');
  });

  it('calls updateSystemConfig.mutate on Save click', () => {
    render(<LlmConfigPage />, { wrapper: MemoryRouter });
    const input = screen.getByTestId('input-LLM_ANTHROPIC_API_KEY');
    fireEvent.change(input, { target: { value: 'sk-ant-test-key' } });
    const saveBtn = screen.getByTestId('save-btn-LLM_ANTHROPIC_API_KEY');
    fireEvent.click(saveBtn);
    expect(mockMutate).toHaveBeenCalledWith({
      configKey: 'LLM_ANTHROPIC_API_KEY',
      configValue: 'sk-ant-test-key',
    });
  });
});
