# 주고받고 (JuGo) 프로젝트 개발 규칙

## 프로젝트 개요
경조사 및 선물 관리 앱 "주고받고"를 개발합니다. React Native(Expo)로 iOS/Android 앱을, NestJS로 백엔드 API를 구축합니다.

---

## 기술 스택 준수 사항

### Frontend (React Native - Expo)
- **프레임워크**: React Native with Expo Router 사용
- **상태 관리**: Zustand만 사용 (Redux, MobX 금지)
- **데이터 페칭**: TanStack Query v5 사용
- **스타일링**: NativeWind (Tailwind CSS for React Native) 사용
- **차트**: Victory Native 또는 React Native Gifted Charts 사용
- **폴더 구조**:
  ```
  src/
  ├── api/           # Axios 인스턴스 및 TanStack Query Hooks
  ├── components/    # 재사용 가능한 UI 컴포넌트
  │   ├── home/      # 홈 화면 전용 (Thermometer, SummaryCard)
  │   ├── ledger/    # 장부 관련 컴포넌트
  │   └── common/    # 공통 레이아웃
  ├── constants/     # Colors.ts, Config.ts
  ├── hooks/         # useAuth, useGoldPrice 등
  ├── navigation/    # Expo Router 설정
  ├── screens/       # 페이지 단위 스크린
  ├── store/         # Zustand 스토어
  └── utils/         # 유틸리티 함수
  ```

### Backend (NestJS)
- **프레임워크**: NestJS 사용
- **ORM**: Prisma (Type-safe 데이터베이스 접근)
- **인증**: Passport.js (JWT 기반 소셜 로그인)
- **API 문서**: Swagger (OpenAPI 3.0)
- **폴더 구조**:
  ```
  src/
  ├── auth/          # 소셜 로그인 및 JWT
  ├── contacts/      # 주소록 동기화
  ├── ledger/        # 장부 및 거래 내역
  ├── ai/            # Gemini 1.5 Flash 연동
  ├── gold/          # KRX 금 시세 API
  ├── statistics/    # 통계 데이터 가공
  ├── common/        # 미들웨어, 가드, 인터셉터
  ├── prisma/        # Prisma Client
  └── main.ts
  ```

---

## 데이터베이스 규칙

### Prisma 스키마 준수
다음 모델을 기준으로 데이터베이스 설계:
- **User**: 소셜 로그인 사용자 정보
- **Contact**: 동기화된 연락처
- **LedgerGroup**: 장부 그룹 (가족, 친구, 회사 등)
- **Transaction**: 거래 내역 (GIVE/RECEIVE, CASH/GIFT/GOLD)

### 필수 필드 및 타입
- `id`: String (@id @default(uuid()))
- `createdAt`: DateTime (@default(now()))
- `Transaction.type`: TransactionType enum (GIVE, RECEIVE)
- `Transaction.category`: Category enum (CASH, GIFT, GOLD)
- `Transaction.goldInfo`: Json 타입 (순도, 무게, 단위 저장)

---

## 핵심 기능 구현 규칙

### 1. AI 선물 가격 추정 (Gemini 1.5 Flash)
- **입력**: 사진 또는 상품명 텍스트
- **프롬프트 형식**: "이 선물의 현재 대한민국 시장 평균 가격을 원화 단위 숫자로만 알려줘. 상품명: {productName}"
- Backend의 `/ai` 모듈에서 처리
- 에러 처리: API 실패 시 사용자에게 수동 입력 안내

### 2. 금 시세 연동
- **API**: KRX 금 시장 정보 (공공데이터포털) 또는 외부 금 시세 API
- **캐싱**: Redis에 전일 종가 저장
- **스케줄러**: 매일 오전 9시 30분 자동 업데이트
- **계산 로직**: `24K 1돈` 입력 시 `캐싱된 시세 * 무게`로 자동 계산

### 3. 주받 온도 계산
다음 공식을 Backend에서 구현:
```typescript
function calculateTemperature(giveSum: number, receiveSum: number): number {
  if (giveSum + receiveSum === 0) return 50;
  const rawTemp = 50 + ((giveSum - receiveSum) / (giveSum + receiveSum)) * 50;
  return Math.min(Math.max(rawTemp, 0), 100); // 0~100 사이로 클램핑
}
```

---

## 보안 및 성능 규칙

### 보안
- 모든 API는 **TLS 1.3** 암호화 전송
- **JWT 토큰**:
  - Access Token: 1시간 만료
  - Refresh Token: 14일 만료
- 개인정보(전화번호 등)는 DB 저장 시 암호화 처리
- `.env` 파일은 절대 Git에 커밋하지 않음 (`.gitignore` 필수)

### 성능
- 거래 내역 인덱싱: `contactId`, `createdAt` 필드에 인덱스 추가
- 대량 연락처 동기화 시 **Batch Insert** 처리
- Redis 캐싱 활용: 금 시세, 자주 조회되는 통계 데이터

### 알림
- **Firebase Cloud Messaging(FCM)** 사용
- 경조사 D-Day 알림 전송

---

## 코딩 컨벤션

### TypeScript
- **Strict Mode** 활성화 (`tsconfig.json`에 `"strict": true`)
- 모든 함수와 변수는 명시적 타입 선언
- `any` 타입 사용 금지 (불가피한 경우 `unknown` 사용 후 타입 가드)

### 네이밍 컨벤션
- **변수/함수**: camelCase (`getUserInfo`, `goldPrice`)
- **컴포넌트**: PascalCase (`HomeScreen`, `LedgerCard`)
- **상수**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRY_COUNT`)
- **파일명**: 
  - 컴포넌트: PascalCase.tsx (`HomeScreen.tsx`)
  - 유틸리티: camelCase.ts (`formatCurrency.ts`)

### 주석
- 복잡한 비즈니스 로직은 반드시 주석 추가
- API 엔드포인트는 Swagger 데코레이터로 문서화
- 함수 시그니처 위에 JSDoc 주석 작성 권장

---

## Git 규칙

### 브랜치 전략
- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드 설정, 패키지 매니저 등
```

예시:
```
feat: 금 시세 API 연동 및 Redis 캐싱 구현
fix: 주받 온도 계산 시 0으로 나누기 오류 수정
```

---

## 개발 단계별 우선순위

### Phase 1: 기본 기능 (MVP)
1. 소셜 로그인 (카카오, 네이버, 구글)
2. 주소록 동기화
3. 장부 CRUD (생성, 조회, 수정, 삭제)
4. 거래 내역 등록 (현금만)

### Phase 2: AI 및 금 시세
1. Gemini AI 선물 가격 추정
2. KRX 금 시세 연동
3. 금 거래 내역 자동 계산

### Phase 3: 통계 및 시각화
1. 주받 온도계 구현
2. 통계 차트 (Victory Native)
3. 기간별 필터링

### Phase 4: 부가 기능
1. 선물하기 추천 (외부 링크)
2. 경조사 알림 (FCM)
3. 관리자 페이지

---

## 의존성 관리

### Package.json 규칙
- **버전 고정**: `^`나 `~` 사용 금지 (정확한 버전 명시)
- **주요 패키지**:
  - Frontend: `expo`, `react-native`, `zustand`, `@tanstack/react-query`, `nativewind`
  - Backend: `@nestjs/core`, `@prisma/client`, `passport-jwt`, `@nestjs/swagger`
- 불필요한 패키지 설치 금지

---

## 테스트 규칙

### Backend 테스트
- **단위 테스트**: Jest 사용, 각 서비스 로직 테스트
- **통합 테스트**: E2E 테스트로 API 엔드포인트 검증
- 테스트 커버리지 **최소 70%** 유지

### Frontend 테스트
- **컴포넌트 테스트**: React Native Testing Library 사용
- **핵심 화면**: 홈, 장부 리스트, 거래 등록 화면 우선 테스트

---

## 환경 변수 관리

### Backend `.env` 예시
```env
DATABASE_URL="postgresql://user:password@localhost:5432/jugobatgo"
JWT_SECRET="your-secret-key"
GEMINI_API_KEY="your-gemini-api-key"
GOLD_API_KEY="your-gold-api-key"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### Frontend `.env` 예시
```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

---

## 문서화

### README.md 필수 포함 내용
1. 프로젝트 소개
2. 설치 방법 (`npm install`, `prisma migrate`)
3. 실행 방법 (`npm run dev`)
4. 환경 변수 설정 가이드
5. 폴더 구조 설명

### API 문서
- Swagger UI (`/api-docs` 경로)에서 모든 엔드포인트 확인 가능하도록 설정

---

## 추가 참고 사항

### 인프라
- **AWS 서비스**: EC2 (서버), RDS (PostgreSQL), S3 (이미지 저장), Lambda (스케줄러)
- **Redis**: ElastiCache 사용 권장

### 외부 API
- **소셜 로그인**: 카카오 Developers, 네이버 Developers, Google Cloud Console
- **금 시세**: 공공데이터포털 API Key 필수
- **AI**: Google AI Studio에서 Gemini API Key 발급

---

이 규칙을 준수하여 일관성 있고 확장 가능한 코드를 작성하세요.
