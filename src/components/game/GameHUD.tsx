/**
 * CubeStacker Game HUD
 * Premium header with stage progression and level-up effects
 */

import { useState, useEffect, useRef } from 'react';
import { STAGES, getStageForLevel, getSpeedForLevel, BASE_SPEED, LEVELS_PER_STAGE, GRID_WIDTH, CELL_SIZE } from '../../game/constants';
import type { GameState } from '../../game/types';

interface GameHUDProps {
  gameState: GameState;
  onLevelUp?: (stageName: string, stageColor: string) => void;
}

export function GameHUD({ gameState, onLevelUp }: GameHUDProps) {
  const { level } = gameState;
  const stageIndex = getStageForLevel(level);
  const stage = STAGES[stageIndex];
  const nextStage = STAGES[stageIndex + 1];
  const lastStageRef = useRef(stageIndex);
  
  // Level-up flash effect
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  
  // Speed calculation
  const currentSpeed = getSpeedForLevel(level);
  const speedMultiplier = (BASE_SPEED / currentSpeed).toFixed(1);
  
  // Progress within current stage
  const levelInStage = level % LEVELS_PER_STAGE;
  const progressPercent = nextStage ? (levelInStage / LEVELS_PER_STAGE) * 100 : 100;

  // Detect stage transitions
  useEffect(() => {
    if (stageIndex > lastStageRef.current) {
      setIsLevelingUp(true);
      onLevelUp?.(stage.name, stage.color);
      setTimeout(() => setIsLevelingUp(false), 800);
    }
    lastStageRef.current = stageIndex;
  }, [stageIndex, stage.name, stage.color, onLevelUp]);

  return (
    <div 
      className={`game-hud ${isLevelingUp ? 'game-hud--levelup' : ''}`}
      style={{ 
        width: GRID_WIDTH * CELL_SIZE,
        '--stage-color': stage.color 
      } as React.CSSProperties}
    >
      {/* Level-up flash overlay */}
      {isLevelingUp && (
        <div className="hud-levelup-flash" style={{ background: stage.color }} />
      )}
      
      {/* Main stats row */}
      <div className="hud-stats">
        <div className="hud-stat">
          <span className="hud-stat-value">{level}</span>
          <span className="hud-stat-label">LEVEL</span>
        </div>
        
        <div className="hud-stage-display">
          <span 
            className={`hud-stage-name ${isLevelingUp ? 'hud-stage-name--pop' : ''}`}
            style={{ color: stage.color }}
          >
            {stage.name}
          </span>
          <div className="hud-stage-glow" style={{ background: stage.color }} />
        </div>
      </div>
      
      {/* Progress bar to next stage */}
      {nextStage && (
        <div className="hud-progress-container">
          <div className="hud-progress-track">
            <div 
              className="hud-progress-fill"
              style={{ 
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${stage.color}, ${nextStage.color})`
              }}
            />
          </div>
          <span className="hud-next-label" style={{ color: nextStage.color }}>
            {nextStage.name}
          </span>
        </div>
      )}
      
      {/* Speed indicator */}
      <div className="hud-speed">
        <span className="hud-speed-label">SPEED</span>
        <span className="hud-speed-value" style={{ color: stage.color }}>{speedMultiplier}x</span>
      </div>
    </div>
  );
}
