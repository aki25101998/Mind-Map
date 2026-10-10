import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { LocalMindMapDocument, Project } from '../types';

export type LocalProject = Project & { uid?: string };

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
  projects: {
    key: string;
    value: LocalProject;
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
    dbPromise = openDB<MyDB>('MindMapDB', 3, {
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
        if (oldVersion < 3) {
          let projectStore;
          if (!db.objectStoreNames.contains('projects')) {
            projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          } else {
            projectStore = transaction.objectStore('projects');
          }
          if (!projectStore.indexNames.contains('updatedAt')) {
            projectStore.createIndex('updatedAt', 'updatedAt');
          }
          if (!projectStore.indexNames.contains('uid')) {
            projectStore.createIndex('uid', 'uid');
          }
          if (!projectStore.indexNames.contains('uid_updatedAt')) {
            projectStore.createIndex('uid_updatedAt', ['uid', 'updatedAt']);
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
      const docs = await db.getAllFromIndex('documents', 'uid', uid);
      return docs.sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      const docs = await db.getAllFromIndex('documents', 'updatedAt');
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

export const saveProject = async (project: LocalProject): Promise<void> => {
  try {
    const db = await initDB();
    await db.put('projects', project);
  } catch (error) {
    console.error('Failed to save project to IndexedDB:', error);
    throw error;
  }
};

export const getProject = async (id: string): Promise<LocalProject | undefined> => {
  try {
    const db = await initDB();
    return await db.get('projects', id);
  } catch (error) {
    console.error('Failed to get project from IndexedDB:', error);
    throw error;
  }
};

export const getAllProjects = async (uid?: string): Promise<LocalProject[]> => {
  try {
    const db = await initDB();
    if (uid) {
      const projects = await db.getAllFromIndex('projects', 'uid', uid);
      return projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      const projects = await db.getAllFromIndex('projects', 'updatedAt');
      const anonymousProjects = projects.filter(p => !p.uid);
      return anonymousProjects.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch (error) {
    console.error('Failed to get all projects from IndexedDB:', error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    await db.delete('projects', id);
  } catch (error) {
    console.error('Failed to delete project from IndexedDB:', error);
    throw error;
  }
};
