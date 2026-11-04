export interface EmbeddingProvider {
  readonly provider: string;
  readonly model: string;
  embed(texts: string[]): Promise<number[][]>;
}

type OllamaEmbedResponse = {
  embeddings?: unknown;
};

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly provider = "ollama";
  readonly model: string;
  private readonly baseUrl: string;

  constructor(options: { baseUrl?: string; model?: string } = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434")
      .replace(/\/+$/, "");
    this.model = options.model ?? process.env.OLLAMA_EMBED_MODEL ?? "embeddinggemma";
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, input: texts }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Ollama embedding request failed with ${response.status}`);
    }

    const payload = (await response.json()) as OllamaEmbedResponse;
    if (!Array.isArray(payload.embeddings)) {
      throw new Error("Ollama embedding response did not contain embeddings");
    }

    const vectors = payload.embeddings.map((value) => {
      if (!Array.isArray(value) || !value.every((item) => typeof item === "number")) {
        throw new Error("Ollama returned an invalid embedding vector");
      }
      return value as number[];
    });
    if (vectors.length !== texts.length) {
      throw new Error("Ollama returned a different number of embeddings than requested");
    }
    return vectors;
  }
}

export function configuredEmbeddingProvider(): EmbeddingProvider | null {
  return process.env.EMBEDDING_PROVIDER === "ollama"
    ? new OllamaEmbeddingProvider()
    : null;
}
