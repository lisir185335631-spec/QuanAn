/**
 * MyTopics.tsx — /my-topics 我的选题库 · mock-first empty state
 * sally 1:1 复刻 · 简化为 empty state · 无 trpc / 无 Modal / 无 view toggle
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { MyTopicsEmpty } from '@/components/my-topics/MyTopicsEmpty';
import { MyTopicsFilters } from '@/components/my-topics/MyTopicsFilters';
import { MyTopicsHeader } from '@/components/my-topics/MyTopicsHeader';
import { MyTopicsSearchRow } from '@/components/my-topics/MyTopicsSearchRow';
import {
  MY_TOPICS_CTA_HREF,
  MY_TOPICS_TOAST_COPY,
  MY_TOPICS_TOAST_DOWNLOAD,
  type TopicFilterKey,
} from '@/lib/constants/myTopics';

export default function MyTopics() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TopicFilterKey>('all');

  const topics: never[] = [];

  return (
    <main className="flex-1 container mx-auto max-w-6xl py-8 space-y-6" data-testid="my-topics-page">
      <MyTopicsHeader />
      <MyTopicsSearchRow
        value={search}
        onChange={setSearch}
        onCopy={() => toast.info(MY_TOPICS_TOAST_COPY)}
        onDownload={() => toast.info(MY_TOPICS_TOAST_DOWNLOAD)}
      />
      <MyTopicsFilters active={filter} onChange={setFilter} />
      {topics.length === 0 && <MyTopicsEmpty onCta={() => navigate(MY_TOPICS_CTA_HREF)} />}
    </main>
  );
}
