export const ARCHETYPES = [
  {
    key: 'marco_aurelio',
    name: 'Marco Aurelio',
    quote: 'El poder sin disciplina no es nada',
    icon: '👑',
  },
  {
    key: 'epicteto',
    name: 'Epicteto',
    quote: 'Nació sin libertad, murió siendo libre',
    icon: '⛓️',
  },
  {
    key: 'seneca',
    name: 'Séneca',
    quote: 'Cayó en el exilio, volvió más sabio',
    icon: '📜',
  },
  {
    key: 'heracles',
    name: 'Heracles',
    quote: 'Se redimió con trabajo y perseverancia',
    icon: '🦁',
  },
  {
    key: 'leonidas',
    name: 'Leonidas',
    quote: 'Eligió el deber sobre la vida',
    icon: '🛡️',
  },
  {
    key: 'odiseo',
    name: 'Odiseo',
    quote: 'Nunca dejó de luchar por volver',
    icon: '⚓',
  },
];

export const RANKS = [
  { min: 0, max: 7, label: 'Aprendiz', color: '#555' },
  { min: 8, max: 12, label: 'Guerrero', color: '#22c55e' },
  { min: 13, max: 17, label: 'Veterano', color: '#d4a017' },
  { min: 18, max: 22, label: 'Elite', color: '#e8832a' },
  { min: 23, max: 25, label: 'Legendario', color: '#ef4444' },
];

export const RANK_PHRASES = {
  Aprendiz:
    'El camino comienza con un paso. No te juzgues por hoy, júzgate por tu dirección.',
  Guerrero:
    'Avanzas. Cada día que cumples forjas algo que nadie puede quitarte.',
  Veterano:
    'La consistencia es la virtud más difícil. La estás practicando.',
  Elite:
    'Pocos llegan aquí. No por talento, sino por no rendirse cuando era fácil hacerlo.',
  Legendario:
    'Has demostrado que eres dueño de ti mismo. Eso vale más que cualquier título.',
};

export const RANK_IMAGES = {
  Aprendiz: require('../assets/images/marcus_aprendiz.png'),
  Guerrero: require('../assets/images/marcus_guerrero.png'),
  Veterano: require('../assets/images/marcus_veterano.png'),
  Elite: require('../assets/images/marcus_elite.png'),
  Legendario: require('../assets/images/marcus_legendario.png'),
};

export function getRank(avgXP) {
  const rounded = Math.round(avgXP * 10) / 10;
  for (const rank of RANKS) {
    if (rounded >= rank.min && rounded <= rank.max) return rank;
  }
  return RANKS[0];
}

export function getRankLetter(avgXP) {
  const rank = getRank(avgXP);
  switch (rank.label) {
    case 'Legendario': return 'S';
    case 'Elite': return 'A';
    case 'Veterano': return 'B';
    case 'Guerrero': return 'C';
    case 'Aprendiz': return 'D';
    default: return 'D';
  }
}
