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
  const db = await initDB();
  await db.put('documents', doc);
};

export const getDocument = async (id: string): Promise<MindMapDocument | undefined> => {
  const db = await initDB();
  return db.get('documents', id);
};

export const getAllDocuments = async (): Promise<MindMapDocument[]> => {
  const db = await initDB();
  return db.getAllFromIndex('documents', 'updatedAt');
};

export const deleteDocument = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('documents', id);
};
