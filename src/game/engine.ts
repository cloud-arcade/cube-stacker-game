/**
 * CubeStacker Game Engine
 * Core game logic and state management
 */

import {
  GRID_WIDTH,
  GRID_HEIGHT,
  INITIAL_BLOCK_WIDTH,
  MIN_BLOCK_WIDTH,
  getSpeedForLevel,
  getStageForLevel,
} from './constants';
import type {
  GameState,
  Direction,
} from './types';

export type GameEventCallback = (state: GameState) => void;

export class StackerEngine {
  private state: GameState;
  private animationId: number | null = null;
  private lastMoveTime: number = 0;
  private onStateChange: GameEventCallback | null = null;
  private onGameOver: ((score: number) => void) | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'idle',
      currentRow: null,
      lockedBlocks: [],
      fallingBlocks: [],
      stageMarkers: [],
      level: 0,
      score: 0,
      highScore: this.loadHighScore(),
      speed: getSpeedForLevel(1),
      gameOffset: 0,
    };
  }

  // Public getters
  public getState(): GameState {
    return { ...this.state };
  }

  public isPlaying(): boolean {
    return this.state.phase !== 'idle' && this.state.phase !== 'gameover';
  }

  // Event registration
  public onUpdate(callback: GameEventCallback): void {
    this.onStateChange = callback;
  }

  public onEnd(callback: (score: number) => void): void {
    this.onGameOver = callback;
  }

  // Game lifecycle
  public start(): void {
    this.state = this.createInitialState();
    this.state.phase = 'moving';
    this.state.level = 1;
    this.state.speed = getSpeedForLevel(1);
    this.spawnNewRow();
    this.lastMoveTime = performance.now();
    this.startGameLoop();
    this.emitStateChange();
  }

  public stop(): void {
    this.stopGameLoop();
    this.state.phase = 'idle';
    this.emitStateChange();
  }

  public reset(): void {
    this.stopGameLoop();
    this.state = this.createInitialState();
    this.emitStateChange();
  }

  // Main input action - lock the current row
  public lockRow(): void {
    if (this.state.phase !== 'moving' || !this.state.currentRow) return;

    this.state.phase = 'locked';
    const currentPositions = this.state.currentRow.positions;
    const currentRowIndex = this.state.currentRow.row;
    const stageIndex = getStageForLevel(this.state.level);

    if (this.state.level === 1) {
      // First row - just lock all blocks
      currentPositions.forEach(col => {
        this.state.lockedBlocks.push({
          col,
          row: currentRowIndex,
          stageIndex,
        });
      });

      // Add stage marker for first stage
      this.addStageMarkerIfNeeded();
      this.advanceToNextLevel();
    } else {
      // Check alignment with row below
      const rowBelow = this.state.lockedBlocks.filter(
        b => b.row === currentRowIndex - 1
      );
      const columnsBelow = new Set(rowBelow.map(b => b.col));

      const alignedPositions: number[] = [];
      const missedPositions: number[] = [];

      currentPositions.forEach(col => {
        if (columnsBelow.has(col)) {
          alignedPositions.push(col);
        } else {
          missedPositions.push(col);
        }
      });

      if (alignedPositions.length === 0) {
        // No alignment - game over
        this.triggerGameOver();
        return;
      }

      // Lock aligned blocks
      alignedPositions.forEach(col => {
        this.state.lockedBlocks.push({
          col,
          row: currentRowIndex,
          stageIndex,
        });
      });

      // Create falling blocks for missed ones
      missedPositions.forEach(col => {
        this.state.fallingBlocks.push({
          col,
          row: currentRowIndex,
          targetY: GRID_HEIGHT + 2, // Fall below screen
          stageIndex,
          startTime: performance.now(),
        });
      });

      // Add stage marker if needed
      this.addStageMarkerIfNeeded();

      // If blocks are falling, wait for animation
      if (missedPositions.length > 0) {
        this.state.phase = 'falling';
        setTimeout(() => {
          this.cleanupFallingBlocks();
          this.advanceToNextLevel();
        }, 500);
      } else {
        this.advanceToNextLevel();
      }
    }

    this.emitStateChange();
  }

  // Private methods
  private spawnNewRow(): void {
    const level = this.state.level;
    
    // Determine block width based on the TOP row of locked blocks
    let width = INITIAL_BLOCK_WIDTH;
    
    if (this.state.lockedBlocks.length > 0) {
      // Find the highest row with locked blocks
      const maxRow = Math.max(...this.state.lockedBlocks.map(b => b.row));
      // Get blocks in that row
      const topRowBlocks = this.state.lockedBlocks.filter(b => b.row === maxRow);
      width = Math.max(topRowBlocks.length, MIN_BLOCK_WIDTH);
    }

    // Always start from the left side, moving right
    const direction: Direction = 'right';
    const startCol = -width; // Start fully off-screen to the left

    // Create positions array
    const positions: number[] = [];
    for (let i = 0; i < width; i++) {
      positions.push(startCol + i);
    }

    // Calculate the row for the new block (directly on top of the stack)
    let newRowIndex: number;
    if (this.state.lockedBlocks.length > 0) {
      const maxRow = Math.max(...this.state.lockedBlocks.map(b => b.row));
      newRowIndex = maxRow + 1;
    } else {
      newRowIndex = 0;
    }

    this.state.currentRow = {
      positions,
      row: newRowIndex,
      direction,
      width,
    };

    // Update speed based on level
    this.state.speed = getSpeedForLevel(level);
  }

  private advanceToNextLevel(): void {
    this.state.level++;
    
    // Check if we need to shift everything down (infinite scroll)
    const maxRow = this.state.lockedBlocks.length > 0 
      ? Math.max(...this.state.lockedBlocks.map(b => b.row))
      : 0;
    
    if (maxRow >= GRID_HEIGHT - 3) {
      this.shiftGridDown();
    }

    this.state.phase = 'moving';
    this.spawnNewRow();
    this.emitStateChange();
  }

  private shiftGridDown(): void {
    // Move all locked blocks down by 1 row
    this.state.lockedBlocks = this.state.lockedBlocks
      .map(block => ({ ...block, row: block.row - 1 }))
      .filter(block => block.row >= 0);

    // Increase game offset for visual effect (tracks how much we've scrolled)
    this.state.gameOffset++;
  }

  // Stage markers are now fixed on the grid, so no need to track them dynamically
  private addStageMarkerIfNeeded(): void {
    // Stages are now visually fixed - no dynamic markers needed
  }

  private cleanupFallingBlocks(): void {
    this.state.fallingBlocks = [];
  }

  private triggerGameOver(): void {
    this.stopGameLoop();
    this.state.phase = 'gameover';
    this.state.score = this.state.level - 1; // Score is the last completed level

    // Update high score
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
      this.saveHighScore(this.state.score);
    }

    this.emitStateChange();
    
    if (this.onGameOver) {
      this.onGameOver(this.state.score);
    }
  }

  private startGameLoop(): void {
    const gameLoop = (timestamp: number) => {
      if (this.state.phase !== 'moving') {
        this.animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const elapsed = timestamp - this.lastMoveTime;
      
      if (elapsed >= this.state.speed) {
        this.moveCurrentRow();
        this.lastMoveTime = timestamp;
      }

      this.animationId = requestAnimationFrame(gameLoop);
    };

    this.animationId = requestAnimationFrame(gameLoop);
  }

  private stopGameLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private moveCurrentRow(): void {
    if (!this.state.currentRow) return;

    const row = this.state.currentRow;
    const { direction, positions } = row;

    // Calculate new positions
    const delta = direction === 'right' ? 1 : -1;
    const newPositions = positions.map(p => p + delta);

    // Check boundaries
    const leftMost = Math.min(...newPositions);
    const rightMost = Math.max(...newPositions);

    let newDirection = direction;

    if (direction === 'right' && rightMost >= GRID_WIDTH - 1) {
      // Hit right edge, reverse direction
      newDirection = 'left';
    } else if (direction === 'left' && leftMost <= 0) {
      // Hit left edge, reverse direction
      newDirection = 'right';
    }

    this.state.currentRow = {
      ...row,
      positions: newPositions,
      direction: newDirection,
    };

    this.emitStateChange();
  }

  private emitStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  // High score persistence
  private loadHighScore(): number {
    try {
      const stored = localStorage.getItem('cubestacker_highscore');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }

  private saveHighScore(score: number): void {
    try {
      localStorage.setItem('cubestacker_highscore', score.toString());
    } catch {
      // Ignore storage errors
    }
  }
}

// Singleton instance
let engineInstance: StackerEngine | null = null;

export function getEngine(): StackerEngine {
  if (!engineInstance) {
    engineInstance = new StackerEngine();
  }
  return engineInstance;
}

export function resetEngine(): void {
  if (engineInstance) {
    engineInstance.reset();
  }
  engineInstance = null;
}
