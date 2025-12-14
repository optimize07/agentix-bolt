import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseNodeProps {
  children: React.ReactNode;
  selected?: boolean;
  onDelete?: () => void;
  color?: string;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  resizable?: boolean;
  className?: string;
  headerContent?: React.ReactNode;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  children,
  selected,
  onDelete,
  color,
  showSourceHandle = true,
  showTargetHandle = true,
  resizable = true,
  className,
  headerContent,
}) => {
  return (
    <>
      {resizable && (
        <NodeResizer
          minWidth={200}
          minHeight={100}
          isVisible={selected}
          lineClassName="border-primary"
          handleClassName="h-3 w-3 bg-primary rounded-sm border-2 border-background"
        />
      )}
      
      <div
        className={cn(
          'rounded-lg border bg-card shadow-lg transition-shadow',
          selected && 'ring-2 ring-primary shadow-xl',
          className
        )}
        style={{ borderColor: color || 'hsl(var(--border))' }}
      >
        {/* Header with drag handle and actions */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50 bg-muted/30 rounded-t-lg">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
            {headerContent}
          </div>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-destructive/20 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {children}
        </div>
      </div>

      {/* Connection handles */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}
    </>
  );
};

export default BaseNode;
