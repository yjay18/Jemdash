import { transcriptTurnSchema } from '@emdash/core/acp/client';
import z from 'zod';
import { defineVersionedSchema } from '@shared/lib/versioned-schema/versioned-schema';

const conversationConfigV0Schema = z.object({
  autoApprove: z.boolean().optional(),
  /** @deprecated Moved to conversations.session_id column; stripped on upgrade to v1. */
  providerSessionId: z.string().optional(),
  initialPrompt: z.string().optional(),
  /** Model to pass to the agent CLI (e.g. 'claude-sonnet-5', 'o4-mini'). Empty string or absent = CLI default. */
  model: z.string().optional(),
});

const initialQueuePromptSchema = z.object({
  text: z.string(),
  hiddenContext: z.string().optional(),
});

const conversationHandoffSchema = z.object({
  /** Provider whose native session produced the transcript prefix. */
  fromProviderId: z.string(),
  /** Normalized turns rendered before the new provider's own session history. */
  transcript: z.array(transcriptTurnSchema),
  /** Context added once to the first prompt sent to the new provider. */
  context: z.string(),
  /** Best-effort effort selection to apply after the target ACP session starts. */
  preferredEffort: z.string().optional(),
  /** Composer draft carried across the provider boundary. */
  draftText: z.string().optional(),
});

const ptyConfigV1 = z.object({
  version: z.literal('1'),
  type: z.literal('pty'),
  autoApprove: z.boolean().optional(),
  /** Initial prompt to deliver on first spawn (delivered once, gated on sessionId === null). */
  initialPrompt: z.string().optional(),
  /** Model to pass to the agent CLI. Empty string or absent = CLI default. */
  model: z.string().optional(),
});

const acpConfigV1 = z.object({
  version: z.literal('1'),
  type: z.literal('acp'),
  autoApprove: z.boolean().optional(),
  /** @deprecated Use initialQueue; kept so older in-progress ACP configs remain readable. */
  initialPrompt: z.string().optional(),
  /** Initial queued prompts to deliver on first spawn (delivered once, gated on sessionId === null). */
  initialQueue: z.array(initialQueuePromptSchema).optional(),
  /** Model to pass to the agent CLI. Empty string or absent = CLI default. */
  model: z.string().optional(),
  /** Optional context and visible history carried from another provider session. */
  handoff: conversationHandoffSchema.optional(),
});

export const conversationConfig = defineVersionedSchema()
  .unversioned(conversationConfigV0Schema)
  .version(
    '1',
    z.discriminatedUnion('type', [ptyConfigV1, acpConfigV1]),
    (v0) =>
      ({
        version: '1' as const,
        type: 'pty' as const,
        autoApprove: v0.autoApprove,
        initialPrompt: v0.initialPrompt,
        model: v0.model,
        // providerSessionId is intentionally dropped; it now lives in conversations.session_id
      }) satisfies z.infer<typeof ptyConfigV1>
  )
  .build();

export type ConversationConfig = typeof conversationConfig.Type;
export type ConversationConfigPty = z.infer<typeof ptyConfigV1>;
export type ConversationConfigAcp = z.infer<typeof acpConfigV1>;
