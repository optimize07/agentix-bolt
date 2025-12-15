export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_spy_ads: {
        Row: {
          channel: string | null
          competitor_id: string | null
          created_at: string
          duration_days: number | null
          first_seen_at: string | null
          hook: string | null
          id: string
          is_breakout: boolean | null
          landing_page_url: string | null
          last_seen_at: string | null
          media_type: string
          media_url: string | null
          metrics: Json | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          channel?: string | null
          competitor_id?: string | null
          created_at?: string
          duration_days?: number | null
          first_seen_at?: string | null
          hook?: string | null
          id?: string
          is_breakout?: boolean | null
          landing_page_url?: string | null
          last_seen_at?: string | null
          media_type?: string
          media_url?: string | null
          metrics?: Json | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          channel?: string | null
          competitor_id?: string | null
          created_at?: string
          duration_days?: number | null
          first_seen_at?: string | null
          hook?: string | null
          id?: string
          is_breakout?: boolean | null
          landing_page_url?: string | null
          last_seen_at?: string | null
          media_type?: string
          media_url?: string | null
          metrics?: Json | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_spy_ads_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "ad_spy_competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_spy_board_items: {
        Row: {
          ad_id: string
          board_id: string
          created_at: string
          id: string
          notes: string | null
          position: number | null
        }
        Insert: {
          ad_id: string
          board_id: string
          created_at?: string
          id?: string
          notes?: string | null
          position?: number | null
        }
        Update: {
          ad_id?: string
          board_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_spy_board_items_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ad_spy_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_spy_board_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "ad_spy_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_spy_boards: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ad_spy_competitors: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      ad_spy_research_agents: {
        Row: {
          created_at: string | null
          description: string | null
          filters: Json | null
          id: string
          last_run_at: string | null
          name: string
          query: string
          results_count: number | null
          schedule: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          last_run_at?: string | null
          name: string
          query: string
          results_count?: number | null
          schedule?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          filters?: Json | null
          id?: string
          last_run_at?: string | null
          name?: string
          query?: string
          results_count?: number | null
          schedule?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_spy_search_history: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          query: string | null
          results_count: number | null
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          query?: string | null
          results_count?: number | null
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          query?: string | null
          results_count?: number | null
        }
        Relationships: []
      }
      ad_spy_settings: {
        Row: {
          auto_push_enabled: boolean | null
          breakout_rules: Json | null
          created_at: string
          google_sheets_url: string | null
          id: string
          last_assessment_at: string | null
          updated_at: string
        }
        Insert: {
          auto_push_enabled?: boolean | null
          breakout_rules?: Json | null
          created_at?: string
          google_sheets_url?: string | null
          id?: string
          last_assessment_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_push_enabled?: boolean | null
          breakout_rules?: Json | null
          created_at?: string
          google_sheets_url?: string | null
          id?: string
          last_assessment_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      agent_boards: {
        Row: {
          budget_cap_note: string | null
          created_at: string
          creative_style_notes: string | null
          default_platform: string | null
          description: string | null
          facebook_ad_account_id: string | null
          goal: string | null
          group_name: string | null
          id: string
          name: string
          position: number | null
          redtrack_workspace_id: string | null
          updated_at: string
        }
        Insert: {
          budget_cap_note?: string | null
          created_at?: string
          creative_style_notes?: string | null
          default_platform?: string | null
          description?: string | null
          facebook_ad_account_id?: string | null
          goal?: string | null
          group_name?: string | null
          id?: string
          name: string
          position?: number | null
          redtrack_workspace_id?: string | null
          updated_at?: string
        }
        Update: {
          budget_cap_note?: string | null
          created_at?: string
          creative_style_notes?: string | null
          default_platform?: string | null
          description?: string | null
          facebook_ad_account_id?: string | null
          goal?: string | null
          group_name?: string | null
          id?: string
          name?: string
          position?: number | null
          redtrack_workspace_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_roles: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          group_id: string | null
          icon: string | null
          id: string
          name: string
          project_id: string | null
          system_prompt: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          group_id?: string | null
          icon?: string | null
          id?: string
          name: string
          project_id?: string | null
          system_prompt: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          group_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          project_id?: string | null
          system_prompt?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_roles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          composio_config_json: Json | null
          created_at: string
          id: string
          nanobanan_api_key: string | null
          openrouter_api_key: string | null
          redtrack_api_key: string | null
          updated_at: string
        }
        Insert: {
          composio_config_json?: Json | null
          created_at?: string
          id?: string
          nanobanan_api_key?: string | null
          openrouter_api_key?: string | null
          redtrack_api_key?: string | null
          updated_at?: string
        }
        Update: {
          composio_config_json?: Json | null
          created_at?: string
          id?: string
          nanobanan_api_key?: string | null
          openrouter_api_key?: string | null
          redtrack_api_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          agent_board_id: string | null
          category: string | null
          created_at: string
          description: string | null
          enabled: boolean | null
          file_size: number | null
          group_id: string | null
          id: string
          mime_type: string | null
          name: string
          niche_tag: string | null
          scraped_content: Json | null
          status: string
          tags: string[] | null
          text_content: string | null
          thumbnail_url: string | null
          type: string
          updated_at: string
          url_or_path: string | null
        }
        Insert: {
          agent_board_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          file_size?: number | null
          group_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          niche_tag?: string | null
          scraped_content?: Json | null
          status?: string
          tags?: string[] | null
          text_content?: string | null
          thumbnail_url?: string | null
          type: string
          updated_at?: string
          url_or_path?: string | null
        }
        Update: {
          agent_board_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          file_size?: number | null
          group_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          niche_tag?: string | null
          scraped_content?: Json | null
          status?: string
          tags?: string[] | null
          text_content?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          url_or_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_agent_board_id_fkey"
            columns: ["agent_board_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      board_settings: {
        Row: {
          agent_board_id: string
          composio_config_json: Json | null
          created_at: string
          id: string
          nanobanan_api_key: string | null
          redtrack_api_key: string | null
          updated_at: string
        }
        Insert: {
          agent_board_id: string
          composio_config_json?: Json | null
          created_at?: string
          id?: string
          nanobanan_api_key?: string | null
          redtrack_api_key?: string | null
          updated_at?: string
        }
        Update: {
          agent_board_id?: string
          composio_config_json?: Json | null
          created_at?: string
          id?: string
          nanobanan_api_key?: string | null
          redtrack_api_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_settings_agent_board_id_fkey"
            columns: ["agent_board_id"]
            isOneToOne: true
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_tools: {
        Row: {
          agent_board_id: string
          config: Json | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          agent_board_id: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          agent_board_id?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_tools_agent_board_id_fkey"
            columns: ["agent_board_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_blocks: {
        Row: {
          agent_board_id: string
          asset_id: string | null
          associated_prompt_id: string | null
          color: string | null
          content: string | null
          created_at: string
          file_path: string | null
          group_id: string | null
          height: number | null
          id: string
          instruction_prompt: string | null
          metadata: Json | null
          parsing_status: string | null
          position_x: number | null
          position_y: number | null
          title: string | null
          type: string
          updated_at: string
          url: string | null
          width: number | null
        }
        Insert: {
          agent_board_id: string
          asset_id?: string | null
          associated_prompt_id?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          file_path?: string | null
          group_id?: string | null
          height?: number | null
          id?: string
          instruction_prompt?: string | null
          metadata?: Json | null
          parsing_status?: string | null
          position_x?: number | null
          position_y?: number | null
          title?: string | null
          type: string
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Update: {
          agent_board_id?: string
          asset_id?: string | null
          associated_prompt_id?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          file_path?: string | null
          group_id?: string | null
          height?: number | null
          id?: string
          instruction_prompt?: string | null
          metadata?: Json | null
          parsing_status?: string | null
          position_x?: number | null
          position_y?: number | null
          title?: string | null
          type?: string
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_blocks_agent_board_id_fkey"
            columns: ["agent_board_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_blocks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_blocks_associated_prompt_id_fkey"
            columns: ["associated_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_edges: {
        Row: {
          agent_board_id: string
          color: string | null
          created_at: string
          edge_type: string
          id: string
          metadata: Json | null
          source_block_id: string
          target_block_id: string
          updated_at: string
        }
        Insert: {
          agent_board_id: string
          color?: string | null
          created_at?: string
          edge_type?: string
          id?: string
          metadata?: Json | null
          source_block_id: string
          target_block_id: string
          updated_at?: string
        }
        Update: {
          agent_board_id?: string
          color?: string | null
          created_at?: string
          edge_type?: string
          id?: string
          metadata?: Json | null
          source_block_id?: string
          target_block_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_edges_source_block_id_fkey"
            columns: ["source_block_id"]
            isOneToOne: false
            referencedRelation: "canvas_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_edges_target_block_id_fkey"
            columns: ["target_block_id"]
            isOneToOne: false
            referencedRelation: "canvas_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_groups: {
        Row: {
          agent_board_id: string
          color: string | null
          created_at: string
          height: number | null
          id: string
          name: string
          position_x: number | null
          position_y: number | null
          updated_at: string
          width: number | null
        }
        Insert: {
          agent_board_id: string
          color?: string | null
          created_at?: string
          height?: number | null
          id?: string
          name: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          agent_board_id?: string
          color?: string | null
          created_at?: string
          height?: number | null
          id?: string
          name?: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_session_id: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          chat_session_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          chat_session_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          agent_board_id: string
          canvas_block_id: string | null
          created_at: string
          id: string
          title: string | null
        }
        Insert: {
          agent_board_id: string
          canvas_block_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
        }
        Update: {
          agent_board_id?: string
          canvas_block_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_agent_board_id_fkey"
            columns: ["agent_board_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_canvas_block_id_fkey"
            columns: ["canvas_block_id"]
            isOneToOne: false
            referencedRelation: "canvas_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_groups: {
        Row: {
          color: string | null
          content_type: string
          created_at: string | null
          id: string
          name: string
          position: number | null
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          content_type: string
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_cards: {
        Row: {
          agent_board_id: string
          compliance_notes: string | null
          compliance_status: string | null
          created_at: string
          description_text: string | null
          headline: string | null
          id: string
          image_url: string | null
          is_winner: boolean | null
          notes: string | null
          primary_text: string | null
          redtrack_metrics: Json | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          agent_board_id: string
          compliance_notes?: string | null
          compliance_status?: string | null
          created_at?: string
          description_text?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_winner?: boolean | null
          notes?: string | null
          primary_text?: string | null
          redtrack_metrics?: Json | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          agent_board_id?: string
          compliance_notes?: string | null
          compliance_status?: string | null
          created_at?: string
          description_text?: string | null
          headline?: string | null
          id?: string
          image_url?: string | null
          is_winner?: boolean | null
          notes?: string | null
          primary_text?: string | null
          redtrack_metrics?: Json | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_cards_agent_board_id_fkey"
            columns: ["agent_board_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          project_id: string | null
          stages: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          project_id?: string | null
          stages?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          project_id?: string | null
          stages?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: Database["public"]["Enums"]["integration_category"]
          config: Json
          created_at: string
          id: string
          is_connected: boolean
          name: string
          platform: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["integration_category"]
          config?: Json
          created_at?: string
          id?: string
          is_connected?: boolean
          name: string
          platform: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["integration_category"]
          config?: Json
          created_at?: string
          id?: string
          is_connected?: boolean
          name?: string
          platform?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_entries: {
        Row: {
          content: string | null
          created_at: string | null
          enabled: boolean | null
          group_id: string | null
          id: string
          project_id: string | null
          source_url: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          enabled?: boolean | null
          group_id?: string | null
          id?: string
          project_id?: string | null
          source_url?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          enabled?: boolean | null
          group_id?: string | null
          id?: string
          project_id?: string | null
          source_url?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      market_research: {
        Row: {
          content: string
          created_at: string
          enabled: boolean | null
          file_url: string | null
          group_id: string | null
          id: string
          name: string
          project_id: string | null
          prompt: string | null
          type: Database["public"]["Enums"]["market_research_type"]
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          enabled?: boolean | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          name: string
          project_id?: string | null
          prompt?: string | null
          type: Database["public"]["Enums"]["market_research_type"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          enabled?: boolean | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          name?: string
          project_id?: string | null
          prompt?: string | null
          type?: Database["public"]["Enums"]["market_research_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_research_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_research_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agent_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_assets: {
        Row: {
          created_at: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          offer_id: string
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          offer_id: string
          type: string
          url: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          offer_id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_assets_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          cta: string | null
          description: string | null
          discount: string | null
          enabled: boolean | null
          group_id: string | null
          guarantee: string | null
          id: string
          name: string
          price: string | null
          project_id: string | null
          tags: string[] | null
          updated_at: string
          usp: string | null
        }
        Insert: {
          created_at?: string
          cta?: string | null
          description?: string | null
          discount?: string | null
          enabled?: boolean | null
          group_id?: string | null
          guarantee?: string | null
          id?: string
          name: string
          price?: string | null
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string
          usp?: string | null
        }
        Update: {
          created_at?: string
          cta?: string | null
          description?: string | null
          discount?: string | null
          enabled?: boolean | null
          group_id?: string | null
          guarantee?: string | null
          id?: string
          name?: string
          price?: string | null
          project_id?: string | null
          tags?: string[] | null
          updated_at?: string
          usp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      project_groups: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          position: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_strategies: {
        Row: {
          category: string
          content: string
          created_at: string
          group_id: string | null
          id: string
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          group_id?: string | null
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_strategies_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tools: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          group_id: string | null
          id: string
          name: string
          project_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          group_id?: string | null
          id?: string
          name: string
          project_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          group_id?: string | null
          id?: string
          name?: string
          project_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tools_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          content: string
          created_at: string
          default_variables: Json | null
          enabled: boolean | null
          group_id: string | null
          id: string
          name: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          default_variables?: Json | null
          enabled?: boolean | null
          group_id?: string | null
          id?: string
          name: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          default_variables?: Json | null
          enabled?: boolean | null
          group_id?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_templates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      swipe_files: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          group_id: string | null
          id: string
          image_url: string | null
          parsing_status: string | null
          project_id: string | null
          source_url: string | null
          tags: string[] | null
          text_content: string | null
          title: string
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          parsing_status?: string | null
          project_id?: string | null
          source_url?: string | null
          tags?: string[] | null
          text_content?: string | null
          title: string
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          parsing_status?: string | null
          project_id?: string | null
          source_url?: string | null
          tags?: string[] | null
          text_content?: string | null
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swipe_files_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "content_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      branch_chat_session: {
        Args: {
          p_block_id: string
          p_board_id: string
          p_messages: Json
          p_title: string
        }
        Returns: string
      }
      cleanup_orphaned_data: { Args: never; Returns: Json }
      get_session_image_urls: {
        Args: { p_session_id: string }
        Returns: {
          image_url: string
        }[]
      }
    }
    Enums: {
      integration_category:
        | "network"
        | "crm"
        | "video_creation"
        | "data_storage"
        | "llm"
      market_research_type:
        | "customer_avatar"
        | "competitor"
        | "market_trend"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      integration_category: [
        "network",
        "crm",
        "video_creation",
        "data_storage",
        "llm",
      ],
      market_research_type: [
        "customer_avatar",
        "competitor",
        "market_trend",
        "other",
      ],
    },
  },
} as const
