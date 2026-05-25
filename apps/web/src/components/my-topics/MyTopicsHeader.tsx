/**
 * MyTopicsHeader — 返回 link + breadcrumb chip + ❤️ h1 + subtitle
 * sally 1:1 复刻 · 字面全走 constants
 */
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  MY_TOPICS_BACK,
  MY_TOPICS_BACK_HREF,
  MY_TOPICS_BREADCRUMB,
  MY_TOPICS_H1,
  MY_TOPICS_SUBTITLE,
} from '@/lib/constants/myTopics';

export function MyTopicsHeader() {
  return (
    <div className="space-y-3" data-testid="my-topics-header">
      {/* 返回 link */}
      <Link
        to={MY_TOPICS_BACK_HREF}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        data-testid="back-link"
      >
        ← {MY_TOPICS_BACK}
      </Link>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" data-testid="breadcrumb">
        <span
          className="px-2 py-0.5 rounded border border-primary text-primary text-xs font-semibold tracking-wide"
          data-testid="breadcrumb-chip"
        >
          {MY_TOPICS_BREADCRUMB}
        </span>
        <span className="text-muted-foreground">{'>'}</span>
        <span className="text-primary font-medium" data-testid="breadcrumb-right">
          {MY_TOPICS_H1}
        </span>
      </div>

      {/* h1 */}
      <div className="flex items-center gap-3">
        <Heart className="w-8 h-8 fill-red-500 text-red-500" data-testid="h1-heart-icon" />
        <h1 className="text-3xl font-bold text-white" data-testid="h1-title">
          {MY_TOPICS_H1}
        </h1>
      </div>

      {/* subtitle */}
      <p className="text-sm text-muted-foreground" data-testid="subtitle">
        {MY_TOPICS_SUBTITLE}
      </p>
    </div>
  );
}
