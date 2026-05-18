import { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { STEP5_FILE_ACCEPT, STEP5_FILE_MAX_MB } from '@/lib/constants/step5';

interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

interface Step5FileUploadProps {
  label: string;
  placeholder: string;
}

export function Step5FileUpload({ label, placeholder }: Step5FileUploadProps) {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > STEP5_FILE_MAX_MB * 1024 * 1024) {
      setError(`文件过大，最大支持 ${STEP5_FILE_MAX_MB}MB`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMetadata({ name: file.name, size: file.size, type: file.type });
    };
    reader.readAsText(file);
  }

  const sizeKB = metadata ? Math.round(metadata.size / 1024) : 0;

  return (
    <div className="space-y-1">
      <label className="block text-body-sm font-label text-on-surface">
        {label}
      </label>
      <p className="text-xs text-muted-foreground mb-1">{placeholder}</p>
      <Input
        ref={inputRef}
        type="file"
        accept={STEP5_FILE_ACCEPT}
        onChange={handleChange}
        className="cursor-pointer"
      />
      {metadata && !error && (
        <p className="text-xs text-primary mt-1">
          已选文件：{metadata.name}（{sizeKB}KB）
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
