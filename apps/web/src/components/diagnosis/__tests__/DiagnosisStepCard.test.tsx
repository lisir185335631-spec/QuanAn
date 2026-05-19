import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { DiagnosisStepCard } from '../DiagnosisStepCard';
import { DIAGNOSIS_DIMENSIONS_8 } from '@/lib/constants/diagnosis';

const basicDimension = DIAGNOSIS_DIMENSIONS_8[0]!;        // basic (Step 1)
const positioningDimension = DIAGNOSIS_DIMENSIONS_8[1]!;  // positioning (Step 2)
const authenticDimension = DIAGNOSIS_DIMENSIONS_8[7]!;    // authentic (Step 8)

const defaultProps = {
  stepIndex: 2,
  totalSteps: 8,
  dimension: positioningDimension,
  selectedCheckboxes: [],
  onCheckboxToggle: vi.fn(),
  notes: '',
  onNotesChange: vi.fn(),
  onPrev: vi.fn(),
  onNext: vi.fn(),
  isFirst: false,
  isLast: false,
};

describe('DiagnosisStepCard', () => {
  it('props 渲染: 步骤指示器 + H2 + 副标', () => {
    render(<DiagnosisStepCard {...defaultProps} />);
    expect(screen.getByText('步骤 2 / 8 · 定位清晰度')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('定位清晰度');
    expect(screen.getByText('赛道、产品、产品链条')).toBeInTheDocument();
  });

  it('checkbox 列渲染: 3 checkboxes for positioning', () => {
    render(<DiagnosisStepCard {...defaultProps} />);
    expect(screen.getByText('已确定赛道方向')).toBeInTheDocument();
    expect(screen.getByText('产品定位明确，知道卖什么')).toBeInTheDocument();
    expect(screen.getByText('产品链条清晰（引流品→利润品→高端品）')).toBeInTheDocument();
  });

  it('checkbox toggle 调用 onCheckboxToggle', () => {
    const onCheckboxToggle = vi.fn();
    render(<DiagnosisStepCard {...defaultProps} onCheckboxToggle={onCheckboxToggle} />);
    fireEvent.click(screen.getByText('已确定赛道方向'));
    expect(onCheckboxToggle).toHaveBeenCalledWith('已确定赛道方向');
  });

  it('下一步 click 调用 onNext', () => {
    const onNext = vi.fn();
    render(<DiagnosisStepCard {...defaultProps} onNext={onNext} />);
    fireEvent.click(screen.getByTestId('diagnosis-next'));
    expect(onNext).toHaveBeenCalled();
  });

  it('上一步 click 调用 onPrev', () => {
    const onPrev = vi.fn();
    render(<DiagnosisStepCard {...defaultProps} onPrev={onPrev} />);
    fireEvent.click(screen.getByTestId('diagnosis-prev'));
    expect(onPrev).toHaveBeenCalled();
  });

  it('isFirst=true: 上一步 button disabled', () => {
    render(<DiagnosisStepCard {...defaultProps} isFirst />);
    expect(screen.getByTestId('diagnosis-prev')).toBeDisabled();
  });

  it('isFirst=false: 上一步 button enabled', () => {
    render(<DiagnosisStepCard {...defaultProps} isFirst={false} />);
    expect(screen.getByTestId('diagnosis-prev')).not.toBeDisabled();
  });

  it('最后一步 CTA 变化: isLast=true → "生成诊断报告"', () => {
    render(
      <DiagnosisStepCard
        {...defaultProps}
        stepIndex={8}
        dimension={authenticDimension}
        isLast
      />,
    );
    expect(screen.getByTestId('diagnosis-next')).toHaveTextContent('生成诊断报告');
  });

  it('非最后步: 下一步 button text "下一步"', () => {
    render(<DiagnosisStepCard {...defaultProps} isLast={false} />);
    expect(screen.getByTestId('diagnosis-next')).toHaveTextContent('下一步');
  });

  it('Step 1 (basic): 渲染行业/产品 input + 4 stage radio', () => {
    render(
      <DiagnosisStepCard
        {...defaultProps}
        stepIndex={1}
        dimension={basicDimension}
        isFirst
      />,
    );
    expect(screen.getByTestId('diagnosis-industry')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-product')).toBeInTheDocument();
    // 4 stage radios
    expect(screen.getByTestId('diagnosis-stage-startup')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-stage-growth')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-stage-breakout')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-stage-plateau')).toBeInTheDocument();
  });

  it('selected checkbox 状态: border-primary class 应用', () => {
    render(
      <DiagnosisStepCard
        {...defaultProps}
        selectedCheckboxes={['已确定赛道方向']}
      />,
    );
    const label = screen.getByTestId('diagnosis-checkbox-已确定赛道方向');
    expect(label.className).toContain('border-primary');
  });
});
