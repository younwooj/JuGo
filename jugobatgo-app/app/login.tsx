import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // OAuth 로그인 처리
  const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
    console.log('=== OAuth 로그인 시도 ===', provider);
    try {
      setLoading(true);
      
      if (Platform.OS === 'web') {
        console.log('웹 OAuth 시작');
        // 웹에서는 OAuth 팝업/리다이렉트 사용
        await authApi.signInWithOAuth(provider);
      } else {
        // 모바일에서는 다른 처리 필요 (추후 구현)
        alert('준비 중\n\n모바일 OAuth 로그인은 준비 중입니다.\n이메일 로그인을 사용해주세요.');
      }
    } catch (error: any) {
      console.error('OAuth login error:', error);
      alert('로그인 실패\n\n' + (error.message || '로그인 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 이메일/비밀번호 로그인
  const handleEmailLogin = async () => {
    console.log('=== handleEmailLogin 시작 ===');
    console.log('isSignUp:', isSignUp);
    console.log('email:', email);
    console.log('password:', password ? '***' : 'empty');
    
    // 입력값 검증
    if (!email || !password) {
      console.log('입력값 없음');
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('이메일 형식 오류');
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 회원가입 시 비밀번호 확인
    if (isSignUp) {
      if (password.length < 6) {
        console.log('비밀번호 길이 부족');
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }
      
      if (password !== confirmPassword) {
        console.log('비밀번호 불일치');
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    try {
      console.log('로딩 시작');
      setLoading(true);

      if (isSignUp) {
        console.log('회원가입 시도...');
        // 회원가입
        const authData = await authApi.signUpWithEmail(email, password);
        console.log('회원가입 성공:', authData);
        
        // 로딩 먼저 종료
        setLoading(false);
        
        alert(`✅ 회원가입 완료!\n\n${email}로 인증 메일을 발송했습니다.\n\n이메일을 확인하고 "Confirm your mail" 링크를 클릭하여 계정을 활성화해주세요.\n\n활성화 후 로그인할 수 있습니다.`);
        
        // 로그인 모드로 전환
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
        return; // 여기서 종료
      } else {
        console.log('로그인 시도...');
        // 로그인
        const authData = await authApi.signInWithEmail(email, password);
        console.log('로그인 응답:', authData);

        if (authData.user) {
          console.log('사용자 정보:', authData.user);
          // 이메일 인증 확인
          if (!authData.user.email_confirmed_at) {
            console.log('이메일 미인증');
            setLoading(false);
            alert('이메일 인증 필요\n\n아직 이메일 인증이 완료되지 않았습니다.\n\n받은 메일함을 확인하고 "Confirm your mail" 링크를 클릭해주세요.\n\n메일을 받지 못했다면 스팸함을 확인해보세요.');
            return;
          }

          console.log('백엔드 프로필 생성 중...');
          // 백엔드에 사용자 프로필 생성/가져오기
          const userProfile = await userApi.getOrCreateUserProfile(authData.user);
          console.log('프로필:', userProfile);
          
          // 상태 저장
          setUser({
            id: userProfile.id,
            email: userProfile.email,
            socialProvider: userProfile.socialProvider,
          });

          if (authData.session) {
            setTokens(authData.session.access_token, authData.session.refresh_token);
          }

          // 로딩 종료
          setLoading(false);

          console.log('로그인 성공! 홈으로 이동');
          // 홈으로 바로 이동
          router.replace('/');
          return; // 여기서 종료
        }
      }
    } catch (error: any) {
      console.error('Email login error:', error);
      
      let errorMessage = '처리 중 오류가 발생했습니다.';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.\n\n이메일 인증을 완료했는지 확인해주세요.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '이메일 인증이 완료되지 않았습니다.\n받은 메일함을 확인해주세요.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = '이미 가입된 이메일입니다.\n로그인을 시도해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert((isSignUp ? '회원가입 실패\n\n' : '로그인 실패\n\n') + errorMessage);
      setLoading(false);
    }
  };

  // 테스트 계정 (개발/테스트용)
  const TEST_EMAIL = 'test@jugobatgo.com';
  const TEST_PASSWORD = 'Test123456!';

  // Supabase 에러 메시지에서 '계정 없음' 여부 확인 (다양한 형식 대응)
  const isInvalidCredentials = (msg: string) =>
    msg && (
      msg.toLowerCase().includes('invalid login credentials') ||
      msg.toLowerCase().includes('invalid_credentials') ||
      msg.includes('올바르지 않습니다')
    );

  const completeTestLogin = async (authData: any) => {
    if (!authData.user) return;
    if (!authData.user.email_confirmed_at) {
      Alert.alert(
        '이메일 인증 필요',
        'Supabase 대시보드 > Authentication > Users에서 test@jugobatgo.com 계정을 찾아 "Confirm email"을 클릭해주세요.\n\n또는 Supabase > Authentication > Providers > Email에서 "Confirm email"을 비활성화한 뒤 계정을 다시 생성해주세요.'
      );
      return;
    }
    try {
      const userProfile = await userApi.getOrCreateUserProfile(authData.user);
      setUser({
        id: userProfile.id,
        email: userProfile.email,
        socialProvider: userProfile.socialProvider,
      });
      if (authData.session) {
        setTokens(authData.session.access_token, authData.session.refresh_token);
      }
      router.replace('/');
    } catch (backendError: any) {
      Alert.alert(
        '백엔드 연결 실패',
        '로그인은 성공했지만 백엔드 서버에 연결할 수 없습니다.\n\n"게스트로 둘러보기"를 사용하시거나, 백엔드 실행 후 다시 시도해주세요.'
      );
    }
  };

  // 테스트 계정으로 로그인 (계정 없으면 자동 생성 시도)
  const handleTestLogin = async () => {
    setEmail(TEST_EMAIL);
    setPassword(TEST_PASSWORD);
    setIsSignUp(false);
    setLoading(true);
    try {
      let authData = await authApi.signInWithEmail(TEST_EMAIL, TEST_PASSWORD);
      if (authData.user) {
        setLoading(false);
        await completeTestLogin(authData);
        return;
      }
    } catch (signInError: any) {
      const msg = signInError?.message || String(signInError);
      if (isInvalidCredentials(msg)) {
        // 계정 없음 → 자동 생성 시도
        try {
          const signUpData = await authApi.signUpWithEmail(TEST_EMAIL, TEST_PASSWORD);
          setLoading(false);
          if (signUpData.session) {
            await completeTestLogin(signUpData);
          } else if (signUpData.user) {
            Alert.alert(
              '계정 생성됨',
              'test@jugobatgo.com 계정이 생성되었습니다.\n\nSupabase 대시보드에서 이메일 인증을 완료하거나, "Confirm email" 비활성화 후 "테스트 계정으로 로그인"을 다시 눌러주세요.'
            );
          }
        } catch (signUpError: any) {
          setLoading(false);
          const signUpMsg = signUpError?.message || String(signUpError);
          if (signUpMsg.toLowerCase().includes('already registered')) {
            Alert.alert(
              '비밀번호 확인',
              '테스트 계정이 이미 있습니다. 비밀번호가 Test123456! 가 맞는지 확인해주세요.\n\nSupabase 대시보드에서 비밀번호를 재설정할 수 있습니다.'
            );
          } else {
            Alert.alert('계정 생성 실패', signUpMsg);
          }
        }
      } else {
        setLoading(false);
        Alert.alert('로그인 실패', msg || '알 수 없는 오류');
      }
    }
  };

  // 테스트 계정 생성 (최초 1회)
  const handleCreateTestAccount = async () => {
    setLoading(true);
    try {
      const authData = await authApi.signUpWithEmail(TEST_EMAIL, TEST_PASSWORD);
      if (authData.session) {
        try {
          const userProfile = await userApi.getOrCreateUserProfile(authData.user);
          setUser({
            id: userProfile.id,
            email: userProfile.email,
            socialProvider: userProfile.socialProvider,
          });
          setTokens(authData.session.access_token, authData.session.refresh_token);
          setLoading(false);
          router.replace('/');
        } catch (backendError: any) {
          setLoading(false);
          Alert.alert(
            '백엔드 연결 필요',
            '계정이 생성되었지만 백엔드 서버를 먼저 실행해주세요.\n\n(jugobatgo-server에서 npm run start:dev 실행 후 "테스트 계정으로 로그인" 시도)'
          );
        }
      } else {
        setLoading(false);
        Alert.alert(
          '회원가입 완료',
          'test@jugobatgo.com로 인증 메일을 발송했습니다.\n\n이메일을 확인하고 "Confirm your mail" 링크를 클릭한 뒤, "테스트 계정으로 로그인"을 눌러주세요.\n\n(개발 시 Supabase에서 이메일 확인 비활성화하면 바로 로그인됩니다)'
        );
      }
    } catch (error: any) {
      setLoading(false);
      if (error.message?.includes('already registered')) {
        Alert.alert('알림', '이미 테스트 계정이 있습니다. "테스트 계정으로 로그인"을 눌러주세요.');
      } else {
        Alert.alert('생성 실패', error.message || '계정 생성 중 오류가 발생했습니다.');
      }
    }
  };

  // 게스트 모드로 계속 (개발용)
  const handleGuestMode = () => {
    console.log('=== 게스트 모드 클릭 ===');

    Alert.alert(
      '게스트 모드',
      '게스트 모드로 계속하시겠습니까?\n일부 기능이 제한될 수 있습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => console.log('게스트 모드 취소'),
        },
        {
          text: '확인',
          onPress: () => {
            console.log('게스트 모드 진입');
            setUser({
              id: 'guest',
              email: 'guest@jugobatgo.com',
              socialProvider: 'guest',
            });
            console.log('홈으로 이동');
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
        <View style={{ marginBottom: isSignUp ? 16 : 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
            비밀번호 {isSignUp && '(최소 6자)'}
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

        {/* 비밀번호 확인 (회원가입 시만) */}
        {isSignUp && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' }}>
              비밀번호 확인
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
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>
        )}

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
          onPress={() => {
            setIsSignUp(!isSignUp);
            setConfirmPassword(''); // 비밀번호 확인 초기화
          }}
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

        {/* 테스트 계정 (개발/기능 점검용) */}
        <TouchableOpacity
          style={{
            backgroundColor: '#f3f4f6',
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
            marginBottom: 8,
          }}
          onPress={handleTestLogin}
          disabled={loading}
        >
          <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>
            🧪 테스트 계정으로 로그인
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingVertical: 8,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={handleCreateTestAccount}
          disabled={loading}
        >
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            (테스트 계정 없으면 여기서 생성)
          </Text>
        </TouchableOpacity>

        {/* 게스트 모드 (백엔드 없이 UI 둘러보기) */}
        <TouchableOpacity
          style={{
            paddingVertical: 12,
            alignItems: 'center',
            marginTop: 4,
          }}
          onPress={handleGuestMode}
          disabled={loading}
        >
          <Text style={{ color: '#9ca3af', fontSize: 14 }}>
            게스트로 둘러보기 (데모 데이터) →
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
