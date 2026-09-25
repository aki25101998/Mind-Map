import { useEffect, useRef } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { useReactFlow } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import { useAutoLayout } from '../hooks/useAutoLayout';

export const ContextMenu = () => {
  const { 
    contextMenu, 
    setContextMenu, 
    createChildNode, 
    createSiblingNode, 
    duplicateSelected, 
    copySelected, 
    pasteFromClipboard, 
    deleteNodeById,
    addNode,
    nodes,
    setSelectedNodes,
    setEditingNodeId,
    updateNodeData
  } = useMindMapStore();
  
  const { screenToFlowPosition, fitView, setCenter, setViewport } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);
  const handleAutoLayout = useAutoLayout();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    
    const timeoutId = window.setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const handleAction = (action: () => void) => {
    action();
    setContextMenu(null);
  };

  const handleNewNode = () => {
    const position = screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y });
    const newId = uuidv4();
    handleAction(() => {
      addNode({
        id: newId,
        type: 'basic',
        position,
        data: { label: 'New Topic' },
        selected: true
      });
      setSelectedNodes([newId]);
      setEditingNodeId(newId);
    });
  };

  const handlePaste = () => {
    handleAction(pasteFromClipboard);
  };
  
  const handleSelectAll = () => {
    handleAction(() => setSelectedNodes(nodes.map(n => n.id)));
  };
  
  const handleFitView = () => {
    handleAction(() => fitView({ padding: 0.2, duration: 600 }));
  };

  const handleResetView = () => {
    handleAction(() => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 600 }));
  };

  const targetNode = contextMenu.target === 'node' && contextMenu.id 
    ? nodes.find(n => n.id === contextMenu.id) 
    : null;
  const isRoot = targetNode?.type === 'main';

  const handleFocusNode = () => {
    if (targetNode) {
      handleAction(() => {
        setSelectedNodes([targetNode.id]);
        setCenter(targetNode.position.x + 100, targetNode.position.y + 30, { duration: 600 });
      });
    }
  };

  const handleToggleLock = () => {
    if (targetNode) {
      handleAction(() => {
        updateNodeData(targetNode.id, { locked: !targetNode.data?.locked });
      });
    }
  };

  const handleOpenUrl = () => {
    if (targetNode?.data?.url) {
      let url = String(targetNode.data.url).trim();
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      window.open(url, '_blank');
      setContextMenu(null);
    }
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
        minWidth: '160px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '13px',
      }}
    >
      {contextMenu.target === 'canvas' ? (
        <>
          <button className="menu-item" onClick={handleNewNode}>New topic</button>
          <button className="menu-item" onClick={handlePaste}>Paste</button>
          <hr style={{ margin: '4px 0', borderColor: 'var(--panel-border)' }} />
          <button className="menu-item" onClick={() => handleAction(handleAutoLayout)}>Auto layout</button>
          <button className="menu-item" onClick={handleSelectAll}>Select all</button>
          <button className="menu-item" onClick={handleFitView}>Fit view</button>
          <button className="menu-item" onClick={handleResetView}>Reset view (1:1)</button>
        </>
      ) : (
        <>
          <button className="menu-item" onClick={() => handleAction(() => createChildNode(contextMenu.id!))}>Add child</button>
          {!isRoot && (
            <button className="menu-item" onClick={() => handleAction(() => createSiblingNode(contextMenu.id!))}>Add sibling</button>
          )}
          <hr style={{ margin: '4px 0', borderColor: 'var(--panel-border)' }} />
          <button className="menu-item" onClick={handleFocusNode}>Focus node (F)</button>
          <button className="menu-item" onClick={handleToggleLock}>
            {targetNode?.data?.locked ? 'Unlock node' : 'Lock position'}
          </button>
          {targetNode?.data?.url && (
            <button className="menu-item" onClick={handleOpenUrl} style={{ color: 'var(--accent-secondary)' }}>
              Open link ↗
            </button>
          )}
          <hr style={{ margin: '4px 0', borderColor: 'var(--panel-border)' }} />
          <button className="menu-item" onClick={() => { setSelectedNodes([contextMenu.id!]); handleAction(duplicateSelected); }}>Duplicate</button>
          <button className="menu-item" onClick={() => { setSelectedNodes([contextMenu.id!]); handleAction(copySelected); }}>Copy</button>
          {!isRoot && (
            <button className="menu-item" onClick={() => handleAction(() => deleteNodeById(contextMenu.id!))} style={{ color: 'var(--node-color-red)' }}>
              Delete
            </button>
          )}
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
          display: flex;
          align-items: center;
          justifyContent: space-between;
        }
        .menu-item:hover {
          background: var(--node-border-default);
        }
      `}</style>
    </div>
  );
};
