# 주고받고 (JuGo) - Frontend

경조사 및 선물 관리 앱 "주고받고"의 React Native(Expo) 프론트엔드입니다.

## 기술 스택

- **Framework**: React Native with Expo Router
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Language**: TypeScript

## 시작하기

### 설치

```bash
npm install
```

### 실행

```bash
# 개발 서버 시작
npm start

# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android
```

## 폴더 구조

```
src/
├── api/           # Axios 인스턴스 및 TanStack Query Hooks
├── components/    # 재사용 가능한 UI 컴포넌트
│   ├── home/      # 홈 화면 전용 (Thermometer, SummaryCard)
│   ├── ledger/    # 장부 관련 컴포넌트
│   └── common/    # 공통 레이아웃
├── constants/     # 색상, 수치, 설정값
├── hooks/         # 커스텀 훅 (useAuth, useGoldPrice)
├── navigation/    # Expo Router 설정
├── screens/       # 페이지 단위 스크린
├── store/         # Zustand 상태 정의
└── utils/         # 유틸리티 함수
```

## 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 개발 규칙

- TypeScript Strict Mode 사용
- 모든 컴포넌트는 PascalCase로 명명
- Zustand를 사용한 전역 상태 관리
- TanStack Query를 사용한 서버 상태 관리
