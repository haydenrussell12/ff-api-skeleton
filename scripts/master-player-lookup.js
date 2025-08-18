import { promises as fs } from 'fs';
import path from 'path';

class MasterPlayerLookup {
  constructor() {
    this.masterData = null;
    this.nameLookup = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this.getStats();
    
    try {
      console.log('🔍 Initializing Master Player Lookup System...');
      
      // Load master player data
      const masterDataPath = path.join('data', 'consolidated', 'master-players.json');
      const masterDataContent = await fs.readFile(masterDataPath, 'utf8');
      this.masterData = JSON.parse(masterDataContent);
      
      // Load name lookup index
      const nameLookupPath = path.join('data', 'consolidated', 'name-lookup-index.json');
      const nameLookupContent = await fs.readFile(nameLookupPath, 'utf8');
      this.nameLookup = JSON.parse(nameLookupContent);
      
      this.initialized = true;
      console.log(`✅ Loaded ${this.masterData.players.length} players with ${Object.keys(this.nameLookup).length} name variations`);
      
      return this.getStats();
      
    } catch (error) {
      console.error('❌ Error initializing Master Player Lookup:', error);
      throw error;
    }
  }

  // Main lookup method with fuzzy matching
  async findPlayer(query, options = {}) {
    await this.initialize();
    
    const {
      exactMatch = false,
      includeHistorical = true,
      includeProjections = true,
      maxResults = 5
    } = options;
    
    // Normalize the query
    const normalizedQuery = this.normalizePlayerName(query);
    
    if (exactMatch) {
      return this.exactMatch(normalizedQuery);
    }
    
    // Try fuzzy matching
    const results = this.fuzzyMatch(normalizedQuery, maxResults);
    
    if (results.length === 0) {
      return null;
    }
    
    // Return the best match with full data
    const bestMatch = results[0];
    return this.getPlayerData(bestMatch.playerId, { includeHistorical, includeProjections });
  }

  // Exact match by player ID
  exactMatch(playerId) {
    const player = this.masterData.players.find(p => p.player_id === playerId);
    return player ? this.getPlayerData(playerId) : null;
  }

  // Fuzzy matching with multiple strategies
  fuzzyMatch(query, maxResults = 5) {
    const results = [];
    
    // Strategy 1: Direct name lookup
    if (this.nameLookup[query]) {
      for (const playerId of this.nameLookup[query]) {
        results.push({ playerId, score: 100, strategy: 'exact' });
      }
    }
    
    // Strategy 2: Partial name matching
    const partialMatches = this.findPartialMatches(query);
    results.push(...partialMatches);
    
    // Strategy 3: Soundex-like matching for common misspellings
    const phoneticMatches = this.findPhoneticMatches(query);
    results.push(...phoneticMatches);
    
    // Strategy 4: Position-based matching
    const positionMatches = this.findPositionMatches(query);
    results.push(...positionMatches);
    
    // Deduplicate and sort by score
    const uniqueResults = this.deduplicateResults(results);
    return uniqueResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  // Find partial matches (e.g., "josh" matches "josh allen", "josh jacobs")
  findPartialMatches(query) {
    const results = [];
    const queryWords = query.split(' ');
    
    for (const [name, playerIds] of Object.entries(this.nameLookup)) {
      let score = 0;
      let matchedWords = 0;
      
      for (const word of queryWords) {
        if (name.includes(word)) {
          score += 20;
          matchedWords++;
        }
      }
      
      if (matchedWords > 0) {
        score += (matchedWords / queryWords.length) * 30; // Bonus for matching more words
        score += Math.max(0, 50 - Math.abs(name.length - query.length)); // Length similarity bonus
        
        for (const playerId of playerIds) {
          results.push({ playerId, score, strategy: 'partial' });
        }
      }
    }
    
    return results;
  }

  // Find phonetic matches for common misspellings
  findPhoneticMatches(query) {
    const results = [];
    const commonMisspellings = this.getCommonMisspellings(query);
    
    for (const misspelling of commonMisspellings) {
      if (this.nameLookup[misspelling]) {
        for (const playerId of this.nameLookup[misspelling]) {
          results.push({ playerId, score: 80, strategy: 'phonetic' });
        }
      }
    }
    
    return results;
  }

  // Get common misspellings for a name
  getCommonMisspellings(name) {
    const misspellings = [];
    
    // Common letter swaps
    for (let i = 0; i < name.length - 1; i++) {
      const swapped = name.slice(0, i) + name[i + 1] + name[i] + name.slice(i + 2);
      misspellings.push(swapped);
    }
    
    // Common letter substitutions
    const substitutions = {
      'a': ['e', 'o'],
      'e': ['a', 'i'],
      'i': ['e', 'y'],
      'o': ['a', 'u'],
      'u': ['o', 'i'],
      'c': ['k', 's'],
      'k': ['c', 'q'],
      's': ['c', 'z'],
      'z': ['s', 'x']
    };
    
    for (let i = 0; i < name.length; i++) {
      const char = name[i];
      if (substitutions[char]) {
        for (const sub of substitutions[char]) {
          const substituted = name.slice(0, i) + sub + name.slice(i + 1);
          misspellings.push(substituted);
        }
      }
    }
    
    return misspellings;
  }

  // Find matches by position (e.g., "qb1" matches top QB)
  findPositionMatches(query) {
    const results = [];
    
    // Check if query is a position reference (e.g., "qb1", "rb3", "wr1")
    const positionMatch = query.match(/^(qb|rb|wr|te|k|dst)(\d+)$/i);
    if (positionMatch) {
      const position = positionMatch[1].toUpperCase();
      const rank = parseInt(positionMatch[2]);
      
      // Find players by position and rank
      const positionPlayers = this.masterData.players
        .filter(p => p.position && p.position.startsWith(position))
        .sort((a, b) => {
          const aRank = parseInt(a.position.replace(/\D/g, '')) || 999;
          const bRank = parseInt(b.position.replace(/\D/g, '')) || 999;
          return aRank - bRank;
        });
      
      if (positionPlayers[rank - 1]) {
        const playerId = positionPlayers[rank - 1].player_id;
        results.push({ playerId, score: 90, strategy: 'position' });
      }
    }
    
    return results;
  }

  // Deduplicate results by playerId, keeping highest score
  deduplicateResults(results) {
    const seen = new Map();
    
    for (const result of results) {
      if (!seen.has(result.playerId) || seen.get(result.playerId).score < result.score) {
        seen.set(result.playerId, result);
      }
    }
    
    return Array.from(seen.values());
  }

  // Get full player data with optional filtering
  getPlayerData(playerId, options = {}) {
    const {
      includeHistorical = true,
      includeProjections = true,
      includeNameVariations = false
    } = options;
    
    const player = this.masterData.players.find(p => p.player_id === playerId);
    if (!player) return null;
    
    // Create a copy of the player data
    const playerData = { ...player };
    
    // Filter out data based on options
    if (!includeHistorical) {
      delete playerData.historical_stats;
    }
    
    if (!includeProjections) {
      delete playerData.projections;
    }
    
    if (!includeNameVariations) {
      delete playerData.name_variations;
    }
    
    return playerData;
  }

  // Get ADP data for a specific format and season
  getADPData(playerId, format = 'ppr', season = 2025) {
    const player = this.getPlayerData(playerId, { includeHistorical: false, includeProjections: false });
    if (!player || !player.adp_data) return null;
    
    if (season === 2025) {
      return player.adp_data[format] || null;
    } else {
      // Historical ADP data
      if (player.adp_data[format] && player.adp_data[format][season]) {
        return player.adp_data[format][season];
      }
    }
    
    return null;
  }

  // Get historical stats for a specific season
  getHistoricalStats(playerId, season) {
    const player = this.getPlayerData(playerId, { includeProjections: false });
    if (!player || !player.historical_stats) return null;
    
    return player.historical_stats[season] || null;
  }

  // Get projections for a specific position
  getProjections(playerId, position) {
    const player = this.getPlayerData(playerId, { includeHistorical: false });
    if (!player || !player.projections) return null;
    
    return player.projections[position.toLowerCase()] || null;
  }

  // Search players by multiple criteria
  async searchPlayers(criteria) {
    await this.initialize();
    
    const {
      name,
      team,
      position,
      minADPRank,
      maxADPRank,
      format = 'ppr',
      season = 2025
    } = criteria;
    
    let results = this.masterData.players;
    
    // Filter by name (fuzzy match)
    if (name) {
      const nameResults = this.fuzzyMatch(this.normalizePlayerName(name), 100);
      const namePlayerIds = new Set(nameResults.map(r => r.playerId));
      results = results.filter(p => namePlayerIds.has(p.player_id));
    }
    
    // Filter by team
    if (team) {
      results = results.filter(p => p.team && p.team.toLowerCase() === team.toLowerCase());
    }
    
    // Filter by position
    if (position) {
      const pos = position.toUpperCase();
      results = results.filter(p => p.position && p.position.startsWith(pos));
    }
    
    // Filter by ADP rank
    if (minADPRank || maxADPRank) {
      results = results.filter(p => {
        const adpData = this.getADPData(p.player_id, format, season);
        if (!adpData || !adpData.rank) return false;
        
        if (minADPRank && adpData.rank < minADPRank) return false;
        if (maxADPRank && adpData.rank > maxADPRank) return false;
        
        return true;
      });
    }
    
    return results;
  }

  // Get players by ADP rank range
  async getPlayersByADPRank(minRank, maxRank, format = 'ppr', season = 2025) {
    await this.initialize();
    
    return this.masterData.players
      .filter(p => {
        const adpData = this.getADPData(p.player_id, format, season);
        return adpData && adpData.rank >= minRank && adpData.rank <= maxRank;
      })
      .sort((a, b) => {
        const aADP = this.getADPData(a.player_id, format, season);
        const bADP = this.getADPData(b.player_id, format, season);
        return (aADP?.rank || 999) - (bADP?.rank || 999);
      });
  }

  // Get players by position
  async getPlayersByPosition(position, format = 'ppr', season = 2025) {
    await this.initialize();
    
    const pos = position.toUpperCase();
    return this.masterData.players
      .filter(p => p.position && p.position.startsWith(pos))
      .sort((a, b) => {
        const aADP = this.getADPData(a.player_id, format, season);
        const bADP = this.getADPData(b.player_id, format, season);
        return (aADP?.rank || 999) - (bADP?.rank || 999);
      });
  }

  // Normalize player name for consistent lookup
  normalizePlayerName(name) {
    if (!name || typeof name !== 'string') return '';
    
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Get system statistics
  getStats() {
    if (!this.initialized) return null;
    
    return {
      total_players: this.masterData.players.length,
      name_variations: Object.keys(this.nameLookup).length,
      last_updated: this.masterData.metadata?.last_updated,
      data_sources: this.masterData.metadata?.data_sources,
      seasons: this.masterData.metadata?.seasons
    };
  }
}

export default MasterPlayerLookup; 