import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.signOut();
              logout();
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const ICON_COLOR = '#374151';
  const menuItems = [
    {
      id: 'contacts-sync',
      iconName: 'phone-portrait-outline' as const,
      title: '연락처 동기화',
      description: '주소록에서 연락처 불러오기',
      onPress: () => router.push('/(tabs)/contacts-sync'),
    },
    {
      id: 'profile',
      iconName: 'person-outline' as const,
      title: '프로필 설정',
      description: '내 정보 수정',
      onPress: () => {},
    },
    {
      id: 'notifications',
      iconName: 'notifications-outline' as const,
      title: '알림 설정',
      description: '푸시 알림 관리',
      onPress: () => {},
    },
    {
      id: 'security',
      iconName: 'lock-closed-outline' as const,
      title: '보안 설정',
      description: '앱 잠금 및 생체 인증',
      onPress: () => {},
    },
    {
      id: 'backup',
      iconName: 'save-outline' as const,
      title: '데이터 백업',
      description: '데이터 내보내기/복원',
      onPress: () => {},
    },
    {
      id: 'about',
      iconName: 'information-circle-outline' as const,
      title: '앱 정보',
      description: '버전 1.0.0',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
        <Text style={styles.headerSubtitle}>앱 설정 및 관리</Text>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userProvider}>
              {user.socialProvider === 'email' ? '이메일 로그인' : 
               user.socialProvider === 'guest' ? '게스트 모드' :
               user.socialProvider.toUpperCase() + ' 로그인'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.contentContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.menuIconWrapper}>
              <Ionicons name={item.iconName} size={24} color={ICON_COLOR} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* 로그아웃 버튼 */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <View style={styles.logoutIconWrapper}>
            <Ionicons name="log-out-outline" size={20} color="#374151" />
          </View>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  userInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  userEmail: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userProvider: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIconWrapper: {
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  logoutIconWrapper: {
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
