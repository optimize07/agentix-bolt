import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SheetConfig } from "@/types/dataBinding";

interface SheetMaximizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[][];
  config?: SheetConfig;
}

export const SheetMaximizeDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  data,
  config 
}: SheetMaximizeDialogProps) => {
  if (!data || data.length === 0) return null;

  const headers = data[0] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden backdrop-blur-xl bg-background/95 border-2">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-scroll max-h-[calc(95vh-120px)] sheet-scroll-container [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-border/80">
          <table className="w-full border-collapse">
            <tbody>
              {data.map((row, rowIndex) => {
                const isHeader = rowIndex === 0;
                return (
                  <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                    {row.map((cell, colIndex) => {
                      const headerName = headers[colIndex];
                      const displayName = config?.columnNames?.[headerName] || headerName;
                      const columnWidth = config?.columnWidths?.[headerName];

                      return (
                        <td
                          key={colIndex}
                          style={columnWidth ? { width: `${columnWidth}px`, minWidth: `${columnWidth}px` } : undefined}
                          className={`border border-border p-3 text-sm ${
                            isHeader 
                              ? "font-semibold text-muted-foreground bg-background" 
                              : "text-foreground"
                          }`}
                        >
                          {isHeader ? displayName : (
                            typeof cell === "number" && colIndex > 0
                              ? `$${cell.toFixed(2)}`
                              : cell
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
