import { createContext } from 'react';
import type { AuthState } from '../types';

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null
});
