export const GUIDE_FAQ_5 = [
  {
    q: 'AI 生成的文案可以直接用吗？',
    a: '建议作为参考 · 结合自己的 IP 人设和真实经历微调 · 让内容更有人味更可信。',
  },
  {
    q: '需要付费吗？',
    a: '当前为邀请制内测 · 通过邀请码注册后可免费使用全部功能 · 后续会上线套餐 · 详见 /accounts。',
  },
  {
    q: '生成的内容质量怎么保证？',
    a: '基于多模型 LLM Gateway · 14 个专属 Specialist 经过 PRD-20 真 LLM 接入 + 7 Specialist tuning · 9/9 PASSED A 级。',
  },
  {
    q: '可以批量生成吗？',
    a: '部分模块支持(如选题库 5 大类一键生成 · boom-generate 多元素组合)· 部分模块按 IP 账号隔离一次一条避免污染。',
  },
  {
    q: '数据安全如何保证？',
    a: '本地优先(LS-first dual-write)· 服务端用 RLS per-tenant 隔离 · 不会跨 IP 账号泄露。',
  },
] as const;
