import { useState, useMemo, useEffect } from "react";
import { CanvasComponent } from "@/types/tab";
import { Tab } from "@/types/tab";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, Trash2, TrendingUp, BarChart3, PieChart as PieChartIcon, Target, Hash, Calendar, Layers, DollarSign, Calculator, ArrowUp, ArrowDown } from "lucide-react";
import { WidgetPreview } from "./WidgetPreview";
import { analyzeData, generateSmartPrompts } from "@/utils/dataAnalyzer";
import { widgetTemplates } from "@/templates/widgetTemplates";
import { Separator } from "@/components/ui/separator";
import { AiGenerationErrorBoundary } from "./AiGenerationErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

interface UnifiedPropertiesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: CanvasComponent | null;
  tab: Tab;
  onUpdateComponent: (component: CanvasComponent) => void;
  onDeleteComponent: () => void;
}

export const UnifiedPropertiesPanel = ({
  open,
  onOpenChange,
  component,
  tab,
  onUpdateComponent,
  onDeleteComponent,
}: UnifiedPropertiesPanelProps) => {
  const [aiInput, setAiInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [localConfig, setLocalConfig] = useState(component?.config || {});
  const [localDataBinding, setLocalDataBinding] = useState(component?.dataBinding);
  const [localFormula, setLocalFormula] = useState(component?.formula);

  // Sync local state when component changes (panel opens for new/updated widget)
  useEffect(() => {
    if (component) {
      setLocalConfig(component.config || {});
      setLocalDataBinding(component.dataBinding);
      setLocalFormula(component.formula);
    }
  }, [component?.id, component?.config, component?.dataBinding, component?.formula]);

  // Available data sources
  const availableDataSources = useMemo(() => {
    const sources = [
      ...tab.dataSources.map(ds => ({
        id: ds.id,
        name: ds.name,
        data: ds.data,
      })),
      ...tab.components
        .filter(c => c.type === 'sheet' && c.config.sheetData)
        .map(c => ({
          id: c.id,
          name: c.config.title || 'Sheet',
          data: c.config.sheetData!,
        }))
    ];
    return sources;
  }, [tab.dataSources, tab.components]);

  const selectedDataSource = localDataBinding?.sheetId 
    ? availableDataSources.find(ds => ds.id === localDataBinding.sheetId)
    : null;

  const previewData = selectedDataSource?.data;

  const availableColumns = useMemo(() => {
    if (!previewData || previewData.length === 0) return [];
    return previewData[0].filter((col: string) => col && col.trim() !== '');
  }, [previewData]);

  const smartPrompts = useMemo(() => {
    if (!selectedDataSource || !previewData || previewData.length === 0) return [];
    
    const analysis = analyzeData(previewData);
    return generateSmartPrompts(analysis, component?.type || '');
  }, [selectedDataSource, previewData, component?.type]);
  
  const relevantTemplates = useMemo(() => {
    if (!component) return [];
    return widgetTemplates.filter(t => t.widgetType === component.type);
  }, [component?.type]);
  
  const iconMap: Record<string, any> = {
    TrendingUp,
    BarChart3,
    PieChart: PieChartIcon,
    Target,
    Hash,
    Calendar,
    Layers,
    DollarSign,
    Calculator,
    ArrowUp,
    ArrowDown,
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Analyzing your request...");

    try {
      setGenerationStatus("Generating configuration...");

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'user', content: aiInput }
          ],
          mode: 'generate-config',
          context: {
            dataSources: availableDataSources.map(ds => ({
              id: ds.id,
              name: ds.name,
              columns: ds.data[0] || []
            }))
          },
          streaming: false
        }
      });

      if (error) {
        console.error('Function error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('429')) {
          toast.error("Rate limit exceeded", {
            description: "Please wait a moment before trying again."
          });
        } else if (error.message?.includes('402')) {
          toast.error("Credits depleted", {
            description: "Add more credits to continue using AI features."
          });
        } else {
          toast.error("Failed to generate configuration", {
            description: error.message
          });
        }
        return;
      }

      setGenerationStatus("Applying settings...");

      let result;
      if (data.choices && data.choices[0]) {
        const message = data.choices[0].message;
        
        // Check for tool calls first (this is what the AI returns)
        if (message.tool_calls && message.tool_calls.length > 0) {
          const toolCall = message.tool_calls[0];
          if (toolCall.function?.name === 'generate_widgets') {
            const toolArgs = JSON.parse(toolCall.function.arguments);
            // Extract first widget from the widgets array
            if (toolArgs.widgets && toolArgs.widgets.length > 0) {
              const widget = toolArgs.widgets[0];
              result = {
                title: widget.title,
                description: widget.description,
                dataBinding: widget.dataBinding,
                formula: widget.formula,
              };
            }
          }
        }
        // Fallback to content if no tool calls
        else if (message.content) {
          const jsonMatch = message.content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(message.content);
        }
        
        if (!result) {
          throw new Error('Could not parse AI response');
        }
      } else if (typeof data === 'string') {
        result = JSON.parse(data);
      } else {
        result = data;
      }

      setLocalConfig({
        ...localConfig,
        title: result.title || localConfig.title,
        description: result.description || localConfig.description,
      });

      if (result.dataBinding) {
        setLocalDataBinding(result.dataBinding);
      }

      if (result.formula) {
        setLocalFormula(result.formula);
      }

      toast.success("Configuration generated successfully");
      setAiInput("");
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      if (error instanceof SyntaxError) {
        toast.error('Invalid response format', {
          description: 'Try rephrasing your request more specifically.'
        });
      } else if (error.message?.includes('Could not parse')) {
        toast.error('Unable to understand AI response', {
          description: 'Please try a different prompt.'
        });
      } else {
        toast.error('Failed to generate configuration', {
          description: error.message || 'An unexpected error occurred'
        });
      }
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  const handleApply = () => {
    if (!component) return;

    const updatedComponent: CanvasComponent = {
      ...component,
      config: localConfig,
      dataBinding: localDataBinding,
      formula: localFormula,
    };

    onUpdateComponent(updatedComponent);
    onOpenChange(false);
    toast.success("Widget updated");
  };

  if (!component) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-5xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configure Widget
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden h-[calc(100vh-140px)]">
          <div className="grid grid-cols-[1fr_1fr_280px] gap-0 h-full">
            {/* Left Column - AI & Smart Prompts */}
            <div className="px-6 py-4 space-y-4 border-r">
              {/* AI Generation Section */}
              <AiGenerationErrorBoundary onReset={() => setAiInput("")}>
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Ask AI
                  </Label>
                  
                  {isGenerating ? (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <Skeleton className="h-[70px] w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{generationStatus}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Describe what you want..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        className="min-h-[70px] resize-none text-sm flex-1"
                      />
                      <Button
                        onClick={handleAiGenerate}
                        disabled={!aiInput.trim()}
                        size="sm"
                        className="h-[70px] px-3"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </AiGenerationErrorBoundary>

              <Separator />

              {/* Smart Prompts - Card Style */}
              {smartPrompts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Smart Suggestions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {smartPrompts.slice(0, 4).map((prompt, idx) => {
                      const Icon = iconMap[prompt.icon] || Sparkles;
                      return (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-primary/10 hover:border-primary transition-all group"
                          onClick={() => {
                            setAiInput(prompt.text);
                            if (prompt.config) {
                              if (prompt.config.dataBinding) {
                                setLocalDataBinding({ ...localDataBinding, ...prompt.config.dataBinding });
                              }
                              if (prompt.config.formula) {
                                setLocalFormula(prompt.config.formula);
                              }
                            }
                          }}
                        >
                          <Icon className="h-4 w-4 text-primary mb-1.5" />
                          <p className="text-xs font-medium leading-tight">{prompt.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Center Column - Properties & Templates */}
            <div className="px-6 py-4 space-y-4 border-r">

              {/* Properties Section - Inline Layout */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Properties</Label>
                
                {/* Title - Inline */}
                <div className="flex items-center gap-3">
                  <Label className="text-xs w-20 shrink-0">Title</Label>
                  <Input
                    value={localConfig.title || ''}
                    onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                    placeholder="Widget title"
                    className="h-8 text-sm flex-1"
                  />
                </div>

                {availableDataSources.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Label className="text-xs w-20 shrink-0">Source</Label>
                    <Select
                      value={localDataBinding?.sheetId || selectedDataSource?.id || ''}
                      onValueChange={(value) => {
                        setLocalDataBinding({ ...localDataBinding, sheetId: value, columns: {} });
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select data" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDataSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedDataSource && availableColumns.length > 0 && (
                  <>
                    {(component.type === 'lineChart' || component.type === 'barChart') && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-xs w-12 shrink-0">X-Axis</Label>
                          <Select
                            value={localDataBinding?.columns?.x || ''}
                            onValueChange={(value) => setLocalDataBinding({
                              ...localDataBinding,
                              columns: { ...localDataBinding?.columns, x: value }
                            })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="X" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-xs w-12 shrink-0">Y-Axis</Label>
                          <Select
                            value={localDataBinding?.columns?.y || ''}
                            onValueChange={(value) => setLocalDataBinding({
                              ...localDataBinding,
                              columns: { ...localDataBinding?.columns, y: value }
                            })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Y" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {component.type === 'pieChart' && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-xs w-12 shrink-0">Label</Label>
                          <Select
                            value={localDataBinding?.columns?.label || ''}
                            onValueChange={(value) => setLocalDataBinding({
                              ...localDataBinding,
                              columns: { ...localDataBinding?.columns, label: value }
                            })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Label" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-xs w-12 shrink-0">Value</Label>
                          <Select
                            value={localDataBinding?.columns?.value || ''}
                            onValueChange={(value) => setLocalDataBinding({
                              ...localDataBinding,
                              columns: { ...localDataBinding?.columns, value: value }
                            })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Value" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {(component.type === 'statsCard' || component.type === 'kpi') && (
                      <>
                        <div className="flex items-center gap-3">
                          <Label className="text-xs w-20 shrink-0">Column</Label>
                          <Select
                            value={localDataBinding?.columns?.value || ''}
                            onValueChange={(value) => {
                              setLocalDataBinding({
                                ...localDataBinding,
                                columns: { ...localDataBinding?.columns, value: value }
                              });
                              // Update formula sourceColumn so preview updates
                              setLocalFormula({
                                type: 'aggregation',
                                operation: localFormula?.operation || 'COUNT',
                                sourceColumn: value
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label className="text-xs w-20 shrink-0">Function</Label>
                          <Select
                            value={localFormula?.operation || localDataBinding?.aggregation || 'COUNT'}
                            onValueChange={(value: any) => {
                              const selectedCol = localDataBinding?.columns?.value || availableColumns[0];
                              setLocalFormula({
                                type: 'aggregation',
                                operation: value,
                                sourceColumn: selectedCol,
                              });
                              setLocalDataBinding({
                                ...localDataBinding,
                                aggregation: value.toLowerCase()
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Function" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SUM">Sum</SelectItem>
                              <SelectItem value="AVG">Average</SelectItem>
                              <SelectItem value="COUNT">Count</SelectItem>
                              <SelectItem value="MIN">Minimum</SelectItem>
                              <SelectItem value="MAX">Maximum</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Row Settings - for sheet and table */}
              {(component.type === 'sheet' || component.type === 'table') && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Row Settings</Label>
                    
                    <div className="flex items-center gap-3">
                      <Label className="text-xs w-24 shrink-0">Default Height</Label>
                      <Select
                        value={localConfig.sheetConfig?.defaultRowHeight?.toString() || '32'}
                        onValueChange={(value) => setLocalConfig({
                          ...localConfig,
                          sheetConfig: {
                            ...localConfig.sheetConfig,
                            defaultRowHeight: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">Compact (24px)</SelectItem>
                          <SelectItem value="32">Default (32px)</SelectItem>
                          <SelectItem value="48">Comfortable (48px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Label className="text-xs w-24 shrink-0">Rows per page</Label>
                      <Select
                        value={localConfig.sheetConfig?.rowsPerPage?.toString() || '25'}
                        onValueChange={(value) => setLocalConfig({
                          ...localConfig,
                          sheetConfig: {
                            ...localConfig.sheetConfig,
                            rowsPerPage: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 rows</SelectItem>
                          <SelectItem value="25">25 rows</SelectItem>
                          <SelectItem value="50">50 rows</SelectItem>
                          <SelectItem value="100">100 rows</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Templates Section - Compact Badges */}
              {relevantTemplates.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quick Templates</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {relevantTemplates.slice(0, 8).map((template) => (
                        <Badge
                          key={template.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs px-2 py-1"
                          onClick={() => {
                            setLocalConfig({
                              ...localConfig,
                              title: template.config.title,
                              ...template.config,
                            });
                            
                            // Auto-match columns based on template hints
                            if (template.suggestedBindings?.columnHint && availableColumns.length > 0) {
                              const regex = new RegExp(template.suggestedBindings.columnHint, 'i');
                              const matchedColumn = availableColumns.find(col => regex.test(col));
                              
                              if (matchedColumn && template.formula?.operation) {
                                setLocalDataBinding({
                                  ...localDataBinding,
                                  columns: { value: matchedColumn },
                                  aggregation: template.suggestedBindings.aggregation
                                });
                                
                                setLocalFormula({
                                  type: 'aggregation',
                                  operation: template.formula.operation,
                                  sourceColumn: matchedColumn
                                });
                                
                                toast.success(`Applied "${template.name}"`, {
                                  description: `Auto-bound to "${matchedColumn}"`
                                });
                                return;
                              }
                            }
                            
                            // If no column matching, just apply config
                            if (template.formula?.operation && availableColumns.length > 0) {
                              setLocalFormula({
                                type: 'aggregation',
                                operation: template.formula.operation,
                                sourceColumn: availableColumns[0]
                              });
                            }
                            
                            toast.success(`Applied "${template.name}"`);
                          }}
                        >
                          {template.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Formatting Section - for statsCard and kpi */}
              {(component.type === 'statsCard' || component.type === 'kpi') && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Formatting</Label>
                    
                    {/* Quick format presets */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs px-2 py-1"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          formatting: { prefix: '$', decimals: 2, useThousandsSeparator: true }
                        })}
                      >
                        $1,234.00
                      </Badge>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs px-2 py-1"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          formatting: { prefix: '', decimals: 0, useThousandsSeparator: true }
                        })}
                      >
                        1,234
                      </Badge>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs px-2 py-1"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          formatting: { prefix: '', suffix: '%', decimals: 1, useThousandsSeparator: false }
                        })}
                      >
                        12.3%
                      </Badge>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs px-2 py-1"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          formatting: { prefix: '€', decimals: 2, useThousandsSeparator: true }
                        })}
                      >
                        €1,234.00
                      </Badge>
                    </div>
                    
                    {/* Detailed controls */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={localConfig.formatting?.prefix || 'none'}
                        onValueChange={(value) => setLocalConfig({
                          ...localConfig,
                          formatting: { ...localConfig.formatting, prefix: value === 'none' ? '' : value }
                        })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Prefix" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="$">$ Dollar</SelectItem>
                          <SelectItem value="€">€ Euro</SelectItem>
                          <SelectItem value="£">£ Pound</SelectItem>
                          <SelectItem value="¥">¥ Yen</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={localConfig.formatting?.decimals?.toString() || '2'}
                        onValueChange={(value) => setLocalConfig({
                          ...localConfig,
                          formatting: { ...localConfig.formatting, decimals: parseInt(value) as 0 | 1 | 2 }
                        })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Decimals" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">1,234 (clean)</SelectItem>
                          <SelectItem value="1">1,234.0</SelectItem>
                          <SelectItem value="2">1,234.00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Live preview of formatting */}
                    <div className="p-2 bg-muted rounded text-center text-lg font-mono">
                      {(() => {
                        const { prefix = '', suffix = '', decimals = 2, useThousandsSeparator = true } = localConfig.formatting || {};
                        const formatted = useThousandsSeparator 
                          ? (1234.567).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
                          : (1234.567).toFixed(decimals);
                        return `${prefix}${formatted}${suffix}`;
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Compact Preview */}
            <div className="px-4 py-4 bg-muted/30 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Preview</Label>
                <div className="bg-background rounded-lg p-3 border aspect-[4/3]">
                  {(component.type === 'sheet' || component.type === 'table') ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      No preview
                    </div>
                  ) : (
                    <WidgetPreview
                      type={component.type as 'lineChart' | 'barChart' | 'pieChart' | 'statsCard' | 'kpi'}
                      config={localConfig}
                      formula={localFormula}
                      dataBinding={localDataBinding}
                      previewData={previewData}
                    />
                  )}
                </div>
              </div>

              {/* Compact Data Source Info */}
              {selectedDataSource && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Source Info</Label>
                  <div className="bg-background rounded-lg p-2 border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">
                        {availableDataSources.find(s => s.id === selectedDataSource.id)?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {availableColumns.length > 0 && (
                        <span>Cols: {availableColumns.length}</span>
                      )}
                      {previewData && (
                        <span>Rows: {previewData.length - 1}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-background flex justify-between items-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDeleteComponent();
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Widget
          </Button>
          <Button onClick={handleApply} size="sm">
            Apply Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
