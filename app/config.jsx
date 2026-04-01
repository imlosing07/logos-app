import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_KEY = 'user:habits';
const USER_KEY = 'logos_user';
const MAX_HABITS = 3;

export default function ConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // User fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  // Habits
  const [habits, setHabits] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // New habit form
  const [showForm, setShowForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState('toggle'); // 'toggle' | 'counter'
  const [newHabitGoal, setNewHabitGoal] = useState('');

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    try {
      const [userData, habitsData] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(HABITS_KEY),
      ]);

      if (userData) {
        const parsed = JSON.parse(userData);
        setName(parsed.name || '');
        setAge(String(parsed.age || ''));
      }

      if (habitsData) {
        setHabits(JSON.parse(habitsData));
      }
    } catch (e) {
      console.error('Error loading config:', e);
    } finally {
      setLoaded(true);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const ageNum = parseInt(age, 10);

    if (!trimmedName) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
      Alert.alert('Error', 'Ingresá una edad válida');
      return;
    }

    try {
      // Save user
      const existingRaw = await AsyncStorage.getItem(USER_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const updatedUser = { ...existing, name: trimmedName, age: ageNum };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

      // Save habits
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));

      router.back();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar');
    }
  };

  const handleAddHabit = () => {
    const habitName = newHabitName.trim();
    if (!habitName) return;

    if (newHabitType === 'counter') {
      const goal = parseInt(newHabitGoal, 10);
      if (isNaN(goal) || goal < 1 || goal > 99) {
        Alert.alert('Error', 'La meta debe ser un número entre 1 y 99');
        return;
      }
    }

    const newHabit = {
      id: Date.now().toString(),
      name: habitName,
      type: newHabitType, // 'toggle' | 'counter'
      goal: newHabitType === 'counter' ? parseInt(newHabitGoal, 10) : null,
      xp: newHabitType === 'counter' ? 2 : 3,
    };

    const updated = [...habits, newHabit];
    setHabits(updated);
    setNewHabitName('');
    setNewHabitGoal('');
    setNewHabitType('toggle');
    setShowForm(false);
  };

  const handleDeleteHabit = (habitId) => {
    Alert.alert('Eliminar hábito', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const updated = habits.filter((h) => h.id !== habitId);
          setHabits(updated);
        },
      },
    ]);
  };

  const canAddMore = habits.length < MAX_HABITS;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.inner, { opacity: fadeIn }]}>
        {/* Header bar */}
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backButton}>← VOLVER</Text>
          </Pressable>
          <Text style={styles.headerTitle}>CONFIGURACIÓN</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── User info ────────────────────── */}
          <Text style={styles.sectionTitle}>PERFIL</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor="#333"
              autoCapitalize="words"
              maxLength={20}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EDAD</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
              placeholder="Tu edad"
              placeholderTextColor="#333"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          {/* ── Habits ───────────────────────── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            MIS HÁBITOS DIARIOS
          </Text>
          <Text style={styles.sectionSubtitle}>
            Máximo {MAX_HABITS} hábitos • Contador +2 XP • Toggle +3 XP
          </Text>

          {/* Existing habits list */}
          {habits.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Sin hábitos configurados</Text>
              <Text style={styles.emptySubtext}>Agregá hasta 3 hábitos personalizados</Text>
            </View>
          )}

          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitMeta}>
                  {habit.type === 'counter'
                    ? `Contador • Meta: ${habit.goal} • +${habit.xp} XP`
                    : `Toggle (SÍ/NO) • +${habit.xp} XP`}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDeleteHabit(habit.id)}
                hitSlop={10}
                style={styles.habitDelete}
              >
                <Text style={styles.habitDeleteText}>✕</Text>
              </Pressable>
            </View>
          ))}

          {/* Add habit button / form */}
          {canAddMore && !showForm && (
            <Pressable
              style={styles.addHabitButton}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.addHabitButtonText}>+ AGREGAR HÁBITO</Text>
            </Pressable>
          )}

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>NUEVO HÁBITO</Text>

              {/* Habit name */}
              <TextInput
                style={styles.input}
                value={newHabitName}
                onChangeText={setNewHabitName}
                placeholder="Nombre del hábito"
                placeholderTextColor="#333"
                maxLength={25}
              />

              {/* Type selector */}
              <Text style={[styles.label, { marginTop: 12 }]}>TIPO</Text>
              <View style={styles.typeRow}>
                <Pressable
                  style={[
                    styles.typeChip,
                    newHabitType === 'toggle' && styles.typeChipActive,
                  ]}
                  onPress={() => setNewHabitType('toggle')}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      newHabitType === 'toggle' && styles.typeChipTextActive,
                    ]}
                  >
                    Toggle (SÍ/NO)
                  </Text>
                  <Text
                    style={[
                      styles.typeChipXP,
                      newHabitType === 'toggle' && styles.typeChipXPActive,
                    ]}
                  >
                    +3 XP
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeChip,
                    newHabitType === 'counter' && styles.typeChipActive,
                  ]}
                  onPress={() => setNewHabitType('counter')}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      newHabitType === 'counter' && styles.typeChipTextActive,
                    ]}
                  >
                    Contador
                  </Text>
                  <Text
                    style={[
                      styles.typeChipXP,
                      newHabitType === 'counter' && styles.typeChipXPActive,
                    ]}
                  >
                    +2 XP
                  </Text>
                </Pressable>
              </View>

              {/* Goal (for counter only) */}
              {newHabitType === 'counter' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>META DIARIA</Text>
                  <TextInput
                    style={styles.input}
                    value={newHabitGoal}
                    onChangeText={(t) => setNewHabitGoal(t.replace(/[^0-9]/g, ''))}
                    placeholder="Ej: 8 (vasos de agua)"
                    placeholderTextColor="#333"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              )}

              {/* Form action buttons */}
              <View style={styles.formActions}>
                <Pressable
                  style={styles.formCancelBtn}
                  onPress={() => {
                    setShowForm(false);
                    setNewHabitName('');
                    setNewHabitGoal('');
                    setNewHabitType('toggle');
                  }}
                >
                  <Text style={styles.formCancelText}>CANCELAR</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.formConfirmBtn,
                    !newHabitName.trim() && styles.formConfirmBtnDisabled,
                  ]}
                  onPress={handleAddHabit}
                  disabled={!newHabitName.trim()}
                >
                  <Text
                    style={[
                      styles.formConfirmText,
                      !newHabitName.trim() && styles.formConfirmTextDisabled,
                    ]}
                  >
                    CONFIRMAR
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {!canAddMore && !showForm && (
            <Text style={styles.maxReached}>
              Se alcanzó el máximo de {MAX_HABITS} hábitos
            </Text>
          )}


        </ScrollView>

        {/* Save button fixed at bottom */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>GUARDAR Y VOLVER</Text>
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  inner: {
    flex: 1,
  },
  // Header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0f0f1a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  backButton: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#d4a017',
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#666',
    letterSpacing: 3,
  },
  // Scroll area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  // Section titles
  sectionTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#444',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#333',
    marginBottom: 14,
    marginTop: -6,
  },
  // Input fields
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#d4a017',
    letterSpacing: 3,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'ShareTechMono',
    fontSize: 15,
    color: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  // Habit cards
  habitCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitInfo: {
    flex: 1,
    marginRight: 10,
  },
  habitName: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#c8bfa0',
    marginBottom: 4,
  },
  habitMeta: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#555',
  },
  habitDelete: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitDeleteText: {
    fontSize: 14,
    color: '#ef4444',
  },
  // Add habit button
  addHabitButton: {
    borderWidth: 1,
    borderColor: '#d4a017',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addHabitButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#d4a017',
    letterSpacing: 2,
  },
  // Form card
  formCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 8,
    padding: 16,
    marginTop: 4,
  },
  formTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#d4a017',
    letterSpacing: 3,
    marginBottom: 14,
  },
  // Type selector
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1a1a2e',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeChipActive: {
    borderColor: '#d4a017',
    backgroundColor: '#d4a01715',
  },
  typeChipText: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#444',
    marginBottom: 2,
  },
  typeChipTextActive: {
    color: '#d4a017',
  },
  typeChipXP: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#333',
    fontWeight: 'bold',
  },
  typeChipXPActive: {
    color: '#d4a017',
  },
  // Form actions
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  formCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  formCancelText: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#555',
    letterSpacing: 1,
  },
  formConfirmBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d4a017',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  formConfirmBtnDisabled: {
    borderColor: '#1a1a2e',
  },
  formConfirmText: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#d4a017',
    letterSpacing: 1,
  },
  formConfirmTextDisabled: {
    color: '#333',
  },
  // Max reached
  maxReached: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
  },
  // Empty state
  emptyCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 6,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  emptySubtext: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#333',
  },
  // Bottom save bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#0f0f1a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
  },
  saveButton: {
    backgroundColor: '#d4a017',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#0a0a0f',
    letterSpacing: 3,
    fontWeight: 'bold',
  },
});
