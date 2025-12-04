import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { DESSERT_TYPES, ItemType, PHYSICS } from './constants';
import { audioManager } from './utils/audio';

export default function App() {
  const [score, setScore] = useState(0);
  const [nextItem, setNextItem] = useState<ItemType>(DESSERT_TYPES[0]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [restartTrigger, setRestartTrigger] = useState(0);
  const [muted, setMuted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
    audioManager.playBGM();
  };

  const handleRestart = () => {
    setScore(0);
    setIsGameOver(false);
    setRestartTrigger(prev => prev + 1);
  };

  const handleToggleMute = () => {
    const isMuted = audioManager.toggleMute();
    setMuted(isMuted);
  };

  return (
    <div className="w-full h-[100dvh] relative flex items-center justify-center overflow-hidden select-none font-['Fredoka'] bg-[#fff1f2]">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20" style={{
             backgroundImage: 'radial-gradient(#f43f5e 2px, transparent 2px)',
             backgroundSize: '32px 32px'
      }}></div>

      {/* Main Game Container - Responsive sizing 
          Increased max-width for tablets to look more like a wide table
      */}
      <div className="relative z-10 w-full h-full md:h-[95vh] md:max-w-[600px] flex flex-col shadow-2xl md:rounded-xl overflow-hidden bg-[#d4a373]">
        
        {/* Top Boundary Wall (Visual Overlay) 
            We make this absolute so the Canvas goes UNDER it, but physics will stop balls at the edge.
        */}
        <div 
            className="absolute top-0 left-0 right-0 z-20 bg-[#5D4037] shadow-lg border-b-4 border-[#3E2723]"
            style={{ height: PHYSICS.TOP_BOUNDARY_OFFSET }}
        >
            {/* Wood texture on the wall */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            {/* Highlights to make it look 3D - Inner bevel */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/20"></div>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-black/40"></div>
        </div>

        {/* Game Area (Table Surface) 
            The canvas now fills the top area as well (under the overlay), 
            but the physics engine will have a wall matching the overlay height.
        */}
        <div className="flex-1 relative overflow-hidden bg-[#d4a373]">
          {/* Wood Grain Texture Layer - Subtle */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,#3e2723_40px,#3e2723_41px)]"></div>
          
          <GameCanvas
            gameStarted={gameStarted}
            isGameOver={isGameOver}
            restartTrigger={restartTrigger}
            onScoreUpdate={(points) => setScore(prev => prev + points)}
            onNextItemChange={setNextItem}
            onGameOver={() => setIsGameOver(true)}
          />
          
          <UIOverlay
            score={score}
            nextItem={nextItem}
            gameOver={isGameOver}
            onRestart={handleRestart}
            muted={muted}
            onToggleMute={handleToggleMute}
            gameStarted={gameStarted}
            onStartGame={handleStartGame}
          />
        </div>

        {/* Bottom Shelf / Launcher Base Area */}
        <div className="h-5 bg-[#5D4037] z-20 w-full flex-shrink-0 flex items-center justify-center relative shadow-[0_-5px_15px_rgba(0,0,0,0.3)] border-t-2 border-[#3E2723]">
           {/* Wood Texture */}
           <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,#000_20px,#000_21px)]"></div>
        </div>
      </div>
    </div>
  );
}