import { BaseEdge, getBezierPath, getStraightPath, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { MindMapEdge } from '../../types';

export const CustomMindMapEdge = (props: EdgeProps<MindMapEdge>) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd,
    markerStart,
  } = props;

  const style = {
    ...props.style,
    stroke: data?.strokeColor || (selected ? 'var(--accent)' : '#a3a3a3'), /* Use a clean muted gray for edges */
    strokeWidth: data?.strokeWidth || (selected ? 3 : 2),
    strokeDasharray: data?.dashed ? '5, 5' : undefined,
    opacity: data?.opacity ?? 1,
    transition: 'stroke var(--transition-fast), stroke-width var(--transition-fast)',
  };

  const pathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  let edgePath = '';
  const edgeStyle = data?.edgeStyle || 'curved';

  if (edgeStyle === 'curved') {
    [edgePath] = getBezierPath(pathParams);
  } else if (edgeStyle === 'straight') {
    [edgePath] = getStraightPath(pathParams);
  } else if (edgeStyle === 'orthogonal') {
    [edgePath] = getSmoothStepPath({
      ...pathParams,
      borderRadius: 12,
    });
  } else {
    [edgePath] = getBezierPath(pathParams);
  }

  // Draw arrow ends if configured
  const markerE = data?.arrowEnd ? 'url(#arrow-end)' : (typeof markerEnd === 'string' ? markerEnd : undefined);
  const markerS = data?.arrowStart ? 'url(#arrow-start)' : (typeof markerStart === 'string' ? markerStart : undefined);

  return (
    <>
      {/* SVG Defs for markers if not global */}
      <defs>
        <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={style.stroke as string} />
        </marker>
        <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 10 0 L 0 5 L 10 10 z" fill={style.stroke as string} />
        </marker>
      </defs>
      <BaseEdge path={edgePath} markerEnd={markerE} markerStart={markerS} style={style} id={id} />
    </>
  );
};
