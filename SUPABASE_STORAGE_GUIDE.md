# Supabase Storage 설정 가이드

## 📦 1. Supabase 프로젝트 설정

### 1.1. Storage Bucket 생성

1. [Supabase Dashboard](https://app.supabase.com/)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Storage** 클릭
4. **Create a new bucket** 버튼 클릭
5. 설정:
   - **Name**: `transaction-images`
   - **Public bucket**: ✅ 체크 (공개 버킷)
   - **File size limit**: `5MB` (권장)
   - **Allowed MIME types**: `image/*` (이미지만 허용)

### 1.2. Storage 정책 설정 (Optional)

보안을 강화하려면 RLS(Row Level Security) 정책을 설정할 수 있습니다.

```sql
-- 모든 사용자가 이미지를 업로드할 수 있도록 허용
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'transaction-images');

-- 모든 사용자가 이미지를 읽을 수 있도록 허용
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'transaction-images');

-- 소유자만 이미지를 삭제할 수 있도록 허용
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'transaction-images' AND auth.uid() = owner);
```

---

## 🔑 2. 환경 변수 설정

### 2.1. Supabase 프로젝트 정보 확인

1. Supabase Dashboard > **Settings** > **API**
2. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2.2. 프론트엔드 환경 변수 (.env)

`jugobatgo-app/.env` 파일에 추가:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**주의사항:**
- `EXPO_PUBLIC_` 접두사가 필수입니다 (Expo 환경 변수 규칙)
- `.env` 파일은 `.gitignore`에 포함되어 있는지 확인
- 실제 프로덕션 환경에서는 더 안전한 방법을 사용

---

## 📱 3. 사용 방법

### 3.1. 이미지 업로드

```typescript
import { uploadImage } from '../src/api/storage';

// 사용 예시
const imageUri = 'file:///path/to/image.jpg';
const publicUrl = await uploadImage(imageUri);
console.log('업로드된 이미지 URL:', publicUrl);
```

### 3.2. 여러 이미지 업로드

```typescript
import { uploadImages } from '../src/api/storage';

const imageUris = ['file:///path/1.jpg', 'file:///path/2.jpg'];
const publicUrls = await uploadImages(imageUris);
console.log('업로드된 이미지 URLs:', publicUrls);
```

### 3.3. 이미지 삭제

```typescript
import { deleteImage } from '../src/api/storage';

const imageUrl = 'https://your-project.supabase.co/storage/v1/object/public/transaction-images/123-image.jpg';
await deleteImage(imageUrl);
console.log('이미지 삭제 완료');
```

---

## 🔧 4. 트러블슈팅

### 문제 1: "Invalid API key" 에러
**원인:** 환경 변수가 올바르게 설정되지 않음  
**해결:**
1. `.env` 파일에 올바른 키가 있는지 확인
2. 앱을 재시작 (`npx expo start --clear`)
3. 환경 변수 접두사 확인 (`EXPO_PUBLIC_`)

### 문제 2: "Bucket not found" 에러
**원인:** Storage bucket이 생성되지 않음  
**해결:**
1. Supabase Dashboard에서 `transaction-images` bucket 확인
2. Bucket 이름이 코드와 일치하는지 확인

### 문제 3: "Permission denied" 에러
**원인:** Storage 정책이 올바르게 설정되지 않음  
**해결:**
1. Bucket을 **Public**으로 설정
2. 또는 RLS 정책 추가 (위 1.2 참고)

### 문제 4: 이미지 업로드는 되지만 보이지 않음
**원인:** Bucket이 Private로 설정됨  
**해결:**
1. Storage > `transaction-images` > Settings
2. **Public access** 활성화

---

## 📊 5. Storage 사용량 모니터링

### 5.1. 용량 확인
- Supabase Dashboard > **Storage** > **Usage**
- 무료 플랜: 1GB 스토리지 제공
- 초과 시 유료 플랜으로 업그레이드 필요

### 5.2. 파일 관리
- 불필요한 이미지는 정기적으로 삭제
- 이미지 압축을 통해 용량 절약
- 썸네일 생성을 통해 로딩 속도 개선

---

## 🎨 6. 이미지 최적화 팁

### 6.1. 업로드 전 이미지 압축

```typescript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.7,  // 압축률 (0.0 ~ 1.0)
});
```

### 6.2. 이미지 크기 제한

```typescript
// storage.ts에서 파일 크기 체크
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const response = await fetch(uri);
const blob = await response.blob();

if (blob.size > MAX_FILE_SIZE) {
  throw new Error('이미지 크기는 5MB 이하여야 합니다');
}
```

---

## 🔐 7. 보안 고려사항

### 7.1. 인증된 사용자만 업로드 허용

현재는 모든 사용자가 업로드 가능하지만, 프로덕션 환경에서는:

```typescript
// 인증 토큰과 함께 업로드
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

// 로그인된 사용자만 업로드
const { data: session } = await supabase.auth.getSession();
if (!session) {
  throw new Error('로그인이 필요합니다');
}
```

### 7.2. 파일명 난독화

```typescript
// 원본 파일명 대신 UUID 사용
import { v4 as uuidv4 } from 'uuid';

const filename = `${uuidv4()}.jpg`;
```

---

## 📚 8. 추가 리소스

- [Supabase Storage 공식 문서](https://supabase.com/docs/guides/storage)
- [Expo Image Picker 문서](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [React Native Image 최적화](https://reactnative.dev/docs/image#cache-control-ios-only)

---

**작성일**: 2026-01-10  
**최종 업데이트**: 2026-01-10
