import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  HOME_READY_CTA,
  HOME_READY_CTA_HREF,
  HOME_READY_SUBTITLE,
  HOME_READY_TITLE,
} from '@/lib/constants/home';

export function HomeReadyStart() {
  return (
    <section className="mt-20 py-16 text-center">
      <h2 className="font-display text-5xl md:text-6xl font-black text-primary tracking-widest">
        {HOME_READY_TITLE}
      </h2>
      <p className="font-cn text-lg text-muted-foreground mt-4">{HOME_READY_SUBTITLE}</p>
      <div className="mt-8">
        <Link to={HOME_READY_CTA_HREF}>
          <Button className="font-cn bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-5 text-xl">
            {HOME_READY_CTA} →
          </Button>
        </Link>
      </div>
    </section>
  );
}
