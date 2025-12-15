import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FormBuilderLayout } from "./FormBuilderLayout";

interface FormField {
  id: string;
  glossary_term_id?: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  is_required: boolean;
  placeholder?: string;
  default_value?: string;
  options?: { label: string; value: string }[];
  display_order: number;
}

interface FormBuilderProps {
  formId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export const FormBuilder = ({ formId, onSave, onCancel }: FormBuilderProps) => {
  const { organization, glossaryTerms } = useOrganization();
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
    if (formId) {
      loadFormData();
    }
  }, [formId]);

  const loadRoles = async () => {
    if (!organization?.niche_id) return;
    
    const { data, error } = await supabase
      .from('niche_roles')
      .select('*')
      .eq('niche_id', organization.niche_id);

    if (!error && data) {
      setAvailableRoles(data);
    }
  };

  const loadFormData = async () => {
    if (!formId) return;

    const { data: form } = await supabase
      .from('form_templates')
      .select('*, form_fields(*), form_role_assignments(*)')
      .eq('id', formId)
      .single();

    if (form) {
      setFormName(form.name);
      setFormDescription(form.description || "");
      const formFields = form.form_fields.map((f: any) => ({
        ...f,
        field_type: f.field_type as FormField['field_type']
      }));
      setFields(formFields.sort((a: any, b: any) => a.display_order - b.display_order));
      setSelectedRoles(form.form_role_assignments.map((r: any) => r.role_id));
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Please enter a form name");
      return;
    }

    if (fields.length === 0) {
      toast.error("Please add at least one field");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Please assign at least one role");
      return;
    }

    setLoading(true);

    try {
      let targetFormId = formId;

      if (formId) {
        // Update existing form
        const { error: updateError } = await supabase
          .from('form_templates')
          .update({ name: formName, description: formDescription })
          .eq('id', formId);

        if (updateError) throw new Error(`Failed to update form: ${updateError.message}`);

        // Delete old fields and role assignments
        const { error: deleteFieldsError } = await supabase
          .from('form_fields')
          .delete()
          .eq('form_template_id', formId);
        
        if (deleteFieldsError) throw new Error(`Failed to delete old fields: ${deleteFieldsError.message}`);

        const { error: deleteRolesError } = await supabase
          .from('form_role_assignments')
          .delete()
          .eq('form_template_id', formId);
        
        if (deleteRolesError) throw new Error(`Failed to delete old role assignments: ${deleteRolesError.message}`);
      } else {
        // Create new form
        const { data: newForm, error: formError } = await supabase
          .from('form_templates')
          .insert({
            organization_id: organization!.id,
            name: formName,
            description: formDescription,
          })
          .select()
          .single();

        if (formError) throw new Error(`Failed to create form: ${formError.message}`);
        targetFormId = newForm.id;
      }

      // Insert fields (for both create and update)
      const fieldsToInsert = fields.map((f, idx) => ({
        form_template_id: targetFormId,
        glossary_term_id: f.glossary_term_id,
        field_label: f.field_label,
        field_type: f.field_type,
        is_required: f.is_required,
        placeholder: f.placeholder,
        default_value: f.default_value,
        options: f.options,
        display_order: idx,
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsToInsert);
      
      if (fieldsError) throw new Error(`Failed to save fields: ${fieldsError.message}`);

      // Insert role assignments (for both create and update)
      const roleAssignments = selectedRoles.map(roleId => ({
        form_template_id: targetFormId,
        role_id: roleId,
      }));

      const { error: rolesError } = await supabase
        .from('form_role_assignments')
        .insert(roleAssignments);
      
      if (rolesError) throw new Error(`Failed to save role assignments: ${rolesError.message}`);

      toast.success("Form saved successfully");
      onSave();
    } catch (error: any) {
      toast.error(error.message || "Failed to save form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action buttons at top */}
      <div className="flex justify-between items-center sticky top-0 bg-background py-3 px-1 z-10 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          {formId ? "Edit Form" : "Create Form"}
        </h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : formId ? "Update Form" : "Create Form"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>Basic information about your form</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formName">Form Name</Label>
            <Input
              id="formName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Daily KPI Entry"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="formDescription">Description</Label>
            <Textarea
              id="formDescription"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Enter daily performance metrics"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <FormBuilderLayout
        glossaryTerms={glossaryTerms}
        fields={fields}
        roles={availableRoles}
        selectedRoleIds={selectedRoles}
        onFieldsChange={setFields}
        onRolesChange={setSelectedRoles}
      />
    </div>
  );
};
