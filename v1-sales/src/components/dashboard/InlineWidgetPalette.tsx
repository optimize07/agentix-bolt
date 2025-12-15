import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WidgetTemplate } from "@/types/template";
import { widgetTemplates } from "@/templates/widgetTemplates";
import { BarChart3, LineChart, PieChart, TrendingUp, Grid3x3, Sheet } from "lucide-react";

interface InlineWidgetPaletteProps {
  onSelectTemplate: (template: WidgetTemplate) => void;
  isOpen: boolean;
}

// Group templates by widget type
const groupedTemplates = widgetTemplates.reduce((acc, template) => {
  if (!acc[template.widgetType]) {
    acc[template.widgetType] = [];
  }
  acc[template.widgetType].push(template);
  return acc;
}, {} as Record<string, WidgetTemplate[]>);

// Category configuration with icons and display names
const categories = [
  { key: 'sheet', name: 'Sheets', icon: Sheet },
  { key: 'lineChart', name: 'Line Charts', icon: LineChart },
  { key: 'barChart', name: 'Bar Charts', icon: BarChart3 },
  { key: 'pieChart', name: 'Pie Charts', icon: PieChart },
  { key: 'statsCard', name: 'Stats Cards', icon: TrendingUp },
  { key: 'kpi', name: 'KPIs', icon: Grid3x3 },
];

export const InlineWidgetPalette = ({ onSelectTemplate, isOpen }: InlineWidgetPaletteProps) => {
  // Find categories that have active route to keep them open
  const defaultOpenCategories = categories
    .filter(cat => groupedTemplates[cat.key]?.some(t => t.name.includes('Blank')))
    .map(cat => cat.key)
    .slice(0, 1); // Keep first category open by default

  return (
    <div
      className={`absolute left-0 top-0 h-full w-72 bg-background border-r shadow-lg z-40 transition-all duration-300 ease-out ${
        isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      }`}
    >
      <Card className="h-full border-0 rounded-none flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-sm">Add Widget</CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 h-0">
          <CardContent className="space-y-1 p-4">
            <Accordion type="multiple" defaultValue={defaultOpenCategories} className="w-full">
              {categories.map((category) => {
                const templates = groupedTemplates[category.key] || [];
                const CategoryIcon = category.icon;
                
                if (templates.length === 0) return null;

                return (
                  <AccordionItem key={category.key} value={category.key} className="border-b-0">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <CategoryIcon size={16} className="text-primary" />
                        <span className="text-xs font-medium">{category.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-1 pt-1">
                        {templates.map((template) => (
                          <Button
                            key={template.id}
                            variant="ghost"
                            className="w-full justify-start h-auto p-3 hover:bg-accent text-left"
                            onClick={() => onSelectTemplate(template)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs">{template.name}</div>
                              {template.description && (
                                <div className="text-[10px] text-muted-foreground line-clamp-2">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
};
