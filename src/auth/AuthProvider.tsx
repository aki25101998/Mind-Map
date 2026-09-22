import React, { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { AuthState } from '../types';

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: User | null) => {
        if (firebaseUser) {
          setState({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
            },
            loading: false,
            error: null
          });
        } else {
          setState({
            user: null,
            loading: false,
            error: null
          });
        }
      },
      (error) => {
        setState({
          user: null,
          loading: false,
          error
        });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
};

