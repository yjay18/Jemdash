import type { TranscriptTurn } from '@emdash/core/acp/client';
import { describe, expect, it } from 'vitest';
import {
  buildHandoffContext,
  mergeHandoffTranscript,
  normalizeHandoffTranscript,
  readProviderSelection,
  writeProviderSelection,
} from './acp-provider-handoff';

function turn(id: string, seq: number, text: string): TranscriptTurn {
  return {
    id,
    seq,
    initiator: 'user',
    items: [{ kind: 'message', id: `${id}:message`, seq: 0, role: 'user', text }],
    outcome: { kind: 'done' },
  };
}

describe('ACP provider handoff', () => {
  it('combines provider transcripts and assigns continuous turn order', () => {
    expect(
      mergeHandoffTranscript([turn('claude', 8, 'first')], [turn('codex', 0, 'next')])
    ).toEqual([turn('claude', 0, 'first'), turn('codex', 1, 'next')]);
  });

  it('keeps the newest 100 turns and compacts very large output', () => {
    const transcript = normalizeHandoffTranscript(
      [],
      Array.from({ length: 105 }, (_, index) => turn(`turn-${index}`, index, 'x'.repeat(25_000)))
    );

    expect(transcript).toHaveLength(100);
    expect(transcript[0]).toMatchObject({ id: 'turn-5', seq: 0 });
    expect(transcript[99]).toMatchObject({ id: 'turn-104', seq: 99 });
    expect(transcript[0].items[0]).toMatchObject({
      text: expect.stringContaining('[output truncated for provider handoff]'),
    });
  });

  it('labels the source and target provider in the deferred model context', () => {
    const context = buildHandoffContext('claude', 'codex', [turn('claude', 0, 'keep going')]);
    expect(context).toContain('from claude to codex');
    expect(context).toContain('keep going');
    expect(context).toContain('workspace is the source of truth');
  });

  it('remembers model and effort independently for each provider', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    writeProviderSelection('claude', { model: 'claude-sonnet-5', effort: 'high' }, storage);
    writeProviderSelection('codex', { model: 'gpt-5.6-sol', effort: 'xhigh' }, storage);

    expect(readProviderSelection('claude', storage)).toEqual({
      model: 'claude-sonnet-5',
      effort: 'high',
    });
    expect(readProviderSelection('codex', storage)).toEqual({
      model: 'gpt-5.6-sol',
      effort: 'xhigh',
    });
  });
});
