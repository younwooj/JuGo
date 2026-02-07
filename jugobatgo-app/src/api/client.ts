import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, Config } from '@/constants/Config';

// 재시도 지연 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Config.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    // TODO: 로컬 스토리지나 Zustand에서 토큰 가져오기
    // const token = getToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // localtunnel 회피 페이지 우회 (loca.lt 사용 시)
    if (API_BASE_URL.includes('loca.lt')) {
      config.headers['Bypass-Tunnel-Reminder'] = 'true';
    }
    
    // 재시도 횟수 초기화
    if (!config.headers) {
      config.headers = {} as any;
    }
    (config as any)._retryCount = (config as any)._retryCount || 0;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리 및 자동 재시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    if (!config) {
      return Promise.reject(error);
    }

    // 재시도 가능한 에러 확인
    const isNetworkError = !error.response && (
      error.code === 'ECONNABORTED' || 
      error.code === 'ERR_NETWORK' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error')
    );

    // 5xx 서버 에러도 재시도
    const isServerError = error.response?.status && error.response.status >= 500;

    const shouldRetry = (isNetworkError || isServerError) && 
                       (config._retryCount || 0) < Config.MAX_RETRY_COUNT;

    if (shouldRetry) {
      config._retryCount = (config._retryCount || 0) + 1;
      
      console.log(`재시도 ${config._retryCount}/${Config.MAX_RETRY_COUNT}...`);
      
      // 지수 백오프: 1초, 2초, 4초...
      const delayTime = Config.RETRY_DELAY * Math.pow(2, config._retryCount - 1);
      await delay(delayTime);
      
      return apiClient(config);
    }

    // 인증 에러 처리
    if (error.response?.status === 401) {
      console.error('인증 실패: 로그인이 필요합니다.');
      // TODO: 로그아웃 처리
    }

    // 사용자 친화적인 에러 메시지 추가
    if (isNetworkError) {
      let message = '연결에 실패했습니다.\n인터넷 연결이나 VPN을 확인해주세요.';
      if (__DEV__ && API_BASE_URL.includes('localhost')) {
        message += '\n\n[터널 모드 사용 시] 백엔드도 터널로 노출해야 합니다.\njugobatgo-server에서 "npm run tunnel" 실행 후, 출력된 URL을 .env의 EXPO_PUBLIC_API_URL에 설정하세요.';
      }
      const enhancedError = new Error(message) as any;
      enhancedError.originalError = error;
      enhancedError.isNetworkError = true;
      return Promise.reject(enhancedError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient as client };