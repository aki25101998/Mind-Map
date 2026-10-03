import type { MindMapDocument } from '../types';
import { toPng, toSvg } from 'html-to-image';

export const generateMarkdownOutline = (doc: MindMapDocument): string => {
  if (!doc.nodes || doc.nodes.length === 0) {
    return `# ${doc.title || 'Untitled Mind Map'}\n\n*(Empty mind map)*\n`;
  }

  const structuralEdges = (doc.edges || []).filter(e => e.data?.relationship !== true);
  const childMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  structuralEdges.forEach(e => {
    if (!childMap.has(e.source)) childMap.set(e.source, []);
    childMap.get(e.source)!.push(e.target);
    parentMap.set(e.target, e.source);
  });

  const nodeMap = new Map<string, typeof doc.nodes[0]>();
  doc.nodes.forEach(n => nodeMap.set(n.id, n));

  const explicitRoot = doc.nodes.find(n => n.type === 'main');
  const roots: typeof doc.nodes = [];
  if (explicitRoot) {
    roots.push(explicitRoot);
  } else {
    doc.nodes.forEach(n => {
      if (!parentMap.has(n.id)) {
        roots.push(n);
      }
    });
    if (roots.length === 0) roots.push(doc.nodes[0]);
  }

  const visited = new Set<string>();
  const lines: string[] = [];

  const formatNode = (node: typeof doc.nodes[0], depth: number) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    const label = node.data?.label || 'Untitled';
    const url = node.data?.url;
    const tags = node.data?.tags;
    const note = node.data?.note;

    let text = url ? `[${label}](${url})` : label;
    if (tags && tags.length > 0) {
      text += ` ${tags.map(t => `#${t}`).join(' ')}`;
    }

    if (depth === 0) {
      lines.push(`# ${text}\n`);
    } else if (depth === 1) {
      lines.push(`\n## ${text}`);
    } else {
      const indent = '  '.repeat(depth - 1);
      lines.push(`${indent}- ${text}`);
    }

    if (note) {
      const quoteIndent = depth <= 1 ? '' : '  '.repeat(depth - 1) + '  ';
      const noteLines = note.split('\n');
      noteLines.forEach(l => {
        lines.push(`${quoteIndent}> ${l}`);
      });
    }

    const childrenIds = childMap.get(node.id) || [];
    childrenIds.forEach(cId => {
      const child = nodeMap.get(cId);
      if (child) {
        formatNode(child, depth + 1);
      }
    });
  };

  roots.forEach(r => formatNode(r, 0));

  const remaining = doc.nodes.filter(n => !visited.has(n.id));
  if (remaining.length > 0) {
    lines.push(`\n## Additional Topics\n`);
    remaining.forEach(r => formatNode(r, 2));
  }

  return lines.join('\n').trim() + '\n';
};

export const exportToMarkdown = (doc: MindMapDocument) => {
  const content = generateMarkdownOutline(doc);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `${doc.title.replace(/\s+/g, '_')}.md`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const exportToJSON = (doc: MindMapDocument) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${doc.title.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const downloadImage = (dataUrl: string, filename: string) => {
  const a = document.createElement('a');
  a.setAttribute('download', filename);
  a.setAttribute('href', dataUrl);
  a.click();
};

export const exportToPNG = async (
  title: string, 
  width: number, 
  height: number, 
  transform: { x: number, y: number, zoom: number },
  bgColor: string = '#ffffff'
) => {
  const element = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!element) return;
  
  await new Promise(resolve => setTimeout(resolve, 200));

  const dataUrl = await toPng(element, {
    backgroundColor: bgColor,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
    },
    filter: (node) => {
      const excludeClasses = ['react-flow__minimap', 'react-flow__controls', 'react-flow__panel', 'node-toolbar'];
      if (node.classList) {
        for (const cls of excludeClasses) {
          if (node.classList.contains(cls)) return false;
        }
      }
      return true;
    }
  });
  
  downloadImage(dataUrl, `${title.replace(/\s+/g, '_')}.png`);
};

export const exportToSVG = async (
  title: string, 
  width: number, 
  height: number, 
  transform: { x: number, y: number, zoom: number },
  bgColor: string = '#ffffff'
) => {
  const element = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!element) return;
  
  await new Promise(resolve => setTimeout(resolve, 200));

  const dataUrl = await toSvg(element, {
    backgroundColor: bgColor,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
    },
    filter: (node) => {
      // Ignore some UI elements
      const excludeClasses = ['react-flow__minimap', 'react-flow__controls', 'react-flow__panel', 'node-toolbar'];
      if (node.classList) {
        for (const cls of excludeClasses) {
          if (node.classList.contains(cls)) return false;
        }
      }
      return true;
    }
  });
  
  downloadImage(dataUrl, `${title.replace(/\s+/g, '_')}.svg`);
};
