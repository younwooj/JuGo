import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { authApi, userApi } from '../src/api/auth';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const { user, isAuthenticated, setUser, setTokens, logout } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = React.useState(false);

  // 앱 시작 시 세션 확인
  useEffect(() => {
    checkSession();
  }, []);

  // 인증 상태 변경 감지
  useEffect(() => {
    const { data: authListener } = authApi.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (session?.user) {
        try {
          // 백엔드에 사용자 프로필 생성/가져오기
          const userProfile = await userApi.getOrCreateUserProfile(session.user);
          
          setUser({
            id: userProfile.id,
            email: userProfile.email,
            socialProvider: userProfile.socialProvider,
          });

          if (session) {
            setTokens(session.access_token, session.refresh_token);
          }
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 인증 상태에 따른 라우팅
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      // 로그인하지 않았으면 로그인 화면으로
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // 로그인되어 있으면 메인 화면으로
      router.replace('/');
    }
  }, [isAuthenticated, segments, isReady]);

  async function checkSession() {
    try {
      const session = await authApi.getSession();
      
      if (session?.user) {
        // 백엔드에 사용자 프로필 생성/가져오기
        const userProfile = await userApi.getOrCreateUserProfile(session.user);
        
        setUser({
          id: userProfile.id,
          email: userProfile.email,
          socialProvider: userProfile.socialProvider,
        });

        if (session) {
          setTokens(session.access_token, session.refresh_token);
        }
      }
      // 게스트 사용자는 세션이 없어도 OK (Zustand store에서 관리)
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsReady(true);
    }
  }

  if (!isReady) {
    // 로딩 화면 (선택사항)
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
