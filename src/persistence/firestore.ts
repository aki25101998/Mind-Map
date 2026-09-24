import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { MindMapDocument, ShareConfig } from '../types';

export const saveCloudDocument = async (document: MindMapDocument): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const docRef = doc(db, 'users', user.uid, 'mindmaps', document.id);
  await setDoc(docRef, document);
};

export const getCloudDocument = async (id: string): Promise<MindMapDocument | undefined> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const docRef = doc(db, 'users', user.uid, 'mindmaps', id);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as MindMapDocument;
  }
  return undefined;
};

export const getCloudDocuments = async (): Promise<MindMapDocument[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const mapsRef = collection(db, 'users', user.uid, 'mindmaps');
  const q = query(mapsRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as MindMapDocument);
};

export const deleteCloudDocument = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const docRef = doc(db, 'users', user.uid, 'mindmaps', id);
  await deleteDoc(docRef);
};

export const saveShareConfig = async (config: ShareConfig): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid !== config.ownerId) throw new Error('Unauthorized');
  
  const docRef = doc(db, 'shares', config.id);
  await setDoc(docRef, config);
};

export const setMindMapShareConfig = async (
  documentId: string, 
  shareId: string, 
  enabled: boolean,
  permission: 'view' | 'edit' = 'view'
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');

  const shareRef = doc(db, 'shares', shareId);
  const shareSnap = await getDoc(shareRef);

  const now = Date.now();
  let createdAt = now;
  if (shareSnap.exists()) {
    const existingData = shareSnap.data();
    if (typeof existingData?.createdAt === 'number') {
      createdAt = existingData.createdAt;
    }
  }

  const batch = writeBatch(db);

  // 1. Update the share config
  batch.set(shareRef, {
    id: shareId,
    mindMapId: documentId,
    ownerId: user.uid,
    enabled: enabled,
    permission: permission,
    createdAt: createdAt,
    updatedAt: now
  });

  // 2. Update the mind map document
  const mapRef = doc(db, 'users', user.uid, 'mindmaps', documentId);
  batch.set(mapRef, {
    shareEnabled: enabled,
    shareId: shareId,
    sharePermission: permission,
    updatedAt: now
  }, { merge: true });

  await batch.commit();
};

export interface PublicSharedDocument extends MindMapDocument {
  sharePermission: 'view' | 'edit';
  ownerId: string;
}

export const getPublicSharedDocument = async (shareId: string): Promise<PublicSharedDocument | undefined> => {
  const shareRef = doc(db, 'shares', shareId);
  const shareSnap = await getDoc(shareRef);
  
  if (!shareSnap.exists()) {
    return undefined;
  }
  
  const shareData = shareSnap.data() as ShareConfig;
  
  if (!shareData.enabled) {
    return undefined;
  }
  
  const mapRef = doc(db, 'users', shareData.ownerId, 'mindmaps', shareData.mindMapId);
  const mapSnap = await getDoc(mapRef);
  
  if (!mapSnap.exists()) {
    return undefined;
  }
  
  const mapData = mapSnap.data() as MindMapDocument;
  
  if (!mapData.shareEnabled) {
    return undefined;
  }
  
  return {
    ...mapData,
    sharePermission: shareData.permission || 'view',
    ownerId: shareData.ownerId
  };
};

export const saveSharedCloudDocument = async (ownerId: string, document: MindMapDocument): Promise<void> => {
  const mapRef = doc(db, 'users', ownerId, 'mindmaps', document.id);
  await setDoc(mapRef, document, { merge: true });
};
