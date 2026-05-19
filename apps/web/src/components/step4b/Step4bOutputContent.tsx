import { FadeInWrapper } from '@/components/FadeInWrapper';
import {
  STEP4B_OUTPUT_H3_5,
  STEP4B_STAGE_FOLLOWER_RANGES,
  STEP4B_STAGE_REVENUE_ESTIMATES,
  type Step4bResult,
  type Step4bStageDetail,
} from '@/lib/constants/step4b';

export type { Step4bResult };

// ── Stage card: 粉丝量级 + 月收入预估 + 具体方式 ─────────────────────────────

interface StageBlockProps {
  stage: Step4bStageDetail;
  followerRange: string;
  revenueEstimate: string;
}

function StageBlock({ stage, followerRange, revenueEstimate }: StageBlockProps) {
  const methods = stage.coreStrategy
    ? stage.coreStrategy.split(/[、，,]/).map((s) => s.trim()).filter(Boolean)
    : stage.keyActions.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-card rounded-lg p-4">
          <p className="text-body-xs font-label text-primary uppercase tracking-wide mb-1">粉丝量级</p>
          <p className="text-body-sm font-medium text-on-surface">{followerRange}</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <p className="text-body-xs font-label text-primary uppercase tracking-wide mb-1">月收入预估</p>
          <p className="text-body-sm font-medium text-on-surface">{revenueEstimate}</p>
        </div>
      </div>
      <div>
        <p className="text-body-xs font-label text-on-surface uppercase tracking-wide mb-2">具体方式</p>
        <ul className="space-y-1.5">
          {methods.map((method, i) => (
            <li key={i} className="flex gap-2 text-body-sm text-muted-foreground">
              <span className="text-primary shrink-0 mt-0.5">✓</span>
              {method}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  result: Step4bResult;
}

export default function Step4bOutputContent({ result }: Props) {
  const stages = result.three_stages;

  return (
    <section className="space-y-4">
      {/* 初阶变现路径 */}
      <FadeInWrapper delay={0.05 * 0} from="up">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display text-xl text-on-surface mb-4">{STEP4B_OUTPUT_H3_5[0].h3Label}</h3>
          <StageBlock
            stage={stages[0]}
            followerRange={STEP4B_STAGE_FOLLOWER_RANGES[0]}
            revenueEstimate={STEP4B_STAGE_REVENUE_ESTIMATES[0]}
          />
        </div>
      </FadeInWrapper>

      {/* 中阶变现路径 */}
      <FadeInWrapper delay={0.05 * 1} from="up">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display text-xl text-on-surface mb-4">{STEP4B_OUTPUT_H3_5[1].h3Label}</h3>
          <StageBlock
            stage={stages[1]}
            followerRange={STEP4B_STAGE_FOLLOWER_RANGES[1]}
            revenueEstimate={STEP4B_STAGE_REVENUE_ESTIMATES[1]}
          />
        </div>
      </FadeInWrapper>

      {/* 高阶变现路径 */}
      <FadeInWrapper delay={0.05 * 2} from="up">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display text-xl text-on-surface mb-4">{STEP4B_OUTPUT_H3_5[2].h3Label}</h3>
          <StageBlock
            stage={stages[2]}
            followerRange={STEP4B_STAGE_FOLLOWER_RANGES[2]}
            revenueEstimate={STEP4B_STAGE_REVENUE_ESTIMATES[2]}
          />
        </div>
      </FadeInWrapper>

      {/* 收入结构分析 */}
      <FadeInWrapper delay={0.05 * 3} from="up">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display text-xl text-on-surface mb-4">{STEP4B_OUTPUT_H3_5[3].h3Label}</h3>
          <ul className="space-y-4">
            {result.revenue_structure.map((item, i) => (
              <li key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium text-on-surface">{item.category}</span>
                  <span className="text-body-sm font-label text-primary">{item.percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-primary/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <p className="text-body-xs text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </FadeInWrapper>

      {/* 成功案例参考 */}
      <FadeInWrapper delay={0.05 * 4} from="up">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display text-xl text-on-surface mb-4">{STEP4B_OUTPUT_H3_5[4].h3Label}</h3>
          <ul className="space-y-3">
            {result.success_cases.map((c, i) => (
              <li key={i} className="glass-card rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-label text-primary">{c.name}</span>
                  {c.type && (
                    <>
                      <span className="text-body-xs text-muted-foreground">·</span>
                      <span className="text-body-xs text-muted-foreground">{c.type}</span>
                    </>
                  )}
                </div>
                <p className="text-body-sm text-muted-foreground">{c.journey}</p>
                <p className="text-body-sm font-medium text-on-surface">{c.result}</p>
                {c.insight && (
                  <p className="text-body-xs text-primary/80 italic">{c.insight}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </FadeInWrapper>
    </section>
  );
}
