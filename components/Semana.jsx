import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  getRank,
  getRankLetter,
  RANK_PHRASES,
  RANK_IMAGES,
} from '../constants/archetypes';

const HISTORY_KEY = 'history:days';
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const screenWidth = Dimensions.get('window').width;

export default function Semana({ xpToday }) {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Animations
  const barAnims = useRef([...Array(7)].map(() => new Animated.Value(0))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const shareRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // Animate bars when data loads
  useEffect(() => {
    if (loaded && !showSummary) {
      animateBars();
    }
  }, [loaded, showSummary]);

  // Animate summary when it appears
  useEffect(() => {
    if (showSummary) {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSummary]);

  const animateBars = () => {
    const animations = barAnims.map((anim, i) => {
      anim.setValue(0);
      return Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: i * 80,
        useNativeDriver: false,
      });
    });
    Animated.stagger(80, animations).start();
  };

  const loadData = async () => {
    try {
      const histRaw = await AsyncStorage.getItem(HISTORY_KEY);
      let days = [];
      if (histRaw) {
        days = JSON.parse(histRaw);
      }
      setHistory(days);
      setLoaded(true);
    } catch (e) {
      console.error('Error loading semana data:', e);
      setLoaded(true);
    }
  };

  // ── Build weekly data (always Mon→Sun) ────────

  const getWeekData = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    // Get Monday of current week (JS: 0=Sun, 1=Mon, ..., 6=Sat)
    const jsDay = today.getDay(); // 0=Sun
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const days = [];
    const orderedLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = orderedLabels[i];
      const isToday = dateStr === todayStr;
      const isFuture = d > today && !isToday;
      const histEntry = history.find((h) => h.date === dateStr);
      const xp = isToday ? xpToday : isFuture ? null : (histEntry?.xp ?? null);

      days.push({ date: dateStr, dayLabel, xp, isToday });
    }

    return days;
  };

  const weekData = loaded ? getWeekData() : [];
  const daysWithData = weekData.filter((d) => d.xp !== null && d.xp !== undefined);
  const avgXP =
    daysWithData.length > 0
      ? daysWithData.reduce((sum, d) => sum + d.xp, 0) / daysWithData.length
      : 0;
  const rank = getRank(avgXP);
  const rankLetter = getRankLetter(avgXP);
  const rankPhrase = RANK_PHRASES[rank.label] || RANK_PHRASES.Aprendiz;
  const rankImage = RANK_IMAGES[rank.label] || RANK_IMAGES.Aprendiz;

  // VER RESUMEN only available on Sunday
  const isSunday = new Date().getDay() === 0;

  // ── Share ─────────────────────────────────────

  const handleShare = async () => {
    try {
      if (!shareRef.current) return;
      const uri = await captureRef(shareRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri);
    } catch (e) {
      console.error('Error sharing:', e);
    }
  };

  if (!loaded) return null;

  const maxBarXP = 25;

  // ── Bar Chart (shared between both views) ─────

  const renderBarChart = () => (
    <View>
      <Text style={styles.sectionTitle}>ESTA SEMANA</Text>
      <View style={styles.chartContainer}>
        {weekData.map((day, i) => {
          const barHeight = day.xp != null ? (day.xp / maxBarXP) * 100 : 0;
          const hasData = day.xp != null;

          const animatedHeight = barAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${barHeight}%`],
          });

          return (
            <View key={day.date} style={styles.barCol}>
              <Text style={[styles.barValue, hasData && day.xp > 0 && { color: '#d4a017' }]}>
                {hasData ? day.xp : '—'}
              </Text>
              <View style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      height: showSummary ? `${barHeight}%` : animatedHeight,
                      backgroundColor: hasData
                        ? day.isToday
                          ? '#d4a017'
                          : '#d4a01780'
                        : '#1a1a2e',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.barLabel,
                  day.isToday && styles.barLabelToday,
                ]}
              >
                {day.dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  // ── Normal View (during the week) ─────────────

  const renderNormalView = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentInner}
    >
      {renderBarChart()}

      {/* History */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>HISTORIAL</Text>
          {history.slice(0, 14).map((entry) => {
            const pct = Math.min((entry.xp / 25) * 100, 100);
            const d = new Date(entry.date + 'T12:00:00');
            const label = `${DAY_LABELS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
            return (
              <View key={entry.date} style={styles.historyRow}>
                <Text style={styles.historyDate}>{label}</Text>
                <View style={styles.historyBarBg}>
                  <View style={[styles.historyBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.historyXP}>{entry.xp}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* VER RESUMEN button — only on Sunday */}
      {isSunday ? (
        <Pressable
          style={styles.summaryButton}
          onPress={() => setShowSummary(true)}
        >
          <Text style={styles.summaryButtonText}>VER RESUMEN</Text>
        </Pressable>
      ) : (
        <View style={styles.summaryDisabled}>
          <Text style={styles.summaryDisabledText}>
            Resumen disponible el domingo
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // ── Summary View (end of week) ────────────────

  const renderSummaryView = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentInner}
    >
      {/* Shareable card */}
      <View ref={shareRef} collapsable={false} style={styles.shareCard}>
        {/* Rank display */}
        <Animated.View
          style={[
            styles.rankBox,
            { borderColor: rank.color },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.rankLetter, { color: rank.color }]}>
            {rankLetter}
          </Text>
          <Text style={[styles.rankLabel, { color: rank.color }]}>
            {rank.label.toUpperCase()}
          </Text>
          <Text style={styles.rankAvg}>{avgXP.toFixed(1)} / 25</Text>
          <Text style={styles.rankDays}>
            {daysWithData.length} días registrados
          </Text>
        </Animated.View>

        {/* Bar chart */}
        {renderBarChart()}

        {/* Character section */}
        <Animated.View
          style={[
            styles.characterSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Character image + speech bubble */}
          <View style={styles.characterRow}>
            <Image
              source={rankImage}
              style={styles.characterImage}
              resizeMode="contain"
            />

            {/* Speech bubble */}
            <View style={styles.speechBubble}>
              <View style={styles.speechArrow} />
              <Text style={styles.speechAuthor}>Marco Aurelio.</Text>
              <Text style={styles.speechText}>{rankPhrase}</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Share button */}
      <Pressable style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>COMPARTIR</Text>
      </Pressable>

      {/* Back button */}
      <Pressable
        style={styles.backButton}
        onPress={() => setShowSummary(false)}
      >
        <Text style={styles.backButtonText}>← VOLVER</Text>
      </Pressable>
    </ScrollView>
  );

  return showSummary ? renderSummaryView() : renderNormalView();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentInner: {
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Section title ────────────────────────────
  sectionTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#444',
    letterSpacing: 2,
    marginBottom: 12,
  },

  // ── Bar chart ────────────────────────────────
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 20,
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#555',
    marginBottom: 4,
  },
  barTrack: {
    width: '80%',
    height: 100,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
  },
  barLabel: {
    fontFamily: 'ShareTechMono',
    fontSize: 9,
    color: '#555',
    marginTop: 6,
  },
  barLabelToday: {
    color: '#d4a017',
  },

  // ── History ──────────────────────────────────
  historySection: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    paddingTop: 16,
    marginBottom: 24,
  },
  historyRow: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontFamily: 'ShareTechMono',
    fontSize: 9,
    color: '#666',
    width: 55,
  },
  historyBarBg: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 2,
    height: 5,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  historyBarFill: {
    height: '100%',
    backgroundColor: '#d4a017',
    borderRadius: 2,
  },
  historyXP: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#d4a017',
    width: 24,
    textAlign: 'right',
  },

  // ── VER RESUMEN button ───────────────────────
  summaryButton: {
    borderWidth: 1,
    borderColor: '#d4a017',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  summaryButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#d4a017',
    letterSpacing: 3,
    fontWeight: 'bold',
  },

  // ── Share card ───────────────────────────────
  shareCard: {
    backgroundColor: '#0a0a0f',
    paddingVertical: 16,
  },

  // ── Rank box ─────────────────────────────────
  rankBox: {
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  rankLetter: {
    fontFamily: 'ShareTechMono',
    fontSize: 56,
    fontWeight: 'bold',
    lineHeight: 60,
  },
  rankLabel: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    letterSpacing: 4,
    marginTop: 4,
  },
  rankAvg: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  rankDays: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#444',
    marginTop: 4,
  },

  // ── Character section ────────────────────────
  characterSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 260,
  },
  characterImage: {
    width: screenWidth * 0.45,
    height: 280,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: '#f5f0e8',
    borderRadius: 12,
    padding: 14,
    marginLeft: -10,
    marginBottom: 60,
    position: 'relative',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  speechArrow: {
    position: 'absolute',
    left: -8,
    bottom: 20,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: '#f5f0e8',
    borderBottomColor: 'transparent',
    borderLeftWidth: 0,
  },
  speechAuthor: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#1a1a2e',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  speechText: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#333',
    lineHeight: 18,
  },

  // ── Share button ─────────────────────────────
  shareButton: {
    backgroundColor: '#d4a017',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#0a0a0f',
    letterSpacing: 3,
    fontWeight: 'bold',
  },

  // ── Back button ──────────────────────────────
  backButton: {
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#555',
    letterSpacing: 2,
  },

  // ── Summary disabled ─────────────────────────
  summaryDisabled: {
    borderWidth: 1,
    borderColor: '#1a1a2e',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  summaryDisabledText: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#333',
    letterSpacing: 1,
  },
});
