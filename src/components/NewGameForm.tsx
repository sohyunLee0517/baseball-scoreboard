import React, { useState } from 'react';
import { createGame } from '../api';
import { Game } from '../types';

interface Props {
  ownerId: string;
  onGameCreated: (game: Game) => void;
  onCancel: () => void;
}

export const NewGameForm: React.FC<Props> = ({ ownerId, onGameCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newGame = await createGame({
        ownerId,
        title,
        homeTeam,
        awayTeam,
        players: [],
        status: 'IN_PROGRESS'
      });
      onGameCreated(newGame);
    } catch (error) {
      console.error(error);
      alert('Failed to start game. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4">
        <button onClick={onCancel} className="mb-6 text-gray-400 hover:text-gray-600 flex items-center text-sm font-bold transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Cancel and Return
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 p-8 text-white">
                <h2 className="text-2xl font-black tracking-tight mb-2">Initialize New Game</h2>
                <p className="text-blue-100 text-sm opacity-80">Enter team names and a title to start a new scoreboard session.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Match Title</label>
                    <input 
                        type="text" required 
                        value={title} onChange={e => setTitle(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="e.g. 2024 Spring Tournament Final"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Home Team</label>
                        <input 
                            type="text" required 
                            value={homeTeam} onChange={e => setHomeTeam(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                            placeholder="Home Giants"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Away Team</label>
                        <input 
                            type="text" required 
                            value={awayTeam} onChange={e => setAwayTeam(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-lg font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                            placeholder="Away Tigers"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white rounded-2xl py-5 text-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 disabled:opacity-50 transition-all transform active:scale-[0.98]"
                    >
                        {isSubmitting ? 'Initializing...' : 'Start Scoring Now'}
                    </button>
                    <p className="text-center text-gray-400 text-xs mt-4">You can register players after starting the game.</p>
                </div>
            </form>
        </div>
    </div>
  );
};
