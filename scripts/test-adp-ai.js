import 'dotenv/config';
import AIHelper from './ai-helper.js';

class ADPTestRunner {
  constructor() {
    this.aiHelper = new AIHelper();
  }

  /**
   * Test various ADP questions
   */
  async runADPTests() {
    console.log('🧪 Testing ADP AI functionality...\n');
    
    const testQuestions = [
      "Who is ADP 15?",
      "Who goes in round 2?",
      "Show me top 10 players",
      "What's the ADP for round 3?",
      "Who is pick 20?",
      "What can you help me with?"
    ];
    
    for (const question of testQuestions) {
      console.log(`❓ Question: "${question}"`);
      
      try {
        const response = await this.aiHelper.processQuestion(question);
        
        if (response.success) {
          console.log(`✅ Answer: ${response.answer}`);
          console.log(`📊 Confidence: ${response.confidence}`);
          console.log(`🔍 Reasoning: ${response.reasoning}`);
        } else {
          console.log(`❌ Failed: ${response.answer}`);
          console.log(`🔍 Reasoning: ${response.reasoning}`);
        }
        
        if (response.data) {
          console.log(`📈 Data: ${JSON.stringify(response.data, null, 2)}`);
        }
        
      } catch (error) {
        console.error(`💥 Error processing question:`, error);
      }
      
      console.log('\n' + '─'.repeat(80) + '\n');
    }
    
    console.log('🎉 ADP AI testing completed!');
  }
}

// Run the tests
const tester = new ADPTestRunner();
await tester.runADPTests(); 