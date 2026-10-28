import { QdrantClient } from "@qdrant/js-client-rest";
import { createHash } from "node:crypto";
import type { IVectorStore } from "../contracts/vector-store.interface";
import type { IVectorRecord } from "../contracts/vector-record.interface";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toValidQdrantId(id: string): string {
  if (UUID_REGEX.test(id)) {
    return id;
  }

  const hash = createHash("md5").update(id).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export interface QdrantDbConfig {
  url?: string;
  apiKey?: string;
  collectionName?: string;
  vectorSize?: number;
  client?: QdrantClient;
}

export class QdrantDb implements IVectorStore {
  private readonly _qdrant: QdrantClient;
  private readonly collectionName: string;
  private vectorSize: number;
  private isCollectionReady = false;

  constructor(config?: QdrantDbConfig) {
    this.collectionName =
      config?.collectionName || process.env.QDRANT_COLLECTION || "rag_knowledge_base";
    this.vectorSize =
      config?.vectorSize ||
      (process.env.QDRANT_VECTOR_SIZE ? Number(process.env.QDRANT_VECTOR_SIZE) : 1536);

    this._qdrant =
      config?.client ||
      new QdrantClient({
        url: config?.url || process.env.QDRANT_URL || "http://localhost:6333",
        apiKey: config?.apiKey || process.env.QDRANT_API_KEY,
      });
  }

  get client(): QdrantClient {
    return this._qdrant;
  }

  get name(): string {
    return this.collectionName;
  }

  async collectionExists(): Promise<boolean> {
    try {
      const response = await this._qdrant.collectionExists(this.collectionName);
      return response.exists;
    } catch {
      const result = await this._qdrant.getCollections();
      return result.collections.some((c) => c.name === this.collectionName);
    }
  }

  async createCollection(size?: number): Promise<void> {
    const targetSize = size ?? this.vectorSize;
    const exists = await this.collectionExists();

    if (!exists) {
      await this._qdrant.createCollection(this.collectionName, {
        vectors: {
          size: targetSize,
          distance: "Cosine",
        },
      });
      this.vectorSize = targetSize;
    }

    this.isCollectionReady = true;
  }

  async ensureCollection(size?: number): Promise<void> {
    if (this.isCollectionReady) {
      return;
    }

    await this.createCollection(size);
  }

  async deleteCollection(): Promise<void> {
    const exists = await this.collectionExists();
    if (exists) {
      await this._qdrant.deleteCollection(this.collectionName);
    }
    this.isCollectionReady = false;
  }

  async upsert(records: IVectorRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    await this.ensureCollection(records[0]?.vector?.length);

    const points = records.map((record) => ({
      id: toValidQdrantId(record.id),
      vector: record.vector,
      payload: {
        _recordId: record.id,
        content: record.payload.content,
        source: record.payload.source,
        chunkIndex: record.payload.chunkIndex,
        title: record.payload.title,
      },
    }));

    await this._qdrant.upsert(this.collectionName, {
      wait: true,
      points,
    });
  }

  async search(queryVector: number[], limit: number): Promise<IVectorRecord[]> {
    if (!queryVector || queryVector.length === 0 || limit <= 0) {
      return [];
    }

    await this.ensureCollection(queryVector.length);

    const result = await this._qdrant.query(this.collectionName, {
      query: queryVector,
      limit,
      with_payload: true,
      with_vector: true,
    });

    return (result.points || []).map((point) => {
      const payload = (point.payload || {}) as Record<string, unknown>;
      const vector =
        Array.isArray(point.vector) && typeof point.vector[0] === "number"
          ? (point.vector as number[])
          : [];

      return {
        id: typeof payload._recordId === "string" ? payload._recordId : String(point.id),
        vector,
        payload: {
          content: String(payload.content ?? ""),
          source: String(payload.source ?? ""),
          chunkIndex: typeof payload.chunkIndex === "number" ? payload.chunkIndex : 0,
          title: typeof payload.title === "string" ? payload.title : undefined,
        },
      };
    });
  }
}
