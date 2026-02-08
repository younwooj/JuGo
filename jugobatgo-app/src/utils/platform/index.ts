/**
 * Universal Platform Interface
 *
 * 플랫폼별 구현체는 확장자로 자동 선택됩니다:
 * - platform.web.ts → 웹 빌드
 * - platform.native.ts → iOS/Android 빌드
 */
export { platform } from './platform';
export type { IPlatform, AlertButton } from './types';
