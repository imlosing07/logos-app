// Tiers de precio simples — el usuario elige un tier al crear su recompensa
export const PRICE_TIERS = [
  { key: 'small', label: 'Pequeño', price: 10, desc: 'Snack, café, 15 min ocio' },
  { key: 'medium', label: 'Medio', price: 25, desc: '30 min redes, videojuegos' },
  { key: 'large', label: 'Grande', price: 60, desc: 'Salida, delivery, 1h ocio' },
  { key: 'epic', label: 'Épico', price: 150, desc: 'Compra personal, experiencia' },
];

// Recompensas precreadas que aparecen si el usuario no tiene ninguna
export const DEFAULT_REWARDS = [
  { id: 'default_1', name: 'Snack o antojo', price: 10, tier: 'small' },
  { id: 'default_2', name: '30 min de redes sociales', price: 25, tier: 'medium' },
  { id: 'default_3', name: '30 min de videojuegos', price: 25, tier: 'medium' },
  { id: 'default_4', name: 'Ver un capítulo de serie', price: 25, tier: 'medium' },
  { id: 'default_5', name: 'Comida chatarra / Delivery', price: 60, tier: 'large' },
  { id: 'default_6', name: 'Salida con amigos', price: 60, tier: 'large' },
  { id: 'default_7', name: 'Compra personal', price: 150, tier: 'epic' },
];
