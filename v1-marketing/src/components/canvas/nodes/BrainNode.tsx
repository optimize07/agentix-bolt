import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Brain, Image, FileText, Layers, Wrench, BookOpen, Target, UserCircle, Sparkles, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const BrainNode = memo(({ data }: NodeProps) => {
  const { title = "Brain Node", contentType, itemCount = 0 } = data;

  const getIcon = () => {
    switch (contentType) {
      case "asset_group":
        return <Image className="w-4 h-4" />;
      case "swipe_group":
        return <FileText className="w-4 h-4" />;
      case "ad_spy_board":
        return <Layers className="w-4 h-4" />;
      case "tools":
        return <Wrench className="w-4 h-4" />;
      case "knowledge":
        return <BookOpen className="w-4 h-4" />;
      case "strategy":
        return <Target className="w-4 h-4" />;
      case "role":
        return <UserCircle className="w-4 h-4" />;
      case "prompt":
        return <Sparkles className="w-4 h-4" />;
      case "research":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getContentLabel = () => {
    switch (contentType) {
      case "asset_group":
        return "Asset Group";
      case "swipe_group":
        return "Swipe Group";
      case "ad_spy_board":
        return "Ad Board";
      case "tools":
        return "Tools";
      case "knowledge":
        return "Knowledge";
      case "strategy":
        return "Strategy";
      case "role":
        return "AI Role";
      case "prompt":
        return "Prompts";
      case "research":
        return "Research";
      default:
        return "Select Content";
    }
  };

  return (
    <Card className="min-w-[250px] bg-card border-2 border-primary/50 shadow-lg">
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          width: '24px',
          height: '24px',
          top: '-12px',
          zIndex: 50,
        }}
        className="!bg-primary !border-2 !border-background hover:scale-125 transition-transform cursor-grab"
      />
      
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">Global Central Brain content</p>
          </div>
        </div>

        {contentType && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            {getIcon()}
            <div className="flex-1">
              <p className="text-xs font-medium">{getContentLabel()}</p>
              <p className="text-xs text-muted-foreground">{itemCount} items</p>
            </div>
          </div>
        )}

        {!contentType && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">No content selected</p>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          width: '24px',
          height: '24px',
          bottom: '-12px',
          zIndex: 50,
        }}
        className="!bg-primary !border-2 !border-background hover:scale-125 transition-transform cursor-grab"
      />
    </Card>
  );
});

BrainNode.displayName = "BrainNode";
