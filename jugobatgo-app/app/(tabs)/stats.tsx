import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LineChart, PieChart, BarChart } from 'react-native-gifted-charts';
import {
  getUserStatistics,
  getCategoryStatistics,
  getMonthlyStatistics,
  getTopContacts,
  UserStatistics,
  CategoryStatistics,
  MonthlyStatistics,
  TopContact,
} from '../../src/api/statistics';
import { useAuthStore } from '../../src/store/authStore';
import {
  MOCK_USER_STATS,
  MOCK_CATEGORY_STATS,
  MOCK_MONTHLY_STATS,
  MOCK_TOP_CONTACTS,
} from '../../src/mock/demoData';

// 하드코딩된 userId (실제로는 인증에서 가져와야 함)
const DEMO_USER_ID = 'dac1f274-38a5-4e4d-9df1-ab0f09c6bb4a';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { user } = useAuthStore();
  const isGuest = user?.id === 'guest';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);

      if (isGuest) {
        setStats(MOCK_USER_STATS);
        setCategoryStats(MOCK_CATEGORY_STATS);
        setMonthlyStats(MOCK_MONTHLY_STATS);
        setTopContacts(MOCK_TOP_CONTACTS);
        return;
      }

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
    } catch (err: any) {
      console.error('통계 로딩 실패:', err);
      if (err.isNetworkError || err.code === 'ERR_NETWORK' || err.message?.includes('Connection failed')) {
        setError('연결에 실패했습니다.\n인터넷 연결이나 VPN을 확인해주세요.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('서버 응답 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.');
      } else {
        setError('통계를 불러올 수 없습니다.\n잠시 후 다시 시도해주세요.');
      }
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

  // 카테고리별 파이 차트 데이터
  const getPieChartData = () => {
    if (!categoryStats) return [];

    const data = [
      {
        value: categoryStats.CASH?.give + categoryStats.CASH?.receive || 0,
        color: '#3b82f6',
        text: '현금',
      },
      {
        value: categoryStats.GIFT?.give + categoryStats.GIFT?.receive || 0,
        color: '#ef4444',
        text: '선물',
      },
      {
        value: categoryStats.GOLD?.give + categoryStats.GOLD?.receive || 0,
        color: '#fbbf24',
        text: '금',
      },
    ];

    return data.filter(item => item.value > 0);
  };

  // 월별 추이 라인 차트 데이터
  const getLineChartData = () => {
    if (!monthlyStats) return { giveData: [], receiveData: [] };

    const months = Object.keys(monthlyStats).sort();
    const giveData = months.map(month => ({
      value: monthlyStats[month].give,
      label: month.slice(5), // MM만 표시
      dataPointText: `${(monthlyStats[month].give / 10000).toFixed(0)}만`,
    }));

    const receiveData = months.map(month => ({
      value: monthlyStats[month].receive,
      label: month.slice(5),
      dataPointText: `${(monthlyStats[month].receive / 10000).toFixed(0)}만`,
    }));

    return { giveData, receiveData };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>통계를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <View style={{ marginBottom: 16 }}>
          <Ionicons name="warning-outline" size={48} color="#9ca3af" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStatistics}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!stats || !categoryStats) {
    return (
      <View style={styles.loadingContainer}>
        <View style={{ marginBottom: 16 }}>
          <Ionicons name="warning-outline" size={48} color="#9ca3af" />
        </View>
        <Text style={styles.errorText}>통계 데이터가 없습니다</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStatistics}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pieData = getPieChartData();
  const { giveData, receiveData } = getLineChartData();

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

        {/* 월별 추이 차트 */}
        {giveData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 월별 추이</Text>
            <Text style={styles.chartSubtitle}>최근 12개월 거래 내역</Text>
            
            <View style={styles.chartContainer}>
              <LineChart
                data={receiveData}
                data2={giveData}
                height={220}
                width={screenWidth - 80}
                spacing={60}
                initialSpacing={20}
                color1="#10b981"
                color2="#ef4444"
                textColor1="#10b981"
                textColor2="#ef4444"
                dataPointsHeight={6}
                dataPointsWidth={6}
                dataPointsColor1="#10b981"
                dataPointsColor2="#ef4444"
                curved
                thickness={3}
                hideRules
                hideYAxisText
                yAxisColor="#e5e7eb"
                xAxisColor="#e5e7eb"
                xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10 }}
                showVerticalLines
                verticalLinesColor="rgba(229, 231, 235, 0.5)"
                areaChart
                startFillColor1="rgba(16, 185, 129, 0.2)"
                startFillColor2="rgba(239, 68, 68, 0.2)"
                endFillColor1="rgba(16, 185, 129, 0.05)"
                endFillColor2="rgba(239, 68, 68, 0.05)"
              />
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>받은 금액</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>준 금액</Text>
              </View>
            </View>
          </View>
        )}

        {/* 카테고리별 파이 차트 */}
        {pieData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 카테고리별 비중</Text>
            <Text style={styles.chartSubtitle}>거래 유형별 분포</Text>

            <View style={styles.pieChartContainer}>
              <PieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={60}
                innerCircleColor="#fff"
                centerLabelComponent={() => (
                  <View style={styles.pieCenterLabel}>
                    <Text style={styles.pieCenterText}>총계</Text>
                    <Text style={styles.pieCenterValue}>
                      {((stats.totalGiveAmount + stats.totalReceiveAmount) / 10000).toFixed(0)}만원
                    </Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.pieChartLegend}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.pieLegendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.text}</Text>
                  <Text style={styles.pieLegendValue}>
                    {((item.value / (stats.totalGiveAmount + stats.totalReceiveAmount)) * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 카테고리별 통계 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 카테고리별 상세</Text>
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
          <Text style={styles.cardTitle}>👥 많이 거래한 사람 Top 10</Text>
          {topContacts.map((contact, index) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={[
                styles.contactRank,
                index === 0 && { backgroundColor: '#fbbf24' },
                index === 1 && { backgroundColor: '#9ca3af' },
                index === 2 && { backgroundColor: '#d97706' },
              ]}>
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
          <View style={styles.cardTitleRow}>
            <Ionicons name="document-text-outline" size={20} color="#374151" />
            <Text style={styles.cardTitle}> 최근 거래</Text>
          </View>
          {stats.recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={transaction.type === 'GIVE' ? 'arrow-up-outline' : 'arrow-down-outline'}
                  size={20}
                  color={transaction.type === 'GIVE' ? '#ef4444' : '#10b981'}
                />
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
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  chartContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  pieCenterLabel: {
    alignItems: 'center',
  },
  pieCenterText: {
    fontSize: 14,
    color: '#6b7280',
  },
  pieCenterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  pieChartLegend: {
    marginTop: 16,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  pieLegendValue: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
