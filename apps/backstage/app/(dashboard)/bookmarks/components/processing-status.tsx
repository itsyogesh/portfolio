'use client';

import { Button } from '@packages/base/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ProcessingStatusProps = {
  stats: {
    total: number;
    pendingExtraction: number;
    pendingAi: number;
    failedExtraction: number;
    failedAi: number;
    doneExtraction: number;
    doneAi: number;
  };
};

export function ProcessingStatus({ stats }: ProcessingStatusProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  const handleProcess = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await fetch('/api/bookmarks/process', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setResult(`Error: ${data.error}`);
        return;
      }

      setResult(
        `Extracted: ${data.processed.extracted}, Failed: ${data.processed.extractFailed}`
      );
      router.refresh();
    } catch {
      setResult('Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatusCard label="Extraction Done" value={stats.doneExtraction} total={stats.total} />
      <StatusCard label="AI Done" value={stats.doneAi} total={stats.total} />
      <StatusCard
        label="Pending Extraction"
        value={stats.pendingExtraction}
        variant="warning"
      />
      <StatusCard label="Pending AI" value={stats.pendingAi} variant="warning" />
      <StatusCard
        label="Failed Extraction"
        value={stats.failedExtraction}
        variant="error"
      />
      <StatusCard label="Failed AI" value={stats.failedAi} variant="error" />

      <div className="col-span-2 flex items-center gap-3">
        <Button
          onClick={handleProcess}
          disabled={isProcessing}
          size="sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Process Batch'
          )}
        </Button>
        {result && (
          <span className="text-xs text-muted-foreground">{result}</span>
        )}
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  total,
  variant,
}: {
  label: string;
  value: number;
  total?: number;
  variant?: 'warning' | 'error';
}) {
  return (
    <div className="rounded-lg border border-border/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-2xl font-semibold tabular-nums ${
          variant === 'error'
            ? 'text-red-500'
            : variant === 'warning'
              ? 'text-amber-500'
              : ''
        }`}
      >
        {value.toLocaleString()}
      </p>
      {total !== undefined && (
        <p className="text-xs text-muted-foreground/50">
          {Math.round((value / total) * 100)}%
        </p>
      )}
    </div>
  );
}
