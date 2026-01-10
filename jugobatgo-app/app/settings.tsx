import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
        <Text style={styles.headerSubtitle}>앱 환경설정</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.comingSoon}>⚙️ 준비 중입니다 ⚙️</Text>
        <Text style={styles.description}>
          설정 기능이 곧 추가될 예정입니다.
        </Text>
      </View>
    </ScrollView>
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
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  comingSoon: {
    fontSize: 32,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
