import { spawn, type ChildProcess } from 'node:child_process';
import { log } from '@main/lib/logger';
import { buildExternalToolEnv } from '@main/utils/childProcessEnv';
import type { OllamaModel, OllamaRuntimeStatus } from '@shared/core/ollama/types';

const OLLAMA_TAGS_URL = 'http://127.0.0.1:11434/api/tags';
const HEALTH_TIMEOUT_MS = 1_000;
const STARTUP_TIMEOUT_MS = 12_000;
const STARTUP_RETRY_DELAY_MS = 200;

type OllamaTagsResponse = {
  models?: Array<{
    name?: unknown;
    size?: unknown;
    modified_at?: unknown;
  }>;
};

export type OllamaRuntimeDependencies = {
  fetch: typeof fetch;
  spawn: typeof spawn;
  now: () => number;
  delay: (ms: number) => Promise<void>;
};

const defaultDependencies: OllamaRuntimeDependencies = {
  fetch,
  spawn,
  now: Date.now,
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

function asModels(payload: unknown): OllamaModel[] | null {
  if (!payload || typeof payload !== 'object') return null;

  const { models } = payload as OllamaTagsResponse;
  if (!Array.isArray(models)) return null;

  return models.flatMap((model) => {
    if (!model || typeof model.name !== 'string') return [];
    return [
      {
        name: model.name,
        size: typeof model.size === 'number' ? model.size : null,
        modifiedAt: typeof model.modified_at === 'string' ? model.modified_at : null,
      },
    ];
  });
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

/**
 * Keeps the local Ollama API available without requiring users to run a second terminal.
 * Existing Ollama servers are left untouched; Emdash only owns a process it started itself.
 */
export class OllamaService {
  private child: ChildProcess | null = null;
  private startPromise: Promise<OllamaRuntimeStatus> | null = null;
  private lastFailure: OllamaRuntimeStatus | null = null;
  private disposed = false;

  constructor(private readonly deps: OllamaRuntimeDependencies = defaultDependencies) {}

  initialize(): void {
    void this.start().catch((error: unknown) => {
      log.warn('Ollama runtime initialization failed', { error: String(error) });
    });
  }

  async getStatus(): Promise<OllamaRuntimeStatus> {
    const models = await this.listModels();
    if (models) {
      this.lastFailure = null;
      return { kind: 'ready', managed: this.isManaged(), models };
    }

    if (this.isManaged()) {
      return { kind: 'starting', message: 'Starting the local Ollama runtime…' };
    }

    return (
      this.lastFailure ?? {
        kind: 'offline',
        message: 'Ollama is installed but its local runtime is not running.',
      }
    );
  }

  async start(): Promise<OllamaRuntimeStatus> {
    const status = await this.getStatus();
    if (status.kind === 'ready' || status.kind === 'starting') return status;

    if (this.startPromise) return await this.startPromise;

    this.startPromise = this.startRuntime().finally(() => {
      this.startPromise = null;
    });
    return await this.startPromise;
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    const child = this.child;
    this.child = null;
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
    }
  }

  private async startRuntime(): Promise<OllamaRuntimeStatus> {
    let child: ChildProcess;
    try {
      child = this.deps.spawn('ollama', ['serve'], {
        env: buildExternalToolEnv(),
        stdio: 'ignore',
      });
      await this.waitForSpawn(child);
    } catch (error) {
      const status: OllamaRuntimeStatus = isNotFound(error)
        ? { kind: 'unavailable', message: 'Install Ollama to use local models in Emdash.' }
        : {
            kind: 'error',
            message: `Could not start Ollama: ${error instanceof Error ? error.message : String(error)}`,
          };
      this.lastFailure = status;
      return status;
    }

    this.child = child;
    child.once('exit', (code, signal) => {
      if (this.child !== child) return;
      this.child = null;
      if (this.disposed) return;
      this.lastFailure = {
        kind: 'error',
        message: `Ollama stopped unexpectedly${code === null ? '' : ` (exit ${code})`}${signal ? ` (${signal})` : ''}.`,
      };
      log.warn('Managed Ollama runtime exited', { code, signal });
    });

    const deadline = this.deps.now() + STARTUP_TIMEOUT_MS;
    while (this.deps.now() < deadline) {
      const models = await this.listModels();
      if (models) {
        this.lastFailure = null;
        return { kind: 'ready', managed: true, models };
      }
      await this.deps.delay(STARTUP_RETRY_DELAY_MS);
    }

    const status: OllamaRuntimeStatus = {
      kind: 'error',
      message: 'Ollama started but did not become ready. Check the Ollama logs and try again.',
    };
    this.lastFailure = status;
    return status;
  }

  private isManaged(): boolean {
    return this.child !== null && this.child.exitCode === null && this.child.signalCode === null;
  }

  private async listModels(): Promise<OllamaModel[] | null> {
    try {
      const response = await this.deps.fetch(OLLAMA_TAGS_URL, {
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      return asModels(await response.json());
    } catch {
      return null;
    }
  }

  private async waitForSpawn(child: ChildProcess): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const onSpawn = () => {
        child.removeListener('error', onError);
        resolve();
      };
      const onError = (error: Error) => {
        child.removeListener('spawn', onSpawn);
        reject(error);
      };
      child.once('spawn', onSpawn);
      child.once('error', onError);
    });
  }
}

export const ollamaService = new OllamaService();
