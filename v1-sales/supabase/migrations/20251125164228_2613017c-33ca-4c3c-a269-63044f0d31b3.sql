-- Create form_template_presets table
CREATE TABLE form_template_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID REFERENCES niches(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  fields JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE form_template_presets ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view presets
CREATE POLICY "Presets viewable by all authenticated users" 
  ON form_template_presets FOR SELECT TO authenticated USING (true);

-- Insert High Ticket Sales templates
INSERT INTO form_template_presets (niche_id, name, description, category, icon, fields) VALUES
(
  'f1e2d3c4-b5a6-7890-1234-567890abcdef',
  'Daily Activity Log',
  'Track daily sales activities including calls, emails, meetings, and demos',
  'Daily Reporting',
  'CalendarCheck',
  '[
    {"field_label": "Date", "field_type": "date", "is_required": true, "glossary_term_key": null},
    {"field_label": "Calls Made", "field_type": "number", "is_required": true, "glossary_term_key": "activity.call"},
    {"field_label": "Emails Sent", "field_type": "number", "is_required": true, "glossary_term_key": "activity.email"},
    {"field_label": "Meetings Held", "field_type": "number", "is_required": true, "glossary_term_key": "activity.meeting"},
    {"field_label": "Demos Completed", "field_type": "number", "is_required": true, "glossary_term_key": "activity.demo"},
    {"field_label": "Notes", "field_type": "textarea", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
),
(
  'f1e2d3c4-b5a6-7890-1234-567890abcdef',
  'Deal Pipeline Update',
  'Update deal status, value, and next steps',
  'Deal Management',
  'TrendingUp',
  '[
    {"field_label": "Deal Name", "field_type": "text", "is_required": true, "glossary_term_key": "crm.deal"},
    {"field_label": "Deal Stage", "field_type": "select", "is_required": true, "glossary_term_key": "deal.qualified", "options": ["Prospecting", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]},
    {"field_label": "Deal Value", "field_type": "number", "is_required": true, "glossary_term_key": "metrics.acv"},
    {"field_label": "Next Steps", "field_type": "textarea", "is_required": true, "glossary_term_key": null},
    {"field_label": "Expected Close Date", "field_type": "date", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
),
(
  'f1e2d3c4-b5a6-7890-1234-567890abcdef',
  'Lead Qualification Form',
  'Qualify new leads with contact info and interest level',
  'Lead Management',
  'UserCheck',
  '[
    {"field_label": "Contact Name", "field_type": "text", "is_required": true, "glossary_term_key": "crm.contact"},
    {"field_label": "Company", "field_type": "text", "is_required": true, "glossary_term_key": null},
    {"field_label": "Email", "field_type": "email", "is_required": true, "glossary_term_key": null},
    {"field_label": "Phone", "field_type": "tel", "is_required": false, "glossary_term_key": null},
    {"field_label": "Lead Source", "field_type": "select", "is_required": true, "glossary_term_key": "crm.lead", "options": ["Website", "Referral", "Cold Outreach", "Event", "Partner"]},
    {"field_label": "Interest Level", "field_type": "select", "is_required": true, "glossary_term_key": "contact.warm_lead", "options": ["Cold", "Warm", "Hot"]},
    {"field_label": "Budget Range", "field_type": "text", "is_required": false, "glossary_term_key": null},
    {"field_label": "Notes", "field_type": "textarea", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
),
(
  'f1e2d3c4-b5a6-7890-1234-567890abcdef',
  'Weekly Performance Report',
  'Summarize weekly metrics, wins, and challenges',
  'Reporting',
  'BarChart3',
  '[
    {"field_label": "Week Starting", "field_type": "date", "is_required": true, "glossary_term_key": null},
    {"field_label": "Total Calls", "field_type": "number", "is_required": true, "glossary_term_key": "activity.call"},
    {"field_label": "Demos Completed", "field_type": "number", "is_required": true, "glossary_term_key": "activity.demo"},
    {"field_label": "Deals Closed", "field_type": "number", "is_required": true, "glossary_term_key": "crm.deal"},
    {"field_label": "Revenue Generated", "field_type": "number", "is_required": true, "glossary_term_key": "metrics.acv"},
    {"field_label": "Conversion Rate", "field_type": "number", "is_required": false, "glossary_term_key": "metrics.conversion_rate"},
    {"field_label": "Key Wins", "field_type": "textarea", "is_required": false, "glossary_term_key": null},
    {"field_label": "Challenges", "field_type": "textarea", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
);

-- Insert Dentistry templates
INSERT INTO form_template_presets (niche_id, name, description, category, icon, fields) VALUES
(
  'ba89cca8-c429-4c36-8172-9ad079066db4',
  'Patient Intake Form',
  'Collect new patient information and medical history',
  'Patient Management',
  'ClipboardPlus',
  '[
    {"field_label": "Patient Name", "field_type": "text", "is_required": true, "glossary_term_key": "crm.contact"},
    {"field_label": "Date of Birth", "field_type": "date", "is_required": true, "glossary_term_key": null},
    {"field_label": "Phone Number", "field_type": "tel", "is_required": true, "glossary_term_key": null},
    {"field_label": "Email", "field_type": "email", "is_required": true, "glossary_term_key": null},
    {"field_label": "Emergency Contact", "field_type": "text", "is_required": true, "glossary_term_key": null},
    {"field_label": "Insurance Provider", "field_type": "text", "is_required": false, "glossary_term_key": null},
    {"field_label": "Medical Conditions", "field_type": "textarea", "is_required": false, "glossary_term_key": null},
    {"field_label": "Current Medications", "field_type": "textarea", "is_required": false, "glossary_term_key": null},
    {"field_label": "Reason for Visit", "field_type": "textarea", "is_required": true, "glossary_term_key": null}
  ]'::jsonb
),
(
  'ba89cca8-c429-4c36-8172-9ad079066db4',
  'Daily Treatment Log',
  'Record procedures and treatments completed',
  'Daily Reporting',
  'FileText',
  '[
    {"field_label": "Date", "field_type": "date", "is_required": true, "glossary_term_key": null},
    {"field_label": "Patient Name", "field_type": "text", "is_required": true, "glossary_term_key": "crm.contact"},
    {"field_label": "Procedure Type", "field_type": "select", "is_required": true, "glossary_term_key": null, "options": ["Cleaning", "Filling", "Crown", "Root Canal", "Extraction", "Whitening", "Other"]},
    {"field_label": "Tooth Number", "field_type": "text", "is_required": false, "glossary_term_key": null},
    {"field_label": "Treatment Notes", "field_type": "textarea", "is_required": true, "glossary_term_key": null},
    {"field_label": "Follow-up Required", "field_type": "checkbox", "is_required": false, "glossary_term_key": null},
    {"field_label": "Next Appointment", "field_type": "date", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
),
(
  'ba89cca8-c429-4c36-8172-9ad079066db4',
  'Appointment Follow-up',
  'Document appointment outcomes and schedule next visit',
  'Patient Management',
  'Calendar',
  '[
    {"field_label": "Patient Name", "field_type": "text", "is_required": true, "glossary_term_key": "crm.contact"},
    {"field_label": "Appointment Date", "field_type": "date", "is_required": true, "glossary_term_key": null},
    {"field_label": "Services Rendered", "field_type": "textarea", "is_required": true, "glossary_term_key": null},
    {"field_label": "Patient Satisfaction", "field_type": "select", "is_required": false, "glossary_term_key": null, "options": ["Very Satisfied", "Satisfied", "Neutral", "Unsatisfied"]},
    {"field_label": "Next Appointment Scheduled", "field_type": "checkbox", "is_required": false, "glossary_term_key": null},
    {"field_label": "Next Appointment Date", "field_type": "date", "is_required": false, "glossary_term_key": null},
    {"field_label": "Additional Notes", "field_type": "textarea", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
);

-- Insert SaaS Sales templates
INSERT INTO form_template_presets (niche_id, name, description, category, icon, fields) VALUES
(
  '87e9a2db-bec1-43b5-b9a0-71ddb5b6baec',
  'Demo Debrief',
  'Record demo outcomes, interest level, and objections',
  'Demo Management',
  'Presentation',
  '[
    {"field_label": "Company Name", "field_type": "text", "is_required": true, "glossary_term_key": "crm.contact"},
    {"field_label": "Demo Date", "field_type": "date", "is_required": true, "glossary_term_key": null},
    {"field_label": "Attendees", "field_type": "text", "is_required": true, "glossary_term_key": null},
    {"field_label": "Demo Type", "field_type": "select", "is_required": true, "glossary_term_key": "activity.demo", "options": ["Discovery", "Product Demo", "Technical Deep Dive", "Executive Briefing"]},
    {"field_label": "Interest Level", "field_type": "select", "is_required": true, "glossary_term_key": "contact.warm_lead", "options": ["Low", "Medium", "High"]},
    {"field_label": "Key Objections", "field_type": "textarea", "is_required": false, "glossary_term_key": null},
    {"field_label": "Next Steps", "field_type": "textarea", "is_required": true, "glossary_term_key": null},
    {"field_label": "Follow-up Date", "field_type": "date", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
),
(
  '87e9a2db-bec1-43b5-b9a0-71ddb5b6baec',
  'Trial Conversion Tracker',
  'Monitor trial status and engagement metrics',
  'Customer Success',
  'Users',
  '[
    {"field_label": "Company Name", "field_type": "text", "is_required": true, "glossary_term_key": "crm.contact"},
    {"field_label": "Trial Start Date", "field_type": "date", "is_required": true, "glossary_term_key": null},
    {"field_label": "Trial Status", "field_type": "select", "is_required": true, "glossary_term_key": null, "options": ["Active", "At Risk", "Engaged", "Converted", "Churned"]},
    {"field_label": "Login Frequency", "field_type": "select", "is_required": false, "glossary_term_key": null, "options": ["Daily", "Weekly", "Rarely", "Never"]},
    {"field_label": "Features Used", "field_type": "textarea", "is_required": false, "glossary_term_key": null},
    {"field_label": "Engagement Score", "field_type": "number", "is_required": false, "glossary_term_key": null},
    {"field_label": "Conversion Likelihood", "field_type": "select", "is_required": true, "glossary_term_key": "metrics.conversion_rate", "options": ["Low", "Medium", "High"]},
    {"field_label": "Notes", "field_type": "textarea", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
),
(
  '87e9a2db-bec1-43b5-b9a0-71ddb5b6baec',
  'MRR Update Form',
  'Track monthly recurring revenue changes',
  'Revenue Tracking',
  'DollarSign',
  '[
    {"field_label": "Month", "field_type": "date", "is_required": true, "glossary_term_key": null},
    {"field_label": "New MRR", "field_type": "number", "is_required": true, "glossary_term_key": "metrics.acv"},
    {"field_label": "Expansion MRR", "field_type": "number", "is_required": false, "glossary_term_key": null},
    {"field_label": "Churned MRR", "field_type": "number", "is_required": false, "glossary_term_key": null},
    {"field_label": "Net New MRR", "field_type": "number", "is_required": true, "glossary_term_key": null},
    {"field_label": "Total MRR", "field_type": "number", "is_required": true, "glossary_term_key": null},
    {"field_label": "New Customers", "field_type": "number", "is_required": false, "glossary_term_key": null},
    {"field_label": "Churned Customers", "field_type": "number", "is_required": false, "glossary_term_key": null},
    {"field_label": "Notes", "field_type": "textarea", "is_required": false, "glossary_term_key": null}
  ]'::jsonb
);