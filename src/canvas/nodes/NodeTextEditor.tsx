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

  // Auto-focus and place cursor (or select default text if New Topic / Main Idea)
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      if (textareaRef.current.value === 'New Topic' || textareaRef.current.value === 'Main Idea') {
        textareaRef.current.setSelectionRange(0, length);
      } else {
        textareaRef.current.setSelectionRange(length, length);
      }
    }
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-grid',
        alignItems: 'center',
        justifyItems: textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'center',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Invisible ghost mirror dictates the exact width and height based on text content */}
      <span
        aria-hidden="true"
        style={{
          visibility: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          fontSize: fontSize ? `${fontSize}px` : 'inherit',
          fontWeight: fontWeight || 'inherit',
          fontFamily: 'inherit',
          lineHeight: '1.5',
          textAlign: textAlign,
          minHeight: `${(fontSize || 14) * 1.5}px`,
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
        cols={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
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
          lineHeight: '1.5',
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
