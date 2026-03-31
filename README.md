# 🎮 Cube Stacker

A modern arcade stacking game with glassmorphic UI and progressive difficulty tiers. Stack moving rows of blocks perfectly to climb through 6 challenging stages, from Rookie to Legend.

Built with React + Canvas for CloudArcade platform.

## 🎯 How to Play

**Goal:** Stack blocks perfectly to reach the highest level possible.

**Controls:**
- **SPACE** or **TAP/CLICK** - Lock the moving row in place

**Gameplay:**
1. Rows of blocks move horizontally back and forth
2. Press SPACE (or tap) to lock the row
3. Only blocks aligned with the row below will stack successfully
4. Misaligned blocks fall away, making the next row harder
5. Game ends when you miss completely

**Progression:**
- **6 Difficulty Tiers** - Rookie → Pro → Elite → Master → Grandmaster → Legend
- **Faster Movement** - Each tier increases block speed
- **Color-Coded Stages** - Visual feedback shows your tier progress
- **High Score Tracking** - Beat your personal best

## ✨ Features

- **Modern Glassmorphic UI** - Clean frosted glass aesthetics with subtle animations
- **Progressive Difficulty** - 6 tiers with increasing speed and challenge
- **3D Block Rendering** - Blocks with highlights, shadows, and stage-colored glows
- **Visual Feedback** - Checkpoint indicators, circular level gauge, notched progress bar
- **Responsive Design** - Works on desktop and mobile with touch support
- **High Score Persistence** - Local storage tracks your best performance
- **CloudArcade Integration** - Full platform communication for leaderboards and sessions

## 🚀 Quick Start

### Play Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Game runs at http://localhost:3000

### Build for Production

```bash
npm run build
```

Output in `dist/` folder ready for deployment.

## 🛠️ Tech Stack

- **React 18** + **TypeScript** - Component-based UI with type safety
- **Canvas API** - Custom game rendering engine
- **Vite** - Fast development and optimized builds
- **CSS Custom Properties** - Dynamic theming and stage colors
- **LocalStorage** - High score persistence
- **CloudArcade API** - Platform integration via postMessage

## 📁 Project Structure

```
src/
├── components/
│   ├── screens/           # Menu, Loading, Game, GameOver screens
│   ├── game/              # GameCanvas, GameHUD components
│   └── ui/                # Button, overlays
├── game/
│   ├── engine.ts          # Core game loop and state management
│   ├── constants.ts       # Tiers, grid config, stage definitions
│   └── types.ts           # Game state interfaces
├── hooks/
│   ├── useCloudArcade.ts  # Platform integration
│   ├── useStackerGame.ts  # Game engine lifecycle
│   └── useStackerInput.ts # Keyboard/touch controls
└── context/
    └── GameContext.tsx    # Global app state
```

## 🎨 Game Stages

| Stage | Level Range | Speed | Color |
|-------|-------------|-------|-------|
| **Rookie** | 1-10 | 1.0x | Blue |
| **Pro** | 11-20 | 1.3x | Cyan |
| **Elite** | 21-30 | 1.6x | Green |
| **Master** | 31-40 | 2.0x | Orange |
| **Grandmaster** | 41-50 | 2.5x | Red |
| **Legend** | 51+ | 3.0x | Purple |

## 📜 License

MIT

---

Built for [CloudArcade](https://cloudarcade.com)
