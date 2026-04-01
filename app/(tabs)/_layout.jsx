import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwordsIcon, CoinIcon, ShieldIcon, HelmetIcon } from '../../components/TabIcons';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f1a',
          borderTopWidth: 1,
          borderTopColor: '#1a1a2e',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#d4a017',
        tabBarInactiveTintColor: '#444',
      }}
    >
      <Tabs.Screen
        name="hoy"
        options={{
          tabBarIcon: ({ color }) => <SwordsIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tienda"
        options={{
          tabBarIcon: ({ color }) => <CoinIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="semana"
        options={{
          tabBarIcon: ({ color }) => <ShieldIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ color }) => <HelmetIcon size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
