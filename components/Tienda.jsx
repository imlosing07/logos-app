import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRICE_TIERS, DEFAULT_REWARDS } from '../constants/store';

const REWARDS_KEY = 'store:rewards';
const LOG_KEY = 'store:log';

export default function Tienda({ coins, onSpendCoins }) {
  const [rewards, setRewards] = useState([]);
  const [log, setLog] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [rewardName, setRewardName] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rewardsRaw, logRaw] = await Promise.all([
        AsyncStorage.getItem(REWARDS_KEY),
        AsyncStorage.getItem(LOG_KEY),
      ]);

      if (rewardsRaw) {
        setRewards(JSON.parse(rewardsRaw));
      } else {
        // Primera vez: cargar recompensas por defecto
        setRewards([...DEFAULT_REWARDS]);
        await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(DEFAULT_REWARDS));
      }

      if (logRaw) setLog(JSON.parse(logRaw));
    } catch (e) {
      console.error('Error loading store:', e);
    } finally {
      setLoaded(true);
    }
  };

  const saveRewards = async (updated) => {
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(updated));
  };

  const saveLog = async (updated) => {
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
  };

  const handleAddReward = () => {
    const name = rewardName.trim();
    if (!name || !selectedTier) return;

    const tier = PRICE_TIERS.find((t) => t.key === selectedTier);
    const newReward = {
      id: Date.now().toString(),
      name,
      price: tier.price,
      tier: tier.key,
    };

    const updated = [...rewards, newReward];
    setRewards(updated);
    saveRewards(updated);
    setRewardName('');
    setSelectedTier(null);
    setShowForm(false);
    Keyboard.dismiss();
  };

  const handleDeleteReward = (rewardId) => {
    const updated = rewards.filter((r) => r.id !== rewardId);
    setRewards(updated);
    saveRewards(updated);
  };

  const handleBuy = (reward) => {
    if (coins < reward.price) return;

    Alert.alert(
      'Canjear recompensa',
      `¿Gastar ${reward.price} monedas en "${reward.name}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Canjear',
          onPress: async () => {
            await onSpendCoins(reward.price);
            const entry = {
              id: Date.now().toString(),
              name: reward.name,
              price: reward.price,
              date: new Date().toISOString(),
            };
            const updatedLog = [entry, ...log].slice(0, 20);
            setLog(updatedLog);
            saveLog(updatedLog);
          },
        },
      ]
    );
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  };

  if (!loaded) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentInner}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.topBar}>
        <Text style={styles.title}>RECOMPENSAS</Text>
        <View style={styles.coinsBadge}>
          <Text style={styles.coinsBadgeText}>{coins} monedas</Text>
        </View>
      </View>

      {/* Reward List — flat, no categories */}
      {rewards.map((reward) => {
        const canBuy = coins >= reward.price;
        return (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardLeft}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardPrice}>{reward.price} monedas</Text>
            </View>
            <View style={styles.rewardRight}>
              <Pressable
                style={[styles.buyButton, !canBuy && styles.buyButtonDisabled]}
                onPress={() => handleBuy(reward)}
                disabled={!canBuy}
              >
                <Text style={[styles.buyButtonText, !canBuy && styles.buyButtonTextDisabled]}>
                  CANJEAR
                </Text>
              </Pressable>
              <Pressable
                style={styles.rewardDelete}
                onPress={() => handleDeleteReward(reward.id)}
                hitSlop={8}
              >
                <Text style={styles.rewardDeleteText}>✕</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* Add reward */}
      {!showForm && (
        <Pressable
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.addButtonText}>+ AGREGAR RECOMPENSA</Text>
        </Pressable>
      )}

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>NUEVA RECOMPENSA</Text>

          <TextInput
            style={styles.input}
            value={rewardName}
            onChangeText={setRewardName}
            placeholder="Ej: Pizza, YouTube 1h..."
            placeholderTextColor="#333"
            maxLength={30}
          />

          <Text style={styles.formLabel}>PRECIO</Text>
          <View style={styles.tierGrid}>
            {PRICE_TIERS.map((tier) => {
              const isSelected = selectedTier === tier.key;
              return (
                <Pressable
                  key={tier.key}
                  style={[styles.tierChip, isSelected && styles.tierChipActive]}
                  onPress={() => setSelectedTier(tier.key)}
                >
                  <Text style={[styles.tierPrice, isSelected && styles.tierPriceActive]}>
                    {tier.price}
                  </Text>
                  <Text style={[styles.tierLabel, isSelected && styles.tierLabelActive]}>
                    {tier.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedTier && (
            <Text style={styles.tierHint}>
              {PRICE_TIERS.find((t) => t.key === selectedTier)?.desc}
            </Text>
          )}

          <View style={styles.formActions}>
            <Pressable
              style={styles.formCancelBtn}
              onPress={() => {
                setShowForm(false);
                setRewardName('');
                setSelectedTier(null);
              }}
            >
              <Text style={styles.formCancelText}>CANCELAR</Text>
            </Pressable>
            <Pressable
              style={[
                styles.formConfirmBtn,
                (!rewardName.trim() || !selectedTier) && styles.formConfirmBtnDisabled,
              ]}
              onPress={handleAddReward}
              disabled={!rewardName.trim() || !selectedTier}
            >
              <Text
                style={[
                  styles.formConfirmText,
                  (!rewardName.trim() || !selectedTier) && styles.formConfirmTextDisabled,
                ]}
              >
                AGREGAR
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Purchase log */}
      {log.length > 0 && (
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>HISTORIAL</Text>
          {log.map((entry) => (
            <View key={entry.id} style={styles.logEntry}>
              <Text style={styles.logName}>{entry.name}</Text>
              <View style={styles.logMeta}>
                <Text style={styles.logPrice}>-{entry.price}</Text>
                <Text style={styles.logDate}>{timeAgo(entry.date)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'ShareTechMono',
    fontSize: 16,
    color: '#d4a017',
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  coinsBadge: {
    backgroundColor: '#d4a01715',
    borderWidth: 1,
    borderColor: '#d4a01730',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  coinsBadgeText: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#d4a017',
  },

  // Reward cards
  rewardCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#1a1a2e',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardLeft: {
    flex: 1,
    marginRight: 10,
  },
  rewardName: {
    fontFamily: 'ShareTechMono',
    fontSize: 13,
    color: '#c8bfa0',
    marginBottom: 3,
  },
  rewardPrice: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#555',
  },
  rewardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyButton: {
    backgroundColor: '#d4a017',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  buyButtonDisabled: {
    backgroundColor: '#1a1a2e',
  },
  buyButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#0a0a0f',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  buyButtonTextDisabled: {
    color: '#333',
  },
  rewardDelete: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardDeleteText: {
    fontSize: 12,
    color: '#333',
  },

  // Add button
  addButton: {
    borderWidth: 1,
    borderColor: '#d4a01740',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#d4a017',
    letterSpacing: 2,
  },

  // Form
  formCard: {
    backgroundColor: '#0f0f1a',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderRadius: 10,
    padding: 18,
    marginTop: 16,
  },
  formTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#d4a017',
    letterSpacing: 3,
    marginBottom: 14,
  },
  input: {
    fontFamily: 'ShareTechMono',
    fontSize: 14,
    color: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  formLabel: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#555',
    letterSpacing: 3,
    marginBottom: 10,
  },
  tierGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tierChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1a1a2e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  tierChipActive: {
    borderColor: '#d4a017',
    backgroundColor: '#d4a01712',
  },
  tierPrice: {
    fontFamily: 'ShareTechMono',
    fontSize: 16,
    color: '#444',
    fontWeight: 'bold',
  },
  tierPriceActive: {
    color: '#d4a017',
  },
  tierLabel: {
    fontFamily: 'ShareTechMono',
    fontSize: 8,
    color: '#333',
    letterSpacing: 1,
  },
  tierLabelActive: {
    color: '#d4a01790',
  },
  tierHint: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    marginBottom: 14,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
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

  // Log section
  logSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    paddingTop: 16,
  },
  logTitle: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#444',
    letterSpacing: 2,
    marginBottom: 10,
  },
  logEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f0f1a',
  },
  logName: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  logMeta: {
    alignItems: 'flex-end',
  },
  logPrice: {
    fontFamily: 'ShareTechMono',
    fontSize: 12,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  logDate: {
    fontFamily: 'ShareTechMono',
    fontSize: 9,
    color: '#333',
  },
});
