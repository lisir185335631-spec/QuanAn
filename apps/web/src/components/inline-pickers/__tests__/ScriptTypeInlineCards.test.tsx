import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { SCRIPT_TYPES } from '@/lib/constants/scripts';

import { ScriptTypeInlineCards } from '../ScriptTypeInlineCards';

describe('ScriptTypeInlineCards', () => {
  it('renders all 20 script type cards', () => {
    render(<ScriptTypeInlineCards value={null} onChange={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(20);
    expect(screen.getByText('聊观点')).toBeInTheDocument();
    expect(screen.getByText('打鸡血')).toBeInTheDocument();
  });

  it('controlled: calls onChange with key when card clicked', () => {
    const onChange = vi.fn();
    render(<ScriptTypeInlineCards value={null} onChange={onChange} />);
    fireEvent.click(screen.getByText('聊观点').closest('button')!);
    expect(onChange).toHaveBeenCalledWith('opinion');
  });

  it('controlled: selected card has border-primary styling', () => {
    render(<ScriptTypeInlineCards value="opinion" onChange={() => {}} />);
    const btn = screen.getByText('聊观点').closest('button')!;
    expect(btn.className).toContain('border-primary');
  });

  it('disabled: does not call onChange when clicked', () => {
    const onChange = vi.fn();
    render(<ScriptTypeInlineCards value={null} onChange={onChange} disabled />);
    fireEvent.click(screen.getByText('聊观点').closest('button')!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('showSearch=true: renders search input and filters cards', () => {
    render(<ScriptTypeInlineCards value={null} onChange={() => {}} showSearch />);
    const input = screen.getByPlaceholderText('搜索脚本类型...');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '聊观点' } });
    expect(screen.getByText('聊观点')).toBeInTheDocument();
    expect(screen.queryByText('打鸡血')).not.toBeInTheDocument();
  });

  it('showMethodology=true: renders methodology text for each card', () => {
    render(<ScriptTypeInlineCards value={null} onChange={() => {}} showMethodology />);
    const firstScript = SCRIPT_TYPES[0]!;
    expect(screen.getByTestId(`methodology-${firstScript.key}`)).toBeInTheDocument();
    expect(screen.getByTestId(`methodology-${firstScript.key}`).textContent).toBe(firstScript.methodology);
  });

  it('SCRIPT_TYPES has exactly 20 items', () => {
    expect(SCRIPT_TYPES).toHaveLength(20);
  });
});
