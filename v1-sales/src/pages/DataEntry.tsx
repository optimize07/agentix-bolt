import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { FormRenderer } from "@/components/forms/FormRenderer";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function DataEntry() {
  const { user, role, organization } = useOrganization();
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [selectedFormFields, setSelectedFormFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && role) {
      loadUserForms();
      loadRecentSubmissions();
    }
  }, [user, role]);

  const loadUserForms = async () => {
    if (!role?.id) return;

    try {
      // Get forms assigned to user's role
      const { data: roleAssignments } = await supabase
        .from('form_role_assignments')
        .select('form_template_id')
        .eq('role_id', role.id);

      if (!roleAssignments || roleAssignments.length === 0) {
        setAvailableForms([]);
        setLoading(false);
        return;
      }

      const formIds = roleAssignments.map(r => r.form_template_id);

      // Get active forms
      const { data: forms, error } = await supabase
        .from('form_templates')
        .select('*, form_fields(count)')
        .in('id', formIds)
        .eq('is_active', true);

      if (error) throw error;

      setAvailableForms(forms || []);
    } catch (error: any) {
      toast.error("Failed to load forms: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSubmissions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*, form_templates(name)')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentSubmissions(data || []);
    } catch (error: any) {
      console.error("Failed to load submissions:", error);
    }
  };

  const openForm = async (form: any) => {
    try {
      const { data: fields, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_template_id', form.id)
        .order('display_order');

      if (error) throw error;

      setSelectedForm(form);
      setSelectedFormFields(fields || []);
    } catch (error: any) {
      toast.error("Failed to load form: " + error.message);
    }
  };

  const handleFormSubmit = async (data: Record<string, any>) => {
    if (!selectedForm || !user || !organization) return;

    try {
      const { error } = await supabase
        .from('form_submissions')
        .insert({
          form_template_id: selectedForm.id,
          user_id: user.id,
          organization_id: organization.id,
          submission_data: data,
        });

      if (error) throw error;

      setSelectedForm(null);
      setSelectedFormFields([]);
      loadRecentSubmissions();
      toast.success("Form submitted successfully");
    } catch (error: any) {
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div className="fixed top-0 left-64 right-0 bg-background border-b border-border z-40">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">Data Entry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your daily metrics and performance data
          </p>
        </div>
      </div>
      
      <div className="pt-[73px] p-6 space-y-6">
        {/* Show form if selected, otherwise show form list */}
        {selectedForm ? (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => {
              setSelectedForm(null);
              setSelectedFormFields([]);
            }}>
              ← Back to Forms
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>{selectedForm.name}</CardTitle>
                {selectedForm.description && (
                  <CardDescription>{selectedForm.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {selectedFormFields.length > 0 && (
                  <FormRenderer
                    formTemplate={selectedForm}
                    fields={selectedFormFields}
                    onSubmit={handleFormSubmit}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Available Forms */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Your Forms</h2>
              {loading ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">Loading forms...</p>
                  </CardContent>
                </Card>
              ) : availableForms.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No forms available</p>
                      <p className="text-sm text-muted-foreground">
                        Contact your administrator to assign forms to your role
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableForms.map(form => (
                    <Card key={form.id} className="hover:border-primary transition-colors cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          {form.name}
                        </CardTitle>
                        {form.description && (
                          <CardDescription>{form.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {form.form_fields[0]?.count || 0} fields
                          </span>
                          <Button size="sm" onClick={() => openForm(form)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Fill Form
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            {recentSubmissions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Recent Submissions</h2>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Form</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentSubmissions.map(submission => (
                          <TableRow key={submission.id}>
                            <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                            <TableCell>{submission.form_templates?.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Complete</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
