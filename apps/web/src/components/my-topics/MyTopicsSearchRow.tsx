/**
 * MyTopicsSearchRow — search input + 复制全部 + 下载TXT btn
 * sally 1:1 复刻 · 字面全走 constants
 */
import { Copy, Download, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MY_TOPICS_COPY_ALL,
  MY_TOPICS_DOWNLOAD_TXT,
  MY_TOPICS_SEARCH_PLACEHOLDER,
} from '@/lib/constants/myTopics';

interface MyTopicsSearchRowProps {
  value: string;
  onChange: (v: string) => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function MyTopicsSearchRow({
  value,
  onChange,
  onCopy,
  onDownload,
}: MyTopicsSearchRowProps) {
  return (
    <div className="flex items-center gap-3" data-testid="search-row">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={MY_TOPICS_SEARCH_PLACEHOLDER}
          className="pl-9 focus:border-primary"
          data-testid="search-input"
        />
      </div>

      {/* Right btn group */}
      <Button
        variant="outline"
        onClick={onCopy}
        data-testid="copy-all-btn"
      >
        <Copy className="h-4 w-4 mr-1.5" />
        {MY_TOPICS_COPY_ALL}
      </Button>
      <Button
        variant="outline"
        onClick={onDownload}
        data-testid="download-txt-btn"
      >
        <Download className="h-4 w-4 mr-1.5" />
        {MY_TOPICS_DOWNLOAD_TXT}
      </Button>
    </div>
  );
}
