/**
 * /knowledge 页面 — AIP文案方法论 1:1 复刻
 * 4 tab(20类脚本 / 20大爆款 / 开头公式 / 核心公式) + 起承转合 footer
 */

import { KnowledgeHeader } from '@/components/knowledge/KnowledgeHeader';
import { KnowledgeTabs } from '@/components/knowledge/KnowledgeTabs';
import { StoryFooter } from '@/components/knowledge/StoryFooter';

export default function Knowledge() {
  return (
    <main className="flex-1 container py-8 max-w-7xl space-y-8">
      <KnowledgeHeader />
      <KnowledgeTabs />
      <StoryFooter />
    </main>
  );
}
