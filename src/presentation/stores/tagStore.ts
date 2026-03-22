import { create } from 'zustand';
import { ClientTag, CreateClientTagInput } from '@/domain/entities/ClientTag';
import { UpdateClientTagInput } from '@/domain/repositories/ITagRepository';
import { TagRemoteRepository } from '@/infrastructure/supabase/remote/TagRemoteRepository';
import {
  getTagsUseCase,
  createTagUseCase,
  updateTagUseCase,
  deleteTagUseCase,
} from '@/application/coach/TagUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new TagRemoteRepository();

interface TagState {
  tags:      ClientTag[];
  isLoading: boolean;
  error:     string | null;

  fetchTags:   (coachId: string) => Promise<void>;
  createTag:   (input: CreateClientTagInput) => Promise<ClientTag>;
  updateTag:   (id: string, input: UpdateClientTagInput) => Promise<ClientTag>;
  deleteTag:   (id: string) => Promise<void>;
  clearError:  () => void;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags:      [],
  isLoading: false,
  error:     null,

  fetchTags: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const tags = await getTagsUseCase(coachId, repo);
      set({ tags, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : Strings.errorFailedLoadTags,
        isLoading: false,
      });
    }
  },

  createTag: async (input) => {
    try {
      const tag = await createTagUseCase(input, repo);
      set({ tags: [...get().tags, tag].sort((a, b) => a.name.localeCompare(b.name)) });
      return tag;
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedCreateTag;
      set({ error: message });
      throw err;
    }
  },

  updateTag: async (id, input) => {
    try {
      const updated = await updateTagUseCase(id, input, repo);
      set({
        tags: get().tags
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => a.name.localeCompare(b.name)),
      });
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedUpdateTag;
      set({ error: message });
      throw err;
    }
  },

  deleteTag: async (id) => {
    try {
      await deleteTagUseCase(id, repo);
      set({ tags: get().tags.filter((t) => t.id !== id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : Strings.errorFailedDeleteTag;
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
