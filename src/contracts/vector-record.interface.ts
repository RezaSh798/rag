export interface IVectorRecord {
  id: string;
  vector: number[];
  payload: {
    content: string;
    source: string;
    chunkIndex: number;
    title?: string;
  };
}