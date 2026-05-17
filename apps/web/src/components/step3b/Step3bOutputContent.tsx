import { cn } from '@/lib/utils';

// Result types matching mock data structure (AC-9)
export interface Step3bCoreIdentity {
  persona?: string;
  slogan?: string;
  differentiation?: string;
  memoryPoints?: string[];
  personality?: string;
}

export interface Step3bThoughtSystem {
  coreIdeas?: string[];
  uniqueViews?: string[];
  catchphrases?: string[];
}

export interface Step3bContentPersona {
  speakingStyle?: string;
  sampleScript?: string;
  visualStyle?: string;
  contentPillars?: string[];
}

export interface Step3bTrustSystem {
  endorsements?: string[];
  socialProof?: string;
  personalStory?: string;
}

export interface Step3bRoadmapPhase {
  label: string;    // e.g. '0-1个月'
  goal: string;
  keyResults: string[];
}

export interface Step3bPersonaRoadmap {
  phases?: Step3bRoadmapPhase[];
}

export interface Step3bResult {
  coreIdentity?: Step3bCoreIdentity;
  thoughtSystem?: Step3bThoughtSystem;
  contentPersona?: Step3bContentPersona;
  trustSystem?: Step3bTrustSystem;
  roadmap?: Step3bPersonaRoadmap;
}

function StringList({ items }: { items?: string[] }) {
  if (!items?.length) return <p className="text-body-sm text-muted-foreground">—</p>;
  return (
    <ul className="space-y-1">
      {items.map((s, i) => (
        <li key={i} className="text-body-sm text-muted-foreground flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          {s}
        </li>
      ))}
    </ul>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-body-xs font-medium text-on-surface">{label}</p>
      <p className="text-body-sm text-muted-foreground leading-relaxed">{value ?? '—'}</p>
    </div>
  );
}

interface Props {
  blockId: 'coreIdentity' | 'ideologySystem' | 'contentPersona' | 'trustSystem' | 'personaRoadmap';
  result: Step3bResult;
  className?: string;
}

export default function Step3bOutputContent({ blockId, result, className }: Props) {
  return (
    <div className={cn('space-y-3', className)}>
      {blockId === 'coreIdentity' && (
        <>
          <Field label="人设定位" value={result.coreIdentity?.persona} />
          <Field label="Slogan" value={result.coreIdentity?.slogan} />
          <Field label="差异化" value={result.coreIdentity?.differentiation} />
          <div className="space-y-1">
            <p className="text-body-xs font-medium text-on-surface">记忆点</p>
            <StringList items={result.coreIdentity?.memoryPoints} />
          </div>
          <Field label="性格标签" value={result.coreIdentity?.personality} />
        </>
      )}

      {blockId === 'ideologySystem' && (
        <>
          <div className="space-y-1">
            <p className="text-body-xs font-medium text-on-surface">核心理念</p>
            <StringList items={result.thoughtSystem?.coreIdeas} />
          </div>
          <div className="space-y-1">
            <p className="text-body-xs font-medium text-on-surface">独特观点</p>
            <StringList items={result.thoughtSystem?.uniqueViews} />
          </div>
          <div className="space-y-1">
            <p className="text-body-xs font-medium text-on-surface">口头禅</p>
            <StringList items={result.thoughtSystem?.catchphrases} />
          </div>
        </>
      )}

      {blockId === 'contentPersona' && (
        <>
          <Field label="表达风格" value={result.contentPersona?.speakingStyle} />
          <Field label="示例脚本" value={result.contentPersona?.sampleScript} />
          <Field label="视觉风格" value={result.contentPersona?.visualStyle} />
          <div className="space-y-1">
            <p className="text-body-xs font-medium text-on-surface">内容支柱</p>
            <StringList items={result.contentPersona?.contentPillars} />
          </div>
        </>
      )}

      {blockId === 'trustSystem' && (
        <>
          <div className="space-y-1">
            <p className="text-body-xs font-medium text-on-surface">背书资源</p>
            <StringList items={result.trustSystem?.endorsements} />
          </div>
          <Field label="社会证明" value={result.trustSystem?.socialProof} />
          <Field label="个人故事" value={result.trustSystem?.personalStory} />
        </>
      )}

      {blockId === 'personaRoadmap' && (
        <div className="space-y-4">
          {result.roadmap?.phases?.map((phase, i) => (
            <div key={i} className="space-y-2">
              <p className="text-body-sm font-semibold text-primary">{phase.label}</p>
              <p className="text-body-xs font-medium text-on-surface">目标：{phase.goal}</p>
              <StringList items={phase.keyResults} />
            </div>
          )) ?? <p className="text-body-sm text-muted-foreground">—</p>}
        </div>
      )}
    </div>
  );
}
