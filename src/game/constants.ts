/**
 * CubeStacker Game Constants
 * All game configuration and tuning values
 */

// Grid dimensions
export const GRID_WIDTH = 9;
export const GRID_HEIGHT = 16;
export const VISIBLE_ROWS = 16;

// Block configuration
export const INITIAL_BLOCK_WIDTH = 3;
export const MIN_BLOCK_WIDTH = 1;

// Timing (in milliseconds)
export const BASE_SPEED = 150; // Base time per cell movement
export const SPEED_DECREASE_PER_STAGE = 12; // Speed increase per stage
export const MIN_SPEED = 50; // Fastest possible speed

// Stage configuration - 6 levels between each stage
export const LEVELS_PER_STAGE = 6;

// Stage definitions - every 6 levels (checkpoint on row 6, 12, 18...)
export const STAGES = [
  { name: 'ROOKIE', color: '#78716c', row: 0 },
  { name: 'BRONZE', color: '#cd7f32', row: 6 },      // Actual bronze
  { name: 'SILVER', color: '#c0c0c0', row: 12 },     // True silver
  { name: 'GOLD', color: '#ffd700', row: 18 },       // True gold
  { name: 'PLATINUM', color: '#e5e4e2', row: 24 },   // Platinum
  { name: 'DIAMOND', color: '#b9f2ff', row: 30 },    // Diamond blue
  { name: 'MASTER', color: '#9b59b6', row: 36 },     // Purple
  { name: 'GRANDMASTER', color: '#e056fd', row: 42 },// Bright pink
  { name: 'CHAMPION', color: '#ff6b6b', row: 48 },   // Coral red
  { name: 'TITAN', color: '#ff9f43', row: 54 },      // Orange
  { name: 'MYTHIC', color: '#ee5a24', row: 60 },     // Deep orange
  { name: 'LEGEND', color: '#f9ca24', row: 66 },     // Golden yellow
] as const;

// Visual configuration
export const CELL_SIZE = 26;
export const BLOCK_BORDER_RADIUS = 3;
export const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.04)';
export const GRID_BACKGROUND = '#0a0a10';

// Animation timings
export const FALL_ANIMATION_DURATION = 350;
export const LOCK_FLASH_DURATION = 80;
export const STAGE_TRANSITION_DURATION = 600;

// Colors - Modern, subtle
export const COLORS = {
  primary: '#60a5fa',
  secondary: '#a78bfa', 
  accent: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  background: '#0c0c14',
  surface: '#16161f',
  surfaceLight: '#1e1e2a',
  grid: 'rgba(255, 255, 255, 0.04)',
  gridAccent: 'rgba(255, 255, 255, 0.08)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)',
} as const;

// Get stage by level (every 6 levels = new stage)
export function getStageForLevel(level: number): number {
  const stageIndex = Math.floor(level / LEVELS_PER_STAGE);
  return Math.min(stageIndex, STAGES.length - 1);
}

// Get stage info by level
export function getStageInfo(level: number) {
  const stageIndex = getStageForLevel(level);
  return STAGES[stageIndex];
}

// Calculate speed for level
export function getSpeedForLevel(level: number): number {
  const stage = getStageForLevel(level);
  const speed = BASE_SPEED - (stage * SPEED_DECREASE_PER_STAGE);
  return Math.max(speed, MIN_SPEED);
}

// Check if level crosses a stage boundary
export function isStageTransition(level: number): boolean {
  return level > 0 && level % LEVELS_PER_STAGE === 0;
}

// Get the next stage info
export function getNextStageInfo(level: number) {
  const currentStageIndex = getStageForLevel(level);
  if (currentStageIndex >= STAGES.length - 1) return null;
  return STAGES[currentStageIndex + 1];
}
