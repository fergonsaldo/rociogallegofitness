import { create } from 'zustand';
import { ProgressPhoto, CreateProgressPhotoInput } from '@/domain/entities/ProgressPhoto';
import { ProgressPhotoRemoteRepository } from '@/infrastructure/supabase/remote/ProgressPhotoRemoteRepository';
import {
  getProgressPhotosUseCase,
  uploadProgressPhotoUseCase,
  deleteProgressPhotoUseCase,
} from '@/application/athlete/ProgressPhotoUseCases';

const repo = new ProgressPhotoRemoteRepository();

interface ProgressPhotoState {
  photos:     ProgressPhoto[];
  isLoading:  boolean;
  isUploading: boolean;
  error:      string | null;

  fetch(athleteId: string): Promise<void>;
  upload(input: CreateProgressPhotoInput, localUri: string): Promise<ProgressPhoto | null>;
  delete(photo: ProgressPhoto): Promise<boolean>;
  clearError(): void;
}

export const useProgressPhotoStore = create<ProgressPhotoState>((set) => ({
  photos:      [],
  isLoading:   false,
  isUploading: false,
  error:       null,

  async fetch(athleteId) {
    set({ isLoading: true, error: null });
    try {
      const photos = await getProgressPhotosUseCase(athleteId, repo);
      set({ photos, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al cargar fotos', isLoading: false });
    }
  },

  async upload(input, localUri) {
    set({ isUploading: true, error: null });
    try {
      const photo = await uploadProgressPhotoUseCase(input, localUri, repo);
      set((state) => ({
        photos: [...state.photos, photo].sort(
          (a, b) => a.takenAt.getTime() - b.takenAt.getTime(),
        ),
        isUploading: false,
      }));
      return photo;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al subir foto', isUploading: false });
      return null;
    }
  },

  async delete(photo) {
    set({ isLoading: true, error: null });
    try {
      await deleteProgressPhotoUseCase(photo, repo);
      set((state) => ({ photos: state.photos.filter((p) => p.id !== photo.id), isLoading: false }));
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al eliminar foto', isLoading: false });
      return false;
    }
  },

  clearError() { set({ error: null }); },
}));
