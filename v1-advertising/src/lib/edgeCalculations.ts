// Edge calculation utilities for canvas connections

export interface Point {
  x: number;
  y: number;
}

export interface EdgePath {
  path: string;
  sourceHandle: Point;
  targetHandle: Point;
}

export type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Calculate the handle position coordinates for a block
 */
export function getHandlePosition(
  blockX: number,
  blockY: number,
  blockWidth: number,
  blockHeight: number,
  position: HandlePosition
): Point {
  switch (position) {
    case 'top':
      return { x: blockX + blockWidth / 2, y: blockY };
    case 'right':
      return { x: blockX + blockWidth, y: blockY + blockHeight / 2 };
    case 'bottom':
      return { x: blockX + blockWidth / 2, y: blockY + blockHeight };
    case 'left':
      return { x: blockX, y: blockY + blockHeight / 2 };
  }
}

/**
 * Find the closest handle position between two blocks
 * For right-to-left flow: content blocks → chat blocks
 */
export function findOptimalHandles(
  sourceX: number,
  sourceY: number,
  sourceWidth: number,
  sourceHeight: number,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number
): { source: HandlePosition; target: HandlePosition } {
  // Enforce right-to-left flow
  return { source: 'right', target: 'left' };
}

/**
 * Calculate bezier curve path for edge
 */
export function calculateBezierPath(
  sourceX: number,
  sourceY: number,
  sourceHandle: HandlePosition,
  targetX: number,
  targetY: number,
  targetHandle: HandlePosition
): string {
  const curvature = 0.2;
  const dx = Math.abs(targetX - sourceX);
  const dy = Math.abs(targetY - sourceY);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const controlDistance = distance * curvature;

  // Calculate control points based on handle positions
  let cp1x = sourceX;
  let cp1y = sourceY;
  let cp2x = targetX;
  let cp2y = targetY;

  switch (sourceHandle) {
    case 'right':
      cp1x = sourceX + controlDistance;
      cp1y = sourceY;
      break;
    case 'left':
      cp1x = sourceX - controlDistance;
      cp1y = sourceY;
      break;
    case 'bottom':
      cp1x = sourceX;
      cp1y = sourceY + controlDistance;
      break;
    case 'top':
      cp1x = sourceX;
      cp1y = sourceY - controlDistance;
      break;
  }

  switch (targetHandle) {
    case 'right':
      cp2x = targetX + controlDistance;
      cp2y = targetY;
      break;
    case 'left':
      cp2x = targetX - controlDistance;
      cp2y = targetY;
      break;
    case 'bottom':
      cp2x = targetX;
      cp2y = targetY + controlDistance;
      break;
    case 'top':
      cp2x = targetX;
      cp2y = targetY - controlDistance;
      break;
  }

  return `M ${sourceX},${sourceY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`;
}

/**
 * Calculate straight line path
 */
export function calculateStraightPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
}

/**
 * Calculate step path (with right angles)
 */
export function calculateStepPath(
  sourceX: number,
  sourceY: number,
  sourceHandle: HandlePosition,
  targetX: number,
  targetY: number,
  targetHandle: HandlePosition
): string {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  if (sourceHandle === 'right' || sourceHandle === 'left') {
    return `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`;
  } else {
    return `M ${sourceX},${sourceY} L ${sourceX},${midY} L ${targetX},${midY} L ${targetX},${targetY}`;
  }
}
