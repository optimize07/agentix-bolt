-- Remove verbose description fields
ALTER TABLE glossary_terms 
DROP COLUMN IF EXISTS long_description,
DROP COLUMN IF EXISTS usage_example,
DROP COLUMN IF EXISTS differs_from,
DROP COLUMN IF EXISTS industry_notes;

-- Add simplified fields
ALTER TABLE glossary_terms 
ADD COLUMN alternative_examples TEXT,
ADD COLUMN display_order INTEGER DEFAULT 999;

-- Set display_order = 1 for General category (top 10 most customized terms)
UPDATE glossary_terms 
SET display_order = 1 
WHERE term_key IN (
  'lead', 'contact', 'customer', 'prospect', 'opportunity',
  'account', 'deal', 'client', 'appointment', 'call'
);

-- Set display_order for other categories by importance
UPDATE glossary_terms SET display_order = 2 WHERE category = 'Business Entities' AND display_order != 1;
UPDATE glossary_terms SET display_order = 3 WHERE category = 'Contact Stages';
UPDATE glossary_terms SET display_order = 4 WHERE category = 'Team Roles';
UPDATE glossary_terms SET display_order = 5 WHERE category = 'Activity Types';
UPDATE glossary_terms SET display_order = 6 WHERE category = 'Deal/Case Statuses';
UPDATE glossary_terms SET display_order = 7 WHERE category = 'Activity Outcomes';
UPDATE glossary_terms SET display_order = 8 WHERE category = 'Process Stages';
UPDATE glossary_terms SET display_order = 9 WHERE category = 'Performance Metrics';

-- Add alternative_examples for the top 10 General terms
UPDATE glossary_terms SET alternative_examples = 'Also called: Prospect, Inquiry, Unqualified Contact. Used for early-stage contacts before qualification or discovery.' WHERE term_key = 'lead';
UPDATE glossary_terms SET alternative_examples = 'Also called: Person, Individual, Record. Generic term for any individual in your database.' WHERE term_key = 'contact';
UPDATE glossary_terms SET alternative_examples = 'Also called: Client, Patient, Member, Buyer. Active paying relationship with completed purchase.' WHERE term_key = 'customer';
UPDATE glossary_terms SET alternative_examples = 'Also called: Qualified Lead, Opportunity Contact. Lead that passed BANT or qualification criteria.' WHERE term_key = 'prospect';
UPDATE glossary_terms SET alternative_examples = 'Also called: Deal, Case, Matter, Transaction. Active sales cycle with defined potential value.' WHERE term_key = 'opportunity';
UPDATE glossary_terms SET alternative_examples = 'Also called: Company, Organization, Business Entity. Corporate or organizational relationship.' WHERE term_key = 'account';
UPDATE glossary_terms SET alternative_examples = 'Also called: Opportunity, Case, Transaction, Sale. Specific revenue-generating sales cycle.' WHERE term_key = 'deal';
UPDATE glossary_terms SET alternative_examples = 'Also called: Customer, Patient, Member. Preferred term in service industries like Legal, Consulting.' WHERE term_key = 'client';
UPDATE glossary_terms SET alternative_examples = 'Also called: Meeting, Session, Consultation, Booking. Scheduled time block with prospect or client.' WHERE term_key = 'appointment';
UPDATE glossary_terms SET alternative_examples = 'Also called: Phone Call, Ring, Conversation. Voice-based outreach or qualification activity.' WHERE term_key = 'call';