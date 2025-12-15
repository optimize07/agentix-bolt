import { Plus, FileSpreadsheet, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Sheet {
  id: string;
  name: string;
  data: any[][];
}

interface DashboardSidebarProps {
  sheets: Sheet[];
  activeSheetId?: string;
  chartCount: number;
  onSelectSheet: (sheetId: string) => void;
  onCreateSheet: () => void;
  onAddChart: () => void;
}

export const DashboardSidebar = ({
  sheets,
  activeSheetId,
  chartCount,
  onSelectSheet,
  onCreateSheet,
  onAddChart,
}: DashboardSidebarProps) => {
  const totalRows = sheets.reduce((sum, sheet) => sum + (sheet.data?.length || 0), 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Dashboard Assets</CardTitle>
        <CardDescription>Manage sheets and visualizations</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">Total Rows</div>
            <div className="text-2xl font-bold">{totalRows}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">Charts</div>
            <div className="text-2xl font-bold">{chartCount}</div>
          </div>
        </div>

        {/* Sheets Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-muted-foreground" />
              <h3 className="font-semibold text-sm">Sheets</h3>
              <Badge variant="secondary">{sheets.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onCreateSheet}>
              <Plus size={14} />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {sheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => onSelectSheet(sheet.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    activeSheetId === sheet.id
                      ? 'bg-primary/10 border-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="font-medium text-sm">{sheet.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {sheet.data?.length || 0} rows
                  </div>
                </button>
              ))}
              
              {sheets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No sheets yet. Create one to get started.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Add Chart Button */}
        <Button onClick={onAddChart} className="w-full gap-2">
          <BarChart3 size={16} />
          Add Chart Component
        </Button>
      </CardContent>
    </Card>
  );
};
