-- Fix display_order and alternative_examples for the actual General terms in online-sales niche

-- Set display_order = 1 for the top 10 General terms
UPDATE glossary_terms
SET display_order = 1
WHERE term_key IN (
  'crm.lead',
  'crm.contact',
  'crm.customer',
  'crm.prospect',
  'crm.opportunity',
  'crm.account',
  'crm.deal',
  'activity.call',
  'activity.meeting',
  'activity.email'
)
AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

-- Populate alternative_examples for each General term
UPDATE glossary_terms SET alternative_examples =
  'Also called: Prospect, Inquiry, Applicant. Use when someone has raised their hand but not yet qualified.'
WHERE term_key = 'crm.lead'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Person, Record, Profile. Generic person in your system, regardless of interest level.'
WHERE term_key = 'crm.contact'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Client, Patient, Member, Buyer. Use once they have paid at least once in your system.'
WHERE term_key = 'crm.customer'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Qualified Lead, Hot Lead. Lead you are actively working because it meets your basic criteria.'
WHERE term_key = 'crm.prospect'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Deal, Case, Engagement. Use when there is a clear revenue amount or high-value outcome.'
WHERE term_key = 'crm.opportunity'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Company, Business, Practice. The organization you sell to, not the individual person.'
WHERE term_key = 'crm.account'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Transaction, Sale, Matter. A single closed outcome with a yes/no result and revenue amount.'
WHERE term_key = 'crm.deal'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Phone Call, Discovery Call. Use for live voice conversations, whether outbound or inbound.'
WHERE term_key = 'activity.call'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Zoom, Session, Consultation. Scheduled time on the calendar, in-person or virtual.'
WHERE term_key = 'activity.meeting'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Email Touch, Sequence Step. Use for any outbound or reply email that advances the relationship.'
WHERE term_key = 'activity.email'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'online-sales');