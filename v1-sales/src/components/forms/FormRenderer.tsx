import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormFieldData {
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

interface FormRendererProps {
  formTemplate: any;
  fields: FormFieldData[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  existingData?: Record<string, any>;
}

export const FormRenderer = ({ formTemplate, fields, onSubmit, existingData }: FormRendererProps) => {
  const { getLabel } = useOrganization();
  const [submitting, setSubmitting] = useState(false);

  // Build dynamic Zod schema
  const buildSchema = () => {
    const schemaFields: Record<string, any> = {};

    fields.forEach(field => {
      let fieldSchema: any;

      switch (field.field_type) {
        case 'number':
          fieldSchema = z.coerce.number();
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        case 'date':
          fieldSchema = z.string();
          break;
        default:
          fieldSchema = z.string();
      }

      if (field.is_required && field.field_type !== 'checkbox') {
        fieldSchema = fieldSchema.min(1, "This field is required");
      }

      schemaFields[field.id] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  const schema = buildSchema();
  type FormData = z.infer<typeof schema>;

  // Build default values
  const defaultValues: Record<string, any> = {};
  fields.forEach(field => {
    if (existingData && existingData[field.id] !== undefined) {
      defaultValues[field.id] = existingData[field.id];
    } else if (field.default_value) {
      defaultValues[field.id] = field.default_value;
    } else if (field.field_type === 'checkbox') {
      defaultValues[field.id] = false;
    } else {
      defaultValues[field.id] = '';
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      toast.success("Form submitted successfully");
      form.reset();
    } catch (error: any) {
      toast.error("Failed to submit form: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldLabel = (field: FormFieldData) => {
    if (field.glossary_term_id) {
      const term = fields.find(f => f.id === field.id);
      if (term) {
        return getLabel(term.field_label);
      }
    }
    return field.field_label;
  };

  const renderField = (field: FormFieldData) => {
    const label = getFieldLabel(field);

    return (
      <FormField
        key={field.id}
        control={form.control}
        name={field.id as any}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{label} {field.is_required && <span className="text-destructive">*</span>}</FormLabel>
            <FormControl>
              <>
                {field.field_type === 'text' && (
                  <Input 
                    placeholder={field.placeholder} 
                    {...formField}
                    value={formField.value as string}
                  />
                )}
                {field.field_type === 'number' && (
                  <Input 
                    type="number" 
                    placeholder={field.placeholder} 
                    {...formField}
                    value={formField.value as number}
                    onChange={(e) => formField.onChange(e.target.valueAsNumber)}
                  />
                )}
                {field.field_type === 'date' && (
                  <Input 
                    type="date" 
                    {...formField}
                    value={formField.value as string}
                  />
                )}
                {field.field_type === 'textarea' && (
                  <Textarea 
                    placeholder={field.placeholder} 
                    rows={4}
                    {...formField}
                    value={formField.value as string}
                  />
                )}
                {field.field_type === 'select' && (
                  <Select 
                    onValueChange={formField.onChange} 
                    value={formField.value as string}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.field_type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={formField.value as boolean}
                      onCheckedChange={formField.onChange}
                    />
                    <span className="text-sm text-muted-foreground">{field.placeholder}</span>
                  </div>
                )}
              </>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formTemplate.name}</CardTitle>
        {formTemplate.description && (
          <CardDescription>{formTemplate.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {fields.sort((a, b) => a.display_order - b.display_order).map(renderField)}
            
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : existingData ? "Update" : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
