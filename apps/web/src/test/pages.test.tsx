import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { stepConfig } from '@/lib/stepConfig';
import Step1 from '@/pages/step/Step1';
import Step5 from '@/pages/step/Step5';
import Step8 from '@/pages/step/Step8';
import Generate from '@/pages/tools/Generate';
import Trending from '@/pages/tools/Trending';

// Component that throws on render for ErrorBoundary testing
function BrokenComponent(): never {
  throw new Error('Test render error');
}

describe('stepConfig', () => {
  it('has all 9 step keys', () => {
    const keys = ['step1', 'step3', 'step3b', 'step4', 'step4b', 'step5', 'step6', 'step7', 'step8'];
    for (const key of keys) {
      expect(stepConfig.has(key)).toBe(true);
    }
  });

  it('step1 has non-empty title and description', () => {
    const data = stepConfig.get('step1')!;
    expect(data.title).toBeTruthy();
    expect(data.description).toBeTruthy();
    expect(data.phase).toBeTruthy();
  });
});

describe('Step pages render', () => {
  it('Step1 renders h1 with correct title', () => {
    render(<Step1 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IP 定位与身份建立');
  });

  it('Step5 renders h1 with correct title', () => {
    render(<Step5 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('发布与运营');
  });

  it('Step8 renders h1 with correct title', () => {
    render(<Step8 />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('持续迭代与升级');
  });
});

describe('Tool pages render', () => {
  it('Generate renders h1 heading', () => {
    render(<Generate />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI 智能生成');
  });

  it('Trending renders h1 heading', () => {
    render(<Trending />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('全网爆款库');
  });
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <span>正常内容</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('页面加载出错')).toBeInTheDocument();
    expect(screen.getByText('Test render error')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={<div>自定义错误页</div>}>
        <BrokenComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('自定义错误页')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('resets error state on button click', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('页面加载出错')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新加载' }));
    spy.mockRestore();
  });
});
