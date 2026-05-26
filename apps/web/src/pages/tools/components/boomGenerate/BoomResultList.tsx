import { type BoomEntry } from '@/lib/constants/boomGenerate';
import { BoomResultEntry } from './BoomResultEntry';

interface BoomResultListProps {
  entries: ReadonlyArray<BoomEntry>;
}

export function BoomResultList({ entries }: BoomResultListProps) {
  return (
    <div className="space-y-6 mt-8">
      {entries.map((entry) => (
        <BoomResultEntry key={entry.index} entry={entry} />
      ))}
    </div>
  );
}
