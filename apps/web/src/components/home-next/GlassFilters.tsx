/**
 * GlassFilters — iOS 26 Liquid Glass · SVG defs 注入
 * 折射位移滤镜 #lg-distort，配合 .lg-refract::after 使用。
 * 必须在文档中渲染一次（Home.next.tsx 顶部挂载）。
 */
export function GlassFilters() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden
      focusable="false"
      style={{ position: 'absolute', overflow: 'hidden', pointerEvents: 'none' }}
    >
      <defs>
        <filter id="lg-distort" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          {/* fractalNoise 场 */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.016"
            numOctaves="2"
            seed="3"
            result="n"
          />
          {/* 用噪声场位移 SourceGraphic，产生液态折射感 */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
