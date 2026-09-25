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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        maxWidth: '100%',
        maxHeight: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
        overflow: 'hidden'
      }}
    >
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
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          minWidth: 0,
          minHeight: 0,
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
          lineHeight: '1.25',
          textAlign: textAlign,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflowX: 'hidden',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          display: 'block'
        }}
      />
    </div>
  );
};
