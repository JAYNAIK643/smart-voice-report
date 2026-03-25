import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
// import { serve } from "std/http/server.ts";
/// <reference lib="deno.window" />
/// <reference types="https://deno.land/x/types/index.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keywords for urgency detection
const URGENCY_KEYWORDS = {
  critical: ['emergency', 'urgent', 'dangerous', 'hazard', 'accident', 'injury', 'flooding', 'collapsed', 'fire', 'explosion', 'gas leak', 'sewage overflow', 'electric shock', 'open manhole', 'broken main'],
  high: ['broken', 'burst', 'no water', 'no power', 'blocked', 'overflowing', 'major', 'severe', 'unsafe', 'health risk', 'multiple days', 'widespread'],
  medium: ['damaged', 'leaking', 'pothole', 'not working', 'delayed', 'irregular', 'missed', 'incomplete'],
  low: ['minor', 'small', 'cosmetic', 'suggestion', 'improvement', 'request', 'inquiry']
};

// Category keywords for fallback
const CATEGORY_KEYWORDS = {
  'Water Supply': ['water', 'pipe', 'leak', 'tap', 'pressure', 'supply', 'drinking', 'tank', 'pump', 'drainage', 'sewage', 'pipeline'],
  'Road Maintenance': ['road', 'pothole', 'street', 'pavement', 'sidewalk', 'footpath', 'asphalt', 'crack', 'bridge', 'traffic', 'signal'],
  'Garbage Collection': ['garbage', 'trash', 'waste', 'bin', 'dump', 'litter', 'pickup', 'collection', 'recycling', 'smell', 'rats'],
  'Street Lighting': ['light', 'lamp', 'dark', 'pole', 'bulb', 'streetlight', 'night', 'visibility', 'flickering'],
  'Parks & Gardens': ['park', 'garden', 'tree', 'grass', 'plant', 'bench', 'playground', 'green', 'landscape'],
  'Public Buildings': ['building', 'office', 'hall', 'library', 'center', 'facility', 'maintenance', 'repair']
};

function detectUrgency(text: string): { level: string; keywords: string[] } {
  const lowerText = text.toLowerCase();
  const detectedKeywords: string[] = [];
  
  for (const keyword of URGENCY_KEYWORDS.critical) {
    if (lowerText.includes(keyword)) {
      detectedKeywords.push(keyword);
    }
  }
  if (detectedKeywords.length > 0) {
    return { level: 'critical', keywords: detectedKeywords };
  }
  
  for (const keyword of URGENCY_KEYWORDS.high) {
    if (lowerText.includes(keyword)) {
      detectedKeywords.push(keyword);
    }
  }
  if (detectedKeywords.length > 0) {
    return { level: 'high', keywords: detectedKeywords };
  }
  
  for (const keyword of URGENCY_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) {
      detectedKeywords.push(keyword);
    }
  }
  if (detectedKeywords.length > 0) {
    return { level: 'medium', keywords: detectedKeywords };
  }
  
  return { level: 'low', keywords: [] };
}

function keywordCategorize(text: string): { category: string; confidence: number } | null {
  const lowerText = text.toLowerCase();
  let bestMatch = { category: '', count: 0 };
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let count = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) count++;
    }
    if (count > bestMatch.count) {
      bestMatch = { category, count };
    }
  }
  
  if (bestMatch.count > 0) {
    // Calculate confidence based on keyword matches
    const confidence = Math.min(0.5 + (bestMatch.count * 0.1), 0.75);
    return { category: bestMatch.category, confidence };
  }
  
  return null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, title } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const combinedText = `${title || ''} ${description || ''}`.trim();
    
    if (!combinedText) {
      return new Response(JSON.stringify({ 
        error: "No text provided for categorization" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect urgency using keywords
    const urgencyResult = detectUrgency(combinedText);

    console.log("Categorizing complaint:", combinedText.substring(0, 100));

    // Use AI for categorization with structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Fallback to keyword-based categorization
      const keywordResult = keywordCategorize(combinedText);
      
      return new Response(JSON.stringify({
        category: keywordResult?.category || 'Other',
        confidence: keywordResult?.confidence || 0.3,
        reasoning: 'Categorized using keyword analysis (AI unavailable)',
        priority: urgencyResult.level,
        urgencyKeywords: urgencyResult.keywords,
        isAISuggestion: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log("AI response:", content);

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
      console.error("Failed to parse AI response:", parseError);
      // Fallback to keyword-based categorization
      const keywordResult = keywordCategorize(combinedText);
      aiResult = {
        category: keywordResult?.category || 'Other',
        confidence: keywordResult?.confidence || 0.4,
        reasoning: 'Categorized using keyword analysis'
      };
    }

    // Combine AI categorization with urgency detection
    const result = {
      category: aiResult.category || 'Other',
      confidence: Math.round((aiResult.confidence || 0.5) * 100) / 100,
      reasoning: aiResult.reasoning || 'AI-based categorization',
      priority: urgencyResult.level,
      urgencyKeywords: urgencyResult.keywords,
      isAISuggestion: true
    };

    console.log("Categorization result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI categorize error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
