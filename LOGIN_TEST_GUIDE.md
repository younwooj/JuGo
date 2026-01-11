# 로그인/회원가입 수정 완료 및 테스트 가이드

## ✅ 수정 완료 사항

### 1. React Native Alert → 웹 호환 alert() 변경
- ❌ **문제**: React Native의 `Alert.alert()`는 웹에서 작동하지 않음
- ✅ **해결**: 웹 네이티브 `alert()` 및 `confirm()` 사용
- 📱 **모바일**: 나중에 React Native Alert로 조건부 처리 가능

### 2. 콘솔 로그 추가
- 모든 주요 동작에 `console.log()` 추가
- 브라우저 개발자 도구(F12)에서 실시간 확인 가능

### 3. 개선된 기능
- ✅ 회원가입 완료 시 즉시 `alert()` 표시
- ✅ 로그인 성공 시 바로 홈 화면 이동 (alert 제거)
- ✅ 게스트 모드 `confirm()` 다이얼로그
- ✅ 모든 에러 메시지 `alert()`로 표시

---

## 🧪 테스트 방법

### 1. 브라우저 개발자 도구 열기
1. Chrome/Edge: **F12** 또는 **Ctrl+Shift+I**
2. **Console** 탭 클릭
3. 이제 모든 동작을 콘솔에서 확인할 수 있습니다!

### 2. 회원가입 테스트
```
1. http://localhost:8083 접속
2. F12 눌러서 콘솔 열기
3. "회원가입" 클릭
4. 이메일, 비밀번호, 비밀번호 확인 입력
5. "회원가입" 버튼 클릭
6. 콘솔에서 로그 확인:
   === handleEmailLogin 시작 ===
   isSignUp: true
   email: test@example.com
   ...
7. alert 팝업 확인: "✅ 회원가입 완료!"
```

### 3. 게스트 모드 테스트
```
1. "게스트로 둘러보기" 클릭
2. 콘솔에서 로그 확인:
   === 게스트 모드 클릭 ===
3. confirm 다이얼로그 확인
4. "확인" 클릭
5. 콘솔에서 "홈으로 이동" 확인
6. 자동으로 홈 화면 이동
```

### 4. 로그인 테스트
```
1. 이메일 인증 완료 후
2. 로그인 모드로 전환
3. 이메일, 비밀번호 입력
4. "로그인" 버튼 클릭
5. 콘솔에서 로그 확인:
   === handleEmailLogin 시작 ===
   로그인 시도...
   로그인 응답: {...}
   로그인 성공! 홈으로 이동
6. 자동으로 홈 화면 이동
```

---

## 🔍 문제 해결

### 여전히 반응이 없다면?

#### 1. 콘솔에서 에러 확인
```
F12 → Console 탭
빨간색 에러 메시지가 있는지 확인
```

#### 2. 네트워크 탭 확인
```
F12 → Network 탭
버튼 클릭 시 API 요청이 가는지 확인
```

#### 3. 캐시 삭제
```
Ctrl + Shift + R (강력 새로고침)
또는
F12 → Network 탭 → "Disable cache" 체크
```

#### 4. 로그 확인
```
콘솔에 "=== handleEmailLogin 시작 ===" 또는
"=== 게스트 모드 클릭 ===" 이 나타나야 합니다.

나타나지 않으면 이벤트 핸들러가 연결되지 않은 것입니다.
```

---

## 📱 모바일 앱으로 테스트하고 싶다면?

### 옵션 1: Expo Go 앱 (권장)

#### Android:
```bash
# 1. 핸드폰에 Expo Go 설치
Google Play Store에서 "Expo Go" 검색 후 설치

# 2. 개발 서버 시작 (이미 실행 중)
cd jugobatgo-app
npx expo start

# 3. QR 코드 스캔
터미널에 표시된 QR 코드를 Expo Go 앱으로 스캔
```

#### iOS:
```bash
# 1. 핸드폰에 Expo Go 설치
App Store에서 "Expo Go" 검색 후 설치

# 2. 같은 방법으로 QR 코드 스캔
iPhone 카메라 앱으로도 스캔 가능
```

### 옵션 2: Android 에뮬레이터

#### 설치:
```bash
# 1. Android Studio 설치
https://developer.android.com/studio 에서 다운로드

# 2. AVD Manager에서 가상 기기 생성
Tools → AVD Manager → Create Virtual Device
Pixel 5 또는 Pixel 6 추천

# 3. 에뮬레이터 실행
AVD Manager에서 Play 버튼 클릭

# 4. Expo 앱 실행
cd jugobatgo-app
npx expo start
터미널에서 'a' 키 입력 (Run on Android)
```

### 옵션 3: iOS 시뮬레이터 (Mac만 가능)

```bash
# 1. Xcode 설치 (Mac App Store)

# 2. Command Line Tools 설치
xcode-select --install

# 3. 시뮬레이터 실행
cd jugobatgo-app
npx expo start
터미널에서 'i' 키 입력 (Run on iOS)
```

---

## 💡 권장 사항

### 현재 상황: 웹 테스트
- ✅ **장점**: 빠른 개발, 즉시 확인 가능
- ✅ **단점**: 모바일 특화 기능 테스트 불가

### 권장 순서:
1. **지금**: 웹 브라우저로 기본 기능 테스트
   - F12 콘솔로 로그 확인
   - alert/confirm 동작 확인
   
2. **나중**: 핸드폰에 Expo Go 설치
   - 실제 모바일 환경 테스트
   - 더 나은 UX 확인

3. **추후**: 프로덕션 빌드
   - APK/IPA 파일 생성
   - 실제 배포 준비

---

## 🎯 현재 테스트 가능한 것

### ✅ 웹에서 즉시 테스트 가능:
1. 회원가입 (alert 팝업)
2. 로그인 (자동 홈 이동)
3. 게스트 모드 (confirm 다이얼로그)
4. 이메일 인증 안내
5. 에러 메시지 표시

### 📋 콘솔 로그로 확인:
- 모든 버튼 클릭 이벤트
- API 호출 시작/종료
- 성공/실패 상태
- 데이터 흐름

---

## 🚀 다음 테스트

1. **브라우저 새로고침**: Ctrl + Shift + R
2. **F12 열기**: 콘솔 탭 확인
3. **회원가입 버튼 클릭**: 콘솔과 alert 확인
4. **게스트 모드 클릭**: confirm 다이얼로그 확인

**콘솔에 로그가 나타나지 않으면 스크린샷을 보내주세요!**

---

**작성일**: 2026-01-11  
**테스트 URL**: http://localhost:8083  
**상태**: 서버 실행 중 (798 modules 번들링 완료)
