import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ── SVG Icons for each slide ────────────────────

const IconSwords = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 2L14 12" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 8L8 10" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" />
    <Path d="M3 21L7 17" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" />
    <Path d="M5 19L7 17" stroke="#d4a017" strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M20 2L10 12" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" />
    <Path d="M14 8L16 10" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" />
    <Path d="M21 21L17 17" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" />
    <Path d="M19 19L17 17" stroke="#d4a017" strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const IconCheck = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#d4a017" strokeWidth={2} />
    <Path d="M8 12L11 15L16 9" stroke="#d4a017" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconFire = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C12 2 8 8 8 12C8 16 10 18 12 20C14 18 16 16 16 12C16 8 12 2 12 2Z"
      stroke="#d4a017"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Path
      d="M12 14C12 14 10.5 16 10.5 17.5C10.5 18.88 11.12 20 12 20C12.88 20 13.5 18.88 13.5 17.5C13.5 16 12 14 12 14Z"
      stroke="#d4a017"
      strokeWidth={1.5}
      strokeLinejoin="round"
      opacity={0.7}
    />
  </Svg>
);

const IconCoin = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#d4a017" strokeWidth={2} />
    <Circle cx="12" cy="12" r="6.5" stroke="#d4a017" strokeWidth={1} opacity={0.5} />
    <Path d="M12 6V18" stroke="#d4a017" strokeWidth={1.5} strokeLinecap="round" />
    <Path
      d="M15 9.5C15 8.12 13.66 7 12 7C10.34 7 9 8.12 9 9.5C9 10.88 10.34 12 12 12C13.66 12 15 13.12 15 14.5C15 15.88 13.66 17 12 17C10.34 17 9 15.88 9 14.5"
      stroke="#d4a017"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const IconShield = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L4 6V12C4 16.42 7.36 20.54 12 22C16.64 20.54 20 16.42 20 12V6L12 2Z"
      stroke="#d4a017"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Path d="M8 12L11 15L16 9" stroke="#d4a017" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
  </Svg>
);

// ── Slide Data ──────────────────────────────────

const SLIDES = [
  {
    icon: IconSwords,
    title: 'Bienvenido a LOGOS',
    body: 'Tu sistema de control personal.\nCada día es una batalla.\nCada tarea, una victoria.',
  },
  {
    icon: IconCheck,
    title: 'Crea tus tareas del día',
    body: 'Fácil +1, Media +3, Difícil +5,\nLegendaria +7.\nMáximo 25 XP por día.\nLas monedas que ganes\nson tuyas para gastar.',
  },
  {
    icon: IconFire,
    title: 'Define tus hábitos',
    body: 'Agua, meditación, control\nde impulsos. Vos elegís qué\nquerés mejorar. Cada hábito\ncumplido suma XP.',
  },
  {
    icon: IconCoin,
    title: 'Ganá y gastá con intención',
    body: 'Tus monedas se gastan en\nrecompensas que vos definís.\nVer YouTube, salir a comer,\nlo que sea. Primero el trabajo,\ndespués el premio.',
  },
  {
    icon: IconShield,
    title: 'Tu mentor te evalúa\ncada semana',
    body: 'El domingo cerrás la semana.\nTu arquetipo analiza tu\ndesempeño y te da su veredicto.\n¿Estás listo?',
    isFinal: true,
  },
];

// ── Tutorial Screen ─────────────────────────────

export default function TutorialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const handleComplete = async () => {
    await AsyncStorage.setItem('tutorial:done', 'true');
    router.replace('/(tabs)/hoy');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }) => {
    const Icon = item.icon;
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow} />
          <Icon size={80} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideBody}>{item.body}</Text>
        {item.isFinal && (
          <Pressable style={styles.startButton} onPress={handleComplete}>
            <Text style={styles.startButtonText}>COMENZAR MI CAMINO</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip button (not on last slide) */}
      {currentIndex < SLIDES.length - 1 && (
        <Pressable style={styles.skipBtn} onPress={handleComplete}>
          <Text style={styles.skipText}>SALTAR</Text>
        </Pressable>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      />

      {/* Dot indicators */}
      <View style={styles.pagination}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: dotWidth, opacity: dotOpacity },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#444',
    letterSpacing: 2,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d4a017',
    opacity: 0.06,
  },
  slideTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 22,
    color: '#e2d9c5',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 30,
    letterSpacing: 1,
  },
  slideBody: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.5,
    maxWidth: 300,
  },
  startButton: {
    marginTop: 48,
    backgroundColor: '#d4a017',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
  },
  startButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#0a0a0f',
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 8,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d4a017',
  },
});
