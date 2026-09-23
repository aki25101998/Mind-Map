import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
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

export const getPublicSharedDocument = async (shareId: string): Promise<MindMapDocument | undefined> => {
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
  
  return mapData;
};
