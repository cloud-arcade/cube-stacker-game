/**
 * CubeStacker Game Container
 * Main container that manages game screens
 */

import { useGameContext } from '../context/GameContext';
import { LoadingScreen } from './screens/LoadingScreen';
import { MenuScreen } from './screens/MenuScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';

export function GameContainer() {
  const { state } = useGameContext();
  const { screen } = state;

  return (
    <div className="game-container">
      {screen === 'loading' && <LoadingScreen />}
      {screen === 'menu' && <MenuScreen />}
      {screen === 'playing' && <GameScreen />}
      {screen === 'gameover' && <GameOverScreen />}
    </div>
  );
}
