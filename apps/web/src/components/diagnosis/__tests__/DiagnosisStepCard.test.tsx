import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { DIAGNOSIS_DIMENSIONS_8 } from '@/lib/constants/diagnosis';

import { DiagnosisStepCard } from '../DiagnosisStepCard';

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
  it('props 渲染: 步骤指示器灰小字(无 uppercase)', () => {
    render(<DiagnosisStepCard {...defaultProps} />);
    expect(screen.getByText('步骤 2/8 · 定位清晰度')).toBeInTheDocument();
  });

  it('Step 2-8: DimensionIconBlock 渲染(positioning)', () => {
    render(<DiagnosisStepCard {...defaultProps} />);
    expect(screen.getByTestId('dimension-icon-block-positioning')).toBeInTheDocument();
  });

  it('checkbox 列渲染: 3 checkboxes for positioning · lucide ✕ icon', () => {
    render(<DiagnosisStepCard {...defaultProps} />);
    expect(screen.getByText('已确定赛道方向')).toBeInTheDocument();
    expect(screen.getByText('产品定位明确，知道卖什么')).toBeInTheDocument();
    expect(screen.getByText('产品链条清晰（引流品→利润品→高端品）')).toBeInTheDocument();
  });

  it('checkbox toggle 调用 onCheckboxToggle', () => {
    const onCheckboxToggle = vi.fn();
    render(<DiagnosisStepCard {...defaultProps} onCheckboxToggle={onCheckboxToggle} />);
    fireEvent.click(screen.getByTestId('diagnosis-checkbox-已确定赛道方向'));
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

  it('最后一步 CTA: isLast=true → "生成诊断报告"', () => {
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

  it('Step 1 (basic): label 改 "你的行业" / "你的产品/服务" / "你目前的阶段"', () => {
    render(
      <DiagnosisStepCard
        {...defaultProps}
        stepIndex={1}
        dimension={basicDimension}
        isFirst
      />,
    );
    expect(screen.getByText('你的行业')).toBeInTheDocument();
    expect(screen.getByText('你的产品/服务')).toBeInTheDocument();
    expect(screen.getByText('你目前的阶段')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-industry')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-product')).toBeInTheDocument();
  });

  it('Step 1: 4 stage cards 2x2 grid · label + desc 两行', () => {
    render(
      <DiagnosisStepCard
        {...defaultProps}
        stepIndex={1}
        dimension={basicDimension}
        isFirst
      />,
    );
    // 4 stage cards
    expect(screen.getByTestId('diagnosis-stage-startup')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-stage-growth')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-stage-breakout')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-stage-plateau')).toBeInTheDocument();
    // desc 行渲染
    expect(screen.getByText('刚开始做IP，还在摸索中')).toBeInTheDocument();
    expect(screen.getByText('有一定内容了，但变现不稳定')).toBeInTheDocument();
    expect(screen.getByText('内容有爆款，正在放大变现')).toBeInTheDocument();
    expect(screen.getByText('遇到增长瓶颈，需要突破')).toBeInTheDocument();
  });

  it('Stage card 点击: 调用 onStageChange', () => {
    const onStageChange = vi.fn();
    render(
      <DiagnosisStepCard
        {...defaultProps}
        stepIndex={1}
        dimension={basicDimension}
        isFirst
        onStageChange={onStageChange}
      />,
    );
    fireEvent.click(screen.getByTestId('diagnosis-stage-startup'));
    expect(onStageChange).toHaveBeenCalledWith('startup');
  });

  it('selected checkbox 状态: border-primary class 应用', () => {
    render(
      <DiagnosisStepCard
        {...defaultProps}
        selectedCheckboxes={['已确定赛道方向']}
      />,
    );
    const el = screen.getByTestId('diagnosis-checkbox-已确定赛道方向');
    expect(el.className).toContain('border-[#002fa7]');
  });

  it('textarea placeholder 来自 DIAGNOSIS_DIMENSION_PLACEHOLDERS', () => {
    render(<DiagnosisStepCard {...defaultProps} />);
    const textarea = screen.getByTestId('diagnosis-notes');
    expect(textarea).toHaveAttribute('placeholder');
    // positioning placeholder 包含 "美业赛道"
    expect((textarea as HTMLTextAreaElement).placeholder).toContain('美业赛道');
  });
});
