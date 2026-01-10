# 주고받고 (JuGo) - Backend

경조사 및 선물 관리 앱 "주고받고"의 NestJS 백엔드 API 서버입니다.

## 기술 스택

- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: Passport.js (JWT)
- **Documentation**: Swagger (OpenAPI 3.0)
- **Language**: TypeScript

## 시작하기

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정하세요.

```bash
cp .env.example .env
```

### 데이터베이스 설정

```bash
# Prisma Client 생성
npm run prisma:generate

# 마이그레이션 실행
npm run prisma:migrate

# Prisma Studio 실행 (데이터베이스 GUI)
npm run prisma:studio
```

### 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

## API 문서

서버 실행 후 http://localhost:3000/api-docs 에서 Swagger API 문서를 확인할 수 있습니다.

## 폴더 구조

```
src/
├── auth/              # 소셜 로그인 및 JWT
├── contacts/          # 주소록 동기화
├── ledger/            # 장부 및 거래 내역
├── ai/                # Gemini 1.5 Flash 연동
├── gold/              # KRX 금 시세 API
├── statistics/        # 통계 데이터 가공
├── common/            # 공통 모듈
│   ├── decorators/    # 커스텀 데코레이터
│   ├── guards/        # 인증/인가 가드
│   └── filters/       # 예외 필터
├── prisma/            # Prisma 서비스
└── main.ts            # 엔트리 포인트
```

## 테스트

```bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## 보안

- JWT Access Token (1시간 만료)
- JWT Refresh Token (14일 만료)
- TLS 1.3 암호화 전송
- 환경 변수를 통한 민감 정보 관리
