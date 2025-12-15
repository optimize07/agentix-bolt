import { Edge } from "./Edge";
import {
  calculateBezierPath,
  calculateStraightPath,
  calculateStepPath,
  getHandlePosition,
  findOptimalHandles,
  HandlePosition,
} from "@/lib/edgeCalculations";

interface Block {
  id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

interface EdgeData {
  id: string;
  source_block_id: string;
  target_block_id: string;
  edge_type: 'bezier' | 'straight' | 'step';
  color?: string;
  metadata?: any;
}

interface EdgeRendererProps {
  edges: EdgeData[];
  blocks: Block[];
  selectedEdgeId: string | null;
  hoveredEdgeId: string | null;
  onEdgeClick: (edgeId: string) => void;
  onEdgeHover: (edgeId: string | null) => void;
  tempEdge?: {
    sourceBlockId: string;
    sourceHandle: HandlePosition;
    targetX: number;
    targetY: number;
  } | null;
}

export function EdgeRenderer({
  edges,
  blocks,
  selectedEdgeId,
  hoveredEdgeId,
  onEdgeClick,
  onEdgeHover,
  tempEdge,
}: EdgeRendererProps) {
  const getBlockById = (id: string) => blocks.find(b => b.id === id);

  const renderEdge = (edgeData: EdgeData) => {
    const sourceBlock = getBlockById(edgeData.source_block_id);
    const targetBlock = getBlockById(edgeData.target_block_id);

    if (!sourceBlock || !targetBlock) return null;

    // Find optimal handles
    const { source: sourceHandle, target: targetHandle } = findOptimalHandles(
      sourceBlock.position_x,
      sourceBlock.position_y,
      sourceBlock.width,
      sourceBlock.height,
      targetBlock.position_x,
      targetBlock.position_y,
      targetBlock.width,
      targetBlock.height
    );

    // Get handle positions
    const sourcePos = getHandlePosition(
      sourceBlock.position_x,
      sourceBlock.position_y,
      sourceBlock.width,
      sourceBlock.height,
      sourceHandle
    );

    const targetPos = getHandlePosition(
      targetBlock.position_x,
      targetBlock.position_y,
      targetBlock.width,
      targetBlock.height,
      targetHandle
    );

    // Calculate path based on edge type
    let path: string;
    switch (edgeData.edge_type) {
      case 'straight':
        path = calculateStraightPath(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);
        break;
      case 'step':
        path = calculateStepPath(
          sourcePos.x,
          sourcePos.y,
          sourceHandle,
          targetPos.x,
          targetPos.y,
          targetHandle
        );
        break;
      case 'bezier':
      default:
        path = calculateBezierPath(
          sourcePos.x,
          sourcePos.y,
          sourceHandle,
          targetPos.x,
          targetPos.y,
          targetHandle
        );
    }

    return (
      <Edge
        key={edgeData.id}
        id={edgeData.id}
        path={path}
        color={edgeData.color}
        isSelected={selectedEdgeId === edgeData.id}
        isHovered={hoveredEdgeId === edgeData.id}
        onClick={onEdgeClick}
        onMouseEnter={() => onEdgeHover(edgeData.id)}
        onMouseLeave={() => onEdgeHover(null)}
      />
    );
  };

  const renderTempEdge = () => {
    if (!tempEdge) return null;

    const sourceBlock = getBlockById(tempEdge.sourceBlockId);
    if (!sourceBlock) return null;

    const sourcePos = getHandlePosition(
      sourceBlock.position_x,
      sourceBlock.position_y,
      sourceBlock.width,
      sourceBlock.height,
      tempEdge.sourceHandle
    );

    const path = calculateBezierPath(
      sourcePos.x,
      sourcePos.y,
      tempEdge.sourceHandle,
      tempEdge.targetX,
      tempEdge.targetY,
      'top' // dummy target handle for temp edge
    );

    return (
      <path
        d={path}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
        opacity="0.6"
        className="pointer-events-none"
      />
    );
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill="hsl(var(--primary))"
          />
        </marker>
      </defs>

      {/* Render all edges */}
      <g style={{ pointerEvents: 'auto' }}>
        {edges.map(renderEdge)}
      </g>

      {/* Render temporary edge during connection */}
      {renderTempEdge()}
    </svg>
  );
}
