import { CheckCircle2, CircleAlert, Loader2, RefreshCw, Server } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { rpc } from '@renderer/lib/ipc';
import { Button } from '@renderer/lib/ui/button';
import type { OllamaRuntimeStatus } from '@shared/core/ollama/types';

function statusMessage(status: OllamaRuntimeStatus | null): string {
  if (!status) return 'Checking the local Ollama runtime…';
  if (status.kind === 'ready') {
    const modelCount = status.models.length;
    return `${status.managed ? 'Managed by Emdash' : 'Already running'} · ${modelCount} ${modelCount === 1 ? 'model' : 'models'} available`;
  }
  return status.message;
}

export function OllamaRuntimeCard() {
  const [status, setStatus] = useState<OllamaRuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await rpc.ollama.getStatus());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const start = useCallback(async () => {
    setStarting(true);
    try {
      setStatus(await rpc.ollama.start());
    } finally {
      setStarting(false);
    }
  }, []);

  const isReady = status?.kind === 'ready';
  const Icon = isReady ? CheckCircle2 : status?.kind === 'error' ? CircleAlert : Server;

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-background-1 p-3 px-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background-quaternary-1">
            <Icon
              className={
                isReady ? 'size-4 text-foreground-success' : 'size-4 text-foreground-muted'
              }
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-foreground">Ollama local runtime</div>
            <div className="mt-0.5 text-xs text-foreground-muted">{statusMessage(status)}</div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => void refresh()}
            disabled={loading || starting}
            aria-label="Refresh Ollama status"
          >
            <RefreshCw className={loading ? 'size-3.5 animate-spin' : 'size-3.5'} />
          </Button>
          {!isReady && status?.kind !== 'unavailable' && (
            <Button size="sm" onClick={() => void start()} disabled={starting}>
              {starting && <Loader2 className="size-3.5 animate-spin" />}
              Start
            </Button>
          )}
        </div>
      </div>
      {isReady && status.models.length > 0 && (
        <div className="truncate text-xs text-foreground-muted">
          {status.models.map((model) => model.name).join(' · ')}
        </div>
      )}
    </section>
  );
}
