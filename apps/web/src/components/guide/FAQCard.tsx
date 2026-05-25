import { Star } from 'lucide-react';

import type { FAQ } from '@/lib/constants/guide';

interface FAQCardProps {
  faq: FAQ;
  index: number;
}

export function FAQCard({ faq, index }: FAQCardProps) {
  return (
    <div
      data-testid={`faq-card-${index}`}
      className="rounded-xl border bg-card p-5"
    >
      <div className="flex gap-3 items-start mb-2">
        <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5 fill-primary" />
        <p className="font-cn text-base font-bold text-foreground">{faq.q}</p>
      </div>
      <p className="font-cn text-sm text-muted-foreground pl-7">{faq.a}</p>
    </div>
  );
}
