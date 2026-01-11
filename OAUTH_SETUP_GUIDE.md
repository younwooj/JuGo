# Supabase OAuth 설정 가이드

## ✅ 완료된 작업
1. **Supabase 프로젝트**: `Jugo` (jphniirhmwqjcncmgreb)
2. **환경 변수 설정**: `.env` 파일에 추가 완료
   - `EXPO_PUBLIC_SUPABASE_URL`: https://jphniirhmwqjcncmgreb.supabase.co
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: 설정 완료

---

## 🔧 OAuth 제공자 설정 방법

### 1. Google OAuth 설정

#### Step 1: Google Cloud Console
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 → 사용자 인증 정보** 이동

#### Step 2: OAuth 2.0 클라이언트 ID 생성
1. **+ 사용자 인증 정보 만들기** 클릭
2. **OAuth 클라이언트 ID** 선택
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `Jugo App`

#### Step 3: 승인된 리디렉션 URI 추가
```
https://jphniirhmwqjcncmgreb.supabase.co/auth/v1/callback
```

#### Step 4: 클라이언트 ID 복사
- 생성 후 **클라이언트 ID**와 **클라이언트 보안 비밀** 복사

#### Step 5: Supabase에 설정
1. https://app.supabase.com/project/jphniirhmwqjcncmgreb/auth/providers 접속
2. **Google** 제공자 찾기
3. **Enable** 토글 ON
4. **Client ID** 입력
5. **Client Secret** 입력
6. **Save** 클릭

---

### 2. Kakao OAuth 설정

#### Step 1: Kakao Developers
1. https://developers.kakao.com 접속
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름: `주고받고 (JuGo)`
4. 사업자명: 개인 이름

#### Step 2: 플랫폼 설정
1. 생성한 앱 선택
2. **플랫폼** → **Web 플랫폼 추가**
3. 사이트 도메인: `http://localhost:8083`

#### Step 3: Redirect URI 설정
1. **카카오 로그인** → **활성화 설정** ON
2. **Redirect URI** 등록:
```
https://jphniirhmwqjcncmgreb.supabase.co/auth/v1/callback
```

#### Step 4: 동의 항목 설정
1. **카카오 로그인** → **동의 항목**
2. 필수 동의: 
   - 이메일 (email)
   - 닉네임 (nickname)

#### Step 5: 키 복사
1. **앱 설정** → **앱 키**
2. **REST API 키** 복사

#### Step 6: Supabase에 설정
1. https://app.supabase.com/project/jphniirhmwqjcncmgreb/auth/providers 접속
2. **Kakao** 제공자 찾기
3. **Enable** 토글 ON
4. **Client ID**: REST API 키 입력
5. **Save** 클릭

---

## 🚀 빠른 설정 방법 (권장)

### Supabase Dashboard 직접 접속
👉 **Auth 설정 페이지**: https://app.supabase.com/project/jphniirhmwqjcncmgreb/auth/providers

여기서 직접:
1. Google 제공자 활성화
2. Kakao 제공자 활성화
3. 각 제공자의 Client ID/Secret 입력

---

## 📝 현재 상태

### ✅ 완료
- Supabase 프로젝트 생성
- 환경 변수 설정 (.env)
- 프론트엔드 서버 재시작
- Supabase 연동 준비 완료

### ⏳ 필요한 작업
1. **Google OAuth 클라이언트 ID 생성** (선택사항)
2. **Kakao 개발자 앱 생성** (선택사항)
3. **Supabase에 OAuth 제공자 설정** (선택사항)

---

## 💡 테스트 방법

### 현재 사용 가능한 로그인 방법:
1. **게스트 모드** ✅ (즉시 사용 가능)
2. **이메일 로그인** ✅ (즉시 사용 가능)

### OAuth 설정 후:
3. **Google 로그인** (설정 필요)
4. **Kakao 로그인** (설정 필요)

---

## 🎯 추천 순서

OAuth 설정이 복잡하다면:

1. **지금 당장**: 게스트 모드나 이메일 로그인으로 앱 테스트
2. **나중에**: OAuth 제공자 설정 (필요할 때)

OAuth 없이도 모든 기능을 테스트할 수 있습니다!

---

## 📞 도움이 필요하면

OAuth 설정 중 문제가 있으면:
- Google: https://developers.google.com/identity/protocols/oauth2
- Kakao: https://developers.kakao.com/docs/latest/ko/kakaologin/common
- Supabase: https://supabase.com/docs/guides/auth/social-login

---

**작성일**: 2026-01-11  
**Supabase 프로젝트**: Jugo (jphniirhmwqjcncmgreb)  
**리전**: ap-northeast-2 (서울)
