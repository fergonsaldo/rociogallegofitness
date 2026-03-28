/**
 * athleteGroupStore tests — RF-E2-04a / RF-E2-04b
 */

import { act, renderHook } from '@testing-library/react-native';
import { useAthleteGroupStore } from '../../../src/presentation/stores/athleteGroupStore';
import * as UseCases from '../../../src/application/coach/AthleteGroupUseCases';
import { AthleteGroup } from '../../../src/domain/entities/AthleteGroup';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/AthleteGroupUseCases');
jest.mock('../../../src/infrastructure/supabase/remote/AthleteGroupRemoteRepository');
jest.mock('../../../src/infrastructure/supabase/remote/RoutineRemoteRepository');
jest.mock('../../../src/infrastructure/supabase/remote/CardioRemoteRepository');
jest.mock('../../../src/infrastructure/supabase/remote/NutritionRemoteRepository');

const mockGetGroups       = UseCases.getGroupsUseCase              as jest.MockedFunction<typeof UseCases.getGroupsUseCase>;
const mockCreate          = UseCases.createGroupUseCase            as jest.MockedFunction<typeof UseCases.createGroupUseCase>;
const mockUpdate          = UseCases.updateGroupUseCase            as jest.MockedFunction<typeof UseCases.updateGroupUseCase>;
const mockDelete          = UseCases.deleteGroupUseCase            as jest.MockedFunction<typeof UseCases.deleteGroupUseCase>;
const mockGetMembers      = UseCases.getGroupMembersUseCase        as jest.MockedFunction<typeof UseCases.getGroupMembersUseCase>;
const mockAddMember       = UseCases.addMemberToGroupUseCase       as jest.MockedFunction<typeof UseCases.addMemberToGroupUseCase>;
const mockRemoveMember    = UseCases.removeMemberFromGroupUseCase  as jest.MockedFunction<typeof UseCases.removeMemberFromGroupUseCase>;
const mockAssignContent   = UseCases.assignContentToGroupUseCase   as jest.MockedFunction<typeof UseCases.assignContentToGroupUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = '00000000-0000-4000-b000-000000000001';
const GROUP_ID   = '00000000-0000-4000-b000-000000000002';
const ATHLETE_ID = '00000000-0000-4000-b000-000000000003';

const GROUP: AthleteGroup = {
  id: GROUP_ID, coachId: COACH_ID, name: 'Principiantes',
  description: null, memberCount: 1, createdAt: new Date(),
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  useAthleteGroupStore.setState({
    groups: [], members: {}, isLoading: false, isSaving: false, isAssigning: false, error: null,
  });
});

// ── fetchGroups ───────────────────────────────────────────────────────────────

describe('fetchGroups', () => {
  it('loads groups and clears loading state', async () => {
    mockGetGroups.mockResolvedValue([GROUP]);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.fetchGroups(COACH_ID); });

    expect(result.current.groups).toEqual([GROUP]);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    mockGetGroups.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.fetchGroups(COACH_ID); });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });
});

// ── createGroup ───────────────────────────────────────────────────────────────

describe('createGroup', () => {
  it('adds group to list sorted alphabetically', async () => {
    const existing: AthleteGroup = { ...GROUP, id: '00000000-0000-4000-b000-000000000099', name: 'VIP' };
    useAthleteGroupStore.setState({ groups: [existing] });
    mockCreate.mockResolvedValue(GROUP);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => {
      await result.current.createGroup({ coachId: COACH_ID, name: 'Principiantes' });
    });

    expect(result.current.groups[0].name).toBe('Principiantes');
    expect(result.current.groups[1].name).toBe('VIP');
  });

  it('sets error and rethrows on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Create failed'));
    const { result } = renderHook(() => useAthleteGroupStore());

    let thrown: unknown;
    await act(async () => {
      try { await result.current.createGroup({ coachId: COACH_ID, name: 'Test' }); } catch (e) { thrown = e; }
    });

    expect((thrown as Error).message).toBe('Create failed');
    expect(result.current.error).toBe('Create failed');
    expect(result.current.isSaving).toBe(false);
  });
});

// ── updateGroup ───────────────────────────────────────────────────────────────

describe('updateGroup', () => {
  it('replaces group in list and re-sorts', async () => {
    const updated = { ...GROUP, name: 'Avanzados' };
    useAthleteGroupStore.setState({ groups: [GROUP] });
    mockUpdate.mockResolvedValue(updated);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => {
      await result.current.updateGroup(GROUP_ID, { name: 'Avanzados' });
    });

    expect(result.current.groups[0].name).toBe('Avanzados');
  });

  it('sets error and rethrows on failure', async () => {
    mockUpdate.mockRejectedValue(new Error('Update failed'));
    const { result } = renderHook(() => useAthleteGroupStore());

    let thrown: unknown;
    await act(async () => {
      try { await result.current.updateGroup(GROUP_ID, {}); } catch (e) { thrown = e; }
    });

    expect((thrown as Error).message).toBe('Update failed');
  });
});

// ── deleteGroup ───────────────────────────────────────────────────────────────

describe('deleteGroup', () => {
  it('removes group from list', async () => {
    useAthleteGroupStore.setState({ groups: [GROUP] });
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.deleteGroup(GROUP_ID); });

    expect(result.current.groups).toHaveLength(0);
  });

  it('sets error on failure', async () => {
    mockDelete.mockRejectedValue(new Error('Delete failed'));
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => {
      try { await result.current.deleteGroup(GROUP_ID); } catch { /* expected */ }
    });

    expect(result.current.error).toBe('Delete failed');
  });
});

// ── fetchMembers ──────────────────────────────────────────────────────────────

describe('fetchMembers', () => {
  it('stores member ids keyed by groupId', async () => {
    mockGetMembers.mockResolvedValue([ATHLETE_ID]);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.fetchMembers(GROUP_ID); });

    expect(result.current.members[GROUP_ID]).toEqual([ATHLETE_ID]);
  });

  it('sets error on failure', async () => {
    mockGetMembers.mockRejectedValue(new Error('Fetch failed'));
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.fetchMembers(GROUP_ID); });

    expect(result.current.error).toBe('Fetch failed');
  });
});

// ── addMember ─────────────────────────────────────────────────────────────────

describe('addMember', () => {
  it('appends athleteId to members and increments memberCount', async () => {
    useAthleteGroupStore.setState({ groups: [GROUP], members: { [GROUP_ID]: [] } });
    mockAddMember.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.addMember(GROUP_ID, ATHLETE_ID); });

    expect(result.current.members[GROUP_ID]).toContain(ATHLETE_ID);
    expect(result.current.groups[0].memberCount).toBe(2);
  });

  it('does not duplicate if already a member', async () => {
    useAthleteGroupStore.setState({ groups: [GROUP], members: { [GROUP_ID]: [ATHLETE_ID] } });
    mockAddMember.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.addMember(GROUP_ID, ATHLETE_ID); });

    expect(result.current.members[GROUP_ID]).toHaveLength(1);
  });

  it('sets error and rethrows on failure', async () => {
    mockAddMember.mockRejectedValue(new Error('Add failed'));
    const { result } = renderHook(() => useAthleteGroupStore());

    let thrown: unknown;
    await act(async () => {
      try { await result.current.addMember(GROUP_ID, ATHLETE_ID); } catch (e) { thrown = e; }
    });

    expect((thrown as Error).message).toBe('Add failed');
  });
});

// ── removeMember ──────────────────────────────────────────────────────────────

describe('removeMember', () => {
  it('removes athleteId from members and decrements memberCount', async () => {
    useAthleteGroupStore.setState({
      groups: [GROUP],
      members: { [GROUP_ID]: [ATHLETE_ID] },
    });
    mockRemoveMember.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.removeMember(GROUP_ID, ATHLETE_ID); });

    expect(result.current.members[GROUP_ID]).not.toContain(ATHLETE_ID);
    expect(result.current.groups[0].memberCount).toBe(0);
  });

  it('memberCount does not go below 0', async () => {
    useAthleteGroupStore.setState({
      groups: [{ ...GROUP, memberCount: 0 }],
      members: { [GROUP_ID]: [] },
    });
    mockRemoveMember.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => { await result.current.removeMember(GROUP_ID, ATHLETE_ID); });

    expect(result.current.groups[0].memberCount).toBe(0);
  });

  it('sets error on failure', async () => {
    mockRemoveMember.mockRejectedValue(new Error('Remove failed'));
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => {
      try { await result.current.removeMember(GROUP_ID, ATHLETE_ID); } catch { /* expected */ }
    });

    expect(result.current.error).toBe('Remove failed');
  });
});

// ── assignContentToGroup ──────────────────────────────────────────────────────

const ROUTINE_ID   = '00000000-0000-4000-b000-000000000010';

describe('assignContentToGroup', () => {
  it('calls use case and clears isAssigning on success', async () => {
    mockAssignContent.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAthleteGroupStore());

    await act(async () => {
      await result.current.assignContentToGroup(GROUP_ID, { routineId: ROUTINE_ID });
    });

    expect(mockAssignContent).toHaveBeenCalledWith(
      GROUP_ID,
      { routineId: ROUTINE_ID },
      expect.anything(), expect.anything(), expect.anything(), expect.anything(),
    );
    expect(result.current.isAssigning).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error and rethrows on failure', async () => {
    mockAssignContent.mockRejectedValue(new Error('Assign failed'));
    const { result } = renderHook(() => useAthleteGroupStore());

    let thrown: unknown;
    await act(async () => {
      try { await result.current.assignContentToGroup(GROUP_ID, { routineId: ROUTINE_ID }); } catch (e) { thrown = e; }
    });

    expect((thrown as Error).message).toBe('Assign failed');
    expect(result.current.error).toBe('Assign failed');
    expect(result.current.isAssigning).toBe(false);
  });
});

// ── clearError ────────────────────────────────────────────────────────────────

describe('clearError', () => {
  it('clears the error', () => {
    useAthleteGroupStore.setState({ error: 'algo falló' });
    const { result } = renderHook(() => useAthleteGroupStore());
    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
  });
});
