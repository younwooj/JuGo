# Supabase 설정 완료! 🎉

## ✅ Jugo 프로젝트 정보

- **프로젝트 이름**: Jugo
- **프로젝트 ID**: `jphniirhmwqjcncmgreb`
- **리전**: ap-northeast-2 (Seoul, Korea) 🇰🇷
- **상태**: ACTIVE_HEALTHY ✅
- **Database**: PostgreSQL 17.6.1
- **생성일**: 2026-01-10

## 🗄️ 생성된 데이터베이스 스키마

다음 테이블들이 성공적으로 생성되었습니다:

### ✅ Tables
1. **users** - 사용자 정보
   - id, email, socialProvider, createdAt, updatedAt
   
2. **ledger_groups** - 장부 그룹
   - id, userId, name, createdAt, updatedAt
   
3. **contacts** - 연락처
   - id, userId, name, phoneNumber, ledgerGroupId, createdAt, updatedAt
   
4. **transactions** - 거래 내역
   - id, contactId, ledgerGroupId, type, category, amount
   - originalName, goldInfo, memo, eventDate
   - createdAt, updatedAt

### ✅ Enums
- **TransactionType**: GIVE, RECEIVE
- **Category**: CASH, GIFT, GOLD

### ✅ Features
- UUID 기본키
- Foreign Key 제약조건 (Cascade 삭제)
- 인덱스 최적화 (userId, phoneNumber, contactId, createdAt)
- 자동 updatedAt 트리거

---

## 🔐 필수: 데이터베이스 비밀번호 설정

`.env` 파일에서 `[YOUR-PASSWORD]`를 실제 Supabase 데이터베이스 비밀번호로 교체해야 합니다.

### 비밀번호를 찾는 방법:

1. [Supabase 대시보드](https://supabase.com/dashboard/project/jphniirhmwqjcncmgreb/settings/database) 접속
2. **Settings** → **Database** 메뉴로 이동
3. **Connection string** 섹션에서 비밀번호 확인
4. 또는 **Reset database password**로 새 비밀번호 생성

### .env 파일 수정:

```bash
# jugobatgo-server/.env 파일 열기
# [YOUR-PASSWORD]를 실제 비밀번호로 교체

DATABASE_URL="postgresql://postgres.jphniirhmwqjcncmgreb:실제비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.jphniirhmwqjcncmgreb:실제비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

---

## 🚀 서버 시작하기

비밀번호 설정 후:

```bash
cd C:\pyproject\JuGo\jugobatgo-server

# 서버 시작
npm run start:dev
```

서버가 성공적으로 시작되면:
- 🌐 Backend API: http://localhost:3000
- 📚 Swagger 문서: http://localhost:3000/api-docs

---

## 🔑 Supabase 연결 정보

### Supabase URL
```
https://jphniirhmwqjcncmgreb.supabase.co
```

### Anon Key (Public - Frontend용)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaG5paXJobXdxamNuY21ncmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjExMTIsImV4cCI6MjA4MzU5NzExMn0.e2S8spUgP8IPqJYvXILm0XRL8002nosyXDW5dDlSgPk
```

### Database Host
```
db.jphniirhmwqjcncmgreb.supabase.co
```

---

## 📱 Frontend 설정

Frontend에서도 Supabase를 사용하려면 `jugobatgo-app/.env` 파일에 추가:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://jphniirhmwqjcncmgreb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaG5paXJobXdxamNuY21ncmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjExMTIsImV4cCI6MjA4MzU5NzExMn0.e2S8spUgP8IPqJYvXILm0XRL8002nosyXDW5dDlSgPk
```

---

## 🛠️ Supabase 추가 기능 활용

### 1. Row Level Security (RLS) 설정

보안을 위해 RLS를 활성화하고 정책을 설정하세요:

```sql
-- Supabase SQL Editor에서 실행
-- https://supabase.com/dashboard/project/jphniirhmwqjcncmgreb/editor/sql

-- Users 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid()::text = id);

-- Contacts 테이블 RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contacts"
ON contacts FOR ALL
USING (auth.uid()::text = "userId");

-- Ledger Groups 테이블 RLS
ALTER TABLE ledger_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ledger groups"
ON ledger_groups FOR ALL
USING (auth.uid()::text = "userId");

-- Transactions 테이블 RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ledger_groups
    WHERE ledger_groups.id = transactions."ledgerGroupId"
    AND ledger_groups."userId" = auth.uid()::text
  )
);
```

### 2. Supabase Auth 통합

Supabase의 내장 인증 시스템을 사용할 수 있습니다:

```typescript
// Frontend에서 Supabase Auth 사용
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

// 소셜 로그인
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});
```

### 3. Supabase Storage

선물 이미지 업로드를 위한 스토리지:

```typescript
// 버킷 생성 (Supabase 대시보드에서)
// Storage → Create Bucket → "gift-images"

// 이미지 업로드
const { data, error } = await supabase.storage
  .from('gift-images')
  .upload(`${userId}/${fileName}.jpg`, file);
```

### 4. Realtime 구독

실시간 데이터 변경 감지:

```typescript
// 거래 내역 실시간 업데이트
supabase
  .channel('transactions')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'transactions' },
    (payload) => {
      console.log('Change detected:', payload);
      // 상태 업데이트
    }
  )
  .subscribe();
```

---

## 🔍 데이터베이스 관리 도구

### 1. Supabase Studio (웹 기반) 🌐
- **테이블 에디터**: https://supabase.com/dashboard/project/jphniirhmwqjcncmgreb/editor
- **SQL 에디터**: https://supabase.com/dashboard/project/jphniirhmwqjcncmgreb/sql/new
- **데이터베이스**: https://supabase.com/dashboard/project/jphniirhmwqjcncmgreb/database/tables

### 2. Prisma Studio (로컬) 💻
```bash
cd jugobatgo-server
npx prisma studio
```
http://localhost:5555 에서 데이터 관리 가능

---

## 📞 문제 해결

### 연결 오류가 발생하면:
1. ✅ 비밀번호가 올바른지 확인
2. ✅ Supabase 프로젝트가 활성 상태인지 확인
3. ✅ 방화벽이 포트 5432, 6543을 차단하지 않는지 확인
4. ✅ VPN 사용 시 연결 확인

### Backend 서버가 시작되지 않으면:
```bash
# .env 파일 확인
cat .env

# Prisma Client 재생성
npx prisma generate

# 데이터베이스 연결 테스트
npx prisma db pull
```

### 마이그레이션 추가가 필요하면:
```bash
# 스키마 변경 후
npx prisma migrate dev --name add_new_feature

# 또는 Supabase SQL Editor에서 직접 실행
```

---

## 📊 유용한 SQL 쿼리

### 전체 테이블 확인
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 데이터 통계
```sql
-- 사용자 수
SELECT COUNT(*) FROM users;

-- 거래 내역 요약
SELECT 
  type,
  category,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
GROUP BY type, category;
```

### 주받 온도 계산
```sql
-- 특정 장부의 주받 온도
WITH stats AS (
  SELECT 
    SUM(CASE WHEN type = 'GIVE' THEN amount ELSE 0 END) as give_sum,
    SUM(CASE WHEN type = 'RECEIVE' THEN amount ELSE 0 END) as receive_sum
  FROM transactions
  WHERE "ledgerGroupId" = 'your-ledger-group-id'
)
SELECT 
  give_sum,
  receive_sum,
  CASE 
    WHEN (give_sum + receive_sum) = 0 THEN 50
    ELSE 50 + ((give_sum - receive_sum) / (give_sum + receive_sum)) * 50
  END as temperature
FROM stats;
```

---

## 💡 다음 단계

1. ✅ 데이터베이스 스키마 생성 완료
2. ⏳ 비밀번호 설정 (필수!)
3. ⏳ Backend 서버 시작
4. ⏳ RLS 정책 설정 (보안)
5. ⏳ Frontend와 Supabase 통합
6. ⏳ Supabase Auth 구현
7. ⏳ Storage 버킷 생성 (이미지 업로드용)

---

## 🌟 Supabase 장점

✅ **무료 티어**: 
- 500MB 데이터베이스
- 1GB 파일 스토리지
- 50,000 MAU (월간 활성 사용자)

✅ **자동 백업**: 일일 자동 백업

✅ **실시간 데이터**: WebSocket 기반 실시간 구독

✅ **RESTful API**: 자동 생성되는 API

✅ **GraphQL**: PostgREST를 통한 GraphQL 지원

✅ **서버리스**: 인프라 관리 불필요

---

**도움이 필요하면**: 
- 📖 [Supabase 문서](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 🎓 [Supabase YouTube](https://www.youtube.com/c/supabase)
