import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
//     const body = await req.json();
// const messages = body.messages;

// if (!Array.isArray(messages)) {
//   return new Response(
//     JSON.stringify({ error: "messages must be an array" }),
//     { status: 400, headers: corsHeaders }
//   );
// }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI Gateway with messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
             model: "gpt-4o-mini",
         messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chatbot error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
