import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVideoStore } from '../../../src/presentation/stores/videoStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

export default function EditVideoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { catalog, update, isUpdating } = useVideoStore();
  const video = catalog.find((v) => v.id === id);

  const [title, setTitle]               = useState(video?.title ?? '');
  const [url, setUrl]                   = useState(video?.url ?? '');
  const [tagInput, setTagInput]         = useState('');
  const [tags, setTags]                 = useState<string[]>(video?.tags ?? []);
  const [description, setDescription]   = useState(video?.description ?? '');
  const [visibleToClients, setVisibleToClients] = useState(video?.visibleToClients ?? false);

  if (!video) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Vídeo no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', Strings.videoFormErrorTitle);
      return;
    }
    if (!url.trim()) {
      Alert.alert('Error', Strings.videoFormErrorUrl);
      return;
    }

    const result = await update(id, {
      title:            title.trim(),
      url:              url.trim(),
      tags,
      description:      description.trim() || undefined,
      visibleToClients,
    });

    if (result) {
      Alert.alert('✓', Strings.videoEditSuccess, [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>{Strings.videoFormCancel}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.videoEditTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Título */}
        <Text style={styles.label}>{Strings.videoFormLabelTitle}</Text>
        <TextInput
          style={styles.input}
          placeholder={Strings.videoFormPlaceholderTitle}
          placeholderTextColor={Colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* URL YouTube */}
        <Text style={styles.label}>{Strings.videoFormLabelUrl}</Text>
        <TextInput
          style={styles.input}
          placeholder={Strings.videoFormPlaceholderUrl}
          placeholderTextColor={Colors.textSecondary}
          value={url}
          onChangeText={setUrl}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Etiquetas */}
        <Text style={styles.label}>{Strings.videoFormLabelTags}</Text>
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.input, styles.tagInput]}
            placeholder={Strings.videoFormPlaceholderTag}
            placeholderTextColor={Colors.textSecondary}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
            maxLength={50}
          />
          <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
            <Text style={styles.addTagButtonText}>{Strings.videoFormAddTag}</Text>
          </TouchableOpacity>
        </View>
        {tags.length > 0 && (
          <View style={styles.tagChipRow}>
            {tags.map((tag) => (
              <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => handleRemoveTag(tag)}>
                <Text style={styles.tagChipText}>{tag}</Text>
                <Text style={styles.tagChipRemove}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Descripción */}
        <Text style={styles.label}>{Strings.videoFormLabelDescription}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={Strings.videoFormPlaceholderDesc}
          placeholderTextColor={Colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Visibilidad */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{Strings.videoFormLabelVisibility}</Text>
          <Switch
            value={visibleToClients}
            onValueChange={setVisibleToClients}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isUpdating && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isUpdating}
        >
          {isUpdating
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitButtonText}>{Strings.videoEditSubmit}</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  headerSpacer: { width: 60 },
  cancelText:   { color: Colors.primary, fontSize: FontSize.md },
  headerTitle:  { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },

  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  tagInputRow:    { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  tagInput:       { flex: 1 },
  addTagButton: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  addTagButtonText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },

  tagChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  tagChipText:   { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  tagChipRemove: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },

  submitButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  switchLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },

  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FontSize.md, color: Colors.error },
});
