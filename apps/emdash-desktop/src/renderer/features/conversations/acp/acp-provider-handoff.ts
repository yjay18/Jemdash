import { transcriptTurnSchema, type TranscriptTurn } from '@emdash/core/acp/client';
import type { AgentProviderId } from '@emdash/plugins/agents';

const PROVIDER_SELECTION_KEY = 'emdash:acp-provider-selections';
const MAX_VISIBLE_TURNS = 100;
const MAX_STRING_LENGTH = 20_000;
const MAX_CONTEXT_LENGTH = 120_000;

export type ProviderSelection = {
  model?: string;
  effort?: string;
};

type ProviderSelections = Record<string, ProviderSelection>;

export function normalizeHandoffTranscript(
  prior: readonly TranscriptTurn[],
  current: readonly TranscriptTurn[]
): TranscriptTurn[] {
  const turns = [...prior, ...current].slice(-MAX_VISIBLE_TURNS);
  const compacted = JSON.stringify(turns, (_key, value: unknown) => {
    if (typeof value !== 'string' || value.length <= MAX_STRING_LENGTH) return value;
    return `${value.slice(0, MAX_STRING_LENGTH)}\n… [output truncated for provider handoff]`;
  });
  const parsed = transcriptTurnSchema.array().parse(JSON.parse(compacted));
  return parsed.map((turn, seq) => ({ ...turn, seq }));
}

export function mergeHandoffTranscript(
  prior: readonly TranscriptTurn[],
  current: readonly TranscriptTurn[]
): TranscriptTurn[] {
  return [...prior, ...current].map((turn, seq) => ({ ...turn, seq }));
}

export function buildHandoffContext(
  fromProviderId: AgentProviderId,
  toProviderId: AgentProviderId,
  transcript: readonly TranscriptTurn[]
): string {
  const serialized = JSON.stringify(transcript);
  const transcriptContext =
    serialized.length <= MAX_CONTEXT_LENGTH
      ? serialized
      : `… [earlier handoff context truncated]\n${serialized.slice(-MAX_CONTEXT_LENGTH)}`;
  return [
    `Emdash is handing this coding chat from ${fromProviderId} to ${toProviderId}.`,
    'Continue the same task without restarting it. The current workspace is the source of truth.',
    'Use the prior transcript as context, but verify relevant files before making further edits.',
    '<emdash_prior_transcript>',
    transcriptContext,
    '</emdash_prior_transcript>',
  ].join('\n');
}

export function readProviderSelection(
  providerId: AgentProviderId,
  storage: Pick<Storage, 'getItem'> = window.localStorage
): ProviderSelection {
  try {
    const raw = storage.getItem(PROVIDER_SELECTION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!isProviderSelections(parsed)) return {};
    return parsed[providerId] ?? {};
  } catch {
    return {};
  }
}

export function writeProviderSelection(
  providerId: AgentProviderId,
  selection: ProviderSelection,
  storage: Pick<Storage, 'getItem' | 'setItem'> = window.localStorage
): void {
  try {
    const raw = storage.getItem(PROVIDER_SELECTION_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    const selections = isProviderSelections(parsed) ? parsed : {};
    storage.setItem(
      PROVIDER_SELECTION_KEY,
      JSON.stringify({ ...selections, [providerId]: { ...selections[providerId], ...selection } })
    );
  } catch {
    // Preferences are an enhancement; provider switching must still work without storage.
  }
}

function isProviderSelections(value: unknown): value is ProviderSelections {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return false;
    const candidate = entry as Record<string, unknown>;
    return (
      (candidate.model === undefined || typeof candidate.model === 'string') &&
      (candidate.effort === undefined || typeof candidate.effort === 'string')
    );
  });
}
