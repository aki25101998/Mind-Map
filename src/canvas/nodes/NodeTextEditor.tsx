import React, { useRef, useLayoutEffect } from 'react';

export interface NodeTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  fontSize?: number;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  placeholder?: string;
}

export const NodeTextEditor: React.FC<NodeTextEditorProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  fontSize,
  fontWeight,
  textAlign = 'center',
  color = 'inherit',
  placeholder = 'Type text...'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus and place cursor at the end on mount
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, []);

  // Auto-resize textarea height based on content
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, (fontSize || 14) * 1.3)}px`;
    }
  }, [value, fontSize]);

  return (
    <div
      style={{
        display: 'inline-grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        alignItems: 'center',
        justifyItems: textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'center',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {/* Invisible ghost mirror guarantees the editor matches the rendered text size exactly */}
      <span
        aria-hidden="true"
        style={{
          gridArea: '1 / 1',
          visibility: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          fontSize: fontSize ? `${fontSize}px` : 'inherit',
          fontWeight: fontWeight || 'inherit',
          fontFamily: 'inherit',
          lineHeight: '1.3',
          textAlign: textAlign,
          minHeight: `${(fontSize || 14) * 1.3}px`,
          padding: 0,
          margin: 0,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        {(value || placeholder || ' ') + '\u200B'}
      </span>
      <textarea
        ref={textareaRef}
        className="nodrag nopan"
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={{
          gridArea: '1 / 1',
          width: '100%',
          minWidth: 0,
          height: '100%',
          minHeight: `${(fontSize || 14) * 1.3}px`,
          boxSizing: 'border-box',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: 0,
          margin: 0,
          resize: 'none',
          color: color,
          fontSize: fontSize ? `${fontSize}px` : 'inherit',
          fontWeight: fontWeight || 'inherit',
          fontFamily: 'inherit',
          lineHeight: '1.3',
          textAlign: textAlign,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          display: 'block'
        }}
      />
    </div>
  );
};
