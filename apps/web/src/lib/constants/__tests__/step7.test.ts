import { describe, it, expect } from 'vitest';

import {
  STEP7_SUBTITLE,
  STEP7_SCRIPT_TYPES_20,
  STEP7_ELEMENT_GROUPS_4,
  STEP7_ELEMENTS_22,
  STEP7_DEBATE_H4_4,
  STEP7_SEARCH_PLACEHOLDER,
  STEP7_ELEMENT_COUNTER_TEMPLATE,
  STEP7_SCRIPT_DISPLAY_TEMPLATE,
  STEP7_BUTTON_GENERATE,
  STEP7_BUTTON_OPTIMIZE,
  STEP7_BUTTON_GO_MY_TOPICS,
  STEP7_BUTTON_GO_STEP5,
  STEP7_TEXTAREA,
} from '../step7';

import type { Step7DebateResult, Step7Result } from '../step7';

describe('STEP7 constants', () => {
  it('SCRIPT_TYPES_20 长度 === 20', () => {
    expect(STEP7_SCRIPT_TYPES_20.length).toBe(20);
  });

  it('SCRIPT_TYPES_20 第 1 = debate · 字面 1:1', () => {
    expect(STEP7_SCRIPT_TYPES_20[0]!.id).toBe('debate');
    expect(STEP7_SCRIPT_TYPES_20[0]!.name).toBe('搞辩论');
    expect(STEP7_SCRIPT_TYPES_20[0]!.positioning).toBe(
      '正反方激烈对撞，引发评论区站队，适合争议性话题',
    );
  });

  it('ELEMENTS_22 长度 === 22', () => {
    expect(STEP7_ELEMENTS_22.length).toBe(22);
  });

  it('4 分组累加严格 6+5+6+5 = 22', () => {
    const hookCount        = STEP7_ELEMENTS_22.filter(e => e.groupKey === 'hook').length;
    const emotionCount     = STEP7_ELEMENTS_22.filter(e => e.groupKey === 'emotion').length;
    const structureCount   = STEP7_ELEMENTS_22.filter(e => e.groupKey === 'structure').length;
    const interactionCount = STEP7_ELEMENTS_22.filter(e => e.groupKey === 'interaction').length;
    expect(hookCount).toBe(6);
    expect(emotionCount).toBe(5);
    expect(structureCount).toBe(6);
    expect(interactionCount).toBe(5);
    expect(hookCount + emotionCount + structureCount + interactionCount).toBe(22);
  });

  it('DEBATE_H4_4 4 个 h4Label 字面 1:1 · 严禁 H4. 前缀 · 严禁英文', () => {
    expect(STEP7_DEBATE_H4_4.length).toBe(4);
    expect(STEP7_DEBATE_H4_4[0]!.h4Label).toBe('话题抛出');
    expect(STEP7_DEBATE_H4_4[1]!.h4Label).toBe('正方');
    expect(STEP7_DEBATE_H4_4[2]!.h4Label).toBe('反方');
    expect(STEP7_DEBATE_H4_4[3]!.h4Label).toBe('我的立场');
  });

  it('SEARCH_PLACEHOLDER 字面 1:1 spec line 1679', () => {
    expect(STEP7_SEARCH_PLACEHOLDER).toBe('搜索脚本...');
  });

  it('ELEMENT_COUNTER_TEMPLATE 含全角括号 · 字面 1:1 spec line 1693', () => {
    expect(STEP7_ELEMENT_COUNTER_TEMPLATE).toBe('选择爆款元素（已选 {count} 个）');
  });

  it('SCRIPT_DISPLAY_TEMPLATE 含全角冒号 + 半角 hyphen · 字面 1:1 spec line 1701', () => {
    expect(STEP7_SCRIPT_DISPLAY_TEMPLATE).toBe('当前脚本：{name} - {positioning}');
  });

  it('BUTTONS 4 字面 1:1 spec §7.8 line 1710-1712', () => {
    expect(STEP7_BUTTON_GENERATE).toBe('生成爆款文案');
    expect(STEP7_BUTTON_OPTIMIZE).toBe('AI 优化文案');
    expect(STEP7_BUTTON_GO_MY_TOPICS).toBe('我的选题库');
    expect(STEP7_BUTTON_GO_STEP5).toBe('爆款选题');
  });

  it('SUBTITLE 字面 1:1 spec §7.8 line 1671', () => {
    expect(STEP7_SUBTITLE).toBe(
      '选择脚本类型和爆款元素，输入主题，AI 将基于方法论生成深度爆款文案，支持 AI 智能修改优化。',
    );
  });

  it('Step7DebateResult interface 字段结构', () => {
    const result: Step7DebateResult = {
      title:           '美容院抖音获客辩论',
      topic_hook:      '美容院到底该不该在抖音做内容营销？',
      pros_arguments:  '抖音用户基数大，精准获客成本低，内容可反复传播',
      cons_arguments:  '内容制作成本高，运营周期长，转化链路复杂',
      my_stance:       '小美容院应先从本地探店类内容起步，门槛低转化快',
      comment_guide:   '你们美容院现在有在做抖音吗？评论区聊聊',
      topic_tags:      ['美容院营销', '抖音获客', '本地生活'],
    };
    expect(result.topic_hook).toBeTruthy();
    expect(result.topic_tags).toBeInstanceOf(Array);
    expect(result.pros_arguments).toBeTruthy();
    expect(result.cons_arguments).toBeTruthy();
    expect(result.my_stance).toBeTruthy();
    expect(result.comment_guide).toBeTruthy();
  });

  it('Step7Result interface 字段结构 · body 默认为 Step7DebateResult', () => {
    const debateBody: Step7DebateResult = {
      title:          '测试辩论',
      topic_hook:     '话题抛出内容',
      pros_arguments: '正方观点',
      cons_arguments: '反方观点',
      my_stance:      '我的立场',
      comment_guide:  '评论引导',
      topic_tags:     ['tag1'],
    };
    const result: Step7Result = {
      script_type: 'debate',
      title:       '测试结果',
      body:        debateBody,
    };
    expect(result.script_type).toBe('debate');
    expect(typeof result.title).toBe('string');
    expect(result.body).toEqual(debateBody);
  });

  it('TEXTAREA id/label/placeholder 字面 1:1 spec §7.8 line 1699', () => {
    expect(STEP7_TEXTAREA.id).toBe('topic');
    expect(STEP7_TEXTAREA.label).toBe('文案主题');
    expect(STEP7_TEXTAREA.required).toBe(true);
    expect(STEP7_TEXTAREA.placeholder).toBe(
      '输入你的文案主题，如：美容院如何用抖音获客100个精准客户...',
    );
  });

  it('ELEMENT_GROUPS_4 length === 4 · 4 个 label 字面 1:1', () => {
    expect(STEP7_ELEMENT_GROUPS_4.length).toBe(4);
    expect(STEP7_ELEMENT_GROUPS_4[0]!.key).toBe('hook');
    expect(STEP7_ELEMENT_GROUPS_4[0]!.label).toBe('内容钩子');
    expect(STEP7_ELEMENT_GROUPS_4[1]!.label).toBe('情绪触发');
    expect(STEP7_ELEMENT_GROUPS_4[2]!.label).toBe('结构强化');
    expect(STEP7_ELEMENT_GROUPS_4[3]!.label).toBe('互动引导');
  });
});
