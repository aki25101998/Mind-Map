import { 
  saveCloudDocument, 
  getCloudDocument, 
  getCloudDocuments, 
  deleteCloudDocument 
} from './firestore';
import { 
  saveDocument as saveLocalDocument, 
  getDocument as getLocalDocument,
  getAllDocuments as getAllLocalDocuments,
  deleteDocument as deleteLocalDocument
} from './idb';
import type { MindMapDocument } from '../types';
import { auth } from '../lib/firebase';

const withTimeout = <T>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore operation timed out. Database might not be initialized.')), ms))
  ]);
};

export const syncDocument = async (document: MindMapDocument): Promise<void> => {
  const user = auth?.currentUser;
  
  // Always save locally first (with uid if logged in)
  const docToSave = user ? { ...document, uid: user.uid } as any : document;
  await saveLocalDocument(docToSave);

  if (user) {
    try {
      await withTimeout(saveCloudDocument(document));
    } catch (err) {
      console.warn('Failed to sync to cloud, but saved locally:', err);
      // We don't throw here to allow offline work
    }
  }
};

export const loadDocument = async (id: string): Promise<MindMapDocument | undefined> => {
  const user = auth?.currentUser;

  if (user) {
    try {
      const cloudDoc = await withTimeout(getCloudDocument(id));
      if (cloudDoc) {
        // Cache locally
        await saveLocalDocument({ ...cloudDoc, uid: user.uid } as any);
        return cloudDoc;
      }
    } catch (err) {
      console.warn('Failed to load from cloud, falling back to local:', err);
    }
  }

  // Fallback to local
  const localDoc: any = await getLocalDocument(id);
  if (localDoc && (!user || localDoc.uid === user.uid)) {
    return localDoc as MindMapDocument;
  }
  
  return undefined;
};

export const loadAllDocuments = async (): Promise<MindMapDocument[]> => {
  const user = auth?.currentUser;
  
  if (user) {
    try {
      const cloudDocs = await withTimeout(getCloudDocuments());
      // Cache them locally in the background
      Promise.all(cloudDocs.map(doc => saveLocalDocument({ ...doc, uid: user.uid } as any))).catch(console.error);
      return cloudDocs;
    } catch (err) {
      console.warn('Failed to load all from cloud, falling back to local:', err);
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
      // Depending on requirements, we might want to queue this deletion
    }
  }
};
