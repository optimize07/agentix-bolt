-- Function: seed_demo_data_for_user(user_id uuid)
-- Purpose: Insert the existing UI mock data as real records for a specific user.
-- Safety: Idempotent inserts (skips if records already exist for that user/name).

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
  -- 1) Campaigns (from src/components/advertising/CampaignsTable.tsx)
  INSERT INTO public.campaigns (user_id, name, project, status, spend, impressions, ctr, roas)
  SELECT p_user_id, 'Summer Sale 2025', 'E-commerce Store', 'Active', 4250.00, 842000, 3.80, 6.20
  WHERE NOT EXISTS (
    SELECT 1 FROM public.campaigns WHERE user_id = p_user_id AND name = 'Summer Sale 2025'
  );

  INSERT INTO public.campaigns (user_id, name, project, status, spend, impressions, ctr, roas)
  SELECT p_user_id, 'Product Launch', 'SaaS Platform', 'Review', 2890.00, 567000, 2.90, 4.10
  WHERE NOT EXISTS (
    SELECT 1 FROM public.campaigns WHERE user_id = p_user_id AND name = 'Product Launch'
  );

  INSERT INTO public.campaigns (user_id, name, project, status, spend, impressions, ctr, roas)
  SELECT p_user_id, 'Fitness Challenge', 'Fitness App', 'Paused', 1560.00, 320000, 4.20, 3.50
  WHERE NOT EXISTS (
    SELECT 1 FROM public.campaigns WHERE user_id = p_user_id AND name = 'Fitness Challenge'
  );

  -- 2) Admin Tasks (from src/components/admin/TasksTable.tsx)
  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Market Research Report', 'TechStart Solutions', 'Strategy', 'High', 'In Progress', 'Sarah Johnson', DATE '2024-01-15'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Market Research Report'
  );

  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Campaign Creative Assets', 'SMARTAX Corp', 'Marketing', 'Medium', 'Completed', 'Mike Chen', DATE '2024-01-14'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Campaign Creative Assets'
  );

  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Client Proposal Development', 'HealthHub', 'Sales', 'High', 'Pending', 'John Wilson', DATE '2024-01-16'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Client Proposal Development'
  );

  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Website Integration', 'ImagineSpace Ltd', 'Strategy', 'Medium', 'Waiting', 'Emma Davis', DATE '2024-01-13'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Website Integration'
  );

  INSERT INTO public.admin_tasks (user_id, name, client, department, priority, status, assigned_to, due_date)
  SELECT p_user_id, 'Social Media Content', 'Global All-In-Consulting', 'Marketing', 'Low', 'In Progress', 'Alex Rivera', DATE '2024-01-17'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_tasks WHERE user_id = p_user_id AND name = 'Social Media Content'
  );

  -- 3) Department KPIs (from AdvertisingAgents/MarketingAgents pages)
  -- Advertising KPIs
  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'advertising', 'Total Agents', '42', NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'advertising' AND label = 'Total Agents'
  );

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'advertising', 'Active Campaigns', '18', NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'advertising' AND label = 'Active Campaigns'
  );

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'advertising', 'Total Ad Spend', '$250,600', jsonb_build_object('direction','up','value','+5.2%')
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'advertising' AND label = 'Total Ad Spend'
  );

  INSERT INTO public.department_kpis (user_id, department, label, value, trend)
  SELECT p_user_id, 'advertising', 'Department Health', '95%', jsonb_build_object('direction','up','value','Excellent')
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_kpis WHERE user_id = p_user_id AND department = 'advertising' AND label = 'Department Health'
  );

  -- 4) Department Agents (Advertising) - metrics kept flexible in JSONB
  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'advertising', 'Olivia Rhye', NULL,
         'https://lh3.googleusercontent.com/aida-public/AB6AXuDVV0yQORHQyjodkknteQ0mmuYhlj7wwpC8U3OI3LV1AatP--6V0YAvq2Wz3o_0-zklaV07c-0U1otWRSGA0Dz-qRa7C9NYc0l_YjAUPz2cj9Gky8Lk0laAtAUOxIdgSN2b6LW3SKaJcjwJZuMDC-xIia3r2Kp0tjJwchS1MeYXchsbsS9WCp4ZK4yvw8H31oXc9KEsND9G1kpx0GV2vCkebhmAQTlmg95op40VGNK4FZKDBOJ_wE7DcJC1qvMF-LWwM6kZnFeDCx9x',
         'online',
         jsonb_build_object('activeCampaigns',5,'optimizationProjects',2,'performancePct',92)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'advertising' AND name = 'Olivia Rhye'
  );

  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'advertising', 'Phoenix Baker', NULL,
         'https://lh3.googleusercontent.com/aida-public/AB6AXuAcqBNJG-9Mt9xwJEqZU52uQZlFfBqwKx0gJmBmtQsiD47jvEPaRgdN09YXjiKCQpG8KxuDSHloV7VvhDG0zo6KLh9y6NNy9vXgOzVfE54psKkDGf3YrtUuhJeiAOC4lluFiMTrXO-vN1VDMr9A6lmiMPG2ECCGVyIcW3J1g9X3g3-je1bJTLux3p_UoQsrT9swo5aJwOb7g_PaB46VHdYhsX1hXDQm-TYhxS6d1lwaMsmyFx7C9UQBF5p7HXVXQMVv2mFR21aswsey',
         'busy',
         jsonb_build_object('activeCampaigns',8,'optimizationProjects',4,'performancePct',85)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'advertising' AND name = 'Phoenix Baker'
  );

  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'advertising', 'Lana Steiner', NULL,
         'https://lh3.googleusercontent.com/aida-public/AB6AXuCVEwd0eBZaCw2rgemCeb3mZsTg11v_EePzVxsAAgtTlcs7aIgVbkicW8h0vovrGHfkG6MTPdYp-kPq1tNq5dvaz_MNLkSpMcB5nG_l3wuinBVEQZVThsP9Ufhjp1Xy0GT7kr_9HfgRJsQv0K8X__jhU8PPddZJ53Vz1kdlJzQ23xztWSITNKr0-hR1WbUCGYRktdL4YW9H1jCATxVVY6AY7TYwFV4rSb2mlB9d-3v2S4Yb8ly-fCyDbIOKFyLFQh5vN452U0XU7pHG',
         'offline',
         jsonb_build_object('activeCampaigns',3,'optimizationProjects',NULL,'performancePct',78)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'advertising' AND name = 'Lana Steiner'
  );

  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'advertising', 'Demi Wilkinson', NULL,
         'https://lh3.googleusercontent.com/aida-public/AB6AXuColtx48s1Vh3C5ZmPsiTWwp9fhaelvouIP6JnunMWRbMJj-06XI2pkVYx1yra_n4LldaALeJ3SZ35Y6DYguE39sjBDXlD93UDaWqjKJB9AF7tOi1ZsIoiFO2YFTmKbIEnpkkyrnioaCGLwuZ1AxDCd3xRQxa_mWsVivZACx5TUEP4wi1aXAasLjOrT_n1h7rxTWiBc3f0BV5X10FbI0CKb1G7oG-4T_dw-XJwov5mLtWqzXH0haLkAaM3rNFUmRqb7kexq2ki6c0Tm',
         'online',
         jsonb_build_object('activeCampaigns',6,'optimizationProjects',3,'performancePct',95)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'advertising' AND name = 'Demi Wilkinson'
  );

  -- Marketing Agents (from src/pages/MarketingAgents.tsx)
  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'marketing', 'Jane Doe', 'Content Manager',
         'https://lh3.googleusercontent.com/aida-public/AB6AXuAxZ39Ef-rzCumYSJwudf6rs8Guq47P9Zk_Kv5U8UC24kIuLFRC69HDQp6ezKm20wrODkPm8CDM3W5l9pP16wIuEQOjIrnUBznZZ0GwE-6tQJSVfsAInYhayk8rQJCmtuFgCPDp44-w_SyUiTwHKG-1CrauDTIEqKzJ-oUoTVhxHt8Oyfg785n0IC_pw_V1nWxap0VxZ_7Jluz32Qsn9iLp8gjF7ZOpbqn7vyq9kC8UYKE8vcw4TSlRzxoOuEQLirDiaD7klPl49PJ8',
         'active',
         jsonb_build_object(
           'contentProgressPercent',75,'contentText','15/20 Projects',
           'campaignsProgressPercent',60,'campaignsText','6/10 Campaigns',
           'healthPercent',95
         )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'marketing' AND name = 'Jane Doe'
  );

  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'marketing', 'John Smith', 'Campaign Specialist',
         'https://lh3.googleusercontent.com/aida-public/AB6AXuCBKklUpnKwU1xAZiZB5CKRPmjDY_wfV8qaCJW-D0VfpSyxyBDvvKii3WzzpKfDDZrsDKTYZ8lnxoQFd6TrX0ORBeyRIJdk7uNTc4-5OWM2qX9pURNi02_rxBFOnKqFJa3nXuQiqocA7ADHm9xMdfCH4nMCRAL7VUFh-yVJVdh_ZJq9sC1ritCVSv3r3Jx53sZ6NRFXNCk3hqCLjeg3xXdsdy80P4K3-y4ySJO_ovCoyFnjMaCGstm_Ys1xmr8eN0UGuJkdTto_ZNLy',
         'active',
         jsonb_build_object(
           'contentProgressPercent',40,'contentText','8/20 Projects',
           'campaignsProgressPercent',90,'campaignsText','9/10 Campaigns',
           'healthPercent',82
         )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'marketing' AND name = 'John Smith'
  );

  INSERT INTO public.department_agents (user_id, department, name, role, avatar_url, status, metrics)
  SELECT p_user_id, 'marketing', 'Emily White', 'SEO Specialist',
         'https://lh3.googleusercontent.com/aida-public/AB6AXuCURxNMKdyIwYl5i9Dio-zlf3Lt5OCd9HREIY9BYR7AEvOqCtQlDomwpkwv4RaXF_GI1winbGsEuz0FvGoPXL6AX2pu_XYxZHfft742xd2LxCStM4XabSldmCsj5-ipPyC7GjMA9JYqM9XqE91aZXDEKSkylwZuSLAwiVcwcCz49nGrVj0iSVJUIMFpXsR58-QQixtEWro_Q3aVGz9k4lIKydhmKyvKOehzHS7FC3UJVpuxAZAweXWrfKSoPLEFLfqDRsyim5R_tVkk',
         'on-leave',
         jsonb_build_object(
           'contentProgressPercent',10,'contentText','2/20 Projects',
           'campaignsProgressPercent',0,'campaignsText','0/10 Campaigns',
           'healthPercent',45
         )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.department_agents WHERE user_id = p_user_id AND department = 'marketing' AND name = 'Emily White'
  );

  -- 5) Seed Market Research example rows (if none exist for user)
  INSERT INTO public.market_research_reports
    (user_id, company_name, company_website, competitor_links, product_description, client_avatar_description, report_content, status, processing_started_at, processing_completed_at)
  SELECT p_user_id, 'TechStart Solutions', 'https://techstart.example.com',
         '["https://competitor-one.example.com","https://competitor-two.example.com"]'::jsonb,
         'B2B project management SaaS targeting SMBs.',
         'Operations managers at 50-500 person companies in North America.',
         'Completed demo report content for TechStart Solutions.',
         'completed', now() - interval '2 days', now() - interval '2 days' + interval '5 minutes'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.market_research_reports WHERE user_id = p_user_id AND company_name = 'TechStart Solutions'
  );

  INSERT INTO public.market_research_reports
    (user_id, company_name, company_website, competitor_links, product_description, client_avatar_description, report_content, status, processing_started_at, processing_completed_at)
  SELECT p_user_id, 'HealthHub Medical', 'https://healthhub.example.com',
         '["https://med-competitor.example.com"]'::jsonb,
         'Healthcare platform offering telemedicine and patient engagement.',
         'Clinic owners and medical directors seeking to reduce no-shows.',
         'Completed demo report content for HealthHub Medical.',
         'completed', now() - interval '1 day', now() - interval '1 day' + interval '7 minutes'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.market_research_reports WHERE user_id = p_user_id AND company_name = 'HealthHub Medical'
  );

  -- 6) Ad Spy demo (minimum viable for AdSpyCreativeBoard: ad_spy_searches + ad_spy_ads + analysis)
  -- Ensure one search exists for the user and capture the id
  SELECT id INTO v_search_id_1
  FROM public.ad_spy_searches
  WHERE user_id = p_user_id AND search_query = 'E-commerce Store' AND search_type = 'creator'
  LIMIT 1;

  IF v_search_id_1 IS NULL THEN
    INSERT INTO public.ad_spy_searches (user_id, search_query, search_type)
    VALUES (p_user_id, 'E-commerce Store', 'creator')
    RETURNING id INTO v_search_id_1;
  END IF;

  -- Insert two demo ads for the search
  SELECT id INTO v_ad1 FROM public.ad_spy_ads WHERE search_id = v_search_id_1 AND ad_copy LIKE 'Summer Collection%';
  IF v_ad1 IS NULL THEN
    INSERT INTO public.ad_spy_ads (search_id, ad_library_url, platform, video_url, image_url, ad_copy)
    VALUES (
      v_search_id_1,
      'https://www.facebook.com/ads/library/',
      'facebook',
      NULL,
      'https://placehold.co/800x450/png',
      'Summer Collection Launch – Discover new styles for the season with free shipping on all orders.'
    )
    RETURNING id INTO v_ad1;

    INSERT INTO public.ad_spy_analysis (ad_id, hook, angle, emotion, cta, script_summary, why_it_works)
    VALUES (
      v_ad1,
      'New season, new you',
      'Fresh styles + free shipping',
      'Excitement / novelty',
      'Shop the collection today',
      'Short, benefit-led copy highlighting seasonal relevance and frictionless purchase.',
      'The hook taps into seasonal momentum; free shipping reduces commitment friction.'
    );
  END IF;

  SELECT id INTO v_ad2 FROM public.ad_spy_ads WHERE search_id = v_search_id_1 AND ad_copy LIKE 'Product Demo%';
  IF v_ad2 IS NULL THEN
    INSERT INTO public.ad_spy_ads (search_id, ad_library_url, platform, video_url, image_url, ad_copy)
    VALUES (
      v_search_id_1,
      'https://www.facebook.com/ads/library/',
      'facebook',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      NULL,
      'Product Demo Video – Watch how teams deliver faster with our SaaS platform.'
    )
    RETURNING id INTO v_ad2;

    INSERT INTO public.ad_spy_analysis (ad_id, hook, angle, emotion, cta, script_summary, why_it_works)
    VALUES (
      v_ad2,
      'See it in action',
      'Outcome visualization + social proof',
      'Confidence / fear of missing out',
      'Start your free trial',
      'Demonstration builds trust and reduces uncertainty; clear CTA aligns with intent.',
      'Video format showcases value quickly; social proof reframes risk.'
    );
  END IF;

  -- 7) Ad Spy schedule (only if user doesn’t have one already)
  IF NOT EXISTS (
    SELECT 1 FROM public.ad_spy_schedules WHERE user_id = p_user_id
  ) THEN
    INSERT INTO public.ad_spy_schedules (user_id, is_active, day_of_week, time_of_day, time_window_days)
    VALUES (p_user_id, true, 1, TIME '09:00', 7);
  END IF;

END;
$$;

COMMENT ON FUNCTION public.seed_demo_data_for_user(uuid) IS
  'Seeds demo data for the specified user. Safe to call multiple times; inserts are idempotent.';

-- Usage (manual, safe for production with a chosen user ID):
-- SELECT public.seed_demo_data_for_user('00000000-0000-0000-0000-000000000000'::uuid);





