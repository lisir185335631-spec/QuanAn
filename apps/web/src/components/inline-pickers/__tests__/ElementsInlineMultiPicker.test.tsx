import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ALL_ELEMENTS, HOT_ELEMENT_GROUPS } from '@/lib/constants/elements';

import { ElementsInlineMultiPicker } from '../ElementsInlineMultiPicker';

describe('ElementsInlineMultiPicker', () => {
  it('renders all elements in 4 groups (grouped layout)', () => {
    render(<ElementsInlineMultiPicker value={[]} onChange={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(ALL_ELEMENTS.length);
    expect(screen.getByText('经典元素')).toBeInTheDocument();
    expect(screen.getByText('情绪驱动')).toBeInTheDocument();
    expect(screen.getByText('内容策略')).toBeInTheDocument();
    expect(screen.getByText('转化驱动')).toBeInTheDocument();
  });

  it('controlled: adds key when unselected element clicked', () => {
    const onChange = vi.fn();
    render(<ElementsInlineMultiPicker value={[]} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(onChange).toHaveBeenCalledWith([ALL_ELEMENTS[0]!.key]);
  });

  it('controlled: removes key when selected element clicked', () => {
    const onChange = vi.fn();
    const firstKey = ALL_ELEMENTS[0]!.key;
    render(<ElementsInlineMultiPicker value={[firstKey]} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('showCount=true: displays selected count text', () => {
    render(<ElementsInlineMultiPicker value={['greed', 'fear']} onChange={() => {}} showCount />);
    expect(screen.getByText('选择爆款元素（已选 2 个）')).toBeInTheDocument();
  });

  it('layout=compact: renders flat list without group headings', () => {
    render(<ElementsInlineMultiPicker value={[]} onChange={() => {}} layout="compact" />);
    expect(screen.queryByText('经典元素')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(ALL_ELEMENTS.length);
  });

  it('disabled: does not call onChange when clicked', () => {
    const onChange = vi.fn();
    render(<ElementsInlineMultiPicker value={[]} onChange={onChange} disabled />);
    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('HOT_ELEMENT_GROUPS has exactly 4 groups', () => {
    expect(HOT_ELEMENT_GROUPS).toHaveLength(4);
  });
});
