/**
 * KnowledgeTabs — 4 tab(MessageCircle/Zap/BookOpen/Lightbulb icon) · shadcn <Tabs>
 * SPEC §9
 */

import { BookOpen, Lightbulb, MessageCircle, Zap } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KNOWLEDGE_PAGE } from '@/lib/constants/knowledgePage';

import { CoreTab } from './CoreTab';
import { ElementsTab } from './ElementsTab';
import { OpeningTab } from './OpeningTab';
import { ScriptTab } from './ScriptTab';

export function KnowledgeTabs() {
  return (
    <Tabs defaultValue="scripts" data-testid="knowledge-tabs">
      <TabsList className="mb-6">
        <TabsTrigger value="scripts" data-testid="tab-scripts">
          <MessageCircle className="w-4 h-4 mr-1.5" />
          {KNOWLEDGE_PAGE.tabs.scripts}
        </TabsTrigger>
        <TabsTrigger value="elements" data-testid="tab-elements">
          <Zap className="w-4 h-4 mr-1.5" />
          {KNOWLEDGE_PAGE.tabs.elements}
        </TabsTrigger>
        <TabsTrigger value="opening" data-testid="tab-opening">
          <BookOpen className="w-4 h-4 mr-1.5" />
          {KNOWLEDGE_PAGE.tabs.opening}
        </TabsTrigger>
        <TabsTrigger value="core" data-testid="tab-core">
          <Lightbulb className="w-4 h-4 mr-1.5" />
          {KNOWLEDGE_PAGE.tabs.core}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="scripts" data-testid="tab-content-scripts">
        <ScriptTab />
      </TabsContent>

      <TabsContent value="elements" data-testid="tab-content-elements">
        <ElementsTab />
      </TabsContent>

      <TabsContent value="opening" data-testid="tab-content-opening">
        <OpeningTab />
      </TabsContent>

      <TabsContent value="core" data-testid="tab-content-core">
        <CoreTab />
      </TabsContent>
    </Tabs>
  );
}
