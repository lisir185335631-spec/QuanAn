# AIP 平台交互动效与技术实现规范 (方案 B)

本规范详细定义了 AIP 平台的视觉动效逻辑、交互反馈机制及底层技术实现参数，旨在指导开发团队还原极致、高端且富有生命力的 **Aurelian Dark (金质暗黑)** 交互体验。

---

## 1. 核心设计哲学
**「动静结合，克制高级」**
- **动态区 (Active Zone)**：背景氛围、核心操作点、加载反馈。通过细腻的流动感建立「AI 正在实时运作」的心智。
- **稳定区 (Static Zone)**：表单输入、长文本结果、结构化数据。确保在深度阅读和创作时视觉零干扰，极度锐利清晰。

---

## 2. 全局基础动效 (Atmosphere)

### 2.1 背景呼吸光感 (Breathing Background)
- **触发场景**：全站页面底座。
- **逻辑**：背景网格与全局高光层通过不透明度循环变化，模拟生物呼吸节奏。
- **实现 (CSS)**：
```css
@keyframes breathing {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.data-grid-bg {
  animation: breathing 8s ease-in-out infinite;
}
```

### 2.2 页面入场过渡 (Page Transition)
- **参数**：`opacity: 0` → `1`, `translateY: 10px` → `0`。
- **时长**：300ms。
- **缓动**：`cubic-bezier(0.4, 0, 0.2, 1)` (Standard Ease)。

---

## 3. 交互组件规范 (Components)

### 3.1 金色渐变流光按钮 (Primary Buttons)
- **静态态**：`bg-gradient-to-r from-[#D4AF37] via-[#F5C842] to-[#D4AF37]`。
- **动态效果**：背景渐变位移，产生光泽在表面流动的视觉感。
- **实现 (Tailwind v4)**：
```css
.btn-primary-flow {
  background-size: 200% 100%;
  animation: gradient-shift 4s linear infinite;
}
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
```

### 3.2 交互卡片悬停 (Interactive Cards)
- **触发**：`onHover`。
- **反馈**：
  1. **层级提升**：`translateY(-4px)`。
  2. **微发光 (Glow)**：`box-shadow: 0 0 20px rgba(212, 175, 55, 0.15)`。
  3. **边框锐化**：边框颜色由 `border-[#2D2D30]` 渐变为 `border-[#D4AF37]/40`。
- **时长**：200ms。

### 3.3 图标交互 (SVG Icons)
- **反馈**：Hover 时图标产生微小的比例放大 (`scale-110`) 或路径描边亮度提升。

---

## 4. 状态反馈动效 (State Feedback)

### 4.1 AI 生产载入 (Loading State)
- **骨架屏 (Skeleton)**：深色块伴随金色扫光感。
- **流光扫光 (Shimmer)**：
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### 4.2 结果流式展现 (Streamdown Rendering)
- **逻辑**：模拟打字机效果，字符按固定速率 (50ms/char) 递增显示。
- **视觉**：配合 `react-markdown` 渲染，每一段落加载完成后触发微弱的 `Fade-in`。

---

## 5. 开发建议 (Tech Specs)

1. **缓动函数**：全局禁用 `linear`，除特定流光外，交互反馈统一使用 `cubic-bezier(0.16, 1, 0.3, 1)` (Quart Out) 以获得极其轻快且高端的响应感。
2. **GPU 加速**：所有位移属性使用 `transform: translate3d()` 确保 60fps 帧率。
3. **颜色格式**：推荐使用 `oklch` 或 `oklab` 进行颜色计算，以确保金色阴影在高动态范围下的色彩纯度。
4. **性能阈值**：低端设备检测到 `prefers-reduced-motion` 时，自动降级为静态显示，仅保留关键的 Loading 反馈。