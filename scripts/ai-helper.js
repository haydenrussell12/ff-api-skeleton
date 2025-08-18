import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class AIHelper {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Main method to process user questions and provide AI-powered answers
   */
  async processQuestion(question, userId = null, leagueId = null) {
    try {
      console.log('🤖 Processing question:', question);
      
      // Normalize the question
      const normalizedQuestion = question.toLowerCase().trim();
      
      // Extract key information from the question
      const questionInfo = await this.extractQuestionInfo(normalizedQuestion);
      console.log('📊 Extracted question info:', questionInfo);
      
      // Route to appropriate handler based on extracted info
      if (questionInfo.type === 'adp') {
        return await this.handleADPQuestion(questionInfo);
      } else if (questionInfo.type === 'player') {
        return await this.handlePlayerQuestion(questionInfo);
      } else if (questionInfo.type === 'comparison') {
        return await this.handleComparisonQuestion(questionInfo);
      } else if (questionInfo.type === 'general') {
        return await this.handleGeneralQuestion(questionInfo);
      } else {
        // Fallback: try to understand what they want
        return await this.handleUnknownQuestion(question, questionInfo);
      }
      
    } catch (error) {
      console.error('❌ Error processing question:', error);
      return {
        success: false,
        answer: "I'm sorry, I encountered an error while processing your question. Please try rephrasing it or ask something else.",
        reasoning: `Error: ${error.message}`,
        confidence: 0.1
      };
    }
  }

  /**
   * Extract key information from any question using multiple strategies
   */
  async extractQuestionInfo(question) {
    const info = {
      type: 'unknown',
      players: [],
      adpRank: null,
      round: null,
      position: null,
      action: null,
      confidence: 0
    };

    // Strategy 1: Look for ADP-related patterns
    const adpPatterns = [
      /(?:adp|pick|draft\s+position|draft\s+rank)\s*(\d+)/i,
      /(\d+)\s*(?:adp|pick|draft\s+position|draft\s+rank)/i,
      /round\s+(\d+)/i,
      /(\d+)\s*round/i,
      /top\s+(\d+)/i,
      /(\d+)\s*overall/i
    ];

    for (const pattern of adpPatterns) {
      const match = question.match(pattern);
      if (match) {
        info.type = 'adp';
        info.adpRank = parseInt(match[1]);
        info.confidence = 0.9;
        break;
      }
    }

    // Strategy 2: Look for player names (with fuzzy matching)
    const playerNames = await this.extractPlayerNames(question);
    if (playerNames.length > 0) {
      info.players = playerNames;
      if (playerNames.length === 1) {
        info.type = 'player';
      } else if (playerNames.length > 1) {
        info.type = 'comparison';
      }
      info.confidence = Math.max(info.confidence, 0.8);
    }

    // Strategy 3: Look for actions/verbs
    const actionWords = ['start', 'sit', 'pick', 'drop', 'trade', 'compare', 'vs', 'versus'];
    for (const word of actionWords) {
      if (question.includes(word)) {
        info.action = word;
        break;
      }
    }

    // Strategy 4: Look for positions
    const positions = ['qb', 'rb', 'wr', 'te', 'k', 'def'];
    for (const pos of positions) {
      if (question.includes(pos)) {
        info.position = pos.toUpperCase();
        break;
      }
    }

    // Strategy 5: Determine if it's a general question
    if (info.type === 'unknown' && info.confidence < 0.5) {
      info.type = 'general';
      info.confidence = 0.3;
    }

    return info;
  }

  /**
   * Extract player names from question with fuzzy matching
   */
  async extractPlayerNames(question) {
    const names = [];
    
    // Load ADP data to get player names for matching
    try {
      const fs = await import('fs');
      const adpData = JSON.parse(fs.readFileSync('adp_data.json', 'utf8'));
      
      // Look for player names in the question
      for (const player of adpData.players) {
        const playerName = player.full_name.toLowerCase();
        const playerWords = playerName.split(' ');
        
        // Check if any part of the player name appears in the question
        for (const word of playerWords) {
          if (word.length > 2 && question.includes(word)) {
            // Fuzzy match: check if this is likely the player they mean
            if (this.isLikelyPlayerMatch(word, playerName, question)) {
              names.push({
                name: player.full_name,
                sleeperId: player.sleeper_id,
                position: player.position,
                team: player.team_code,
                confidence: this.calculateNameConfidence(word, playerName, question)
              });
              break;
            }
          }
        }
      }
      
      // Sort by confidence and remove duplicates
      names.sort((a, b) => b.confidence - a.confidence);
      const uniqueNames = [];
      const seenNames = new Set();
      
      for (const name of names) {
        if (!seenNames.has(name.name)) {
          uniqueNames.push(name);
          seenNames.add(name.name);
        }
      }
      
      return uniqueNames.slice(0, 3); // Return top 3 matches
      
    } catch (error) {
      console.log('⚠️  Could not load ADP data for name matching');
      return [];
    }
  }

  /**
   * Check if a word is likely referring to a specific player
   */
  isLikelyPlayerMatch(word, fullName, question) {
    // Skip common words
    const commonWords = ['the', 'and', 'or', 'vs', 'versus', 'start', 'sit', 'pick', 'drop'];
    if (commonWords.includes(word)) return false;
    
    // Check if the word is part of a longer name
    if (fullName.includes(word) && word.length > 2) {
      // Look for context clues
      const contextWords = ['start', 'sit', 'vs', 'versus', 'pick', 'drop', 'trade'];
      const hasContext = contextWords.some(context => question.includes(context));
      
      return hasContext || word.length > 3; // Longer words are more likely to be names
    }
    
    return false;
  }

  /**
   * Calculate confidence score for a player name match
   */
  calculateNameConfidence(word, fullName, question) {
    let confidence = 0.5;
    
    // Longer words get higher confidence
    if (word.length > 4) confidence += 0.2;
    if (word.length > 6) confidence += 0.1;
    
    // Exact matches get higher confidence
    if (question.includes(fullName.toLowerCase())) confidence += 0.3;
    
    // Context clues boost confidence
    const contextWords = ['start', 'sit', 'vs', 'versus', 'pick', 'drop', 'trade'];
    if (contextWords.some(context => question.includes(context))) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Handle ADP questions
   */
  async handleADPQuestion(questionInfo) {
    try {
      console.log('🏆 Handling ADP question:', questionInfo);
      
      const adpData = await this.getADPData(questionInfo);
      
      if (!adpData || adpData.length === 0) {
        return {
          success: false,
          answer: "I couldn't find any players matching that ADP criteria. Please try a different rank or round.",
          reasoning: "No players found in ADP data",
          confidence: 0
        };
      }

      let answer = '';
      let reasoning = '';
      
      if (questionInfo.adpRank) {
        const player = adpData[0];
        answer = `**ADP ${questionInfo.adpRank} is ${player.full_name}** (${player.position}, ${player.team_code})`;
        
        // Add historical context if available
        const historicalADP = await this.getHistoricalADPData(player.full_name, 'ppr');
        if (historicalADP && historicalADP.length > 0) {
          const recentADP = historicalADP.slice(0, 3); // Last 3 seasons
          const adpTrend = recentADP.map(h => `${h.season}: ${h.average_adp}`).join(', ');
          answer += `\n\n**Historical ADP Trend:** ${adpTrend}`;
        }
        
        reasoning = `Found player at exact ADP rank ${questionInfo.adpRank}`;
      } else if (questionInfo.round) {
        answer = `**Round ${questionInfo.round} players:**\n`;
        adpData.forEach((player, index) => {
          answer += `${index + 1}. ${player.full_name} (${player.position}, ${player.team_code}) - ADP ${player.adp_value}\n`;
        });
        reasoning = `Found ${adpData.length} players in round ${questionInfo.round}`;
      } else if (questionInfo.position) {
        answer = `**Top ${questionInfo.position} players by ADP:**\n`;
        adpData.slice(0, 10).forEach((player, index) => {
          answer += `${index + 1}. ${player.full_name} (${player.team_code}) - ADP ${player.adp_value}\n`;
        });
        reasoning = `Found ${adpData.length} ${questionInfo.position} players`;
      }

      return {
        success: true,
        answer,
        reasoning,
        confidence: 0.95
      };
      
    } catch (error) {
      console.error('Error handling ADP question:', error);
      return {
        success: false,
        answer: "I encountered an error while processing your ADP question. Please try again.",
        reasoning: error.message,
        confidence: 0
      };
    }
  }

  /**
   * Handle player-specific questions
   */
  async handlePlayerQuestion(questionInfo) {
    try {
      console.log('👤 Processing player question');
      
      if (questionInfo.players.length === 0) {
        return {
          success: false,
          answer: "I couldn't identify which player you're asking about. Please try to be more specific with the player name.",
          reasoning: "No player names identified",
          confidence: 0.2
        };
      }

      const player = questionInfo.players[0];
      
      return {
        success: true,
        answer: `I found **${player.name}** (${player.position}, ${player.team || 'FA'}). What would you like to know about them? You can ask about their ADP, projections, or compare them to other players.`,
        reasoning: `Identified player: ${player.name}`,
        confidence: player.confidence
      };

    } catch (error) {
      console.error('❌ Error handling player question:', error);
      return {
        success: false,
        answer: "I'm sorry, I encountered an error while processing your question about this player. Please try again.",
        reasoning: `Error: ${error.message}`,
        confidence: 0.2
      };
    }
  }

  /**
   * Handle comparison questions
   */
  async handleComparisonQuestion(questionInfo) {
    try {
      console.log('⚖️  Processing comparison question');
      
      if (questionInfo.players.length < 2) {
        return {
          success: false,
          answer: "I need at least two players to make a comparison. Please mention both players you'd like me to compare.",
          reasoning: "Insufficient players for comparison",
          confidence: 0.3
        };
      }

      const player1 = questionInfo.players[0];
      const player2 = questionInfo.players[1];
      
      return {
        success: true,
        answer: `I can compare **${player1.name}** (${player1.position}, ${player1.team || 'FA'}) vs **${player2.name}** (${player2.position}, ${player2.team || 'FA'}). What would you like to know? I can compare their ADP, projections, or help with start/sit decisions.`,
        reasoning: `Identified players for comparison: ${player1.name} vs ${player2.name}`,
        confidence: Math.min(player1.confidence, player2.confidence)
      };

    } catch (error) {
      console.error('❌ Error handling comparison question:', error);
      return {
        success: false,
        answer: "I'm sorry, I encountered an error while processing your comparison question. Please try again.",
        reasoning: `Error: ${error.message}`,
        confidence: 0.2
      };
    }
  }

  /**
   * Handle general questions
   */
  async handleGeneralQuestion(questionInfo) {
    console.log('❓ Processing general question');
    
    return {
      success: true,
      answer: `I can help you with fantasy football questions! Here's what I can do:

🎯 **ADP Questions**: "Who is ADP 15?" "Who goes in round 2?" "Show me top 20 players"

👤 **Player Questions**: "Tell me about McCaffrey" "What's the ADP for Gibbs?"

⚖️ **Comparisons**: "Who should I start: Gibbs vs Swift?" "Compare McCaffrey and Ekeler"

🔍 **General Help**: "What can you help me with?" "How do I use this tool?"

Try asking something specific like "Who is ADP 15?" or "Who should I start: Gibbs vs Swift?"`,
      reasoning: "General guidance provided",
      confidence: 0.8
    };
  }

  /**
   * Handle unknown questions with intelligent fallback
   */
  async handleUnknownQuestion(question, questionInfo) {
    console.log('🤔 Processing unknown question with fallback logic');
    
    // Try to extract any useful information
    const words = question.toLowerCase().split(' ');
    const potentialPlayers = [];
    const potentialNumbers = [];
    
    for (const word of words) {
      // Look for numbers (potential ADP ranks)
      if (/^\d+$/.test(word)) {
        potentialNumbers.push(parseInt(word));
      }
      
      // Look for words that might be player names
      if (word.length > 3 && !['what', 'when', 'where', 'which', 'whose', 'start', 'sit', 'pick', 'drop'].includes(word)) {
        potentialPlayers.push(word);
      }
    }
    
    // If we found numbers, suggest ADP questions
    if (potentialNumbers.length > 0) {
      return {
        success: true,
        answer: `I see you mentioned the number ${potentialNumbers[0]}. Are you asking about ADP rank ${potentialNumbers[0]}? Try asking "Who is ADP ${potentialNumbers[0]}?" and I can tell you which player goes at that draft position.`,
        reasoning: "Detected potential ADP rank number",
        confidence: 0.6
      };
    }
    
    // If we found potential player names, suggest player questions
    if (potentialPlayers.length > 0) {
      return {
        success: true,
        answer: `I see you mentioned "${potentialPlayers[0]}". Are you asking about a player? Try asking "Tell me about ${potentialPlayers[0]}" or "What's the ADP for ${potentialPlayers[0]}?" and I can help you with that player's information.`,
        reasoning: "Detected potential player name",
        confidence: 0.5
      };
    }
    
    // Final fallback
    return {
      success: true,
      answer: `I'm not sure I understood your question. Here are some examples of what I can help with:

🎯 **"Who is ADP 15?"** - Find out which player goes at draft position 15
👤 **"Tell me about McCaffrey"** - Get information about a specific player  
⚖️ **"Gibbs vs Swift"** - Compare two players
🔍 **"What can you help me with?"** - Learn about my capabilities

Try rephrasing your question or ask one of these examples!`,
      reasoning: "Fallback guidance provided",
      confidence: 0.4
    };
  }

  /**
   * Get ADP data for the AI agent
   */
  async getADPData(adpInfo) {
    try {
      // First try to get data from Supabase historical data
      let adpData = await this.getADPDataFromSupabase(adpInfo);
      
      if (adpData && adpData.length > 0) {
        console.log(`✅ Found ${adpData.length} players from Supabase historical data`);
        return adpData;
      }
      
      // Fallback to local adp_data.json
      try {
        const fs = await import('fs/promises');
        const adpFileContent = await fs.readFile('adp_data.json', 'utf8');
        adpData = JSON.parse(adpFileContent);
        console.log('⚠️  Using local adp_data.json as fallback');
      } catch (fileError) {
        console.log('⚠️  Could not read ADP data file');
        return null;
      }
      
      if (!adpData || !adpData.players) return null;

      let filteredPlayers = [];
      if (adpInfo.adpRank) {
        filteredPlayers = adpData.players.filter(player => 
          player.adp_rank === adpInfo.adpRank
        );
      } else if (adpInfo.round) {
        const roundStart = (adpInfo.round - 1) * 12 + 1;
        const roundEnd = adpInfo.round * 12;
        filteredPlayers = adpData.players.filter(player => 
          player.adp_rank >= roundStart && player.adp_rank <= roundEnd
        );
      } else if (adpInfo.position) {
        filteredPlayers = adpData.players.filter(player => 
          player.position === adpInfo.position
        );
      }

      return filteredPlayers;
    } catch (error) {
      console.error('Error fetching ADP data:', error);
      return null;
    }
  }

  /**
   * Get ADP data from Supabase historical data
   */
  async getADPDataFromSupabase(adpInfo) {
    try {
      let query = this.supabase
        .from('current_season_adp')
        .select('*')
        .eq('format', 'ppr'); // Default to PPR format
      
      if (adpInfo.adpRank) {
        query = query.eq('rank', adpInfo.adpRank);
      } else if (adpInfo.round) {
        const roundStart = (adpInfo.round - 1) * 12 + 1;
        const roundEnd = adpInfo.round * 12;
        query = query.gte('rank', roundStart).lte('rank', roundEnd);
      } else if (adpInfo.position) {
        query = query.ilike('position', `%${adpInfo.position}%`);
      }
      
      const { data, error } = await query.order('rank');
      
      if (error) {
        console.error('Error querying Supabase ADP data:', error);
        return null;
      }
      
      // Transform to match expected format
      return data.map(player => ({
        player_id: player.player_name, // Use name as ID for now
        full_name: player.player_name,
        position: player.position,
        team_code: player.team,
        adp_rank: player.rank,
        adp_value: player.average_adp,
        draft_year: 2025,
        snapshot_date: new Date().toISOString().split('T')[0]
      }));
      
    } catch (error) {
      console.error('Error getting ADP data from Supabase:', error);
      return null;
    }
  }

  /**
   * Get historical player performance data
   */
  async getHistoricalPlayerData(playerName, seasons = [2020, 2021, 2022, 2023, 2024]) {
    try {
      const { data, error } = await this.supabase
        .from('historical_player_stats')
        .select('*')
        .ilike('player_name', `%${playerName}%`)
        .in('season', seasons)
        .order('season', { ascending: false });
      
      if (error) {
        console.error('Error querying historical player data:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting historical player data:', error);
      return null;
    }
  }

  /**
   * Get historical ADP data for a player
   */
  async getHistoricalADPData(playerName, format = 'ppr', seasons = [2020, 2021, 2022, 2023, 2024]) {
    try {
      const { data, error } = await this.supabase
        .from('historical_adp_data')
        .select('*')
        .ilike('player_name', `%${playerName}%`)
        .eq('format', format)
        .in('season', seasons)
        .order('season', { ascending: false });
      
      if (error) {
        console.error('Error querying historical ADP data:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting historical ADP data:', error);
      return null;
    }
  }
}

export default AIHelper; 