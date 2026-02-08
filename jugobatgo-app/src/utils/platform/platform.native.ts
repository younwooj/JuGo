import { Alert } from 'react-native';
import type { IPlatform } from './types';

export const platform: IPlatform = {
  alert(title: string, message?: string): void {
    Alert.alert(title, message ?? '', [{ text: '확인' }]);
  },

  async confirm(
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        {
          text: options?.cancelText ?? '취소',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: options?.confirmText ?? '확인',
          onPress: () => resolve(true),
        },
      ]);
    });
  },

  alertWithButtons(
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ): void {
    Alert.alert(
      title,
      message,
      buttons.map((b) => ({
        text: b.text,
        style: b.style,
        onPress: b.onPress,
      }))
    );
  },

  get isWeb(): boolean {
    return false;
  },

  get headerPaddingTop(): number {
    return 80;
  },

  showImagePickerOptions(onCamera: () => void, onGallery: () => void): void {
    Alert.alert('이미지 선택', '어떤 방법으로 추가하시겠습니까?', [
      { text: '카메라', onPress: onCamera },
      { text: '갤러리', onPress: onGallery },
      { text: '취소', style: 'cancel' },
    ]);
  },
};
