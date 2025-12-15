-- Drastically shorten all glossary term descriptions (60-70% reduction)

-- Team Roles
UPDATE glossary_terms SET
  long_description = 'Qualifies inbound leads and books discovery meetings for Account Executives without closing deals.',
  usage_example = 'Assign to handle lead qualification, cold calling, and booking qualified meetings.',
  differs_from = '[{"term": "AE", "difference": "SDRs book meetings; AEs close deals"}, {"term": "BDR", "difference": "Inbound leads vs outbound prospecting"}]'::jsonb,
  industry_notes = 'Target 8-12 qualified meetings per month with strong call-to-meeting conversion rates.'
WHERE term_key = 'role.sdr';

UPDATE glossary_terms SET
  long_description = 'Manages the full sales cycle from demo to close, negotiating deals and hitting revenue targets.',
  usage_example = 'Assign to run product demos, handle proposals, negotiate contracts, and close deals.',
  differs_from = '[{"term": "SDR", "difference": "AEs close deals; SDRs book meetings"}, {"term": "Account Manager", "difference": "New business vs existing account growth"}]'::jsonb,
  industry_notes = 'Average quota is $500K-$1M annually with 3-6 month sales cycles.'
WHERE term_key = 'role.account_executive';

UPDATE glossary_terms SET
  long_description = 'Focuses exclusively on outbound prospecting to create new pipeline from cold outreach.',
  usage_example = 'Assign to handle cold calling, LinkedIn outreach, and building targeted prospect lists.',
  differs_from = '[{"term": "SDR", "difference": "Outbound prospecting vs inbound lead response"}, {"term": "AE", "difference": "Pipeline generation vs deal closing"}]'::jsonb,
  industry_notes = 'Expect 50-100 outbound touches daily with 1-2% conversion to qualified meetings.'
WHERE term_key = 'role.bdr';

UPDATE glossary_terms SET
  long_description = 'Specializes in final negotiation and contract signing to convert opportunities into customers.',
  usage_example = 'Assign to high-value deals requiring advanced negotiation and objection handling skills.',
  differs_from = '[{"term": "AE", "difference": "Final stage specialist vs full-cycle rep"}, {"term": "SDR", "difference": "Closing deals vs opening conversations"}]'::jsonb,
  industry_notes = 'Common in high-ticket sales with deals over $50K requiring specialized closing expertise.'
WHERE term_key = 'role.closer';

UPDATE glossary_terms SET
  long_description = 'Manages post-sale relationships to drive retention, upsells, and customer satisfaction.',
  usage_example = 'Assign to handle onboarding, renewals, expansion opportunities, and customer success.',
  differs_from = '[{"term": "AE", "difference": "Existing accounts vs new business"}, {"term": "Customer Success", "difference": "Revenue focus vs product adoption"}]'::jsonb,
  industry_notes = 'Target net revenue retention of 110-120% through upsells and cross-sells.'
WHERE term_key = 'role.account_manager';

UPDATE glossary_terms SET
  long_description = 'Leads the sales team by setting strategy, coaching reps, and ensuring quota attainment.',
  usage_example = 'Assign to manage team performance, pipeline reviews, forecasting, and rep development.',
  differs_from = '[{"term": "AE", "difference": "Team leadership vs individual contribution"}, {"term": "VP Sales", "difference": "Tactical execution vs strategic planning"}]'::jsonb,
  industry_notes = 'Effective managers spend 50% of time coaching with 1:1 weekly rep sessions.'
WHERE term_key = 'role.sales_manager';

-- Business Entities
UPDATE glossary_terms SET
  long_description = 'A potential customer who has shown interest but has not been qualified yet.',
  usage_example = 'Use for early-stage contacts before determining budget, authority, need, and timeline.',
  differs_from = '[{"term": "Contact", "difference": "All leads are contacts; not all contacts are leads"}, {"term": "Prospect", "difference": "Leads are unqualified; prospects are actively worked"}]'::jsonb,
  industry_notes = 'Leads become prospects once BANT criteria are met and active engagement begins.'
WHERE term_key = 'entity.lead';

UPDATE glossary_terms SET
  long_description = 'Any individual person stored in your system regardless of sales stage or relationship.',
  usage_example = 'Use as the base record for all people including leads, prospects, customers, and partners.',
  differs_from = '[{"term": "Lead", "difference": "Generic person vs sales-qualified opportunity"}, {"term": "Account", "difference": "Individual person vs company entity"}]'::jsonb,
  industry_notes = 'Contacts are the foundation; attach roles, accounts, and activities to them.'
WHERE term_key = 'entity.contact';

UPDATE glossary_terms SET
  long_description = 'A qualified lead being actively worked with clear buying potential and engagement.',
  usage_example = 'Use for contacts who meet BANT criteria and are in active sales conversations.',
  differs_from = '[{"term": "Lead", "difference": "Qualified and active vs unqualified and passive"}, {"term": "Opportunity", "difference": "Person being worked vs specific deal in pipeline"}]'::jsonb,
  industry_notes = 'Prospects should have clear next steps and expected close dates within 90 days.'
WHERE term_key = 'entity.prospect';

UPDATE glossary_terms SET
  long_description = 'A person or company that has purchased from you and has an active relationship.',
  usage_example = 'Use for all paying clients to track renewals, upsells, and ongoing engagement.',
  differs_from = '[{"term": "Prospect", "difference": "Paid customer vs potential buyer"}, {"term": "Account", "difference": "May be person or company vs always company"}]'::jsonb,
  industry_notes = 'Track customer lifetime value and retention metrics to optimize expansion revenue.'
WHERE term_key = 'entity.customer';

UPDATE glossary_terms SET
  long_description = 'A company or organization entity that may contain multiple contacts and opportunities.',
  usage_example = 'Use to group all contacts, deals, and activities related to a single organization.',
  differs_from = '[{"term": "Contact", "difference": "Company entity vs individual person"}, {"term": "Customer", "difference": "Neutral term vs purchased relationship"}]'::jsonb,
  industry_notes = 'Accounts enable multi-threading by tracking all stakeholders within an organization.'
WHERE term_key = 'entity.account';

-- Contact Stages
UPDATE glossary_terms SET
  long_description = 'A new lead with no prior engagement or qualification activity completed yet.',
  usage_example = 'Use for net-new contacts before any outreach attempts or qualification activities.',
  differs_from = '[{"term": "Warm Lead", "difference": "No engagement vs some interaction"}, {"term": "Prospect", "difference": "Unqualified vs qualified and active"}]'::jsonb,
  industry_notes = 'Cold leads require 6-8 touches over 2-3 weeks before qualification.'
WHERE term_key = 'stage.cold_lead';

UPDATE glossary_terms SET
  long_description = 'A lead showing engagement through email opens, website visits, or initial responses.',
  usage_example = 'Use when leads respond to outreach but have not yet been fully qualified.',
  differs_from = '[{"term": "Cold Lead", "difference": "Some engagement vs zero contact"}, {"term": "Qualified Lead", "difference": "Interest shown vs BANT confirmed"}]'::jsonb,
  industry_notes = 'Warm leads convert 2-3x higher than cold leads with faster sales cycles.'
WHERE term_key = 'stage.warm_lead';

UPDATE glossary_terms SET
  long_description = 'A lead that meets budget, authority, need, and timeline criteria for active pursuit.',
  usage_example = 'Use when BANT is confirmed and the lead is ready for demos or proposals.',
  differs_from = '[{"term": "Warm Lead", "difference": "BANT confirmed vs interest only"}, {"term": "Opportunity", "difference": "Qualified person vs active deal"}]'::jsonb,
  industry_notes = 'Qualified leads should convert to opportunities within 14 days with clear next steps.'
WHERE term_key = 'stage.qualified_lead';

UPDATE glossary_terms SET
  long_description = 'An active sales deal with a qualified prospect, projected close date, and dollar value.',
  usage_example = 'Use for deals in your pipeline with proposals sent and active negotiation happening.',
  differs_from = '[{"term": "Qualified Lead", "difference": "Active deal vs qualified person"}, {"term": "Customer", "difference": "In negotiation vs closed-won"}]'::jsonb,
  industry_notes = 'Track opportunity stage, close probability, and expected revenue for forecasting.'
WHERE term_key = 'stage.opportunity';

UPDATE glossary_terms SET
  long_description = 'An internal advocate at the prospect company who supports your solution and influences decisions.',
  usage_example = 'Use to identify and track key stakeholders who champion your product internally.',
  differs_from = '[{"term": "Decision Maker", "difference": "Influencer vs final approver"}, {"term": "Prospect", "difference": "Internal advocate vs general contact"}]'::jsonb,
  industry_notes = 'Deals with champions close 3x faster; nurture with exclusive content and support.'
WHERE term_key = 'stage.champion';

-- Activity Types
UPDATE glossary_terms SET
  long_description = 'A voice conversation conducted via phone with a lead, prospect, or customer.',
  usage_example = 'Log all substantive phone conversations to track call volume and outcomes.',
  differs_from = '[{"term": "Meeting", "difference": "Audio-only vs video or in-person"}, {"term": "Email", "difference": "Real-time conversation vs async message"}]'::jsonb,
  industry_notes = 'Average B2B sales call is 15-20 minutes; track talk-to-listen ratio for coaching.'
WHERE term_key = 'activity.call';

UPDATE glossary_terms SET
  long_description = 'Written electronic messages sent for outreach, proposals, or relationship nurturing.',
  usage_example = 'Track all substantive email correspondence to measure open rates and response rates.',
  differs_from = '[{"term": "Call", "difference": "Asynchronous written vs real-time conversation"}, {"term": "Meeting", "difference": "One-way communication vs interactive conversation"}]'::jsonb,
  industry_notes = 'B2B cold email averages 20-25% open rate; personalization improves response 3x.'
WHERE term_key = 'activity.email';

UPDATE glossary_terms SET
  long_description = 'A scheduled, interactive conversation via video call, phone, or in-person discussion.',
  usage_example = 'Log all scheduled appointments including discovery calls, demos, and proposal reviews.',
  differs_from = '[{"term": "Call", "difference": "Pre-scheduled vs ad-hoc outreach"}, {"term": "Email", "difference": "Two-way interactive vs one-way message"}]'::jsonb,
  industry_notes = 'No-show rate averages 15-20%; send calendar reminders 24 hours and 1 hour before.'
WHERE term_key = 'activity.meeting';

UPDATE glossary_terms SET
  long_description = 'A to-do item or follow-up action assigned to complete at a future date.',
  usage_example = 'Create tasks for follow-ups, proposal prep, and any action requiring completion tracking.',
  differs_from = '[{"term": "Meeting", "difference": "Individual action vs collaborative conversation"}, {"term": "Note", "difference": "Future action vs past documentation"}]'::jsonb,
  industry_notes = 'High performers complete 80%+ of tasks on-time; use reminders and daily reviews.'
WHERE term_key = 'activity.task';

UPDATE glossary_terms SET
  long_description = 'Free-form text documenting important context, insights, or conversation details.',
  usage_example = 'Add notes after calls to capture objections, interests, and key takeaways.',
  differs_from = '[{"term": "Task", "difference": "Historical record vs future action"}, {"term": "Email", "difference": "Internal documentation vs external communication"}]'::jsonb,
  industry_notes = 'Document budget discussions, decision timelines, and competitor mentions in notes.'
WHERE term_key = 'activity.note';

UPDATE glossary_terms SET
  long_description = 'A product demonstration meeting showing features and capabilities to prospects.',
  usage_example = 'Schedule demos for qualified prospects to showcase solutions and address use cases.',
  differs_from = '[{"term": "Meeting", "difference": "Product-focused vs general discussion"}, {"term": "Presentation", "difference": "Interactive demo vs one-way presentation"}]'::jsonb,
  industry_notes = 'Effective demos focus on 3-5 key features addressing specific prospect pain points.'
WHERE term_key = 'activity.demo';

-- Activity Outcomes
UPDATE glossary_terms SET
  long_description = 'The activity was successfully finished with all intended objectives met.',
  usage_example = 'Mark activities complete when finished to track productivity and completion rates.',
  differs_from = '[{"term": "Successful", "difference": "Finished vs achieved desired outcome"}, {"term": "Cancelled", "difference": "Completed vs terminated early"}]'::jsonb,
  industry_notes = 'Track completion rates to identify time management and follow-through issues.'
WHERE term_key = 'outcome.completed';

UPDATE glossary_terms SET
  long_description = 'The activity achieved its intended goal such as booking next meeting or gaining commitment.',
  usage_example = 'Use when calls or meetings result in clear positive next steps or agreements.',
  differs_from = '[{"term": "Completed", "difference": "Goal achieved vs simply finished"}, {"term": "No-show", "difference": "Productive vs wasted time"}]'::jsonb,
  industry_notes = 'Successful outcome rate is a key metric; target 40%+ for cold calls.'
WHERE term_key = 'outcome.successful';

UPDATE glossary_terms SET
  long_description = 'The prospect did not attend a scheduled meeting without prior cancellation notice.',
  usage_example = 'Log no-shows to track reliability and adjust qualification or reminder processes.',
  differs_from = '[{"term": "Cancelled", "difference": "Unexpected absence vs advance notice"}, {"term": "Rescheduled", "difference": "No contact vs new time confirmed"}]'::jsonb,
  industry_notes = 'No-show rate above 20% indicates poor qualification or inadequate reminders.'
WHERE term_key = 'outcome.no_show';

UPDATE glossary_terms SET
  long_description = 'The meeting was moved to a different date or time by mutual agreement.',
  usage_example = 'Use when prospects request a different time; track reschedule patterns.',
  differs_from = '[{"term": "Cancelled", "difference": "New date set vs terminated entirely"}, {"term": "No-show", "difference": "Communicated change vs silent absence"}]'::jsonb,
  industry_notes = 'Multiple reschedules often signal low priority; re-qualify after 2+ reschedules.'
WHERE term_key = 'outcome.rescheduled';

UPDATE glossary_terms SET
  long_description = 'The scheduled activity was terminated by either party without rescheduling.',
  usage_example = 'Log cancellations to understand why meetings are being dropped from calendar.',
  differs_from = '[{"term": "Rescheduled", "difference": "Terminated vs moved to new time"}, {"term": "No-show", "difference": "Communicated vs silent"}]'::jsonb,
  industry_notes = 'High cancellation rates may indicate poor fit or timing; review qualification.'
WHERE term_key = 'outcome.cancelled';

UPDATE glossary_terms SET
  long_description = 'Reached voicemail and left a message with callback information.',
  usage_example = 'Track voicemail outcomes to measure response rates and optimize messaging.',
  differs_from = '[{"term": "No Answer", "difference": "Voicemail left vs no message capability"}, {"term": "Successful", "difference": "One-way message vs two-way conversation"}]'::jsonb,
  industry_notes = 'Voicemail callback rate is 3-5%; pair with email for higher response rates.'
WHERE term_key = 'outcome.left_voicemail';

UPDATE glossary_terms SET
  long_description = 'Called but no one answered and no voicemail was available.',
  usage_example = 'Log no-answer attempts to track contact attempts and optimize call timing.',
  differs_from = '[{"term": "Left Voicemail", "difference": "No voicemail option vs message left"}, {"term": "Busy", "difference": "No answer vs line engaged"}]'::jsonb,
  industry_notes = 'Vary call times across morning, afternoon, and early evening for better connect rates.'
WHERE term_key = 'outcome.no_answer';

UPDATE glossary_terms SET
  long_description = 'Email was delivered to the recipient without bounce or delivery failure.',
  usage_example = 'Track sent emails to measure volume, timing, and sequence effectiveness.',
  differs_from = '[{"term": "Opened", "difference": "Delivered vs actually viewed"}, {"term": "Replied", "difference": "One-way send vs two-way engagement"}]'::jsonb,
  industry_notes = 'Average B2B email deliverability is 85-90%; maintain clean lists for better rates.'
WHERE term_key = 'outcome.sent';