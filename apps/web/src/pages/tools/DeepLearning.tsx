/**
 * DeepLearning.tsx — /tools/deep-learning · 1:1 复刻 aiipznt.vip/deep-learning
 * mock-first · 0 backend · default 1 完成档案 + empty form
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { ArchiveCard } from '@/components/deep-learning/ArchiveCard';
import { DeepLearningHeader } from '@/components/deep-learning/DeepLearningHeader';
import { EmptyArchives } from '@/components/deep-learning/EmptyArchives';
import { SampleForm } from '@/components/deep-learning/SampleForm';
import { UsageInstructions } from '@/components/deep-learning/UsageInstructions';
import {
  DL_ARCHIVE_MOCK,
  DL_ARCHIVES_TITLE_PREFIX,
  DL_TOAST_START,
} from '@/lib/constants/deep-learning';

export default function DeepLearning() {
  const [text, setText] = useState('');
  const [archiveName, setArchiveName] = useState('');

  const archives = [DL_ARCHIVE_MOCK]; // mock-first · default 1 archive

  return (
    <main
      data-testid="deep-learning-page"
      className="flex-1 container py-8 max-w-5xl mx-auto space-y-8"
    >
      <DeepLearningHeader />

      <SampleForm
        text={text}
        onTextChange={setText}
        archiveName={archiveName}
        onArchiveNameChange={setArchiveName}
        sampleCount={0}
        onStart={() => toast.info(DL_TOAST_START)}
      />

      <div className="space-y-4">
        <h2
          data-testid="archives-heading"
          className="text-xl font-bold text-foreground"
        >
          {DL_ARCHIVES_TITLE_PREFIX} ({archives.length})
        </h2>
        {archives.length === 0 ? (
          <EmptyArchives />
        ) : (
          archives.map((archive) => (
            <ArchiveCard key={archive.id} archive={archive} />
          ))
        )}
      </div>

      <UsageInstructions />
    </main>
  );
}
