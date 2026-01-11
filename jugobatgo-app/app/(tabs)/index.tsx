import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';
import { transactionsApi, Transaction } from '../../src/api/transactions';
import { getJubadTemperature } from '../../src/api/statistics';

// 하드코딩된 userId (실제로는 인증에서 가져와야 함)
const DEMO_USER_ID = 'dac1f274-38a5-4e4d-9df1-ab0f09c6bb4a';

export default function HomeScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jubadTemperature, setJubadTemperature] = useState<number>(36.5);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [transactionsData, temperature] = await Promise.all([
        transactionsApi.getAll(),
        getJubadTemperature(DEMO_USER_ID),
      ]);
      // 최신 3개만 표시
      setTransactions(transactionsData.slice(0, 3));
      setJubadTemperature(temperature);
    } catch (err: any) {
      console.error('데이터 로딩 실패:', err);
      
      // 네트워크 에러인 경우 더 구체적인 메시지
      if (err.isNetworkError || err.code === 'ERR_NETWORK' || err.message?.includes('Connection failed')) {
        setError('연결에 실패했습니다.\n인터넷 연결이나 VPN을 확인해주세요.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('서버 응답 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.');
      } else {
        setError('데이터를 불러올 수 없습니다.\n잠시 후 다시 시도해주세요.');
      }
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
  
  // 이번 달 통계를 바 차트용 데이터로 변환
  const getBarChartData = () => {
    return [
      {
        value: stats.given,
        label: '준 금액',
        frontColor: '#ef4444',
        spacing: 2,
      },
      {
        value: stats.received,
        label: '받은 금액',
        frontColor: '#3b82f6',
      },
    ];
  };
  
  // 주밥 온도를 0~100 범위로 정규화 (실제 온도 30~42도를 백분율로 변환)
  const temperaturePercentage = ((jubadTemperature - 30) / (42 - 30)) * 100;
  
  // 주밥 온도 색상
  const getTemperatureColor = (temp: number) => {
    if (temp >= 38) return '#ef4444'; // 뜨거움 (빨강)
    if (temp >= 36.5) return '#f97316'; // 따뜻함 (주황)
    if (temp >= 35) return '#fbbf24'; // 미지근함 (노랑)
    return '#3b82f6'; // 차가움 (파랑)
  };
  
  // 주밥 온도 메시지
  const getTemperatureMessage = (temp: number) => {
    if (temp >= 38) return '불타는 인간관계!';
    if (temp >= 36.5) return '따뜻한 인간관계';
    if (temp >= 35) return '평범한 인간관계';
    return '차가운 인간관계';
  };

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
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
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
        <Text style={styles.cardTitle}>내 주밥 온도</Text>
        
        {/* 온도계 바 */}
        <View style={styles.progressBarContainer}>
          <View style={[
            styles.progressBar, 
            { 
              width: `${temperaturePercentage}%`,
              backgroundColor: getTemperatureColor(jubadTemperature),
            }
          ]} />
        </View>

        {/* 온도 표시 */}
        <View style={styles.temperatureInfo}>
          <View>
            <Text style={[styles.temperatureValue, { color: getTemperatureColor(jubadTemperature) }]}>
              {jubadTemperature}°C
            </Text>
            <Text style={styles.temperatureStatus}>
              {getTemperatureMessage(jubadTemperature)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.detailButton}
            onPress={() => router.push('/stats')}
          >
            <Text style={styles.detailButtonText}>자세히 보기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 요약 카드 */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>이번 달 요약</Text>
        
        {/* 바 차트 */}
        {(stats.given > 0 || stats.received > 0) && (
          <View style={styles.chartCard}>
            <BarChart
              data={getBarChartData()}
              height={150}
              barWidth={60}
              spacing={40}
              roundedTop
              roundedBottom
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: '#6b7280' }}
              noOfSections={3}
              maxValue={Math.max(stats.given, stats.received) * 1.2}
              isAnimated
              animationDuration={800}
            />
          </View>
        )}
        
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
          <TouchableOpacity onPress={loadData}>
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
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
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
