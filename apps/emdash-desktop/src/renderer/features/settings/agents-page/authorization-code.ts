export function authorizationCodeFromInput(value: string): string {
  const input = value.trim();
  if (!input) return '';

  try {
    const url = new URL(input);
    return codeFromParams(url.searchParams) ?? codeFromParams(fragmentParams(url.hash)) ?? input;
  } catch {
    return codeFromParams(new URLSearchParams(input.replace(/^[?#]/u, ''))) ?? input;
  }
}

export function authorizationCodeInputForTerminal(value: string): string {
  const code = authorizationCodeFromInput(value);
  return code ? `${code}\r` : '';
}

function fragmentParams(fragment: string): URLSearchParams {
  return new URLSearchParams(fragment.replace(/^#/u, ''));
}

function codeFromParams(params: URLSearchParams): string | null {
  const code = params.get('code')?.trim();
  return code || null;
}
