-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- CREATE ALL TABLES FIRST (NO RLS POLICIES)
-- ============================================

-- 1. Niches table
create table public.niches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  organizational_type text not null check (organizational_type in ('teams', 'areas', 'departments')),
  is_system_template boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Organizations table
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche_id uuid references public.niches(id) not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  organization_id uuid references public.organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Niche roles table
create table public.niche_roles (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid references public.niches(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  is_system_role boolean default false,
  created_at timestamptz default now(),
  unique(niche_id, slug)
);

-- 5. User roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  role_id uuid references public.niche_roles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, organization_id, role_id)
);

-- 6. Organizational units table
create table public.organizational_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  type text not null,
  parent_id uuid references public.organizational_units(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 7. User organizational units table
create table public.user_organizational_units (
  user_id uuid references auth.users(id) on delete cascade not null,
  unit_id uuid references public.organizational_units(id) on delete cascade not null,
  primary key (user_id, unit_id)
);

-- 8. Glossary terms table
create table public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid references public.niches(id) on delete cascade not null,
  term_key text not null,
  default_label text not null,
  description text,
  category text,
  created_at timestamptz default now(),
  unique(niche_id, term_key)
);

-- 9. Organization glossary overrides table
create table public.organization_glossary_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  glossary_term_id uuid references public.glossary_terms(id) on delete cascade not null,
  custom_label text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, glossary_term_id)
);

-- 10. Sales processes table
create table public.sales_processes (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid references public.niches(id),
  name text not null,
  slug text not null,
  stages jsonb not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  unique(niche_id, slug)
);

-- 11. Organization sales process table
create table public.organization_sales_process (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  sales_process_id uuid references public.sales_processes(id) not null,
  custom_stages jsonb,
  updated_at timestamptz default now()
);

-- 12. Products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  base_price decimal(10,2),
  currency text default 'USD',
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 13. Product variations table
create table public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null,
  price decimal(10,2) not null,
  billing_cycle text,
  features jsonb default '[]'::jsonb,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 14. Dashboard layouts table
create table public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  name text not null,
  layout_config jsonb not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 15. Integration providers table
create table public.integration_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  auth_type text not null check (auth_type in ('oauth2', 'api_key', 'webhook')),
  config_schema jsonb not null,
  webhook_events jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 16. Organization integrations table
create table public.organization_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  provider_id uuid references public.integration_providers(id) not null,
  credentials_encrypted text,
  config jsonb default '{}'::jsonb,
  last_sync_at timestamptz,
  status text default 'active' check (status in ('active', 'error', 'paused')),
  created_at timestamptz default now(),
  unique(organization_id, provider_id)
);

-- 17. Integration field mappings table
create table public.integration_field_mappings (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.organization_integrations(id) on delete cascade not null,
  glossary_term_id uuid references public.glossary_terms(id),
  external_field_name text not null,
  mapping_config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- SECURITY DEFINER FUNCTIONS (BEFORE RLS)
-- ============================================

create or replace function public.get_user_role_in_org(_user_id uuid, _org_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ur.role_id
  from public.user_roles ur
  where ur.user_id = _user_id
    and ur.organization_id = _org_id
  limit 1;
$$;

create or replace function public.user_has_permission(
  _user_id uuid,
  _org_id uuid,
  _permission_path text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  role_permissions jsonb;
  perm_parts text[];
  perm_value boolean;
begin
  select nr.permissions into role_permissions
  from public.user_roles ur
  join public.niche_roles nr on ur.role_id = nr.id
  where ur.user_id = _user_id
    and ur.organization_id = _org_id;

  if role_permissions is null then
    return false;
  end if;

  perm_parts := string_to_array(_permission_path, '.');
  perm_value := (role_permissions #>> perm_parts)::boolean;

  return coalesce(perm_value, false);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

alter table public.niches enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.niche_roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.organizational_units enable row level security;
alter table public.user_organizational_units enable row level security;
alter table public.glossary_terms enable row level security;
alter table public.organization_glossary_overrides enable row level security;
alter table public.sales_processes enable row level security;
alter table public.organization_sales_process enable row level security;
alter table public.products enable row level security;
alter table public.product_variations enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.integration_providers enable row level security;
alter table public.organization_integrations enable row level security;
alter table public.integration_field_mappings enable row level security;

-- ============================================
-- RLS POLICIES
-- ============================================

create policy "Niches are viewable by everyone"
on public.niches for select
to authenticated
using (true);

create policy "Users can view their organization"
on public.organizations for select
to authenticated
using (
  id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can view profiles in their org"
on public.profiles for select
to authenticated
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid());

create policy "Roles are viewable by authenticated users"
on public.niche_roles for select
to authenticated
using (true);

create policy "Users can view roles in their org"
on public.user_roles for select
to authenticated
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can view units in their org"
on public.organizational_units for select
to authenticated
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can view their unit assignments"
on public.user_organizational_units for select
to authenticated
using (user_id = auth.uid());

create policy "Glossary terms are viewable by authenticated users"
on public.glossary_terms for select
to authenticated
using (true);

create policy "Users can view glossary overrides in their org"
on public.organization_glossary_overrides for select
to authenticated
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "Sales processes are viewable by authenticated users"
on public.sales_processes for select
to authenticated
using (true);

create policy "Users can view their org sales process"
on public.organization_sales_process for select
to authenticated
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can view products in their org"
on public.products for select
to authenticated
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can view product variations"
on public.product_variations for select
to authenticated
using (
  product_id in (
    select id from public.products where organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  )
);

create policy "Users can view dashboards in their org"
on public.dashboard_layouts for select
to authenticated
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
  and (user_id is null or user_id = auth.uid())
);

create policy "Integration providers are viewable by authenticated users"
on public.integration_providers for select
to authenticated
using (true);

create policy "Users can view integrations in their org"
on public.organization_integrations for select
to authenticated
using (
  organization_id in (
    select organization_id from public.profiles where id = auth.uid()
  )
);

create policy "Users can view field mappings for their org integrations"
on public.integration_field_mappings for select
to authenticated
using (
  integration_id in (
    select id from public.organization_integrations where organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  )
);

-- ============================================
-- SEED DATA
-- ============================================

insert into public.niches (name, slug, description, organizational_type, is_system_template) values
('Dentistry', 'dentistry', 'Dental practices and clinics', 'departments', true),
('Real Estate', 'real-estate', 'Real estate agencies and brokerages', 'teams', true),
('Insurance', 'insurance', 'Insurance agencies and brokers', 'areas', true),
('SaaS Sales', 'saas-sales', 'Software as a Service sales teams', 'teams', true),
('Legal Services', 'legal-services', 'Law firms and legal practices', 'departments', true);

do $$
declare
  niche_record record;
begin
  for niche_record in select id from public.niches
  loop
    insert into public.niche_roles (niche_id, name, slug, description, permissions, is_system_role) values
    (niche_record.id, 'Owner', 'owner', 'Full access to all features', '{"glossary": {"view": true, "edit": true}, "products": {"view": true, "edit": true, "delete": true}, "users": {"view": true, "invite": true, "edit_roles": true}, "dashboards": {"view": true, "edit": true, "delete": true}, "integrations": {"view": true, "configure": true}}'::jsonb, true),
    (niche_record.id, 'Admin', 'admin', 'Administrative access', '{"glossary": {"view": true, "edit": true}, "products": {"view": true, "edit": true, "delete": false}, "users": {"view": true, "invite": true, "edit_roles": false}, "dashboards": {"view": true, "edit": true, "delete": false}, "integrations": {"view": true, "configure": false}}'::jsonb, true),
    (niche_record.id, 'Manager', 'manager', 'Team management access', '{"glossary": {"view": true, "edit": false}, "products": {"view": true, "edit": true, "delete": false}, "users": {"view": true, "invite": false, "edit_roles": false}, "dashboards": {"view": true, "edit": true, "delete": false}, "integrations": {"view": false, "configure": false}}'::jsonb, true),
    (niche_record.id, 'Member', 'member', 'Basic member access', '{"glossary": {"view": true, "edit": false}, "products": {"view": true, "edit": false, "delete": false}, "users": {"view": true, "invite": false, "edit_roles": false}, "dashboards": {"view": true, "edit": false, "delete": false}, "integrations": {"view": false, "configure": false}}'::jsonb, true);
  end loop;
end $$;

insert into public.glossary_terms (niche_id, term_key, default_label, description, category)
select id, 'lead', 'Lead', 'Potential patient inquiry', 'entity' from public.niches where slug = 'dentistry'
union all
select id, 'contact', 'Patient', 'Active or past patient', 'entity' from public.niches where slug = 'dentistry'
union all
select id, 'deal', 'Treatment Plan', 'Proposed dental treatment', 'entity' from public.niches where slug = 'dentistry'
union all
select id, 'pipeline', 'Treatment Pipeline', 'Treatment planning stages', 'process' from public.niches where slug = 'dentistry'
union all
select id, 'lead', 'Lead', 'Potential buyer or seller', 'entity' from public.niches where slug = 'real-estate'
union all
select id, 'contact', 'Client', 'Active client', 'entity' from public.niches where slug = 'real-estate'
union all
select id, 'deal', 'Property Deal', 'Real estate transaction', 'entity' from public.niches where slug = 'real-estate'
union all
select id, 'pipeline', 'Sales Pipeline', 'Deal progression stages', 'process' from public.niches where slug = 'real-estate';

insert into public.sales_processes (niche_id, name, slug, stages, is_default)
select id, 'Standard Treatment Process', 'standard-treatment', 
'[{"id": "1", "name": "Consultation Booked", "order": 1, "color": "#3b82f6"}, {"id": "2", "name": "Consultation Complete", "order": 2, "color": "#8b5cf6"}, {"id": "3", "name": "Treatment Proposed", "order": 3, "color": "#f59e0b"}, {"id": "4", "name": "Treatment Accepted", "order": 4, "color": "#22c55e"}]'::jsonb,
true
from public.niches where slug = 'dentistry'
union all
select id, 'Standard Sales Process', 'standard-sales',
'[{"id": "1", "name": "Initial Contact", "order": 1, "color": "#3b82f6"}, {"id": "2", "name": "Property Viewing", "order": 2, "color": "#8b5cf6"}, {"id": "3", "name": "Offer Made", "order": 3, "color": "#f59e0b"}, {"id": "4", "name": "Under Contract", "order": 4, "color": "#22c55e"}, {"id": "5", "name": "Closed", "order": 5, "color": "#10b981"}]'::jsonb,
true
from public.niches where slug = 'real-estate';

insert into public.integration_providers (name, slug, logo_url, auth_type, config_schema, webhook_events, is_active) values
('GoHighLevel', 'gohighlevel', null, 'api_key', '{"fields": [{"name": "api_key", "type": "string", "required": true, "label": "API Key"}]}'::jsonb, '["contact.created", "contact.updated", "opportunity.created", "opportunity.updated"]'::jsonb, true),
('HubSpot', 'hubspot', null, 'oauth2', '{"fields": [{"name": "client_id", "type": "string", "required": true, "label": "Client ID"}, {"name": "client_secret", "type": "string", "required": true, "label": "Client Secret"}]}'::jsonb, '["contact.creation", "contact.propertyChange", "deal.creation", "deal.propertyChange"]'::jsonb, true),
('Salesforce', 'salesforce', null, 'oauth2', '{"fields": [{"name": "consumer_key", "type": "string", "required": true, "label": "Consumer Key"}, {"name": "consumer_secret", "type": "string", "required": true, "label": "Consumer Secret"}]}'::jsonb, '["contact", "lead", "opportunity"]'::jsonb, true),
('Pipedrive', 'pipedrive', null, 'api_key', '{"fields": [{"name": "api_token", "type": "string", "required": true, "label": "API Token"}]}'::jsonb, '["person.created", "person.updated", "deal.created", "deal.updated"]'::jsonb, true),
('Zoho CRM', 'zoho-crm', null, 'oauth2', '{"fields": [{"name": "client_id", "type": "string", "required": true, "label": "Client ID"}, {"name": "client_secret", "type": "string", "required": true, "label": "Client Secret"}]}'::jsonb, '["Contacts", "Leads", "Deals"]'::jsonb, true);