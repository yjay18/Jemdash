export type OllamaModel = {
  name: string;
  size: number | null;
  modifiedAt: string | null;
};

/** The local Ollama runtime's current availability to Emdash. */
export type OllamaRuntimeStatus =
  | {
      kind: 'unavailable';
      message: string;
    }
  | {
      kind: 'offline';
      message: string;
    }
  | {
      kind: 'starting';
      message: string;
    }
  | {
      kind: 'ready';
      /** True only when this Emdash process launched `ollama serve`. */
      managed: boolean;
      models: OllamaModel[];
    }
  | {
      kind: 'error';
      message: string;
    };
