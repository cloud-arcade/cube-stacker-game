/**
 * CubeStacker Loading Screen
 * Premium glassmorphic loading animation
 */

import { useEffect, useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { STAGES } from '../../game/constants';

export function LoadingScreen() {
  const { dispatch } = useGameContext();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 25 + 8;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            dispatch({ type: 'SET_SCREEN', payload: 'menu' });
          }, 300);
          return 100;
        }
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Calculate which notch we're in (6 notches like the tier bar)
  const notchProgress = Math.min(progress, 100);

  return (
    <div className="screen screen--loading">
      <div className="loading-card">
        <h1 className="logo">
          <span className="logo-cube">CUBE</span>
          <span className="logo-stacker">STACKER</span>
        </h1>
        
        <div className="loading-bar-wrap">
          <div className="loading-bar">
            {[0, 1, 2, 3, 4, 5].map((notch) => {
              const notchPct = (notch / 6) * 100;
              const notchEndPct = ((notch + 1) / 6) * 100;
              const fillPct = Math.max(0, Math.min(100, ((notchProgress - notchPct) / (notchEndPct - notchPct)) * 100));
              const isFilled = notchProgress >= notchEndPct;
              const isPartial = notchProgress > notchPct && notchProgress < notchEndPct;
              const intensity = 0.3 + (notch / 5) * 0.7;
              const hasContent = isFilled || isPartial;
              const stageColor = STAGES[notch % STAGES.length].color;
              const nextColor = STAGES[(notch + 1) % STAGES.length].color;
              return (
                <div key={notch} className={`loading-notch${notch === 5 ? ' loading-notch--last' : ''}`}>
                  <div
                    className={`loading-notch-fill${notch === 5 ? ' loading-notch-fill--last' : ''}`}
                    style={{
                      width: isFilled ? '100%' : isPartial ? `${fillPct}%` : '0%',
                      background: hasContent
                        ? `linear-gradient(90deg, ${stageColor}, ${nextColor})`
                        : 'transparent',
                      opacity: hasContent ? intensity : 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        <p className="loading-text">Loading{progress < 100 ? '...' : ''}</p>
      </div>
    </div>
  );
}
