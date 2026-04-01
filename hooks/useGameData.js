import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER: 'logos_user',
  GAME: 'logos_game',
  HISTORY: 'history:days',
  XP_TOTAL: 'user:xpTotal',
  START_DATE: 'user:startDate',
  SHIELDS: 'streak:shields',
};

const MAX_DAILY_XP = 25;
const MULTIPLIER_DAYS = 28;

/**
 * Level formula:
 * Level 1→2: 100 XP
 * Level 2→3: 300 XP (100+200)
 * Level 3→4: 500 XP (300+200)
 * Level N→N+1: 100 + (N-1)*200
 *
 * Cumulative XP for level N:
 * sum from k=1 to N-1 of (100 + (k-1)*200) = (N-1)*100 + (N-1)*(N-2)*100 = 100*(N-1)^2
 */
function getLevelInfo(xpTotal) {
  let level = 1;
  while (100 * level * level <= xpTotal) {
    level++;
  }
  const xpForCurrentLevel = 100 * (level - 1) * (level - 1);
  const xpForNextLevel = 100 * level * level;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = xpTotal - xpForCurrentLevel;

  return {
    level,
    xpProgress,
    xpNeeded,
    xpTotal,
  };
}

function getCoinMultiplier(startDateStr) {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays < MULTIPLIER_DAYS ? 2 : 1;
}

const getDefaultGameData = () => ({
  xpToday: 0,
  coins: 0,
  totalDays: 0,
  currentDate: new Date().toISOString().split('T')[0],
});

async function saveDayToHistory(date, xp) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    const history = raw ? JSON.parse(raw) : [];
    if (history.some((d) => d.date === date)) return;
    const updated = [...history, { date, xp }]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 60);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving day to history:', e);
  }
}

export default function useGameData() {
  const [user, setUser] = useState(null);
  const [gameData, setGameData] = useState(getDefaultGameData());
  const [xpTotal, setXpTotal] = useState(0);
  const [coinMultiplier, setCoinMultiplier] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Track level up for UI
  const [lastLeveledUp, setLastLeveledUp] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [userData, gameStr, xpTotalRaw, startDateRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.GAME),
        AsyncStorage.getItem(STORAGE_KEYS.XP_TOTAL),
        AsyncStorage.getItem(STORAGE_KEYS.START_DATE),
      ]);

      if (userData) {
        setUser(JSON.parse(userData));
      }

      const savedXpTotal = xpTotalRaw ? parseInt(xpTotalRaw, 10) : 0;
      setXpTotal(isNaN(savedXpTotal) ? 0 : savedXpTotal);
      setCoinMultiplier(getCoinMultiplier(startDateRaw));

      if (gameStr) {
        const saved = JSON.parse(gameStr);
        const today = new Date().toISOString().split('T')[0];

        if (saved.currentDate !== today) {
          await saveDayToHistory(saved.currentDate, saved.xpToday);
          const updated = {
            ...saved,
            xpToday: 0,
            currentDate: today,
            totalDays: (saved.totalDays || 0) + 1,
          };
          await AsyncStorage.setItem(STORAGE_KEYS.GAME, JSON.stringify(updated));
          setGameData(updated);
        } else {
          setGameData(saved);
        }
      } else {
        const initial = getDefaultGameData();
        await AsyncStorage.setItem(STORAGE_KEYS.GAME, JSON.stringify(initial));
        setGameData(initial);
      }
    } catch (e) {
      console.error('Error loading game data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const awardShield = async () => {
    try {
      const currentRaw = await AsyncStorage.getItem(STORAGE_KEYS.SHIELDS);
      const current = currentRaw ? parseInt(currentRaw, 10) : 0;
      await AsyncStorage.setItem(STORAGE_KEYS.SHIELDS, String(current + 1));
    } catch (e) {
      console.error('Error awarding shield:', e);
    }
  };

  const addXP = useCallback(
    async (amount) => {
      let mult = coinMultiplier;
      try {
        const startDateRaw = await AsyncStorage.getItem(STORAGE_KEYS.START_DATE);
        mult = getCoinMultiplier(startDateRaw);
      } catch (e) {}

      setGameData((prev) => {
        const newXP = Math.min(prev.xpToday + amount, MAX_DAILY_XP);
        const actualGain = newXP - prev.xpToday;
        const coinGain = actualGain * mult;
        const newCoins = prev.coins + coinGain;

        const updated = {
          ...prev,
          xpToday: newXP,
          coins: newCoins,
        };

        AsyncStorage.setItem(STORAGE_KEYS.GAME, JSON.stringify(updated));

        if (actualGain > 0) {
          setXpTotal((prevTotal) => {
            const oldLevel = getLevelInfo(prevTotal).level;
            const newTotal = prevTotal + actualGain;
            const newLevel = getLevelInfo(newTotal).level;

            AsyncStorage.setItem(STORAGE_KEYS.XP_TOTAL, String(newTotal));

            if (newLevel > oldLevel) {
              awardShield();
              setLastLeveledUp(newLevel);
            }

            return newTotal;
          });
        }

        return updated;
      });
    },
    [coinMultiplier]
  );

  const removeXP = useCallback(
    async (amount) => {
      let mult = coinMultiplier;
      try {
        const startDateRaw = await AsyncStorage.getItem(STORAGE_KEYS.START_DATE);
        mult = getCoinMultiplier(startDateRaw);
      } catch (e) {}

      setGameData((prev) => {
        const newXP = Math.max(prev.xpToday - amount, 0);
        const actualLoss = prev.xpToday - newXP;
        const coinLoss = actualLoss * mult;
        const newCoins = Math.max(prev.coins - coinLoss, 0);

        const updated = {
          ...prev,
          xpToday: newXP,
          coins: newCoins,
        };

        AsyncStorage.setItem(STORAGE_KEYS.GAME, JSON.stringify(updated));

        if (actualLoss > 0) {
          setXpTotal((prevTotal) => {
            const newTotal = Math.max(prevTotal - actualLoss, 0);
            AsyncStorage.setItem(STORAGE_KEYS.XP_TOTAL, String(newTotal));
            return newTotal;
          });
        }

        return updated;
      });
    },
    [coinMultiplier]
  );

  const spendCoins = useCallback(
    async (amount) => {
      return new Promise((resolve) => {
        setGameData((prev) => {
          if (prev.coins < amount) {
            resolve(false);
            return prev;
          }
          const updated = { ...prev, coins: prev.coins - amount };
          AsyncStorage.setItem(STORAGE_KEYS.GAME, JSON.stringify(updated));
          resolve(true);
          return updated;
        });
      });
    },
    []
  );

  const levelInfo = getLevelInfo(xpTotal);

  return {
    user,
    gameData,
    loading,
    addXP,
    removeXP,
    spendCoins,
    reload: loadData,
    maxDailyXP: MAX_DAILY_XP,
    xpTotal,
    levelInfo,
    coinMultiplier,
    lastLeveledUp,
    dismissLevelUp: () => setLastLeveledUp(null),
  };
}