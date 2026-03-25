/**
 * AI Service Layer
 * Handles all AI/ML operations including categorization and chatbot functionality
 * Replaces Supabase Edge Functions with native Node.js implementation
 */

const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.LOVABLE_API_KEY;
    this.baseUrl = 'https://ai.gateway.lovable.dev/v1';
    
    // Validate API key exists
    if (!this.apiKey) {
      console.warn('⚠️  LOVABLE_API_KEY is not configured. AI features will use fallback mode.');
    }

    // Urgency detection keywords (copied from Supabase function)
    this.URGENCY_KEYWORDS = {
      critical: ['emergency', 'urgent', 'dangerous', 'hazard', 'accident', 'injury', 'flooding', 'collapsed', 'fire', 'explosion', 'gas leak', 'sewage overflow', 'electric shock', 'open manhole', 'broken main'],
      high: ['broken', 'burst', 'no water', 'no power', 'blocked', 'overflowing', 'major', 'severe', 'unsafe', 'health risk', 'multiple days', 'widespread'],
      medium: ['damaged', 'leaking', 'pothole', 'not working', 'delayed', 'irregular', 'missed', 'incomplete'],
      low: ['minor', 'small', 'cosmetic', 'suggestion', 'improvement', 'request', 'inquiry']
    };

    // Category keywords for fallback
    this.CATEGORY_KEYWORDS = {
      'Water Supply': ['water', 'pipe', 'leak', 'tap', 'pressure', 'supply', 'drinking', 'tank', 'pump', 'drainage', 'sewage', 'pipeline'],
      'Road Maintenance': ['road', 'pothole', 'street', 'pavement', 'sidewalk', 'footpath', 'asphalt', 'crack', 'bridge', 'traffic', 'signal'],
      'Garbage Collection': ['garbage', 'trash', 'waste', 'bin', 'dump', 'litter', 'pickup', 'collection', 'recycling', 'smell', 'rats'],
      'Street Lighting': ['light', 'lamp', 'dark', 'pole', 'bulb', 'streetlight', 'night', 'visibility', 'flickering'],
      'Parks & Gardens': ['park', 'garden', 'tree', 'grass', 'plant', 'bench', 'playground', 'green', 'landscape'],
      'Public Buildings': ['building', 'office', 'hall', 'library', 'center', 'facility', 'maintenance', 'repair']
    };
  }

  /**
   * Detect urgency level from text
   * @param {string} text - Input text to analyze
   * @returns {{level: string, keywords: string[]}} Urgency level and matched keywords
   */
  detectUrgency(text) {
    const lowerText = text.toLowerCase();
    const detectedKeywords = [];
    
    // Check each urgency level from most to least critical
    for (const [level, keywords] of Object.entries(this.URGENCY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          detectedKeywords.push(keyword);
        }
      }
      if (detectedKeywords.length > 0 && level !== 'low') {
        return { level, keywords: detectedKeywords };
      }
    }
    
    return { level: 'low', keywords: [] };
  }

  /**
   * Categorize using keyword matching (fallback method)
   * @param {string} text - Input text to categorize
   * @returns {{category: string, confidence: number}|null} Category and confidence score
   */
  keywordCategorize(text) {
    const lowerText = text.toLowerCase();
    let bestMatch = { category: '', count: 0 };
    
    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      let count = 0;
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) count++;
      }
      if (count > bestMatch.count) {
        bestMatch = { category, count };
      }
    }
    
    if (bestMatch.count > 0) {
      // Calculate confidence based on keyword matches (max 0.75)
      const confidence = Math.min(0.5 + (bestMatch.count * 0.1), 0.75);
      return { category: bestMatch.category, confidence };
    }
    
    return null;
  }

  /**
   * Categorize a complaint using AI with keyword fallback
   * @param {string} title - Complaint title
   * @param {string} description - Complaint description
   * @returns {Promise<object>} Categorization result
   */
  async categorizeComplaint(title, description) {
    const combinedText = `${title || ''} ${description || ''}`.trim();
    
    if (!combinedText) {
      throw new Error('No text provided for categorization');
    }

    console.log('[AIService] Categorizing complaint:', combinedText.substring(0, 100));

    // First, detect urgency using keywords
    const urgencyResult = this.detectUrgency(combinedText);

    // If API key is not available, use keyword-based categorization
    if (!this.apiKey) {
      console.log('[AIService] Using keyword-based categorization (no API key)');
      const keywordResult = this.keywordCategorize(combinedText);
      
      return {
        category: keywordResult?.category || 'Other',
        confidence: keywordResult?.confidence || 0.3,
        reasoning: 'Categorized using keyword analysis (AI unavailable)',
        priority: urgencyResult.level,
        urgencyKeywords: urgencyResult.keywords,
        isAISuggestion: false
      };
    }

    try {
      // Use AI for categorization with structured output
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: `You are an AI that categorizes municipal complaints. Analyze the complaint and return a JSON response.

Available categories:
- Water Supply: Issues with water pressure, quality, leakage, supply interruptions, pipes, tanks
- Road Maintenance: Potholes, damaged roads, broken sidewalks, traffic signals, bridges
- Garbage Collection: Missed pickups, illegal dumping, bin placement, waste management
- Street Lighting: Broken lights, dark areas, flickering lights, lamp posts
- Parks & Gardens: Tree issues, playground maintenance, landscaping, green spaces
- Public Buildings: Government buildings, community centers, public facilities
- Other: Issues that don't fit any category above

Respond with ONLY a JSON object in this exact format:
{"category": "category name", "confidence": 0.0 to 1.0, "reasoning": "brief explanation"}`
            },
            { 
              role: "user", 
              content: `Categorize this complaint:\n\nTitle: ${title || 'Not provided'}\nDescription: ${description || 'Not provided'}` 
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      const content = data.choices?.[0]?.message?.content || '';
      
      console.log('[AIService] AI response:', content);

      // Parse the JSON response from AI
      let aiResult;
      try {
        // Extract JSON from the response (handle markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error('[AIService] Failed to parse AI response:', parseError);
        // Fallback to keyword-based categorization
        const keywordResult = this.keywordCategorize(combinedText);
        aiResult = {
          category: keywordResult?.category || 'Other',
          confidence: keywordResult?.confidence || 0.4,
          reasoning: 'Categorized using keyword analysis'
        };
      }

      // Combine AI categorization with urgency detection
      return {
        category: aiResult.category || 'Other',
        confidence: Math.round((aiResult.confidence || 0.5) * 100) / 100,
        reasoning: aiResult.reasoning || 'AI-based categorization',
        priority: urgencyResult.level,
        urgencyKeywords: urgencyResult.keywords,
        isAISuggestion: true
      };

    } catch (error) {
      console.error('[AIService] AI categorization error:', error.message);
      
      // Fallback to keyword-based categorization on error
      const keywordResult = this.keywordCategorize(combinedText);
      
      return {
        category: keywordResult?.category || 'Other',
        confidence: keywordResult?.confidence || 0.3,
        reasoning: 'Categorized using keyword analysis (AI error)',
        priority: urgencyResult.level,
        urgencyKeywords: urgencyResult.keywords,
        isAISuggestion: false
      };
    }
  }

  /**
   * Stream chatbot response
   * @param {Array<{role: string, content: string}>} messages - Conversation history
   * @param {Function} onChunk - Callback for streaming chunks
   * @returns {Promise<string>} Complete assistant message
   */
  async streamChatResponse(messages, onChunk) {
    const SYSTEM_PROMPT = `You are a helpful AI assistant for the Municipal Grievance Redressal System. Your role is to:

1. Help citizens understand how to submit complaints about municipal services
2. Guide users through the complaint submission process - actively ask about their issue details
3. Explain how to track their complaint status
4. Provide information about available municipal services (water supply, roads, garbage collection, street lighting)
5. Answer FAQs about the grievance system
6. Be empathetic and supportive when citizens express frustration

IMPORTANT - Complaint Detail Extraction:
When users describe issues, actively gather these details through natural conversation:
- What type of issue (water, roads, garbage, lighting)?
- Where is the problem located (street name, area, landmark)?
- How severe is the issue?
- How long has it been happening?

After gathering sufficient details, encourage users to click "Fill Form" when prompted to auto-fill the complaint form.

Available services for complaints:
- Water Supply: Issues with water pressure, quality, leakage, or supply interruptions
- Roads & Infrastructure: Potholes, damaged roads, broken sidewalks, traffic signals
- Garbage Collection: Missed pickups, illegal dumping, bin placement issues
- Street Lighting: Broken lights, dark areas, flickering lights

Important features to mention:
- Citizens can submit complaints online 24/7
- Each complaint gets a unique tracking ID
- Real-time status updates are available
- Average resolution time varies by issue type

Keep responses concise (2-3 sentences max), friendly, and helpful. Ask follow-up questions to gather complaint details naturally. If users want to submit a complaint, guide them to use the Submit Complaint page. If they want to track a complaint, direct them to the Track Complaint page.`;

    if (!this.apiKey) {
      return "I'm currently unavailable due to configuration issues. Please contact support or try again later.";
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages
          ],
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          responseType: 'stream',
        }
      );

      let fullContent = '';
      
      // Handle streaming response
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  if (onChunk) onChunk(content);
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        });

        response.data.on('end', () => {
          resolve(fullContent);
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });

    } catch (error) {
      console.error('[AIService] Chatbot error:', error.message);
      throw new Error('Failed to get chatbot response');
    }
  }
}

// Export singleton instance
module.exports = new AIService();
