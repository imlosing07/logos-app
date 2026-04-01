import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Header from '../../components/Header';
import useGameData from '../../hooks/useGameData';
import TiendaComponent from '../../components/Tienda';

export default function TiendaScreen() {
  const { user, gameData, loading, maxDailyXP, spendCoins, reload, coinMultiplier } = useGameData();

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
      <TiendaComponent coins={gameData.coins} onSpendCoins={spendCoins} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
});
