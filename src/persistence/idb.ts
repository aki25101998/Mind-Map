import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { LocalMindMapDocument } from '../types';

interface MyDB extends DBSchema {
  documents: {
    key: string;
    value: LocalMindMapDocument;
    indexes: { 
      'updatedAt': number;
      'uid': string;
      'uid_updatedAt': [string, number];
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('MindMapDB', 2, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('documents', { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
        if (oldVersion < 2) {
          const store = transaction.objectStore('documents');
          if (!store.indexNames.contains('uid')) {
            store.createIndex('uid', 'uid');
          }
          if (!store.indexNames.contains('uid_updatedAt')) {
            store.createIndex('uid_updatedAt', ['uid', 'updatedAt']);
          }
        }
      },
    });
  }
  return dbPromise;
};

export const saveDocument = async (doc: LocalMindMapDocument): Promise<void> => {
  try {
    const db = await initDB();
    await db.put('documents', doc);
  } catch (error) {
    console.error('Failed to save document to IndexedDB:', error);
    throw error;
  }
};

export const getDocument = async (id: string): Promise<LocalMindMapDocument | undefined> => {
  try {
    const db = await initDB();
    return await db.get('documents', id);
  } catch (error) {
    console.error('Failed to get document from IndexedDB:', error);
    throw error;
  }
};

export const getAllDocuments = async (uid?: string): Promise<LocalMindMapDocument[]> => {
  try {
    const db = await initDB();
    if (uid) {
      // Use the compound index if available, or just fetch and filter/sort
      // The idb library allows getting all from an index.
      // But since we want all for a uid sorted by updatedAt, we could use the compound index,
      // but IDBKeyRange.bound([uid, -Infinity], [uid, Infinity]) is needed.
      // Alternatively, just get all by uid and sort in memory.
      const docs = await db.getAllFromIndex('documents', 'uid', uid);
      return docs.sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      // Used for legacy anonymous maps
      const docs = await db.getAllFromIndex('documents', 'updatedAt');
      // Filter out docs that have a uid (they belong to someone else)
      const anonymousDocs = docs.filter(doc => !doc.uid);
      return anonymousDocs.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch (error) {
    console.error('Failed to get all documents from IndexedDB:', error);
    throw error;
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
