/**
 * CubeStacker Menu Screen
 * Premium glassmorphic main menu
 */

import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';
import { STAGES } from '../../game/constants';

export function MenuScreen() {
  const { state, dispatch } = useGameContext();
  const { startSession } = useCloudArcade();

  const handleStart = () => {
    startSession();
    dispatch({ type: 'RESET_GAME' });
  };

  return (
    <div className="screen screen--menu">
      <div className="menu-card">
        <div className="menu-header">
          <h1 className="logo">
            <span className="logo-cube">CUBE</span>
            <span className="logo-stacker">STACKER</span>
          </h1>
          <p className="menu-tagline">Stack to the top. How far can you go?</p>
        </div>
        
        <div className="menu-body">
          {state.highScore > 0 && (
            <div className="menu-highscore">
              <span className="highscore-value">{state.highScore}</span>
              <span className="highscore-label">BEST</span>
            </div>
          )}
          
          <button className="btn btn--primary btn--large" onClick={handleStart}>
            PLAY
          </button>
          
          <div className="menu-stages">
            <span className="stages-label">STAGES</span>
            <div className="stages-list">
              {STAGES.map((stage) => (
                <div 
                  key={stage.name} 
                  className="stage-chip"
                  style={{ '--stage-color': stage.color } as React.CSSProperties}
                >
                  <span className="stage-chip-dot" />
                  <span className="stage-chip-name">{stage.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="menu-footer-inner">
          <div className="menu-instructions">
            <span className="instruction-key">SPACE</span>
            <span className="instruction-or">or</span>
            <span className="instruction-key">TAP</span>
            <span className="instruction-text">to stop blocks</span>
          </div>
        </div>
      </div>
      
      <div className="menu-footer">
        {state.isPlatformConnected ? (
          <span className="status status--connected">
            <span className="status-dot" />
            Connected
          </span>
        ) : (
          <span className="status">Standalone Mode</span>
        )}
      </div>
    </div>
  );
}
