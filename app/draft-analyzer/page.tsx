"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DraftAnalyzerPage() {
  const [draftUrl, setDraftUrl] = useState('');
  const [leagueType, setLeagueType] = useState('standard');
  const [superflexSlots, setSuperflexSlots] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const leagueTypes = [
    {
      id: 'standard',
      name: 'Standard (1 QB)',
      description: 'QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1 (9 starters)',
      icon: '🏈'
    },
    {
      id: 'superflex',
      name: '🦸 Superflex',
      description: `QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: ${superflexSlots}, K: 1, DEF: 1 (${9 + superflexSlots} starters)`,
      icon: '🦸'
    },
    {
      id: '2qb',
      name: '⚖️ 2 QB',
      description: 'QB: 2, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1 (10 starters)',
      icon: '⚖️'
    }
  ];

  const analyzeDraft = async () => {
    if (!draftUrl.trim()) {
      alert('Please enter a Sleeper draft URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      const encoded = encodeURIComponent(draftUrl.trim());
      const leagueTypeParam = encodeURIComponent(leagueType);
      const superflexSlotsParam = encodeURIComponent(superflexSlots.toString());
      router.push(`/draft-analyzer/results?draftUrl=${encoded}&leagueType=${leagueTypeParam}&superflexSlots=${superflexSlotsParam}`);
    } catch (error) {
      console.error('Error navigating to results:', error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              🏈 Fantasy Football Draft Analyzer
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Analyze your Sleeper draft with AI-powered insights, optimal lineups, and position grades
            </p>
          </div>

          {/* Main Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="space-y-6">
              {/* Draft URL Input */}
              <div>
                <label htmlFor="draftUrl" className="block text-lg font-semibold mb-3 text-yellow-300">
                  📋 Sleeper Draft URL
                </label>
                <input
                  type="url"
                  id="draftUrl"
                  value={draftUrl}
                  onChange={(e) => setDraftUrl(e.target.value)}
                  placeholder="https://sleeper.app/draft/nfl/..."
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Paste the URL from your Sleeper draft room
                </p>
              </div>

              {/* League Type Selection */}
              <div>
                <label className="block text-lg font-semibold mb-3 text-yellow-300">
                  🎯 League Format
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {leagueTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        leagueType === type.id
                          ? 'border-yellow-400 bg-yellow-400/20'
                          : 'border-white/30 bg-white/10 hover:bg-white/20'
                      }`}
                      onClick={() => setLeagueType(type.id)}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-semibold text-white">{type.name}</div>
                      <div className="text-sm text-gray-300 mt-1">{type.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Superflex Slots Configuration */}
              {leagueType === 'superflex' && (
                <div>
                  <label className="block text-lg font-semibold mb-3 text-yellow-300">
                    🦸 Superflex Slots
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="3"
                      value={superflexSlots}
                      onChange={(e) => setSuperflexSlots(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-2xl font-bold text-yellow-400 min-w-[3rem] text-center">
                      {superflexSlots}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Configure how many SUPERFLEX slots your league has (QB/RB/WR/TE eligible)
                  </p>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={analyzeDraft}
                disabled={isAnalyzing || !draftUrl.trim()}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  isAnalyzing || !draftUrl.trim()
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105'
                }`}
              >
                {isAnalyzing ? '🔍 Analyzing Draft...' : '🚀 Analyze Draft'}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Optimal Lineups</h3>
              <p className="text-gray-300">
                AI-powered lineup optimization for maximum projected points
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-xl font-semibold mb-2">Position Grades</h3>
              <p className="text-gray-300">
                Detailed position-by-position analysis with letter grades
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">🦸</div>
              <h3 className="text-xl font-semibold mb-2">Superflex Support</h3>
              <p className="text-gray-300">
                Full support for superflex leagues with QB prioritization
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #fbbf24;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #fbbf24;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
} 