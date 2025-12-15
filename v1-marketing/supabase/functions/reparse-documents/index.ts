import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting document re-parse process...');

    // Query documents needing re-parse from swipe_files
    const { data: swipeFiles, error: swipeError } = await supabase
      .from('swipe_files')
      .select('id, title, file_url')
      .eq('type', 'document')
      .or('text_content.is.null,text_content.eq.');

    if (swipeError) {
      console.error('Error fetching swipe_files:', swipeError);
      throw swipeError;
    }

    // Query documents needing re-parse from canvas_blocks
    const { data: canvasBlocks, error: canvasError } = await supabase
      .from('canvas_blocks')
      .select('id, title, url, file_path')
      .eq('type', 'document')
      .or('content.is.null,content.eq.');

    if (canvasError) {
      console.error('Error fetching canvas_blocks:', canvasError);
      throw canvasError;
    }

    const totalDocs = (swipeFiles?.length || 0) + (canvasBlocks?.length || 0);
    console.log(`Found ${totalDocs} documents to re-parse (${swipeFiles?.length || 0} swipe files, ${canvasBlocks?.length || 0} canvas blocks)`);

    if (totalDocs === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 0, 
        message: 'No documents need re-parsing' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ id: string; title: string; error: string }>,
    };

    // Process swipe_files
    if (swipeFiles && swipeFiles.length > 0) {
      for (const doc of swipeFiles) {
        try {
          console.log(`Processing swipe_file: ${doc.title} (${doc.id})`);

          if (!doc.file_url) {
            console.log(`Skipping ${doc.title} - no file_url`);
            results.skipped++;
            continue;
          }

          // Fetch file from storage URL
          const fileResponse = await fetch(doc.file_url);
          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file: ${fileResponse.status}`);
          }

          const blob = await fileResponse.blob();
          
          // Check file size (skip if > 10MB)
          if (blob.size > 10 * 1024 * 1024) {
            console.log(`Skipping ${doc.title} - file too large (${blob.size} bytes)`);
            results.skipped++;
            continue;
          }

          // Parse via parse-document function
          const formData = new FormData();
          formData.append('file', blob, doc.title);

          const parseResponse = await fetch(
            `${supabaseUrl}/functions/v1/parse-document`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: formData,
            }
          );

          if (!parseResponse.ok) {
            throw new Error(`Parse failed: ${parseResponse.status}`);
          }

          const parsed = await parseResponse.json();

          if (!parsed.content) {
            throw new Error('No content extracted from document');
          }

          // Update database
          const { error: updateError } = await supabase
            .from('swipe_files')
            .update({ text_content: parsed.content })
            .eq('id', doc.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`Successfully re-parsed: ${doc.title}`);
          results.success++;

          // Rate limiting: wait 2 seconds between documents
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Failed to re-parse ${doc.title}:`, error);
          results.failed++;
          results.errors.push({
            id: doc.id,
            title: doc.title,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Process canvas_blocks
    if (canvasBlocks && canvasBlocks.length > 0) {
      for (const block of canvasBlocks) {
        try {
          console.log(`Processing canvas_block: ${block.title} (${block.id})`);

          const fileUrl = block.url || block.file_path;
          if (!fileUrl) {
            console.log(`Skipping ${block.title} - no file URL`);
            results.skipped++;
            continue;
          }

          // Fetch file from storage URL
          const fileResponse = await fetch(fileUrl);
          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file: ${fileResponse.status}`);
          }

          const blob = await fileResponse.blob();
          
          // Check file size (skip if > 10MB)
          if (blob.size > 10 * 1024 * 1024) {
            console.log(`Skipping ${block.title} - file too large (${blob.size} bytes)`);
            results.skipped++;
            continue;
          }

          // Parse via parse-document function
          const formData = new FormData();
          formData.append('file', blob, block.title || 'document');

          const parseResponse = await fetch(
            `${supabaseUrl}/functions/v1/parse-document`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: formData,
            }
          );

          if (!parseResponse.ok) {
            throw new Error(`Parse failed: ${parseResponse.status}`);
          }

          const parsed = await parseResponse.json();

          if (!parsed.content) {
            throw new Error('No content extracted from document');
          }

          // Update database
          const { error: updateError } = await supabase
            .from('canvas_blocks')
            .update({ content: parsed.content })
            .eq('id', block.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`Successfully re-parsed: ${block.title}`);
          results.success++;

          // Rate limiting: wait 2 seconds between documents
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Failed to re-parse ${block.title}:`, error);
          results.failed++;
          results.errors.push({
            id: block.id,
            title: block.title || 'Untitled',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    console.log('Re-parse complete:', results);

    return new Response(JSON.stringify({
      success: true,
      processed: results.success,
      failed: results.failed,
      skipped: results.skipped,
      total: totalDocs,
      errors: results.errors.length > 0 ? results.errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in reparse-documents function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
