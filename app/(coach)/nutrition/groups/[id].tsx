import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useNutritionStore } from '../../../../src/presentation/stores/nutritionStore';
import { useAuthStore } from '../../../../src/presentation/stores/authStore';
import { NutritionPlan } from '../../../../src/domain/entities/NutritionPlan';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../../src/shared/constants/theme';
import { Strings } from '../../../../src/shared/constants/strings';

export default function PlanGroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    coachPlans, coachPlansLoading,
    groupDetail, groupDetailLoading, error,
    fetchGroupDetail, fetchCoachPlans,
    addPlanToGroup, removePlanFromGroup, clearError,
  } = useNutritionStore();

  const [showAddModal, setShowAddModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (id) fetchGroupDetail(id);
      if (user?.id) fetchCoachPlans(user.id);
    }, [id, user?.id]),
  );

  const group  = groupDetail?.group;
  const plans  = groupDetail?.plans ?? [];
  const planIds = new Set(plans.map((p) => p.id));

  const availablePlans = coachPlans.filter((p) => !planIds.has(p.id));

  const handleRemove = (plan: NutritionPlan) => {
    Alert.alert(
      Strings.planGroupRemovePlanTitle,
      Strings.planGroupRemovePlanMessage(plan.name),
      [
        { text: Strings.planGroupRemovePlanCancel, style: 'cancel' },
        { text: Strings.planGroupRemovePlanConfirm, style: 'destructive', onPress: () => removePlanFromGroup(id!, plan.id) },
      ],
    );
  };

  const handleAdd = async (planId: string) => {
    setShowAddModal(false);
    await addPlanToGroup(id!, planId);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backButton}>{Strings.planGroupDetailBack}</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {group?.name ?? Strings.planGroupDetailTitle}
          </Text>
        </View>

        {!!group?.description && (
          <Text style={styles.description}>{group.description}</Text>
        )}

        {/* Error */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>{Strings.planGroupAddPlanButton}</Text>
        </TouchableOpacity>

        {/* Plans list */}
        {groupDetailLoading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : (
          <FlatList
            data={plans}
            keyExtractor={(item) => item.id}
            contentContainerStyle={plans.length === 0 ? styles.emptyContainer : styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>{Strings.planGroupDetailEmptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{Strings.planGroupDetailEmptySubtitle}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <PlanRow plan={item} onRemove={() => handleRemove(item)} />
            )}
          />
        )}
      </View>

      {/* Modal — seleccionar plan */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{Strings.planGroupSelectModalTitle}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {coachPlansLoading ? (
              <ActivityIndicator color={Colors.primary} style={styles.loader} />
            ) : (
              <FlatList
                data={coachPlans}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const alreadyAdded = planIds.has(item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.modalPlanRow, alreadyAdded && styles.modalPlanRowDisabled]}
                      onPress={() => !alreadyAdded && handleAdd(item.id)}
                      activeOpacity={alreadyAdded ? 1 : 0.8}
                    >
                      <View style={styles.modalPlanInfo}>
                        <Text style={[styles.modalPlanName, alreadyAdded && styles.modalPlanNameDisabled]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.modalPlanType}>{item.type}</Text>
                      </View>
                      {alreadyAdded && (
                        <Text style={styles.modalPlanBadge}>{Strings.planGroupAlreadyAdded}</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function PlanRow({ plan, onRemove }: { plan: NutritionPlan; onRemove: () => void }) {
  return (
    <View style={styles.planRow}>
      <View style={styles.planInfo}>
        <Text style={styles.planName} numberOfLines={1}>{plan.name}</Text>
        <Text style={styles.planType}>{plan.type}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.planRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:                  { flex: 1, backgroundColor: Colors.background },
  container:             { flex: 1, paddingHorizontal: Spacing.md },
  header:                { paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backButton:            { color: Colors.primary, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  title:                 { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  description:           { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  errorBanner:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  errorText:             { color: Colors.error, fontSize: FontSize.sm, flex: 1 },
  errorDismiss:          { color: Colors.error, fontWeight: '700', marginLeft: Spacing.sm },
  addButton:             { borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', marginBottom: Spacing.md },
  addButtonText:         { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  loader:                { marginTop: Spacing.xl },
  listContent:           { paddingBottom: Spacing.xl },
  emptyContainer:        { flex: 1 },
  emptyState:            { alignItems: 'center', paddingTop: Spacing.xl * 2 },
  emptyEmoji:            { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle:            { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  emptySubtitle:         { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  planRow:               { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  planInfo:              { flex: 1 },
  planName:              { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  planType:              { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  planRemove:            { fontSize: 18, color: Colors.textSecondary, padding: Spacing.xs },
  modalSafe:             { flex: 1, backgroundColor: Colors.background },
  modalContainer:        { flex: 1, paddingHorizontal: Spacing.md },
  modalHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  modalTitle:            { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalClose:            { fontSize: FontSize.lg, color: Colors.textSecondary, padding: Spacing.xs },
  modalPlanRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  modalPlanRowDisabled:  { opacity: 0.5 },
  modalPlanInfo:         { flex: 1 },
  modalPlanName:         { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  modalPlanNameDisabled: { color: Colors.textSecondary },
  modalPlanType:         { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  modalPlanBadge:        { fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: 'italic' },
});
