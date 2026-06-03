# SPEC · /voice-chat 1:1 复刻

> **目标** · `apps/web/src/pages/tools/VoiceChat.tsx` 全文 rewrite · 简化 PRD-25 真 trpc 完整版 → sally 真实页(chip + 顶部 2 btn + 2 mock message + 底部 input)
> **截图** · 5 张(view 1-4 长 IP guide 是 LLM 实时输出 · 非 mock · view 5 = sally 真实默认状态)
> **范围** · 仅 view 5 短欢迎 mock(~150 字 generic welcome) · 不 reproduce view 1-4 长 sally 咨询内容(那是 LLM 真实接入时产生 · 不属于 default mock)
> **风险** · L(简单 chat 视觉 · 0 backend · 0 stream)

---

## §1 · 背景 + 6 大偏离

### 1.1 sally 真实页结构

- **URL** · `aiipznt.vip/voice-chat`
- **header** · 复用 AIP AGENT logo + nav + 赵语AI/sally zhao + logout
- **正文** · 居中 max-w-4xl ·
  1. 顶部 row · 左 chip(麦克风 icon + VOICE CHAT 金大字 + subtitle) · 右 2 圆 btn(Volume2 / Trash2)
  2. 消息滚动区(2 mock message · default state)
  3. 底部 input row · mic icon(圆 btn 金底) + 输入框(灰边 + placeholder) + send icon(圆 btn 金底)

### 1.2 6 大偏离(现状 PRD-25 → sally)

| # | 偏离点 | 现状(PRD-25) | sally 真实 |
|:-:|---|---|---|
| **1** | header 结构 | "智能" uppercase chip + H1 + subtitle + 6 quick prompts | chip card(麦克风 icon + VOICE CHAT 大字 + 副标题 2 行)+ 右 2 圆 btn |
| **2** | 6 quick prompts | 有(VOICE_CHAT_QUICK_PROMPTS_6) | **无** · sally 真实页无 prompts(纯默认空状态 · 用户主动输入) |
| **3** | 默认 mock message | 无 mock · 默认空 history | 2 mock · user "Hello Hello你好你好" + AI welcome short |
| **4** | trpc 集成 | `useSubscription` 实时 stream + chunk 处理 + typing indicator | mock-first · 0 backend · 点 send = toast 提示(LLM 接入留 PRR) |
| **5** | history 持久化 | localStorage `acc_*_voice_chat_history` | 无 history(只有当前 mock · 顶部 trash btn 清空 toast) |
| **6** | input 视觉 | textarea + Send icon + 取消 button + tokensUsed footer | mic 圆 btn 左 + 输入框 + send 圆 btn 右 · 简化 |

### 1.3 strategy

- mock-first(同 step5/Diagnosis/DailyTasks/AiVideo 已成功模式)· 默认 render 2 mock message · 0 fetch
- 简化 · 删 trpc useSubscription + chunk 处理 + history + typing indicator + 6 prompts 全部
- 保留 input + send 视觉(纯 demo · 点 send toast `AI 对话 · 即将上线`)
- 顶部 trash btn · click · toast `清空对话 · 即将上线`(纯视觉)
- volume btn · 同 toast(纯视觉 · 不实现静音)

---

## §2 · 视觉规范

### 2.1 Icon 映射(lucide-react)

| 用途 | lucide icon |
|---|---|
| chip 主 icon | `Mic` 金 |
| chip card 边框 | 金 |
| 顶部 audio btn | `Volume2` 金 |
| 顶部 trash btn | `Trash2` 金 |
| message 播放 btn | `Volume2` 金 |
| message 复制 btn | `Copy` 金 |
| input 左 mic 圆 btn | `Mic` 黑(金底) |
| input send 圆 btn | `Send` 黑(金底) |

### 2.2 layout

- main · `max-w-4xl mx-auto py-8 space-y-6`
- header row · `flex justify-between items-center` · 左 chip card · 右 2 btn(`gap-2`)
- chip card · `flex items-center gap-4 rounded-xl border border-primary/40 bg-card p-4`
- mic icon 容器 · w-12 h-12 圆 + 金边 + 金 icon
- 标题区 · 右 · VOICE CHAT 大金字(text-2xl/3xl bold)+ 副标题 灰
- 顶部 2 btn · 圆 w-10 h-10 + border-border + 金 icon hover
- 消息区 · `space-y-6` · user 右 / AI 左
- user bubble · 右对齐 · max-w-2xl · 金底 bg-primary/30 + 圆角 + p-4 + timestamp 灰
- AI bubble · 左对齐 · max-w-3xl · 灰底 bg-card/60 + 边框 + 圆角 + p-4 + timestamp + 播放 + 复制 btn 底
- input row · `flex items-center gap-3` + 全宽 · 圆角 border
- input mic 左 · w-12 h-12 圆 + 金底 + 黑 icon
- input 输入框 · flex-1 + bg-card + border-border + placeholder text-muted
- input send 右 · w-12 h-12 圆 + 金底 + 黑 icon

### 2.3 颜色

- chip · 金边 + bg-card + 标题金 + subtitle 灰
- user bubble · 金底淡(bg-primary/20) + 白字 · 右对齐
- AI bubble · 深灰(bg-card/60) + 白字 · 边框 border-border · 左对齐
- 顶部 / 底部 btn · 金 icon · hover bg-card

---

## §3 · 字面源(完整)

### 3.1 chip card

- title · `VOICE CHAT`(white bold uppercase tracking-wide text-2xl)
- subtitle · `语音对话 · 你的专属IP变现顾问`(灰 text-sm 1 行)

### 3.2 顶部 2 btn

- btn 1 · `Volume2` icon(无文字)
- btn 2 · `Trash2` icon(无文字)
- btn 1 click · toast `音频播放 · 即将上线`
- btn 2 click · toast `清空对话 · 即将上线`

### 3.3 mock 2 message(default state)

| index | role | content | timestamp |
|:-:|---|---|:-:|
| 1 | `user` | `Hello Hello你好你好` | `10:53` |
| 2 | `assistant` | (welcome 短文 · 3 段 · ~150 字) | `10:53` |

assistant welcome content(3 段)·

```
哈喽哈喽！老铁你好！很高兴能在这里跟你聊聊。

我是你的AIP智能体，一个专门帮你把IP玩转起来、实现变现的实战导师。有什么关于短视频、直播、IP打造或者美业变现的问题，尽管开口问我！

别客气，直接说你的困惑或者想了解什么，我都在这儿听着呢！咱们直接上干货，帮你把问题解决掉！
```

assistant bubble 底部 row · timestamp + `Volume2` btn(`播放`) + `Copy` btn(`复制`)

### 3.4 input row

- left mic 圆 btn(无文字 · `Mic` icon)
- 输入框 placeholder · `有什么问题尽管问我...`
- right send 圆 btn(无文字 · `Send` icon)
- 点 send · 若输入框有文本 toast `AI 对话 · 即将上线` · 若空 disabled
- 点 mic btn · toast `语音输入 · 即将上线`

---

## §4 · constants 改动

### 4.1 `lib/constants/voice-chat.ts` · 大改

```ts
// 删 VOICE_CHAT_QUICK_PROMPTS_6 + VOICE_CHAT_INTRO 全部

// ── chip + subtitle ──────────────────────────────────────────────────────────
export const VOICE_CHAT_CHIP_TITLE = 'VOICE CHAT' as const;
export const VOICE_CHAT_CHIP_SUBTITLE = '语音对话 · 你的专属IP变现顾问' as const;

// ── input ────────────────────────────────────────────────────────────────────
export const VOICE_CHAT_INPUT_PLACEHOLDER = '有什么问题尽管问我...' as const;

// ── action labels ────────────────────────────────────────────────────────────
export const VOICE_CHAT_LABEL_PLAY = '播放' as const;
export const VOICE_CHAT_LABEL_COPY = '复制' as const;

// ── toast texts(LLM 接入留 PRR) ─────────────────────────────────────────────
export const VOICE_CHAT_TOAST_AUDIO = '音频播放 · 即将上线' as const;
export const VOICE_CHAT_TOAST_CLEAR = '清空对话 · 即将上线' as const;
export const VOICE_CHAT_TOAST_VOICE = '语音输入 · 即将上线' as const;
export const VOICE_CHAT_TOAST_SEND = 'AI 对话 · 即将上线' as const;

// ── mock messages (default state) ────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant';

export interface MockMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export const VOICE_CHAT_MOCK_MESSAGES: ReadonlyArray<MockMessage> = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello Hello你好你好',
    timestamp: '10:53',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: '哈喽哈喽！老铁你好！很高兴能在这里跟你聊聊。\n\n我是你的AIP智能体，一个专门帮你把IP玩转起来、实现变现的实战导师。有什么关于短视频、直播、IP打造或者美业变现的问题，尽管开口问我！\n\n别客气，直接说你的困惑或者想了解什么，我都在这儿听着呢！咱们直接上干货，帮你把问题解决掉！',
    timestamp: '10:53',
  },
];
```

---

## §5 · sub-component 设计

### 5.1 新建组件(`apps/web/src/components/voice-chat/`)

| 文件 | 用途 | 行数估 |
|---|---|:-:|
| `VoiceChatChip.tsx` | chip card(Mic icon + title + subtitle) | ~25 |
| `MessageBubble.tsx` | 单 message bubble(user 右金 / assistant 左灰 + timestamp + play/copy btn for assistant) | ~50 |
| `VoiceChatInput.tsx` | input row(mic 圆 btn + textarea + send 圆 btn) | ~50 |

---

## §6 · page rewrite

### 6.1 `apps/web/src/pages/tools/VoiceChat.tsx` · 全文 rewrite(492 → ~80 行)

```tsx
import { Trash2, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { MessageBubble } from '@/components/voice-chat/MessageBubble';
import { VoiceChatChip } from '@/components/voice-chat/VoiceChatChip';
import { VoiceChatInput } from '@/components/voice-chat/VoiceChatInput';
import {
  VOICE_CHAT_MOCK_MESSAGES,
  VOICE_CHAT_TOAST_AUDIO,
  VOICE_CHAT_TOAST_CLEAR,
  VOICE_CHAT_TOAST_SEND,
  VOICE_CHAT_TOAST_VOICE,
} from '@/lib/constants/voice-chat';

export default function VoiceChat() {
  const [input, setInput] = useState('');

  return (
    <main className="flex-1 container py-8 max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <VoiceChatChip />
        <div className="flex items-center gap-2 shrink-0 pt-2">
          <button
            type="button"
            onClick={() => toast.info(VOICE_CHAT_TOAST_AUDIO)}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary hover:bg-card"
            data-testid="voice-chat-audio-btn"
            aria-label="音频"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => toast.info(VOICE_CHAT_TOAST_CLEAR)}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary hover:bg-card"
            data-testid="voice-chat-clear-btn"
            aria-label="清空"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6 min-h-[400px]">
        {VOICE_CHAT_MOCK_MESSAGES.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      <VoiceChatInput
        value={input}
        onChange={setInput}
        onMicClick={() => toast.info(VOICE_CHAT_TOAST_VOICE)}
        onSend={() => {
          if (input.trim()) {
            toast.info(VOICE_CHAT_TOAST_SEND);
          }
        }}
      />
    </main>
  );
}
```

删除 ·
- `trpc.voiceChat.start.useSubscription`
- `chunk` 类型处理(meta/delta/tool_call/tool_result/done)
- TypingIndicator 组件
- HistoryItem 组件 + history state + localStorage 持久化
- VOICE_CHAT_QUICK_PROMPTS_6 引用
- useActiveAccount / cancel button / tokensUsed footer

---

## §7 · 文件清单

| 文件 | 操作 | 行数估 |
|---|:-:|:-:|
| `lib/constants/voice-chat.ts` | **大改**(删旧 stub + 加 7 字面 const + 2 mock message) | +~50 / -18 |
| `components/voice-chat/VoiceChatChip.tsx` | **新建** | ~25 |
| `components/voice-chat/MessageBubble.tsx` | **新建** | ~50 |
| `components/voice-chat/VoiceChatInput.tsx` | **新建** | ~50 |
| `pages/tools/VoiceChat.tsx` | **全文 rewrite**(492 → ~80 行) | -412 |
| 老 test(若存) | **改 / 新建**(对齐新字面) | ~40 |

**不动** · `apps/api/src/router/voiceChat.ts` backend(PRR 评估)

---

## §8 · 验收(5 维度)

### D1 · 字面

innerText grep · 必命中 ·
- `VOICE CHAT` 1 次
- `语音对话 · 你的专属IP变现顾问` 1 次
- `Hello Hello你好你好` 1 次
- `哈喽哈喽` / `老铁你好` / `AIP智能体` / `实战导师` 各 1 次
- `10:53` 2 次(user + assistant)
- `播放` 1 次 + `复制` 1 次(assistant bubble 底)
- `有什么问题尽管问我...` 1 次(input placeholder)
- 字面命中率 ≥ 99%

### D2 · 视觉

- chip card 顶左 · Mic icon + VOICE CHAT 金大字 + subtitle 灰
- 顶部右 2 圆 btn(Volume2 + Trash2)金 icon
- user msg 右 + 金底 bubble
- assistant msg 左 + 灰底 bubble · 底部 timestamp + 播放 + 复制 btn
- 底部 input row · mic 圆 btn 左 + textarea + send 圆 btn 右

### D3 · 交互

- input typing · state 更新
- send btn(非空时)· toast `AI 对话 · 即将上线`
- mic btn / volume btn / trash btn · 各 toast(即将上线)
- 复制 btn · `navigator.clipboard.writeText` + toast `已复制`

### D4 · 状态

- 1 state · `input` string
- 2 mock message 固定 render

### D5 · 边界

- 0 trpc · 0 backend · 0 localStorage 持久化

### D6 · typecheck + test

- `pnpm typecheck` 全绿
- `pnpm --filter @quanan/web test VoiceChat` 全绿

---

## §9 · Sonnet 流程(6 步)

1. **改 constants** `apps/web/src/lib/constants/voice-chat.ts` · 删旧 `VOICE_CHAT_QUICK_PROMPTS_6` + `VOICE_CHAT_INTRO` · 加 SPEC §4.1 新字面 + 2 mock message(中文标点全角)
2. **新建 3 子组件** 在 `apps/web/src/components/voice-chat/` · `VoiceChatChip` / `MessageBubble` / `VoiceChatInput`(icon 全 lucide · 字面 from constants)
3. **全文 rewrite** `apps/web/src/pages/tools/VoiceChat.tsx` 按 SPEC §6.1(492 → ~80 行 · 删 trpc 等所有动态)
4. **改 / 新建 test** ·
   - `apps/web/src/pages/tools/__tests__/VoiceChat.test.tsx` 若存改字面 · 否则新建简单 4-5 it 断言(chip / 2 message / input placeholder / send btn click toast)
   - `apps/web/src/lib/constants/__tests__/voice-chat.test.ts` 若存改 · 否则新建(2 mock + 7 const 字面验证)
5. **跑** ·
   - `cd /Users/return/Desktop/QuanAn && pnpm typecheck` 必绿
   - `cd /Users/return/Desktop/QuanAn && pnpm --filter @quanan/web test VoiceChat` 必绿
6. **报告**

---

## §10 · 红线(违反 = reject)

1. ❌ 不允许 hardcode 字面 · 必走 constants
2. ❌ 不允许中文标点变半角 · `！` `，` `。` `：` 全角严守
3. ❌ 不允许保留 trpc.voiceChat.* / useSubscription / chunk 处理 / TypingIndicator / 6 quick prompts 任何残留
4. ❌ 不允许 page 文件直接 inline message bubble · 必抽 sub-component
5. ❌ 不允许加 sally 截图未出现的功能(如老 cancel btn / tokensUsed footer)
6. ❌ 不允许动 `apps/api/` backend
7. ❌ 不允许装新 npm 包(lucide / sonner / shadcn 已有)
8. ❌ 不允许把 view 1-4 长 sally IP guide 写入 mock(那是 LLM 实时输出 · 不是 default mock · 留 LLM 接入后自然产生)

---

## §11 · 报告(Sonnet 干完回填)

```yaml
status: done | blocked
files_changed:
  - <path> · +N / -N
typecheck: pass | fail
test_run: pass | fail (N passed / N failed)
notes: <异常 / 决策>
```
