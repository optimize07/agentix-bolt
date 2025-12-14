-- Create the seed_demo_data_for_user function
CREATE OR REPLACE FUNCTION public.seed_demo_data_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search_id_1 uuid;
  v_ad1 uuid;
  v_ad2 uuid;
BEGIN
  -- Insert campaigns
  INSERT INTO public.campaigns (user_id, name, project, status, spend, impressions, ctr, roas)
  SELECT p_user_id, 'Summer Sale 2025', 'E-commerce Store', 'Active', 4250.00, 842000, 3.80, 6.20
  WHERE NOT EXISTS (SELECT 1 FROM public.campaigns WHERE user_id = p_user_id AND name = 'Summer Sale 2025');

  INSERT INTO public.campaigns (user_id, name, project, status, spend, impressions, ctr, roas)
  SELECT p_user_id, 'Product Launch', 'SaaS Platform', 'Review', 2890.00, 567000, 2.90, 4.10
  WHERE NOT EXISTS (SELECT 1 FROM public.campaigns WHERE user_id = p_user_id AND name = 'Product Launch');

  INSERT INTO public.campaigns (user_id, name, project, status, spend, impressions, ctr, roas)
  SELECT p_user_id, 'Fitness Challenge', 'Fitness App', 'Paused', 1560.00, 320000, 4.20, 3.50
  WHERE NOT EXISTS (SELECT 1 FROM public.campaigns WHERE user_id = p_user_id AND name = 'Fitness Challenge');

  -- Insert admin tasks
  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Market Research Report', 'TechStart Solutions', 'Strategy', 'High', 'In Progress', 'Sarah Johnson', DATE '2024-01-15'
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Market Research Report');

  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Campaign Creative Assets', 'SMARTAX Corp', 'Marketing', 'Medium', 'Completed', 'Mike Chen', DATE '2024-01-14'
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Campaign Creative Assets');

  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Client Proposal Development', 'HealthHub', 'Sales', 'High', 'Pending', 'John Wilson', DATE '2024-01-16'
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Client Proposal Development');

  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Website Integration', 'ImagineSpace Ltd', 'Strategy', 'Medium', 'Waiting', 'Emma Davis', DATE '2024-01-13'
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Website Integration');

  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Social Media Content', 'Global All-In-Consulting', 'Marketing', 'Low', 'In Progress', 'Alex Rivera', DATE '2024-01-17'
  WHERE NOT EXISTS (SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Social Media Content');

  -- Insert department KPIs for advertising
  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'advertising', 'Total Agents', '42', NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'advertising' AND label = 'Total Agents');

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'advertising', 'Active Campaigns', '18', NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'advertising' AND label = 'Active Campaigns');

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'advertising', 'Avg ROAS', '4.2x', '+12%'
  WHERE NOT EXISTS (SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'advertising' AND label = 'Avg ROAS');

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'advertising', 'Monthly Spend', '$84.2K', '+8%'
  WHERE NOT EXISTS (SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'advertising' AND label = 'Monthly Spend');

  -- Insert department KPIs for marketing
  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'marketing', 'Total Agents', '24', NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'marketing' AND label = 'Total Agents');

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'marketing', 'Active Projects', '12', NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'marketing' AND label = 'Active Projects');

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'marketing', 'Content Published', '156', '+15%'
  WHERE NOT EXISTS (SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'marketing' AND label = 'Content Published');

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'marketing', 'Engagement Rate', '8.4%', '+22%'
  WHERE NOT EXISTS (SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'marketing' AND label = 'Engagement Rate');

  -- Insert department agents for advertising
  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'advertising', 'Sarah Chen', 'Campaign Manager',
         'https://lh3.googleusercontent.com/aida-public/AB6AXuBaTt0CQG2zXXJ2CYG1v7U8qwTEqG0tKkI3p9vw8D7DFfOQCtQlDomwpkwv4RaXF_GI1winbGsEuz0FvGoPXL6AX2pu_XYxZHfft742xd2LxCStM4XabSldmCsj5-ipPyC7GjMA9JYqM9XqE91aZXDEKSkylwZuSLAwiVcwcCz49nGrVj0iSVJUIMFpXsR58-QQixtEWro_Q3aVGz9k4lIKydhmKyvKOehzHS7FC3UJVpuxAZAweXWrfKSoPLEFLfqDRsyim5R_tVkk',
         'online',
         jsonb_build_object('spend','$12.4K','impressions','2.4M','ctr','3.2%','roas','4.8x')
  WHERE NOT EXISTS (SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'advertising' AND name = 'Sarah Chen');

  -- Insert department agents for marketing
  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'marketing', 'David Park', 'Content Strategist',
         'https://lh3.googleusercontent.com/aida-public/AB6AXuCURxNMKdyIwYl5i9Dio-zlf3Lt5OCd9HREIY9BYR7AEvOqCtQlDomwpkwv4RaXF_GI1winbGsEuz0FvGoPXL6AX2pu_XYxZHfft742xd2LxCStM4XabSldmCsj5-ipPyC7GjMA9JYqM9XqE91aZXDEKSkylwZuSLAwiVcwcCz49nGrVj0iSVJUIMFpXsR58-QQixtEWro_Q3aVGz9k4lIKydhmKyvKOehzHS7FC3UJVpuxAZAweXWrfKSoPLEFLfqDRsyim5R_tVkk',
         'active',
         jsonb_build_object('contentProgressPercent',75,'contentText','15/20 Projects','campaignsProgressPercent',60,'campaignsText','6/10 Campaigns','healthPercent',82)
  WHERE NOT EXISTS (SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'marketing' AND name = 'David Park');

  -- Insert sample market research reports if tables exist
  BEGIN
    INSERT INTO public.market_research_reports
      (user_id, company_name, company_website, competitor_links, product_description, client_avatar_description, report_content, status, processing_started_at, processing_completed_at)
    SELECT p_user_id, 'TechStart Solutions', 'https://techstart.example.com',
           '["https://competitor-one.example.com","https://competitor-two.example.com"]'::jsonb,
           'B2B project management SaaS targeting SMBs.',
           'Operations managers at 50-500 person companies in North America.',
           'Completed demo report content for TechStart Solutions.',
           'completed', now() - interval '2 days', now() - interval '2 days' + interval '5 minutes'
    WHERE NOT EXISTS (SELECT 1 FROM public.market_research_reports WHERE user_id = p_user_id AND company_name = 'TechStart Solutions');
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;

END;
$$;

COMMENT ON FUNCTION public.seed_demo_data_for_user(uuid) IS 'Seeds demo data for the specified user. Safe to call multiple times; inserts are idempotent.';