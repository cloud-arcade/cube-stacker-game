/**
 * CubeStacker Game Hook
 * React hook for managing game state and lifecycle
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getEngine, StackerEngine, type GameState } from '../game';
import { useCloudArcade } from './useCloudArcade';

interface UseStackerGameReturn {
  gameState: GameState | null;
  isPlaying: boolean;
  startGame: () => void;
  stopGame: () => void;
  lockRow: () => void;
}

export function useStackerGame(): UseStackerGameReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const engineRef = useRef<StackerEngine | null>(null);
  const { submitScore, gameOver: platformGameOver, endSession } = useCloudArcade();

  // Initialize engine
  useEffect(() => {
    const engine = getEngine();
    engineRef.current = engine;

    // Subscribe to state changes
    engine.onUpdate((state) => {
      setGameState(state);
    });

    // Handle game over
    engine.onEnd((score) => {
      submitScore(score, { game: 'cubestacker' });
      platformGameOver(score, true);
      endSession();
    });

    // Set initial state
    setGameState(engine.getState());

    return () => {
      engine.stop();
    };
  }, [submitScore, platformGameOver, endSession]);

  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  const stopGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
  }, []);

  const lockRow = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.lockRow();
    }
  }, []);

  const isPlaying = gameState?.phase === 'moving' || gameState?.phase === 'locked' || gameState?.phase === 'falling';

  return {
    gameState,
    isPlaying,
    startGame,
    stopGame,
    lockRow,
  };
}
