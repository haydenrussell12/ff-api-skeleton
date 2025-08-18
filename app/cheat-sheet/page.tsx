"use client";

import { useState, useEffect } from 'react';

interface Player {
  playerName: string;
  position: string;
  team: string;
  projectedPoints: number;
  vorpScore: number;
  adpValue: number;
  rank: number;
}

export default function CheatSheetPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadPlayersData();
  }, []);

  useEffect(() => {
    filterAndSortPlayers();
  }, [players, positionFilter, searchTerm, sortColumn, sortDirection]);

  const loadPlayersData = async () => {
    try {
      setLoading(true);
      // For now, let's create some sample data since the API isn't fully implemented
      const samplePlayers: Player[] = [
        {
          playerName: "Christian McCaffrey",
          position: "RB",
          team: "SF",
          projectedPoints: 285.4,
          vorpScore: 45.2,
          adpValue: 1.2,
          rank: 1
        },
        {
          playerName: "Tyreek Hill",
          position: "WR",
          team: "MIA",
          projectedPoints: 278.9,
          vorpScore: 42.1,
          adpValue: 2.1,
          rank: 2
        },
        {
          playerName: "Austin Ekeler",
          position: "RB",
          team: "WAS",
          projectedPoints: 265.3,
          vorpScore: 38.7,
          adpValue: 3.5,
          rank: 3
        },
        {
          playerName: "Stefon Diggs",
          position: "WR",
          team: "HOU",
          projectedPoints: 258.6,
          vorpScore: 37.4,
          adpValue: 4.2,
          rank: 4
        },
        {
          playerName: "Travis Kelce",
          position: "TE",
          team: "KC",
          projectedPoints: 245.8,
          vorpScore: 35.9,
          adpValue: 5.8,
          rank: 5
        },
        {
          playerName: "Saquon Barkley",
          position: "RB",
          team: "PHI",
          projectedPoints: 242.1,
          vorpScore: 34.2,
          adpValue: 6.1,
          rank: 6
        },
        {
          playerName: "Davante Adams",
          position: "WR",
          team: "LV",
          projectedPoints: 238.7,
          vorpScore: 33.8,
          adpValue: 7.3,
          rank: 7
        },
        {
          playerName: "Derrick Henry",
          position: "RB",
          team: "BAL",
          projectedPoints: 235.4,
          vorpScore: 32.1,
          adpValue: 8.5,
          rank: 8
        },
        {
          playerName: "A.J. Brown",
          position: "WR",
          team: "PHI",
          projectedPoints: 232.9,
          vorpScore: 31.5,
          adpValue: 9.2,
          rank: 9
        },
        {
          playerName: "Josh Jacobs",
          position: "RB",
          team: "GB",
          projectedPoints: 228.6,
          vorpScore: 30.8,
          adpValue: 10.1,
          rank: 10
        }
      ];

      setPlayers(samplePlayers);
      setFilteredPlayers(samplePlayers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load player data. Please try refreshing the page.');
      setLoading(false);
    }
  };

  const filterAndSortPlayers = () => {
    let filtered = players.filter(player => {
      const matchesPosition = !positionFilter || player.position === positionFilter;
      const matchesSearch = !searchTerm || 
        player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesPosition && matchesSearch;
    });

    // Sort the filtered data
    filtered.sort((a, b) => {
      let aVal = a[sortColumn as keyof Player];
      let bVal = b[sortColumn as keyof Player];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    setFilteredPlayers(filtered);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#667eea', marginBottom: '20px' }}>Loading Pre Draft Cheat Sheet...</h2>
          <p style={{ color: '#666' }}>Please wait while we load the player data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <a href="/" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px', 
            marginBottom: '20px' 
          }}>
            ← Back to Home
          </a>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>Error Loading Cheat Sheet</h1>
          <p style={{ color: '#666' }}>{error}</p>
          <button 
            onClick={loadPlayersData}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          textAlign: 'center'
        }}>
          <a href="/" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            background: 'rgba(255,255,255,0.2)', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ← Back to Home
          </a>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            📋 Pre Draft Cheat Sheet
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Player rankings, projections, and VORP scores for your draft strategy
          </p>
        </div>

        {/* Stats Summary */}
        <div style={{ padding: '20px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Total Players</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{filteredPlayers.length}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Top RB</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                {filteredPlayers.filter(p => p.position === 'RB').sort((a, b) => b.projectedPoints - a.projectedPoints)[0]?.playerName || 'N/A'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Top WR</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                {filteredPlayers.filter(p => p.position === 'WR').sort((a, b) => b.projectedPoints - a.projectedPoints)[0]?.playerName || 'N/A'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Top TE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                {filteredPlayers.filter(p => p.position === 'TE').sort((a, b) => b.projectedPoints - a.projectedPoints)[0]?.playerName || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '20px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Position:</label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Positions</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
                <option value="K">K</option>
                <option value="DEF">DEF</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Search:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by player name or team..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div style={{ padding: '20px' }}>
          <h3 style={{ color: '#667eea', marginBottom: '20px' }}>📊 Player Rankings & Projections</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <th 
                    style={{ padding: '15px', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => handleSort('rank')}
                  >
                    Rank {getSortIcon('rank')}
                  </th>
                  <th 
                    style={{ padding: '15px', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => handleSort('playerName')}
                  >
                    Player {getSortIcon('playerName')}
                  </th>
                  <th 
                    style={{ padding: '15px', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => handleSort('position')}
                  >
                    Pos {getSortIcon('position')}
                  </th>
                  <th 
                    style={{ padding: '15px', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => handleSort('team')}
                  >
                    Team {getSortIcon('team')}
                  </th>
                  <th 
                    style={{ padding: '15px', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => handleSort('projectedPoints')}
                  >
                    Proj Points {getSortIcon('projectedPoints')}
                  </th>
                  <th 
                    style={{ padding: '15px', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => handleSort('vorpScore')}
                  >
                    VORP {getSortIcon('vorpScore')}
                  </th>
                  <th 
                    style={{ padding: '15px', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => handleSort('adpValue')}
                  >
                    ADP Value {getSortIcon('adpValue')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No players match your filters
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player, index) => (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #e9ecef',
                      background: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>{player.rank}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>{player.playerName}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: player.position === 'RB' ? '#28a745' : 
                                   player.position === 'WR' ? '#007bff' : 
                                   player.position === 'TE' ? '#6f42c1' : 
                                   player.position === 'QB' ? '#fd7e14' : '#6c757d',
                          color: 'white'
                        }}>
                          {player.position}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>{player.team}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold' }}>{player.projectedPoints}</td>
                      <td style={{ padding: '15px' }}>{player.vorpScore.toFixed(1)}</td>
                      <td style={{ padding: '15px' }}>{player.adpValue.toFixed(1)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 