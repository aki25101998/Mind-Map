import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const login = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;
  
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      email: user.email,
      createdAt: Date.now()
    });
  }
  
  return userCredential;
};

export const loginWithGoogleCredential = async (idToken?: string | null, accessToken?: string | null) => {
  if (!idToken && !accessToken) {
    throw new Error('Không tìm thấy thông tin xác thực Google.');
  }
  const credential = GoogleAuthProvider.credential(idToken || null, accessToken || null);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;
  
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      email: user.email,
      createdAt: Date.now()
    });
  }
  
  return userCredential;
};

export const loginAnonymously = async () => {
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;
  
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      email: null,
      isAnonymous: true,
      createdAt: Date.now()
    });
  }
  
  return userCredential;
};

export const handleDeepLinkUrl = async (urlStr: string): Promise<boolean> => {
  if (!urlStr || !urlStr.startsWith('com.yoogi.mindmap://')) {
    return false;
  }

  const queryPart = urlStr.includes('?') ? urlStr.split('?')[1] : '';
  const params = new URLSearchParams(queryPart);
  const idToken = params.get('idToken');
  const accessToken = params.get('accessToken');

  if (idToken || accessToken) {
    await loginWithGoogleCredential(idToken, accessToken);
    return true;
  }
  return false;
};

export const register = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Create user profile in Firestore
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    email: user.email,
    createdAt: Date.now()
  });

  return userCredential;
};

export const logout = async () => {
  return firebaseSignOut(auth);
};

export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return snapshot.data();
  }
  return null;
};
