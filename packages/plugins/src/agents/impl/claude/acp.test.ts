import { Readable, Writable } from 'node:stream';
import type { Agent } from '@agentclientprotocol/sdk';
import type { AcpClientFactory } from '@emdash/core/agents/plugins';
import { describe, expect, it, vi } from 'vitest';
import { pluginRegistry } from '../../registry';

describe('claude acp capability', () => {
  it('declares acp: { kind: supported }', () => {
    const claude = pluginRegistry.get('claude');
    expect(claude).toBeDefined();
    expect(claude!.capabilities.acp.kind).toBe('supported');
  });


});

describe('claude acp behavior', () => {
  const claude = () => pluginRegistry.get('claude')!;
  const acpBehavior = () => claude().behavior.acp!;

  it('behavior.acp is defined', () => {
    expect(acpBehavior()).toBeDefined();
  });

  describe('buildSpawn', () => {
    const spawnCtx = { cwd: '/home/user/worktrees/task-1', env: {}, cli: '/usr/local/bin/claude' };

    it('uses ctx.cli as command', () => {
      const result = acpBehavior().buildSpawn(spawnCtx);
      expect(result.command).toBe('/usr/local/bin/claude');
    });

    it('passes --acp arg', () => {
      const result = acpBehavior().buildSpawn(spawnCtx);
      expect(result.args).toEqual(['--acp']);
    });
  });

  describe('connect', () => {
    it('returns an object with prompt and newSession methods', () => {
      const stdin = new Writable({ write: (_c, _e, cb) => cb() });
      const stdout = new Readable({ read: () => {} });

      const toClient: AcpClientFactory = () => ({
        requestPermission: vi.fn(),
        sessionUpdate: vi.fn(),
      });

      const agentApi = acpBehavior().connect({ stdin, stdout }, toClient);
      expect(typeof (agentApi as Agent).prompt).toBe('function');
      expect(typeof (agentApi as Agent).newSession).toBe('function');
      expect(typeof (agentApi as Agent).initialize).toBe('function');
    });
  });
});
