import { AlertCircle } from 'lucide-react';

import { GUIDE_FAQ_TITLE, GUIDE_FAQS_5 } from '@/lib/constants/guide';

import { FAQCard } from './FAQCard';

export function FAQSection() {
  return (
    <section data-testid="faq-section">
      <h2 className="font-cn text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
        {GUIDE_FAQ_TITLE}
      </h2>
      <div className="space-y-3">
        {GUIDE_FAQS_5.map((faq, i) => (
          <FAQCard key={faq.q} faq={faq} index={i} />
        ))}
      </div>
    </section>
  );
}
