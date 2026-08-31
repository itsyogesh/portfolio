import { createOpenAI } from '@ai-sdk/openai';
import { keys } from '../keys';

const openai = createOpenAI({
  apiKey: keys().OPENAI_API_KEY,
});

type OpenAIModel = ReturnType<ReturnType<typeof createOpenAI>>;

export const models: {
  chat: OpenAIModel;
  embeddings: OpenAIModel;
} = {
  chat: openai('gpt-4o-mini'),
  embeddings: openai('text-embedding-3-small'),
};
