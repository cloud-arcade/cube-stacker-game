/**
 * CubeStacker Game Types
 * TypeScript interfaces and types for game state
 */

// Direction of block movement
export type Direction = 'left' | 'right';

// Game phases
export type GamePhase = 'idle' | 'moving' | 'locked' | 'falling' | 'gameover';

// Single block position
export interface BlockPosition {
  col: number;
  row: number;
}

// Current moving row of blocks
export interface MovingRow {
  positions: number[]; // Column positions of each block
  row: number;         // Current row number (from bottom, 0-indexed)
  direction: Direction;
  width: number;       // Number of blocks in this row
}

// Locked (placed) block
export interface LockedBlock extends BlockPosition {
  stageIndex: number;  // For coloring based on stage
}

// Falling block (animation)
export interface FallingBlock extends BlockPosition {
  targetY: number;     // Where it falls to
  stageIndex: number;
  startTime: number;   // Animation start timestamp
}

// Stage marker (horizontal line with name)
export interface StageMarker {
  row: number;
  stageIndex: number;
  name: string;
}

// Complete game state
export interface GameState {
  phase: GamePhase;
  currentRow: MovingRow | null;
  lockedBlocks: LockedBlock[];
  fallingBlocks: FallingBlock[];
  stageMarkers: StageMarker[];
  level: number;       // Current row/level (1-indexed)
  score: number;       // Player's score
  highScore: number;   // Best score
  speed: number;       // Current movement speed (ms per cell)
  gameOffset: number;  // Vertical offset for infinite scrolling
}

// Game event types
export type GameEvent = 
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'LOCK' }
  | { type: 'TICK' }
  | { type: 'FALL_COMPLETE' }
  | { type: 'RESET' };

// Input action types
export type InputAction = 'stop';

// Score breakdown
export interface ScoreInfo {
  level: number;
  stage: string;
  stageIndex: number;
  perfectStacks: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  stage: string;
  date: string;
}

// High score storage
export interface StoredHighScore {
  score: number;
  stage: string;
  date: string;
}
