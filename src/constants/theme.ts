export const THEME = {
  colors: {
    // Pure OLED black background
    background: '#000000',

    // Frosted surfaces & layers
    surface: '#0D0D10',
    surfaceElevated: 'rgba(28, 28, 32, 0.75)',
    surfaceHighlight: 'rgba(255, 255, 255, 0.08)',
    surfaceCard: 'rgba(22, 22, 26, 0.7)',

    // Monochrome Accents
    accent: '#FFFFFF', // Crisp White
    accentLight: '#F2F2F7',
    accentDark: '#1C1C1E',
    accentMuted: '#8E8E93',
    accentSecondary: '#D1D1D6',

    // Gradients
    accentGradient: ['#FFFFFF', '#C7C7CC'] as const,
    toneGradient: ['#1A1A1E', '#0B0B0D', '#000000'] as const,
    cardGradient: ['rgba(255, 255, 255, 0.09)', 'rgba(255, 255, 255, 0.02)'] as const,
    glassGradient: ['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.03)'] as const,

    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#AEAEB2',
    textTertiary: '#636366',

    // Glassmorphism borders & fills
    glassBackground: 'rgba(255, 255, 255, 0.06)',
    glassBackgroundActive: 'rgba(255, 255, 255, 0.16)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassBorderHighlight: 'rgba(255, 255, 255, 0.24)',
    border: 'rgba(255, 255, 255, 0.09)',
    borderLight: 'rgba(255, 255, 255, 0.18)',
    overlay: 'rgba(0, 0, 0, 0.75)',
    playerBackground: '#0B0B0E',

    // Semantic colors (kept subtle)
    success: '#E5E5EA',
    warning: '#D1D1D6',
    error: '#FF453A',
  },
  blur: {
    miniPlayer: 'dark' as const,
    modal: 'dark' as const,
    tabBar: 'dark' as const,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    round: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  glass: {
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: 1,
    },
    cardElevated: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.18)',
      borderWidth: 1,
    },
  },
};

export interface ThemePreset {
  id: string;
  name: string;
  colors: readonly [string, string, string];
  previewColor: string;
  accentColor: string;
  ambientGlow: string;
  cardBackground: string;
  icon: string;
}

export type GradientPreset = ThemePreset;

export const GRADIENT_PRESETS: ThemePreset[] = [
  {
    id: 'oled',
    name: 'OLED Dark',
    colors: ['#000000', '#000000', '#000000'],
    previewColor: '#000000',
    accentColor: '#FFFFFF',
    ambientGlow: 'rgba(255, 255, 255, 0.06)',
    cardBackground: 'rgba(20, 20, 24, 0.85)',
    icon: 'moon',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Noir',
    colors: ['#1E1E24', '#0F0F13', '#000000'],
    previewColor: '#1E1E24',
    accentColor: '#E2E8F0',
    ambientGlow: 'rgba(255, 255, 255, 0.12)',
    cardBackground: 'rgba(26, 26, 32, 0.85)',
    icon: 'contrast',
  },
  {
    id: 'crimson',
    name: 'Crimson Moon',
    colors: ['#3A0B10', '#1C0407', '#000000'],
    previewColor: '#3A0B10',
    accentColor: '#FF4B55',
    ambientGlow: 'rgba(240, 40, 60, 0.35)',
    cardBackground: 'rgba(38, 12, 16, 0.85)',
    icon: 'flame',
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    colors: ['#0D1C44', '#060E24', '#000000'],
    previewColor: '#0D1C44',
    accentColor: '#5865F2',
    ambientGlow: 'rgba(88, 101, 242, 0.35)',
    cardBackground: 'rgba(14, 22, 48, 0.85)',
    icon: 'planet',
  },
  {
    id: 'cyberpunk',
    name: 'Neon Synth',
    colors: ['#33083B', '#16041C', '#000000'],
    previewColor: '#33083B',
    accentColor: '#E040FB',
    ambientGlow: 'rgba(224, 64, 251, 0.35)',
    cardBackground: 'rgba(36, 12, 42, 0.85)',
    icon: 'flash',
  },
  {
    id: 'sunset',
    name: 'Sunset Horizon',
    colors: ['#3D1905', '#1F0B02', '#000000'],
    previewColor: '#3D1905',
    accentColor: '#FF8A3D',
    ambientGlow: 'rgba(255, 120, 40, 0.35)',
    cardBackground: 'rgba(42, 18, 10, 0.85)',
    icon: 'sunny',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    colors: ['#0A2E1A', '#05180D', '#000000'],
    previewColor: '#0A2E1A',
    accentColor: '#34D399',
    ambientGlow: 'rgba(52, 211, 153, 0.35)',
    cardBackground: 'rgba(12, 36, 22, 0.85)',
    icon: 'leaf',
  },
  {
    id: 'amethyst',
    name: 'Cosmic Violet',
    colors: ['#250E40', '#10051E', '#000000'],
    previewColor: '#250E40',
    accentColor: '#A78BFA',
    ambientGlow: 'rgba(167, 139, 250, 0.35)',
    cardBackground: 'rgba(28, 14, 46, 0.85)',
    icon: 'sparkles',
  },
  {
    id: 'copper',
    name: 'Copper Bronze',
    colors: ['#2F1B0E', '#170C06', '#000000'],
    previewColor: '#2F1B0E',
    accentColor: '#F59E0B',
    ambientGlow: 'rgba(245, 158, 11, 0.35)',
    cardBackground: 'rgba(36, 22, 14, 0.85)',
    icon: 'shield',
  },
  {
    id: 'titanium',
    name: 'Titanium Slate',
    colors: ['#2A2C34', '#15171C', '#000000'],
    previewColor: '#2A2C34',
    accentColor: '#CBD5E1',
    ambientGlow: 'rgba(203, 213, 225, 0.25)',
    cardBackground: 'rgba(32, 34, 42, 0.85)',
    icon: 'hardware-chip',
  },
];
