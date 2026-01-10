import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  getUserStatistics,
  getCategoryStatistics,
  getMonthlyStatistics,
  getTopContacts,
  UserStatistics,
  CategoryStatistics,
  MonthlyStatistics,
  TopContact,
} from '../src/api/statistics';

// 하드코딩된 userId (실제로는 인증에서 가져와야 함)
const DEMO_USER_ID = 'dac1f274-38a5-4e4d-9df1-ab0f09c6bb4a';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStatistics | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatistics | null>(null);
  const [topContacts, setTopContacts] = useState<TopContact[]>([]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [userStats, catStats, monthStats, topCon] = await Promise.all([
        getUserStatistics(DEMO_USER_ID),
        getCategoryStatistics(DEMO_USER_ID),
        getMonthlyStatistics(DEMO_USER_ID),
        getTopContacts(DEMO_USER_ID),
      ]);
      setStats(userStats);
      setCategoryStats(catStats);
      setMonthlyStats(monthStats);
      setTopContacts(topCon);
    } catch (error) {
      console.error('통계 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 주밥 온도 색상
  const getTemperatureColor = (temp: number) => {
    if (temp >= 38) return '#ef4444'; // 뜨거움 (빨강)
    if (temp >= 36.5) return '#f97316'; // 따뜻함 (주황)
    if (temp >= 35) return '#fbbf24'; // 미지근함 (노랑)
    return '#3b82f6'; // 차가움 (파랑)
  };

  // 주밥 온도 메시지
  const getTemperatureMessage = (temp: number) => {
    if (temp >= 38) return '🔥 불타는 인간관계!';
    if (temp >= 36.5) return '😊 따뜻한 인간관계';
    if (temp >= 35) return '😐 평범한 인간관계';
    return '❄️ 차가운 인간관계';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>통계를 불러오는 중...</Text>
      </View>
    );
  }

  if (!stats || !categoryStats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>통계를 불러올 수 없습니다</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>통계</Text>
        <Text style={styles.headerSubtitle}>주고받은 내역을 분석해요</Text>
      </View>

      <View style={styles.contentContainer}>
        {/* 주밥 온도 */}
        <View
          style={[
            styles.temperatureCard,
            { backgroundColor: getTemperatureColor(stats.jubadTemperature) },
          ]}
        >
          <Text style={styles.temperatureLabel}>주밥 온도</Text>
          <Text style={styles.temperatureValue}>{stats.jubadTemperature}°C</Text>
          <Text style={styles.temperatureMessage}>
            {getTemperatureMessage(stats.jubadTemperature)}
          </Text>
        </View>

        {/* 전체 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>전체 요약</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>받은 금액</Text>
              <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                +{stats.totalReceiveAmount.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>준 금액</Text>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                -{stats.totalGiveAmount.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>잔액</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: stats.balance >= 0 ? '#10b981' : '#ef4444' },
                ]}
              >
                {stats.balance >= 0 ? '+' : ''}
                {stats.balance.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 거래</Text>
              <Text style={[styles.summaryValue, { color: '#6b7280' }]}>
                {stats.transactionCount}건
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>연락처</Text>
              <Text style={[styles.summaryValue, { color: '#6b7280' }]}>
                {stats.contactCount}명
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>장부</Text>
              <Text style={[styles.summaryValue, { color: '#6b7280' }]}>
                {stats.ledgerGroupCount}개
              </Text>
            </View>
          </View>
        </View>

        {/* 카테고리별 통계 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리별</Text>
          {Object.entries(categoryStats).map(([category, data]) => (
            <View key={category} style={styles.categoryItem}>
              <Text style={styles.categoryName}>
                {category === 'CASH' ? '💵 현금' : category === 'GIFT' ? '🎁 선물' : '💰 금'}
              </Text>
              <View style={styles.categoryStats}>
                <Text style={styles.categoryStatText}>
                  받음: <Text style={{ color: '#10b981' }}>+{data.receive.toLocaleString()}원</Text>
                </Text>
                <Text style={styles.categoryStatText}>
                  줌: <Text style={{ color: '#ef4444' }}>-{data.give.toLocaleString()}원</Text>
                </Text>
                <Text style={styles.categoryStatText}>거래: {data.count}건</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top 연락처 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>많이 거래한 사람 Top 10</Text>
          {topContacts.map((contact, index) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactRank}>
                <Text style={styles.contactRankText}>{index + 1}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactDetail}>
                  총 {contact.total.toLocaleString()}원 ({contact.transactionCount}건)
                </Text>
              </View>
              <View style={styles.contactBalance}>
                <Text
                  style={[
                    styles.contactBalanceText,
                    { color: contact.balance >= 0 ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {contact.balance >= 0 ? '+' : ''}
                  {contact.balance.toLocaleString()}원
                </Text>
              </View>
            </View>
          ))}
          {topContacts.length === 0 && (
            <Text style={styles.emptyText}>거래 내역이 없습니다</Text>
          )}
        </View>

        {/* 최근 거래 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>최근 거래</Text>
          {stats.recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionIconText}>
                  {transaction.type === 'GIVE' ? '📤' : '📥'}
                </Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{transaction.contact.name}</Text>
                <Text style={styles.transactionDetail}>
                  {transaction.ledgerGroup.name} •{' '}
                  {new Date(transaction.eventDate).toLocaleDateString('ko-KR')}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'RECEIVE' ? '#10b981' : '#ef4444' },
                ]}
              >
                {transaction.type === 'RECEIVE' ? '+' : '-'}
                {transaction.amount.toLocaleString()}원
              </Text>
            </View>
          ))}
          {stats.recentTransactions.length === 0 && (
            <Text style={styles.emptyText}>최근 거래 내역이 없습니다</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  contentContainer: {
    padding: 16,
  },
  temperatureCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  temperatureLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  temperatureValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  temperatureMessage: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    width: (screenWidth - 88) / 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  categoryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactRankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
  contactBalance: {},
  contactBalanceText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 20,
  },
});
