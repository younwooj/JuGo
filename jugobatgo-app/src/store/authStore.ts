import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  socialProvider: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),
  
  setTokens: (accessToken, refreshToken) => set({ 
    accessToken, 
    refreshToken 
  }),
  
  logout: () => set({ 
    user: null, 
    accessToken: null, 
    refreshToken: null, 
    isAuthenticated: false 
  }),
}));
