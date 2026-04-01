import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Alert,
  ToastAndroid,
  Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Path } from 'react-native-svg';
import { ARCHETYPES } from '../../constants/archetypes';
import useGameData from '../../hooks/useGameData';

const HISTORY_KEY = 'history:days';
const ARCHETYPE_KEY = 'user:archetype';
const GAME_KEY = 'logos_game';
const SHIELDS_KEY = 'streak:shields';
const DEV_MODE_KEY = 'dev:mode';
const PROFILE_PIC_KEY = 'user:profilePic';
const START_DATE_KEY = 'user:startDate';
const XP_TOTAL_KEY = 'user:xpTotal';

// ── Toast helper ────────────────────────────────
function showToast(msg) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
}

// ── Dynamic Shield Component ────────────────────
const DynamicShield = ({ streak, level, achievements }) => {
  let shieldColor = '#4a4a4a';
  if (streak >= 30) shieldColor = '#d4a017';
  else if (streak >= 21) shieldColor = '#8e44ad';
  else if (streak >= 14) shieldColor = '#2980b9';
  else if (streak >= 7) shieldColor = '#27ae60';

  let emblem = null;
  if (level >= 21) emblem = '⭐';
  else if (level >= 11) emblem = '👑';
  else if (level >= 6) emblem = '🛡️';
  else emblem = '⚔️';

  return (
    <View style={styles.shieldContainer}>
      <View style={[styles.shieldBase, { borderColor: shieldColor }]}>
        <Svg width="120" height="140" viewBox="0 0 120 140">
          <Path
            d="M60 10 L110 30 V70 C110 110 60 130 60 130 C60 130 10 110 10 70 V30 L60 10 Z"
            fill="#1a1a2e"
            stroke={shieldColor}
            strokeWidth="3"
          />
        </Svg>
        <View style={styles.emblemOverlay}>
          <Text style={styles.emblemText}>{emblem}</Text>
        </View>

        {achievements.map((ach, idx) => (
          <View
            key={idx}
            style={[
              styles.badgeSmall,
              {
                transform: [
                  { rotate: `${(360 / Math.max(achievements.length, 1)) * idx}deg` },
                  { translateY: -65 },
                ],
              },
            ]}
          >
            <Text style={{ fontSize: 12 }}>{ach.icon}</Text>
          </View>
        ))}
      </View>
      <View style={styles.shieldInfo}>
        <Text style={[styles.shieldRankName, { color: shieldColor }]}>
          {streak >= 30 ? 'LEYENDA' : streak >= 21 ? 'ELITE' : streak >= 14 ? 'VETERANO' : streak >= 7 ? 'GUERRERO' : 'APRENDIZ'}
        </Text>
      </View>
    </View>
  );
};

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { levelInfo, xpTotal, coinMultiplier, reload, lastLeveledUp, dismissLevelUp } = useGameData();

  const [userName, setUserName] = useState('');
  const [archetype, setArchetype] = useState(null);
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [shields, setShields] = useState(0);
  const [profilePic, setProfilePic] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // ── Dev Mode ──────────────────────────────────
  const [devMode, setDevMode] = useState(false);
  const [devPanelVisible, setDevPanelVisible] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const tapTimestamps = useRef([]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
      checkDevMode();
    }, [])
  );

  const checkDevMode = async () => {
    const val = await AsyncStorage.getItem(DEV_MODE_KEY);
    setDevMode(val === 'true');
  };

  const loadProfileData = async () => {
    try {
      const [userDataRaw, archKey, histRaw, gameRaw, shieldsRaw, picUri] = await Promise.all([
        AsyncStorage.getItem('logos_user'),
        AsyncStorage.getItem(ARCHETYPE_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(GAME_KEY),
        AsyncStorage.getItem(SHIELDS_KEY),
        AsyncStorage.getItem(PROFILE_PIC_KEY),
      ]);

      if (userDataRaw) {
        const u = JSON.parse(userDataRaw);
        setUserName(u.name || '');
      }

      if (archKey) {
        const found = ARCHETYPES.find((a) => a.key === archKey);
        setArchetype(found || null);
      }

      const shieldCount = shieldsRaw ? parseInt(shieldsRaw, 10) : 0;
      setShields(isNaN(shieldCount) ? 0 : shieldCount);

      const history = histRaw ? JSON.parse(histRaw) : [];
      const gameData = gameRaw ? JSON.parse(gameRaw) : null;

      const calculatedStreak = computeStreak(history, gameData, shieldCount);
      setStreak(calculatedStreak);
      setTotalDays(history.length + (gameData?.xpToday > 0 ? 1 : 0));
      setProfilePic(picUri);

      setLoaded(true);
    } catch (e) {
      console.error('Error loading profile data:', e);
      setLoaded(true);
    }
  };

  const computeStreak = (history, gameData, availableShields) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const activeDates = new Set();
    history.forEach((entry) => { if (entry.xp > 0) activeDates.add(entry.date); });
    if (gameData?.currentDate === todayStr && gameData?.xpToday > 0) activeDates.add(todayStr);

    let streakCount = 0;
    let shieldsLeft = availableShields;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) streakCount++;
      else if (shieldsLeft > 0) { shieldsLeft--; streakCount++; }
      else break;
    }
    return streakCount;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Use array instead of deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const filename = "profile_" + Date.now() + ".jpg";
        const newPath = FileSystem.documentDirectory + filename;

        // Use core FileSystem.copyAsync as normal (the warning is just a warning, it still works in SDK 55)
        // But let's try to be as robust as possible.
        await FileSystem.copyAsync({ from: uri, to: newPath });
        await AsyncStorage.setItem(PROFILE_PIC_KEY, newPath);
        setProfilePic(newPath);
      }
    } catch (e) {
      console.error(e);
      showToast('Error al elegir imagen: ' + e.message);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAchievements = () => {
    const list = [];
    if (streak >= 1) list.push({ icon: '🔥' });
    if (streak >= 7) list.push({ icon: '⚔️' });
    if (levelInfo.level >= 5) list.push({ icon: '🏆' });
    if (levelInfo.level >= 10) list.push({ icon: '💎' });
    if (totalDays >= 30) list.push({ icon: '⏳' });
    return list;
  };

  // ── Dev Actions ───────────────────────────────

  const handleSimDay = async () => {
    try {
      const gameRaw = await AsyncStorage.getItem(GAME_KEY);
      const game = gameRaw ? JSON.parse(gameRaw) : null;
      if (!game) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const histRaw = await AsyncStorage.getItem(HISTORY_KEY);
      let history = histRaw ? JSON.parse(histRaw) : [];
      if (!history.some((d) => d.date === yesterdayStr)) {
        history.push({ date: yesterdayStr, xp: game.xpToday });
      }
      history.sort((a, b) => b.date.localeCompare(a.date));
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 60)));

      const updatedGame = {
        ...game,
        xpToday: 0,
        currentDate: yesterdayStr,
        totalDays: (game.totalDays || 0) + 1,
      };
      await AsyncStorage.setItem(GAME_KEY, JSON.stringify(updatedGame));

      // Update tasks/habits dates to yesterday to trigger reset
      const TASKS_KEY = 'today:tasks';
      const HABITS_PROG_KEY = 'today:habits_progress'; // Correction: it was today:habits previously
      
      const tasksRaw = await AsyncStorage.getItem(TASKS_KEY);
      if (tasksRaw) {
        const d = JSON.parse(tasksRaw);
        d.date = yesterdayStr;
        await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(d));
      }
      const habitsRaw = await AsyncStorage.getItem(HABITS_PROG_KEY);
      if (habitsRaw) {
        const d = JSON.parse(habitsRaw);
        d.date = yesterdayStr;
        await AsyncStorage.setItem(HABITS_PROG_KEY, JSON.stringify(d));
      }

      showToast('Día simulado: Todo listo para el reinicio');
      reload();
      loadProfileData();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      showToast('Error: ' + e.message);
    }
  };

  const handleForceLevel = async () => {
    const level = parseInt(levelInput, 10);
    if (isNaN(level) || level < 1) return;
    const requiredXp = 100 * (level - 1) * (level - 1);
    await AsyncStorage.setItem(XP_TOTAL_KEY, String(requiredXp));
    showToast(`Nivel forzado a ${level}`);
    setLevelInput('');
    reload();
    loadProfileData();
  };

  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        onPress={() => {
          const now = Date.now();
          tapTimestamps.current.push(now);
          tapTimestamps.current = tapTimestamps.current.filter(t => now - t < 3000);
          if (tapTimestamps.current.length >= 5) {
            tapTimestamps.current = [];
            setDevPanelVisible(true);
          }
        }}
      >
        <Text style={styles.headerTitle}>PERFIL</Text>
      </Pressable>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarWrapper} onPress={pickImage}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(userName)}</Text>
              </View>
            )}
            <View style={styles.editBadge}><Text style={{ fontSize: 10 }}>📷</Text></View>
          </Pressable>
          <Text style={styles.userNameText}>{userName || 'Iniciado'}</Text>
          <Text style={styles.userTitleText}>{archetype?.name || 'LOGOS'}</Text>
        </View>

        <View style={styles.shieldSection}>
          <DynamicShield streak={streak} level={levelInfo.level} achievements={getAchievements()} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniEmoji}>🔥</Text>
            <Text style={styles.statMiniValue}>{streak}</Text>
            <Text style={styles.statMiniLabel}>RACHA</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniEmoji}>📅</Text>
            <Text style={styles.statMiniValue}>{totalDays}</Text>
            <Text style={styles.statMiniLabel}>DÍAS</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniEmoji}>🛡️</Text>
            <Text style={styles.statMiniValue}>{shields}</Text>
            <Text style={styles.statMiniLabel}>ESCUDOS</Text>
          </View>
        </View>

        <View style={styles.levelModule}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTag}>NIVEL {levelInfo.level}</Text>
            <Text style={styles.levelXPText}>{Math.floor(levelInfo.xpProgress)} / {levelInfo.xpNeeded} XP</Text>
          </View>
          <View style={styles.levelBarBg}>
            <View style={[styles.levelBarFill, { width: `${Math.min((levelInfo.xpProgress / levelInfo.xpNeeded) * 100, 100)}%` }]} />
          </View>
        </View>

        <Pressable style={styles.actionBtn} onPress={() => router.push('/config')}>
          <Text style={styles.actionBtnText}>⚙️  CONFIGURACIÓN</Text>
        </Pressable>

        {devMode && (
          <Pressable style={styles.devBtn} onPress={() => setDevPanelVisible(true)}>
            <Text style={styles.devBtnText}>🛠  MODO DEVELOPER</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={!!lastLeveledUp} transparent animationType="fade" onRequestClose={dismissLevelUp}>
        <View style={styles.levelUpOverlay}>
          <View style={styles.levelUpBox}>
            <Text style={styles.levelUpEmoji}>🎊</Text>
            <Text style={styles.levelUpTitle}>¡NIVEL {lastLeveledUp} ALCANZADO!</Text>
            <View style={styles.levelUpReward}>
              <Text style={styles.rewardIcon}>🛡️</Text>
              <Text style={styles.rewardText}>+1 Protector de racha obtenido</Text>
            </View>
            <Pressable style={styles.levelUpClose} onPress={dismissLevelUp}>
              <Text style={styles.levelUpCloseText}>CONTINUAR</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Full Dev Panel Modal */}
      <Modal visible={devPanelVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setDevPanelVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setDevPanelVisible(false)} />
          <View style={[styles.devSheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.devSheetTitle}>HERRAMIENTAS DEV</Text>
            
            <Pressable style={styles.devSheetBtn} onPress={handleSimDay}>
              <Text style={styles.devSheetBtnText}>⏩ SIMULAR PASO DE DÍA</Text>
              <Text style={styles.devSheetBtnHint}>Cierra hoy y fuerza el reinicio</Text>
            </Pressable>

            <View style={styles.devSheetRow}>
              <TextInput
                style={styles.devSheetInput}
                placeholder="Nivel (ej: 10)"
                placeholderTextColor="#444"
                keyboardType="numeric"
                value={levelInput}
                onChangeText={setLevelInput}
              />
              <Pressable style={styles.devSheetInputBtn} onPress={handleForceLevel}>
                <Text style={styles.devSheetInputBtnText}>FORZAR NIVEL</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.devSheetBtn, { marginTop: 20 }]} onPress={async () => {
              Alert.alert('RESET', '¿Borrar todo?', [
                { text: 'NO' },
                { text: 'SÍ', onPress: async () => { await AsyncStorage.clear(); router.replace('/onboarding'); } }
              ]);
            }}>
              <Text style={{ color: '#ff4444', fontFamily: 'ShareTechMono' }}>🔥 WIPE DATA & RESET</Text>
            </Pressable>

            <Pressable style={styles.devSheetClose} onPress={() => setDevPanelVisible(false)}>
              <Text style={styles.devSheetCloseText}>CERRAR</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { backgroundColor: '#0f0f1a', borderBottomWidth: 1, borderBottomColor: '#1a1a2e', paddingBottom: 14, alignItems: 'center' },
  headerTitle: { fontFamily: 'ShareTechMono', fontSize: 14, color: '#333', letterSpacing: 4 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 24, alignItems: 'center', paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0f0f1a', borderWidth: 2, borderColor: '#d4a017', justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontFamily: 'ShareTechMono', fontSize: 32, color: '#d4a017', fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#d4a017', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0a0a0f' },
  userNameText: { fontFamily: 'ShareTechMono', fontSize: 22, color: '#e0e0e0', fontWeight: 'bold' },
  userTitleText: { fontFamily: 'ShareTechMono', fontSize: 11, color: '#d4a017', letterSpacing: 2, textTransform: 'uppercase' },
  shieldSection: { marginBottom: 30, alignItems: 'center' },
  shieldContainer: { position: 'relative', alignItems: 'center' },
  shieldBase: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  emblemOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  emblemText: { fontSize: 40 },
  badgeSmall: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: 'rgba(212,160,23,0.3)', justifyContent: 'center', alignItems: 'center' },
  shieldInfo: { marginTop: 10, alignItems: 'center' },
  shieldRankName: { fontFamily: 'ShareTechMono', fontSize: 14, fontWeight: 'bold', letterSpacing: 3 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statMiniCard: { flex: 1, backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: '#1a1a2e', borderRadius: 10, paddingVertical: 12, alignItems: 'center', minWidth: 90 },
  statMiniEmoji: { fontSize: 18, marginBottom: 4 },
  statMiniValue: { fontFamily: 'ShareTechMono', fontSize: 20, color: '#d4a017', fontWeight: 'bold' },
  statMiniLabel: { fontFamily: 'ShareTechMono', fontSize: 8, color: '#555', letterSpacing: 1 },
  levelModule: { width: '100%', backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: '#111', borderRadius: 12, padding: 16, marginBottom: 20 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  levelTag: { fontFamily: 'ShareTechMono', fontSize: 14, color: '#d4a017', fontWeight: 'bold' },
  levelXPText: { fontFamily: 'ShareTechMono', fontSize: 11, color: '#666' },
  levelBarBg: { height: 6, backgroundColor: '#1a1a2e', borderRadius: 3, overflow: 'hidden' },
  levelBarFill: { height: '100%', backgroundColor: '#d4a017' },
  actionBtn: { width: '100%', backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#d4a01740', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { fontFamily: 'ShareTechMono', fontSize: 12, color: '#d4a017', letterSpacing: 2 },
  devBtn: { marginTop: 20, padding: 10 },
  devBtnText: { fontFamily: 'ShareTechMono', fontSize: 10, color: '#333', letterSpacing: 2 },
  levelUpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  levelUpBox: { width: '100%', backgroundColor: '#0f0f1a', borderWidth: 2, borderColor: '#d4a017', borderRadius: 20, padding: 30, alignItems: 'center' },
  levelUpEmoji: { fontSize: 60, marginBottom: 20 },
  levelUpTitle: { fontFamily: 'ShareTechMono', fontSize: 24, color: '#d4a017', textAlign: 'center', fontWeight: 'bold', marginBottom: 24 },
  levelUpReward: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d4a01720', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#d4a01740', marginBottom: 30, gap: 12 },
  rewardIcon: { fontSize: 30 },
  rewardText: { fontFamily: 'ShareTechMono', fontSize: 14, color: '#d4a017', flexShrink: 1 },
  levelUpClose: { backgroundColor: '#d4a017', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 8 },
  levelUpCloseText: { fontFamily: 'ShareTechMono', fontSize: 14, color: '#0a0a0f', fontWeight: 'bold', letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  devSheet: { backgroundColor: '#0f0f1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 16 },
  devSheetTitle: { fontFamily: 'ShareTechMono', fontSize: 16, color: '#d4a017', marginBottom: 4 },
  devSheetBtn: { padding: 16, borderWidth: 1, borderColor: '#222', borderRadius: 8, backgroundColor: '#1a1a2e' },
  devSheetBtnText: { fontFamily: 'ShareTechMono', color: '#fff', fontSize: 14 },
  devSheetBtnHint: { fontFamily: 'ShareTechMono', color: '#555', fontSize: 10, marginTop: 4 },
  devSheetRow: { flexDirection: 'row', gap: 10 },
  devSheetInput: { flex: 1, backgroundColor: '#0a0a0f', borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 12, color: '#fff', fontFamily: 'ShareTechMono' },
  devSheetInputBtn: { backgroundColor: '#d4a017', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  devSheetInputBtnText: { fontFamily: 'ShareTechMono', color: '#000', fontSize: 12, fontWeight: 'bold' },
  devSheetClose: { marginTop: 10, padding: 10, alignItems: 'center' },
  devSheetCloseText: { fontFamily: 'ShareTechMono', color: '#555', fontSize: 12 }
});
