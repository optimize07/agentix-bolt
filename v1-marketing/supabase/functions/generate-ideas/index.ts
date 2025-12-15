import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandName, brandDescription, goal, creativeStyle, targetAudience, niche } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const systemPrompt = `You are a social media content strategist. Generate highly actionable, specific, and creative content ideas.

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, just raw JSON.`;

const userPrompt = `Generate content ideas for:
- Brand: ${brandName || 'a social media brand'}
- Description: ${brandDescription || 'Social media content creator'}
- Goal: ${goal || 'Grow engagement and followers'}
- Creative Style: ${creativeStyle || 'Engaging and authentic'}
- Target Audience: ${targetAudience || 'General social media users'}
- Niche: ${niche || 'Social media marketing'}
- Today's Date: ${currentDate}

Generate a JSON response with this exact structure:
{
  "trends": [
    {
      "title": "Trend title",
      "description": "Why this is trending",
      "angle": "How to leverage it",
      "urgency": "high/medium/low"
    }
  ],
  "currentEvents": [
    {
      "title": "Event or news title",
      "description": "What's happening",
      "angle": "Content angle to take",
      "relevance": "Why it matters to the audience"
    }
  ],
  "hooks": [
    {
      "hook": "The actual hook text",
      "example": "Example using the brand context",
      "platform": "Best platform for this hook",
      "type": "question/statement/story/controversial/curiosity"
    }
  ],
  "contentIdeas": [
    {
      "title": "Content idea title",
      "description": "Full description of the content",
      "platform": "Recommended platform",
      "format": "reel/carousel/story/post/thread",
      "cta": "Suggested call to action"
    }
  ],
  "longFormIdeas": [
    {
      "title": "Long-form content title",
      "type": "blog_post/youtube_script/newsletter/twitter_thread",
      "outline": ["Point 1", "Point 2", "Point 3"],
      "estimatedLength": "1500 words or 10 min video",
      "targetAudience": "Who this is for"
    }
  ]
}

Generate:
- 3 trending topics in the niche
- 3 current events to leverage
- 5 attention-grabbing hooks
- 5 ready-to-post content ideas
- 4 long-form content ideas (1 blog post, 1 YouTube script, 1 newsletter, 1 Twitter thread)

Make everything specific, actionable, and relevant for TODAY.`;

    console.log('Generating ideas for:', brandName || 'general brand');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('Raw AI response:', content.substring(0, 200));

    // Parse the JSON response, handling potential markdown code blocks
    let ideas;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      ideas = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Content was:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('Successfully generated ideas');

    return new Response(JSON.stringify(ideas), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ideas:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
