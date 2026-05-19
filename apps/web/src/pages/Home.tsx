import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StepProgress, STEP_ORDER_KEYS } from '@/components/StepProgress';
import { trpc } from '@/lib/trpc';
import { FUNCTION_MATRIX, FUNCTION_MATRIX_FOOTER } from '@/lib/constants/function-matrix';
import { WORKFLOW_STEPS } from '@/lib/constants/workflow';
import { FadeInWrapper } from '@/components/FadeInWrapper';

function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-20">
      <h1
        className="font-display text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary to-primary/60 mb-8 tracking-tight"
        style={{ WebkitTextStroke: '1px var(--primary)' }}
      >
        AI+短视频+IP
      </h1>

      <p className="font-cn text-lg text-muted-foreground mb-2">OPC全案落地，从流量到成交</p>
      <p className="font-cn text-lg text-muted-foreground mb-2">AI+短视频+IP</p>
      <p className="font-cn text-lg text-muted-foreground mb-2">全链路变现</p>

      <p className="font-cn italic text-sm text-muted-foreground/70 mb-8">
        "重新构造一个人是怎样不变形的"
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link to="/step/1">
          <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-base">
            启动智能分析
          </Button>
        </Link>
        <Link to="/guide">
          <Button
            variant="outline"
            className="font-cn border-primary/30 text-primary hover:bg-primary/10 px-6 py-3 text-base"
          >
            使用说明
          </Button>
        </Link>
      </div>
    </section>
  );
}

function IpProgressSection() {
  const { data: progress, isLoading } = trpc.stepData.progress.useQuery();
  const completed = progress?.completedSteps ?? [];
  const percent = Math.round((completed.length / 9) * 100);

  const nextStepKey = STEP_ORDER_KEYS.find((k) => !(completed as string[]).includes(k));
  const nextStepNum = nextStepKey?.replace('step', '');

  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-foreground mb-4">我的IP打造进度</h2>
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-cn text-sm text-muted-foreground">
            已完成 <span className="text-primary font-bold">{completed.length}</span> / 9 步
          </span>
          <span className="text-primary font-bold">{percent}%</span>
        </div>

        <div className="w-full h-3 bg-muted/20 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <StepProgress completedSteps={completed} isLoading={isLoading} />

        <div className="flex gap-3 mt-6 flex-wrap">
          <Link to="/ip-plan">
            <Button variant="outline" className="font-cn border-primary/30 text-primary hover:bg-primary/10">
              查看IP方案
            </Button>
          </Link>
          {nextStepNum && (
            <Link to={`/step/${nextStepNum}`}>
              <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90">
                继续
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function FunctionMatrixSection() {
  return (
    <section className="mt-16">
      <h2 className="font-display text-4xl font-black text-center text-primary tracking-widest mb-12">
        FUNCTION MATRIX
      </h2>

      {FUNCTION_MATRIX.map((group) => (
        <div key={group.title} className="mb-10">
          <h3 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="inline-block w-1 h-5 bg-primary rounded-full" />
            {group.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.cards.map((card, cIdx) => (
              <FadeInWrapper key={card.href} delay={0.05 * cIdx} from="up">
                <Link to={card.href}>
                  <div className="glass-card rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer h-full">
                    <div className="text-3xl mb-3">{card.icon}</div>
                    <div className="font-display text-base font-bold text-foreground mb-1">{card.title}</div>
                    <div className="font-cn text-xs text-muted-foreground">{card.desc}</div>
                  </div>
                </Link>
              </FadeInWrapper>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-10 max-w-md mx-auto">
        <FadeInWrapper delay={0.3}>
          <Link to={FUNCTION_MATRIX_FOOTER.href}>
            <div className="glass-card rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer">
              <div className="text-3xl mb-3">{FUNCTION_MATRIX_FOOTER.icon}</div>
              <div className="font-display text-base font-bold text-foreground mb-1">{FUNCTION_MATRIX_FOOTER.title}</div>
              <div className="font-cn text-xs text-muted-foreground">{FUNCTION_MATRIX_FOOTER.desc}</div>
            </div>
          </Link>
        </FadeInWrapper>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="mt-16">
      <h2 className="font-display text-4xl font-black text-center text-primary tracking-widest mb-4">
        WORKFLOW
      </h2>
      <p className="font-cn text-center text-sm text-muted-foreground mb-12">
        规范流程加上一站式短视频创作系统
      </p>

      <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-2">
        {WORKFLOW_STEPS.map((step, i) => (
          <FadeInWrapper key={step.num} delay={0.1 * i}>
            <div className="flex md:flex-row items-center">
              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center mb-3">
                  <span className="font-display text-sm font-bold text-primary">{step.num}</span>
                </div>
                <span className="font-cn font-bold text-sm text-foreground mb-1">{step.title}</span>
                <span className="font-cn text-xs text-muted-foreground">{step.desc}</span>
              </div>
              {i < 6 && (
                <div className="hidden md:flex items-center self-center w-8 shrink-0">
                  <div className="w-full h-px bg-primary/20" />
                </div>
              )}
            </div>
          </FadeInWrapper>
        ))}
      </div>
    </section>
  );
}

function ReadyToStartSection() {
  return (
    <section className="text-center py-16 mb-8">
      <h2 className="font-display text-4xl md:text-5xl font-black text-primary tracking-widest mb-4">
        READY TO START?
      </h2>
      <p className="font-cn text-lg text-muted-foreground mb-8">是时候开始了，IP 打造在等你</p>
      <Link to="/step/1">
        <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-4 text-lg">
          立即启动 →
        </Button>
      </Link>
    </section>
  );
}

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen">
      <HeroSection />
      <IpProgressSection />
      <FunctionMatrixSection />
      <WorkflowSection />
      <ReadyToStartSection />
    </main>
  );
}
