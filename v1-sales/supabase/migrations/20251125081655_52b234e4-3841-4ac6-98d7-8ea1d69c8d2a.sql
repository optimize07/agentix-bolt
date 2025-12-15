-- Demo data for dev@test.com organization
-- Organization ID: dd41a26e-2bff-4656-b80b-aa1dacbdc07a
-- User ID: 8f45d0fb-15b0-4ac8-b180-42993be801d0

-- Insert 3 sample form templates
INSERT INTO form_templates (id, organization_id, name, description, created_by, is_active)
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111111', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', 'Daily KPI Entry', 'Track daily sales performance and activity metrics', '8f45d0fb-15b0-4ac8-b180-42993be801d0', true),
  ('a1b2c3d4-2222-4444-8888-222222222222', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', 'Weekly Review', 'End of week performance summary and planning', '8f45d0fb-15b0-4ac8-b180-42993be801d0', true),
  ('a1b2c3d4-3333-4444-8888-333333333333', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', 'Client Intake Form', 'New client onboarding information', '8f45d0fb-15b0-4ac8-b180-42993be801d0', true);

-- Insert form fields for Daily KPI Entry (using actual glossary term IDs)
INSERT INTO form_fields (form_template_id, glossary_term_id, field_label, field_type, is_required, display_order, placeholder)
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111111', '9881ea88-1d3c-46f9-b8a6-91da78f6af58', 'Calls Made', 'number', true, 0, 'Enter number of calls'),
  ('a1b2c3d4-1111-4444-8888-111111111111', '4f8ff800-9b1a-411d-a2ae-f1e22ef1a48a', 'Emails Sent', 'number', true, 1, 'Enter number of emails'),
  ('a1b2c3d4-1111-4444-8888-111111111111', 'dd2b0106-956e-41d3-8c31-2dc04c73811d', 'Meetings Scheduled', 'number', true, 2, 'Enter number of meetings'),
  ('a1b2c3d4-1111-4444-8888-111111111111', '5bfa54b6-a34c-4839-8a3d-3829b379c774', 'Deals Closed', 'number', false, 3, 'Enter number of deals');

-- Insert form fields for Weekly Review
INSERT INTO form_fields (form_template_id, glossary_term_id, field_label, field_type, is_required, display_order, placeholder)
VALUES 
  ('a1b2c3d4-2222-4444-8888-222222222222', NULL, 'Week Ending Date', 'date', true, 0, NULL),
  ('a1b2c3d4-2222-4444-8888-222222222222', NULL, 'Total Revenue', 'number', true, 1, 'Enter weekly revenue'),
  ('a1b2c3d4-2222-4444-8888-222222222222', NULL, 'Key Wins', 'textarea', false, 2, 'Describe key achievements'),
  ('a1b2c3d4-2222-4444-8888-222222222222', NULL, 'Challenges Faced', 'textarea', false, 3, 'Describe challenges'),
  ('a1b2c3d4-2222-4444-8888-222222222222', NULL, 'Next Week Goals', 'textarea', false, 4, 'Set goals for next week');

-- Insert form fields for Client Intake
INSERT INTO form_fields (form_template_id, glossary_term_id, field_label, field_type, is_required, display_order, placeholder)
VALUES 
  ('a1b2c3d4-3333-4444-8888-333333333333', '09a3d842-76b8-4ba6-a17e-e128ecb030bb', 'Contact Name', 'text', true, 0, 'Enter client name'),
  ('a1b2c3d4-3333-4444-8888-333333333333', NULL, 'Email Address', 'text', true, 1, 'Enter email'),
  ('a1b2c3d4-3333-4444-8888-333333333333', NULL, 'Phone Number', 'text', true, 2, 'Enter phone'),
  ('a1b2c3d4-3333-4444-8888-333333333333', NULL, 'Company Name', 'text', false, 3, 'Enter company'),
  ('a1b2c3d4-3333-4444-8888-333333333333', NULL, 'Industry', 'select', false, 4, 'Select industry'),
  ('a1b2c3d4-3333-4444-8888-333333333333', NULL, 'Notes', 'textarea', false, 5, 'Additional information');

-- Assign forms to admin role (using first admin role ID)
INSERT INTO form_role_assignments (form_template_id, role_id)
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111111', 'd51f688c-f0bb-4d40-9829-257d2c4739db'),
  ('a1b2c3d4-2222-4444-8888-222222222222', 'd51f688c-f0bb-4d40-9829-257d2c4739db'),
  ('a1b2c3d4-3333-4444-8888-333333333333', 'd51f688c-f0bb-4d40-9829-257d2c4739db');

-- Insert sample products
INSERT INTO products (organization_id, name, description, base_price, currency, is_active)
VALUES 
  ('dd41a26e-2bff-4656-b80b-aa1dacbdc07a', 'Starter Package', 'Entry-level coaching package with 4 sessions', 997, 'USD', true),
  ('dd41a26e-2bff-4656-b80b-aa1dacbdc07a', 'Premium Coaching', 'Full coaching program with 12 1:1 sessions', 2997, 'USD', true),
  ('dd41a26e-2bff-4656-b80b-aa1dacbdc07a', 'VIP Mastermind', 'Exclusive high-ticket mastermind access', 9997, 'USD', true),
  ('dd41a26e-2bff-4656-b80b-aa1dacbdc07a', 'Group Training', 'Weekly group training sessions', 497, 'USD', true);

-- Insert sample form submissions with realistic data
INSERT INTO form_submissions (form_template_id, user_id, organization_id, submission_data)
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111111', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Calls Made": 25, "Emails Sent": 40, "Meetings Scheduled": 8, "Deals Closed": 2}'::jsonb),
  ('a1b2c3d4-1111-4444-8888-111111111111', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Calls Made": 30, "Emails Sent": 45, "Meetings Scheduled": 10, "Deals Closed": 3}'::jsonb),
  ('a1b2c3d4-1111-4444-8888-111111111111', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Calls Made": 28, "Emails Sent": 38, "Meetings Scheduled": 7, "Deals Closed": 1}'::jsonb),
  ('a1b2c3d4-1111-4444-8888-111111111111', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Calls Made": 35, "Emails Sent": 50, "Meetings Scheduled": 12, "Deals Closed": 4}'::jsonb),
  ('a1b2c3d4-1111-4444-8888-111111111111', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Calls Made": 22, "Emails Sent": 35, "Meetings Scheduled": 6, "Deals Closed": 2}'::jsonb),
  ('a1b2c3d4-2222-4444-8888-222222222222', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Week Ending Date": "2025-01-10", "Total Revenue": 15000, "Key Wins": "Closed 3 major deals", "Challenges Faced": "One prospect delayed decision", "Next Week Goals": "Follow up with 5 warm leads"}'::jsonb),
  ('a1b2c3d4-2222-4444-8888-222222222222', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Week Ending Date": "2025-01-17", "Total Revenue": 22000, "Key Wins": "Landed VIP client", "Challenges Faced": "Team member out sick", "Next Week Goals": "Launch new product campaign"}'::jsonb),
  ('a1b2c3d4-3333-4444-8888-333333333333', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Contact Name": "Sarah Johnson", "Email Address": "sarah@example.com", "Phone Number": "555-0101", "Company Name": "Tech Innovators", "Industry": "Technology", "Notes": "Interested in premium package"}'::jsonb),
  ('a1b2c3d4-3333-4444-8888-333333333333', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Contact Name": "Michael Chen", "Email Address": "mchen@company.com", "Phone Number": "555-0102", "Company Name": "Growth Partners", "Industry": "Consulting", "Notes": "Referral from existing client"}'::jsonb),
  ('a1b2c3d4-3333-4444-8888-333333333333', '8f45d0fb-15b0-4ac8-b180-42993be801d0', 'dd41a26e-2bff-4656-b80b-aa1dacbdc07a', '{"Contact Name": "Emily Rodriguez", "Email Address": "emily.r@startup.io", "Phone Number": "555-0103", "Company Name": "StartupX", "Industry": "SaaS", "Notes": "Wants to start next month"}'::jsonb);