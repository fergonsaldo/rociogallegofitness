import { create } from 'zustand';
import { BodyMetric, CreateBodyMetricInput } from '@/domain/entities/BodyMetric';
import { BodyMetricRemoteRepository } from '@/infrastructure/supabase/remote/BodyMetricRemoteRepository';
import {
  getBodyMetricsUseCase,
  createBodyMetricUseCase,
  deleteBodyMetricUseCase,
  buildBodyMetricSummary,
  BodyMetricSummary,
} from '@/application/athlete/BodyMetricUseCases';

const repo = new BodyMetricRemoteRepository();

interface BodyMetricState {
  metrics:   BodyMetric[];
  summary:   BodyMetricSummary;
  isLoading: boolean;
  error:     string | null;

  fetch(athleteId: string): Promise<void>;
  create(input: CreateBodyMetricInput): Promise<BodyMetric | null>;
  delete(id: string): Promise<boolean>;
  clearError(): void;
}

const EMPTY_SUMMARY: BodyMetricSummary = {
  latest:  null,
  initial: null,
  delta:   { weightKg: null, waistCm: null, hipCm: null, bodyFatPercent: null },
};

export const useBodyMetricStore = create<BodyMetricState>((set) => ({
  metrics:   [],
  summary:   EMPTY_SUMMARY,
  isLoading: false,
  error:     null,

  async fetch(athleteId) {
    set({ isLoading: true, error: null });
    try {
      const metrics = await getBodyMetricsUseCase(athleteId, repo);
      set({ metrics, summary: buildBodyMetricSummary(metrics), isLoading: false });
    } catch (err) {
      set({ error: (err as any)?.message ?? 'Error al cargar métricas', isLoading: false });
    }
  },

  async create(input) {
    set({ isLoading: true, error: null });
    try {
      const created = await createBodyMetricUseCase(input, repo);
      set((state) => {
        const metrics = [...state.metrics, created].sort(
          (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
        );
        return { metrics, summary: buildBodyMetricSummary(metrics), isLoading: false };
      });
      return created;
    } catch (err) {
      set({ error: (err as any)?.message ?? 'Error al guardar métrica', isLoading: false });
      return null;
    }
  },

  async delete(id) {
    set({ isLoading: true, error: null });
    try {
      await deleteBodyMetricUseCase(id, repo);
      set((state) => {
        const metrics = state.metrics.filter((m) => m.id !== id);
        return { metrics, summary: buildBodyMetricSummary(metrics), isLoading: false };
      });
      return true;
    } catch (err) {
      set({ error: (err as any)?.message ?? 'Error al eliminar métrica', isLoading: false });
      return false;
    }
  },

  clearError() { set({ error: null }); },
}));
