# PRD-17: Step 1 / Step 3 / Step 3b 完整化(aiipznt 1:1 对齐 · Phase 2)

> 状态 · 等待 ralph daemon 实施(2026-05-17 启动 prd skill)
> 来源 · 续 PRD-16 aiipznt 复刻 commit d066cb9 收官 · 11 US 实施 · 严格 D1=A 像素级 + D4=B 颜色保留
> 范围 · 9 步主流程的 Step 1 行业选择 + Step 3 账号包装方案 + Step 3b 人设定制方案 三个 step page 重写
> 不在范围 · Step 2/4/4b/5/6/7/8(PRD-18 接) · 14 工具 stub 8(PRD-19 接) · backend AI 生成 API(PRD-AI 专项)

---

## §0 引用清单(必读 · 启动 PRD-17 前)

### §0.1 上游文档(8 份核心)

| # | 文档 | 用途 | 重点章节 |
|:-:|---|---|---|
| 1 | [tasks/prd-16.md](prd-16.md) | 上一 PRD seed(参 1280 行详细度 + 11 US 结构格式) | §0 引用 / §1 11 US / §5 跨 Story 协议锁 / §6 LD |
| 2 | [aiipznt-deep-dom-dump.md](../aiipznt-deep-dom-dump.md) | **32 page DOM 实测**(以 dump 为准当冲突) | §2.2 9 步主流程(Step 1/3/3b H/Btn/Input/Els 实测) |
| 3 | [aiipznt-spec.md](../aiipznt-spec.md) | 9192 行复刻基线(SOP / 字段 / placeholder 全字面) | §7.1 Step 1 · §7.2 Step 3 · §7.3 Step 3b |
| 4 | [AGENTS.md](../AGENTS.md) | 18 LD + 17 R 红线 + §11.9 PRD-16 沉淀 5 子节 | **§11.9.4 D4=B 颜色严锁**(必读) · **§11.9.5 D1=A 像素级文字字面锁**(必读) · §11.9.1 字体设计系统 · §11.9.2 3 utility · §11.9.3 Header 4 dropdown |
| 5 | [.agents/retros/prd-16-vs-prd-15-retrospective.md](../.agents/retros/prd-16-vs-prd-15-retrospective.md) | PRD-16 复盘 · 8 patterns + §10 M-1/M-2 D 锁精确语义 | **§10 M-1 颜色词 ERROR** · **§10 M-2 D1=A 字面锁** · §0.4 reject 根因 · §4.2 anti_patterns 累加 |
| 6 | [ARCHITECTURE.md](../ARCHITECTURE.md) | 主应用架构 + 9 step 契约 | §3.5 9 step Schema · §6 UI 设计系统 · §8 设计系统 |
| 7 | [DATA-MODEL.md](../DATA-MODEL.md) | 主应用 18 表 + 56 行业 schema(参考字段 industry / industryLabel / customIndustry) | §4 industry table |
| 8 | `~/.claude/playbooks/reject-examples.jsonl` | **47+ 跨 PRD 反例库**(注入 high/foundation US 的 anti_patterns) | 关键词检索 · violet / amber / 颜色词 / desc 字面 / Header click / textarea required / radio platforms / form validation |

### §0.2 元数据

| 项 | 值 |
|---|---|
| **branchName** | `ralph/prd-17-step1-3-3b` |
| **Locked Decisions** | D-146 起延续(PRD-16 收尾 D-145) |
| **风险分档** | foundation × 4(US-001/005/007/009)+ high × 3(US-006a/006b/008)+ medium × 4(US-002/003/004/010) |
| **anti_patterns 注入** | 4 foundation + 3 high US 必须从 reject-examples.jsonl 检索 ≤3 条注入 |
| **依赖前置 PRD** | PRD-15(StepForm + IndustryDropdown + ls-namespace `acc_` 复用)+ PRD-16(设计系统切换 + glass-card / animate-ping-primary / D4=B 颜色锁 / D1=A 字面锁) |
| **下游 PRD** | PRD-18(Step 2/4/4b/5/6/7/8 完整化 · 10-12 US)· PRD-19(8 stub 工具 + 4 modules + 视觉精修 · 10-12 US) |
| **关键 D 锁** | **D1=A** 像素级 layout(文字 = layout 严格一部分 · retro §10 M-2 固化)· **D4=B** 颜色保留 QuanAn `--primary: 43 87% 63%` 金色(0 violet/amber/gold OKLCH 引入)· **D3=A** 仅主应用(apps/admin/ 0 触动) |

### §0.3 复刻定调(D1=A · D4=B 严锁 · 延续 PRD-16 D-145)

| 维度 | 切 / 不切 |
|---|:-:|
| 整体页面布局(layout / 区块顺序 / 区块尺寸 / 容器宽度 / padding 方向) | ✅ **切 1:1 对齐 aiipznt** |
| spacing scale(gap-2 / gap-4 / mb-8 等) | ✅ **切**(参 dump §1.4 / §2.2 各 step) |
| 字体 family(Orbitron 大标题 / Rajdhani 副标 / Noto Sans SC 中文 / ui-sans-serif 正文)+ weight | ✅ **切**(PRD-16 US-001 已落地 · 直接 className `font-display` / `font-cn` / `font-label`) |
| motion(framer-motion / animate-X / transition / hover effect) | ✅ **切**(已落地 animate-ping-primary 等) |
| SVG icons / lucide-react | ✅ **切**(已 95% 一致 · 仅补缺) |
| 卡片 hover 效果 + glass-card 模糊 + Dialog/Modal 浮层 | ✅ **切** |
| **文字内容**(H1/H2/H3/p / button label / placeholder / FAQ q/a / step 顶部标签 等) | ✅ **切 严格 1:1**(D1=A 锁 · plan-check §2.6.20 D1A-text-content-drift 检查 · retro §10 M-2 固化) |
| **颜色 token**(primary / accent / background / border / shadow / chart × 5) | ❌ **不切 · 保留 QuanAn globals.css 金色** `--primary: 43 87% 63%` |
| aiipznt 的 `var(--gold)` `border-gold/X` `shadow-gold/X` 等映射 | ❌ **替换为** `var(--primary)` `border-primary/X` `shadow-primary/X`(参 PRD-16 US-001 已落地映射规则) |
| UX behavior(search filter 联动 / 自定义 modal 显示时机 / button hover transition 时长 / etc) | 🟡 **可自由发挥**(D1=A 不锁 · 这是 UX 不是 layout) |

**反例锁**(防 ralph 字面解读边界模糊 · 必读 retro §10 M-2):
1. ❌ 文字内容当"建议" · "5 platform radio label `📱 抖音` 改成 `抖音` 应该没问题" — **错!** label 含 emoji = layout 严格一部分(D1=A 锁)
2. ❌ 6 H3 输出区 desc 当"创意空间" · "`视频参考案例` 写成 `参考视频` 应该没问题" — **错!** H3 文字 = layout 严格一部分(D1=A 锁 · PRD-16 US-004 reject 教训)
3. ❌ 颜色词当"建议" · "主 CTA 写'紫色 gradient'就是 var(--primary)" — **错!** 紫色 ≠ 金色 HSL(43, 87%, 63%) · plan-check §2.6.7-ext 颜色词 ERROR 级会阻断(PRD-16 US-003 reject 教训)
4. ✅ UX 自由发挥 · "search filter 联动 56 卡实时过滤体验更流畅" — **对!** 这是 UX 不是 layout(D1=A 不锁)

---

## §1 User Stories(11 US)

### US-001 ★ foundation · `industries.ts` 56 行业 5 大类常量(字面锁 · 数字锁)

**描述** · 作为开发者,我需要把 aiipznt 实测的 56 行业 + 5 大类 + 6 tab 常量化为 `apps/web/src/lib/constants/industries.ts`,以便 US-002 ~ US-004 Step 1 页面直接读取 · 顺序/数字/字面严锁(D1=A 红线)。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/src/lib/constants/industries.ts` · 完整结构(代码片段):
  ```typescript
  // STEP1_TABS · 6 tab 严锁(顺序 + label + count 字面 1:1 来源 spec §7.1 + dump §2.2)
  export interface Step1Tab {
    id: 'all' | 'life' | 'ecom' | 'create' | 'pro' | 'mfg';
    label: string;
    count: number;
    emoji: string;
  }

  export const STEP1_TABS: readonly Step1Tab[] = [
    { id: 'all',    label: '全部行业', count: 56, emoji: ''   },
    { id: 'life',   label: '生活服务', count: 18, emoji: '🏠' },
    { id: 'ecom',   label: '电商零售', count: 13, emoji: '🛒' },
    { id: 'create', label: '内容创作', count: 7,  emoji: '✍️' },
    { id: 'pro',    label: '专业服务', count: 14, emoji: '💼' },
    { id: 'mfg',    label: '产业制造', count: 4,  emoji: '🏭' },
  ] as const;

  // STEP1_INDUSTRIES_56 · 56 行业字面 1:1 + emoji + keywords 来源 spec §7.1
  export interface Industry {
    id: string;                  // beauty / catering / education ...
    label: string;               // 美业 / 餐饮 / 教育培训 ...
    emoji: string;               // 💅 / 🍜 / 📚 ...
    category: Step1Tab['id'];    // life / ecom / create / pro / mfg
    keywords: readonly string[]; // 搜索关键词数组
  }

  export const STEP1_INDUSTRIES_56: readonly Industry[] = [
    // life × 18(代表样本 · 完整 18 项按 spec §7.1 行业卡数据补全)
    { id: 'beauty',    label: '美业',     emoji: '💅', category: 'life', keywords: ['美容院','美发','美甲','美睫','纹绣'] },
    { id: 'catering',  label: '餐饮',     emoji: '🍜', category: 'life', keywords: ['火锅','烧烤','咖啡','奶茶','早餐'] },
    { id: 'fitness',   label: '健身',     emoji: '💪', category: 'life', keywords: ['健身房','瑜伽','私教','拳击','普拉提'] },
    // ...(完整 18 项 · ralph 实施时按 spec §7.1 实测数据补全)
    // ecom × 13
    { id: 'apparel',   label: '服装鞋帽', emoji: '👗', category: 'ecom', keywords: ['女装','男装','童装','鞋','箱包'] },
    // ...(完整 13 项)
    // create × 7
    { id: 'kol',       label: '网红达人', emoji: '📸', category: 'create', keywords: ['博主','达人','KOL','网红'] },
    // ...(完整 7 项)
    // pro × 14
    { id: 'education', label: '教育培训', emoji: '📚', category: 'pro', keywords: ['K12','成人','职业','留学','考研'] },
    // ...(完整 14 项)
    // mfg × 4
    { id: 'mfg-light', label: '轻工制造', emoji: '🏭', category: 'mfg', keywords: ['加工','OEM','代工'] },
    // ...(完整 4 项)
  ] as const;

  // STEP1_SEARCH_PLACEHOLDER · 搜索框 placeholder 字面 1:1 来源 spec §7.1
  export const STEP1_SEARCH_PLACEHOLDER = '搜索行业名称或关键词（如：美容院、餐饮、教育...）';

  // STEP1_CTA · 主 CTA 字面 1:1 来源 spec §7.1
  export const STEP1_CTA_LABEL = '确认并进入下一步';
  export const STEP1_CTA_DISABLED_HINT = '请先选择一个行业';

  // STEP1_CUSTOM_MODAL · 自定义输入行业 modal 字面
  export const STEP1_CUSTOM_TRIGGER_LABEL = '自定义输入行业';
  export const STEP1_CUSTOM_MODAL_TITLE = '自定义你的行业';
  export const STEP1_CUSTOM_MODAL_PLACEHOLDER = '请输入你的行业名称';
  export const STEP1_CUSTOM_MODAL_CONFIRM = '确认使用';
  export const STEP1_CUSTOM_MODAL_CANCEL = '取消';
  ```
- [ ] **AC-2** · 字面校验 · grep 以下字面必须存在(严格 1:1):
  - `grep -F "全部行业" apps/web/src/lib/constants/industries.ts` 命中 1 次
  - `grep -F "生活服务" apps/web/src/lib/constants/industries.ts` 命中 1 次
  - `grep -F "搜索行业名称或关键词" apps/web/src/lib/constants/industries.ts` 命中 1 次
  - `grep -F "确认并进入下一步" apps/web/src/lib/constants/industries.ts` 命中 1 次
  - `grep -F "自定义输入行业" apps/web/src/lib/constants/industries.ts` 命中 1 次
- [ ] **AC-3** · 数字锁校验 · `STEP1_INDUSTRIES_56.length === 56` + 5 大类 count 分布精确(life=18 / ecom=13 / create=7 / pro=14 / mfg=4 = 56)
- [ ] **AC-4** · TypeScript 严格模式 · 所有 const `as const` · interface 全 readonly · `pnpm tsc --noEmit` 0 error
- [ ] **AC-5** · 单元测试 · 新建 `apps/web/src/lib/constants/__tests__/industries.test.ts` · 含 4 assert:
  ```typescript
  describe('STEP1_INDUSTRIES_56', () => {
    it('total = 56', () => expect(STEP1_INDUSTRIES_56.length).toBe(56));
    it('life category count = 18', () => expect(STEP1_INDUSTRIES_56.filter(i => i.category === 'life').length).toBe(18));
    it('ecom category count = 13', () => expect(STEP1_INDUSTRIES_56.filter(i => i.category === 'ecom').length).toBe(13));
    it('STEP1_TABS sum count = 56', () => expect(STEP1_TABS.filter(t => t.id !== 'all').reduce((s, t) => s + t.count, 0)).toBe(56));
  });
  ```
- [ ] **AC-6** · 单元测试通过 · `cd apps/web && pnpm vitest run src/lib/constants/__tests__/industries.test.ts` 全 PASS
- [ ] **AC-7** · Typecheck 通过 · `cd apps/web && pnpm tsc --noEmit` 0 error

**files_to_create** · `apps/web/src/lib/constants/industries.ts` · `apps/web/src/lib/constants/__tests__/industries.test.ts`
**files_to_modify** · (无)
**test_command** · `cd apps/web && pnpm vitest run src/lib/constants/__tests__/industries.test.ts && pnpm tsc --noEmit`
**size_hint** · medium(常量数据较多)
**risk_level** · foundation(US-002/003/004 都消费 + 字面锁字段多)

---

### US-002 medium · Step 1 page · Tab 切换 + 搜索 + 56 行业 emoji 双行卡 grid

**描述** · 作为用户,我想进入 `/step/1` 看到 1:1 复刻 aiipznt 的行业选择 page:顶部 step 标签 + H1 + 副标 + 搜索框 + 6 tab + 56 emoji 双行卡 grid · 能按 tab 筛选 + 搜索框实时过滤(by name + keywords)。

**Acceptance Criteria** ·

- [ ] **AC-1** · 重写 `apps/web/src/pages/Step1.tsx`(替换原 StepForm 通用方案):
  ```tsx
  // 顶部 step 标签 · 字面 1:1 来源 spec §7.1
  <div className="text-sm font-label text-primary">STEP 01 · 选择行业赛道</div>

  // H1 · 字面 1:1
  <h1 className="font-display text-4xl md:text-5xl font-black mt-2">
    选择你的行业赛道
  </h1>

  // 副标题 · 字面 1:1
  <p className="text-base text-muted-foreground mt-3">
    覆盖抖音、视频号等主流平台的 56+ 个细分行业。你也可以自定义输入行业。
  </p>

  // 搜索框 · 用 STEP1_SEARCH_PLACEHOLDER
  <Input
    type="text"
    placeholder={STEP1_SEARCH_PLACEHOLDER}
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="mt-6 h-12"
  />

  // 6 tab 横向 · 用 STEP1_TABS 渲染
  <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
    <TabsList className="grid grid-cols-6 w-full">
      {STEP1_TABS.map(tab => (
        <TabsTrigger key={tab.id} value={tab.id} className="font-label">
          {tab.emoji && <span className="mr-1">{tab.emoji}</span>}
          {tab.label} ({tab.count})
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>

  // 56 行业卡 grid · emoji 双行(emoji 在上 · label 在下)
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
    {filteredIndustries.map(industry => (
      <button
        key={industry.id}
        onClick={() => selectIndustry(industry)}
        className={cn(
          "glass-card flex flex-col items-center justify-center py-6 px-3 rounded-xl transition-all",
          "hover:border-primary/40 hover:shadow-primary/10",
          selectedIndustry?.id === industry.id && "border-primary/60 bg-primary/10"
        )}
      >
        <span className="text-3xl mb-2">{industry.emoji}</span>
        <span className="font-cn text-sm">{industry.label}</span>
      </button>
    ))}
  </div>
  ```
- [ ] **AC-2** · Tab 筛选逻辑 · activeTab !== 'all' 时只显示 `category === activeTab` 的行业 · activeTab === 'all' 显示全 56
- [ ] **AC-3** · 搜索过滤逻辑 · searchQuery 非空时 fuzzy match `industry.label` + `industry.keywords` · 与 Tab 筛选**叠加**(先 tab 过滤 · 再 search 过滤)
- [ ] **AC-4** · 空状态 · filteredIndustries.length === 0 时显示 EmptyState 组件(US-009 提供)+ 文案 `未找到匹配的行业 · 尝试自定义输入`
- [ ] **AC-5** · 使用 agent-browser 打开 `http://localhost:5173/step/1` · 截图验证:
  - 6 tab 横向显示(全部 56 / 生活服务 18 / 电商零售 13 / 内容创作 7 / 专业服务 14 / 产业制造 4)
  - 56 行业 emoji 双行卡 grid 渲染(默认 activeTab='all')
  - 搜索框 placeholder 显示 `搜索行业名称或关键词（如：美容院、餐饮、教育...）`
- [ ] **AC-6** · 控制台无 error
- [ ] **AC-7** · Typecheck 通过

**files_to_create** · (无)
**files_to_modify** · `apps/web/src/pages/Step1.tsx`(整体重写 · 删 StepForm 用法)
**test_command** · `cd apps/web && pnpm tsc --noEmit`
**size_hint** · medium
**risk_level** · medium

---

### US-003 medium · Step 1 已选状态卡 + 主 CTA 跳转

**描述** · 作为用户,我选了一个行业后,想看到顶部"已选状态卡"显示我的选择 + 底部"主 CTA"按钮变可点击 · 点击跳转 `/step/3`。

**Acceptance Criteria** ·

- [ ] **AC-1** · Step1 顶部加"已选状态卡"(selectedIndustry 非空时显示)· 完整代码:
  ```tsx
  {selectedIndustry && (
    <div className="glass-card border-primary/40 bg-primary/5 rounded-xl p-4 mt-6 flex items-center gap-3">
      <span className="text-3xl">{selectedIndustry.emoji}</span>
      <div className="flex-1">
        <div className="font-cn text-base">已选择:{selectedIndustry.label}</div>
        <div className="text-xs text-muted-foreground mt-1">
          关键词:{selectedIndustry.keywords.join('、')}
        </div>
      </div>
    </div>
  )}
  ```
- [ ] **AC-2** · 底部主 CTA 按钮 · 用 STEP1_CTA_LABEL 字面 + var(--primary) gradient(D4=B 锁):
  ```tsx
  <Button
    size="lg"
    disabled={!selectedIndustry && !customIndustry}
    onClick={handleSubmit}
    className={cn(
      "mt-8 w-full md:w-auto md:px-12 h-12 text-base font-label",
      "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
      "text-primary-foreground shadow-primary/20"
    )}
  >
    {STEP1_CTA_LABEL} →
  </Button>
  {!selectedIndustry && !customIndustry && (
    <p className="text-xs text-muted-foreground mt-2">{STEP1_CTA_DISABLED_HINT}</p>
  )}
  ```
- [ ] **AC-3** · handleSubmit 逻辑:
  - 保存到 stepData(localStorage `acc_` 前缀 · 参 PRD-15 ls-namespace 规则)· key = `step1`
  - 值结构:`{ industry: selectedIndustry?.id ?? 'other', industryLabel: selectedIndustry?.label ?? customIndustry, customIndustry: customIndustry ?? undefined }`
  - `navigate('/step/3')` 跳转
- [ ] **AC-4** · 使用 agent-browser:
  - 打开 `/step/1` · 点 `💅 美业` 卡片
  - 顶部出现 `已选择:美业` 状态卡
  - 关键词显示 `美容院、美发、美甲、美睫、纹绣`
  - 底部 CTA `确认并进入下一步 →` 变可点击
  - 点 CTA · URL 跳到 `/step/3`
  - localStorage 存在 `acc_step1` key · 值含 `industry: 'beauty'`
- [ ] **AC-5** · Typecheck 通过

**files_to_create** · (无)
**files_to_modify** · `apps/web/src/pages/Step1.tsx`
**test_command** · `cd apps/web && pnpm tsc --noEmit`
**size_hint** · small
**risk_level** · medium

---

### US-004 medium · Step 1 自定义输入行业 modal(shadcn Dialog)

**描述** · 作为用户,如果 56 个行业里没有我的行业,我想点 `自定义输入行业` 弹出 modal 输入自定义行业名 · 保存为 customIndustry · 同样能进入下一步。

**Acceptance Criteria** ·

- [ ] **AC-1** · Step1 page 加 `自定义输入行业` trigger button(56 卡 grid 下方居中):
  ```tsx
  <div className="flex justify-center mt-6">
    <Dialog open={customModalOpen} onOpenChange={setCustomModalOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="font-label text-primary">
          {STEP1_CUSTOM_TRIGGER_LABEL}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="font-display">{STEP1_CUSTOM_MODAL_TITLE}</DialogTitle>
        </DialogHeader>
        <Input
          type="text"
          placeholder={STEP1_CUSTOM_MODAL_PLACEHOLDER}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          maxLength={20}
          className="h-12 mt-4"
        />
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setCustomModalOpen(false)}>
            {STEP1_CUSTOM_MODAL_CANCEL}
          </Button>
          <Button
            disabled={!customInput.trim()}
            onClick={handleCustomConfirm}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {STEP1_CUSTOM_MODAL_CONFIRM}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  ```
- [ ] **AC-2** · handleCustomConfirm 逻辑:
  - setCustomIndustry(customInput.trim())
  - setSelectedIndustry(null)(custom 与 selected 互斥)
  - setCustomModalOpen(false)
  - 顶部已选状态卡显示 `已选择:{customIndustry}(自定义)` · emoji 用 ✨ 占位
- [ ] **AC-3** · 字面校验 · grep 严格命中:
  - `grep -F "自定义你的行业" apps/web/src/pages/Step1.tsx` 命中 1 次(modal title)
  - `grep -F "请输入你的行业名称" apps/web/src/pages/Step1.tsx` 命中 1 次(placeholder)
  - `grep -F "确认使用" apps/web/src/pages/Step1.tsx` 命中 1 次(confirm button)
- [ ] **AC-4** · 使用 agent-browser:
  - 打开 `/step/1` · 点 `自定义输入行业` link
  - Dialog modal 弹出 · 输入 `宠物服务` · 点 `确认使用`
  - Modal 关闭 · 顶部状态卡显示 `已选择:宠物服务(自定义)`
  - 底部 CTA 变可点击
- [ ] **AC-5** · Typecheck 通过

**files_to_create** · (无)
**files_to_modify** · `apps/web/src/pages/Step1.tsx`
**test_command** · `cd apps/web && pnpm tsc --noEmit`
**size_hint** · small
**risk_level** · medium

---

### US-005 ★ foundation · `step3.ts` 常量(PLATFORMS_5 + STEP3_OUTPUT_H3_6 + placeholders 字面锁)

**描述** · 作为开发者,我需要把 Step 3 的 5 platform radio + 6 H3 输出区 + 4 input/textarea placeholder 字面常量化为 `apps/web/src/lib/constants/step3.ts`,以便 US-006a/006b 直接读 · 字面 1:1 严锁(D1=A 红线 · 防 PRD-16 US-004 类 desc 创意改写 reject)。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/src/lib/constants/step3.ts` · 完整代码:
  ```typescript
  // STEP3_PLATFORMS_5 · 5 platform radio 字面 1:1 含 emoji 来源 spec §7.2
  export interface Step3Platform {
    id: 'douyin' | 'xiaohongshu' | 'shipinhao' | 'kuaishou' | 'bilibili';
    label: string;       // 含 emoji · 如 '📱 抖音'
    name: string;        // 纯名 · 如 '抖音'
  }

  export const STEP3_PLATFORMS_5: readonly Step3Platform[] = [
    { id: 'douyin',       label: '📱 抖音',     name: '抖音' },
    { id: 'xiaohongshu',  label: '📕 小红书',   name: '小红书' },
    { id: 'shipinhao',    label: '📺 视频号',   name: '视频号' },
    { id: 'kuaishou',     label: '🎬 快手',     name: '快手' },
    { id: 'bilibili',     label: '📺 B站',      name: 'B站' },
  ] as const;

  // STEP3_OUTPUT_H3_6 · 6 H3 输出模块字面 1:1 来源 spec §7.2 "6 大模块"
  export interface Step3OutputBlock {
    id: 'videoReferences' | 'nickname' | 'avatar' | 'background' | 'bio' | 'strategy';
    h3Label: string;       // H3 文字 · 如 '1. 视频参考案例'
    hint: string;          // 副标提示
  }

  export const STEP3_OUTPUT_H3_6: readonly Step3OutputBlock[] = [
    { id: 'videoReferences', h3Label: '1. 视频参考案例',  hint: 'AI 推荐 3 个本行业的爆款视频参考(含标题、描述、搜索词)' },
    { id: 'nickname',        h3Label: '2. 昵称推荐',      hint: '5 个备选昵称 + 命名策略 + 各平台调整建议' },
    { id: 'avatar',          h3Label: '3. 头像设计方案',  hint: '风格 / 配色 / 表情 / 必含元素 / 禁忌 / AI 绘图 prompt' },
    { id: 'background',      h3Label: '4. 背景图设计方案', hint: '风格 / 布局 / 配色 / 文案 / 3 平台尺寸适配 / AI 绘图 prompt' },
    { id: 'bio',             h3Label: '5. 简介文案方案',  hint: '简介公式 + 6 个版本(3 平台 × 主号副号)+ SEO 关键词' },
    { id: 'strategy',        h3Label: '6. 整体包装策略',  hint: '视觉一致性 / 第一印象 / 转化路径 / 平台优先级' },
  ] as const;

  // STEP3_BUTTONS_3 · 每 H3 子模块右侧 3 按钮 + 头像/背景图 加 [生成参考图]
  export const STEP3_BUTTON_COPY = '复制';
  export const STEP3_BUTTON_REGENERATE = '重新生成';
  export const STEP3_BUTTON_OPTIMIZE = '智能优化';
  export const STEP3_BUTTON_GEN_IMAGE = '生成参考图';

  // 顶部右侧 · [一键重新生成] [复制全部]
  export const STEP3_HEADER_BUTTON_REGEN_ALL = '一键重新生成';
  export const STEP3_HEADER_BUTTON_COPY_ALL = '复制全部';

  // STEP3_FORM_LABELS · 表单字段 label + placeholder 字面 1:1 来源 spec §7.2
  export const STEP3_FORM = {
    personalInfo: {
      label: '你的个人信息',
      required: true,
      placeholder: '详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。\n\n示例：我是一名有10年经验的美容师，擅长皮肤管理和抗衰项目...',
    },
    platform: {
      label: '目标平台',
      required: true,
    },
    audience: {
      label: '目标受众',
      required: false,
      placeholder: '你想吸引什么样的粉丝？',
    },
    accountStatus: {
      label: '现有账号情况',
      required: false,
      placeholder: '新账号/已有账号的粉丝量等',
    },
  } as const;

  // STEP3_CTA · 主 CTA 字面 1:1
  export const STEP3_CTA_LABEL = '生成账号包装方案';
  export const STEP3_CTA_DISABLED_HINT = '请填写"你的个人信息"并选择目标平台';

  // STEP3_PAGE · 顶部 step 标签 + H1 + 副标
  export const STEP3_STEP_TAG = 'STEP 03 · 账号包装方案';
  export const STEP3_H1 = '账号包装方案';
  export const STEP3_SUBTITLE_TEMPLATE = '当前行业：{industry}。输入你的个人信息，AI 将为你生成极其详细的账号包装方案，包含昵称、头像参考图、背景图参考、简介等全方位深度解析。';

  // STEP3_LOADING_TEXT · loading 文案
  export const STEP3_LOADING_TEXT = 'AI 正在生成你的账号包装方案，预计 30-60 秒...';
  ```
- [ ] **AC-2** · 字面校验 · grep 必须存在(严格 1:1):
  - `grep -F "📱 抖音" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "📕 小红书" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "📺 视频号" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "🎬 快手" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "📺 B站" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "视频参考案例" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "昵称推荐" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "头像设计方案" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "背景图设计方案" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "简介文案方案" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "整体包装策略" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "生成账号包装方案" apps/web/src/lib/constants/step3.ts` 命中 1 次
  - `grep -F "STEP 03 · 账号包装方案" apps/web/src/lib/constants/step3.ts` 命中 1 次
- [ ] **AC-3** · 数字锁 · `STEP3_PLATFORMS_5.length === 5` + `STEP3_OUTPUT_H3_6.length === 6`
- [ ] **AC-4** · 单元测试 · 新建 `apps/web/src/lib/constants/__tests__/step3.test.ts`:
  ```typescript
  describe('STEP3 constants', () => {
    it('5 platforms', () => expect(STEP3_PLATFORMS_5.length).toBe(5));
    it('6 H3 output blocks', () => expect(STEP3_OUTPUT_H3_6.length).toBe(6));
    it('all platforms have emoji prefix', () => {
      STEP3_PLATFORMS_5.forEach(p => {
        expect(p.label).toMatch(/^[\u{1F300}-\u{1F9FF}]/u);
      });
    });
    it('output H3 labels start with number 1-6', () => {
      STEP3_OUTPUT_H3_6.forEach((block, idx) => {
        expect(block.h3Label.startsWith(`${idx + 1}. `)).toBe(true);
      });
    });
  });
  ```
- [ ] **AC-5** · Typecheck + 测试通过

**files_to_create** · `apps/web/src/lib/constants/step3.ts` · `apps/web/src/lib/constants/__tests__/step3.test.ts`
**files_to_modify** · (无)
**test_command** · `cd apps/web && pnpm vitest run src/lib/constants/__tests__/step3.test.ts && pnpm tsc --noEmit`
**size_hint** · medium
**risk_level** · foundation(US-006a/006b 都消费 + 字面锁字段多)

---

### US-006a high · Step 3 page · 表单组件(textarea + 5 platform radio + 2 input + 主 CTA)

**描述** · 作为用户,我进入 `/step/3` 想看到完整的账号包装方案表单:顶部 step 标签 + H1 + 副标 + 1 textarea(必填)+ 5 platform radio + 2 input + 主 CTA "生成账号包装方案" · 提交触发 mock 生成(此 US 不渲染输出区 · 输出区由 US-006b 实现)。

**Acceptance Criteria** ·

- [ ] **AC-1** · 重写 `apps/web/src/pages/Step3.tsx`(替换 StepForm 通用方案)· 表单部分完整代码:
  ```tsx
  // 顶部 step 标签 · 用 STEP3_STEP_TAG 字面
  <div className="text-sm font-label text-primary">{STEP3_STEP_TAG}</div>

  // H1 · 用 STEP3_H1
  <h1 className="font-display text-4xl md:text-5xl font-black mt-2">{STEP3_H1}</h1>

  // 副标题 · 替换 {industry} 占位为 stepData.step1.industryLabel
  <p className="text-base text-muted-foreground mt-3">
    {STEP3_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel)}
  </p>

  <form onSubmit={handleSubmit} className="mt-8 space-y-6">
    {/* 1. textarea 必填 */}
    <div>
      <label className="font-label text-sm flex items-center gap-1">
        {STEP3_FORM.personalInfo.label}
        <span className="text-destructive">*</span>
      </label>
      <Textarea
        required
        value={personalInfo}
        onChange={(e) => setPersonalInfo(e.target.value)}
        placeholder={STEP3_FORM.personalInfo.placeholder}
        className="mt-2 min-h-[160px] font-cn"
      />
    </div>

    {/* 2. 5 platform radio */}
    <div>
      <label className="font-label text-sm flex items-center gap-1">
        {STEP3_FORM.platform.label}
        <span className="text-destructive">*</span>
      </label>
      <RadioGroup value={platform} onValueChange={setPlatform} className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
        {STEP3_PLATFORMS_5.map(p => (
          <div key={p.id} className="flex items-center space-x-2 glass-card rounded-lg p-3 hover:border-primary/40">
            <RadioGroupItem value={p.id} id={p.id} />
            <label htmlFor={p.id} className="font-cn text-sm cursor-pointer">
              {p.label}
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>

    {/* 3. 目标受众 input */}
    <div>
      <label className="font-label text-sm">{STEP3_FORM.audience.label}</label>
      <Input
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        placeholder={STEP3_FORM.audience.placeholder}
        className="mt-2 h-12"
      />
    </div>

    {/* 4. 现有账号情况 input */}
    <div>
      <label className="font-label text-sm">{STEP3_FORM.accountStatus.label}</label>
      <Input
        value={accountStatus}
        onChange={(e) => setAccountStatus(e.target.value)}
        placeholder={STEP3_FORM.accountStatus.placeholder}
        className="mt-2 h-12"
      />
    </div>

    {/* 主 CTA */}
    <Button
      type="submit"
      size="lg"
      disabled={!personalInfo.trim() || !platform || isLoading}
      className={cn(
        "w-full md:w-auto md:px-12 h-12 text-base font-label",
        "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
        "text-primary-foreground shadow-primary/20"
      )}
    >
      {isLoading ? STEP3_LOADING_TEXT : STEP3_CTA_LABEL}
    </Button>
    {(!personalInfo.trim() || !platform) && (
      <p className="text-xs text-muted-foreground">{STEP3_CTA_DISABLED_HINT}</p>
    )}
  </form>
  ```
- [ ] **AC-2** · handleSubmit 逻辑(mock · 不接 backend):
  - setIsLoading(true)
  - await new Promise(r => setTimeout(r, 1500))(模拟 AI 生成)
  - 生成 mock result 数据(参 spec §7.2 6 大模块结构 · 用 placeholder 文本填充)
  - stepData.save('step3', { input: { personalInfo, platform, audience, accountStatus }, result: mockResult })
  - setIsLoading(false)
  - scrollIntoView 到输出区(US-006b 实现的 anchor)
- [ ] **AC-3** · 字段读 stepData 预填 · 进入 page 时若 `acc_step3` 存在 · 表单字段预填上次值
- [ ] **AC-4** · industryLabel 读 stepData · 从 `acc_step1.industryLabel` 读 · 找不到则 fallback 显示 `(未选择)`
- [ ] **AC-5** · 字面校验 · grep 必须命中:
  - `grep -F "你的个人信息" apps/web/src/pages/Step3.tsx` 命中 1 次
  - `grep -F "目标平台" apps/web/src/pages/Step3.tsx` 命中 1 次
  - `grep -F "目标受众" apps/web/src/pages/Step3.tsx` 命中 1 次
  - `grep -F "现有账号情况" apps/web/src/pages/Step3.tsx` 命中 1 次
- [ ] **AC-6** · 使用 agent-browser:
  - 打开 `/step/1` · 选 `💅 美业` · 进入 `/step/3`
  - 顶部显示 `STEP 03 · 账号包装方案`
  - H1 `账号包装方案`
  - 副标含 `当前行业：美业`
  - 5 platform radio 卡片 grid 显示 · 含 `📱 抖音` `📕 小红书` `📺 视频号` `🎬 快手` `📺 B站`
  - textarea 必填 placeholder 显示 `详细描述你的个人背景...示例：我是一名有10年经验的美容师...`
  - 填 textarea + 选 `📱 抖音` · CTA 变可点击 · 点击进入 loading
- [ ] **AC-7** · 控制台无 error
- [ ] **AC-8** · Typecheck 通过

**files_to_create** · (无)
**files_to_modify** · `apps/web/src/pages/Step3.tsx`(form 部分 · 输出区由 US-006b 接力)
**test_command** · `cd apps/web && pnpm tsc --noEmit`
**size_hint** · medium-large
**risk_level** · high(form 字段多 · 字面锁严)

---

### US-006b high · Step 3 page · 6 H3 输出区 + 每 H3 三按钮 + 顶部右侧 2 按钮

**描述** · 作为用户,提交表单后 mock 生成完成,我想在表单下方看到 6 H3 输出区(视频参考 / 昵称推荐 / 头像设计 / 背景图设计 / 简介文案 / 整体策略)· 每个 H3 右侧有 [复制] [重新生成] [智能优化] 三按钮 · 头像/背景图 H3 额外有 [生成参考图] 按钮 · 顶部右侧有 [一键重新生成] [复制全部] 两按钮。

**Acceptance Criteria** ·

- [ ] **AC-1** · Step3.tsx 表单下方加输出区(stepData.step3.result 非空时显示)· 完整代码:
  ```tsx
  {result && (
    <section id="step3-output" className="mt-12">
      {/* 顶部右侧 2 按钮 */}
      <div className="flex justify-end gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={handleRegenAll}>
          <RefreshCw className="w-4 h-4 mr-1" />
          {STEP3_HEADER_BUTTON_REGEN_ALL}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyAll}>
          <Copy className="w-4 h-4 mr-1" />
          {STEP3_HEADER_BUTTON_COPY_ALL}
        </Button>
      </div>

      {/* 6 H3 输出区 */}
      <div className="space-y-8">
        {STEP3_OUTPUT_H3_6.map(block => {
          const blockData = result[block.id];
          const isImageBlock = block.id === 'avatar' || block.id === 'background';

          return (
            <div key={block.id} className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-2xl">{block.h3Label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{block.hint}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(block.id)}>
                    <Copy className="w-4 h-4 mr-1" />
                    {STEP3_BUTTON_COPY}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRegen(block.id)}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {STEP3_BUTTON_REGENERATE}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleOptimize(block.id)}>
                    <Wand2 className="w-4 h-4 mr-1" />
                    {STEP3_BUTTON_OPTIMIZE}
                  </Button>
                  {isImageBlock && (
                    <Button variant="outline" size="sm" onClick={() => handleGenImage(block.id)}>
                      <ImagePlus className="w-4 h-4 mr-1" />
                      {STEP3_BUTTON_GEN_IMAGE}
                    </Button>
                  )}
                </div>
              </div>

              {/* 模块内容 · 按 block.id 渲染不同结构 · 用 mock data */}
              <Step3OutputContent blockId={block.id} data={blockData} />
            </div>
          );
        })}
      </div>
    </section>
  )}
  ```
- [ ] **AC-2** · Step3OutputContent 组件 · 按 block.id 渲染对应结构(参 spec §7.2 6 大模块字段):
  - videoReferences · `Array<{title, description, platform, searchQuery}>` × 3
  - nickname · `recommended: Array<{name, reason, searchability}> × 5` + `strategy` + `platformAdjust`
  - avatar · `style / colorScheme / expression / references / mustHave / avoid / aiPrompt`
  - background · `style / layout / colorTone / copyContent / mustHave / platformSizes / aiPrompt`
  - bio · `formula + versions × 6(3 平台 × 主号副号)`
  - strategy · `visualConsistency / firstImpression / conversionPath / platformPriority`
- [ ] **AC-3** · 三按钮交互(mock · 不接 backend):
  - handleCopy(blockId)· 把对应 block 内容 copy 到剪贴板(navigator.clipboard.writeText)· toast 提示 `已复制`
  - handleRegen(blockId)· toast 提示 `重新生成中...`(mock 1.5s 后更新该 block 数据)
  - handleOptimize(blockId)· 弹小 modal 让用户输入"优化方向"(如"更年轻化")· toast 提示 `智能优化中...`
- [ ] **AC-4** · handleRegenAll · 顶部 [一键重新生成] · 重新跑 mock 全部 6 block · toast 提示 `全部模块重新生成中...`
- [ ] **AC-5** · handleCopyAll · 顶部 [复制全部] · 把 6 block 内容拼接 copy · toast 提示 `已复制全部 6 个模块`
- [ ] **AC-6** · 字面校验 · grep 6 H3 label 严格命中:
  - `grep -F "1. 视频参考案例" apps/web/src/pages/Step3.tsx` 命中(via STEP3_OUTPUT_H3_6 import 间接)
  - 同样 `2. 昵称推荐` `3. 头像设计方案` `4. 背景图设计方案` `5. 简介文案方案` `6. 整体包装策略`
  - 三按钮字面 `复制` `重新生成` `智能优化` `生成参考图` 必须从 step3.ts 常量读 · 不允许 hardcode
- [ ] **AC-7** · 使用 agent-browser:
  - 走 US-006a 流程到 loading 完成
  - 输出区 6 H3 渲染 · 每个 H3 右侧三按钮可见
  - 头像 / 背景图 H3 额外显示 [生成参考图] 按钮
  - 顶部右侧 [一键重新生成] [复制全部] 可见
  - 点 H3 第 1 个的 [复制] · toast `已复制`
- [ ] **AC-8** · Typecheck 通过

**files_to_create** · `apps/web/src/components/step3/Step3OutputContent.tsx`
**files_to_modify** · `apps/web/src/pages/Step3.tsx`(output 部分接力)
**test_command** · `cd apps/web && pnpm tsc --noEmit`
**size_hint** · medium-large
**risk_level** · high(6 模块结构复杂 · 字面锁多)

---

### US-007 ★ foundation · `step3b.ts` 常量(3 textarea + 5 H3 输出 + 字面锁)

**描述** · 作为开发者,我需要把 Step 3b 的 3 textarea + 1 input + 5 H3 输出区字面常量化为 `apps/web/src/lib/constants/step3b.ts`,以便 US-008 直接读 · 字面 1:1 严锁(D1=A 红线)。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/src/lib/constants/step3b.ts` · 完整代码:
  ```typescript
  // STEP3B_TEXTAREAS_3 · 3 textarea 字段字面 1:1 来源 spec §7.3
  export interface Step3bTextarea {
    id: 'personalInfo' | 'advantages' | 'story';
    label: string;
    required: boolean;
    placeholder: string;
    minHeight?: string;
  }

  export const STEP3B_TEXTAREAS_3: readonly Step3bTextarea[] = [
    {
      id: 'personalInfo',
      label: '你的个人信息',
      required: true,
      placeholder: '详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。\n\n示例：我是一名有10年经验的美容师，擅长皮肤管理和抗衰项目...',
      minHeight: 'min-h-[160px]',
    },
    {
      id: 'advantages',
      label: '个人优势/特长',
      required: false,
      placeholder: '你有什么独特的优势？比如：独特的经历、专业证书、成功案例、个人特质...',
      minHeight: 'min-h-[120px]',
    },
    {
      id: 'story',
      label: '个人故事/经历',
      required: false,
      placeholder: '分享你的个人故事：为什么做这个行业？有什么转折点？什么经历让你与众不同？',
      minHeight: 'min-h-[120px]',
    },
  ] as const;

  // STEP3B_INPUT_1 · 目标受众 input
  export const STEP3B_AUDIENCE = {
    label: '目标受众',
    required: false,
    placeholder: '你想吸引什么样的粉丝？',
  } as const;

  // STEP3B_OUTPUT_H3_5 · 5 H3 输出模块字面 1:1 来源 spec §7.3 "5 大模块"
  export interface Step3bOutputBlock {
    id: 'coreIdentity' | 'thoughtSystem' | 'contentPersona' | 'trustSystem' | 'roadmap';
    h3Label: string;
    hint: string;
  }

  export const STEP3B_OUTPUT_H3_5: readonly Step3bOutputBlock[] = [
    { id: 'coreIdentity',   h3Label: '1. 核心身份定位', hint: '人设标签 + 个人口号 + 差异化定位 + 记忆点设计 + 性格特质' },
    { id: 'thoughtSystem',  h3Label: '2. 思想体系',     hint: '核心理念 3 个 + 独特观点(引爆流量)+ 口头禅设计' },
    { id: 'contentPersona', h3Label: '3. 内容人设',     hint: '说话风格 + 示例口播 + 视觉风格 + 4 大内容支柱' },
    { id: 'trustSystem',    h3Label: '4. 信任构建体系', hint: '专业背书 + 社会证明 + 个人故事(完整故事线 + 转折点)' },
    { id: 'roadmap',        h3Label: '5. 人设打造路线图', hint: '0-1 个月 / 1-3 个月 / 3-6 个月 阶段目标 + 关键成果' },
  ] as const;

  // STEP3B_BUTTONS_3 · 主 CTA + 次按钮
  export const STEP3B_CTA_LABEL = '生成专属人设方案';
  export const STEP3B_BUTTON_OPTIMIZE = '智能优化';
  export const STEP3B_BUTTON_COPY_ALL = '复制全部';

  // STEP3B_PAGE · 顶部 step 标签 + H1 + 副标
  export const STEP3B_STEP_TAG = 'STEP 03b · 人设定制方案';
  export const STEP3B_H1 = '人设定制方案';
  export const STEP3B_SUBTITLE_TEMPLATE = '当前行业：{industry}。输入你的个人信息和故事，AI 将精准识别你的独特人设、记忆点、思想体系，打造有辨识度的个人 IP。';

  // STEP3B_LOADING_TEXT
  export const STEP3B_LOADING_TEXT = 'AI 正在深度分析你的人设...';
  ```
- [ ] **AC-2** · 字面校验 · grep 必须命中:
  - `grep -F "你的个人信息" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "个人优势/特长" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "个人故事/经历" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "目标受众" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "核心身份定位" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "思想体系" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "内容人设" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "信任构建体系" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "人设打造路线图" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "生成专属人设方案" apps/web/src/lib/constants/step3b.ts` 命中 1 次
  - `grep -F "STEP 03b · 人设定制方案" apps/web/src/lib/constants/step3b.ts` 命中 1 次
- [ ] **AC-3** · 数字锁 · `STEP3B_TEXTAREAS_3.length === 3` + `STEP3B_OUTPUT_H3_5.length === 5`
- [ ] **AC-4** · 单元测试 · 新建 `apps/web/src/lib/constants/__tests__/step3b.test.ts`:
  ```typescript
  describe('STEP3B constants', () => {
    it('3 textareas', () => expect(STEP3B_TEXTAREAS_3.length).toBe(3));
    it('5 H3 output blocks', () => expect(STEP3B_OUTPUT_H3_5.length).toBe(5));
    it('first textarea is required', () => expect(STEP3B_TEXTAREAS_3[0].required).toBe(true));
    it('advantages and story are optional', () => {
      expect(STEP3B_TEXTAREAS_3[1].required).toBe(false);
      expect(STEP3B_TEXTAREAS_3[2].required).toBe(false);
    });
    it('output H3 labels start with number 1-5', () => {
      STEP3B_OUTPUT_H3_5.forEach((block, idx) => {
        expect(block.h3Label.startsWith(`${idx + 1}. `)).toBe(true);
      });
    });
  });
  ```
- [ ] **AC-5** · Typecheck + 测试通过

**files_to_create** · `apps/web/src/lib/constants/step3b.ts` · `apps/web/src/lib/constants/__tests__/step3b.test.ts`
**files_to_modify** · (无)
**test_command** · `cd apps/web && pnpm vitest run src/lib/constants/__tests__/step3b.test.ts && pnpm tsc --noEmit`
**size_hint** · medium
**risk_level** · foundation(US-008 消费 + 字面锁字段多)

---

### US-008 high · Step 3b page · 3 textarea + 5 platform radio + 1 input + 5 H3 输出区

**描述** · 作为用户,我进入 `/step/3b` 想看到 1:1 复刻 aiipznt 的人设定制方案 page:顶部 step 标签 + H1 + 副标 + 3 textarea(第一必填)+ 5 platform radio + 1 input + 主 CTA "生成专属人设方案" + 5 H3 输出区(核心身份定位 / 思想体系 / 内容人设 / 信任构建体系 / 人设打造路线图)。

**Acceptance Criteria** ·

- [ ] **AC-1** · 重写 `apps/web/src/pages/Step3b.tsx`(替换 StepForm 通用方案)· 表单部分代码骨架:
  ```tsx
  // 顶部
  <div className="text-sm font-label text-primary">{STEP3B_STEP_TAG}</div>
  <h1 className="font-display text-4xl md:text-5xl font-black mt-2">{STEP3B_H1}</h1>
  <p className="text-base text-muted-foreground mt-3">
    {STEP3B_SUBTITLE_TEMPLATE.replace('{industry}', industryLabel)}
  </p>

  <form onSubmit={handleSubmit} className="mt-8 space-y-6">
    {/* 3 textarea 渲染 */}
    {STEP3B_TEXTAREAS_3.map(field => (
      <div key={field.id}>
        <label className="font-label text-sm flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </label>
        <Textarea
          required={field.required}
          value={formData[field.id]}
          onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
          placeholder={field.placeholder}
          className={cn("mt-2 font-cn", field.minHeight)}
        />
      </div>
    ))}

    {/* 5 platform radio · 复用 STEP3_PLATFORMS_5 */}
    <div>
      <label className="font-label text-sm flex items-center gap-1">
        目标平台
        <span className="text-destructive">*</span>
      </label>
      <RadioGroup value={platform} onValueChange={setPlatform} className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
        {STEP3_PLATFORMS_5.map(p => (
          <div key={p.id} className="flex items-center space-x-2 glass-card rounded-lg p-3 hover:border-primary/40">
            <RadioGroupItem value={p.id} id={`step3b-${p.id}`} />
            <label htmlFor={`step3b-${p.id}`} className="font-cn text-sm cursor-pointer">
              {p.label}
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>

    {/* 目标受众 input */}
    <div>
      <label className="font-label text-sm">{STEP3B_AUDIENCE.label}</label>
      <Input
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        placeholder={STEP3B_AUDIENCE.placeholder}
        className="mt-2 h-12"
      />
    </div>

    {/* 主 CTA */}
    <Button
      type="submit"
      disabled={!formData.personalInfo.trim() || !platform || isLoading}
      className="..."
    >
      {isLoading ? STEP3B_LOADING_TEXT : STEP3B_CTA_LABEL}
    </Button>
  </form>
  ```
- [ ] **AC-2** · 自动从 stepData.step3.input.personalInfo 复用(spec §7.3 "自动复用 step3 的个人信息作为预填"):
  - 进入 `/step/3b` 时若 `acc_step3` 存在 · `formData.personalInfo` 预填 step3 的同字段值
  - 用户可继续编辑覆盖
- [ ] **AC-3** · handleSubmit mock(同 US-006a 风格)· 生成 5 大模块 mock 结果 · 保存到 stepData(`acc_step3b`)
- [ ] **AC-4** · 输出区 · 5 H3 用 STEP3B_OUTPUT_H3_5 渲染 · 结构同 US-006b 但只 5 个 H3(无 [生成参考图] 按钮 · 只有 [复制] [重新生成] [智能优化] 三按钮)
- [ ] **AC-5** · 输出区内容渲染 · 按 spec §7.3 5 大模块字段:
  - coreIdentity · `persona / slogan / differentiation / memoryPoints / personality`
  - thoughtSystem · `coreIdeas × 3 / uniqueViews / catchphrases`
  - contentPersona · `speakingStyle / sampleScript / visualStyle / contentPillars × 4`
  - trustSystem · `endorsements / socialProof / personalStory`
  - roadmap · 3 阶段 `0-1 个月 / 1-3 个月 / 3-6 个月` 各自 `goal + keyResults`
- [ ] **AC-6** · 字面校验:
  - `grep -F "STEP 03b · 人设定制方案" apps/web/src/pages/Step3b.tsx` 命中
  - `grep -F "人设定制方案" apps/web/src/pages/Step3b.tsx` 命中(H1)
  - 5 H3 文字通过 step3b.ts 常量 import 间接命中
- [ ] **AC-7** · 使用 agent-browser:
  - 走 US-003 流程 selected `美业` · 走 US-006a 提 step3 form 含 `personalInfo: "我是 X"`
  - 进入 `/step/3b` · 验证 `你的个人信息` textarea 预填 `我是 X`
  - 填 advantages / story · 选 `📱 抖音` · 点 CTA
  - loading 后输出区 5 H3 渲染:`核心身份定位 / 思想体系 / 内容人设 / 信任构建体系 / 人设打造路线图`
  - 每 H3 右侧三按钮 `复制 / 重新生成 / 智能优化`(无 [生成参考图])
- [ ] **AC-8** · Typecheck 通过

**files_to_create** · `apps/web/src/components/step3b/Step3bOutputContent.tsx`
**files_to_modify** · `apps/web/src/pages/Step3b.tsx`
**test_command** · `cd apps/web && pnpm tsc --noEmit`
**size_hint** · medium-large
**risk_level** · high(3 textarea + 5 H3 + 字面锁严)

---

### US-009 ★ foundation · 三态组件 + 跨 step 复用规范(LoadingState / ErrorState / EmptyState)

**描述** · 作为开发者,我需要把 Step 1 / Step 3 / Step 3b 三个 page 共用的 Loading / Error / Empty 三态抽象为 3 个组件 + 复用规范,以便后续 PRD-18(Step 4-8)+ PRD-19(工具页)同款复用 · 不重复造轮子。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/src/components/states/LoadingState.tsx` · 完整代码:
  ```tsx
  import { Loader2 } from 'lucide-react';
  import { cn } from '@/lib/utils';

  export interface LoadingStateProps {
    text?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
  }

  export function LoadingState({ text = '加载中...', className, size = 'md' }: LoadingStateProps) {
    const iconSize = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
    const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }[size];

    return (
      <div className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
        <Loader2 className={cn(iconSize, 'animate-spin text-primary')} />
        <p className={cn(textSize, 'font-cn text-muted-foreground')}>{text}</p>
      </div>
    );
  }
  ```
- [ ] **AC-2** · 新建 `apps/web/src/components/states/ErrorState.tsx` · 完整代码:
  ```tsx
  import { AlertTriangle } from 'lucide-react';
  import { Button } from '@/components/ui/button';
  import { cn } from '@/lib/utils';

  export interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
  }

  export function ErrorState({
    title = '出错了',
    message = '请稍后重试或联系客服',
    onRetry,
    className,
  }: ErrorStateProps) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 gap-3 glass-card rounded-xl p-6', className)}>
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h3 className="font-display text-xl text-foreground">{title}</h3>
        <p className="text-sm font-cn text-muted-foreground text-center max-w-md">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-2">
            重试
          </Button>
        )}
      </div>
    );
  }
  ```
- [ ] **AC-3** · 新建 `apps/web/src/components/states/EmptyState.tsx` · 完整代码:
  ```tsx
  import { Inbox } from 'lucide-react';
  import { cn } from '@/lib/utils';
  import type { ReactNode } from 'react';

  export interface EmptyStateProps {
    title?: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
  }

  export function EmptyState({
    title = '暂无数据',
    description,
    action,
    icon,
    className,
  }: EmptyStateProps) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
        {icon ?? <Inbox className="w-12 h-12 text-muted-foreground/60" />}
        <h3 className="font-display text-lg text-foreground">{title}</h3>
        {description && (
          <p className="text-sm font-cn text-muted-foreground text-center max-w-md">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
  ```
- [ ] **AC-4** · 新建 `apps/web/src/components/states/index.ts` barrel export · `export * from './LoadingState'` 等 3 行
- [ ] **AC-5** · 复用规范(写入 `apps/web/src/components/states/README.md` 5 行简文档):
  - LoadingState · 异步生成中 / 加载中场景
  - ErrorState · 任何 error 场景 · 必带 onRetry 时显示重试按钮
  - EmptyState · 列表为空 / 搜索无结果 / 未选行业等空状态
  - 跨 step 复用 · Step1/3/3b/4-8 + 工具 page 都直接 import 用 · 不重复造轮子
- [ ] **AC-6** · 单元测试 · 新建 `apps/web/src/components/states/__tests__/states.test.tsx`:
  ```tsx
  describe('State components', () => {
    it('LoadingState renders text', () => {
      const { getByText } = render(<LoadingState text="测试中" />);
      expect(getByText('测试中')).toBeInTheDocument();
    });
    it('ErrorState renders retry button when onRetry provided', () => {
      const { getByText } = render(<ErrorState onRetry={() => {}} />);
      expect(getByText('重试')).toBeInTheDocument();
    });
    it('EmptyState renders default title', () => {
      const { getByText } = render(<EmptyState />);
      expect(getByText('暂无数据')).toBeInTheDocument();
    });
  });
  ```
- [ ] **AC-7** · Step1/Step3/Step3b 至少各引用 1 处(LoadingState in CTA loading · EmptyState in 56 行业 filter empty 等)· grep 验证 import:
  - `grep -F "from '@/components/states'" apps/web/src/pages/Step1.tsx` 命中
  - `grep -F "from '@/components/states'" apps/web/src/pages/Step3.tsx` 命中
  - `grep -F "from '@/components/states'" apps/web/src/pages/Step3b.tsx` 命中
- [ ] **AC-8** · Typecheck + 测试通过

**files_to_create** · `apps/web/src/components/states/LoadingState.tsx` · `apps/web/src/components/states/ErrorState.tsx` · `apps/web/src/components/states/EmptyState.tsx` · `apps/web/src/components/states/index.ts` · `apps/web/src/components/states/README.md` · `apps/web/src/components/states/__tests__/states.test.tsx`
**files_to_modify** · Step1/Step3/Step3b(各加 import + 至少 1 处使用)
**test_command** · `cd apps/web && pnpm vitest run src/components/states/__tests__/states.test.tsx && pnpm tsc --noEmit`
**size_hint** · medium
**risk_level** · foundation(跨 step + 下游 PRD 都复用)

---

### US-010 收官 medium · E2E 集成验收 · Step 1 → Step 3 → Step 3b 完整流程 + agent-browser 自动化 + 截图

**描述** · 作为质量保障,我需要跨 Step 1 → Step 3 → Step 3b 完整流程的 E2E 自动化测试 + 3 张截图,验证 stepData 跨 step 传递正确 + 字面 1:1 渲染 + 无控制台 error。

**Acceptance Criteria** ·

- [ ] **AC-1** · 新建 `apps/web/e2e/prd-17-step1-3-3b.spec.ts`(playwright)· 完整 flow:
  ```typescript
  import { test, expect } from '@playwright/test';

  test('PRD-17 · Step 1 → Step 3 → Step 3b 完整流程', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

    // Step 1
    await page.goto('http://localhost:5173/step/1');
    await expect(page.locator('h1')).toContainText('选择你的行业赛道');
    await expect(page.locator('text=STEP 01 · 选择行业赛道')).toBeVisible();
    await expect(page.locator('text=全部行业 (56)')).toBeVisible();
    await expect(page.locator('text=生活服务 (18)')).toBeVisible();
    // 截图 1
    await page.screenshot({ path: 'apps/web/e2e/screenshots/prd-17-step1.png', fullPage: true });
    // 选美业
    await page.locator('button:has-text("美业")').click();
    await expect(page.locator('text=已选择:美业')).toBeVisible();
    await page.locator('button:has-text("确认并进入下一步")').click();

    // Step 3
    await expect(page).toHaveURL(/\/step\/3$/);
    await expect(page.locator('h1')).toContainText('账号包装方案');
    await expect(page.locator('text=STEP 03 · 账号包装方案')).toBeVisible();
    await expect(page.locator('text=当前行业：美业')).toBeVisible();
    // 验证 5 platform radio 都显示
    await expect(page.locator('text=📱 抖音')).toBeVisible();
    await expect(page.locator('text=📕 小红书')).toBeVisible();
    await expect(page.locator('text=📺 视频号')).toBeVisible();
    await expect(page.locator('text=🎬 快手')).toBeVisible();
    await expect(page.locator('text=📺 B站')).toBeVisible();
    // 填表单
    await page.locator('textarea').first().fill('我是一名 10 年经验的美容师,擅长皮肤管理项目');
    await page.locator('label[for="douyin"]').click();
    await page.locator('button:has-text("生成账号包装方案")').click();
    // 等 loading 完成 + 输出区渲染
    await expect(page.locator('h3:has-text("1. 视频参考案例")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("2. 昵称推荐")')).toBeVisible();
    await expect(page.locator('h3:has-text("3. 头像设计方案")')).toBeVisible();
    await expect(page.locator('h3:has-text("4. 背景图设计方案")')).toBeVisible();
    await expect(page.locator('h3:has-text("5. 简介文案方案")')).toBeVisible();
    await expect(page.locator('h3:has-text("6. 整体包装策略")')).toBeVisible();
    // 截图 2
    await page.screenshot({ path: 'apps/web/e2e/screenshots/prd-17-step3.png', fullPage: true });

    // Step 3b
    await page.goto('http://localhost:5173/step/3b');
    await expect(page.locator('h1')).toContainText('人设定制方案');
    await expect(page.locator('text=STEP 03b · 人设定制方案')).toBeVisible();
    await expect(page.locator('text=当前行业：美业')).toBeVisible();
    // personalInfo 应预填(从 step3 同字段)
    await expect(page.locator('textarea').first()).toHaveValue(/美容师/);
    // 填 advantages + story
    await page.locator('textarea').nth(1).fill('独特优势:获国家级美容师证书');
    await page.locator('textarea').nth(2).fill('个人故事:从工厂工人转行做美容师 8 年');
    await page.locator('label[for="step3b-douyin"]').click();
    await page.locator('button:has-text("生成专属人设方案")').click();
    // 等输出区 5 H3
    await expect(page.locator('h3:has-text("1. 核心身份定位")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("2. 思想体系")')).toBeVisible();
    await expect(page.locator('h3:has-text("3. 内容人设")')).toBeVisible();
    await expect(page.locator('h3:has-text("4. 信任构建体系")')).toBeVisible();
    await expect(page.locator('h3:has-text("5. 人设打造路线图")')).toBeVisible();
    // 截图 3
    await page.screenshot({ path: 'apps/web/e2e/screenshots/prd-17-step3b.png', fullPage: true });

    // 全程 0 console error
    expect(consoleErrors).toEqual([]);
  });
  ```
- [ ] **AC-2** · 3 张截图全部生成到 `apps/web/e2e/screenshots/prd-17-step1.png` `prd-17-step3.png` `prd-17-step3b.png`
- [ ] **AC-3** · 跑测试 · `cd apps/web && pnpm playwright test e2e/prd-17-step1-3-3b.spec.ts` 全 PASS
- [ ] **AC-4** · 新建 `scripts/verify-prd-17.sh` 可重复验收脚本:
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  BASE="${1:-http://localhost:5173}"
  PASS=0; FAIL=0
  ok() { echo "  [OK] $1"; PASS=$((PASS + 1)); }
  fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }

  echo "── §1 industries.ts 字面 ──"
  grep -qF "全部行业" apps/web/src/lib/constants/industries.ts && ok "STEP1_TABS 全部行业" || fail "全部行业 字面 missing"
  grep -qF "确认并进入下一步" apps/web/src/lib/constants/industries.ts && ok "STEP1_CTA 字面" || fail "确认并进入下一步 missing"

  echo "── §2 step3.ts 字面 ──"
  grep -qF "📱 抖音" apps/web/src/lib/constants/step3.ts && ok "STEP3_PLATFORMS_5 抖音 emoji" || fail "📱 抖音 missing"
  grep -qF "生成账号包装方案" apps/web/src/lib/constants/step3.ts && ok "STEP3_CTA 字面" || fail "生成账号包装方案 missing"

  echo "── §3 step3b.ts 字面 ──"
  grep -qF "生成专属人设方案" apps/web/src/lib/constants/step3b.ts && ok "STEP3B_CTA 字面" || fail "生成专属人设方案 missing"
  grep -qF "核心身份定位" apps/web/src/lib/constants/step3b.ts && ok "STEP3B_OUTPUT 核心身份定位" || fail "核心身份定位 missing"

  echo "── §4 三态组件 ──"
  [ -f apps/web/src/components/states/LoadingState.tsx ] && ok "LoadingState 文件存在" || fail "LoadingState missing"
  [ -f apps/web/src/components/states/ErrorState.tsx ] && ok "ErrorState 文件存在" || fail "ErrorState missing"
  [ -f apps/web/src/components/states/EmptyState.tsx ] && ok "EmptyState 文件存在" || fail "EmptyState missing"

  echo "── §5 page 重写 ──"
  grep -q "STEP1_INDUSTRIES_56\|STEP1_TABS" apps/web/src/pages/Step1.tsx && ok "Step1 用了 industries 常量" || fail "Step1 未读 industries 常量"
  grep -q "STEP3_PLATFORMS_5\|STEP3_OUTPUT_H3_6" apps/web/src/pages/Step3.tsx && ok "Step3 用了 step3 常量" || fail "Step3 未读 step3 常量"
  grep -q "STEP3B_TEXTAREAS_3\|STEP3B_OUTPUT_H3_5" apps/web/src/pages/Step3b.tsx && ok "Step3b 用了 step3b 常量" || fail "Step3b 未读 step3b 常量"

  echo ""
  echo "Result: $PASS passed, $FAIL failed"
  exit $FAIL
  ```
- [ ] **AC-5** · chmod +x · `chmod +x scripts/verify-prd-17.sh`
- [ ] **AC-6** · 跑 verify-prd-17.sh 全 PASS · 0 fail
- [ ] **AC-7** · Typecheck 全工程通过 · `cd apps/web && pnpm tsc --noEmit` 0 error
- [ ] **AC-8** · 零回归 · 跑全工程已有测试 · `pnpm test` 全 PASS · 不允许引入 fail

**files_to_create** · `apps/web/e2e/prd-17-step1-3-3b.spec.ts` · `apps/web/e2e/screenshots/.gitkeep` · `scripts/verify-prd-17.sh`
**files_to_modify** · (无)
**test_command** · `cd apps/web && pnpm playwright test e2e/prd-17-step1-3-3b.spec.ts && cd ../.. && bash scripts/verify-prd-17.sh`
**size_hint** · medium
**risk_level** · medium(E2E 串联 · cross-step 协议锁验证关键)

---

## §2 Functional Requirements

- **FR-1** · 系统必须提供 `apps/web/src/lib/constants/industries.ts`,导出 STEP1_TABS(6 项)+ STEP1_INDUSTRIES_56(56 项 5 大类)+ 搜索/CTA/Modal 字面常量
- **FR-2** · `apps/web/src/pages/Step1.tsx` 必须用 STEP1_TABS / STEP1_INDUSTRIES_56 渲染,**不允许** hardcode 行业字面/数字
- **FR-3** · Step 1 顶部 step 标签必须 1:1 显示 `STEP 01 · 选择行业赛道`
- **FR-4** · Step 1 H1 必须 1:1 显示 `选择你的行业赛道`
- **FR-5** · Step 1 搜索框 placeholder 必须 1:1 显示 `搜索行业名称或关键词（如：美容院、餐饮、教育...）`
- **FR-6** · Step 1 已选状态卡必须显示 `已选择:{industry.label}` + 关键词列表
- **FR-7** · Step 1 主 CTA 必须 1:1 显示 `确认并进入下一步` + var(--primary) gradient(不允许"金色"或"紫色"措辞)
- **FR-8** · Step 1 自定义 modal 必须用 shadcn Dialog · trigger label `自定义输入行业` + modal title `自定义你的行业` + confirm button `确认使用`
- **FR-9** · 系统必须提供 `apps/web/src/lib/constants/step3.ts`,导出 STEP3_PLATFORMS_5(5 平台含 emoji)+ STEP3_OUTPUT_H3_6(6 H3 输出区)+ 表单字段字面常量
- **FR-10** · `apps/web/src/pages/Step3.tsx` 必须用 STEP3_PLATFORMS_5 / STEP3_OUTPUT_H3_6 渲染,**不允许** hardcode 平台或 H3 字面
- **FR-11** · Step 3 5 platform radio 标签必须 1:1 含 emoji · 严禁去掉 emoji(D1=A 锁)
- **FR-12** · Step 3 6 H3 输出区文字必须 1:1 来源 STEP3_OUTPUT_H3_6 · 严禁创意改写(D1=A 锁)
- **FR-13** · Step 3 每 H3 子模块右侧三按钮 `复制` `重新生成` `智能优化` + 头像/背景图额外 `生成参考图`
- **FR-14** · Step 3 顶部右侧 `一键重新生成` `复制全部` 两按钮
- **FR-15** · 系统必须提供 `apps/web/src/lib/constants/step3b.ts`,导出 STEP3B_TEXTAREAS_3(3 textarea)+ STEP3B_OUTPUT_H3_5(5 H3)+ 表单字段字面常量
- **FR-16** · `apps/web/src/pages/Step3b.tsx` 必须用 STEP3B_TEXTAREAS_3 / STEP3B_OUTPUT_H3_5 渲染
- **FR-17** · Step 3b textarea 字面严格 · `你的个人信息`(必填)/ `个人优势/特长`(可选)/ `个人故事/经历`(可选)
- **FR-18** · Step 3b 5 H3 输出区文字必须 1:1 来源 STEP3B_OUTPUT_H3_5 · 严禁创意改写
- **FR-19** · Step 3b 进入页面时若 `acc_step3` 存在,personalInfo textarea 自动预填 step3 同字段值
- **FR-20** · 三态组件 LoadingState / ErrorState / EmptyState 必须在 `apps/web/src/components/states/` 创建 + Step1/3/3b 各引用至少 1 处
- **FR-21** · stepData 持久化 · 全部用 localStorage key `acc_step1` / `acc_step3` / `acc_step3b` 前缀(继承 PRD-15 ls-namespace 规则)
- **FR-22** · 主 CTA 颜色 · 全用 `var(--primary)` gradient · 严禁"金色"/"紫色"/"violet"/"amber"/"gold" 等措辞(D4=B 锁)
- **FR-23** · E2E 测试 · `apps/web/e2e/prd-17-step1-3-3b.spec.ts` 完整跑 Step 1 → 3 → 3b 流程 + 3 截图 + 0 console error
- **FR-24** · 可重复验收 · `scripts/verify-prd-17.sh` 跑全 PASS · 含字面/数字/文件存在性 ≥ 12 项检查
- **FR-25** · 零回归 · `pnpm test` 工程全 PASS · 0 fail

---

## §3 Non-Goals(明确 6 项不做)

- **N-1** · 不实现 backend tRPC AI 生成 API · 仅前端 layout + mock data 填充(留 PRD-AI 专项)
- **N-2** · 不实现 [生成参考图] 按钮的真实图像生成 · 仅 button placeholder(toast 提示 "图像生成接口待 PRD-AI 接入")
- **N-3** · 不实现 Step 2 / Step 4 / Step 4b / Step 5 / Step 6 / Step 7 / Step 8 page(留 PRD-18)
- **N-4** · 不实现 14 工具 page 中尚未完整化的 8 个 stub(留 PRD-19)
- **N-5** · 不动 admin SPA (`apps/admin/`)· D3=A 锁定 · 0 触动
- **N-6** · 不切 QuanAn 颜色 token · 继续保留 globals.css `--primary: 43 87% 63%` 金色 + 紫色辅助 token(D4=B 锁)

---

## §4 Technical Considerations

### §4.1 stepData 持久化 + 跨 step 传递

- 用 localStorage 存 stepData · key 前缀 `acc_`(参 PRD-15 ls-namespace)
- 每 step 自管自的 key:`acc_step1` / `acc_step3` / `acc_step3b`
- 跨 step 读 · 如 Step 3 副标读 step1.industryLabel · Step 3b textarea 预填读 step3.input.personalInfo
- 数据 schema 简化 · 不做 zod 严格 validate · 各 step 用 `?.` 安全读 + fallback 默认值

### §4.2 mock 数据策略

- 各 step 的 mock result 数据用 const 写在 page 文件内 · 按 spec §7.x 模块字段结构填充 placeholder 文本
- mock 延迟 1.5s(`await new Promise(r => setTimeout(r, 1500))`)模拟 AI 生成
- 不接 backend tRPC · 不接 real LLM · 全前端 mock(N-1 锁)

### §4.3 三态组件复用规范

- LoadingState · 通用 spinner + 文案 · 默认 `加载中...`
- ErrorState · onRetry 可选 · 带 retry 时显示 [重试] 按钮 · 用 glass-card 包裹
- EmptyState · 通用 + 可定制 icon / title / description / action
- 跨 step / 跨 PRD 复用 · 不允许 page 内自造 Loading/Error/Empty

### §4.4 D4=B 颜色严锁(继承 PRD-16 §11.9.4)

- 严禁 grep 命中:`from-violet-` `to-violet-` `bg-violet-` `text-violet-` `border-violet-` `from-amber-` `to-amber-` `bg-amber-` `from-gold-` `to-gold-` `bg-gold-`
- 严禁 PRD AC 中文表述含"紫色 gradient"或"金色 gradient" · 必须写"`var(--primary)` gradient"
- 主 CTA 全用 `bg-gradient-to-r from-primary to-primary/80`(参 PRD-16 已落地范式)
- audit-redlines.sh 应加 R-A4 检测 violet/amber tailwind utility 违规

### §4.5 D1=A 字面锁严守(继承 PRD-16 §11.9.5)

- 6 常量文件(industries.ts / step3.ts / step3b.ts 等)的所有 label / placeholder / button text / H1 / H3 / step tag 必须字面 1:1 来源 spec §7.x + dump §2.2
- page 渲染必须 import 常量 · 不允许 hardcode 字面
- plan-check §2.6.20 D1A-text-content-drift 检查应触发
- Opus audit 时必须 grep 字面验证

### §4.6 文件路径约定(继承 PRD-16)

- 常量 · `apps/web/src/lib/constants/*.ts`
- 三态组件 · `apps/web/src/components/states/*.tsx`
- step page 输出区子组件 · `apps/web/src/components/step3/*.tsx` / `apps/web/src/components/step3b/*.tsx`
- page · `apps/web/src/pages/*.tsx`
- e2e · `apps/web/e2e/*.spec.ts`
- 单元测试 · `apps/web/src/**/__tests__/*.test.ts(x)`

---

## §5 跨 Story 协议锁(≥13 项 · 防 ralph 命名漂移)

| 命名 | 类型 | 定义 story | 消费 story | 说明 |
|---|---|---|---|---|
| `STEP1_TABS` | readonly Step1Tab[] | US-001 | US-002 | 6 tab 顺序 + count + emoji 字面锁 |
| `STEP1_INDUSTRIES_56` | readonly Industry[] | US-001 | US-002, US-003 | 56 行业 5 大类 + emoji + keywords |
| `STEP1_SEARCH_PLACEHOLDER` | string | US-001 | US-002 | 搜索框 placeholder 字面 |
| `STEP1_CTA_LABEL` | string | US-001 | US-003 | `确认并进入下一步` |
| `STEP1_CUSTOM_TRIGGER_LABEL` | string | US-001 | US-004 | `自定义输入行业` |
| `STEP1_CUSTOM_MODAL_*` | string × 4 | US-001 | US-004 | modal title / placeholder / confirm / cancel 字面 |
| `STEP3_PLATFORMS_5` | readonly Step3Platform[] | US-005 | US-006a, US-008 | 5 platform 含 emoji 字面 · Step 3b 共享 |
| `STEP3_OUTPUT_H3_6` | readonly Step3OutputBlock[] | US-005 | US-006b | 6 H3 字面 + hint |
| `STEP3_BUTTON_*` | string × 4 | US-005 | US-006b | 复制 / 重新生成 / 智能优化 / 生成参考图 字面 |
| `STEP3_FORM` | object | US-005 | US-006a | 4 字段 label + required + placeholder |
| `STEP3_CTA_LABEL` | string | US-005 | US-006a | `生成账号包装方案` |
| `STEP3B_TEXTAREAS_3` | readonly Step3bTextarea[] | US-007 | US-008 | 3 textarea label + placeholder + required |
| `STEP3B_OUTPUT_H3_5` | readonly Step3bOutputBlock[] | US-007 | US-008 | 5 H3 字面 + hint |
| `STEP3B_CTA_LABEL` | string | US-007 | US-008 | `生成专属人设方案` |
| `LoadingState / ErrorState / EmptyState` | React component | US-009 | US-002~008 | 跨 step 复用三态组件 |
| `acc_step1 / acc_step3 / acc_step3b` | localStorage key | US-003/006a/008 | US-006a, US-008, US-010 | stepData 持久化 key(前缀 `acc_` 继承 PRD-15) |
| `industryLabel` | string(via stepData.step1.industryLabel) | US-003 | US-006a, US-008 | Step 3/3b 副标 `当前行业:{industry}` 替换 |

**红线**:每条被引用的 AC 必须显式写出此命名(不允许说"读 step1 的行业字段"之类模糊表述)。定义 story 的 priority 必须**小于**消费 story。

---

## §6 Locked Decisions(D-146 ~ D-160 · 15 条 · 继承 PRD-16 D-130~D-145)

- **D-146** · 56 行业 5 大类来源 spec §7.1 + dump §2.2 实测确认(全部 56 / 生活服务 18 / 电商零售 13 / 内容创作 7 / 专业服务 14 / 产业制造 4)· 数字严锁
- **D-147** · Step 1 6 tab 顺序固定(全部行业 / 生活服务 / 电商零售 / 内容创作 / 专业服务 / 产业制造)· 不允许重排
- **D-148** · Step 3 表单字段严格 4 项 · 1 textarea(必填)+ 5 platform radio(必填)+ 2 input(可选)
- **D-149** · Step 3 输出 H3 严格 **6 模块**(视频参考 / 昵称推荐 / 头像设计 / 背景图设计 / 简介文案 / 整体包装策略)· 不是 7 · H1 "账号包装方案"是 H1 不算 H3
- **D-150** · Step 3b 表单字段严格 5 项 · 3 textarea(第 1 必填)+ 1 platform radio(必填)+ 1 input 受众(可选)
- **D-151** · Step 3b 输出 H3 严格 **5 模块**(核心身份定位 / 思想体系 / 内容人设 / 信任构建体系 / 人设打造路线图)· 不是 6 · H1 "人设定制方案"是 H1 不算 H3
- **D-152** · 三态组件 LoadingState / ErrorState / EmptyState 单独 US-009 foundation · 跨 step 复用 · PRD-18 / PRD-19 必继续复用 · 不重复造轮子
- **D-153** · E2E US-010 单独收官 story · playwright spec + agent-browser 自动化 + 3 截图 + 0 console error 硬门禁
- **D-154** · LD 延续 PRD-16 D-130~D-145 全部红线 · 字体设计系统 / 3 utility(glass-card / data-grid-bg / animate-ping-primary)/ D4=B 颜色 / D1=A 字面锁 / Header 4 dropdown(本 PRD 不动 Header)
- **D-155** · industries.ts 5 大类内行业数严锁(life=18 / ecom=13 / create=7 / pro=14 / mfg=4 = 56)· spec §7.1 实测 · 不允许调整
- **D-156** · Step 3 / Step 3b 输出区 H3 文字严格 1:1(不允许创意改写)· 防 PRD-16 US-004 reject 复发("15 desc 全创意改写"教训)
- **D-157** · 5 platform radio 标签严格 1:1 含 emoji(📱 抖音 / 📕 小红书 / 📺 视频号 / 🎬 快手 / 📺 B站)· 严禁去 emoji
- **D-158** · 主 CTA 用 `var(--primary)` gradient · PRD 文档严禁出现 "金色 gradient" 或 "紫色 gradient" 措辞 · 防 PRD-16 US-003 reject 复发(WARN 升 ERROR 教训)
- **D-159** · Step 3 子模块右侧三按钮 `复制` `重新生成` `智能优化` · 头像/背景图 H3 额外加 `生成参考图` · 顶部右侧 `一键重新生成` `复制全部` 两按钮
- **D-160** · 不实现 backend tRPC AI 生成 API + 不实现真实图像生成(留 PRD-AI 专项)· 本 PRD 纯前端 mock data + setTimeout 模拟生成延迟

---

## §7 Success Metrics

- **M-1** · 11 US 100% PASS · 严格一轮通过率 ≥ 75%(对标 PRD-16 73%)· 不允许 daemon BLOCKED
- **M-2** · plan-check 0 ERROR(L4 升级后第一次实战 · 必触发 §2.6.7-ext + §2.6.20 + §2.6.13)
- **M-3** · 总开发 wall time ≤ 2 周(11 US × 平均 1.5h = 16h daemon time + audit overhead)
- **M-4** · 反例累加机制持续验证 · PRD-17 严格一轮通过率应 ≥ PRD-16(73%)· 因为加了 3 新反例(D4=B / D1=A / Dialog asChild)
- **M-5** · 零回归 · pnpm test 全工程 PASS · 0 fail
- **M-6** · TD 净增长 ≤ 3 条(PRD-16 净增长 +2)· 不允许爆雷 TD
- **M-7** · 3 张 e2e 截图视觉对比 aiipznt(人工 review)· 偏差 ≤ 5%

---

## §8 Open Questions(待 PRD-17 实施期 Opus 主对话回答)

- **Q-1** · 56 行业 5 大类的完整字面 emoji + 关键词列表 · 是从 spec §7.1 手工抄 56 条 · 还是 ralph 实施时按 spec §7.1 引用 + 自补?(建议:让 ralph 实施时按 spec 完整抄出 56 条 · D-155 已锁数字)
- **Q-2** · Step 3 mock data 文本质量 · 是用真实文案(从 spec §7.2 复制示例)还是用纯 placeholder ("这里是视频参考案例 1 的标题")?(建议:用 spec §7.2 半真实示例 + 标注 `// mock data` 注释 · 让用户视觉对比 aiipznt 更接近)
- **Q-3** · 三态组件颜色 · LoadingState 用 `text-primary` 还是 `text-foreground`?(建议:`text-primary` · 跟 CTA 同色系 · 强化金色品牌)

---

## §9 反例库注入清单(US-001 + US-005 + US-006a + US-006b + US-007 + US-008 + US-009 强制注入)

### 关键词检索范围(`~/.claude/playbooks/reject-examples.jsonl` 47+ 条)

| US | 关键词 | 预期检索条数 | 优先反例 |
|:-:|---|:-:|---|
| US-001 | constants / 56 / 字面 / industries / TypeScript readonly | 2-3 | PRD-16 US-005 reject "命名 constants 必须 readonly + as const" · PRD-15 USx 类似常量字面锁 |
| US-005 | platforms / H3 / 输出区 / 字面 / placeholder / 跨 Story 协议锁 | 3 | PRD-16 US-004 reject "desc 字面创意改写"(高优先) + PRD-16 US-005 类似 PrivateDomain constants |
| US-006a | textarea / radio / form / 必填 / required / placeholder | 3 | PRD-16 US-002 form validation · PRD-15 US-006 form 用 zod 但实际用 native required |
| US-006b | H3 / 6 / 输出区 / 字面 / 按钮 / 复制 | 3 | PRD-16 US-004 reject "15 卡 desc 全创意改写"(必读 · 防 6 H3 desc 漂移) + PRD-16 US-007 reject "Header dropdown hover→click" |
| US-007 | textarea / 3 / 必填 / placeholder / 字面 | 2-3 | 同 US-005 风格 + PRD-16 US-008 类似 store 复用 |
| US-008 | 3 textarea + 5 H3 + form + 字面 / 跨 step 预填 / stepData 读 | 3 | PRD-16 US-009 large `/guide` (高度复杂页面) + PRD-16 US-004 字面锁 + PRD-15 US-005 跨 store 复用 |
| US-009 | 三态 / 组件 / 复用 / LoadingState / EmptyState | 2 | PRD-15 USx 通用组件抽象 + PRD-16 US-001 utility 命名锁 |

### 注入规则

- 每 high/foundation US 注入 ≤ 3 条反例到 `anti_patterns` 字段
- 反例格式 · `{ source_prd, source_story, lesson, antipattern, correct }`
- 同 risk_level 优先(foundation 注 foundation 反例 · high 注 high 反例)
- 同关键词集合优先(字面锁注字面锁反例 · 颜色注颜色反例)
- 最近 N=10 条优先(旧反例可能已被 Patterns 覆盖)

### 必含 PRD-16 3 新加反例(retro 后注入)

1. **D4=B violet 字面读 reject**(PRD-16 US-003)· `lesson: "PRD AC 写'紫色 gradient'时 ralph 字面读 Tailwind violet utility"`,`antipattern: "from-violet-600 to-violet-400"`,`correct: "from-primary to-primary/60 with WebkitTextStroke var(--primary)"`
2. **D1=A desc 创意改写 reject**(PRD-16 US-004)· `lesson: "PRD AC 字段 desc 字面 ralph 当'建议'创意改写"`,`antipattern: "'追踪全平台热门内容趋势' (改写)"`,`correct: "'一键抓取全平台爆款视频和文案' (PRD AC 字面)"`
3. **Dialog hover vs click reject**(PRD-16 US-007)· `lesson: "shadcn DropdownMenu / Dialog 默认 hover 触发 · 用户期望 click 触发"`,`antipattern: "<DropdownMenuTrigger>(默认 hover)"`,`correct: "<DropdownMenuTrigger asChild>(click 触发)"`

---

## §10 风险红线(PRD-17 实施期 5 条硬规则)

- **R-1** · **D4=B 颜色严锁** · 严禁 ralph 引入 violet / amber / gold OKLCH · audit-redlines.sh 应加 R-A4 检测 · plan-check §2.6.7-ext 必触发(若 PRD AC 不慎写"金色"或"紫色"立即 ERROR 阻断)
- **R-2** · **D1=A 文字字面锁** · 严禁 ralph 创意改写 56 行业 / 6 H3 / 5 H3 / 5 platform label · plan-check §2.6.20 必触发 · Opus audit 必 grep 字面验证
- **R-3** · **Audit Gate 零容忍** · 11 US 全部走 audit · foundation × 4 + high × 3 必走 §Z 深审 · TD 豁免必登记 · 不允许 rubber-stamp
- **R-4** · **零回归硬门禁** · 跨 step 改动可能破坏 PRD-15/16 已有 page · Validator X-6 pytest-full.xml 必生成 · pnpm test 全工程 PASS
- **R-5** · **D3=A admin 0 触动** · 全 11 US 严禁动 `apps/admin/` · grep 验证 `git diff --stat apps/admin/` 必 0 line

---

## §11 跟 Coding 3.0 + ralph + Opus audit 整合

### §11.1 Story 大小自检(全 11 US 评估)

| US | 大小 | 触发拆分? | 备注 |
|:-:|:-:|:-:|---|
| US-001 | medium(常量 56 + 测试) | 否 | foundation · 数据多但结构清晰 |
| US-002 | medium | 否 | Step1 page form + tab + grid |
| US-003 | small | 否 | 已选状态卡 + CTA |
| US-004 | small | 否 | shadcn Dialog modal |
| US-005 | medium | 否 | 常量文件 + 字面锁多 |
| US-006a | medium-large | **已拆**(US-006a form + US-006b 输出) | 由 ARGUMENTS A 决策拆 |
| US-006b | medium-large | **已拆** | 同上 |
| US-007 | medium | 否 | 常量文件 |
| US-008 | medium-large | 不拆 | 3 textarea + 5 H3 复用 step3 模式 · 风险可控 |
| US-009 | medium | 否 | 3 组件 + barrel + test |
| US-010 | medium | 否 | E2E + verify-prd-17.sh |

### §11.2 风险分档分布(给 Opus audit 强度参考)

- **foundation × 4** · US-001(industries.ts)/ US-005(step3.ts)/ US-007(step3b.ts)/ US-009(三态组件复用)→ §Z 深审 + 跨 story 命名一致性逐字核对 + 下游 AC 依赖检查
- **high × 3** · US-006a(Step 3 form)/ US-006b(Step 3 输出)/ US-008(Step 3b 完整)→ §Z 深审 + 字面 grep + form 验证
- **medium × 4** · US-002 / US-003 / US-004 / US-010 → 标准审

### §11.3 Audit Gate 强制(Step 5.5 全局 CLAUDE.md)

- 每 US 必走 audit-gate.json pending → Opus 审 → approve / reject
- foundation × 4 必走 §Z 深审 + 全部域 grep + line-by-line
- TD 豁免必登记 + commit message 含 [TD-XX resolved] tag(if 顺手清理)

### §11.4 anti_patterns 注入(PRD-16 retro Diff-2 实证有效)

- 反例累加 +36% 一轮通过率(PRD-16 实证)· PRD-17 应延续
- ralph skill 转 prd-17.json 时必从 reject-examples.jsonl(47+ 条 · 含 PRD-16 新加 3 条)按关键词检索注入
- ralph.py build_developer_prompt 自动渲染 [SHIELD] 段落注入

### §11.5 RCA 风险预防(继承全局 CLAUDE.md §5.0-5.5+ 全部 SOP)

- 启 daemon 前必跑 §5.0 stale session 清理(防 cross-session race · RCA-005)
- daemon timeout 触发 4 选项介入 SOP(RCA-006)· 不允许 silent skip
- audit pending > 30s 必走 Monitor 通知(防 RCA-001 31min 空窗)
- large story 必拆(项目级 §9.6 已锁 · 本 PRD US-006 已主动拆 a/b)

---

## §12 实施前置准备(写 prd-17.json 前必做)

### §12.1 反例库注入预备

- 跑 `wc -l ~/.claude/playbooks/reject-examples.jsonl` 确认 ≥ 47 条(PRD-16 后累积 3 条)
- ralph skill 转 prd-17.json 时按 §9 关键词清单检索 · 注入 4 foundation + 3 high US 的 anti_patterns

### §12.2 切 branch + 启 daemon SOP

```bash
# 1 · stale session 清理
ps -ax -o pid,ppid,etime,stat,command | awk '/[ ]claude$/ && !/grep/ {print}'
pgrep -fa "tail.*ralph-output.log" | grep -v $$  # 清旧 Monitor

# 2 · 切 branch
git checkout -b ralph/prd-17-step1-3-3b

# 3 · 启 Monitor(必先于 daemon)· session-only · 每新会话必跑

# 4 · prd-17.json cp 到 prd.json
cp scripts/ralph/prd-17.json scripts/ralph/prd.json

# 5 · 启 daemon
/Users/return/.local/bin/python3.11 scripts/ralph/ralph.py --model sonnet --daemon
```

### §12.3 watch-audit-gate.py(2026-05-04 Diff-3 已落地)

- ralph.py --daemon 启动时自动 fork watch-audit-gate.py · 系统通知唤醒
- 不再依赖 Claude Code Monitor 工具单点(防 RCA-001 类 31min 空窗)

---

## §13 PRD-18+ 衔接说明

### §13.1 PRD-18 范围(Step 2 / Step 4 / Step 4b / Step 5 / Step 6 / Step 7 / Step 8 · 10-12 US · 2.5 周)

- Step 2 · 选择平台(若 spec 有独立 page · 需 dump 确认)
- Step 4 / Step 4b / Step 5 / Step 6 / Step 7 / Step 8 · 各 page 重写 · 复用本 PRD US-009 三态组件
- 复用本 PRD 常量模式(每 step 一个 constants/*.ts 字面锁)
- 复用本 PRD form pattern(textarea + radio + input + CTA + 输出区结构)

### §13.2 PRD-19 范围(14 工具 8 stub 完整化 + 4 modules + 视觉精修 · 10-12 US · 2-2.5 周)

- 8 stub 工具:`/video-analysis` `/boom-generate` `/generate` 等(参 dump §2.3)
- 4 modules 完整化 + 已 PRD-15 完成的 6 工具视觉精修
- 复用本 PRD 三态组件 + form pattern + 字面锁规范

### §13.3 PRD-AI 范围(backend tRPC AI 生成 + 真实图像生成 · 8-10 US · 2 周)

- 接 backend tRPC api · LLM Gateway 多供应商
- Step 3 / 3b / 5 / 6 / 7 / 8 等 mock 接口换真实 LLM 生成
- 接图像生成 API([生成参考图] 按钮真实化)
- 留 PRD-16~19 layout 完整后再启动

---

## 附录 A · 与 PRD-16 衔接的复用清单

### A.1 直接复用 PRD-16 落地成果(0 重写)

- 字体设计系统 · `font-display` / `font-cn` / `font-label` className · `tailwind.config.ts` 已含
- 3 utility · `glass-card` / `data-grid-bg` / `animate-ping-primary` · `apps/web/src/styles/aiipznt-motion.css` 已含
- Header 4 dropdown · `apps/web/src/components/Header.tsx` + `apps/web/src/lib/constants/header-nav.ts` 已含 · 本 PRD 不动
- D4=B 颜色 token · `apps/web/src/styles/globals.css` `--primary: 43 87% 63%` 已含
- ls-namespace `acc_` · `apps/web/src/lib/storage/ls-namespace.ts`(PRD-15)已含

### A.2 本 PRD 新增 + 跨 PRD 复用价值

- `apps/web/src/components/states/` 三态组件 · PRD-18 / PRD-19 复用
- `apps/web/src/lib/constants/{industries,step3,step3b}.ts` 字面锁模式 · PRD-18 各 step 复用
- mock data 模式 · PRD-18 各 step 复用(留 PRD-AI 接真实接口)
- e2e cross-step spec 模式 · PRD-18 / PRD-19 复用

### A.3 拒绝重新引入的 PRD-16 已固化禁忌

- ❌ `from-violet-600` / `from-amber-` / `bg-gold-` · 严禁(D4=B 红线)
- ❌ PRD 文档"金色 gradient" / "紫色 gradient" 措辞 · 严禁(D-158)
- ❌ desc / label / placeholder 字面创意改写 · 严禁(D-156 + D1=A 字面锁)
- ❌ shadcn DropdownMenu / Dialog 不加 `asChild` · 严禁(本 PRD US-004 Dialog 必带 asChild)
- ❌ 跨 step 命名漂移 · 必走 §5 协议锁

---

**End of PRD-17**
