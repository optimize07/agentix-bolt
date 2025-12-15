import { Plus, Undo, Redo, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Droplet, Grid, Merge, Filter, ArrowUpDown, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";

interface ToolbarProps {
  onNewSheet: () => void;
  onAddRow: () => void;
}

const Toolbar = ({ onNewSheet, onAddRow }: ToolbarProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="flex items-center space-x-2" onClick={onNewSheet}>
              <Plus size={16} className="text-muted-foreground" />
              <span>New Sheet</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2" onClick={onAddRow}>
              <Plus size={16} className="text-muted-foreground" />
              <span>Add Row</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon">
              <Undo size={16} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Redo size={16} className="text-muted-foreground" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon">
              <Bold size={16} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Italic size={16} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Underline size={16} className="text-muted-foreground" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon">
              <AlignLeft size={16} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <AlignCenter size={16} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <AlignRight size={16} className="text-muted-foreground" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon">
              <Droplet size={16} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Grid size={16} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <Merge size={16} className="text-muted-foreground" />
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Filter size={16} className="text-muted-foreground" />
              <span>Filter</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowUpDown size={16} className="text-muted-foreground" />
              <span>Sort</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <BarChart3 size={16} className="text-muted-foreground" />
              <span>Chart</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Toolbar;
