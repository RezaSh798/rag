import { type IVectorRecord } from "./vector-record.interface"

export interface IVectorStore {
  upsert(records: IVectorRecord[]): Promise<void>;
  search(queryVector: number[], limit: number): Promise<IVectorRecord[]>;
}