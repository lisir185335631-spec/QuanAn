import { Header } from '@/components/Header';

export function App() {
  return (
    <>
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-h1 font-display text-on-surface">QuanQn · 工程骨架就绪</h1>
        <p className="mt-2 text-body-md text-muted-foreground">P0 Foundation · PRD-1 US-005</p>
      </main>
    </>
  );
}
