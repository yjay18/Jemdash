import { describe, expect, it } from 'vitest';
import {
  authorizationCodeFromInput,
  authorizationCodeInputForTerminal,
} from './authorization-code';

describe('authorizationCodeFromInput', () => {
  it('preserves a pasted authorization code', () => {
    expect(authorizationCodeFromInput('  code-value#state-value  ')).toBe('code-value#state-value');
  });

  it('extracts and decodes a code from a callback URL query', () => {
    expect(
      authorizationCodeFromInput('https://example.test/callback?code=code%23state&scope=profile')
    ).toBe('code#state');
  });

  it('extracts a code from a callback URL fragment', () => {
    expect(authorizationCodeFromInput('https://example.test/callback#code=fragment-code')).toBe(
      'fragment-code'
    );
  });

  it('accepts a pasted code parameter', () => {
    expect(authorizationCodeFromInput('code=parameter-code&state=test')).toBe('parameter-code');
  });

  it('submits the code with the terminal Enter sequence', () => {
    expect(authorizationCodeInputForTerminal('code=parameter-code')).toBe('parameter-code\r');
  });
});
