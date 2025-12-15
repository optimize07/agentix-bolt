export interface WidgetFeedback {
  widgetIndex: number;
  type: 'auto-fixed' | 'warning' | 'info';
  message: string;
  originalValue?: any;
  fixedValue?: any;
}

export interface WidgetSuggestion {
  widgetType: string;
  title: string;
  description: string;
  formula?: any;
  dataBinding?: any;
}

export interface AnalysisResult {
  analyzedWidgets: WidgetSuggestion[];
  feedback: Map<number, WidgetFeedback[]>;
}

/**
 * Analyzes a single widget suggestion and returns feedback items
 */
export function analyzeWidgetSuggestion(
  suggestion: WidgetSuggestion,
  index: number
): WidgetFeedback[] {
  const feedback: WidgetFeedback[] = [];
  
  // Check 1: Sheet/table widgets should not have formulas
  if ((suggestion.widgetType === 'sheet' || suggestion.widgetType === 'table') && suggestion.formula) {
    feedback.push({
      widgetIndex: index,
      type: 'auto-fixed',
      message: 'Formula removed - sheet widgets display raw data only',
      originalValue: JSON.stringify(suggestion.formula),
    });
    // Auto-strip the formula
    suggestion.formula = undefined;
  }
  
  // Check 2: Formulas with filters (potential hallucination risk)
  if (suggestion.formula?.filters && suggestion.formula.filters.length > 0) {
    const filterValues = suggestion.formula.filters
      .map((f: any) => `${f.column} ${f.operator} "${f.value}"`)
      .join(', ');
    feedback.push({
      widgetIndex: index,
      type: 'warning',
      message: `Contains filters: ${filterValues}. Please verify these match your actual data.`,
    });
  }
  
  // Check 3: Chart widgets should have proper column bindings
  const chartTypes = ['barChart', 'lineChart', 'pieChart'];
  if (chartTypes.includes(suggestion.widgetType)) {
    const hasXColumn = suggestion.dataBinding?.columns?.x;
    const hasYColumn = suggestion.dataBinding?.columns?.y;
    
    if (!hasXColumn && !hasYColumn) {
      feedback.push({
        widgetIndex: index,
        type: 'warning',
        message: 'Missing axis bindings (x/y columns). Chart may not display correctly.',
      });
    } else if (!hasXColumn) {
      feedback.push({
        widgetIndex: index,
        type: 'warning',
        message: 'Missing X-axis column binding.',
      });
    } else if (!hasYColumn) {
      feedback.push({
        widgetIndex: index,
        type: 'warning',
        message: 'Missing Y-axis column binding.',
      });
    }
  }
  
  // Check 4: StatsCard with formula (this is expected, just informational)
  if (suggestion.widgetType === 'statsCard' && suggestion.formula) {
    feedback.push({
      widgetIndex: index,
      type: 'info',
      message: `Using ${suggestion.formula.operation} formula on ${suggestion.formula.sourceColumn || 'data'}.`,
    });
  }
  
  return feedback;
}

/**
 * Analyzes multiple widget suggestions and returns analyzed widgets + feedback
 */
export function analyzeWidgetSuggestions(
  suggestions: WidgetSuggestion[]
): AnalysisResult {
  const feedbackMap = new Map<number, WidgetFeedback[]>();
  
  // Analyze each widget
  suggestions.forEach((suggestion, index) => {
    const widgetFeedback = analyzeWidgetSuggestion(suggestion, index);
    if (widgetFeedback.length > 0) {
      feedbackMap.set(index, widgetFeedback);
    }
  });
  
  return {
    analyzedWidgets: suggestions,
    feedback: feedbackMap,
  };
}

/**
 * Get a summary badge text for a widget based on its feedback
 */
export function getWidgetBadge(feedback: WidgetFeedback[]): {
  text: string;
  variant: 'default' | 'destructive' | 'secondary' | 'outline';
  icon: string;
} {
  if (feedback.length === 0) {
    return { text: 'OK', variant: 'outline', icon: '✅' };
  }
  
  const hasAutoFix = feedback.some(f => f.type === 'auto-fixed');
  const hasWarning = feedback.some(f => f.type === 'warning');
  
  if (hasAutoFix) {
    return { text: 'Auto-fixed', variant: 'secondary', icon: '🔧' };
  }
  if (hasWarning) {
    return { text: 'Review', variant: 'destructive', icon: '⚠️' };
  }
  
  return { text: 'Info', variant: 'default', icon: 'ℹ️' };
}
