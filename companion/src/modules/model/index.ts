import {
  OllamaConversationModel,
  type OllamaConversationModelOptions,
} from "./ollama-conversation-model";
import {
  OpenAIConversationModel,
  type OpenAIConversationModelOptions,
} from "./openai-conversation-model";

export * from "./conversation-planner";
export {
  buildAssistantPrompt,
  buildSafetyPrompt,
  type ModelPromptMessage,
} from "./conversation-prompt";
export {
  OllamaConversationModel,
  type FetchLike,
  type OllamaConversationModelOptions,
} from "./ollama-conversation-model";
export {
  OpenAIConversationModel,
  type OpenAIConversationModelOptions,
} from "./openai-conversation-model";
export {
  checkConfiguredConversationModels,
  checkConversationModel,
  checkConversationModels,
  checkOpenAIConversationModels,
  warmConfiguredConversationModels,
  warmConversationModel,
  warmConversationModels,
  type ModelReadiness,
} from "./readiness";

export function configuredConversationModel(
  options: OllamaConversationModelOptions | OpenAIConversationModelOptions = {},
) {
  return process.env.LLM_PROVIDER === "openai"
    ? new OpenAIConversationModel(options)
    : new OllamaConversationModel(options);
}
