import { useState } from 'react';
import { GUIDE_MODULES, FAQS } from '@/lib/constants/guide';
import type { GuideModule, FAQ } from '@/lib/constants/guide';

const RECOMMENDED_FLOW = [
  { num: '01', title: '分析市场', desc: '爆款库 · 爆款解析掌握趋势' },
  { num: '02', title: '规划变现', desc: '变现模型 · 私域成交设计路径' },
  { num: '03', title: '创作内容', desc: '爆款生成 · 文案分析打磨内容' },
  { num: '04', title: '制作视频', desc: 'AI视频 · 视频制作落地执行' },
  { num: '05', title: '持续优化', desc: '深度学习 · 数据反馈迭代升级' },
];

const SYSTEM_OVERVIEW = [
  { icon: '🤖', title: '智能分析', desc: '13个AI工具全面覆盖内容创作全链路' },
  { icon: '🗺️', title: '系统化流程', desc: '9步IP打造体系从定位到变现' },
  { icon: '📈', title: '数据驱动', desc: '实时追踪持续优化内容创作策略' },
];

function ModuleCard({ mod }: { mod: GuideModule }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-colors border border-border"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{mod.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-label text-sm font-bold text-foreground">{mod.title}</h4>
            <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">
              {expanded ? '−' : '+'}
            </span>
          </div>
          <p className="font-cn text-xs text-muted-foreground mt-1">{mod.desc}</p>
          {expanded && mod.steps && mod.steps.length > 0 && (
            <ol className="mt-3 space-y-1">
              {mod.steps.map((step, i) => (
                <li key={i} className="font-cn text-xs text-foreground/80 flex gap-2">
                  <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-cn text-sm font-medium text-foreground">{faq.q}</span>
        <span className="text-primary font-bold ml-3 flex-shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="font-cn text-sm text-muted-foreground">{faq.a}</p>
        </div>
      )}
    </div>
  );
}

export default function Guide() {
  const [search, setSearch] = useState('');

  const filteredModules = search.trim()
    ? GUIDE_MODULES.filter(
        (m) => m.title.includes(search) || m.desc.includes(search),
      )
    : GUIDE_MODULES;

  return (
    <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen">
      {/* Header */}
      <section className="text-center mb-10">
        <h1 className="font-display text-5xl font-black text-primary tracking-widest mb-4">
          USER GUIDE
        </h1>
        <p className="font-cn text-base text-muted-foreground">
          产品使用说明 · 功能详解 · 最佳实践
        </p>
      </section>

      {/* SearchBox */}
      <section className="mb-10">
        <div className="max-w-md mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索功能说明..."
            className="font-cn w-full px-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:border-primary/40"
          />
        </div>
      </section>

      {/* RecommendedFlow — only visible when no search */}
      {!search.trim() && (
        <section className="mb-10">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center tracking-wider">
            RECOMMENDED FLOW
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {RECOMMENDED_FLOW.map((step, idx) => (
              <div key={step.num} className="flex items-center gap-2">
                <div className="glass-card rounded-xl px-5 py-4 text-center min-w-[120px]">
                  <div className="font-display text-lg font-black text-primary mb-1">
                    {step.num}
                  </div>
                  <div className="font-label text-sm font-bold text-foreground mb-1">
                    {step.title}
                  </div>
                  <div className="font-cn text-xs text-muted-foreground">{step.desc}</div>
                </div>
                {idx < RECOMMENDED_FLOW.length - 1 && (
                  <span className="text-primary font-bold text-xl hidden md:block">→</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SystemOverview — only visible when no search */}
      {!search.trim() && (
        <section className="mb-10">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center tracking-wider">
            SYSTEM OVERVIEW
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {SYSTEM_OVERVIEW.map((card) => (
              <div key={card.title} className="glass-card rounded-xl p-5 text-center">
                <span className="text-3xl block mb-3">{card.icon}</span>
                <h4 className="font-label text-base font-bold text-foreground mb-2">
                  {card.title}
                </h4>
                <p className="font-cn text-sm text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-primary/10 border border-primary/30 px-6 py-4">
            <p className="font-cn text-sm text-primary text-center font-medium">
              💡 实用技巧：完成 IP 打造 9 步后，13 个 AI 工具会根据您的账号数据个性化调优，效果更佳。
            </p>
          </div>
        </section>
      )}

      {/* ModuleCards */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center tracking-wider">
          MODULE GUIDE
        </h2>
        {filteredModules.length === 0 ? (
          <p className="font-cn text-center text-muted-foreground py-8">未找到匹配的功能模块</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((mod) => (
              <ModuleCard key={mod.title} mod={mod} />
            ))}
          </div>
        )}
      </section>

      {/* FAQSection */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center tracking-wider">
          FAQ
        </h2>
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} faq={faq} />
          ))}
        </div>
      </section>
    </main>
  );
}
