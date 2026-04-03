/**
 * CubeStacker Game Canvas
 * Premium canvas renderer with polished visuals
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  STAGES,
  FALL_ANIMATION_DURATION,
  getStageForLevel,
} from '../../game/constants';
import type { GameState, LockedBlock, FallingBlock } from '../../game/types';

interface GameCanvasProps {
  gameState: GameState;
  onTap: () => void;
}

export function GameCanvas({ gameState, onTap }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTouchTimeRef = useRef<number>(0);
  const animationRef = useRef<number>();

  const canvasWidth = GRID_WIDTH * CELL_SIZE;
  const canvasHeight = GRID_HEIGHT * CELL_SIZE;

  // Calculate checkpoint rows visible on screen
  // Checkpoints are at rows 6, 12, 18, etc. (every LEVELS_PER_STAGE)
  const visibleCheckpoints = useMemo(() => {
    const checkpoints: Array<{
      stageIndex: number;
      stageName: string;
      color: string;
      visualRow: number; // Row position on canvas (0 = bottom)
      isReached: boolean;
    }> = [];
    
    for (let i = 1; i < STAGES.length; i++) {
      const stage = STAGES[i];
      // The checkpoint row in absolute terms
      const checkpointRow = stage.row; // e.g., 6, 12, 18...
      // Convert to visual row accounting for scroll offset
      const visualRow = checkpointRow - gameState.gameOffset;
      
      // Only show if visible on screen (between rows 1 and 16)
      if (visualRow >= 1 && visualRow <= GRID_HEIGHT) {
        checkpoints.push({
          stageIndex: i,
          stageName: stage.name,
          color: stage.color,
          visualRow,
          isReached: gameState.level >= checkpointRow,
        });
      }
    }
    return checkpoints;
  }, [gameState.gameOffset, gameState.level]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    // Clear with lighter frosted-glass background (sync with CSS canvas-wrap)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGrad.addColorStop(0, '#1a2230');
    bgGrad.addColorStop(0.5, '#151c28');
    bgGrad.addColorStop(1, '#101820');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid with thicker outer border
    drawGrid(ctx, canvasWidth, canvasHeight);

    // Draw checkpoint zones (before blocks)
    drawCheckpointZones(ctx, visibleCheckpoints, canvasWidth, canvasHeight, timestamp);

    // Draw locked blocks
    drawLockedBlocks(ctx, gameState.lockedBlocks, canvasHeight, gameState.level);

    // Draw falling blocks
    drawFallingBlocks(ctx, gameState.fallingBlocks, timestamp, canvasHeight);

    // Draw current moving row
    if (gameState.currentRow) {
      const stageIndex = getStageForLevel(gameState.level);
      drawMovingRow(
        ctx, 
        gameState.currentRow.positions, 
        gameState.currentRow.row, 
        stageIndex,
        canvasHeight,
        timestamp
      );
    }

    // Draw thick outer border
    drawOuterBorder(ctx, canvasWidth, canvasHeight);
  }, [gameState, visibleCheckpoints, canvasWidth, canvasHeight]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (timestamp: number) => {
      draw(ctx, timestamp);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={(e) => {
        // Prevent click if this was triggered by a recent touch (prevents double-fire on mobile)
        const now = Date.now();
        if (now - lastTouchTimeRef.current < 300) {
          e.preventDefault();
          return;
        }
        onTap();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        lastTouchTimeRef.current = Date.now();
        onTap();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="game-canvas"
    />
  );
}

// Draw grid with clean white lines on frosted glass
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Clean white grid lines (brighter for lighter theme)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;

  for (let x = 1; x < GRID_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE + 0.5, 0);
    ctx.lineTo(x * CELL_SIZE + 0.5, height);
    ctx.stroke();
  }

  for (let y = 1; y < GRID_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE + 0.5);
    ctx.lineTo(width, y * CELL_SIZE + 0.5);
    ctx.stroke();
  }
  // No center dots - just clean grid lines
}

// Glassmorphic inner shadow frame — creates glass panel effect
function drawOuterBorder(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const r = 8; // Corner radius for rounded glass panel

  // — Inner shadow gradient on all edges (lighter glass depth) —
  // Top inner shadow
  const topShadow = ctx.createLinearGradient(0, 0, 0, 18);
  topShadow.addColorStop(0, 'rgba(0,0,0,0.28)');
  topShadow.addColorStop(0.5, 'rgba(0,0,0,0.08)');
  topShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topShadow;
  ctx.fillRect(0, 0, width, 18);

  // Bottom inner shadow
  const botShadow = ctx.createLinearGradient(0, height, 0, height - 16);
  botShadow.addColorStop(0, 'rgba(0,0,0,0.22)');
  botShadow.addColorStop(0.5, 'rgba(0,0,0,0.06)');
  botShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = botShadow;
  ctx.fillRect(0, height - 16, width, 16);

  // Left inner shadow
  const leftShadow = ctx.createLinearGradient(0, 0, 14, 0);
  leftShadow.addColorStop(0, 'rgba(0,0,0,0.18)');
  leftShadow.addColorStop(0.5, 'rgba(0,0,0,0.05)');
  leftShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = leftShadow;
  ctx.fillRect(0, 0, 14, height);

  // Right inner shadow
  const rightShadow = ctx.createLinearGradient(width, 0, width - 14, 0);
  rightShadow.addColorStop(0, 'rgba(0,0,0,0.18)');
  rightShadow.addColorStop(0.5, 'rgba(0,0,0,0.05)');
  rightShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rightShadow;
  ctx.fillRect(width - 14, 0, 14, height);

  // — Corner darkening for depth (softer) —
  const cornerSize = 26;
  // Top-left
  const tlGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, cornerSize);
  tlGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
  tlGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tlGrad;
  ctx.fillRect(0, 0, cornerSize, cornerSize);
  // Top-right
  const trGrad = ctx.createRadialGradient(width, 0, 0, width, 0, cornerSize);
  trGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
  trGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = trGrad;
  ctx.fillRect(width - cornerSize, 0, cornerSize, cornerSize);
  // Bottom-left
  const blGrad = ctx.createRadialGradient(0, height, 0, 0, height, cornerSize);
  blGrad.addColorStop(0, 'rgba(0,0,0,0.14)');
  blGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = blGrad;
  ctx.fillRect(0, height - cornerSize, cornerSize, cornerSize);
  // Bottom-right
  const brGrad = ctx.createRadialGradient(width, height, 0, width, height, cornerSize);
  brGrad.addColorStop(0, 'rgba(0,0,0,0.14)');
  brGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = brGrad;
  ctx.fillRect(width - cornerSize, height - cornerSize, cornerSize, cornerSize);

  // — Top glass edge highlight (brighter) —
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r, 0.5);
  ctx.lineTo(width - r, 0.5);
  ctx.stroke();

  // — Subtle inner border —
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

// Subtle glassmorphic checkpoint zones
function drawCheckpointZones(
  ctx: CanvasRenderingContext2D, 
  checkpoints: Array<{ stageName: string; color: string; visualRow: number; stageIndex: number; isReached: boolean }>,
  width: number,
  _height: number,
  _timestamp: number
) {
  checkpoints.forEach(checkpoint => {
    const rowFromTop = GRID_HEIGHT - checkpoint.visualRow;
    const y = rowFromTop * CELL_SIZE;
    const h = CELL_SIZE;
    const cy = y + h / 2;

    // Parse hex color → RGB
    const hex = checkpoint.color.replace('#', '');
    const cr = parseInt(hex.substring(0, 2), 16);
    const cg = parseInt(hex.substring(2, 4), 16);
    const cb = parseInt(hex.substring(4, 6), 16);
    const rgba = (r: number, g: number, b: number, a: number) => `rgba(${r},${g},${b},${a})`;

    ctx.save();

    // — Subtle frosted glass background —
    const glassGrad = ctx.createLinearGradient(0, y, 0, y + h);
    glassGrad.addColorStop(0, 'rgba(255,255,255,0.04)');
    glassGrad.addColorStop(0.5, 'rgba(255,255,255,0.07)');
    glassGrad.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(0, y, width, h);

    // Thin top edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();

    // Thin bottom edge shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y + h - 0.5);
    ctx.lineTo(width, y + h - 0.5);
    ctx.stroke();

    // — Clean stage indicator dot + text —
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '500 9px Inter, system-ui, sans-serif';
    
    // Small color indicator dot
    const dotRadius = 3;
    const dotX = width / 2 - ctx.measureText(checkpoint.stageName).width / 2 - 8;
    ctx.fillStyle = checkpoint.isReached 
      ? rgba(cr, cg, cb, 0.8) 
      : rgba(cr, cg, cb, 0.35);
    ctx.beginPath();
    ctx.arc(dotX, cy, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle glow around dot if reached
    if (checkpoint.isReached) {
      ctx.fillStyle = rgba(cr, cg, cb, 0.15);
      ctx.beginPath();
      ctx.arc(dotX, cy, dotRadius + 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Clean text label
    ctx.fillStyle = checkpoint.isReached 
      ? 'rgba(255,255,255,0.65)' 
      : 'rgba(255,255,255,0.35)';
    ctx.fillText(checkpoint.stageName, width / 2 + 2, cy);

    ctx.restore();
  });
}

// Draw locked blocks with stage-based colors
function drawLockedBlocks(
  ctx: CanvasRenderingContext2D, 
  blocks: LockedBlock[],
  canvasHeight: number,
  currentLevel: number
) {
  blocks.forEach(block => {
    drawBlock(ctx, block.col, block.row, block.stageIndex, 1, canvasHeight, false, currentLevel);
  });
}

// Draw falling blocks with animation
function drawFallingBlocks(
  ctx: CanvasRenderingContext2D, 
  blocks: FallingBlock[], 
  timestamp: number,
  canvasHeight: number
) {
  blocks.forEach(block => {
    const elapsed = timestamp - block.startTime;
    const progress = Math.min(elapsed / FALL_ANIMATION_DURATION, 1);
    const eased = progress * progress * progress;
    
    const startY = block.row;
    const endY = block.targetY;
    const currentY = startY + (endY - startY) * eased;
    const opacity = Math.max(0, 1 - progress * 1.5);
    
    drawBlock(ctx, block.col, currentY, block.stageIndex, opacity, canvasHeight, false, 0);
  });
}

// Draw moving row with enhanced glow
function drawMovingRow(
  ctx: CanvasRenderingContext2D, 
  positions: number[], 
  row: number, 
  stageIndex: number,
  canvasHeight: number,
  timestamp: number
) {
  positions.forEach(col => {
    if (col >= 0 && col < GRID_WIDTH) {
      drawBlock(ctx, col, row, stageIndex, 1, canvasHeight, true, 0, timestamp);
    }
  });
}

// Draw a single block — clean 3D cubes with glow and inset shadow
function drawBlock(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  stageIndex: number,
  opacity: number,
  canvasHeight: number,
  isActive: boolean,
  _currentLevel: number = 0,
  timestamp: number = 0
) {
  const stage = STAGES[stageIndex] || STAGES[0];
  const x = col * CELL_SIZE;
  const y = canvasHeight - (row + 1) * CELL_SIZE;
  const pad = 2;
  const sz = CELL_SIZE - pad * 2;
  const r = 4;

  // Parse stage color
  const hex = stage.color.replace('#', '');
  const cr = parseInt(hex.substring(0, 2), 16);
  const cg = parseInt(hex.substring(2, 4), 16);
  const cb = parseInt(hex.substring(4, 6), 16);

  ctx.save();
  ctx.globalAlpha = opacity;

  if (isActive) {
    // — Active block: clean with subtle pulse glow —
    const pulse = Math.sin(timestamp / 180) * 0.15 + 0.85;
    
    // Soft outer glow
    ctx.shadowColor = stage.color;
    ctx.shadowBlur = 12 * pulse;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Main block fill
    ctx.fillStyle = stage.color;
    ctx.globalAlpha = 0.7 * opacity * pulse;
    roundRect(ctx, x + pad, y + pad, sz, sz, r);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = opacity;

    // 3D white highlight gradient (top-left light source)
    const highlight = ctx.createLinearGradient(x + pad, y + pad, x + pad + sz * 0.6, y + pad + sz * 0.6);
    highlight.addColorStop(0, 'rgba(255,255,255,0.55)');
    highlight.addColorStop(0.3, 'rgba(255,255,255,0.20)');
    highlight.addColorStop(0.6, 'rgba(255,255,255,0.05)');
    highlight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = highlight;
    roundRect(ctx, x + pad, y + pad, sz, sz, r);
    ctx.fill();

    // Top edge white highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + pad + r, y + pad + 0.5);
    ctx.lineTo(x + pad + sz - r, y + pad + 0.5);
    ctx.stroke();

    // Subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.5;
    roundRect(ctx, x + pad, y + pad, sz, sz, r);
    ctx.stroke();
  } else {
    // — Static block: clean 3D cube with white highlight and inset shadow —
    
    // Subtle outer glow
    ctx.shadowColor = `rgba(${cr},${cg},${cb},0.4)`;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    // Main solid fill
    ctx.fillStyle = stage.color;
    roundRect(ctx, x + pad, y + pad, sz, sz, r);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 3D highlight gradient (light from top-left)
    const highlight = ctx.createLinearGradient(x + pad, y + pad, x + pad + sz * 0.7, y + pad + sz * 0.7);
    highlight.addColorStop(0, 'rgba(255,255,255,0.45)');
    highlight.addColorStop(0.25, 'rgba(255,255,255,0.18)');
    highlight.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    highlight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = highlight;
    roundRect(ctx, x + pad, y + pad, sz, sz, r);
    ctx.fill();

    // Inner inset shadow (bottom-right for 3D depth)
    const insetShadow = ctx.createLinearGradient(x + pad + sz * 0.5, y + pad + sz * 0.5, x + pad + sz, y + pad + sz);
    insetShadow.addColorStop(0, 'rgba(0,0,0,0)');
    insetShadow.addColorStop(0.6, 'rgba(0,0,0,0.08)');
    insetShadow.addColorStop(1, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = insetShadow;
    roundRect(ctx, x + pad, y + pad, sz, sz, r);
    ctx.fill();

    // Crisp top highlight (white light edge)
    ctx.strokeStyle = 'rgba(255,255,255,0.50)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + pad + r, y + pad + 0.5);
    ctx.lineTo(x + pad + sz - r, y + pad + 0.5);
    ctx.stroke();

    // Left edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(x + pad + 0.5, y + pad + r);
    ctx.lineTo(x + pad + 0.5, y + pad + sz - r);
    ctx.stroke();

    // Bottom edge shadow line
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(x + pad + r, y + pad + sz - 0.5);
    ctx.lineTo(x + pad + sz - r, y + pad + sz - 0.5);
    ctx.stroke();

    // Right edge shadow line
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + pad + sz - 0.5, y + pad + r);
    ctx.lineTo(x + pad + sz - 0.5, y + pad + sz - r);
    ctx.stroke();
  }

  ctx.restore();
}

// Helper for rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
