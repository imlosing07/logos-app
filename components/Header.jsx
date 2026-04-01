import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function Header({ userName, coins, xpToday, maxXP, coinMultiplier }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const xpPercent = Math.min((xpToday / maxXP) * 100, 100);
  const hasMultiplier = coinMultiplier > 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Top row: name + coins */}
      <View style={styles.topRow}>
        <Pressable onPress={() => router.push('/config')} hitSlop={8}>
          <Text style={styles.logoLabel}>LOGOS</Text>
          <Text style={styles.userName}>{userName || '...'}</Text>
        </Pressable>
        <View style={styles.coinsContainer}>
          <View style={styles.coinsRow}>
            <Text style={styles.coinsLabel}>MONEDAS</Text>
            {hasMultiplier && (
              <View style={styles.multiplierBadge}>
                <Text style={styles.multiplierText}>x{coinMultiplier}</Text>
              </View>
            )}
          </View>
          <Text style={styles.coinsValue}>{coins}</Text>
        </View>
      </View>

      {/* XP bar */}
      <View style={styles.xpRow}>
        <Text style={styles.xpLabel}>XP HOY</Text>
        <Text style={styles.xpValue}>
          {xpToday} / {maxXP}
        </Text>
      </View>
      <View style={styles.xpBarBg}>
        <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f0f1a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  logoLabel: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#444',
    letterSpacing: 3,
    marginBottom: 2,
  },
  userName: {
    fontFamily: 'ShareTechMono',
    fontSize: 20,
    color: '#d4a017',
    fontWeight: 'bold',
  },
  coinsContainer: {
    alignItems: 'flex-end',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinsLabel: {
    fontFamily: 'ShareTechMono',
    fontSize: 9,
    color: '#444',
    letterSpacing: 1,
    marginBottom: 2,
  },
  coinsValue: {
    fontFamily: 'ShareTechMono',
    fontSize: 24,
    color: '#d4a017',
    fontWeight: 'bold',
  },
  // Multiplier badge
  multiplierBadge: {
    backgroundColor: '#d4a017',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 2,
  },
  multiplierText: {
    fontFamily: 'ShareTechMono',
    fontSize: 9,
    color: '#0a0a0f',
    fontWeight: 'bold',
  },
  // XP bar
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  xpLabel: {
    fontFamily: 'ShareTechMono',
    fontSize: 10,
    color: '#555',
    letterSpacing: 1,
  },
  xpValue: {
    fontFamily: 'ShareTechMono',
    fontSize: 11,
    color: '#d4a017',
  },
  xpBarBg: {
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    height: 7,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#d4a017',
    borderRadius: 4,
  },
});
