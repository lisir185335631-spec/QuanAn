/**
 * History.tsx — /history 历史记录页 · sally 1:1 复刻
 * mock-first 4 entry · vertical list · SPEC §5
 */

import { toast } from 'sonner';

import { HistoryHeader } from '@/components/history/HistoryHeader';
import { HistoryList } from '@/components/history/HistoryList';
import {
  HISTORY_MOCK,
  HISTORY_TOAST_COPY,
  HISTORY_TOAST_DELETE,
  HISTORY_TOAST_VIEW,
} from '@/lib/constants/historyPage';

export default function History() {
  return (
    <main className="flex-1 container mx-auto max-w-5xl py-8 space-y-6">
      <HistoryHeader count={HISTORY_MOCK.length} />
      <HistoryList
        entries={HISTORY_MOCK}
        onView={() => toast.info(HISTORY_TOAST_VIEW)}
        onCopy={(topic) => {
          void navigator.clipboard.writeText(topic).catch(() => {});
          toast.success(HISTORY_TOAST_COPY);
        }}
        onDelete={() => toast.info(HISTORY_TOAST_DELETE)}
      />
    </main>
  );
}
