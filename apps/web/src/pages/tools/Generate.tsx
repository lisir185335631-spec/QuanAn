/**
 * Generate.tsx — /generate 生成爆款文案 · 1:1 复刻 aiipznt.vip/generate
 * mock-first · 2 col layout · 20 script card + 23 element chip + 8 段 mock 文案
 */

import { useState } from 'react';

import {
  GENERATE_DEFAULT_ELEMENT_KEYS,
  GENERATE_DEFAULT_SCRIPT_KEY,
  GENERATE_TOPIC_DEFAULT,
} from '@/lib/constants/generatePage';

import { GenerateElementsPicker } from './components/generate/GenerateElementsPicker';
import { GenerateHero } from './components/generate/GenerateHero';
import { GenerateResult } from './components/generate/GenerateResult';
import { GenerateScriptPicker } from './components/generate/GenerateScriptPicker';
import { GenerateTopicForm } from './components/generate/GenerateTopicForm';

export default function Generate() {
  const [scriptKey, setScriptKey] = useState<string>(GENERATE_DEFAULT_SCRIPT_KEY);
  const [elementKeys, setElementKeys] = useState<string[]>([...GENERATE_DEFAULT_ELEMENT_KEYS]);
  const [topic, setTopic] = useState<string>(GENERATE_TOPIC_DEFAULT);

  return (
    <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
      <GenerateHero />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-6">
          <GenerateScriptPicker value={scriptKey} onChange={setScriptKey} />
          <GenerateElementsPicker value={elementKeys} onChange={setElementKeys} />
          <GenerateTopicForm value={topic} onChange={setTopic} />
        </div>
        <GenerateResult />
      </div>
    </main>
  );
}
