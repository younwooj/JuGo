import type { IPlatform } from './types';

export const platform: IPlatform = {
  alert(title: string, message?: string): void {
    const msg = message ? `${title}\n\n${message}` : title;
    window.alert(msg);
  },

  async confirm(
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string }
  ): Promise<boolean> {
    const msg = options ? `${title}\n\n${message}` : `${title}\n\n${message}`;
    return Promise.resolve(window.confirm(msg));
  },

  alertWithButtons(
    title: string,
    message: string,
    buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ): void {
    // 웹 window.confirm: OK=true, Cancel=false
    // 규칙: buttons[0]=Cancel, buttons[1]=OK
    const msg = `${title}\n\n${message}`;
    const confirmed = window.confirm(msg);
    const targetIdx = confirmed ? 1 : 0;
    buttons[targetIdx]?.onPress?.();
  },

  get isWeb(): boolean {
    return true;
  },

  get headerPaddingTop(): number {
    return 60;
  },

  showImagePickerOptions(_onCamera: () => void, onGallery: () => void): void {
    // 웹에서는 바로 갤러리만 지원
    onGallery();
  },
};
