/**
 * CubeStacker Game Screen
 * Premium arcade UI — brushed metals, glass, focused lighting
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';
import { useStackerInput } from '../../hooks/useStackerInput';
import { GameCanvas } from '../game/GameCanvas';
import { getEngine } from '../../game/engine';
import {
  getStageInfo, getStageForLevel,
  STAGES, GRID_WIDTH, GRID_HEIGHT, CELL_SIZE, LEVELS_PER_STAGE,
} from '../../game/constants';
import type { GameState as EngineState } from '../../game/types';

const SIDEBAR_WIDTH = 80;

// Helper to convert hex color to RGB string for rgba()
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

export function GameScreen() {
  const { dispatch } = useGameContext();
  const { submitScore, gameOver, endSession } = useCloudArcade();
  const [gameState, setGameState] = useState<EngineState | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [scale, setScale] = useState(1);
  const sessionRef = useRef<ReturnType<typeof setInterval>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scale to fit game in viewport
  useEffect(() => {
    const calculateScale = () => {
      const gameW = GRID_WIDTH * CELL_SIZE + SIDEBAR_WIDTH * 2;
      const gameH = GRID_HEIGHT * CELL_SIZE + 78 + 52; // header + footer heights
      const padding = 24;
      
      const availableW = window.innerWidth - padding;
      const availableH = window.innerHeight - padding;
      
      const scaleX = availableW / gameW;
      const scaleY = availableH / gameH;
      const newScale = Math.min(scaleX, scaleY, 1.2); // Cap at 1.2x max
      
      setScale(Math.max(0.4, newScale)); // Min 0.4x
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // Session timer
  useEffect(() => {
    sessionRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => { if (sessionRef.current) clearInterval(sessionRef.current); };
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Engine lifecycle
  useEffect(() => {
    const engine = getEngine();

    engine.onUpdate((state: EngineState) => {
      setGameState(state);

      if (state.phase === 'gameover') {
        const st = getStageInfo(state.level);
        dispatch({ type: 'GAME_OVER', payload: { score: state.score, level: state.level, stage: st.name } });
        submitScore(state.score, { level: state.level, stage: st.name, game: 'cubestacker' });
        gameOver(state.score, true);
        endSession();
      }
    });

    engine.start();
    setGameState(engine.getState());
  }, [dispatch, submitScore, gameOver, endSession]);

  const handleLock = useCallback(() => { getEngine().lockRow(); }, []);
  const lastTouchRef = useRef<number>(0);
  
  // Wrapper touch handler with its own debounce for wrapper-only touches
  const handleWrapperTouch = useCallback((e: React.TouchEvent) => {
    // Prevent double-tap issues
    const now = Date.now();
    if (now - lastTouchRef.current < 100) return;
    lastTouchRef.current = now;
    
    e.preventDefault();
    e.stopPropagation();
    handleLock();
  }, [handleLock]);
  
  useStackerInput({ onAction: handleLock, enabled: true });

  if (!gameState) {
    return <div className="screen screen--game"><div className="loading-text">Loading…</div></div>;
  }

  // Derived values
  const gameW = GRID_WIDTH * CELL_SIZE;
  const gameH = GRID_HEIGHT * CELL_SIZE;
  const totalW = SIDEBAR_WIDTH + gameW + SIDEBAR_WIDTH;
  const si = getStageForLevel(gameState.level);
  const stage = STAGES[si];
  const next = STAGES[si + 1];
  const lvl = gameState.level % LEVELS_PER_STAGE;
  const pct = next ? (lvl / LEVELS_PER_STAGE) * 100 : 100;

  // SVG gauge
  const R = 28, SW = 4, C = 2 * Math.PI * R;
  const dashOff = C * (1 - pct / 100);

  // Row indicators for side panels
  const rows = Array.from({ length: GRID_HEIGHT }, (_, i) => {
    const gr = GRID_HEIGHT - 1 - i;
    const abs = gr + gameState.gameOffset;
    const cp = STAGES.find((s, idx) => idx > 0 && s.row === abs + 1);
    return {
      i, checkpoint: cp,
      reached: cp ? gameState.level >= cp.row : false,
      passed: cp ? gameState.level > cp.row : false,
    };
  });

  const tierTarget = next ? `${next.name} TIER TARGET` : 'MAX TIER REACHED';

  return (
    <div className="screen screen--game" ref={containerRef}>
      <div 
        className="game-box" 
        style={{ 
          width: totalW,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >

        {/* ═══ TOP HEADER ═══ */}
        <div className="game-header">
          <div className="header-layout">
            {/* Left — Circular Level Gauge */}
            <div className="gauge-area">
              <div className="level-gauge">
                <svg className="gauge-ring" viewBox="0 0 72 72">
                  <defs>
                    {/* Glassmorphic background gradient */}
                    <radialGradient id="glassGrad" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
                    </radialGradient>
                    {/* Progress gradient from stage to next */}
                    <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={stage.color} />
                      <stop offset="100%" stopColor={next?.color || stage.color} />
                    </linearGradient>
                    {/* Glow filter */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Glassmorphic background disc */}
                  <circle cx="36" cy="36" r="34" fill="url(#glassGrad)"
                    stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  {/* Inner frosted ring */}
                  <circle cx="36" cy="36" r="30" fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  {/* Track */}
                  <circle cx="36" cy="36" r={R} fill="none"
                    stroke="rgba(255,255,255,0.1)" strokeWidth={SW + 1} strokeLinecap="round" />
                  {/* Progress arc with gradient */}
                  <circle cx="36" cy="36" r={R} fill="none"
                    stroke="url(#progressGrad)" strokeWidth={SW} strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={dashOff}
                    transform="rotate(-90 36 36)"
                    filter="url(#glow)"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                  {/* Top highlight for 3D glass effect */}
                  <ellipse cx="36" cy="24" rx="18" ry="8" fill="rgba(255,255,255,0.08)" />
                </svg>
                <div className="gauge-text">
                  <span className="gauge-num" style={{ textShadow: `0 1px 2px rgba(0,0,0,0.5), 0 0 20px ${stage.color}` }}>{gameState.level}</span>
                  <span className="gauge-lbl">LEVEL</span>
                </div>
              </div>
              <div className="gauge-sub">
                <span>SESSION:</span>
                <span>{fmt(sessionTime)}</span>
              </div>
            </div>

              {/* Center — tier name + progress */}
              <div className="header-center">
                <span className="tier-target">{tierTarget}</span>
                <div className="tier-names">
                  <span className="tier-current" style={{ color: stage.color }}>{stage.name}</span>
                  {next && (
                    <>
                      <span className="tier-arrow">→</span>
                      <span className="tier-next" style={{ color: next.color }}>{next.name}</span>
                    </>
                  )}
                </div>
                <div className="tier-bar-wrap">
                  <div className="tier-bar">
                    {[0, 1, 2, 3, 4, 5].map((notch) => {
                      const notchPct = (notch / 6) * 100;
                      const notchEndPct = ((notch + 1) / 6) * 100;
                      const fillPct = Math.max(0, Math.min(100, ((pct - notchPct) / (notchEndPct - notchPct)) * 100));
                      const isFilled = pct >= notchEndPct;
                      const isPartial = pct > notchPct && pct < notchEndPct;
                      const intensity = 0.3 + (notch / 5) * 0.7; // 0.3 to 1.0 increasing strongly
                      const hasContent = isFilled || isPartial;
                      const isLast = notch === 5;
                      return (
                        <div key={notch} className={`tier-notch${isLast ? ' tier-notch--last' : ''}`}>
                          <div
                            className={`tier-notch-fill${isLast ? ' tier-notch-fill--last' : ''}`}
                            style={{
                              width: isFilled ? '100%' : isPartial ? `${fillPct}%` : '0%',
                              background: hasContent
                                ? `linear-gradient(90deg, rgba(${hexToRgb(stage.color)}, ${intensity}), rgba(${hexToRgb(next?.color || stage.color)}, ${intensity}))`
                                : 'transparent',
                              opacity: hasContent ? 1 : 0,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right — best score */}
              <div className="header-right">
                <div className="best-block">
                  <span className="best-num">{gameState.highScore}</span>
                  <span className="best-lbl">BEST</span>
                </div>
            </div>
          </div>
        </div>

        {/* ═══ CONTENT ROW ═══ */}
        <div className="game-content-row">
          {/* Left panel */}
          <div className="game-panel game-panel--left" style={{ width: SIDEBAR_WIDTH }}>
            {rows.map(r => (
              <div
                key={r.i}
                className={`panel-cell${r.checkpoint ? ' panel-cell--cp' : ''}`}
                style={{ height: CELL_SIZE }}
              >
                {r.checkpoint && (
                  <div
                    className={`cp-marker${r.reached ? ' cp-on' : ''}${r.passed ? ' cp-done' : ''}`}
                    style={{ '--cp-c': r.checkpoint.color } as React.CSSProperties}
                  >
                    <span className="cp-dot">{r.passed ? '✓' : '○'}</span>
                    <span className="cp-name">{r.checkpoint.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Canvas with glass overlay */}
          <div 
            className="game-canvas-wrap" 
            style={{ width: gameW, height: gameH }}
            onTouchStart={handleWrapperTouch}
            onClick={(e) => {
              // Handle click only if directly on wrapper (not bubbled from canvas)
              if (e.target === e.currentTarget) {
                handleLock();
              }
            }}
          >
            <div className="glass-shine" />
            <GameCanvas gameState={gameState} onTap={handleLock} />
          </div>

          {/* Right panel */}
          <div className="game-panel game-panel--right" style={{ width: SIDEBAR_WIDTH }}>
            {rows.map(r => (
              <div
                key={r.i}
                className={`panel-cell panel-cell--R${r.checkpoint ? ' panel-cell--cp' : ''}`}
                style={{ height: CELL_SIZE }}
              >
                {r.checkpoint && (
                  <div
                    className={`cp-pip${r.reached ? ' cp-pip--on' : ''}`}
                    style={{ borderColor: r.checkpoint.color, background: r.reached ? r.checkpoint.color : 'transparent' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ BOTTOM CONTROLS ═══ */}
        <div className="game-footer">
          <div className="controls-row">
            <span className="ctrl-label">SPACE</span>
            <svg className="ctrl-kbd" viewBox="0 0 36 18" fill="none">
              <rect x="0.5" y="0.5" width="35" height="17" rx="2" stroke="currentColor" strokeWidth="0.5" />
              <rect x="2" y="2" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="7" y="2" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="12" y="2" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="17" y="2" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="22" y="2" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.25" />
              <rect x="27" y="2" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.2" />
              <rect x="32" y="2" width="2.5" height="2.8" rx="0.5" fill="currentColor" opacity="0.15" />
              <rect x="3" y="6" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="8" y="6" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="13" y="6" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="18" y="6" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="23" y="6" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.25" />
              <rect x="28" y="6" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.2" />
              <rect x="4" y="10" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="9" y="10" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="14" y="10" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="19" y="10" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.3" />
              <rect x="24" y="10" width="4" height="2.8" rx="0.5" fill="currentColor" opacity="0.25" />
              <rect x="8" y="13.5" width="20" height="3" rx="1" fill="currentColor" opacity="0.45" />
            </svg>
            <span className="ctrl-dot">•</span>
            <svg className="ctrl-tap" viewBox="0 0 24 30" fill="none">
              <path d="M12 3c-.8 0-1.5.7-1.5 1.5V14s-1.5-2-2.5-2.5c-1-.5-2.5 0-2 1l3 5.5h6l3-5.5c.5-1-1-1.5-2-1-.8.4-2.5 2.5-2.5 2.5V4.5C13.5 3.7 12.8 3 12 3Z"
                fill="currentColor" opacity="0.45" stroke="currentColor" strokeWidth="0.4" />
              <circle cx="12" cy="24" r="1.2" fill="currentColor" opacity="0.4" />
              <circle cx="12" cy="24" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
              <circle cx="12" cy="24" r="4.5" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.12" />
            </svg>
            <span className="ctrl-label">TAP</span>
          </div>
        </div>
      </div>

      {/* Techy corner decorations */}
      <div className="tech-corners">
        {/* Top-left corner bracket */}
        <svg className="corner-bracket corner-tl" viewBox="0 0 60 60" fill="none">
          <path d="M 0 15 L 0 0 L 15 0" stroke="rgba(96,165,250,0.6)" strokeWidth="2" strokeLinecap="square"/>
          <path d="M 0 10 L 0 0 L 10 0" stroke="rgba(96,165,250,0.3)" strokeWidth="1" strokeLinecap="square"/>
          <circle cx="18" cy="18" r="2" fill="rgba(96,165,250,0.8)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        {/* Top-right corner bracket */}
        <svg className="corner-bracket corner-tr" viewBox="0 0 60 60" fill="none">
          <path d="M 60 15 L 60 0 L 45 0" stroke="rgba(251,191,36,0.6)" strokeWidth="2" strokeLinecap="square"/>
          <path d="M 60 10 L 60 0 L 50 0" stroke="rgba(251,191,36,0.3)" strokeWidth="1" strokeLinecap="square"/>
          <circle cx="42" cy="18" r="2" fill="rgba(251,191,36,0.8)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        {/* Bottom-left corner bracket */}
        <svg className="corner-bracket corner-bl" viewBox="0 0 60 60" fill="none">
          <path d="M 0 45 L 0 60 L 15 60" stroke="rgba(74,222,128,0.6)" strokeWidth="2" strokeLinecap="square"/>
          <path d="M 0 50 L 0 60 L 10 60" stroke="rgba(74,222,128,0.3)" strokeWidth="1" strokeLinecap="square"/>
          <circle cx="18" cy="42" r="2" fill="rgba(74,222,128,0.8)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        {/* Bottom-right corner bracket */}
        <svg className="corner-bracket corner-br" viewBox="0 0 60 60" fill="none">
          <path d="M 60 45 L 60 60 L 45 60" stroke="rgba(248,113,113,0.6)" strokeWidth="2" strokeLinecap="square"/>
          <path d="M 60 50 L 60 60 L 50 60" stroke="rgba(248,113,113,0.3)" strokeWidth="1" strokeLinecap="square"/>
          <circle cx="42" cy="42" r="2" fill="rgba(248,113,113,0.8)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
    </div>
  );
}
