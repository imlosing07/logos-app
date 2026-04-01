import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import useGameData from '../../hooks/useGameData';

const DIFFICULTIES = [
  { key: 'easy', label: 'Fácil', xp: 1, color: '#22c55e' },
  { key: 'medium', label: 'Media', xp: 3, color: '#d4a017' },
  { key: 'hard', label: 'Difícil', xp: 5, color: '#e8832a' },
  { key: 'legendary', label: 'Legendaria', xp: 7, color: '#ef4444' },
];

const TASKS_KEY = 'today:tasks';
const HABITS_KEY = 'user:habits';
const HABITS_PROGRESS_KEY = 'today:habits';

const getToday = () => new Date().toISOString().split('T')[0];

export default function HoyScreen() {
  const router = useRouter();
  const { user, gameData, loading, maxDailyXP, addXP, removeXP, reload, coinMultiplier } = useGameData();

  // Task state
  const [taskName, setTaskName] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [tasks, setTasks] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  // Habits state
  const [habits, setHabits] = useState([]);
  const [habitsProgress, setHabitsProgress] = useState({});
  const [habitsLoaded, setHabitsLoaded] = useState(false);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      reload();
      loadTasks();
      loadHabits();
    }, [])
  );

  // ── Tasks ─────────────────────────────────────

  const loadTasks = async () => {
    try {
      const raw = await AsyncStorage.getItem(TASKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === getToday()) {
          setTasks(parsed.tasks || []);
        } else {
          // Día nuevo — desmarcar todas las tareas en lugar de borrarlas
          const uncompleted = (parsed.tasks || []).map(t => ({ ...t, completed: false }));
          setTasks(uncompleted);
          saveTasks(uncompleted);
        }
      }
    } catch (e) {
      console.error('Error loading tasks:', e);
    } finally {
      setTasksLoaded(true);
    }
  };

  const saveTasks = async (updatedTasks) => {
    try {
      const payload = { date: getToday(), tasks: updatedTasks };
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  };

  const handleAddTask = () => {
    const name = taskName.trim();
    if (!name) return;

    const diff = DIFFICULTIES.find((d) => d.key === selectedDifficulty);
    const newTask = {
      id: Date.now().toString(),
      name,
      difficulty: diff.key,
      xp: diff.xp,
      completed: false,
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
    setTaskName('');
    Keyboard.dismiss();
  };

  const handleQuickAdd = (name) => {
    const diff = DIFFICULTIES.find((d) => d.key === 'medium');
    const newTask = {
      id: Date.now().toString(),
      name,
      difficulty: diff.key,
      xp: diff.xp,
      completed: false,
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      // Marking as completed → add XP
      addXP(task.xp);
    } else {
      // Unmarking → subtract XP
      removeXP(task.xp);
    }

    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    saveTasks(updated);
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task?.completed) {
      removeXP(task.xp);
    }
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTasks(updated);
  };

  const getDifficultyColor = (key) => {
    return DIFFICULTIES.find((d) => d.key === key)?.color || '#555';
  };

  // ── Habits ────────────────────────────────────

  const loadHabits = async () => {
    try {
      const [habitsRaw, progressRaw] = await Promise.all([
        AsyncStorage.getItem(HABITS_KEY),
        AsyncStorage.getItem(HABITS_PROGRESS_KEY),
      ]);

      if (habitsRaw) {
        setHabits(JSON.parse(habitsRaw));
      } else {
        setHabits([]);
      }

      if (progressRaw) {
        const parsed = JSON.parse(progressRaw);
        if (parsed.date === getToday()) {
          setHabitsProgress(parsed.progress || {});
        } else {
          // New day — reset all habits progress (counters to 0, toggles unmarked)
          await AsyncStorage.removeItem(HABITS_PROGRESS_KEY);
          setHabitsProgress({});
        }
      } else {
        setHabitsProgress({});
      }
    } catch (e) {
      console.error('Error loading habits:', e);
    } finally {
      setHabitsLoaded(true);
    }
  };

  const saveHabitsProgress = async (updatedProgress) => {
    try {
      const payload = { date: getToday(), progress: updatedProgress };
      await AsyncStorage.setItem(HABITS_PROGRESS_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving habits progress:', e);
    }
  };

  const handleToggleHabit = (habitId) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const current = habitsProgress[habitId];
    const wasCompleted = current?.completed || false;
    const nowCompleted = !wasCompleted;

    if (nowCompleted && !wasCompleted) {
      addXP(habit.xp);
    } else if (!nowCompleted && wasCompleted) {
      removeXP(habit.xp);
    }

    const updated = {
      ...habitsProgress,
      [habitId]: { completed: nowCompleted, value: nowCompleted ? 1 : 0 },
    };
    setHabitsProgress(updated);
    saveHabitsProgress(updated);
  };

  const handleCounterIncrement = (habitId) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const current = habitsProgress[habitId] || { value: 0, completed: false };
    if (current.value >= habit.goal) return;

    const newValue = current.value + 1;
    const justCompleted = newValue >= habit.goal && !current.completed;

    if (justCompleted) {
      addXP(habit.xp);
    }

    const updated = {
      ...habitsProgress,
      [habitId]: { value: newValue, completed: newValue >= habit.goal },
    };
    setHabitsProgress(updated);
    saveHabitsProgress(updated);
  };

  const handleCounterDecrement = (habitId) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const current = habitsProgress[habitId] || { value: 0, completed: false };
    if (current.value <= 0) return;

    const newValue = current.value - 1;
    
    // Si estaba completado y lo bajamos, restamos XP
    if (current.completed) {
      removeXP(habit.xp);
    }

    const updated = {
      ...habitsProgress,
      [habitId]: { value: newValue, completed: false },
    };
    setHabitsProgress(updated);
    saveHabitsProgress(updated);
  };

  const isAtCap = gameData.xpToday >= maxDailyXP;

  // ── Render ────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        userName={user?.name}
        coins={gameData.coins}
        xpToday={gameData.xpToday}
        maxXP={maxDailyXP}
        coinMultiplier={coinMultiplier}
      />
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentInner}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>TAREAS</Text>

        {/* Task Form */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.taskInput}
            value={taskName}
            onChangeText={setTaskName}
            placeholder="Nombre de la tarea..."
            placeholderTextColor="#333"
            maxLength={40}
          />
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((diff) => {
              const isSelected = selectedDifficulty === diff.key;
              return (
                <Pressable
                  key={diff.key}
                  style={[
                    styles.diffChip,
                    {
                      borderColor: isSelected ? diff.color : '#1a1a2e',
                      backgroundColor: isSelected ? diff.color + '15' : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedDifficulty(diff.key)}
                >
                  <Text style={[styles.diffChipText, { color: isSelected ? diff.color : '#444' }]}>
                    {diff.label}
                  </Text>
                  <Text style={[styles.diffChipXP, { color: isSelected ? diff.color : '#333' }]}>
                    +{diff.xp}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Quick task chips */}
          <View style={styles.chipsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
              {[
                "Leer 30 min",
                "Ejercicio",
                "Meditar",
                "Estudiar",
                "Dormir temprano",
                "Sin redes sociales",
                "Cocinar",
                "Caminar 30 min"
              ].map((name) => (
                <Pressable
                  key={name}
                  style={styles.quickChip}
                  onPress={() => handleQuickAdd(name)}
                >
                  <Text style={styles.quickChipText}>{name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Pressable
            style={[styles.addButton, !taskName.trim() && styles.addButtonDisabled]}
            onPress={handleAddTask}
            disabled={!taskName.trim()}
          >
            <Text style={[styles.addButtonText, !taskName.trim() && styles.addButtonTextDisabled]}>
              + AGREGAR TAREA
            </Text>
          </Pressable>
        </View>

        {/* Task List */}
        {tasksLoaded && tasks.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sin tareas aún</Text>
            <Text style={styles.emptySubtext}>Agregá una tarea arriba</Text>
          </View>
        )}
        {tasksLoaded && tasks.map((task) => {
          const diffColor = getDifficultyColor(task.difficulty);
          return (
            <View
              key={task.id}
              style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
            >
              <Pressable style={styles.taskLeft} onPress={() => handleToggleTask(task.id)}>
                <View
                  style={[
                    styles.checkbox,
                    task.completed && { backgroundColor: '#22c55e', borderColor: '#22c55e' },
                    !task.completed && { borderColor: '#444' },
                  ]}
                >
                  {task.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.taskName, task.completed && styles.taskNameCompleted]}>
                  {task.name}
                </Text>
              </Pressable>
              <View style={styles.taskRight}>
                <Text style={[styles.taskXP, { color: diffColor }]}>+{task.xp}</Text>
                <Pressable style={styles.deleteButton} onPress={() => handleDeleteTask(task.id)} hitSlop={8}>
                  <Text style={styles.deleteText}>✕</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Habits Section */}
        {habitsLoaded && (
          <>
            <Text style={styles.sectionTitle}>HÁBITOS</Text>
            {habits.length === 0 && (
              <Pressable style={styles.emptyCard} onPress={() => router.push('/config')}>
                <Text style={styles.emptyText}>Sin hábitos configurados</Text>
                <Text style={styles.emptySubtext}>Tocá aquí para crear tus hábitos</Text>
              </Pressable>
            )}
            {habits.map((habit) => {
              const progress = habitsProgress[habit.id] || { value: 0, completed: false };

              if (habit.type === 'counter') {
                const isCompleted = progress.completed;
                const value = progress.value || 0;
                const percent = Math.min((value / habit.goal) * 100, 100);
                return (
                  <View key={habit.id} style={[styles.habitCard, isCompleted && styles.habitCardCompleted]}>
                    <View style={styles.habitCounterTop}>
                      <View style={styles.habitLeft}>
                        <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
                          {habit.name}
                        </Text>
                        <Text style={styles.habitXP}>+{habit.xp} XP al completar</Text>
                      </View>
                      <Text style={[styles.counterValue, isCompleted && styles.counterValueCompleted]}>
                        {value}/{habit.goal}
                      </Text>
                    </View>
                    <View style={styles.counterBarBg}>
                      <View style={[styles.counterBarFill, { width: `${percent}%` }, isCompleted && styles.counterBarFillDone]} />
                    </View>
                    <View style={styles.counterActions}>
                      <Pressable
                        style={[styles.counterBtn, value <= 0 && styles.counterBtnDisabled]}
                        onPress={() => handleCounterDecrement(habit.id)}
                        disabled={value <= 0}
                      >
                        <Text style={[styles.counterBtnText, value <= 0 && styles.counterBtnTextDisabled]}>−</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.counterBtn, styles.counterBtnPlus, value >= habit.goal && styles.counterBtnDisabled]}
                        onPress={() => handleCounterIncrement(habit.id)}
                        disabled={value >= habit.goal}
                      >
                        <Text style={[styles.counterBtnText, styles.counterBtnPlusText, value >= habit.goal && styles.counterBtnTextDisabled]}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              }

              // Toggle habit
              const isCompleted = progress.completed;
              return (
                <View key={habit.id} style={[styles.habitCard, isCompleted && styles.habitCardCompleted]}>
                  <View style={styles.habitLeft}>
                    <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
                      {habit.name}
                    </Text>
                    <Text style={styles.habitXP}>+{habit.xp} XP</Text>
                  </View>
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[styles.toggleBtn, isCompleted && styles.toggleBtnYes]}
                      onPress={() => handleToggleHabit(habit.id)}
                    >
                      <Text style={[styles.toggleBtnText, isCompleted && styles.toggleBtnTextYes]}>SÍ</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.toggleBtn,
                        !isCompleted && progress.value !== undefined && progress.completed === false && progress.value === 0
                          ? styles.toggleBtnNo
                          : null,
                      ]}
                      onPress={() => { if (isCompleted) handleToggleHabit(habit.id); }}
                    >
                      <Text style={[styles.toggleBtnText, !isCompleted ? styles.toggleBtnTextNo : null]}>NO</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {isAtCap && (
          <View style={styles.capBanner}>
            <Text style={styles.capText}>
              ⚡ TOPE ALCANZADO — Las tareas siguen pero no suman monedas
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#555',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabContentInner: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#444',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 16,
  },

  // ── Task form ────────────────────────────────
  formContainer: {
    marginBottom: 16,
  },
  taskInput: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#e0e0e0',
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  diffChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  diffChipText: {
    fontFamily: 'ShareTechMono',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  diffChipXP: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    fontWeight: 'bold',
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#d4a017',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    borderColor: '#1a1a2e',
  },
  addButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#d4a017',
    letterSpacing: 2,
  },
  addButtonTextDisabled: {
    color: '#333',
  },

  // ── Task cards ───────────────────────────────
  taskCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardCompleted: {
    backgroundColor: '#0a1a0a',
    borderColor: '#22c55e30',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: -1,
  },
  taskName: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#c8bfa0',
    flexShrink: 1,
  },
  taskNameCompleted: {
    color: '#22c55e',
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskXP: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#444',
  },

  // ── Cap banner ───────────────────────────────
  capBanner: {
    backgroundColor: '#1a140a',
    borderWidth: 1,
    borderColor: '#d4a01740',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  capText: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#d4a017',
    textAlign: 'center',
    lineHeight: 16,
  },

  // ── Habit cards ──────────────────────────────
  habitCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  habitCardCompleted: {
    backgroundColor: '#0a1a0a',
    borderColor: '#22c55e30',
  },
  habitLeft: {
    flex: 1,
  },
  habitName: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#c8bfa0',
    marginBottom: 2,
  },
  habitNameCompleted: {
    color: '#22c55e',
  },
  habitXP: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#555',
  },

  // Toggle habit
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleBtnYes: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e20',
  },
  toggleBtnNo: {
    borderColor: '#ef4444',
    backgroundColor: '#ef444420',
  },
  toggleBtnText: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#444',
    letterSpacing: 2,
  },
  toggleBtnTextYes: {
    color: '#22c55e',
  },
  toggleBtnTextNo: {
    color: '#ef4444',
  },

  // Counter habit
  habitCounterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterValue: {
    fontFamily: 'ShareTechMono',
    fontSize: 16,
    color: '#d4a017',
    fontWeight: 'bold',
  },
  counterValueCompleted: {
    color: '#22c55e',
  },
  counterBarBg: {
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    height: 5,
    marginTop: 10,
    overflow: 'hidden',
  },
  counterBarFill: {
    height: '100%',
    backgroundColor: '#d4a017',
    borderRadius: 3,
  },
  counterBarFillDone: {
    backgroundColor: '#22c55e',
  },
  counterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  counterBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  counterBtnPlus: {
    borderColor: '#d4a017',
    backgroundColor: '#d4a01710',
  },
  counterBtnDisabled: {
    borderColor: '#1a1a2e',
    backgroundColor: 'transparent',
  },
  counterBtnText: {
    fontFamily: 'ShareTechMono',
    fontSize: 18,
    color: '#555',
  },
  counterBtnPlusText: {
    color: '#d4a017',
  },
  counterBtnTextDisabled: {
    color: '#222',
  },

  // ── Empty ────────────────────────────────────
  emptyCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 6,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
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

  // ── Suggested Tasks Chips ────────────────────
  chipsWrapper: {
    marginTop: 12,
    marginBottom: 8,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 20,
  },
  quickChip: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickChipText: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#888',
    letterSpacing: 1,
  },
});
