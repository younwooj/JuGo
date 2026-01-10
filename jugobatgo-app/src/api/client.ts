import axios from 'axios';
import { API_BASE_URL, Config } from '@/constants/Config';

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: 로그아웃 처리
      console.error('인증 실패: 로그인이 필요합니다.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
