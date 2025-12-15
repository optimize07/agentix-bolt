import { Database, Check, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Sheet {
  id: string;
  name: string;
  data: any[][];
}

interface DataSourcePanelProps {
  sheets: Sheet[];
  selectedSheets: string[];
  onToggleSheet: (sheetId: string) => void;
  onCreateSheet?: () => void;
}

const DataSourcePanel = ({ sheets, selectedSheets, onToggleSheet, onCreateSheet }: DataSourcePanelProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database size={16} />
            Data Sources
          </CardTitle>
          {onCreateSheet && (
            <Button variant="ghost" size="sm" onClick={onCreateSheet}>
              <Plus size={14} className="mr-1" />
              New
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          Select sheets to use in this dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {sheets.map((sheet) => (
              <div
                key={sheet.id}
                className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onToggleSheet(sheet.id)}
              >
                <Checkbox
                  checked={selectedSheets.includes(sheet.id)}
                  onCheckedChange={() => onToggleSheet(sheet.id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{sheet.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {sheet.data.length} rows
                  </div>
                </div>
                {selectedSheets.includes(sheet.id) && (
                  <Check size={16} className="text-primary" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DataSourcePanel;
