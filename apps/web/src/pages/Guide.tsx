import { useState } from 'react';
import { Link } from 'react-router-dom';

import { FadeInWrapper } from '@/components/FadeInWrapper';
import { Input } from '@/components/ui/input';
import { FUNCTION_MATRIX, FUNCTION_MATRIX_FOOTER } from '@/lib/constants/function-matrix';
import { GUIDE_FAQ_5 } from '@/lib/constants/guide-faq';

const RECOMMENDED_FLOW = [
  { num: '01', title: '深度学习', desc: '上传文档让 AI 学习你的行业知识' },
  { num: '02', title: '设计变现', desc: '定制变现路径和收入结构' },
  { num: '03', title: '创作内容', desc: '生成爆款文案和选题' },
  { num: '04', title: '制作视频', desc: '一键生成分镜表和拍摄计划' },
  { num: '05', title: '私域成交', desc: '完整成交话术和流程设计' },
] as const;

const SYSTEM_OVERVIEW = [
  { title: '什么是AIP智能体', desc: '基于 AI 的 IP 起号 / 内容创作平台 · 9 步标准化向导' },
  { title: '核心定位', desc: 'OPC(One Person Company)创业者 + 个人 IP 起号者' },
  { title: '使用前准备', desc: '准备好账号信息 · 行业知识 · 目标受众画像' },
] as const;

// 13 modules: all FUNCTION_MATRIX cards excluding methodology knowledge base
const ALL_MODULES = FUNCTION_MATRIX.flatMap((g) => g.cards).filter(
  (c) => c.href !== '/knowledge',
);

export default function Guide() {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredModules = searchQuery
    ? ALL_MODULES.filter(
        (m) => m.title.includes(searchQuery) || m.desc.includes(searchQuery),
      )
    : ALL_MODULES;

  return (
    <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen">
      {/* H1 + subtitle */}
      <section className="text-center mb-8">
        <h1 className="font-display text-5xl md:text-6xl font-black text-primary tracking-widest text-center mb-3">
          USER GUIDE
        </h1>
        <p className="font-cn text-lg text-muted-foreground text-center mb-12">
          产品使用说明 · 功能详解 · 最佳实践
        </p>
      </section>

      {/* Search input */}
      <div className="max-w-md mx-auto mb-12">
        <Input
          type="search"
          placeholder="搜索功能说明..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 推荐使用流程 — hidden while searching */}
      {!searchQuery && (
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center tracking-wider">
            推荐使用流程
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {RECOMMENDED_FLOW.map((step, i) => (
              <FadeInWrapper key={step.num} delay={0.05 * i}>
                <div className="glass-card rounded-xl p-4 text-center">
                  <div className="font-display text-lg font-black text-primary mb-1">
                    {step.num}
                  </div>
                  <div className="font-cn text-sm font-bold text-foreground mb-1">
                    {step.title}
                  </div>
                  <div className="font-cn text-xs text-muted-foreground">
                    {step.desc}
                  </div>
                </div>
              </FadeInWrapper>
            ))}
          </div>
        </section>
      )}

      {/* 系统概览 — hidden while searching */}
      {!searchQuery && (
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center tracking-wider">
            系统概览
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SYSTEM_OVERVIEW.map((card) => (
              <div key={card.title} className="glass-card rounded-xl p-5">
                <h4 className="font-label text-base font-bold text-foreground mb-2">
                  {card.title}
                </h4>
                <p className="font-cn text-sm text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 13 模块详解 */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center tracking-wider">
          13 模块详解
        </h2>
        {filteredModules.length === 0 ? (
          <p className="font-cn text-center text-muted-foreground py-8">
            未找到匹配的功能模块
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((card, cIdx) => (
              <FadeInWrapper key={card.href} delay={0.03 * cIdx}>
                <Link
                  to={card.href}
                  className="glass-card cursor-pointer rounded-xl p-4 block border border-border hover:border-primary/40 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{card.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-label text-sm font-bold text-foreground">
                        {card.title}
                      </h4>
                      <p className="font-cn text-xs text-muted-foreground mt-1">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              </FadeInWrapper>
            ))}
          </div>
        )}

        {/* Footer card — 使用说明 (max-w-md mx-auto, single) */}
        {!searchQuery && (
          <div className="max-w-md mx-auto mt-6">
            <Link
              to={FUNCTION_MATRIX_FOOTER.href}
              className="glass-card cursor-pointer rounded-xl p-4 block border border-border hover:border-primary/40 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{FUNCTION_MATRIX_FOOTER.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-label text-sm font-bold text-foreground">
                    {FUNCTION_MATRIX_FOOTER.title}
                  </h4>
                  <p className="font-cn text-xs text-muted-foreground mt-1">
                    {FUNCTION_MATRIX_FOOTER.desc}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* FAQ 常见问题 */}
      <section className="mb-16">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center tracking-wider">
          FAQ 常见问题
        </h2>
        <div className="max-w-3xl mx-auto space-y-2">
          {GUIDE_FAQ_5.map((faq) => (
            <details key={faq.q} className="glass-card rounded-xl overflow-hidden">
              <summary className="px-5 py-4 cursor-pointer font-cn text-sm font-medium text-foreground hover:bg-muted/20 transition-colors list-none flex items-center justify-between">
                <span>{faq.q}</span>
                <span className="text-primary font-bold ml-3 flex-shrink-0 select-none">+</span>
              </summary>
              <div className="px-5 pb-4 pt-0">
                <p className="font-cn text-sm text-muted-foreground">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
