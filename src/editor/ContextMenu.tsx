import { useEffect, useRef } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useReactFlow } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

export const ContextMenu = () => {
  const { 
    contextMenu, 
    setContextMenu, 
    createChildNode, 
    createSiblingNode, 
    duplicateSelected, 
    copySelected, 
    pasteFromClipboard, 
    deleteSelected,
    addNode,
    nodes,
    setSelectedNodes
  } = useMindMapStore();
  
  const { screenToFlowPosition, fitView } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    
    // Slight delay so the click that opened the menu doesn't close it
    setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const handleAction = (action: () => void) => {
    action();
    setContextMenu(null);
  };

  const handleNewNode = () => {
    const position = screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y });
    handleAction(() => {
      addNode({
        id: uuidv4(),
        type: 'basic',
        position,
        data: { label: 'New Node' },
      });
    });
  };

  const handlePaste = () => {
    handleAction(pasteFromClipboard);
  };
  
  const handleSelectAll = () => {
    handleAction(() => setSelectedNodes(nodes.map(n => n.id)));
  };
  
  const handleFitView = () => {
    handleAction(() => fitView({ padding: 0.2, duration: 800 }));
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        zIndex: 'var(--z-modal)',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        borderRadius: '8px',
        padding: '4px',
        boxShadow: 'var(--shadow)',
        minWidth: '150px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '14px',
      }}
    >
      {contextMenu.target === 'canvas' ? (
        <>
          <button className="menu-item" onClick={handleNewNode}>New node</button>
          <button className="menu-item" onClick={handlePaste}>Paste</button>
          <hr style={{ margin: '4px 0', borderColor: 'var(--panel-border)' }} />
          <button className="menu-item" onClick={handleSelectAll}>Select all</button>
          <button className="menu-item" onClick={handleFitView}>Fit view</button>
        </>
      ) : (
        <>
          <button className="menu-item" onClick={() => handleAction(() => createChildNode(contextMenu.id!))}>Add child</button>
          <button className="menu-item" onClick={() => handleAction(() => createSiblingNode(contextMenu.id!))}>Add sibling</button>
          <hr style={{ margin: '4px 0', borderColor: 'var(--panel-border)' }} />
          <button className="menu-item" onClick={() => { setSelectedNodes([contextMenu.id!]); handleAction(duplicateSelected); }}>Duplicate</button>
          <button className="menu-item" onClick={() => { setSelectedNodes([contextMenu.id!]); handleAction(copySelected); }}>Copy</button>
          <button className="menu-item" onClick={() => handleAction(deleteSelected)} style={{ color: 'var(--node-color-red)' }}>Delete</button>
        </>
      )}
      
      <style>{`
        .menu-item {
          background: transparent;
          border: none;
          text-align: left;
          padding: 6px 12px;
          cursor: pointer;
          color: var(--text-primary);
          border-radius: 4px;
        }
        .menu-item:hover {
          background: var(--node-border-default);
        }
      `}</style>
    </div>
  );
};
