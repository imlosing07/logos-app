import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Header from '../../components/Header';
import useGameData from '../../hooks/useGameData';
import SemanaComponent from '../../components/Semana';

export default function SemanaScreen() {
  const { user, gameData, loading, maxDailyXP, reload, coinMultiplier } = useGameData();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [])
  );

  if (loading) return null;

  return (
    <View style={styles.container}>
      <Header
        userName={user?.name}
        coins={gameData.coins}
        xpToday={gameData.xpToday}
        maxXP={maxDailyXP}
        coinMultiplier={coinMultiplier}
      />
      <SemanaComponent xpToday={gameData.xpToday} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
});
