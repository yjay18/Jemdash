import type { AgentAuthContext, AgentAuthStatus } from '@emdash/core/agents/plugins';
import { authenticatedFromEnv } from '../../helpers/auth';

const AUTH_STATUS_TIMEOUT_MS = 5_000;
const LOGGED_OUT_PATTERN = /not (authenticated|logged in|signed in)|login required|logged out/i;

type ExecErrorWithOutput = {
  code?: unknown;
  exitCode?: unknown;
  stdout?: unknown;
  stderr?: unknown;
  message?: unknown;
};

export async function claudeAuthStatus(ctx: AgentAuthContext): Promise<AgentAuthStatus> {
  const envStatus = authenticatedFromEnv(ctx, ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN']);
  if (envStatus.kind === 'authenticated') return envStatus;

  try {
    const { stdout } = await ctx.exec(ctx.cli, ['auth', 'status'], {
      timeout: AUTH_STATUS_TIMEOUT_MS,
    });
    const status = parseAuthStatus(stdout);
    if (status?.loggedIn === false) return { kind: 'unauthenticated' };
    if (status?.loggedIn !== true) return { kind: 'unknown' };
    return { kind: 'authenticated', account: accountFromAuthStatus(status) };
  } catch (error) {
    const output = outputFromExecError(error);
    if (isLoggedOutResponse(error, output)) {
      return { kind: 'unauthenticated' };
    }
    return { kind: 'unknown' };
  }
}

function isExitCode(error: unknown, code: number): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const withOutput = error as ExecErrorWithOutput;
  return withOutput.code === code || withOutput.exitCode === code;
}

function isLoggedOutResponse(error: unknown, output: ExecErrorOutput): boolean {
  const parsed = parseAuthStatus(output.stdout) ?? parseAuthStatus(output.stderr);
  if (parsed?.loggedIn === false) return true;
  return isExitCode(error, 1) && LOGGED_OUT_PATTERN.test(output.combined);
}

function accountFromAuthStatus(status: Record<string, unknown>): string | undefined {
  const oauthAccount = objectValue(status?.oauthAccount);
  return firstString(
    status?.email,
    status?.account,
    status?.accountEmail,
    oauthAccount?.emailAddress,
    oauthAccount?.email
  );
}

function parseAuthStatus(output: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(output);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0);
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

type ExecErrorOutput = {
  stdout: string;
  stderr: string;
  combined: string;
};

function outputFromExecError(error: unknown): ExecErrorOutput {
  if (typeof error !== 'object' || error === null) {
    const message = String(error);
    return { stdout: '', stderr: '', combined: message };
  }
  const withOutput = error as ExecErrorWithOutput;
  const stdout = typeof withOutput.stdout === 'string' ? withOutput.stdout : '';
  const stderr = typeof withOutput.stderr === 'string' ? withOutput.stderr : '';
  const combined = [withOutput.stdout, withOutput.stderr, withOutput.message]
    .filter((value): value is string => typeof value === 'string')
    .join('\n');
  return { stdout, stderr, combined };
}
