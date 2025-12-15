import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useFormulaCalculation, formatFormulaValue, Formula } from "@/hooks/useFormulaCalculation";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  comparison: string;
  icon: LucideIcon;
  trend: "up" | "down";
  formula?: Formula;
  sheetData?: any[][];
}

const StatsCard = ({ title, value, change, comparison, icon: Icon, trend, formula, sheetData, component }: StatsCardProps & { component?: any }) => {
  const { getLabel } = useOrganization();
  
  // Calculate value from formula if provided
  const calculatedValue = useFormulaCalculation(formula, sheetData);
  const displayValue = calculatedValue !== null 
    ? formatFormulaValue(calculatedValue, formula?.operation || 'COUNT', component?.config?.formatting)
    : value;
  
  // Only translate if it's a business term key (contains a dot like 'metric.gci' or 'entity.lead')
  const isTermKey = (str: string) => str.includes('.') && (
    str.startsWith('metric.') || 
    str.startsWith('entity.') || 
    str.startsWith('activity.') || 
    str.startsWith('stage.')
  );
  
  const displayTitle = isTermKey(title) ? (getLabel(title) || title) : title;
  
  return (
    <Card className="hover:border-primary/50 transition-all duration-200 hover:scale-[1.02] h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-110">
            <Icon className="text-primary" size={24} />
          </div>
          <span className={`text-sm flex items-center ${trend === 'up' ? 'text-secondary' : 'text-muted-foreground'}`}>
            {trend === 'up' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
            {change}
          </span>
        </div>
        <h3 className="text-muted-foreground text-sm mb-2">{displayTitle}</h3>
        <p className="text-3xl font-bold text-foreground">{displayValue}</p>
        <p className="text-muted-foreground text-xs mt-2">{comparison}</p>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
