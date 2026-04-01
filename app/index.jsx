import { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stoicQuotes } from '../constants/stoicQuotes';

const { width, height } = Dimensions.get('window');

export default function IntroScreen() {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const glowOpacity = useRef(new Animated.Value(0.15)).current;

  // Pick a random quote on mount
  const randomQuote = useMemo(() => {
    const index = Math.floor(Math.random() * stoicQuotes.length);
    return stoicQuotes[index];
  }, []);

  useEffect(() => {
    // Pulsing circle animation — infinite loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow opacity animation for the circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.35,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.1,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in content
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = async () => {
    try {
      const userData = await AsyncStorage.getItem('logos_user');
      if (!userData) {
        router.replace('/onboarding');
        return;
      }
      const tutorialDone = await AsyncStorage.getItem('tutorial:done');
      if (!tutorialDone) {
        router.replace('/tutorial');
        return;
      }
      router.replace('/(tabs)/hoy');
    } catch {
      router.replace('/onboarding');
    }
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {/* Pulsing circle background */}
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circleOuter,
            {
              transform: [{ scale: pulseAnim }],
              opacity: glowOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circleInner,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        {/* LOGOS title */}
        <Text style={styles.logoTitle}>L O G O S</Text>

        {/* Quote */}
        <Text style={styles.quote}>"{randomQuote.quote}"</Text>

        {/* Author */}
        <Text style={styles.author}>— {randomQuote.author}</Text>
      </Animated.View>

      {/* Bottom hint */}
      <Animated.View style={[styles.hintContainer, { opacity: fadeIn }]}>
        <Text style={styles.hint}>TOCA PARA CONTINUAR</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  circleContainer: {
    position: 'absolute',
    top: height * 0.22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#d4a017',
  },
  circleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#d4a017',
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.12,
    maxWidth: 340,
  },
  logoTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 18,
    color: '#555',
    letterSpacing: 8,
    marginBottom: 48,
  },
  quote: {
    fontFamily: 'ShareTechMono',
    fontSize: 20,
    color: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
  },
  author: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#d4a017',
    textAlign: 'center',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 60,
  },
  hint: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#333',
    letterSpacing: 4,
  },
});
