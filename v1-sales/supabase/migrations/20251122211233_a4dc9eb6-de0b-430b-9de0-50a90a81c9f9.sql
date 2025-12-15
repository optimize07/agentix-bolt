-- Phase 2B: Add RLS policies for dashboard persistence, user management, and product management

-- ============================================
-- DASHBOARD LAYOUTS POLICIES
-- ============================================

-- Users can create dashboards in their org
CREATE POLICY "Users can create dashboards in their org"
ON dashboard_layouts FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Users can update their own dashboards
CREATE POLICY "Users can update their own dashboards"
ON dashboard_layouts FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND (user_id = auth.uid() OR user_id IS NULL)
);

-- Users can delete their own dashboards
CREATE POLICY "Users can delete their own dashboards"
ON dashboard_layouts FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- ============================================
-- USER ROLES MANAGEMENT POLICIES
-- ============================================

-- Users with users.manage permission can insert user roles
CREATE POLICY "Admins can assign roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
  user_has_permission(auth.uid(), organization_id, 'users.manage')
);

-- Users with users.manage permission can update user roles
CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (
  user_has_permission(auth.uid(), organization_id, 'users.manage')
);

-- Users with users.manage permission can delete user roles
CREATE POLICY "Admins can remove roles"
ON user_roles FOR DELETE
TO authenticated
USING (
  user_has_permission(auth.uid(), organization_id, 'users.manage')
);

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Users can create products in their org
CREATE POLICY "Users can create products in their org"
ON products FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Users can update products in their org
CREATE POLICY "Users can update products in their org"
ON products FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Users can delete products in their org
CREATE POLICY "Users can delete products in their org"
ON products FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================
-- PRODUCT VARIATIONS POLICIES
-- ============================================

-- Users can create variations for products in their org
CREATE POLICY "Users can create product variations"
ON product_variations FOR INSERT
TO authenticated
WITH CHECK (
  product_id IN (
    SELECT id FROM products WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Users can update variations for products in their org
CREATE POLICY "Users can update product variations"
ON product_variations FOR UPDATE
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Users can delete variations for products in their org
CREATE POLICY "Users can delete product variations"
ON product_variations FOR DELETE
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- ============================================
-- ADD MISSING GLOSSARY TERMS FOR PHASE 2B
-- ============================================

DO $$
DECLARE
  niche_record RECORD;
BEGIN
  FOR niche_record IN SELECT id FROM niches LOOP
    -- User Management terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'users.team_members', 'Team Members', 'entity'),
      (niche_record.id, 'users.invite', 'Invite User', 'action'),
      (niche_record.id, 'users.role', 'Role', 'field'),
      (niche_record.id, 'users.unit', 'Unit', 'field'),
      (niche_record.id, 'users.status', 'Status', 'field'),
      (niche_record.id, 'users.remove', 'Remove', 'action'),
      (niche_record.id, 'action.change_role', 'Change Role', 'action'),
      (niche_record.id, 'action.invite_user', 'Invite User', 'action')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Products terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'products.catalog', 'Product Catalog', 'entity'),
      (niche_record.id, 'products.new', 'New Product', 'action'),
      (niche_record.id, 'products.edit', 'Edit Product', 'action'),
      (niche_record.id, 'products.variations', 'Variations', 'entity'),
      (niche_record.id, 'products.features', 'Features', 'field'),
      (niche_record.id, 'products.pricing', 'Pricing', 'field'),
      (niche_record.id, 'field.base_price', 'Base Price', 'field'),
      (niche_record.id, 'field.currency', 'Currency', 'field'),
      (niche_record.id, 'field.description', 'Description', 'field'),
      (niche_record.id, 'field.billing_cycle', 'Billing Cycle', 'field')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Dashboard terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'dashboard.last_saved', 'Last saved', 'status'),
      (niche_record.id, 'dashboard.saving', 'Saving...', 'status'),
      (niche_record.id, 'dashboard.unsaved', 'Unsaved changes', 'status'),
      (niche_record.id, 'dashboard.my_dashboards', 'My Dashboards', 'entity'),
      (niche_record.id, 'dashboard.shared', 'Shared', 'status')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Permission terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'permission.denied', 'Permission Denied', 'status'),
      (niche_record.id, 'permission.required', 'Required Permission', 'status')
    ON CONFLICT (niche_id, term_key) DO NOTHING;

    -- Navigation terms
    INSERT INTO glossary_terms (niche_id, term_key, default_label, category)
    VALUES 
      (niche_record.id, 'nav.analytics', 'Analytics', 'navigation')
    ON CONFLICT (niche_id, term_key) DO NOTHING;
  END LOOP;
END $$;