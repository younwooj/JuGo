import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
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
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: '장부',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="book" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: '연락처',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="contacts" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: '추가',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="add-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="bar-chart" color={color} size={size} />
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

// 간단한 아이콘 컴포넌트
function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    home: '🏠',
    book: '📖',
    contacts: '📇',
    'add-circle': '➕',
    'bar-chart': '📊',
    settings: '⚙️',
  };

  return (
    <Text style={{ fontSize: size * 1.2 }}>
      {icons[name] || '•'}
    </Text>
  );
}
