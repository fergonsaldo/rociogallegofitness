import { create } from 'zustand';
import { Strings } from '@/shared/constants/strings';
import { Video, CreateVideoInput } from '@/domain/entities/Video';
import { VideoRemoteRepository } from '@/infrastructure/supabase/remote/VideoRemoteRepository';
import {
  getAllVideosUseCase,
  createVideoUseCase,
  deleteVideoUseCase,
} from '@/application/coach/VideoUseCases';

const repo = new VideoRemoteRepository();

interface VideoState {
  catalog:    Video[];
  isLoading:  boolean;
  isCreating: boolean;
  error:      string | null;

  fetchAll:   (coachId: string) => Promise<void>;
  create:     (input: CreateVideoInput) => Promise<Video | null>;
  delete:     (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  catalog:    [],
  isLoading:  false,
  isCreating: false,
  error:      null,

  fetchAll: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const catalog = await getAllVideosUseCase(coachId, repo);
      set({ catalog, isLoading: false });
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedLoadVideos, isLoading: false });
    }
  },

  create: async (input) => {
    set({ isCreating: true, error: null });
    try {
      const video = await createVideoUseCase(input, repo);
      set((state) => ({
        catalog:    [video, ...state.catalog].sort((a, b) => a.title.localeCompare(b.title, 'es')),
        isCreating: false,
      }));
      return video;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedCreateVideo, isCreating: false });
      return null;
    }
  },

  delete: async (id) => {
    set({ error: null });
    try {
      await deleteVideoUseCase(id, repo);
      set((state) => ({ catalog: state.catalog.filter((v) => v.id !== id) }));
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? Strings.errorFailedDeleteVideo });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
