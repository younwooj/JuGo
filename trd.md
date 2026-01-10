# [TRD] 경조사 및 선물 관리 앱: 주고받고

## 1. 시스템 아키텍처 (System Architecture)
- **Frontend**: React Native (Expo) - iOS/Android 크로스 플랫폼 대응.
- **Backend**: Node.js (NestJS) - 구조적 설계 및 확장성 확보.
- **Database**: PostgreSQL - 관계형 데이터(인맥, 거래 내역) 관리에 적합.
- **Cache/Queue**: Redis - 금 시세 캐싱 및 푸시 알림 대기열.
- **AI**: Google Gemini 1.5 Flash - 이미지 분석 및 텍스트 기반 가격 추정.
- **Infrastructure**: AWS (EC2, RDS, S3, Lambda).

---

## 2. 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React Native (Expo Router)
- **State Management**: Zustand (가볍고 빠른 전역 상태 관리)
- **Data Fetching**: TanStack Query (v5)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Charts**: Victory Native 또는 React Native Gifted Charts

### Backend
- **Framework**: NestJS
- **ORM**: Prisma (Type-safe 데이터베이스 접근)
- **Auth**: Passport.js (JWT 기반 소셜 로그인)
- **API Documentation**: Swagger (OpenAPI 3.0)

---

## 3. 주요 데이터베이스 모델 (Data Modeling - Prisma Schema)

```prisma
// 유저 정보
model User {
  id              String        @id @default(uuid())
  email           String        @unique
  socialProvider  String        // KAKAO, NAVER, GOOGLE
  ledgers         Ledger[]
  contacts        Contact[]
}

// 연락처 (동기화된 지인 정보)
model Contact {
  id              String        @id @default(uuid())
  userId          String
  name            String
  phoneNumber     String
  ledgerGroupId   String?
  transactions    Transaction[]
  user            User          @relation(fields: [userId], references: [id])
}

// 장부 그룹 (가족, 친구, 회사 등)
model LedgerGroup {
  id              String        @id @default(uuid())
  userId          String
  name            String        // 예: 회사, 고등학교 친구
  transactions    Transaction[]
}

// 거래 내역
model Transaction {
  id              String        @id @default(uuid())
  contactId       String
  ledgerGroupId   String
  type            TransactionType // GIVE (줌), RECEIVE (받음)
  category        Category      // CASH, GIFT, GOLD
  amount          Float         // 환산 금액 (현금은 그대로, 선물/금은 추정치)
  originalName    String?       // 선물명 (예: 정관장 홍삼)
  goldInfo        Json?         // { purity: "24K", weight: 3.75, unit: "돈" }
  memo            String?
  createdAt       DateTime      @default(now())
}

enum TransactionType { GIVE; RECEIVE }
enum Category { CASH; GIFT; GOLD }
```

---

## 4. 폴더 구조 (Folder Structure)

### 4.1. Frontend (React Native - Expo)
```text
jugobatgo-app/
├── assets/                # 이미지, 아이콘, 폰트
├── src/
│   ├── api/               # Axios 인스턴스 및 TanStack Query Hooks
│   ├── components/        # 공통 UI 컴포넌트 (Button, Card, Input 등)
│   │   ├── home/          # 홈 화면 전용 컴포넌트 (Thermometer, SummaryCard)
│   │   ├── ledger/        # 장부 관련 컴포넌트
│   │   └── common/        # 공통 레이아웃
│   ├── constants/         # 색상, 수치, 설정값 (Colors.ts, Config.ts)
│   ├── hooks/             # 커스텀 훅 (useAuth, useGoldPrice)
│   ├── navigation/        # Expo Router 설정 (Tabs, Stack)
│   ├── screens/           # 페이지 단위 스크린
│   │   ├── auth/          # 로그인
│   │   ├── home/          # 홈
│   │   ├── ledger/        # 장부 리스트 및 상세
│   │   ├── stats/         # 통계
│   │   └── gift/          # 선물하기 추천
│   ├── store/             # Zustand 상태 정의 (userStore, ledgerStore)
│   └── utils/             # 유틸리티 함수 (금액 포맷팅, 온도 계산식)
├── app.json
└── package.json
```

### 4.2. Backend (NestJS)
```text
jugobatgo-server/
├── src/
│   ├── auth/              # 소셜 로그인 및 JWT 로직
│   ├── contacts/          # 주소록 동기화 및 관리
│   ├── ledger/            # 장부 및 거래 내역 CRUD
│   ├── ai/                # Gemini 1.5 Flash 연동 (선물 가격 추정)
│   ├── gold/              # KRX 금 시세 API 연동 및 캐싱
│   ├── statistics/        # 통계 데이터 가공 로직
│   ├── common/            # 미들웨어, 가드, 인터셉터, 필터
│   │   ├── decorators/
│   │   ├── guards/
│   │   └── filters/
│   ├── prisma/            # Prisma Client 및 스키마
│   └── main.ts            # 엔트리 포인트
├── prisma/
│   └── schema.prisma      # DB 스키마 정의
├── test/                  # 단위 및 통합 테스트
├── .env                   # 환경 변수 (API_KEY, DB_URL)
└── package.json
```

---

## 5. 핵심 기능 구현 상세

### 5.1. AI 선물 가격 추정 (Gemini 1.5 Flash)
- **Input**: 사용자가 업로드한 사진 또는 상품명 텍스트.
- **Process**:
    1. Backend에서 Gemini API 호출.
    2. Prompt: "이 선물의 현재 대한민국 시장 평균 가격을 원화 단위 숫자로만 알려줘. 상품명: {productName}"
    3. 결과값을 클라이언트에 전달하여 '추정 금액' 자동 입력.

### 5.2. 금 시세 연동
- **API**: 공공데이터포털(KRX 금 시장 정보) 또는 외부 금 시세 API.
- **Logic**:
    - 매일 오전 9시 30분(장 개시 후) 스케줄러를 통해 전일 종가 업데이트 및 Redis 캐싱.
    - 사용자가 `24K, 1돈` 입력 시 `캐싱된 시세 * 1`로 자동 계산.

### 5.3. 주받 온도 계산 (Backend Logic)
```typescript
function calculateTemperature(giveSum: number, receiveSum: number): number {
  if (giveSum + receiveSum === 0) return 50;
  const rawTemp = 50 + ((giveSum - receiveSum) / (giveSum + receiveSum)) * 50;
  return Math.min(Math.max(rawTemp, 0), 100); // 0~100 사이로 클램핑
}
```

---

## 6. 비기능 요구사항 및 보안
- **보안**: 
    - 모든 금융 거래 데이터는 TLS 1.3으로 암호화 전송.
    - JWT Access Token(1시간) 및 Refresh Token(14일) 사용.
    - 개인정보(전화번호 등)는 DB 저장 시 암호화 처리 고려.
- **성능**: 
    - 통계 쿼리 최적화를 위한 거래 내역 인덱싱(`contactId`, `createdAt`).
    - 대량의 연락처 동기화 시 Batch Insert 처리.
- **알림**:
    - Firebase Cloud Messaging(FCM)을 통한 경조사 D-Day 알림 전송.

---

## 7. 단계별 로드맵
1.  **Phase 1**: 소셜 로그인 및 주소록 동기화, 기본 장부 CRUD 개발.
2.  **Phase 2**: 금 시세 API 연동 및 Gemini AI 가격 추정 기능 통합.
3.  **Phase 3**: 주받 온도계 가공 및 통계 차트 시각화.
4.  **Phase 4**: 선물하기 추천(외부 링크) 및 관리자 페이지 구축.