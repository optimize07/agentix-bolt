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
      ai_conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_calls: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tool_calls?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_theme_presets: {
        Row: {
          colors: Json
          created_at: string | null
          id: string
          mode: string
          name: string
          organization_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          colors: Json
          created_at?: string | null
          id?: string
          mode: string
          name: string
          organization_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string | null
          id?: string
          mode?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_theme_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          layout_config: Json
          name: string
          organization_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config: Json
          name: string
          organization_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name?: string
          organization_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          created_at: string | null
          default_value: string | null
          display_order: number
          field_label: string
          field_type: string
          form_template_id: string
          glossary_term_id: string | null
          id: string
          is_required: boolean | null
          options: Json | null
          placeholder: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          display_order?: number
          field_label: string
          field_type: string
          form_template_id: string
          glossary_term_id?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          placeholder?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          display_order?: number
          field_label?: string
          field_type?: string
          form_template_id?: string
          glossary_term_id?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          placeholder?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_glossary_term_id_fkey"
            columns: ["glossary_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_role_assignments: {
        Row: {
          created_at: string | null
          form_template_id: string
          id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          form_template_id: string
          id?: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          form_template_id?: string
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_role_assignments_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "niche_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          form_template_id: string
          id: string
          organization_id: string
          submission_data: Json
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          form_template_id: string
          id?: string
          organization_id: string
          submission_data: Json
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          form_template_id?: string
          id?: string
          organization_id?: string
          submission_data?: Json
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_template_presets: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          fields: Json
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          niche_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          fields: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          niche_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          niche_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_template_presets_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          alternative_examples: string | null
          category: string | null
          created_at: string | null
          default_label: string
          description: string | null
          display_order: number | null
          id: string
          niche_id: string
          term_key: string
        }
        Insert: {
          alternative_examples?: string | null
          category?: string | null
          created_at?: string | null
          default_label: string
          description?: string | null
          display_order?: number | null
          id?: string
          niche_id: string
          term_key: string
        }
        Update: {
          alternative_examples?: string | null
          category?: string | null
          created_at?: string | null
          default_label?: string
          description?: string | null
          display_order?: number | null
          id?: string
          niche_id?: string
          term_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_terms_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_field_mappings: {
        Row: {
          created_at: string | null
          external_field_name: string
          glossary_term_id: string | null
          id: string
          integration_id: string
          mapping_config: Json | null
        }
        Insert: {
          created_at?: string | null
          external_field_name: string
          glossary_term_id?: string | null
          id?: string
          integration_id: string
          mapping_config?: Json | null
        }
        Update: {
          created_at?: string | null
          external_field_name?: string
          glossary_term_id?: string | null
          id?: string
          integration_id?: string
          mapping_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_field_mappings_glossary_term_id_fkey"
            columns: ["glossary_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_field_mappings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "organization_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_providers: {
        Row: {
          auth_type: string
          config_schema: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          webhook_events: Json | null
        }
        Insert: {
          auth_type: string
          config_schema: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          webhook_events?: Json | null
        }
        Update: {
          auth_type?: string
          config_schema?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          webhook_events?: Json | null
        }
        Relationships: []
      }
      niche_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          niche_id: string | null
          permissions: Json
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          niche_id?: string | null
          permissions?: Json
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          niche_id?: string | null
          permissions?: Json
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "niche_roles_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      niches: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_template: boolean | null
          name: string
          organizational_type: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean | null
          name: string
          organizational_type: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean | null
          name?: string
          organizational_type?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_form_template_presets: {
        Row: {
          created_at: string | null
          form_template_preset_id: string
          id: string
          is_active: boolean | null
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          form_template_preset_id: string
          id?: string
          is_active?: boolean | null
          organization_id: string
        }
        Update: {
          created_at?: string | null
          form_template_preset_id?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_form_template_presets_form_template_preset_id_fkey"
            columns: ["form_template_preset_id"]
            isOneToOne: false
            referencedRelation: "form_template_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_form_template_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_glossary_overrides: {
        Row: {
          created_at: string | null
          custom_label: string
          glossary_term_id: string
          id: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_label: string
          glossary_term_id: string
          id?: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_label?: string
          glossary_term_id?: string
          id?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_glossary_overrides_glossary_term_id_fkey"
            columns: ["glossary_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_glossary_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          credentials_encrypted: string | null
          id: string
          last_sync_at: string | null
          organization_id: string
          provider_id: string
          status: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id: string
          provider_id: string
          status?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string
          provider_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_integrations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sales_process: {
        Row: {
          custom_stages: Json | null
          organization_id: string
          sales_process_id: string
          updated_at: string | null
        }
        Insert: {
          custom_stages?: Json | null
          organization_id: string
          sales_process_id: string
          updated_at?: string | null
        }
        Update: {
          custom_stages?: Json | null
          organization_id?: string
          sales_process_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_sales_process_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_sales_process_sales_process_id_fkey"
            columns: ["sales_process_id"]
            isOneToOne: false
            referencedRelation: "sales_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_sales_processes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          sales_process_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          sales_process_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          sales_process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_sales_processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_sales_processes_sales_process_id_fkey"
            columns: ["sales_process_id"]
            isOneToOne: false
            referencedRelation: "sales_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_theme_settings: {
        Row: {
          created_at: string
          dark_background_config: Json | null
          dark_button_config: Json | null
          dark_card_config: Json | null
          dark_colors: Json | null
          dark_divider_config: Json | null
          dark_glass_config: Json | null
          dark_sidebar_config: Json | null
          dark_status_colors: Json | null
          id: string
          light_background_config: Json | null
          light_button_config: Json | null
          light_card_config: Json | null
          light_colors: Json | null
          light_divider_config: Json | null
          light_glass_config: Json | null
          light_sidebar_config: Json | null
          light_status_colors: Json | null
          mode: string | null
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dark_background_config?: Json | null
          dark_button_config?: Json | null
          dark_card_config?: Json | null
          dark_colors?: Json | null
          dark_divider_config?: Json | null
          dark_glass_config?: Json | null
          dark_sidebar_config?: Json | null
          dark_status_colors?: Json | null
          id?: string
          light_background_config?: Json | null
          light_button_config?: Json | null
          light_card_config?: Json | null
          light_colors?: Json | null
          light_divider_config?: Json | null
          light_glass_config?: Json | null
          light_sidebar_config?: Json | null
          light_status_colors?: Json | null
          mode?: string | null
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dark_background_config?: Json | null
          dark_button_config?: Json | null
          dark_card_config?: Json | null
          dark_colors?: Json | null
          dark_divider_config?: Json | null
          dark_glass_config?: Json | null
          dark_sidebar_config?: Json | null
          dark_status_colors?: Json | null
          id?: string
          light_background_config?: Json | null
          light_button_config?: Json | null
          light_card_config?: Json | null
          light_colors?: Json | null
          light_divider_config?: Json | null
          light_glass_config?: Json | null
          light_sidebar_config?: Json | null
          light_status_colors?: Json | null
          mode?: string | null
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_theme_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizational_units: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          parent_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          parent_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizational_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizational_units_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          niche_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          niche_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          niche_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          features: Json | null
          id: string
          is_default: boolean | null
          name: string
          price: number
          product_id: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          features?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          price: number
          product_id: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          features?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_processes: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          niche_id: string | null
          slug: string
          stages: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          niche_id?: string | null
          slug: string
          stages: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          niche_id?: string | null
          slug?: string
          stages?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sales_processes_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "niches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizational_units: {
        Row: {
          unit_id: string
          user_id: string
        }
        Insert: {
          unit_id: string
          user_id: string
        }
        Update: {
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizational_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "niche_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      get_user_role_in_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: string
      }
      user_has_permission: {
        Args: { _org_id: string; _permission_path: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
