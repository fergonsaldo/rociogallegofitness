import { create } from 'zustand';
import { AthleteGroup, CreateAthleteGroupInput, UpdateAthleteGroupInput } from '@/domain/entities/AthleteGroup';
import { AthleteGroupRemoteRepository } from '@/infrastructure/supabase/remote/AthleteGroupRemoteRepository';
import {
  getGroupsUseCase,
  createGroupUseCase,
  updateGroupUseCase,
  deleteGroupUseCase,
  getGroupMembersUseCase,
  addMemberToGroupUseCase,
  removeMemberFromGroupUseCase,
} from '@/application/coach/AthleteGroupUseCases';
import { Strings } from '@/shared/constants/strings';

const repo = new AthleteGroupRemoteRepository();

interface AthleteGroupState {
  groups:     AthleteGroup[];
  /** Keyed by groupId — athleteIds of members */
  members:    Record<string, string[]>;
  isLoading:  boolean;
  isSaving:   boolean;
  error:      string | null;

  fetchGroups:   (coachId: string) => Promise<void>;
  createGroup:   (input: CreateAthleteGroupInput) => Promise<AthleteGroup>;
  updateGroup:   (id: string, input: UpdateAthleteGroupInput) => Promise<AthleteGroup>;
  deleteGroup:   (id: string) => Promise<void>;
  fetchMembers:  (groupId: string) => Promise<void>;
  addMember:     (groupId: string, athleteId: string) => Promise<void>;
  removeMember:  (groupId: string, athleteId: string) => Promise<void>;
  clearError:    () => void;
}

export const useAthleteGroupStore = create<AthleteGroupState>((set, get) => ({
  groups:    [],
  members:   {},
  isLoading: false,
  isSaving:  false,
  error:     null,

  fetchGroups: async (coachId) => {
    set({ isLoading: true, error: null });
    try {
      const groups = await getGroupsUseCase(coachId, repo);
      set({ groups, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : Strings.errorFallback,
        isLoading: false,
      });
    }
  },

  createGroup: async (input) => {
    set({ isSaving: true, error: null });
    try {
      const group = await createGroupUseCase(input, repo);
      set((s) => ({
        groups: [...s.groups, group].sort((a, b) => a.name.localeCompare(b.name)),
        isSaving: false,
      }));
      return group;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback, isSaving: false });
      throw err;
    }
  },

  updateGroup: async (id, input) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await updateGroupUseCase(id, input, repo);
      set((s) => ({
        groups: s.groups
          .map((g) => (g.id === id ? updated : g))
          .sort((a, b) => a.name.localeCompare(b.name)),
        isSaving: false,
      }));
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback, isSaving: false });
      throw err;
    }
  },

  deleteGroup: async (id) => {
    set({ isSaving: true, error: null });
    try {
      await deleteGroupUseCase(id, repo);
      set((s) => ({
        groups: s.groups.filter((g) => g.id !== id),
        isSaving: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback, isSaving: false });
      throw err;
    }
  },

  fetchMembers: async (groupId) => {
    try {
      const athleteIds = await getGroupMembersUseCase(groupId, repo);
      set((s) => ({ members: { ...s.members, [groupId]: athleteIds } }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
    }
  },

  addMember: async (groupId, athleteId) => {
    set({ error: null });
    try {
      await addMemberToGroupUseCase(groupId, athleteId, repo);
      set((s) => {
        const current = s.members[groupId] ?? [];
        if (current.includes(athleteId)) return s;
        return {
          members: { ...s.members, [groupId]: [...current, athleteId] },
          groups:  s.groups.map((g) =>
            g.id === groupId ? { ...g, memberCount: g.memberCount + 1 } : g,
          ),
        };
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
      throw err;
    }
  },

  removeMember: async (groupId, athleteId) => {
    set({ error: null });
    try {
      await removeMemberFromGroupUseCase(groupId, athleteId, repo);
      set((s) => ({
        members: {
          ...s.members,
          [groupId]: (s.members[groupId] ?? []).filter((id) => id !== athleteId),
        },
        groups: s.groups.map((g) =>
          g.id === groupId ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g,
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : Strings.errorFallback });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
