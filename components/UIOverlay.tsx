import React from 'react';
import { ItemType } from '../constants';
import { Volume2, VolumeX, RefreshCw, Trophy } from 'lucide-react';

interface UIOverlayProps {
  score: number;
  nextItem: ItemType;
  gameOver: boolean;
  onRestart: () => void;
  muted: boolean;
  onToggleMute: () => void;
  gameStarted: boolean;
  onStartGame: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  score,
  nextItem,
  gameOver,
  onRestart,
  muted,
  onToggleMute,
  gameStarted,
  onStartGame,
}) => {
  if (!gameStarted) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-[#fff8e7] p-8 rounded-[3rem] shadow-[0_8px_0_rgba(217,119,6,1)] border-4 border-amber-600 text-center max-w-sm mx-4 relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
          
          <div className="mb-6 text-7xl drop-shadow-lg">🎂</div>
          <h1 className="text-4xl font-black text-amber-800 mb-2 drop-shadow-sm">Tasty<br/>Cake Merge</h1>
          <p className="text-amber-700 mb-8 font-bold text-lg">Slide & Merge Upwards!</p>
          <button
            onClick={onStartGame}
            className="w-full py-4 bg-gradient-to-b from-green-400 to-green-600 text-white rounded-2xl text-2xl font-black shadow-[0_4px_0_#15803d] hover:scale-105 transition-transform active:scale-95 active:shadow-none translate-y-0"
          >
            PLAY
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HUD Container - Moved to BOTTOM to avoid covering the top pile */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pb-6 flex justify-between items-end pointer-events-none z-10 font-['Fredoka']">
        
        {/* Left: Settings */}
        <div className="flex flex-col gap-2 pointer-events-auto mb-4">
             <button
                onClick={onToggleMute}
                className="w-10 h-10 flex items-center justify-center bg-[#fff8e7] rounded-full border-2 border-amber-200 shadow-md text-amber-800 hover:bg-white transition-colors"
            >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
        </div>
       
        {/* Center: Score (Pill Shape) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8">
           <div className="bg-[#fff8e7] border-2 border-[#d97706] rounded-full px-1 py-1 pr-5 shadow-lg flex items-center gap-2 min-w-[140px]">
            {/* Coin Icon */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 border border-yellow-600 flex items-center justify-center shadow-inner">
                 <span className="text-yellow-800 font-bold text-lg">$</span>
            </div>
            {/* Score Text */}
            <span className="text-2xl font-black text-[#92400e] tracking-wide flex-1 text-center">{score}</span>
           </div>
        </div>

        {/* Right: Next Item Bubble */}
        <div className="flex flex-col items-center pointer-events-none mb-4">
             <div className="relative">
                <div className="w-16 h-16 bg-[#fff8e7] rounded-full border-4 border-amber-100 shadow-xl flex items-center justify-center overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-full"></div>
                    <span className="text-3xl filter drop-shadow-md">{nextItem.icon}</span>
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-900 shadow-sm">
                    NEXT
                </div>
             </div>
        </div>
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#fff8e7] p-6 rounded-[2rem] shadow-2xl border-4 border-amber-800 text-center max-w-xs mx-4 transform scale-110 relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                 <Trophy size={64} className="text-yellow-500 drop-shadow-lg stroke-[3px]" />
            </div>
            
            <h2 className="text-3xl font-black text-amber-900 mt-8 mb-1">Table Full!</h2>
            <p className="text-amber-700 mb-6 text-sm font-semibold">Too many desserts!</p>
            
            <div className="bg-amber-100/50 rounded-xl p-4 mb-6 border-2 border-amber-200">
                <p className="text-xs text-amber-600 uppercase font-black tracking-wider mb-1">Total Earned</p>
                <div className="flex items-center justify-center gap-2">
                     <span className="text-3xl">🪙</span>
                     <p className="text-5xl font-black text-amber-600">{score}</p>
                </div>
            </div>
            
            <button
              onClick={onRestart}
              className="w-full py-3 bg-gradient-to-b from-blue-400 to-blue-600 text-white rounded-xl text-xl font-black shadow-[0_4px_0_#1d4ed8] hover:brightness-110 active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={24} strokeWidth={3} />
              AGAIN
            </button>
          </div>
        </div>
      )}
    </>
  );
};