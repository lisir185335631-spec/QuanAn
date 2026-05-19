import { useRef, useState } from 'react';

export interface FileUploadProps {
  label: string;
  multiple?: boolean;
  accept?: string;
  onChange: (files: File[]) => void;
}

interface FilePreview {
  file: File;
  url: string;
}

export function FileUpload({ label, multiple = false, accept = 'image/*', onChange }: FileUploadProps) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const newPreviews: FilePreview[] = selected.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updated = multiple ? [...previews, ...newPreviews] : newPreviews;
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]!.url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
    if (updated.length === 0 && inputRef.current) {
      inputRef.current.value = '';
    }
  }

  const isImage = accept?.includes('image');

  return (
    <div className="space-y-2" data-testid={`file-upload-${label}`}>
      <label className="block text-body-sm font-label text-on-surface">
        {label}
        <span className="text-muted-foreground ml-1 text-xs">(可选)</span>
      </label>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-md border border-dashed border-border bg-muted/20 px-4 py-3 text-body-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer text-left"
        data-testid={`file-upload-trigger-${label}`}
      >
        {previews.length === 0
          ? `点击上传${label}${multiple ? '（可多张）' : ''}`
          : `已选 ${previews.length} 张，点击继续添加`}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
        data-testid={`file-upload-input-${label}`}
      />

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative group" data-testid={`file-preview-${index}`}>
              {isImage ? (
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="h-16 w-16 rounded-md object-cover border border-border"
                />
              ) : (
                <div className="h-16 w-16 rounded-md border border-border bg-muted/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground text-center px-1 line-clamp-2">
                    {preview.file.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`file-remove-${index}`}
                aria-label={`删除 ${preview.file.name}`}
              >
                ×
              </button>
              <p className="text-xs text-muted-foreground mt-1 max-w-[64px] truncate">
                {preview.file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
