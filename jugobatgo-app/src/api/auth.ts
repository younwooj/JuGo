import { createClient } from '@supabase/supabase-js';
import { API_BASE_URL } from '../constants/Config';

// Supabase 클라이언트 설정
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// 인증 관련 API
export const authApi = {
  // 소셜 로그인 (OAuth)
  signInWithOAuth: async (provider: 'google' | 'kakao') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    
    if (error) throw error;
    return data;
  },

  // 이메일/비밀번호 로그인 (개발용)
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // 이메일/비밀번호 회원가입 (개발용)
  signUpWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  // 로그아웃
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 현재 세션 가져오기
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // 현재 사용자 가져오기
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  // 세션 변경 이벤트 구독
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// loca.lt 등 터널 사용 시 우회 페이지 스킵용 헤더
const getBackendHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_BASE_URL.includes('loca.lt')) {
    headers['Bypass-Tunnel-Reminder'] = 'true';
  }
  return headers;
};

// 백엔드 API와 연동하여 사용자 프로필 생성/가져오기
export const userApi = {
  // 사용자 프로필 생성
  createUserProfile: async (userData: {
    email: string;
    socialProvider: string;
    supabaseUserId: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getBackendHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // 이메일로 사용자 프로필 가져오기 (404/연결 실패 시 null 반환 가능)
  getUserProfileByEmail: async (email: string): Promise<any | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`, {
        headers: getBackendHeaders(),
      });

      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`Failed to get user profile (${response.status})`);
      }

      const users = await response.json();
      const user = Array.isArray(users) ? users.find((u: any) => u?.email === email) : null;
      return user ?? null;
    } catch (error) {
      console.warn('getUserProfileByEmail failed:', error);
      throw error;
    }
  },

  // 사용자 프로필 가져오기 또는 생성 (조회 실패 시에도 생성 시도)
  getOrCreateUserProfile: async (supabaseUser: any) => {
    const email = supabaseUser.email;
    const provider = supabaseUser.app_metadata?.provider || 'email';

    let userProfile: any = null;
    try {
      userProfile = await userApi.getUserProfileByEmail(email);
    } catch (_) {
      // 백엔드 미실행/오류 시 조회 실패 → 아래에서 생성 시도
    }

    if (!userProfile) {
      userProfile = await userApi.createUserProfile({
        email,
        socialProvider: provider,
        supabaseUserId: supabaseUser.id,
      });
    }

    return userProfile;
  },
};
