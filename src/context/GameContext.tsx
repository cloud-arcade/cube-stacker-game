/**
 * CubeStacker Game Context
 * Global state management for the game
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Game states
export type GameScreen = 'loading' | 'menu' | 'playing' | 'gameover';

// Context state shape
interface GameContextState {
  screen: GameScreen;
  score: number;
  highScore: number;
  level: number;
  stage: string;
  isPlatformConnected: boolean;
  userId: string | null;
  sessionId: string | null;
  isNewHighScore: boolean;
}

// Action types
type GameAction =
  | { type: 'SET_SCREEN'; payload: GameScreen }
  | { type: 'SET_SCORE'; payload: number }
  | { type: 'SET_HIGH_SCORE'; payload: number }
  | { type: 'SET_LEVEL'; payload: number }
  | { type: 'SET_STAGE'; payload: string }
  | { type: 'SET_PLATFORM_CONNECTED'; payload: boolean }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_NEW_HIGH_SCORE'; payload: boolean }
  | { type: 'GAME_OVER'; payload: { score: number; level: number; stage: string } }
  | { type: 'RESET_GAME' };

// Initial state
const initialState: GameContextState = {
  screen: 'loading',
  score: 0,
  highScore: loadHighScore(),
  level: 1,
  stage: 'ROOKIE',
  isPlatformConnected: false,
  userId: null,
  sessionId: null,
  isNewHighScore: false,
};

// High score persistence
function loadHighScore(): number {
  try {
    const stored = localStorage.getItem('cubestacker_highscore');
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number): void {
  try {
    localStorage.setItem('cubestacker_highscore', score.toString());
  } catch {
    // Ignore storage errors
  }
}

// Reducer
function gameReducer(state: GameContextState, action: GameAction): GameContextState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };
    case 'SET_SCORE':
      return { ...state, score: action.payload };
    case 'SET_HIGH_SCORE':
      saveHighScore(action.payload);
      return { ...state, highScore: action.payload };
    case 'SET_LEVEL':
      return { ...state, level: action.payload };
    case 'SET_STAGE':
      return { ...state, stage: action.payload };
    case 'SET_PLATFORM_CONNECTED':
      return { ...state, isPlatformConnected: action.payload };
    case 'SET_USER_ID':
      return { ...state, userId: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_NEW_HIGH_SCORE':
      return { ...state, isNewHighScore: action.payload };
    case 'GAME_OVER': {
      const { score, level, stage } = action.payload;
      const isNew = score > state.highScore;
      if (isNew) {
        saveHighScore(score);
      }
      return {
        ...state,
        screen: 'gameover',
        score,
        level,
        stage,
        highScore: isNew ? score : state.highScore,
        isNewHighScore: isNew,
      };
    }
    case 'RESET_GAME':
      return { 
        ...state,
        score: 0,
        level: 1,
        stage: 'ROOKIE',
        isNewHighScore: false,
        screen: 'playing',
      };
    default:
      return state;
  }
}

// Context
const GameContext = createContext<{
  state: GameContextState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

// Provider
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}

// Convenience hooks
export function useGameScreen() {
  const { state } = useGameContext();
  return state.screen;
}

export function useScore() {
  const { state } = useGameContext();
  return { score: state.score, highScore: state.highScore, isNewHighScore: state.isNewHighScore };
}

