/**
 * Universal Platform Interface
 *
 * 플랫폼별(web/native) 동작이 다른 기능을 추상화합니다.
 * Python의 추상 클래스처럼 인터페이스를 정의하고,
 * platform.native.ts / platform.web.ts에서 각각 구현합니다.
 */

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface IPlatform {
  /** 단순 알림 (제목 + 메시지) */
  alert(title: string, message?: string): void;

  /**
   * 확인 대화상자. 확인 시 true, 취소 시 false 반환
   * @param options.confirmText - 확인 버튼 텍스트 (기본: '확인')
   * @param options.cancelText - 취소 버튼 텍스트 (기본: '취소')
   */
  confirm(
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string }
  ): Promise<boolean>;

  /**
   * 커스텀 버튼이 있는 알림 (콜백 기반)
   * 예: '홈으로' | '계속 추가' 같은 다중 선택
   */
  alertWithButtons(title: string, message: string, buttons: AlertButton[]): void;

  /** 웹 환경 여부 */
  readonly isWeb: boolean;

  /** 헤더 상단 패딩 (web: 60, native: 80) */
  readonly headerPaddingTop: number;

  /**
   * 이미지 선택 시 옵션 표시 (카메라/갤러리)
   * - Web: 바로 갤러리 선택
   * - Native: Alert로 카메라/갤러리 선택
   */
  showImagePickerOptions(
    onCamera: () => void,
    onGallery: () => void
  ): void;
}
