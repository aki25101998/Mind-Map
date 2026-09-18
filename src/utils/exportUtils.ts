import type { MindMapDocument } from '../types';
import { toPng, toSvg } from 'html-to-image';

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
