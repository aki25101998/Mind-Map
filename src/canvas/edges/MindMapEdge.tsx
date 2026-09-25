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

  const strokeColor = selected ? 'var(--accent)' : (data?.strokeColor || '#a3a3a3');
  const strokeWidth = selected ? (data?.strokeWidth ? data.strokeWidth + 1.5 : 3.5) : (data?.strokeWidth || 2);

  const style = {
    ...props.style,
    stroke: strokeColor,
    strokeWidth,
    strokeDasharray: data?.dashed ? '5, 5' : undefined,
    opacity: data?.opacity ?? 1,
    filter: selected ? 'drop-shadow(0 0 4px var(--accent))' : undefined,
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
  const markerEId = `arrow-end-${id}`;
  const markerSId = `arrow-start-${id}`;
  const markerE = data?.arrowEnd ? `url(#${markerEId})` : (typeof markerEnd === 'string' ? markerEnd : undefined);
  const markerS = data?.arrowStart ? `url(#${markerSId})` : (typeof markerStart === 'string' ? markerStart : undefined);

  return (
    <>
      {/* SVG Defs for markers unique per edge */}
      <defs>
        <marker id={markerEId} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
        </marker>
        <marker id={markerSId} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 10 0 L 0 5 L 10 10 z" fill={strokeColor} />
        </marker>
      </defs>
      <BaseEdge path={edgePath} markerEnd={markerE} markerStart={markerS} style={style} id={id} />
    </>
  );
};
