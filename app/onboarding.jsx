import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ARCHETYPES } from '../constants/archetypes';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = name/age, 2 = archetype

  // Step 1
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  // Step 2
  const [selectedArchetype, setSelectedArchetype] = useState(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const fadeStep2 = useRef(new Animated.Value(0)).current;

  useState(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
  });

  const animateToStep2 = () => {
    fadeIn.setValue(0);
    setStep(2);
    Animated.timing(fadeStep2, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  // Step 1 → Validate and go to archetype selection
  const handleNext = () => {
    const trimmedName = name.trim();
    const trimmedAge = age.trim();

    if (!trimmedName || !trimmedAge) {
      setError('Completá ambos campos');
      return;
    }

    const ageNum = parseInt(trimmedAge, 10);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
      setError('Ingresá una edad válida');
      return;
    }

    animateToStep2();
  };

  // Step 2 → Save everything and navigate
  const handleConfirm = async () => {
    if (!selectedArchetype) return;

    try {
      const userData = {
        name: name.trim(),
        age: parseInt(age, 10),
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('logos_user', JSON.stringify(userData));
      await AsyncStorage.setItem('user:archetype', selectedArchetype);
      await AsyncStorage.setItem('user:startDate', new Date().toISOString());
      router.replace('/tutorial');
    } catch (e) {
      setError('Error al guardar. Intentá de nuevo.');
    }
  };

  const isStep1Valid = name.trim().length > 0 && age.trim().length > 0;

  // ── STEP 1: Name + Age ──

  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          <Text style={styles.title}>BIENVENIDO A</Text>
          <Text style={styles.logoTitle}>L O G O S</Text>

          <Text style={styles.subtitle}>
            Tu camino comienza aquí.{'\n'}Dinos cómo llamarte.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              placeholder="Tu nombre"
              placeholderTextColor="#333"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={20}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EDAD</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={(t) => { setAge(t.replace(/[^0-9]/g, '')); setError(''); }}
              placeholder="Tu edad"
              placeholderTextColor="#333"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, !isStep1Valid && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!isStep1Valid}
          >
            <Text style={[styles.buttonText, !isStep1Valid && styles.buttonTextDisabled]}>
              SIGUIENTE
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  }

  // ── STEP 2: Archetype Selection ──

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.step2Container, { opacity: fadeStep2 }]}>
        <Text style={styles.step2Title}>ELIGE TU ARQUETIPO</Text>
        <Text style={styles.step2Subtitle}>
          ¿Con quién te identificás?
        </Text>

        <ScrollView
          style={styles.archetypeScroll}
          contentContainerStyle={styles.archetypeGrid}
          showsVerticalScrollIndicator={false}
        >
          {ARCHETYPES.map((arch) => {
            const isSelected = selectedArchetype === arch.key;
            return (
              <Pressable
                key={arch.key}
                style={[
                  styles.archetypeCard,
                  isSelected && styles.archetypeCardSelected,
                ]}
                onPress={() => setSelectedArchetype(arch.key)}
              >
                <Text style={styles.archetypeIcon}>{arch.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.archetypeName,
                      isSelected && styles.archetypeNameSelected,
                    ]}
                  >
                    {arch.name}
                  </Text>
                  <Text
                    style={[
                      styles.archetypeQuote,
                      isSelected && styles.archetypeQuoteSelected,
                    ]}
                  >
                    "{arch.quote}"
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.step2Bottom}>
          <Pressable
            style={[styles.confirmButton, !selectedArchetype && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!selectedArchetype}
          >
            <Text
              style={[
                styles.confirmButtonText,
                !selectedArchetype && styles.confirmButtonTextDisabled,
              ]}
            >
              COMENZAR
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#555',
    letterSpacing: 6,
    marginBottom: 8,
  },
  logoTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 28,
    color: '#d4a017',
    letterSpacing: 10,
    marginBottom: 32,
  },
  subtitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#d4a017',
    letterSpacing: 4,
    marginBottom: 10,
  },
  input: {
    fontFamily: 'ShareTechMono',
    fontSize: 16,
    color: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  error: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#c0392b',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#d4a017',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 4,
  },
  buttonDisabled: {
    borderColor: '#222',
  },
  buttonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#d4a017',
    letterSpacing: 4,
  },
  buttonTextDisabled: {
    color: '#333',
  },

  // ── Step 2 ──
  step2Container: {
    flex: 1,
    width: '100%',
    paddingTop: 60,
  },
  step2Title: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#d4a017',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
  },
  step2Subtitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  archetypeScroll: {
    flex: 1,
  },
  archetypeGrid: {
    gap: 10,
    paddingBottom: 16,
  },
  archetypeCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  archetypeCardSelected: {
    borderColor: '#d4a017',
    backgroundColor: '#d4a01708',
  },
  archetypeIcon: {
    fontSize: 26,
    marginRight: 14,
  },
  archetypeName: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  archetypeNameSelected: {
    color: '#d4a017',
  },
  archetypeQuote: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#444',
    lineHeight: 15,
  },
  archetypeQuoteSelected: {
    color: '#888',
  },

  // Override: use a column layout inside the card for the text
  step2Bottom: {
    paddingVertical: 16,
  },
  confirmButton: {
    backgroundColor: '#d4a017',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#1a1a2e',
  },
  confirmButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#0a0a0f',
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: '#333',
  },
});
