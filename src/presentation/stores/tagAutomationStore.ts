import { create } from 'zustand';
import { TagAutomation, SaveTagAutomationInput } from '@/domain/entities/TagAutomation';
import { TagAutomationRemoteRepository } from '@/infrastructure/supabase/remote/TagAutomationRemoteRepository';
import {
  getTagAutomationUseCase,
  saveTagAutomationUseCase,
  deleteTagAutomationUseCase,
} from '@/application/coach/TagAutomationUseCases';

const repo = new TagAutomationRemoteRepository();

interface TagAutomationState {
  /** Keyed by tagId. null = loaded but no automation configured. undefined = not yet fetched. */
  automations: Record<string, TagAutomation | null>;
  isSaving:    boolean;
  error:       string | null;

  fetchAutomation:  (tagId: string) => Promise<void>;
  saveAutomation:   (tagId: string, input: SaveTagAutomationInput) => Promise<void>;
  deleteAutomation: (tagId: string) => Promise<void>;
  clearError:       () => void;
}

export const useTagAutomationStore = create<TagAutomationState>((set, get) => ({
  automations: {},
  isSaving:    false,
  error:       null,

  fetchAutomation: async (tagId) => {
    try {
      const automation = await getTagAutomationUseCase(tagId, repo);
      set((s) => ({ automations: { ...s.automations, [tagId]: automation } }));
    } catch (err) {
      set({ error: (err as any)?.message ?? 'Error al cargar la automatización' });
    }
  },

  saveAutomation: async (tagId, input) => {
    set({ isSaving: true, error: null });
    try {
      const automation = await saveTagAutomationUseCase(tagId, input, repo);
      set((s) => ({
        automations: { ...s.automations, [tagId]: automation },
        isSaving: false,
      }));
    } catch (err) {
      set({ error: (err as any)?.message ?? 'Error al guardar la automatización', isSaving: false });
      throw err;
    }
  },

  deleteAutomation: async (tagId) => {
    set({ isSaving: true, error: null });
    try {
      await deleteTagAutomationUseCase(tagId, repo);
      set((s) => ({
        automations: { ...s.automations, [tagId]: null },
        isSaving: false,
      }));
    } catch (err) {
      set({ error: (err as any)?.message ?? 'Error al eliminar la automatización', isSaving: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
