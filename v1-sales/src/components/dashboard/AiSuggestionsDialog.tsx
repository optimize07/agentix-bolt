import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, LineChart, PieChart, TrendingUp, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { WidgetPreviewThumbnail } from "./WidgetPreviewThumbnail";

interface ComponentSuggestion {
  componentType: 'statsCard' | 'barChart' | 'lineChart' | 'pieChart';
  title: string;
  description: string;
  formula?: {
    type: 'aggregation';
    operation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
    sourceColumn: string;
    filters?: any[];
  };
  dataBinding?: {
    columns: {
      x?: string;
      y?: string;
      value?: string;
    };
  };
  glossaryMapping?: {
    csvColumn: string;
    glossaryTerm: string;
  };
}

interface AiSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: ComponentSuggestion[];
  onAccept: (suggestions: ComponentSuggestion[]) => void;
  onReject: () => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'statsCard':
      return TrendingUp;
    case 'barChart':
      return BarChart;
    case 'lineChart':
      return LineChart;
    case 'pieChart':
      return PieChart;
    default:
      return TrendingUp;
  }
};

const formatComponentType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'statsCard': 'Stats Card',
    'barChart': 'Bar Chart',
    'lineChart': 'Line Chart',
    'pieChart': 'Pie Chart',
    'table': 'Table',
    'kpi': 'KPI'
  };
  return typeMap[type] || type;
};

export const AiSuggestionsDialog = ({ 
  open, 
  onOpenChange, 
  suggestions, 
  onAccept,
  onReject 
}: AiSuggestionsDialogProps) => {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    new Set(suggestions.map((_, idx) => idx))
  );

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleAccept = () => {
    const selected = suggestions.filter((_, idx) => selectedSuggestions.has(idx));
    onAccept(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            AI Dashboard Suggestions
          </DialogTitle>
          <DialogDescription>
            Select the components you'd like to add to your dashboard. Each component includes calculated formulas based on your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {suggestions.map((suggestion, index) => {
            const Icon = getIconForType(suggestion.componentType);
            const isSelected = selectedSuggestions.has(index);

            return (
              <Card 
                key={index}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleToggleSuggestion(index)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base">{suggestion.title}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {formatComponentType(suggestion.componentType)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <WidgetPreviewThumbnail 
                        componentType={suggestion.componentType}
                        title={suggestion.title}
                        formula={suggestion.formula}
                      />
                      {isSelected && (
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm mb-2">
                    {suggestion.description}
                  </CardDescription>
                  {suggestion.formula && (
                    <div className="text-xs bg-muted/50 rounded p-2 mt-2 space-y-1">
                      <div className="font-medium text-foreground">
                        {suggestion.formula.operation === 'SUM' && 'Sum of '}
                        {suggestion.formula.operation === 'AVG' && 'Average of '}
                        {suggestion.formula.operation === 'COUNT' && 'Count of '}
                        {suggestion.formula.operation === 'MIN' && 'Minimum of '}
                        {suggestion.formula.operation === 'MAX' && 'Maximum of '}
                        {suggestion.formula.sourceColumn}
                      </div>
                      <div className="font-mono text-primary text-[10px]">
                        Formula: {suggestion.formula.operation}({suggestion.formula.sourceColumn})
                      </div>
                      {suggestion.formula.filters && suggestion.formula.filters.length > 0 && (
                        <span className="text-muted-foreground">
                          • {suggestion.formula.filters.length} filter(s) applied
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onReject}>
            Skip for now
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={selectedSuggestions.size === 0}
          >
            Add {selectedSuggestions.size} Component{selectedSuggestions.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
