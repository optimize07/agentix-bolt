-- Add missing glossary terms for all niches

-- Get all niche IDs and insert missing terms
DO $$
DECLARE
  niche_record RECORD;
BEGIN
  FOR niche_record IN SELECT id FROM niches LOOP
    -- Action terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'action.builder', 'Builder', 'action'),
      (niche_record.id, 'action.version_history', 'Version History', 'action'),
      (niche_record.id, 'action.share', 'Share', 'action'),
      (niche_record.id, 'action.save', 'Save', 'action'),
      (niche_record.id, 'action.rename', 'Rename', 'action'),
      (niche_record.id, 'action.duplicate', 'Duplicate', 'action'),
      (niche_record.id, 'action.delete', 'Delete', 'action'),
      (niche_record.id, 'action.create', 'Create', 'action'),
      (niche_record.id, 'action.enter', 'Enter', 'action')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Entity terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'entity.canvas', 'Canvas', 'entity'),
      (niche_record.id, 'entity.customer', 'Customer', 'entity')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Field terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'field.name', 'Name', 'field')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Metric terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'metric.comprehensive_insights', 'Comprehensive insights into your performance', 'metric'),
      (niche_record.id, 'metric.sales_trends', 'Sales Trends', 'metric'),
      (niche_record.id, 'metric.sales', 'Sales', 'metric'),
      (niche_record.id, 'metric.growth', 'Growth Metrics', 'metric'),
      (niche_record.id, 'metric.insights', 'Insights', 'metric'),
      (niche_record.id, 'metric.revenue', 'Revenue Analysis', 'metric')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Settings terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'settings.description', 'Manage your organization configuration', 'navigation'),
      (niche_record.id, 'settings.users', 'Users', 'navigation'),
      (niche_record.id, 'settings.products', 'Products', 'navigation'),
      (niche_record.id, 'settings.customization', 'Customization', 'navigation'),
      (niche_record.id, 'settings.integrations', 'Integrations', 'navigation')
    ON CONFLICT (niche_id, term_key) DO NOTHING;
  END LOOP;
END $$;