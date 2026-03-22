import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../shared/constants/theme';
import { Strings } from '../../../shared/constants/strings';
import { ClientTag } from '../../../domain/entities/ClientTag';
import { TagRemoteRepository } from '../../../infrastructure/supabase/remote/TagRemoteRepository';
import {
  assignTagToAthleteUseCase,
  removeTagFromAthleteUseCase,
} from '../../../application/coach/TagUseCases';

const repo = new TagRemoteRepository();

interface Props {
  visible:    boolean;
  athleteId:  string;
  coachTags:  ClientTag[];       // all tags for this coach (from tagStore)
  assignedTagIds: Set<string>;   // ids already assigned when modal opens
  onClose:    (updatedIds: Set<string>) => void;
}

export function TagPickerModal({ visible, athleteId, coachTags, assignedTagIds, onClose }: Props) {
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [toggling,  setToggling]  = useState<string | null>(null);

  useEffect(() => {
    if (visible) setSelected(new Set(assignedTagIds));
  }, [visible, assignedTagIds]);

  const toggle = async (tag: ClientTag) => {
    if (toggling) return;
    setToggling(tag.id);
    try {
      if (selected.has(tag.id)) {
        await removeTagFromAthleteUseCase(tag.id, athleteId, repo);
        setSelected((prev) => { const s = new Set(prev); s.delete(tag.id); return s; });
      } else {
        await assignTagToAthleteUseCase(tag.id, athleteId, repo);
        setSelected((prev) => new Set(prev).add(tag.id));
      }
    } finally {
      setToggling(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => onClose(selected)}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{Strings.tagPickerTitle}</Text>
            <TouchableOpacity onPress={() => onClose(selected)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>{Strings.tagPickerDone}</Text>
            </TouchableOpacity>
          </View>

          {coachTags.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{Strings.tagPickerEmpty}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {coachTags.map((tag) => {
                const isSelected = selected.has(tag.id);
                const isLoading  = toggling === tag.id;
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => toggle(tag)}
                    activeOpacity={0.75}
                    disabled={!!toggling}
                  >
                    <View style={[styles.dot, { backgroundColor: tag.color }]} />
                    <Text style={[styles.tagName, isSelected && styles.tagNameSelected]}>
                      {tag.name}
                    </Text>
                    {isLoading
                      ? <ActivityIndicator size="small" color={Colors.primary} />
                      : <View style={[styles.check, isSelected && styles.checkSelected]}>
                          {isSelected && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                    }
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: Spacing.lg }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '70%', paddingBottom: Spacing.xxl },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:          { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  doneBtn:        { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  doneBtnText:    { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  empty:          { padding: Spacing.xl, alignItems: 'center' },
  emptyText:      { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  list:           { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm },
  row:            { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  rowSelected:    { backgroundColor: Colors.primarySubtle, borderColor: `${Colors.primary}40` },
  dot:            { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
  tagName:        { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  tagNameSelected:{ color: Colors.textPrimary },
  check:          { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkSelected:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark:      { color: '#fff', fontSize: 13, fontWeight: '800' },
});
