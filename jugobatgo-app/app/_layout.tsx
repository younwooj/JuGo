import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

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
          title: '설정',
          tabBarIcon: ({ color, size}) => (
            <TabBarIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

// 간단한 아이콘 컴포넌트 (실제로는 @expo/vector-icons 사용)
function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  // 임시로 텍스트 기반 아이콘
  const icons: Record<string, string> = {
    home: '🏠',
    book: '📖',
    'add-circle': '➕',
    'bar-chart': '📊',
    settings: '⚙️',
  };

  return (
    <div style={{ fontSize: size * 1.2 }}>
      {icons[name] || '•'}
    </div>
  );
}
