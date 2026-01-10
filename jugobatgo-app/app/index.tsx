import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { transactionsApi, Transaction } from '../src/api/transactions';

export default function HomeScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionsApi.getAll();
      // 최신 3개만 표시
      setTransactions(data.slice(0, 3));
    } catch (err) {
      console.error('거래 내역 로딩 실패:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  // 이번 달 통계 계산
  const calculateMonthlyStats = () => {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const eventDate = new Date(t.eventDate || t.createdAt);
      return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
    });

    const given = thisMonth
      .filter(t => t.type === 'GIVE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const received = thisMonth
      .filter(t => t.type === 'RECEIVE')
      .reduce((sum, t) => sum + t.amount, 0);

    return { given, received, count: thisMonth.length };
  };

  const stats = calculateMonthlyStats();
  const temperature = transactions.length > 0 ? Math.min(100, 50 + (stats.received - stats.given) / 10000) : 65;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>데이터 로딩 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTransactions}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>주고받고</Text>
        <Text style={styles.headerSubtitle}>경조사 관리의 새로운 기준</Text>
      </View>

      {/* 주받 온도계 */}
      <View style={styles.temperatureCard}>
        <Text style={styles.cardTitle}>내 주받 온도</Text>
        
        {/* 온도계 바 */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${temperature}%` }]} />
        </View>

        {/* 온도 표시 */}
        <View style={styles.temperatureInfo}>
          <View>
            <Text style={styles.temperatureValue}>{Math.round(temperature)}°</Text>
            <Text style={styles.temperatureStatus}>
              {temperature > 60 ? '양호' : temperature > 40 ? '균형' : '주의'}
            </Text>
          </View>
          <TouchableOpacity style={styles.detailButton}>
            <Text style={styles.detailButtonText}>자세히 보기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 요약 카드 */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>이번 달 요약</Text>
        
        <View style={styles.summaryCards}>
          {/* 준 금액 */}
          <View style={[styles.summaryCard, styles.giveCard]}>
            <Text style={styles.giveLabel}>준 금액</Text>
            <Text style={styles.giveAmount}>₩ {stats.given.toLocaleString()}</Text>
            <Text style={styles.giveCount}>{stats.count}건</Text>
          </View>

          {/* 받은 금액 */}
          <View style={[styles.summaryCard, styles.receiveCard]}>
            <Text style={styles.receiveLabel}>받은 금액</Text>
            <Text style={styles.receiveAmount}>₩ {stats.received.toLocaleString()}</Text>
            <Text style={styles.receiveCount}>{stats.count}건</Text>
          </View>
        </View>
      </View>

      {/* 최근 거래 내역 */}
      <View style={styles.transactionSection}>
        <View style={styles.transactionHeader}>
          <Text style={styles.sectionTitle}>최근 거래</Text>
          <TouchableOpacity onPress={loadTransactions}>
            <Text style={styles.viewAllText}>새로고침</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>거래 내역이 없습니다</Text>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {transactions.map((transaction, index) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  index < transactions.length - 1 && styles.transactionItemBorder,
                ]}
              >
                <View style={[
                  styles.avatar,
                  transaction.type === 'GIVE' ? styles.giveAvatar : styles.receiveAvatar
                ]}>
                  <Text style={
                    transaction.type === 'GIVE' ? styles.giveAvatarText : styles.receiveAvatarText
                  }>
                    {transaction.type === 'GIVE' ? '송' : '수'}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionName}>{transaction.contact.name}</Text>
                  <Text style={styles.transactionDesc}>
                    {transaction.originalName} • {transaction.ledgerGroup.name}
                  </Text>
                </View>
                <Text style={
                  transaction.type === 'GIVE' ? styles.giveAmountText : styles.receiveAmountText
                }>
                  {transaction.type === 'GIVE' ? '-' : '+'}
                  {transaction.amount.toLocaleString()}원
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 빠른 작업 버튼 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/add-transaction')}
        >
          <Text style={styles.primaryButtonText}>거래 추가</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/ledger')}
        >
          <Text style={styles.secondaryButtonText}>장부 관리</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
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
  temperatureCard: {
    marginHorizontal: 24,
    marginTop: -24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 32,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 16,
  },
  temperatureInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  temperatureValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  temperatureStatus: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  detailButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  summarySection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  giveCard: {
    backgroundColor: '#fef2f2',
  },
  giveLabel: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  giveAmount: {
    color: '#7f1d1d',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  giveCount: {
    color: '#dc2626',
    opacity: 0.6,
    fontSize: 12,
    marginTop: 4,
  },
  receiveCard: {
    backgroundColor: '#eff6ff',
  },
  receiveLabel: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  receiveAmount: {
    color: '#1e3a8a',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  receiveCount: {
    color: '#2563eb',
    opacity: 0.6,
    fontSize: 12,
    marginTop: 4,
  },
  transactionSection: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    color: '#ef4444',
    fontSize: 14,
  },
  transactionList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giveAvatar: {
    backgroundColor: '#fee2e2',
  },
  giveAvatarText: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  receiveAvatar: {
    backgroundColor: '#dbeafe',
  },
  receiveAvatarText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionName: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
  transactionDesc: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 2,
  },
  giveAmountText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 16,
  },
  receiveAmountText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 32,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
