import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** 사설 IP 대역인지 확인 (192.168.x.x, 10.x.x.x, 172.16-31.x.x) */
function isPrivateIP(host: string): boolean {
  if (!host) return false;
  return (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

/**
 * API Base URL 결정 로직
 * - EXPO_PUBLIC_API_URL 환경변수가 있으면 사용 (단, 모바일에서 localhost인 경우 제외)
 * - LAN 모드: hostUri가 사설 IP(192.168.x.x 등) → 개발 PC IP로 API 접속
 * - 터널 모드 (--tunnel): hostUri가 ngrok/expo 등 → EXPO_PUBLIC_API_URL 필수
 *   (백엔드도 터널로 노출해야 함. npm run tunnel 실행)
 */
function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const isLocalhost = envUrl?.includes('localhost') || envUrl?.includes('127.0.0.1');

  if (Platform.OS !== 'web' && (!envUrl || isLocalhost)) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const match = hostUri.match(/exp:\/\/([^:/]+)/);
      if (match) {
        const host = match[1];
        // 터널 모드: hostUri가 ngrok, expo.dev 등 → localhost 사용 불가, env 필수
        if (!isPrivateIP(host)) {
          return envUrl || 'http://localhost:3000'; // env에 터널 URL 설정 필요
        }
        // LAN 모드: 사설 IP → 개발 PC로 연결
        const port = envUrl?.match(/:(\d+)/)?.[1] ?? '3000';
        return `http://${host}:${port}`;
      }
    }
  }

  return envUrl || 'http://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();

if (__DEV__ && typeof console !== 'undefined') {
  console.log('[Config] API_BASE_URL:', API_BASE_URL);
}

// 색상 상수
export const Colors = {
  primary: '#ef4444',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// 온도 색상 계산 (0~100)
export const getTemperatureColor = (temperature: number): string => {
  if (temperature >= 70) return '#ef4444'; // 빨강 (많이 줌)
  if (temperature >= 40) return '#10b981'; // 초록 (균형)
  return '#3b82f6'; // 파랑 (많이 받음)
};

// 앱 설정
export const Config = {
  APP_NAME: '주고받고',
  VERSION: '1.0.0',
  MAX_RETRY_COUNT: 3,
  REQUEST_TIMEOUT: 30000, // 30초 (타임아웃 증가)
  RETRY_DELAY: 1000, // 재시도 간 지연 시간 (1초)
};
