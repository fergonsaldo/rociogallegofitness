import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
  Modal, TextInput,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { CoachRemoteRepository } from '../../../src/infrastructure/supabase/remote/CoachRemoteRepository';
import {
  getAthleteDetailUseCase,
  unassignRoutineFromAthleteUseCase,
  AthleteDetail,
} from '../../../src/application/coach/ClientUseCases';
import { AthleteRoutineAssignment, AthleteSession } from '../../../src/domain/repositories/ICoachRepository';
import { supabase } from '../../../src/infrastructure/supabase/client';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useMessageStore } from '../../../src/presentation/stores/messageStore';
import { useTagStore } from '../../../src/presentation/stores/tagStore';
import { TagPickerModal } from '../../../src/presentation/components/coach/TagPickerModal';
import { ClientTag } from '../../../src/domain/entities/ClientTag';
import { TagRemoteRepository } from '../../../src/infrastructure/supabase/remote/TagRemoteRepository';
import { getAthleteTagsUseCase } from '../../../src/application/coach/TagUseCases';

const tagRepo = new TagRemoteRepository();

const repo = new CoachRemoteRepository();

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function validatePasswordChange(
  newPassword: string,
  confirmPassword: string,
): string | null {
  if (newPassword.length < 8) return Strings.changePasswordErrorTooShort;
  if (newPassword !== confirmPassword) return Strings.changePasswordErrorMismatch;
  return null;
}

export default function ClientDetailScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuthStore();
  const { getOrOpenConversation } = useMessageStore();
  const { tags: coachTags, fetchTags } = useTagStore();

  const [detail, setDetail] = useState<AthleteDetail>({ assignments: [], cardioAssignments: [], nutritionAssignments: [], sessions: [] });
  const [athleteTags, setAthleteTags] = useState<ClientTag[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError]               = useState<string | null>(null);
  const [pwdSaving, setPwdSaving]             = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadAthleteDetail();
        if (user?.id) fetchTags(user.id);
      }
    }, [id, user?.id]),
  );

  const loadAthleteDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, tags] = await Promise.all([
        getAthleteDetailUseCase(id, repo),
        getAthleteTagsUseCase(id, tagRepo),
      ]);
      setDetail(data);
      setAthleteTags(tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : Strings.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignRoutine = (assignment: AthleteRoutineAssignment) => {
    Alert.alert(
      Strings.alertUnassignRoutineTitle,
      Strings.alertUnassignRoutineMessage(assignment.routineName, name),
      [
        { text: Strings.alertUnassignCancel, style: 'cancel' },
        {
          text: Strings.alertUnassignConfirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await unassignRoutineFromAthleteUseCase(assignment.routineId, id, repo);
              setDetail((prev) => ({
                ...prev,
                assignments: prev.assignments.filter((a) => a.routineId !== assignment.routineId),
              }));
            } catch (err) {
              setError(err instanceof Error ? err.message : Strings.errorGeneric);
            }
          },
        },
      ],
    );
  };

  const handleOpenChat = async () => {
    if (!user?.id || !id) return;
    try {
      const conv = await getOrOpenConversation(user.id, id);
      router.push({
        pathname: '/(coach)/messages/[id]',
        params: { id: conv.id, name: name ?? '' },
      });
    } catch {
      Alert.alert('Error', 'No se pudo abrir la conversación');
    }
  };

  const openPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPwdError(null);
    setPwdModalVisible(true);
  };

  const handleDeleteAthlete = () => {
    Alert.alert(
      Strings.alertDeleteClientTitle,
      Strings.alertDeleteClientMessage(name ?? ''),
      [
        { text: Strings.alertDeleteCancel, style: 'cancel' },
        {
          text: Strings.alertDeleteConfirm,
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.access_token) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');

              const { data, error: fnError } = await supabase.functions.invoke('delete-athlete', {
                body: { athleteId: id },
                headers: { Authorization: `Bearer ${session.access_token}` },
              });

              if (fnError) throw fnError;
              if (data?.error) throw new Error(data.error);

              Alert.alert('', Strings.deleteClientSuccess);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? Strings.deleteClientError);
            }
          },
        },
      ],
    );
  };

  const handleChangePassword = async () => {
    const validationError = validatePasswordChange(newPassword, confirmPassword);
    if (validationError) {
      setPwdError(validationError);
      return;
    }
    setPwdSaving(true);
    setPwdError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');

      const { data, error: fnError } = await supabase.functions.invoke('update-athlete-password', {
        body: { athleteId: id, password: newPassword },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setPwdModalVisible(false);
      Alert.alert('', Strings.changePasswordSuccess);
    } catch (err: any) {
      setPwdError(err?.message ?? Strings.changePasswordErrorGeneric);
    } finally {
      setPwdSaving(false);
    }
  };

  const getInitials = (n: string) =>
    n.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return Strings.labelInProgress;
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${mins} min`;
  };

  const { assignments, cardioAssignments, nutritionAssignments, sessions } = detail;

  return (
    <SafeAreaView style={styles.safe}>
      <TagPickerModal
        visible={pickerVisible}
        athleteId={id}
        coachTags={coachTags}
        assignedTagIds={new Set(athleteTags.map((t) => t.id))}
        onClose={(updatedIds) => {
          setPickerVisible(false);
          setAthleteTags(coachTags.filter((t) => updatedIds.has(t.id)));
        }}
      />
      <View style={styles.topbar}>
        <View style={styles.topbarActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleOpenChat}>
            <Text style={styles.iconBtnText}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push({ pathname: '/(coach)/routines', params: { assignTo: id, assignName: name } })}
          >
            <Text style={styles.iconBtnText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push({ pathname: '/(coach)/clients/documents', params: { athleteId: id, athleteName: name } })}
          >
            <Text style={styles.iconBtnText}>📁</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={pwdModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPwdModalVisible(false)}>
              <Text style={styles.modalCancel}>{Strings.changePasswordCancel}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{Strings.changePasswordModalTitle}</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={pwdSaving}>
              {pwdSaving
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={styles.modalSave}>{Strings.changePasswordSave}</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {pwdError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{pwdError}</Text>
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{Strings.changePasswordFieldNew}</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={Strings.changePasswordPlaceholder}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{Strings.changePasswordFieldConfirm}</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={Strings.changePasswordConfirmPlaceholder}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{getInitials(name ?? '')}</Text>
            </View>
            <Text style={styles.clientName}>{name}</Text>
            <View style={styles.statsRow}>
              <StatPill label={Strings.labelRoutines} value={String(assignments.length)} />
              <StatPill label={Strings.labelSessions} value={String(sessions.length)} />
              <StatPill
                label={Strings.labelLastWorkout}
                value={sessions[0]
                  ? sessions[0].startedAt.toLocaleDateString('es', { month: 'short', day: 'numeric' })
                  : '—'}
              />
            </View>
            <TouchableOpacity style={styles.pwdBtn} onPress={openPasswordModal}>
              <Text style={styles.pwdBtnText}>🔑 {Strings.changePasswordButton}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pwdBtn, styles.deleteBtn]} onPress={handleDeleteAthlete}>
              <Text style={styles.deleteBtnText}>🗑 {Strings.deleteClientButton}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{Strings.sectionTags}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.manageBtnSmall}>
                <Text style={styles.manageBtnSmallText}>{Strings.tagManageButton}</Text>
              </TouchableOpacity>
            </View>
            {athleteTags.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>Sin etiquetas asignadas</Text>
              </View>
            ) : (
              <View style={styles.tagsWrap}>
                {athleteTags.map((tag) => (
                  <View key={tag.id} style={[styles.tagChip, { backgroundColor: `${tag.color}20`, borderColor: `${tag.color}60` }]}>
                    <View style={[styles.tagChipDot, { backgroundColor: tag.color }]} />
                    <Text style={[styles.tagChipText, { color: tag.color }]}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RUTINAS ASIGNADAS</Text>
            {assignments.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>Sin rutinas asignadas aún</Text>
              </View>
            ) : assignments.map((a) => (
              <TouchableOpacity
                key={a.routineId}
                style={styles.routineCard}
                onLongPress={() => handleUnassignRoutine(a)}
              >
                <View style={styles.routineAccent} />
                <View style={styles.routineContent}>
                  <Text style={styles.routineName}>{a.routineName}</Text>
                  <Text style={styles.routineDate}>
                    {Strings.labelAssigned(a.assignedAt.toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' }))}
                  </Text>
                </View>
                <Text style={styles.longPressHint}>mantén para quitar</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{Strings.sectionCardios}</Text>
            {cardioAssignments.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>{Strings.clientNoCardiosAssigned}</Text>
              </View>
            ) : cardioAssignments.map((c) => (
              <TouchableOpacity
                key={c.cardioId}
                style={styles.routineCard}
                onPress={() => router.push({ pathname: '/(coach)/cardios', params: {} })}
              >
                <View style={[styles.routineAccent, styles.cardioAccent]} />
                <View style={styles.routineContent}>
                  <Text style={styles.routineName}>{c.cardioName}</Text>
                  <Text style={styles.routineDate}>
                    {Strings.labelAssigned(c.assignedAt.toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' }))}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{Strings.sectionNutritionPlan}</Text>
            {nutritionAssignments.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>{Strings.clientNoNutritionPlan}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.routineCard}
                onPress={() => router.push({ pathname: '/(coach)/nutrition/[id]', params: { id: nutritionAssignments[0].planId } })}
              >
                <View style={[styles.routineAccent, styles.nutritionAccent]} />
                <View style={styles.routineContent}>
                  <Text style={styles.routineName}>{nutritionAssignments[0].planName}</Text>
                  <Text style={styles.routineDate}>
                    {Strings.clientNutritionPlanAssigned(
                      nutritionAssignments[0].assignedAt.toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' })
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SESIONES RECIENTES</Text>
            {sessions.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>Sin sesiones aún</Text>
              </View>
            ) : sessions.map((s) => (
              <View key={s.id} style={styles.sessionCard}>
                <View style={[
                  styles.sessionDot,
                  s.status === 'completed'  ? styles.sessionDotDone :
                  s.status === 'abandoned'  ? styles.sessionDotAbandoned :
                  styles.sessionDotActive,
                ]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {s.startedAt.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {formatDuration(s.startedAt, s.finishedAt)} · {s.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  topbarActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  iconBtnText: { fontSize: 16 },
  pwdBtn: { borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceMuted, borderWidth: 1, borderColor: Colors.border },
  pwdBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  errorText: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalCancel: { color: Colors.textSecondary, fontSize: FontSize.sm, width: 70 },
  modalSave: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700', width: 70, textAlign: 'right' },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  modalBody: { padding: Spacing.lg, gap: Spacing.md },
  errorBanner: { backgroundColor: `${Colors.error}15`, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.error}30` },
  errorBannerText: { color: Colors.error, fontSize: FontSize.sm },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md },
  profileCard: { backgroundColor: Colors.surface, margin: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  clientName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statPill: { backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  section:            { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg, gap: Spacing.sm },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel:       { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  manageBtnSmall:     { backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: `${Colors.primary}30` },
  manageBtnSmallText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  tagsWrap:           { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tagChip:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1 },
  tagChipDot:         { width: 8, height: 8, borderRadius: 4 },
  tagChipText:        { fontSize: FontSize.xs, fontWeight: '700' },
  emptySection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptySectionText: { color: Colors.textMuted, fontSize: FontSize.sm },
  routineCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  routineAccent:   { width: 4, alignSelf: 'stretch', backgroundColor: Colors.primary },
  cardioAccent:    { backgroundColor: Colors.athlete },
  nutritionAccent: { backgroundColor: Colors.warning },
  routineContent: { flex: 1, padding: Spacing.md, gap: 2 },
  routineName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  routineDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  longPressHint: { fontSize: 9, color: Colors.textMuted, paddingRight: Spacing.sm },
  sessionCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  sessionDot: { width: 10, height: 10, borderRadius: 5 },
  sessionDotDone: { backgroundColor: Colors.success },
  sessionDotAbandoned: { backgroundColor: Colors.error },
  sessionDotActive: { backgroundColor: Colors.athlete },
  sessionInfo: { flex: 1 },
  sessionDate: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  sessionMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn:     { borderColor: `${Colors.error}50`, backgroundColor: `${Colors.error}10` },
  deleteBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.error },
});
