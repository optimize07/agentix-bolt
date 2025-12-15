import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fileName = file.name.toLowerCase();
    
    // Detect file type
    const isWordDoc = file.type === 'application/msword' || 
                      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                      fileName.endsWith('.doc') || 
                      fileName.endsWith('.docx');
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
    const isText = file.type === 'text/plain' || fileName.endsWith('.txt');

    let fileContent: string;
    let base64Content: string | null = null;

    if (isText) {
      // Plain text - read directly
      fileContent = await file.text();
      console.log(`Parsing text document: ${file.name}, size: ${fileContent.length} chars`);
    } else if (isWordDoc || isPdf) {
      // Binary documents - convert to base64 for AI processing
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
      base64Content = btoa(binaryString);
      
      console.log(`Parsing binary document: ${file.name}, size: ${arrayBuffer.byteLength} bytes`);
      
      // Will use multimodal vision to extract text
      fileContent = `[Binary ${isWordDoc ? 'Word' : 'PDF'} document - ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB - Using AI vision to extract content]`;
    } else {
      // Try to read as text for other formats
      fileContent = await file.text();
      console.log(`Parsing unknown document type: ${file.name}, size: ${fileContent.length} chars`);
    }

    // Use Lovable AI to extract and summarize content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build messages based on whether we have binary content
    const messages: any[] = [
      {
        role: 'system',
        content: 'You are a document parser. Extract ALL the text content from the document and create a concise title. Return a JSON object with "title" and "content" fields. The title should be short (max 100 chars) and descriptive. The content should include ALL the text from the document, preserving structure and formatting where possible. Extract every word, paragraph, heading, and section. Be thorough and comprehensive.'
      }
    ];

    if (base64Content) {
      // Binary document - use vision to extract text
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract ALL text content from this ${isWordDoc ? 'Microsoft Word' : 'PDF'} document. Parse every page, every paragraph, every heading, and every section. Be extremely thorough and extract the complete text.`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:application/${isPdf ? 'pdf' : 'vnd.openxmlformats-officedocument.wordprocessingml.document'};base64,${base64Content}`
            }
          }
        ]
      });
    } else {
      // Text document - send text directly
      messages.push({
        role: 'user',
        content: `Parse this document:\n\nFilename: ${file.name}\nType: ${isWordDoc ? 'Microsoft Word' : isPdf ? 'PDF' : 'Text'}\n\nContent:\n${fileContent.slice(0, 100000)}`
      });
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Use Pro for better document understanding
        messages,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const parsedContent = aiData.choices[0].message.content;
    const result = JSON.parse(parsedContent);

    console.log('Document parsed successfully:', { title: result.title });

    return new Response(JSON.stringify({
      title: result.title || file.name,
      content: result.content || fileContent.slice(0, 5000),
      originalFileName: file.name,
      fileSize: fileContent.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-document function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
