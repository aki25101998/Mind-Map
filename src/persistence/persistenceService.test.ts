import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MindMapDocument } from '../types';

vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'user-123' }
  }
}));

const mockSaveCloudDocument = vi.fn();
const mockGetCloudDocument = vi.fn();
const mockGetCloudDocuments = vi.fn();
const mockDeleteCloudDocument = vi.fn();

vi.mock('./firestore', () => ({
  saveCloudDocument: (...args: any[]) => mockSaveCloudDocument(...args),
  getCloudDocument: (...args: any[]) => mockGetCloudDocument(...args),
  getCloudDocuments: (...args: any[]) => mockGetCloudDocuments(...args),
  deleteCloudDocument: (...args: any[]) => mockDeleteCloudDocument(...args)
}));

const mockSaveLocalDocument = vi.fn();
const mockGetLocalDocument = vi.fn();
const mockGetAllLocalDocuments = vi.fn();
const mockDeleteLocalDocument = vi.fn();

vi.mock('./idb', () => ({
  saveDocument: (...args: any[]) => mockSaveLocalDocument(...args),
  getDocument: (...args: any[]) => mockGetLocalDocument(...args),
  getAllDocuments: (...args: any[]) => mockGetAllLocalDocuments(...args),
  deleteDocument: (...args: any[]) => mockDeleteLocalDocument(...args)
}));

import { loadDocument, syncDocument, loadAllDocuments } from './persistenceService';

describe('persistenceService conflict resolution & sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncDocument sanitizes document before saving to IDB and Cloud', async () => {
    const rawDoc: MindMapDocument = {
      id: 'doc-1',
      title: 'Test Doc',
      nodes: [
        {
          id: 'n1',
          type: 'basic',
          position: { x: 0, y: 0 },
          selected: true,
          data: { label: 'Node 1', url: undefined }
        } as any
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 2000,
      shareId: undefined
    };

    mockSaveLocalDocument.mockResolvedValue(undefined);
    mockSaveCloudDocument.mockResolvedValue(undefined);

    const res = await syncDocument(rawDoc);
    expect(res.success).toBe(true);
    expect(res.localSaved).toBe(true);
    expect(res.cloudSaved).toBe(true);

    // Verify sanitization
    const localCallArg = mockSaveLocalDocument.mock.calls[0][0];
    expect(localCallArg.nodes[0].selected).toBeUndefined();
    expect('url' in localCallArg.nodes[0].data).toBe(false);
    expect('shareId' in localCallArg).toBe(false);

    const cloudCallArg = mockSaveCloudDocument.mock.calls[0][0];
    expect(cloudCallArg.nodes[0].selected).toBeUndefined();
    expect('url' in cloudCallArg.nodes[0].data).toBe(false);
    expect('shareId' in cloudCallArg).toBe(false);
  });

  it('loadDocument selects local doc when local is newer than cloud doc', async () => {
    const cloudDoc: MindMapDocument = {
      id: 'doc-1',
      title: 'Cloud Stale Doc',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 2000 // Stale
    };

    const localDoc: any = {
      id: 'doc-1',
      uid: 'user-123',
      title: 'Local Fresh Doc',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 3000 // Newer!
    };

    mockGetCloudDocument.mockResolvedValue(cloudDoc);
    mockGetLocalDocument.mockResolvedValue(localDoc);
    mockSaveCloudDocument.mockResolvedValue(undefined);

    const loaded = await loadDocument('doc-1');
    expect(loaded).toBeDefined();
    expect(loaded?.title).toBe('Local Fresh Doc');
    expect(loaded?.updatedAt).toBe(3000);

    // Verify background sync to cloud was triggered with the fresher local doc
    expect(mockSaveCloudDocument).toHaveBeenCalledWith(expect.objectContaining({ title: 'Local Fresh Doc' }));
  });

  it('loadDocument selects cloud doc when cloud is newer than local doc', async () => {
    const cloudDoc: MindMapDocument = {
      id: 'doc-1',
      title: 'Cloud Fresh Doc',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 5000 // Newer!
    };

    const localDoc: any = {
      id: 'doc-1',
      uid: 'user-123',
      title: 'Local Stale Doc',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: 1000,
      updatedAt: 3000 // Stale
    };

    mockGetCloudDocument.mockResolvedValue(cloudDoc);
    mockGetLocalDocument.mockResolvedValue(localDoc);
    mockSaveLocalDocument.mockResolvedValue(undefined);

    const loaded = await loadDocument('doc-1');
    expect(loaded).toBeDefined();
    expect(loaded?.title).toBe('Cloud Fresh Doc');
    expect(loaded?.updatedAt).toBe(5000);

    // Verify local cache updated with the fresher cloud doc
    expect(mockSaveLocalDocument).toHaveBeenCalledWith(expect.objectContaining({ title: 'Cloud Fresh Doc' }));
  });

  it('loadAllDocuments merges local and cloud docs without dropping un-synced local docs', async () => {
    const cloudDocs: MindMapDocument[] = [
      {
        id: 'doc-cloud-only',
        title: 'Cloud Only',
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: 1000,
        updatedAt: 2000
      }
    ];

    const localDocs: any[] = [
      {
        id: 'doc-local-only',
        uid: 'user-123',
        title: 'Local Only',
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: 1500,
        updatedAt: 2500
      }
    ];

    mockGetCloudDocuments.mockResolvedValue(cloudDocs);
    mockGetAllLocalDocuments.mockResolvedValue(localDocs);
    mockSaveCloudDocument.mockResolvedValue(undefined);
    mockSaveLocalDocument.mockResolvedValue(undefined);

    const allDocs = await loadAllDocuments();
    expect(allDocs).toHaveLength(2);
    expect(allDocs.map(d => d.id)).toContain('doc-cloud-only');
    expect(allDocs.map(d => d.id)).toContain('doc-local-only');
  });
});
