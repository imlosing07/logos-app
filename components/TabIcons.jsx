import React from 'react';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

// ── Crossed Swords (HOY) ────────────────────────
export function SwordsIcon({ size = 24, color = '#444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left sword blade */}
      <Path
        d="M4 2L14 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Left sword guard */}
      <Path
        d="M10 8L8 10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Left pommel */}
      <Path
        d="M3 21L7 17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M5 19L7 17"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Right sword blade */}
      <Path
        d="M20 2L10 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Right sword guard */}
      <Path
        d="M14 8L16 10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Right pommel */}
      <Path
        d="M21 21L17 17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M19 19L17 17"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Coin (TIENDA) ───────────────────────────────
export function CoinIcon({ size = 24, color = '#444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer circle */}
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={2}
      />
      {/* Inner circle */}
      <Circle
        cx="12"
        cy="12"
        r="6.5"
        stroke={color}
        strokeWidth={1}
        opacity={0.5}
      />
      {/* Dollar/coin symbol — stylized $ */}
      <Path
        d="M12 6V18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M15 9.5C15 8.12 13.66 7 12 7C10.34 7 9 8.12 9 9.5C9 10.88 10.34 12 12 12C13.66 12 15 13.12 15 14.5C15 15.88 13.66 17 12 17C10.34 17 9 15.88 9 14.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Shield with Progress (SEMANA) ───────────────
export function ShieldIcon({ size = 24, color = '#444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Shield outline */}
      <Path
        d="M12 2L4 6V12C4 16.42 7.36 20.54 12 22C16.64 20.54 20 16.42 20 12V6L12 2Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* Progress bar background */}
      <Rect
        x="7"
        y="10.5"
        width="10"
        height="3"
        rx="1.5"
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
      />
      {/* Progress bar fill */}
      <Rect
        x="7"
        y="10.5"
        width="7"
        height="3"
        rx="1.5"
        fill={color}
        opacity={0.8}
      />
    </Svg>
  );
}

// ── Warrior Helmet (PERFIL) ─────────────────────
export function HelmetIcon({ size = 24, color = '#444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Helmet dome */}
      <Path
        d="M5 14C5 8.48 8.13 4 12 4C15.87 4 19 8.48 19 14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Helmet brim */}
      <Path
        d="M3 14H21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Face guard / nose piece */}
      <Path
        d="M12 14V19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Cheek guards */}
      <Path
        d="M5 14V18C5 18.55 5.45 19 6 19H8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 14V18C19 18.55 18.55 19 18 19H16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crest on top */}
      <Path
        d="M10 4.5C10 3.12 10.9 2 12 2C13.1 2 14 3.12 14 4.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
