import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authApi, userApi } from '../src/api/auth';
import { useAuthStore } from '../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // OAuth 로그인 처리
  const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
    try {
      setLoading(true);
      
      if (Platform.OS === 'web') {
        // 웹에서는 OAuth 팝업/리다이렉트 사용
        await authApi.signInWithOAuth(provider);
      } else {
        // 모바일에서는 다른 처리 필요 (추후 구현)
        Alert.alert(
          '준비 중',
          '모바일 OAuth 로그인은 준비 중입니다.\n이메일 로그인을 사용해주세요.'
        );
      }
    } catch (error: any) {
      console.error('OAuth login error:', error);
      Alert.alert('로그인 실패', error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이메일/비밀번호 로그인
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      let authData;
      if (isSignUp) {
        // 회원가입
        authData = await authApi.signUpWithEmail(email, password);
        Alert.alert('회원가입 완료', '이메일을 확인해주세요.');
      } else {
        // 로그인
        authData = await authApi.signInWithEmail(email, password);
      }

      if (authData.user) {
        // 백엔드에 사용자 프로필 생성/가져오기
        const userProfile = await userApi.getOrCreateUserProfile(authData.user);
        
        // 상태 저장
        setUser({
          id: userProfile.id,
          email: userProfile.email,
          socialProvider: userProfile.socialProvider,
        });

        if (authData.session) {
          setTokens(authData.session.access_token, authData.session.refresh_token);
        }

        // 홈으로 이동
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Email login error:', error);
      Alert.alert(
        isSignUp ? '회원가입 실패' : '로그인 실패',
        error.message || '처리 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 게스트 모드로 계속 (개발용)
  const handleGuestMode = () => {
    Alert.alert(
      '게스트 모드',
      '게스트 모드로 계속하시겠습니까?\n일부 기능이 제한될 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '계속',
          onPress: () => {
            // 게스트 사용자 설정 (개발용)
            setUser({
              id: 'guest',
              email: 'guest@jugobatgo.com',
              socialProvider: 'guest',
            });
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* 헤더 */}
      <View
        style={{
          paddingTop: Platform.OS === 'web' ? 60 : 80,
          paddingHorizontal: 24,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 }}>
          주고받고
        </Text>
        <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 48 }}>
          경조사 및 선물 관리의 새로운 기준
        </Text>
      </View>

      {/* 로그인 폼 */}
      <View style={{ paddingHorizontal: 24 }}>
        {/* 이메일 입력 */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
            이메일
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
            }}
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* 비밀번호 입력 */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
            비밀번호
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
            }}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        {/* 이메일 로그인 버튼 */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? '#9ca3af' : '#ef4444',
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleEmailLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              {isSignUp ? '회원가입' : '로그인'}
            </Text>
          )}
        </TouchableOpacity>

        {/* 회원가입/로그인 전환 */}
        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={loading}
          style={{ marginBottom: 24, alignItems: 'center' }}
        >
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
            <Text style={{ color: '#ef4444', fontWeight: '600' }}>
              {isSignUp ? '로그인' : '회원가입'}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* 구분선 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
          <Text style={{ marginHorizontal: 16, color: '#9ca3af', fontSize: 14 }}>또는</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
        </View>

        {/* 소셜 로그인 버튼들 */}
        {Platform.OS === 'web' && (
          <>
            {/* Google 로그인 */}
            <TouchableOpacity
              style={{
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 8,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
              onPress={() => handleOAuthLogin('google')}
              disabled={loading}
            >
              <Text style={{ fontSize: 20, marginRight: 8 }}>🔵</Text>
              <Text style={{ color: '#374151', fontSize: 16, fontWeight: '500' }}>
                Google로 계속하기
              </Text>
            </TouchableOpacity>

            {/* Kakao 로그인 */}
            <TouchableOpacity
              style={{
                backgroundColor: '#FEE500',
                borderRadius: 8,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
              onPress={() => handleOAuthLogin('kakao')}
              disabled={loading}
            >
              <Text style={{ fontSize: 20, marginRight: 8 }}>💬</Text>
              <Text style={{ color: '#000000', fontSize: 16, fontWeight: '500' }}>
                Kakao로 계속하기
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* 게스트 모드 (개발용) */}
        <TouchableOpacity
          style={{
            paddingVertical: 12,
            alignItems: 'center',
            marginTop: 12,
          }}
          onPress={handleGuestMode}
          disabled={loading}
        >
          <Text style={{ color: '#9ca3af', fontSize: 14 }}>
            게스트로 둘러보기 →
          </Text>
        </TouchableOpacity>
      </View>

      {/* 푸터 */}
      <View
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#9ca3af', fontSize: 12 }}>
          © 2026 주고받고. All rights reserved.
        </Text>
      </View>
    </View>
  );
}
