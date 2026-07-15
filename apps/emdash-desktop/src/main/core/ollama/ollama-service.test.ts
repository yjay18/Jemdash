import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { OllamaService, type OllamaRuntimeDependencies } from './ollama-service';

vi.mock('@main/lib/logger', () => ({ log: { warn: vi.fn() } }));
vi.mock('@main/utils/childProcessEnv', () => ({ buildExternalToolEnv: () => ({}) }));

class FakeChildProcess extends EventEmitter {
  exitCode: number | null = null;
  signalCode: NodeJS.Signals | null = null;
  kill = vi.fn();
}

function createDependencies(overrides: Partial<OllamaRuntimeDependencies> = {}) {
  return {
    fetch: vi.fn() as unknown as typeof fetch,
    spawn: vi.fn() as unknown as typeof spawn,
    now: () => 0,
    delay: async () => {},
    ...overrides,
  } satisfies OllamaRuntimeDependencies;
}

function tagsResponse(names: string[]): Response {
  return {
    ok: true,
    json: async () => ({
      models: names.map((name) => ({ name, size: 42, modified_at: '2026-07-15T00:00:00Z' })),
    }),
  } as Response;
}

describe('OllamaService', () => {
  it('reuses an already-running Ollama server', async () => {
    const deps = createDependencies();
    const fetchMock = deps.fetch as unknown as ReturnType<typeof vi.fn>;
    const spawnMock = deps.spawn as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(tagsResponse(['qwen3.5:latest']));

    const service = new OllamaService(deps);

    await expect(service.start()).resolves.toEqual({
      kind: 'ready',
      managed: false,
      models: [
        {
          name: 'qwen3.5:latest',
          size: 42,
          modifiedAt: '2026-07-15T00:00:00Z',
        },
      ],
    });
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it('starts Ollama and waits for its local API to become available', async () => {
    const child = new FakeChildProcess();
    const deps = createDependencies({
      fetch: vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(tagsResponse(['gpt-oss:20b'])) as unknown as typeof fetch,
      spawn: vi.fn(() => {
        queueMicrotask(() => child.emit('spawn'));
        return child as unknown as ChildProcess;
      }) as unknown as typeof spawn,
    });

    const service = new OllamaService(deps);

    await expect(service.start()).resolves.toMatchObject({
      kind: 'ready',
      managed: true,
      models: [{ name: 'gpt-oss:20b' }],
    });
    expect(deps.spawn).toHaveBeenCalledWith(
      'ollama',
      ['serve'],
      expect.objectContaining({ stdio: 'ignore' })
    );
  });

  it('stops only the Ollama runtime it started', async () => {
    const child = new FakeChildProcess();
    const deps = createDependencies({
      fetch: vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(tagsResponse([])) as unknown as typeof fetch,
      spawn: vi.fn(() => {
        queueMicrotask(() => child.emit('spawn'));
        return child as unknown as ChildProcess;
      }) as unknown as typeof spawn,
    });
    const service = new OllamaService(deps);

    await service.start();
    await service.dispose();

    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });
});
