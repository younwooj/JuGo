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

### 게스트 모드 (백엔드 없이 테스트)

"게스트로 둘러보기"를 누르면 데모 데이터로 앱을 둘러볼 수 있습니다. 백엔드 연결 없이 UI를 확인할 수 있습니다.

### 테스트 계정 (기능 점검용)

1. 로그인 화면에서 **"테스트 계정 없으면 여기서 생성"** 클릭
2. Supabase에 test@jugobatgo.com 계정이 생성됨
3. (이메일 확인 필요 시) Supabase 대시보드 또는 이메일에서 인증
4. **"테스트 계정으로 로그인"** 클릭

또는 Supabase 대시보드에서 수동 생성:
- Authentication > Users > Add user
- Email: `test@jugobatgo.com`, Password: `Test123456!`

### 터널 모드 (expo start --tunnel)

PC가 WiFi가 아닌 유선 랜에 연결된 경우, Expo Go에서 앱을 테스트하려면 tunnel 모드가 필요합니다.

**백엔드도 터널로 노출해야 합니다:**

1. 터미널 1: 백엔드 서버 실행
   ```bash
   cd jugobatgo-server
   npm run start:dev
   ```

2. 터미널 2: 백엔드 터널 실행 (새 터미널에서)
   ```bash
   cd jugobatgo-server
   npm run tunnel
   ```
   출력되는 URL (예: `https://xxx.loca.lt`)을 복사하세요.

3. `jugobatgo-app/.env`에 터널 URL 설정:
   ```env
   EXPO_PUBLIC_API_URL=https://xxx.loca.lt
   ```

4. 앱 재시작 (캐시 클리어 권장):
   ```bash
   cd jugobatgo-app
   npx expo start --tunnel --clear
   ```

**터널 연결이 안 될 때 (백엔드 연결 실패):**

- **터널 URL을 브라우저에서 한 번 열기**  
  `https://xxx.loca.lt` 주소를 PC나 폰 브라우저에서 열고, 나오는 "Click to Continue" 버튼을 누른 뒤 앱에서 다시 시도해 보세요. (loca.lt는 첫 접속 시 이 페이지를 보여줍니다.)
- **.env가 적용됐는지 확인**  
  앱을 `npx expo start --tunnel --clear`로 **끈 다음** .env를 수정했으면, 다시 같은 명령으로 실행해야 합니다. 터널을 다시 띄우면 URL이 바뀌므로, 터널 터미널에 나온 **현재 URL**을 .env에 넣었는지 확인하세요.
- **백엔드·터널 모두 실행 중인지 확인**  
  터미널 1: `npm run start:dev`, 터미널 2: `npm run tunnel` 이 둘 다 켜져 있어야 합니다.
- **URL 형식**  
  `EXPO_PUBLIC_API_URL=https://xxx.loca.lt` 처럼 `https://` 포함, 끝에 슬래시 없이 넣습니다.

## 개발 규칙

- TypeScript Strict Mode 사용
- 모든 컴포넌트는 PascalCase로 명명
- Zustand를 사용한 전역 상태 관리
- TanStack Query를 사용한 서버 상태 관리
