// API Base URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
  REQUEST_TIMEOUT: 10000, // 10초
};
