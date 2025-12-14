# Supabase Edge Functions Setup

## Environment Variables

The edge functions need specific environment variables to work properly.

### Local Development

1. The `.env` file in the `supabase/` directory contains all necessary environment variables
2. When you run `supabase start` or `supabase functions serve`, these variables are automatically loaded
3. **Never commit the `.env` file** - it contains API keys

### Production Deployment

When deploying to Supabase, you need to set secrets via the CLI or Dashboard:

#### Via Supabase CLI:

```bash
# Composio Configuration
supabase secrets set COMPOSIO_BASE_URL=https://backend.composio.dev
supabase secrets set COMPOSIO_API_KEY=ak_HQQLnWmjs5wAfoqkWPOK
supabase secrets set COMPOSIO_AUTH_CONFIG_ID_METAADS=ac_hGF0agSkGxwg
supabase secrets set COMPOSIO_AUTH_CONFIG_ID_GOOGLESHEETS=ac_YAf3GZLMsmFh
supabase secrets set COMPOSIO_AUTH_CONFIG_ID_GOOGLEDRIVE=ac_o4BR4AhfPO2f

# AI API Keys
supabase secrets set GEMINI_API_KEY=your_gemini_key_here
supabase secrets set OPENAI_API_KEY=your_openai_key_here

# Other integrations
supabase secrets set FIRECRAWL_API_KEY=your_firecrawl_key_here
supabase secrets set N8N_URL=your_n8n_url_here
supabase secrets set N8N_API_KEY=your_n8n_key_here
```

#### Via Supabase Dashboard:

1. Go to your Supabase project
2. Navigate to **Settings** → **Edge Functions**
3. Add each environment variable as a secret

## Testing the Setup

### 1. Test Composio Connection

After setting the environment variables, the Meta Ads connection button should work:

1. Go to Settings page in the app
2. Under "Connections", you should see "Meta Ads" with a "Connect" button (not "Configure server")
3. Click "Connect" to initiate OAuth flow

### 2. Test Image Generation

The ad creator should automatically generate images when creating ad variants:

1. Go to Ad Creator
2. Fill in Step 1 (platform, brand, offer, etc.)
3. Click "Generate variants"
4. Step 2 should show ad variants with AI-generated images

## Troubleshooting

### "Configure server" button instead of "Connect"

**Cause:** The `COMPOSIO_BASE_URL` or auth config ID environment variables are not accessible to the edge function.

**Solution:**
- For local: Make sure `supabase/.env` exists and contains:
  ```
  COMPOSIO_BASE_URL=https://backend.composio.dev
  COMPOSIO_AUTH_CONFIG_ID_METAADS=ac_hGF0agSkGxwg
  ```
- For production: Run:
  ```bash
  supabase secrets set COMPOSIO_BASE_URL=https://backend.composio.dev
  supabase secrets set COMPOSIO_AUTH_CONFIG_ID_METAADS=ac_hGF0agSkGxwg
  ```
- Restart your Supabase instance: `supabase stop && supabase start`

### Image generation returns placeholders

**Cause:** The `GEMINI_API_KEY` is not set or invalid.

**Solution:**
- Check that `GEMINI_API_KEY` is set in `supabase/.env` (local) or as a secret (production)
- Verify the API key is valid and has quota remaining
- Check edge function logs: `supabase functions logs generate-ad-images`

### Edge function errors

**Check logs:**
```bash
# All functions
supabase functions logs

# Specific function
supabase functions logs composio-manage-connection
supabase functions logs generate-ad-images
supabase functions logs generate-copy
```

## Required Environment Variables

| Variable | Purpose | Required For |
|----------|---------|--------------|
| `COMPOSIO_BASE_URL` | Composio base URL | All Composio integrations |
| `COMPOSIO_API_KEY` | Composio API authentication | All Composio integrations |
| `COMPOSIO_AUTH_CONFIG_ID_METAADS` | Meta Ads auth config | Meta Ads OAuth |
| `COMPOSIO_AUTH_CONFIG_ID_GOOGLEDRIVE` | Google Drive auth config | Google Drive OAuth |
| `COMPOSIO_AUTH_CONFIG_ID_GOOGLESHEETS` | Google Sheets auth config | Google Sheets OAuth |
| `GEMINI_API_KEY` | Google Gemini API | AI image generation, ad copy generation |
| `OPENAI_API_KEY` | OpenAI API (optional) | Fallback for some features |
| `FIRECRAWL_API_KEY` | Firecrawl web scraping | Website scraping |
| `N8N_URL` | n8n instance URL | Workflow automation |
| `N8N_API_KEY` | n8n API key | Workflow automation |

## How Composio OAuth Works

The edge function constructs OAuth URLs dynamically based on:

1. **Base URL**: `COMPOSIO_BASE_URL=https://backend.composio.dev`
2. **Auth Config ID**: Per-toolkit config (e.g., `COMPOSIO_AUTH_CONFIG_ID_METAADS=ac_hGF0agSkGxwg`)
3. **Redirect URL**: Automatically set to `https://backend.composio.dev/api/v1/auth-apps/add`

Example URL generated for Meta Ads:
```
https://backend.composio.dev/api/v1/auth-apps/add
  ?authConfigId=ac_hGF0agSkGxwg
  &state={"uid":"user-123","toolkit":"metaads","clientId":"client-456"}
```

This allows you to add multiple Composio integrations by simply adding their auth config IDs:
```bash
supabase secrets set COMPOSIO_AUTH_CONFIG_ID_TIKTOK=ac_your_tiktok_config_id
supabase secrets set COMPOSIO_AUTH_CONFIG_ID_LINKEDIN=ac_your_linkedin_config_id
```
