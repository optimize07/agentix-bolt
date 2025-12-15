import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const FormsSettings = () => {
  const { organization } = useOrganization();
  const [forms, setForms] = useState<any[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | undefined>();
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization) {
      loadForms();
    }
  }, [organization]);

  const loadForms = async () => {
    if (!organization) return;

    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select(`
          *,
          form_fields(count),
          form_role_assignments(
            role_id,
            niche_roles(name)
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setForms(data || []);
    } catch (error: any) {
      toast.error("Failed to load forms: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    setEditingFormId(undefined);
    setIsBuilderOpen(true);
  };

  const handleEditForm = (formId: string) => {
    setEditingFormId(formId);
    setIsBuilderOpen(true);
  };

  const handleFormSaved = () => {
    setIsBuilderOpen(false);
    setEditingFormId(undefined);
    loadForms();
  };

  const handleDeleteForm = async () => {
    if (!deleteFormId) return;

    try {
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', deleteFormId);

      if (error) throw error;

      toast.success("Form deleted successfully");
      loadForms();
    } catch (error: any) {
      toast.error("Failed to delete form: " + error.message);
    } finally {
      setDeleteFormId(null);
    }
  };

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('form_templates')
        .update({ is_active: !currentStatus })
        .eq('id', formId);

      if (error) throw error;

      toast.success(currentStatus ? "Form deactivated" : "Form activated");
      loadForms();
    } catch (error: any) {
      toast.error("Failed to update form status: " + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Forms Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage data entry forms for your team
          </p>
        </div>
        <Button onClick={handleCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Create Form
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading forms...</p>
          </CardContent>
        </Card>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No forms yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first form to start collecting data from your team
              </p>
              <Button onClick={handleCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Form
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map(form => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{form.name}</p>
                        {form.description && (
                          <p className="text-sm text-muted-foreground">{form.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{form.form_fields[0]?.count || 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {form.form_role_assignments?.map((assignment: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {assignment.niche_roles?.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={form.is_active ? "default" : "secondary"}>
                        {form.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(form.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFormStatus(form.id, form.is_active)}
                        >
                          {form.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditForm(form.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteFormId(form.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Form Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFormId ? "Edit Form" : "Create New Form"}</DialogTitle>
          </DialogHeader>
          <FormBuilder
            formId={editingFormId}
            onSave={handleFormSaved}
            onCancel={() => setIsBuilderOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFormId} onOpenChange={() => setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form and all associated submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
