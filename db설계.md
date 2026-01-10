Supabase(PostgreSQL)를 기반으로 한 **'주고받고'** 앱의 상세 DB 스키마 설계입니다.

Supabase의 특징인 **Auth(인증), Storage(이미지 저장), RLS(행 레벨 보안)**를 최대한 활용할 수 있도록 설계했습니다.

---

### 1. 데이터베이스 스키마 다이어그램 요약

1.  **profiles**: 사용자 기본 정보 (Supabase Auth와 연동)
2.  **groups**: 장부 그룹 (가족, 친구, 직장 등)
3.  **contacts**: 인맥(연락처) 관리
4.  **transactions**: 주고받은 내역 (현금, 선물, 금)
5.  **gold_rates**: 금 시세 캐싱 데이터
6.  **feedback**: 사용자 의견

---

### 2. 상세 테이블 설계 (SQL)

이 SQL은 Supabase SQL Editor에 바로 복사하여 사용할 수 있는 구조입니다.

#### 2.1. 사용자 프로필 (profiles)
Supabase의 `auth.users` 테이블과 1:1로 대응됩니다.
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  settings jsonb default '{"currency": "KRW", "gold_unit": "don"}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 2.2. 장부 그룹 (groups)
사용자가 설정한 인맥 그룹입니다. (예: 친구, 회사, 시댁)
```sql
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color_code text default '#000000',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 2.3. 인맥 관리 (contacts)
휴대폰 연락처 동기화 및 수동 등록된 인물들입니다.
```sql
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete set null,
  name text not null,
  phone_number text,
  memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 2.4. 거래 내역 (transactions)
가장 핵심이 되는 테이블로 현금, 선물, 금 데이터를 통합 관리합니다.
```sql
create type transaction_type as enum ('GIVE', 'RECEIVE');
create type category_type as enum ('CASH', 'GIFT', 'GOLD');

create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete set null,
  
  type transaction_type not null,      -- GIVE(줌), RECEIVE(받음)
  category category_type not null,    -- CASH, GIFT, GOLD
  
  amount numeric not null default 0,  -- 최종 환산 금액 (통계용)
  original_name text,                 -- 선물명 (예: 정관장 홍삼, 돌반지)
  
  -- 금 관련 상세 데이터 (Category가 GOLD일 때만 사용)
  gold_details jsonb default null,    -- { "purity": "24K", "weight": 3.75, "unit": "g" }
  
  -- AI 분석 및 증빙용 이미지
  image_url text,                     -- Supabase Storage 경로
  
  memo text,
  transaction_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 2.5. 금 시세 캐싱 (gold_rates)
매일 KRX API를 통해 가져온 시세를 저장하여 API 호출을 최소화합니다.
```sql
create table public.gold_rates (
  id bigint generated sign as identity primary key,
  purity text not null,               -- 24K, 18K, 14K
  price_per_gram numeric not null,
  base_date date default current_date unique,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

### 3. 성능 및 분석을 위한 View 설계

#### 3.1. 인물별 주받 온도 및 통계 View
이 뷰를 사용하면 **'주받 온도계'** 수치를 실시간 계산할 필요 없이 바로 조회 가능합니다.
```sql
create or replace view public.contact_statistics as
select
  user_id,
  contact_id,
  sum(case when type = 'GIVE' then amount else 0 end) as total_given,
  sum(case when type = 'RECEIVE' then amount else 0 end) as total_received,
  (sum(case when type = 'GIVE' then amount else 0 end) - sum(case when type = 'RECEIVE' then amount else 0 end)) as balance,
  -- 온도 계산 로직 (PRD 공식 적용)
  case 
    when (sum(case when type = 'GIVE' then amount else 0 end) + sum(case when type = 'RECEIVE' then amount else 0 end)) = 0 then 50
    else 50 + ((sum(case when type = 'GIVE' then amount else 0 end) - sum(case when type = 'RECEIVE' then amount else 0 end)) / 
         (sum(case when type = 'GIVE' then amount else 0 end) + sum(case when type = 'RECEIVE' then amount else 0 end)) * 50)
  end as temperature
from public.transactions
group by user_id, contact_id;
```

---

### 4. Supabase 보안 정책 (RLS) 설정

사용자는 **본인의 데이터만** 읽고 쓸 수 있어야 합니다.

```sql
-- 1. RLS 활성화
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.contacts enable row level security;
alter table public.transactions enable row level security;

-- 2. 정책 설정 (transactions 예시)
create policy "Users can only see their own transactions"
  on public.transactions for all
  using (auth.uid() = user_id);

-- 3. profiles 정책 (본인 것만 수정 가능)
create policy "Users can view and update own profile"
  on public.profiles for all
  using (auth.uid() = id);
```

---

### 5. 설계 포인트 요약

1.  **금 상세 정보(gold_details)**: `jsonb` 타입을 사용하여 `24K`, `무게`, `단위` 등을 유연하게 저장합니다. 나중에 다른 금속(은, 백금)이 추가되어도 스키마 변경이 필요 없습니다.
2.  **이미지 관리**: `transactions` 테이블의 `image_url`은 Supabase Storage에 저장된 파일의 경로를 담습니다. Gemini AI가 이 경로의 이미지를 분석하게 됩니다.
3.  **환산 금액(amount)**: 선물이나 금의 경우 등록 시점의 AI 추정가나 금 시세를 적용하여 `amount` 필드에 숫자로 저장합니다. 이렇게 해야 통계(Graph, 도넛 차트) 쿼리가 매우 빨라집니다.
4.  **확장성**: `groups` 테이블을 통해 사용자가 직접 '시댁', '대학교 동창' 등 무한히 카테고리를 생성할 수 있도록 설계했습니다.

이 구조는 Supabase의 **Auto-generated API**와 잘 맞으며, Flutter나 React Native에서 `supabase-js` 라이브러리를 통해 즉시 CRUD를 구현하기에 최적화되어 있습니다.