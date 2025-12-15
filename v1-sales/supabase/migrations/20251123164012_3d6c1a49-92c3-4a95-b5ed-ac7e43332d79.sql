-- Populate alternative_examples for Real Estate niche General terms
UPDATE glossary_terms
SET display_order = 1
WHERE term_key IN (
  'entity.lead',
  'entity.contact',
  'entity.client',
  'entity.buyer',
  'entity.seller',
  'entity.property',
  'entity.listing',
  'activity.call',
  'activity.email',
  'activity.showing'
)
AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Inquiry, Prospect. New person asking about buying or selling but not yet qualified.'
WHERE term_key = 'entity.lead'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Person, Record. Anyone in your database, even if they are not ready to move yet.'
WHERE term_key = 'entity.contact'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Customer, Buyer Client, Seller Client. Someone with an active agreement to work with you.'
WHERE term_key = 'entity.client'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Purchaser, Home Buyer. Person or household shopping for a property.'
WHERE term_key = 'entity.buyer'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Homeowner, Vendor. Person or entity that owns a property you might list or sell.'
WHERE term_key = 'entity.seller'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Home, Unit, Listing. The physical real estate being bought or sold.'
WHERE term_key = 'entity.property'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Active Listing, On Market. A property with a signed listing agreement.'
WHERE term_key = 'entity.listing'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Phone Call, Check-in. Live conversation to qualify, follow up, or negotiate.'
WHERE term_key = 'activity.call'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Email Touch, Follow-up Email. Any email that moves the deal or relationship forward.'
WHERE term_key = 'activity.email'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');

UPDATE glossary_terms SET alternative_examples =
  'Also called: Showing, Appointment, Tour. Scheduled time to see a property or meet about a listing.'
WHERE term_key = 'activity.showing'
  AND niche_id = (SELECT id FROM niches WHERE slug = 'real-estate');