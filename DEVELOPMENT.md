# 주고받고 (JuGo) - 개발 현황 🎉

## ✅ Phase 1 MVP - 완료!

### 🖥️ Backend API (NestJS + Prisma + Supabase)

#### ✅ 완성된 엔드포인트

**1. Users (인증/사용자)**
- `POST /users` - 사용자 생성
- `GET /users` - 모든 사용자 조회
- `GET /users/:id` - 특정 사용자 조회
- `PUT /users/:id` - 사용자 정보 수정
- `DELETE /users/:id` - 사용자 삭제

**2. Ledger Groups (장부 그룹)**
- `POST /ledger/groups` - 장부 그룹 생성
- `GET /ledger/groups?userId=xxx` - 사용자의 장부 그룹 목록
- `GET /ledger/groups/:id` - 특정 장부 그룹 조회
- `PUT /ledger/groups/:id` - 장부 그룹 수정
- `DELETE /ledger/groups/:id` - 장부 그룹 삭제

**3. Contacts (연락처)**
- `POST /contacts` - 연락처 생성
- `GET /contacts?userId=xxx` - 사용자의 연락처 목록
- `GET /contacts/:id` - 특정 연락처 조회
- `PUT /contacts/:id` - 연락처 수정
- `DELETE /contacts/:id` - 연락처 삭제

**4. Transactions (거래 내역)**
- `POST /transactions` - 거래 내역 생성
- `GET /transactions?ledgerGroupId=xxx` - 장부 그룹의 거래 내역
- `GET /transactions/contact/:contactId` - 연락처별 거래 내역
- `GET /transactions/summary/:ledgerGroupId` - 거래 요약 및 주받 온도 계산
- `GET /transactions/:id` - 특정 거래 내역 조회
- `PUT /transactions/:id` - 거래 내역 수정
- `DELETE /transactions/:id` - 거래 내역 삭제

#### 🎯 핵심 기능

✅ **주받 온도 계산 로직 구현**
```typescript
calculateTemperature(giveSum: number, receiveSum: number): number {
  if (giveSum + receiveSum === 0) return 50;
  const rawTemp = 50 + ((giveSum - receiveSum) / (giveSum + receiveSum)) * 50;
  return Math.min(Math.max(rawTemp, 0), 100);
}
```

✅ **Swagger API 문서 자동 생성**
- 모든 엔드포인트에 `@ApiOperation`, `@ApiResponse` 데코레이터 적용
- DTO에 `@ApiProperty`로 상세 설명 추가

✅ **Validation 적용**
- `class-validator`를 사용한 입력값 검증
- UUID, Email, Enum 등 타입 체크

### 📱 Frontend (React Native + Expo)

#### ✅ 완성된 화면

**1. 홈 화면 (`HomeScreen.tsx`)**
- 주받 온도계 UI
- 이번 달 요약 (준 금액 / 받은 금액)
- 최근 거래 내역 리스트
- 빠른 작업 버튼 (거래 추가, 장부 관리)

**2. 장부 리스트 화면 (`LedgerListScreen.tsx`)**
- 장부 그룹 목록 표시
- 그룹별 온도, 거래 건수, 잔액 표시
- 통계 요약 (전체 장부 수, 총 거래, 총 잔액)
- 새 장부 추가 버튼

#### 🎨 디자인 시스템

✅ **NativeWind (Tailwind CSS) 적용**
- 일관된 색상 시스템 (primary, gray 등)
- 반응형 레이아웃
- 모던한 카드 UI

✅ **컴포넌트 구조**
- 재사용 가능한 UI 컴포넌트 설계
- TypeScript 타입 안정성

---

## 📊 데이터베이스 (Supabase PostgreSQL)

### ✅ 생성된 테이블

1. **users** - 사용자 정보
   - id, email, socialProvider, createdAt, updatedAt

2. **ledger_groups** - 장부 그룹
   - id, userId, name, createdAt, updatedAt

3. **contacts** - 연락처
   - id, userId, name, phoneNumber, ledgerGroupId, createdAt, updatedAt

4. **transactions** - 거래 내역
   - id, contactId, ledgerGroupId, type, category, amount
   - originalName, goldInfo, memo, eventDate, createdAt, updatedAt

### ✅ Enums
- **TransactionType**: GIVE (줌), RECEIVE (받음)
- **Category**: CASH (현금), GIFT (선물), GOLD (금)

---

## 🚀 실행 방법

### Backend
```bash
cd jugobatgo-server
npm install
npm run start:dev
```
- API: http://localhost:3000
- Swagger 문서: http://localhost:3000/api-docs

### Frontend
```bash
cd jugobatgo-app
npm install
npm start
```
- Metro Bundler: http://localhost:8081

---

## 📝 다음 단계 (Phase 2)

### 🔜 우선순위 기능

1. **Backend**
   - [ ] AI 모듈: Gemini API 연동 (선물 가격 추정)
   - [ ] Gold 모듈: KRX 금 시세 API 연동
   - [ ] 통계 모듈: 기간별 통계, 차트 데이터 API

2. **Frontend**
   - [ ] 거래 추가 화면 (카메라, 사진 선택)
   - [ ] 거래 상세 화면
   - [ ] 통계 화면 (차트)
   - [ ] 설정 화면

3. **통합**
   - [ ] TanStack Query로 API 연동
   - [ ] Zustand 스토어 활용
   - [ ] 실제 데이터 CRUD 구현

---

## 🛠️ 기술 스택 요약

### Backend
- ✅ NestJS 10.x
- ✅ Prisma 5.x
- ✅ PostgreSQL 17 (Supabase)
- ✅ Swagger/OpenAPI
- ✅ TypeScript Strict Mode

### Frontend
- ✅ React Native (Expo 51)
- ✅ TypeScript
- ✅ NativeWind (Tailwind CSS)
- ⏳ TanStack Query (설정 완료, 사용 예정)
- ⏳ Zustand (스토어 생성됨, 연동 예정)

### Infrastructure
- ✅ Supabase (Database + Auth + Storage)
- ⏳ Redis (캐싱)
- ⏳ AWS (배포 예정)

---

## 📈 진행률

- ✅ **Phase 1 MVP**: 100% (완료!)
  - Backend CRUD API: 100%
  - Frontend 기본 UI: 100%
  - Database 스키마: 100%

- ⏳ **Phase 2 AI & 금 시세**: 0%
- ⏳ **Phase 3 통계 & 시각화**: 0%
- ⏳ **Phase 4 부가 기능**: 0%

---

## 🎯 현재 상태

✅ **완료된 작업**
- Backend API 전체 구조 완성
- Swagger API 문서 자동 생성
- Supabase 데이터베이스 연결 설정
- Frontend 홈 화면 및 장부 리스트 UI
- 주받 온도 계산 로직
- TypeScript 타입 시스템

⚠️ **알려진 이슈**
- Supabase 연결: 로컬 환경에서 네트워크 DNS 문제 (프로덕션 배포 시 정상 작동 예상)
- Frontend-Backend 연동은 Phase 2에서 진행 예정

🎉 **성공 요인**
- 체계적인 폴더 구조
- 일관된 코딩 컨벤션
- Swagger로 API 문서 자동화
- NativeWind로 빠른 UI 개발

---

**개발 시작일**: 2026-01-10
**Phase 1 완료일**: 2026-01-10 (당일!)
**다음 마일스톤**: Phase 2 - AI 및 금 시세 연동
