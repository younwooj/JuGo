import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

// 탭 아이콘 색상: 선택 시 진한 그레이, 비선택 시 아주 밝은 그레이
const TAB_ACTIVE_COLOR = '#374151';
const TAB_INACTIVE_COLOR = '#d1d5db';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56;
  const tabBarPaddingBottom = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: TAB_ACTIVE_COLOR,
        tabBarInactiveTintColor: TAB_INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: tabBarHeight + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: '장부',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="book" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: '연락처',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="contacts" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: '추가',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="add-circle" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon name="bar-chart" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // 탭에 표시하지 않음 (헤더 버튼으로 이동)
        }}
      />
      <Tabs.Screen
        name="contacts-sync"
        options={{
          href: null, // 탭에는 표시하지 않음
        }}
      />
    </Tabs>
  );
}

// Ionicons 기반 탭 아이콘 (선택/비선택에 따라 color가 자동 적용됨)
type TabIconName = 'home' | 'home-outline' | 'book' | 'book-outline' | 'people' | 'people-outline' | 'add-circle' | 'add-circle-outline' | 'bar-chart' | 'bar-chart-outline';
function TabBarIcon({ name, color, size, focused }: { name: string; color: string; size: number; focused?: boolean }) {
  const iconMap: Record<string, TabIconName> = {
    home: 'home-outline',
    book: 'book-outline',
    contacts: 'people-outline',
    'add-circle': 'add-circle-outline',
    'bar-chart': 'bar-chart-outline',
  };
  const filledMap: Record<string, TabIconName> = {
    home: 'home',
    book: 'book',
    contacts: 'people',
    'add-circle': 'add-circle',
    'bar-chart': 'bar-chart',
  };
  const iconName = focused ? (filledMap[name] || iconMap[name]) : (iconMap[name] || 'ellipse-outline');
  return <Ionicons name={iconName} size={size} color={color} />;
}
