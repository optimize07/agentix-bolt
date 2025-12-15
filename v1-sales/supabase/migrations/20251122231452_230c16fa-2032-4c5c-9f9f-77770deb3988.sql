-- Update niche to High Ticket Sales (keeping organizational_type as 'teams')
UPDATE niches 
SET 
  name = 'High Ticket Sales',
  description = 'High-value B2B and B2C sales organizations with consultative selling processes'
WHERE slug = 'online-sales';

-- Clear out existing terms for this niche
DELETE FROM glossary_terms 
WHERE niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

-- Insert the proper high-ticket sales CRM terms
INSERT INTO glossary_terms (niche_id, term_key, default_label, category, description) VALUES
  -- Core CRM Entities
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.lead', 'Lead', 'CRM', 'A potential customer or client (also known as: Prospect, Contact, Patient)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.deal', 'Deal', 'CRM', 'An active transaction or engagement (also known as: Opportunity, Sale, Case)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.contact', 'Contact', 'CRM', 'Individual person in your system (also known as: Lead, Prospect, Client)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.account', 'Account', 'CRM', 'Business or organization entity (also known as: Company, Organization, Practice)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.opportunity', 'Opportunity', 'CRM', 'Potential revenue opportunity (also known as: Deal, Prospect, Lead)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.pipeline', 'Pipeline', 'CRM', 'Stages from first contact to close (also known as: Process, Funnel, Journey)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.prospect', 'Prospect', 'CRM', 'Someone who might become a customer (also known as: Lead, Potential Customer, Inquirer)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.customer', 'Customer', 'CRM', 'Active paying client or member (also known as: Client, Account, Member)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.campaign', 'Campaign', 'CRM', 'Organized marketing or outreach effort (also known as: Marketing Campaign, Promotion, Initiative)'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'crm.territory', 'Territory', 'CRM', 'Geographic or market segment (also known as: Region, Area, Zone)'),
  
  -- Sales Process Terms
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'sales.discovery_call', 'Discovery Call', 'Sales Process', 'Initial qualifying conversation with prospect'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'sales.presentation', 'Presentation', 'Sales Process', 'Formal product/service demonstration'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'sales.proposal', 'Proposal', 'Sales Process', 'Formal offer or quote sent to prospect'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'sales.negotiation', 'Negotiation', 'Sales Process', 'Discussion of terms and pricing'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'sales.close', 'Close', 'Sales Process', 'Finalized sale or signed contract'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'sales.follow_up', 'Follow-up', 'Sales Process', 'Post-close or re-engagement activity'),
  
  -- High-Ticket Specific Metrics
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'metrics.acv', 'ACV', 'Metrics', 'Average Contract Value - typical deal size'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'metrics.ltv', 'LTV', 'Metrics', 'Lifetime Value - total revenue per customer'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'metrics.conversion_rate', 'Conversion Rate', 'Metrics', 'Percentage of leads that become customers'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'metrics.sales_cycle', 'Sales Cycle', 'Metrics', 'Average time from first contact to close'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'metrics.quota', 'Quota', 'Metrics', 'Sales target or goal for a period'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'metrics.pipeline_value', 'Pipeline Value', 'Metrics', 'Total value of all active opportunities'),
  
  -- Actions/Activities
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'activity.call', 'Call', 'Activities', 'Phone or video call with prospect/customer'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'activity.email', 'Email', 'Activities', 'Email communication'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'activity.meeting', 'Meeting', 'Activities', 'Scheduled in-person or virtual meeting'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'activity.demo', 'Demo', 'Activities', 'Product or service demonstration'),
  
  -- Navigation (essential UI terms)
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'nav.dashboard', 'Dashboard', 'Navigation', 'Main overview and metrics view'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'nav.pipeline', 'Pipeline', 'Navigation', 'Deal pipeline management view'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'nav.contacts', 'Contacts', 'Navigation', 'Contact and lead management'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'nav.analytics', 'Analytics', 'Navigation', 'Performance reports and insights'),
  ((SELECT id FROM niches WHERE slug = 'online-sales'), 'nav.settings', 'Settings', 'Navigation', 'System configuration');

-- Clear any existing overrides that reference the old terms
DELETE FROM organization_glossary_overrides
WHERE glossary_term_id NOT IN (
  SELECT id FROM glossary_terms 
  WHERE niche_id = (SELECT id FROM niches WHERE slug = 'online-sales')
);