import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-20">
      <h1
        className="font-display text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary to-primary/60 mb-6 tracking-tight"
        style={{ WebkitTextStroke: '1px var(--primary)' }}
      >
        AI+短视频+IP
      </h1>

      <p className="font-cn text-lg text-muted-foreground mb-2">OPC全案落地，从流量到成交</p>
      <p className="font-cn text-lg text-muted-foreground mb-2">AI+短视频+IP</p>
      <p className="font-cn text-lg text-muted-foreground mb-2">全链路变现</p>

      <p className="font-cn italic text-sm text-muted-foreground/70 mb-8">
        "重新构造一个人是怎样不变形的"
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link to="/step/1">
          <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-base">
            启动智能分析
          </Button>
        </Link>
        <Link to="/guide">
          <Button
            variant="outline"
            className="font-cn border-primary/30 text-primary hover:bg-primary/10 px-6 py-3 text-base"
          >
            使用说明
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8 data-grid-bg min-h-screen">
      <HeroSection />
    </main>
  );
}
