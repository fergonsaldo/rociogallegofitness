import { Document, CreateDocumentInput } from '@/domain/entities/Document';

export interface IDocumentRepository {
  getDocuments(coachId: string, athleteId: string): Promise<Document[]>;
  uploadDocument(input: CreateDocumentInput): Promise<Document>;
  deleteDocument(doc: Document): Promise<void>;
  uploadFile(coachId: string, athleteId: string, localUri: string, mimeType: string): Promise<{ filePath: string; fileSize: number }>;
}
