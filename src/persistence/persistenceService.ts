import { 
  saveCloudDocument, 
  getCloudDocument, 
  getCloudDocuments, 
  deleteCloudDocument,
  saveCloudProject,
  getCloudProjects,
  deleteCloudProject
} from './firestore';
import { 
  saveDocument as saveLocalDocument, 
  getDocument as getLocalDocument,
  getAllDocuments as getAllLocalDocuments,
  deleteDocument as deleteLocalDocument,
  saveProject as saveLocalProject,
  getAllProjects as getAllLocalProjects,
  deleteProject as deleteLocalProject
} from './idb';
import type { MindMapDocument, Project } from '../types';
import { auth } from '../lib/firebase';
import { sanitizeDocumentForPersistence, sanitizeProject } from './sanitize';

export interface SyncResult {
  success: boolean;
  localSaved: boolean;
  cloudSaved: boolean;
  error?: Error;
}

const withTimeout = <T>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timed out. Database might not be initialized.')), ms))
  ]);
};

export const syncDocument = async (document: MindMapDocument): Promise<SyncResult> => {
  const sanitizedDoc = sanitizeDocumentForPersistence(document);
  const user = auth?.currentUser;
  
  // Always save locally first (with uid if logged in)
  const docToSave = user ? { ...sanitizedDoc, uid: user.uid } as any : sanitizedDoc;
  await saveLocalDocument(docToSave);

  let cloudSaved = false;
  let cloudError: Error | undefined;

  if (user) {
    try {
      await withTimeout(saveCloudDocument(sanitizedDoc));
      cloudSaved = true;
    } catch (err: any) {
      console.warn('Failed to sync to cloud, but saved locally:', err);
      cloudError = err instanceof Error ? err : new Error(String(err));
    }
  }

  return {
    success: !user || cloudSaved,
    localSaved: true,
    cloudSaved,
    error: cloudError
  };
};

export const loadDocument = async (id: string): Promise<MindMapDocument | undefined> => {
  const user = auth?.currentUser;

  let cloudDoc: MindMapDocument | undefined;
  if (user) {
    try {
      cloudDoc = await withTimeout(getCloudDocument(id));
    } catch (err) {
      console.warn('Failed to load from cloud, falling back to local:', err);
    }
  }

  // Load from local
  const localDoc: any = await getLocalDocument(id);
  const validLocalDoc = localDoc && (!user || localDoc.uid === user.uid) ? (localDoc as MindMapDocument) : undefined;

  if (cloudDoc && validLocalDoc) {
    // Both exist: compare updatedAt so local changes aren't wiped out by stale cloud data
    if (validLocalDoc.updatedAt > cloudDoc.updatedAt) {
      console.log('Local document is newer than cloud. Using local and updating cloud in background.');
      withTimeout(saveCloudDocument(validLocalDoc)).catch(err => console.warn('Background cloud update failed:', err));
      return validLocalDoc;
    } else {
      // Cloud document is newer or equal: use cloud and update local cache
      saveLocalDocument({ ...cloudDoc, uid: user?.uid } as any).catch(console.error);
      return cloudDoc;
    }
  }

  if (cloudDoc) {
    if (user) {
      saveLocalDocument({ ...cloudDoc, uid: user.uid } as any).catch(console.error);
    }
    return cloudDoc;
  }

  if (validLocalDoc) {
    // Only local exists: sync to cloud if logged in
    if (user) {
      withTimeout(saveCloudDocument(validLocalDoc)).catch(err => console.warn('Failed to sync local-only document to cloud:', err));
    }
    return validLocalDoc;
  }

  return undefined;
};

export const loadAllDocuments = async (): Promise<MindMapDocument[]> => {
  const user = auth?.currentUser;
  
  if (user) {
    try {
      const [cloudDocs, localDocs] = await Promise.all([
        withTimeout(getCloudDocuments()).catch(err => {
          console.warn('Failed to load all from cloud, falling back to local:', err);
          return [] as MindMapDocument[];
        }),
        getAllLocalDocuments(user.uid)
      ]);

      const docMap = new Map<string, MindMapDocument>();

      // Populate local documents first
      for (const doc of localDocs) {
        docMap.set(doc.id, doc);
      }

      // Merge cloud documents: keep the one with higher updatedAt
      for (const doc of cloudDocs) {
        const local = docMap.get(doc.id);
        if (!local || doc.updatedAt >= local.updatedAt) {
          docMap.set(doc.id, doc);
          // Cache to local in background
          saveLocalDocument({ ...doc, uid: user.uid } as any).catch(console.error);
        } else {
          // Local is newer! Push to cloud in background
          withTimeout(saveCloudDocument(local)).catch(err => console.warn('Failed to push newer local doc to cloud:', err));
        }
      }

      return Array.from(docMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      console.warn('Failed to load all documents, falling back to local:', err);
      return await getAllLocalDocuments(user.uid);
    }
  }

  return await getAllLocalDocuments();
};

export const removeDocument = async (id: string): Promise<void> => {
  const user = auth?.currentUser;
  
  // Remove locally
  await deleteLocalDocument(id);

  if (user) {
    try {
      await withTimeout(deleteCloudDocument(id));
    } catch (err) {
      console.warn('Failed to delete from cloud:', err);
    }
  }
};

export const syncProject = async (project: Project): Promise<SyncResult> => {
  const sanitized = sanitizeProject(project);
  const user = auth?.currentUser;

  const projectToSave = user ? ({ ...sanitized, uid: user.uid } as any) : sanitized;
  await saveLocalProject(projectToSave);

  let cloudSaved = false;
  let cloudError: Error | undefined;

  if (user) {
    try {
      await withTimeout(saveCloudProject(sanitized));
      cloudSaved = true;
    } catch (err: any) {
      console.warn('Failed to sync project to cloud, but saved locally:', err);
      cloudError = err instanceof Error ? err : new Error(String(err));
    }
  }

  return {
    success: !user || cloudSaved,
    localSaved: true,
    cloudSaved,
    error: cloudError
  };
};

export const loadAllProjects = async (): Promise<Project[]> => {
  const user = auth?.currentUser;

  if (user) {
    try {
      const [cloudProjects, localProjects] = await Promise.all([
        withTimeout(getCloudProjects()).catch(err => {
          console.warn('Failed to load projects from cloud, falling back to local:', err);
          return [] as Project[];
        }),
        getAllLocalProjects(user.uid)
      ]);

      const projectMap = new Map<string, Project>();

      for (const p of localProjects) {
        projectMap.set(p.id, p);
      }

      for (const p of cloudProjects) {
        const local = projectMap.get(p.id);
        if (!local || p.updatedAt >= local.updatedAt) {
          projectMap.set(p.id, p);
          saveLocalProject({ ...p, uid: user.uid } as any).catch(console.error);
        } else {
          withTimeout(saveCloudProject(local)).catch(err => console.warn('Failed to push newer local project to cloud:', err));
        }
      }

      return Array.from(projectMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      console.warn('Failed to load all projects, falling back to local:', err);
      return await getAllLocalProjects(user.uid);
    }
  }

  return await getAllLocalProjects();
};

export const removeProject = async (id: string, deleteContainedMaps: boolean = false): Promise<void> => {
  const user = auth?.currentUser;

  // Handle contained mind maps
  const allDocs = await loadAllDocuments();
  const containedDocs = allDocs.filter(d => d.projectId === id);

  for (const doc of containedDocs) {
    if (deleteContainedMaps) {
      await removeDocument(doc.id);
    } else {
      // Unassign: remove projectId and re-sync document
      const updatedDoc = { ...doc };
      delete updatedDoc.projectId;
      await syncDocument(updatedDoc);
    }
  }

  // Remove project locally
  await deleteLocalProject(id);

  // Remove project from cloud
  if (user) {
    try {
      await withTimeout(deleteCloudProject(id));
    } catch (err) {
      console.warn('Failed to delete project from cloud:', err);
    }
  }
};


