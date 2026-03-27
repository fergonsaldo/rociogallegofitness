/**
 * ClientUseCases tests
 */

import {
  getCoachAthletesUseCase,
  getAthleteDetailUseCase,
  unassignRoutineFromAthleteUseCase,
} from '../../../src/application/coach/ClientUseCases';
import { ICoachRepository, CoachAthlete, AthleteRoutineAssignment, AthleteCardioAssignment, AthleteNutritionAssignment, AthleteSession, ClientStatus } from '../../../src/domain/repositories/ICoachRepository';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const ATHLETE_ID = 'athl-uuid-0001-0000-000000000001';
const ROUTINE_ID = 'rout-uuid-0001-0000-000000000001';
const NOW        = new Date();

const ATHLETE: CoachAthlete = { id: ATHLETE_ID, fullName: 'Ana García', email: 'ana@test.com' };

const CARDIO_ID  = 'card-uuid-0001-0000-000000000001';
const PLAN_ID    = 'plan-uuid-0001-0000-000000000001';

const ASSIGNMENT: AthleteRoutineAssignment = {
  routineId: ROUTINE_ID, routineName: 'Push A', assignedAt: NOW,
};

const CARDIO_ASSIGNMENT: AthleteCardioAssignment = {
  cardioId: CARDIO_ID, cardioName: 'Carrera 30 min', assignedAt: NOW,
};

const NUTRITION_ASSIGNMENT: AthleteNutritionAssignment = {
  planId: PLAN_ID, planName: 'Déficit verano', planType: 'deficit', assignedAt: NOW,
};

const SESSION: AthleteSession = {
  id: 'sess-001', startedAt: NOW, finishedAt: NOW, status: 'completed',
};

// ── Mock repo ─────────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<ICoachRepository> = {
  getAthletes:                     jest.fn(),
  getAthleteAssignments:           jest.fn(),
  getAthleteCardioAssignments:     jest.fn(),
  getAthleteNutritionAssignments:  jest.fn(),
  getAthleteSessions:              jest.fn(),
  unassignRoutine:                 jest.fn(),
  getDashboardSummary:             jest.fn(),
  updateAthleteStatus:             jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getCoachAthletesUseCase ───────────────────────────────────────────────────

describe('getCoachAthletesUseCase', () => {
  it('returns athletes for a valid coachId', async () => {
    mockRepo.getAthletes.mockResolvedValue([ATHLETE]);
    const result = await getCoachAthletesUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Ana García');
    expect(mockRepo.getAthletes).toHaveBeenCalledWith(COACH_ID);
  });

  it('returns empty array when coach has no athletes', async () => {
    mockRepo.getAthletes.mockResolvedValue([]);
    expect(await getCoachAthletesUseCase(COACH_ID, mockRepo)).toEqual([]);
  });

  it('throws when coachId is empty', async () => {
    await expect(getCoachAthletesUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getAthletes).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getAthletes.mockRejectedValue(new Error('DB error'));
    await expect(getCoachAthletesUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── getAthleteDetailUseCase ───────────────────────────────────────────────────

describe('getAthleteDetailUseCase', () => {
  it('devuelve rutinas, cardios, planes y sesiones en paralelo', async () => {
    mockRepo.getAthleteAssignments.mockResolvedValue([ASSIGNMENT]);
    mockRepo.getAthleteCardioAssignments.mockResolvedValue([CARDIO_ASSIGNMENT]);
    mockRepo.getAthleteNutritionAssignments.mockResolvedValue([NUTRITION_ASSIGNMENT]);
    mockRepo.getAthleteSessions.mockResolvedValue([SESSION]);

    const result = await getAthleteDetailUseCase(ATHLETE_ID, mockRepo);

    expect(result.assignments).toHaveLength(1);
    expect(result.cardioAssignments).toHaveLength(1);
    expect(result.nutritionAssignments).toHaveLength(1);
    expect(result.sessions).toHaveLength(1);
    expect(mockRepo.getAthleteAssignments).toHaveBeenCalledWith(ATHLETE_ID);
    expect(mockRepo.getAthleteCardioAssignments).toHaveBeenCalledWith(ATHLETE_ID);
    expect(mockRepo.getAthleteNutritionAssignments).toHaveBeenCalledWith(ATHLETE_ID);
    expect(mockRepo.getAthleteSessions).toHaveBeenCalledWith(ATHLETE_ID, 10);
  });

  it('devuelve arrays vacíos cuando el atleta no tiene contenido asignado', async () => {
    mockRepo.getAthleteAssignments.mockResolvedValue([]);
    mockRepo.getAthleteCardioAssignments.mockResolvedValue([]);
    mockRepo.getAthleteNutritionAssignments.mockResolvedValue([]);
    mockRepo.getAthleteSessions.mockResolvedValue([]);

    const result = await getAthleteDetailUseCase(ATHLETE_ID, mockRepo);
    expect(result.assignments).toEqual([]);
    expect(result.cardioAssignments).toEqual([]);
    expect(result.nutritionAssignments).toEqual([]);
    expect(result.sessions).toEqual([]);
  });

  it('devuelve múltiples cardios asignados correctamente', async () => {
    const cardio2: AthleteCardioAssignment = { cardioId: 'card-002', cardioName: 'Bici 45 min', assignedAt: NOW };
    mockRepo.getAthleteAssignments.mockResolvedValue([]);
    mockRepo.getAthleteCardioAssignments.mockResolvedValue([CARDIO_ASSIGNMENT, cardio2]);
    mockRepo.getAthleteNutritionAssignments.mockResolvedValue([]);
    mockRepo.getAthleteSessions.mockResolvedValue([]);

    const result = await getAthleteDetailUseCase(ATHLETE_ID, mockRepo);
    expect(result.cardioAssignments).toHaveLength(2);
    expect(result.cardioAssignments[0].cardioName).toBe('Carrera 30 min');
  });

  it('devuelve múltiples planes de nutrición ordenados por fecha (más reciente primero)', async () => {
    const olderPlan: AthleteNutritionAssignment = { planId: 'plan-002', planName: 'Plan antiguo', planType: 'maintenance', assignedAt: new Date('2024-01-01') };
    mockRepo.getAthleteAssignments.mockResolvedValue([]);
    mockRepo.getAthleteCardioAssignments.mockResolvedValue([]);
    mockRepo.getAthleteNutritionAssignments.mockResolvedValue([NUTRITION_ASSIGNMENT, olderPlan]);
    mockRepo.getAthleteSessions.mockResolvedValue([]);

    const result = await getAthleteDetailUseCase(ATHLETE_ID, mockRepo);
    expect(result.nutritionAssignments).toHaveLength(2);
    expect(result.nutritionAssignments[0].planName).toBe('Déficit verano');
  });

  it('lanza si athleteId está vacío', async () => {
    await expect(getAthleteDetailUseCase('', mockRepo)).rejects.toThrow('athleteId is required');
    expect(mockRepo.getAthleteAssignments).not.toHaveBeenCalled();
  });

  it('propaga el error de getAthleteCardioAssignments', async () => {
    mockRepo.getAthleteAssignments.mockResolvedValue([]);
    mockRepo.getAthleteCardioAssignments.mockRejectedValue(new Error('Cardio RLS error'));
    mockRepo.getAthleteNutritionAssignments.mockResolvedValue([]);
    mockRepo.getAthleteSessions.mockResolvedValue([]);
    await expect(getAthleteDetailUseCase(ATHLETE_ID, mockRepo)).rejects.toThrow('Cardio RLS error');
  });

  it('propaga el error de getAthleteNutritionAssignments', async () => {
    mockRepo.getAthleteAssignments.mockResolvedValue([]);
    mockRepo.getAthleteCardioAssignments.mockResolvedValue([]);
    mockRepo.getAthleteNutritionAssignments.mockRejectedValue(new Error('Nutrition RLS error'));
    mockRepo.getAthleteSessions.mockResolvedValue([]);
    await expect(getAthleteDetailUseCase(ATHLETE_ID, mockRepo)).rejects.toThrow('Nutrition RLS error');
  });

  it('propaga el error de getAthleteSessions', async () => {
    mockRepo.getAthleteAssignments.mockResolvedValue([]);
    mockRepo.getAthleteCardioAssignments.mockResolvedValue([]);
    mockRepo.getAthleteNutritionAssignments.mockResolvedValue([]);
    mockRepo.getAthleteSessions.mockRejectedValue(new Error('Sessions error'));
    await expect(getAthleteDetailUseCase(ATHLETE_ID, mockRepo)).rejects.toThrow('Sessions error');
  });
});

// ── unassignRoutineFromAthleteUseCase ─────────────────────────────────────────

describe('unassignRoutineFromAthleteUseCase', () => {
  it('calls repository.unassignRoutine with correct ids', async () => {
    mockRepo.unassignRoutine.mockResolvedValue(undefined);
    await unassignRoutineFromAthleteUseCase(ROUTINE_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.unassignRoutine).toHaveBeenCalledWith(ROUTINE_ID, ATHLETE_ID);
  });

  it('throws when routineId is empty', async () => {
    await expect(unassignRoutineFromAthleteUseCase('', ATHLETE_ID, mockRepo))
      .rejects.toThrow('routineId is required');
    expect(mockRepo.unassignRoutine).not.toHaveBeenCalled();
  });

  it('throws when athleteId is empty', async () => {
    await expect(unassignRoutineFromAthleteUseCase(ROUTINE_ID, '', mockRepo))
      .rejects.toThrow('athleteId is required');
    expect(mockRepo.unassignRoutine).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.unassignRoutine.mockRejectedValue(new Error('Delete failed'));
    await expect(unassignRoutineFromAthleteUseCase(ROUTINE_ID, ATHLETE_ID, mockRepo))
      .rejects.toThrow('Delete failed');
  });
});

// ── archiveAthleteUseCase ─────────────────────────────────────────────────────

import { archiveAthleteUseCase, restoreAthleteUseCase } from '../../../src/application/coach/ClientUseCases';

describe('archiveAthleteUseCase', () => {
  it('calls repository.updateAthleteStatus with archived', async () => {
    mockRepo.updateAthleteStatus.mockResolvedValue(undefined);
    await archiveAthleteUseCase(COACH_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.updateAthleteStatus).toHaveBeenCalledWith(COACH_ID, ATHLETE_ID, 'archived');
  });

  it('throws when coachId is empty', async () => {
    await expect(archiveAthleteUseCase('', ATHLETE_ID, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.updateAthleteStatus).not.toHaveBeenCalled();
  });

  it('throws when athleteId is empty', async () => {
    await expect(archiveAthleteUseCase(COACH_ID, '', mockRepo))
      .rejects.toThrow('athleteId is required');
    expect(mockRepo.updateAthleteStatus).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.updateAthleteStatus.mockRejectedValue(new Error('RLS error'));
    await expect(archiveAthleteUseCase(COACH_ID, ATHLETE_ID, mockRepo))
      .rejects.toThrow('RLS error');
  });
});

// ── restoreAthleteUseCase ─────────────────────────────────────────────────────

describe('restoreAthleteUseCase', () => {
  it('calls repository.updateAthleteStatus with active', async () => {
    mockRepo.updateAthleteStatus.mockResolvedValue(undefined);
    await restoreAthleteUseCase(COACH_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.updateAthleteStatus).toHaveBeenCalledWith(COACH_ID, ATHLETE_ID, 'active');
  });

  it('throws when coachId is empty', async () => {
    await expect(restoreAthleteUseCase('', ATHLETE_ID, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.updateAthleteStatus).not.toHaveBeenCalled();
  });

  it('throws when athleteId is empty', async () => {
    await expect(restoreAthleteUseCase(COACH_ID, '', mockRepo))
      .rejects.toThrow('athleteId is required');
    expect(mockRepo.updateAthleteStatus).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.updateAthleteStatus.mockRejectedValue(new Error('Update failed'));
    await expect(restoreAthleteUseCase(COACH_ID, ATHLETE_ID, mockRepo))
      .rejects.toThrow('Update failed');
  });
});

// ── getCoachDashboardSummaryUseCase ───────────────────────────────────────────

import { getCoachDashboardSummaryUseCase } from '../../../src/application/coach/ClientUseCases';
import { CoachDashboardSummary } from '../../../src/domain/repositories/ICoachRepository';

const DASHBOARD_SUMMARY: CoachDashboardSummary = {
  totalAthletes: 3,
  activeAthletesThisWeek: 2,
  recentSessions: [
    {
      sessionId: 'sess-001',
      athleteId: ATHLETE_ID,
      athleteName: 'Ana García',
      startedAt: NOW,
      status: 'completed',
    },
  ],
};

describe('getCoachDashboardSummaryUseCase', () => {
  it('returns dashboard summary for a valid coachId', async () => {
    mockRepo.getDashboardSummary.mockResolvedValue(DASHBOARD_SUMMARY);

    const result = await getCoachDashboardSummaryUseCase(COACH_ID, mockRepo);

    expect(result.totalAthletes).toBe(3);
    expect(result.activeAthletesThisWeek).toBe(2);
    expect(result.recentSessions).toHaveLength(1);
    expect(mockRepo.getDashboardSummary).toHaveBeenCalledWith(
      COACH_ID,
      expect.any(Date),
      5,
    );
  });

  it('passes a `since` date approximately 7 days ago', async () => {
    mockRepo.getDashboardSummary.mockResolvedValue(DASHBOARD_SUMMARY);

    const before = Date.now();
    await getCoachDashboardSummaryUseCase(COACH_ID, mockRepo);
    const after = Date.now();

    const sinceArg: Date = mockRepo.getDashboardSummary.mock.calls[0][1];
    const diffMs = Date.now() - sinceArg.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(diffMs).toBeGreaterThanOrEqual(sevenDaysMs - (after - before));
    expect(diffMs).toBeLessThanOrEqual(sevenDaysMs + 1000);
  });

  it('throws when coachId is empty', async () => {
    await expect(getCoachDashboardSummaryUseCase('', mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.getDashboardSummary).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getDashboardSummary.mockRejectedValue(new Error('DB error'));
    await expect(getCoachDashboardSummaryUseCase(COACH_ID, mockRepo))
      .rejects.toThrow('DB error');
  });

  it('returns summary with empty sessions when no athletes trained', async () => {
    const emptySummary: CoachDashboardSummary = {
      totalAthletes: 0,
      activeAthletesThisWeek: 0,
      recentSessions: [],
    };
    mockRepo.getDashboardSummary.mockResolvedValue(emptySummary);

    const result = await getCoachDashboardSummaryUseCase(COACH_ID, mockRepo);

    expect(result.totalAthletes).toBe(0);
    expect(result.recentSessions).toEqual([]);
  });
});
