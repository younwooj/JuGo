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
      const enhancedError = new Error(
        'Connection failed. If the problem persists, please check your internet connection or VPN'
      ) as any;
      enhancedError.originalError = error;
      enhancedError.isNetworkError = true;
      return Promise.reject(enhancedError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient as client };