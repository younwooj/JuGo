import React from 'react';
import { View } from 'react-native';

/**
 * Fallback for web: DateTimePicker는 네이티브 전용이므로 웹에서는 빈 컴포넌트.
 * add-transaction에서 Platform.OS === 'web'일 때는 이 컴포넌트를 렌더하지 않고 TextInput 사용.
 */
export default function DateTimePickerWrapperFallback() {
  return <View />;
}
