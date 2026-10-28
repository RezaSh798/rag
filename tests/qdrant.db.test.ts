import { describe, expect, it, mock } from "bun:test";
import { QdrantDb } from "../src/database/qdrant.db";
import type { IVectorRecord } from "../src/contracts/vector-record.interface";
import type { QdrantClient } from "@qdrant/js-client-rest";

describe("QdrantDb", () => {
  it("initializes with default values and custom config", () => {
    const dbDefault = new QdrantDb();
    expect(dbDefault.name).toBe("rag_knowledge_base");

    const dbCustom = new QdrantDb({
      collectionName: "custom_collection",
      vectorSize: 768,
    });
    expect(dbCustom.name).toBe("custom_collection");
  });

  it("creates collection when it does not exist", async () => {
    const mockCollectionExists = mock(() => Promise.resolve({ exists: false }));
    const mockCreateCollection = mock(() => Promise.resolve(true));

    const mockClient = {
      collectionExists: mockCollectionExists,
      createCollection: mockCreateCollection,
    } as unknown as QdrantClient;

    const db = new QdrantDb({
      collectionName: "test_coll",
      vectorSize: 1536,
      client: mockClient,
    });

    await db.ensureCollection();

    expect(mockCollectionExists).toHaveBeenCalledTimes(1);
    expect(mockCreateCollection).toHaveBeenCalledTimes(1);
    expect(mockCreateCollection).toHaveBeenCalledWith("test_coll", {
      vectors: {
        size: 1536,
        distance: "Cosine",
      },
    });
  });

  it("handles upsert of records correctly including deterministic UUID generation", async () => {
    const mockCollectionExists = mock(() => Promise.resolve({ exists: true }));
    const mockUpsert = mock(() => Promise.resolve({}));

    const mockClient = {
      collectionExists: mockCollectionExists,
      upsert: mockUpsert,
    } as unknown as QdrantClient;

    const db = new QdrantDb({
      collectionName: "test_coll",
      client: mockClient,
    });

    const records: IVectorRecord[] = [
      {
        id: "doc-1:0",
        vector: [0.1, 0.2, 0.3],
        payload: {
          content: "Sample content chunk",
          source: "doc.txt",
          chunkIndex: 0,
          title: "Sample Doc",
        },
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174000", // already valid UUID
        vector: [0.4, 0.5, 0.6],
        payload: {
          content: "Another chunk",
          source: "doc.txt",
          chunkIndex: 1,
        },
      },
    ];

    await db.upsert(records);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const upsertArgs = mockUpsert.mock.calls[0] as unknown as [string, { wait: boolean; points: any[] }];
    expect(upsertArgs[0]).toBe("test_coll");
    expect(upsertArgs[1].wait).toBe(true);
    expect(upsertArgs[1].points.length).toBe(2);

    // Non-UUID string was converted to deterministic UUID
    const point1 = upsertArgs[1].points[0];
    expect(point1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(point1.payload._recordId).toBe("doc-1:0");
    expect(point1.payload.content).toBe("Sample content chunk");
    expect(point1.vector).toEqual([0.1, 0.2, 0.3]);

    // Valid UUID was kept as-is
    const point2 = upsertArgs[1].points[1];
    expect(point2.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(point2.payload._recordId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("handles empty upsert gracefully", async () => {
    const mockUpsert = mock(() => Promise.resolve({}));
    const mockClient = {
      upsert: mockUpsert,
    } as unknown as QdrantClient;

    const db = new QdrantDb({ client: mockClient });
    await db.upsert([]);
    expect(mockUpsert).toHaveBeenCalledTimes(0);
  });

  it("executes search and maps results back to IVectorRecord", async () => {
    const mockCollectionExists = mock(() => Promise.resolve({ exists: true }));
    const mockQuery = mock(() =>
      Promise.resolve({
        points: [
          {
            id: "uuid-point-id",
            version: 1,
            score: 0.95,
            vector: [0.1, 0.2, 0.3],
            payload: {
              _recordId: "doc-1:0",
              content: "Retrieved chunk content",
              source: "doc.txt",
              chunkIndex: 0,
              title: "Test Title",
            },
          },
        ],
      })
    );

    const mockClient = {
      collectionExists: mockCollectionExists,
      query: mockQuery,
    } as unknown as QdrantClient;

    const db = new QdrantDb({
      collectionName: "test_coll",
      client: mockClient,
    });

    const results = await db.search([0.1, 0.2, 0.3], 5);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("doc-1:0");
    expect(results[0].vector).toEqual([0.1, 0.2, 0.3]);
    expect(results[0].payload.content).toBe("Retrieved chunk content");
    expect(results[0].payload.source).toBe("doc.txt");
    expect(results[0].payload.chunkIndex).toBe(0);
    expect(results[0].payload.title).toBe("Test Title");
  });

  it("returns empty array when search query vector is empty or limit is zero", async () => {
    const mockQuery = mock(() => Promise.resolve({ points: [] }));
    const mockClient = { query: mockQuery } as unknown as QdrantClient;

    const db = new QdrantDb({ client: mockClient });
    expect(await db.search([], 5)).toEqual([]);
    expect(await db.search([0.1], 0)).toEqual([]);
    expect(mockQuery).toHaveBeenCalledTimes(0);
  });
});
