import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ErrorVariant = 'generic' | 'quota-exceeded';

interface ErrorStateProps {
  variant?: ErrorVariant;
  message?: string;
  onRetry?: () => void;
}

const VARIANT_CONFIG: Record<ErrorVariant, { title: string; message: string; showRetry: boolean }> = {
  'generic': {
    title: '出错了',
    message: '发生未知错误，请重试。',
    showRetry: true,
  },
  'quota-exceeded': {
    title: '[配额超限]',
    message: '今日 token 已用尽 · 明日 reset',
    showRetry: false,
  },
};

export function ErrorState({ variant = 'generic', message, onRetry }: ErrorStateProps) {
  const config = VARIANT_CONFIG[variant];
  const showRetry = config.showRetry && !!onRetry;

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-destructive">{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message ?? config.message}</p>
          {showRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              重试
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
