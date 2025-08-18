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
  adp?: number;
  bye?: number;
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
      setError('');
      
      console.log('🔄 Starting to load player data...');
      
      // Load data from multiple sources
      const [adpData, vorpData] = await Promise.all([
        fetch('/api/cheat-sheet/adp').then(res => res.json()),
        fetch('/api/cheat-sheet/vorp').then(res => res.json())
      ]);

      console.log('📊 ADP data received:', adpData);
      console.log('📊 VORP data received:', vorpData);

      if (adpData.success && vorpData.success) {
        console.log('✅ Both data sources successful, combining data...');
        
        // Combine ADP and VORP data
        const combinedPlayers = adpData.data.map((adpPlayer: any) => {
          // Clean up position format (remove numbers like "WR1" -> "WR")
          const cleanPosition = adpPlayer.POS.replace(/\d+$/, '');
          
          // Find matching VORP player by name (case-insensitive)
          const vorpPlayer = vorpData.data.find((v: any) => 
            v.name.toLowerCase() === adpPlayer.Player.toLowerCase()
          );
          
          if (!vorpPlayer) {
            console.log(`⚠️ No VORP data found for: ${adpPlayer.Player}`);
          }
          
          return {
            playerName: adpPlayer.Player,
            position: cleanPosition,
            team: adpPlayer.Team,
            projectedPoints: vorpPlayer?.points || 0,
            vorpScore: vorpPlayer?.vorp || 0,
            adpValue: parseFloat(adpPlayer.AVG) || 0,
            rank: parseInt(adpPlayer.Rank) || 0,
            adp: parseFloat(adpPlayer.AVG) || 0,
            bye: parseInt(adpPlayer.Bye) || 0
          };
        });

        console.log('🎯 Combined players:', combinedPlayers.length);
        console.log('📋 Sample combined player:', combinedPlayers[0]);

        setPlayers(combinedPlayers);
      } else {
        console.error('❌ Data source failed:', { adpData, vorpData });
        throw new Error('Failed to load player data');
      }
    } catch (err) {
      console.error('Error loading players:', err);
      setError('Failed to load player data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPlayers = () => {
    let filtered = [...players];

    // Apply position filter
    if (positionFilter) {
      filtered = filtered.filter(player => player.position === positionFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortColumn as keyof Player];
      let bVal = b[sortColumn as keyof Player];
      
      // Handle undefined values
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
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
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading 2025 Fantasy Football Data...</h2>
        <p>Please wait while we load the latest player rankings and projections.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button 
          onClick={loadPlayersData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>
        🏈 2025 Pre Draft Cheat Sheet
      </h1>
      
      {/* Stats Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '10px', 
          textAlign: 'center' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>Total Players</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{players.length}</p>
        </div>
        <div style={{ 
          backgroundColor: '#e8f4fd', 
          padding: '20px', 
          borderRadius: '10px', 
          textAlign: 'center' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#3498db' }}>Filtered Players</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{filteredPlayers.length}</p>
        </div>
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '20px', 
          borderRadius: '10px', 
          textAlign: 'center' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f39c12' }}>Top VORP</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {players.length > 0 ? Math.max(...players.map(p => p.vorpScore)).toFixed(1) : 'N/A'}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '20px', 
          borderRadius: '10px', 
          textAlign: 'center' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Top Projected</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {players.length > 0 ? Math.max(...players.map(p => p.projectedPoints)).toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Position:
          </label>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <option value="">All Positions</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
            <option value="K">K</option>
            <option value="DST">DST</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Search:
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Player name or team..."
            style={{
              padding: '8px 12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '200px'
            }}
          />
        </div>
      </div>

      {/* Players Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          backgroundColor: 'white',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', cursor: 'pointer' }}
                  onClick={() => handleSort('rank')}>
                Rank {getSortIcon('rank')}
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', cursor: 'pointer' }}
                  onClick={() => handleSort('playerName')}>
                Player {getSortIcon('playerName')}
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', cursor: 'pointer' }}
                  onClick={() => handleSort('position')}>
                Pos {getSortIcon('position')}
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', cursor: 'pointer' }}
                  onClick={() => handleSort('team')}>
                Team {getSortIcon('team')}
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', cursor: 'pointer' }}
                  onClick={() => handleSort('adpValue')}>
                ADP {getSortIcon('adpValue')}
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', cursor: 'pointer' }}
                  onClick={() => handleSort('projectedPoints')}>
                Proj Pts {getSortIcon('projectedPoints')}
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', cursor: 'pointer' }}
                  onClick={() => handleSort('vorpScore')}>
                VORP {getSortIcon('vorpScore')}
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                Bye
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player, index) => (
              <tr key={index} style={{ 
                borderBottom: '1px solid #dee2e6',
                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
              }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{player.rank}</td>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{player.playerName}</td>
                <td style={{ padding: '15px' }}>{player.position}</td>
                <td style={{ padding: '15px' }}>{player.team}</td>
                <td style={{ padding: '15px' }}>{player.adpValue.toFixed(1)}</td>
                <td style={{ padding: '15px' }}>{player.projectedPoints.toFixed(1)}</td>
                <td style={{ padding: '15px', color: player.vorpScore > 0 ? '#27ae60' : '#e74c3c' }}>
                  {player.vorpScore.toFixed(1)}
                </td>
                <td style={{ padding: '15px' }}>{player.bye || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPlayers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <p>No players found matching your filters.</p>
          <p>Try adjusting your search criteria or position filter.</p>
        </div>
      )}
    </div>
  );
} 