import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { MindMapDocument } from '../types';

interface MyDB extends DBSchema {
  documents: {
    key: string;
    value: MindMapDocument;
    indexes: { 'updatedAt': number };
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('MindMapDB', 1, {
      upgrade(db) {
        const store = db.createObjectStore('documents', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      },
    });
  }
  return dbPromise;
};

export const saveDocument = async (doc: MindMapDocument): Promise<void> => {
  try {
    const db = await initDB();
    await db.put('documents', doc);
  } catch (error) {
    console.error('Failed to save document to IndexedDB:', error);
    throw error;
  }
};

export const getDocument = async (id: string): Promise<MindMapDocument | undefined> => {
  try {
    const db = await initDB();
    return await db.get('documents', id);
  } catch (error) {
    console.error('Failed to get document from IndexedDB:', error);
    throw error;
  }
};

export const getAllDocuments = async (): Promise<MindMapDocument[]> => {
  try {
    const db = await initDB();
    return await db.getAllFromIndex('documents', 'updatedAt');
  } catch (error) {
    console.error('Failed to get all documents from IndexedDB:', error);
    return [];
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete('documents', id);
  } catch (error) {
    console.error('Failed to delete document from IndexedDB:', error);
    throw error;
  }
};
