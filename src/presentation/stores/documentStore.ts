import { create } from 'zustand';
import { Document } from '@/domain/entities/Document';
import { DocumentRemoteRepository } from '@/infrastructure/supabase/remote/DocumentRemoteRepository';
import {
  getDocumentsUseCase,
  uploadDocumentUseCase,
  deleteDocumentUseCase,
} from '@/application/coach/DocumentUseCases';
import { Strings } from '@/shared/constants/strings';

interface DocumentState {
  documents:    Document[];
  isLoading:    boolean;
  isUploading:  boolean;
  error:        string | null;

  fetchDocuments(coachId: string, athleteId: string): Promise<void>;
  uploadDocument(coachId: string, athleteId: string, uploadedBy: string, name: string, localUri: string, mimeType: string): Promise<Document | null>;
  deleteDocument(doc: Document): Promise<void>;
  clearError(): void;
}

const repo = new DocumentRemoteRepository();

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents:   [],
  isLoading:   false,
  isUploading: false,
  error:       null,

  fetchDocuments: async (coachId, athleteId) => {
    set({ isLoading: true, error: null });
    try {
      const documents = await getDocumentsUseCase(coachId, athleteId, repo);
      set({ documents });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadDocument: async (coachId, athleteId, uploadedBy, name, localUri, mimeType) => {
    set({ isUploading: true, error: null });
    try {
      const doc = await uploadDocumentUseCase(coachId, athleteId, uploadedBy, name, localUri, mimeType, repo);
      set({ documents: [doc, ...get().documents] });
      return doc;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
      return null;
    } finally {
      set({ isUploading: false });
    }
  },

  deleteDocument: async (doc) => {
    set({ error: null });
    try {
      await deleteDocumentUseCase(doc, repo);
      set({ documents: get().documents.filter((d) => d.id !== doc.id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
    }
  },

  clearError: () => set({ error: null }),
}));
