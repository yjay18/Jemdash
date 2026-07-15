import { createRPCController } from '@shared/lib/ipc/rpc';
import { ollamaService } from './ollama-service';

export const ollamaController = createRPCController({
  getStatus: async () => await ollamaService.getStatus(),
  start: async () => await ollamaService.start(),
});
