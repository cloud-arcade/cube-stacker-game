/**
 * CubeStacker Game Over Screen
 * Premium glassmorphic results display
 */

import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';
import { STAGES, getStageForLevel } from '../../game/constants';
import { resetEngine } from '../../game/engine';

export function GameOverScreen() {
  const { state, dispatch } = useGameContext();
  const { startSession } = useCloudArcade();

  const stageIndex = getStageForLevel(state.level);
  const stage = STAGES[stageIndex];

  const handlePlayAgain = () => {
    resetEngine();
    startSession();
    dispatch({ type: 'RESET_GAME' });
  };

  const handleMenu = () => {
    resetEngine();
    dispatch({ type: 'SET_SCREEN', payload: 'menu' });
  };

  return (
    <div className="screen screen--gameover">
      <div className="gameover-card">
        <div className="gameover-header">
          <h1 className="gameover-title">GAME OVER</h1>
          {state.isNewHighScore && (
            <div className="gameover-newhigh">
              <span className="newhigh-star">★</span>
              NEW BEST
              <span className="newhigh-star">★</span>
            </div>
          )}
        </div>

        <div className="gameover-stats">
          <div className="gameover-score">
            <span className="score-number">{state.score}</span>
            <span className="score-label">LEVELS CLEARED</span>
          </div>

          <div className="gameover-stage">
            <span className="stage-reached-label">REACHED</span>
            <div className="stage-reached-badge" style={{ '--stage-color': stage.color } as React.CSSProperties}>
              <span className="stage-dot-glow" />
              <span className="stage-name">{stage.name}</span>
            </div>
          </div>

          <div className="gameover-best">
            <span className="best-value">{state.highScore}</span>
            <span className="best-label">BEST</span>
          </div>
        </div>

        <div className="gameover-actions">
          <button className="btn btn--primary btn--large" onClick={handlePlayAgain}>
            PLAY AGAIN
          </button>
          <button className="btn btn--ghost" onClick={handleMenu}>
            MENU
          </button>
        </div>
      </div>
    </div>
  );
}
