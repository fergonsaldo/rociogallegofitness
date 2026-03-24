import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, FlatList, Modal,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRecipeStore } from '../../../src/presentation/stores/recipeStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useFoodStore } from '../../../src/presentation/stores/foodStore';
import { Food } from '../../../src/domain/entities/Food';
import { IngredientInput } from '../../../src/domain/entities/Recipe';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

interface IngredientRow extends IngredientInput {
  food: Food;
}

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createRecipe, isSubmitting } = useRecipeStore();
  const { foods, fetchFoods } = useFoodStore();

  const [name,         setName]         = useState('');
  const [instructions, setInstructions] = useState('');
  const [tagInput,     setTagInput]     = useState('');
  const [tags,         setTags]         = useState<string[]>([]);
  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [ingredients,  setIngredients]  = useState<IngredientRow[]>([]);

  const [foodPickerVisible, setFoodPickerVisible] = useState(false);
  const [foodSearch,        setFoodSearch]        = useState('');
  const [pendingQty,        setPendingQty]        = useState('');
  const [pendingFood,       setPendingFood]        = useState<Food | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchFoods(user.id);
    }, [user?.id]),
  );

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSelectFood = (food: Food) => {
    setPendingFood(food);
    setFoodPickerVisible(false);
    setFoodSearch('');
  };

  const handleAddIngredient = () => {
    const qty = parseFloat(pendingQty);
    if (!pendingFood || !qty || qty <= 0) {
      Alert.alert('Error', Strings.recipeFormIngredientInvalid);
      return;
    }
    if (ingredients.some((i) => i.foodId === pendingFood.id)) {
      setIngredients((prev) =>
        prev.map((i) =>
          i.foodId === pendingFood.id ? { ...i, quantityG: qty } : i,
        ),
      );
    } else {
      setIngredients((prev) => [...prev, { foodId: pendingFood.id, quantityG: qty, food: pendingFood }]);
    }
    setPendingFood(null);
    setPendingQty('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', Strings.recipeFormNameRequired);
      return;
    }

    const result = await createRecipe(
      {
        coachId:          user!.id,
        name:             name.trim(),
        instructions:     instructions.trim() || undefined,
        tags,
        showMacros:       true,
        visibleToClients: true,
        ingredients:      ingredients.map(({ foodId, quantityG }) => ({ foodId, quantityG })),
      },
      imageUri ?? undefined,
    );

    if (result) router.back();
  };

  const filteredFoods = foodSearch.trim()
    ? foods.filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase().trim()))
    : foods;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>{Strings.recipeFormCancel}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.recipeFormCreateTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Nombre */}
        <Text style={styles.label}>{Strings.recipeFormLabelName}</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Pollo al horno con batata"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          maxLength={100}
        />

        {/* Imagen */}
        <Text style={styles.label}>{Strings.recipeFormLabelImage}</Text>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                <Text style={styles.imageButtonText}>{Strings.recipeFormImageChange}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={() => setImageUri(null)}>
                <Text style={[styles.imageButtonText, { color: Colors.error }]}>
                  {Strings.recipeFormImageRemove}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            <Text style={styles.imagePickerText}>{Strings.recipeFormImageSelect}</Text>
          </TouchableOpacity>
        )}

        {/* Etiquetas */}
        <Text style={styles.label}>{Strings.recipeFormLabelTags}</Text>
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.input, styles.tagInput]}
            placeholder={Strings.recipeFormPlaceholderTag}
            placeholderTextColor={Colors.textSecondary}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
            maxLength={50}
          />
          <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
            <Text style={styles.addTagButtonText}>{Strings.recipeFormAddTag}</Text>
          </TouchableOpacity>
        </View>
        {tags.length > 0 && (
          <View style={styles.tagChipRow}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tagChip}
                onPress={() => setTags((prev) => prev.filter((t) => t !== tag))}
              >
                <Text style={styles.tagChipText}>{tag}</Text>
                <Text style={styles.tagChipRemove}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Ingredientes */}
        <Text style={styles.label}>{Strings.recipeFormLabelIngredients}</Text>
        {ingredients.map((item) => (
          <View key={item.foodId} style={styles.ingredientRow}>
            <Text style={styles.ingredientName} numberOfLines={1}>{item.food.name}</Text>
            <Text style={styles.ingredientQty}>{item.quantityG}g</Text>
            <TouchableOpacity
              onPress={() => setIngredients((prev) => prev.filter((i) => i.foodId !== item.foodId))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.ingredientRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add ingredient form */}
        <View style={styles.addIngredientBlock}>
          <TouchableOpacity
            style={styles.foodSelector}
            onPress={() => setFoodPickerVisible(true)}
          >
            <Text style={pendingFood ? styles.foodSelectorValue : styles.foodSelectorPlaceholder}>
              {pendingFood ? pendingFood.name : Strings.recipeFormIngredientSelect}
            </Text>
          </TouchableOpacity>
          <View style={styles.qtyRow}>
            <TextInput
              style={[styles.input, styles.qtyInput]}
              placeholder={Strings.recipeFormIngredientQty}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
              value={pendingQty}
              onChangeText={setPendingQty}
            />
            <TouchableOpacity style={styles.addIngredientButton} onPress={handleAddIngredient}>
              <Text style={styles.addIngredientButtonText}>{Strings.recipeFormAddIngredient}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instrucciones */}
        <Text style={styles.label}>{Strings.recipeFormLabelInstructions}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={Strings.recipeFormPlaceholderInstructions}
          placeholderTextColor={Colors.textSecondary}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          numberOfLines={5}
          maxLength={5000}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitButtonText}>{Strings.recipeFormSave}</Text>
          }
        </TouchableOpacity>

      </ScrollView>

      {/* Food picker modal */}
      <Modal visible={foodPickerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{Strings.recipeFormIngredientSelect}</Text>
            <TouchableOpacity onPress={() => { setFoodPickerVisible(false); setFoodSearch(''); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.modalSearch}
            placeholder={Strings.foodSearchPlaceholder}
            placeholderTextColor={Colors.textSecondary}
            value={foodSearch}
            onChangeText={setFoodSearch}
          />
          <FlatList
            data={filteredFoods}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectFood(item)}>
                <Text style={styles.modalItemName}>{item.name}</Text>
                <Text style={styles.modalItemMacro}>{Math.round(item.caloriesPer100g)} kcal/100g</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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
  textArea: { height: 120, textAlignVertical: 'top' },

  imageContainer:  { gap: Spacing.sm },
  imagePreview:    { width: '100%', height: 180, borderRadius: BorderRadius.md, backgroundColor: Colors.surface },
  imageActions:    { flexDirection: 'row', gap: Spacing.md },
  imageButton:     { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  imageButtonText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  imagePicker: {
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, paddingVertical: Spacing.lg,
    alignItems: 'center', backgroundColor: Colors.surface,
  },
  imagePickerText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },

  tagInputRow:      { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  tagInput:         { flex: 1 },
  addTagButton: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  addTagButtonText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  tagChipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  tagChipText:   { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  tagChipRemove: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },

  ingredientRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginBottom: 6,
  },
  ingredientName:   { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  ingredientQty:    { fontSize: FontSize.sm, color: Colors.textSecondary },
  ingredientRemove: { fontSize: 18, color: Colors.error, fontWeight: '700' },

  addIngredientBlock: { gap: Spacing.sm, marginTop: Spacing.sm },
  foodSelector: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  foodSelectorValue:       { fontSize: FontSize.md, color: Colors.textPrimary },
  foodSelectorPlaceholder: { fontSize: FontSize.md, color: Colors.textSecondary },
  qtyRow:                  { flexDirection: 'row', gap: Spacing.sm },
  qtyInput:                { flex: 1 },
  addIngredientButton: {
    backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  addIngredientButtonText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },

  submitButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xl,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText:     { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  modalSafe:    { flex: 1, backgroundColor: Colors.background },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalClose:   { fontSize: FontSize.xl, color: Colors.textSecondary },
  modalSearch: {
    marginHorizontal: Spacing.lg, marginVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalItem: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalItemName:  { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  modalItemMacro: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
