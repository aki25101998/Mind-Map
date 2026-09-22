import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { MindMapDocument } from '../types';

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
