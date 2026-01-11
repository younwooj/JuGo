import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ledgerApi } from '../../src/api/ledger';
import { transactionsApi, Transaction } from '../../src/api/transactions';

interface LedgerGroup {
  id: string;
  name: string;
  createdAt: string;
}

interface GroupStats {
  groupId: string;
  groupName: string;
  given: number;
  received: number;
  balance: number;
  count: number;
  temperature: number;
}

export default function LedgerListScreen() {
  const [groups, setGroups] = useState<LedgerGroup[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<GroupStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [groupsData, transactionsData] = await Promise.all([
        ledgerApi.getAll(),
        transactionsApi.getAll(),
      ]);

      setGroups(groupsData);
      setTransactions(transactionsData);
      calculateStats(groupsData, transactionsData);
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

  const calculateStats = (groups: LedgerGroup[], transactions: Transaction[]) => {
    const statsMap = new Map<string, GroupStats>();

    groups.forEach((group) => {
      statsMap.set(group.id, {
        groupId: group.id,
        groupName: group.name,
        given: 0,
        received: 0,
        balance: 0,
        count: 0,
        temperature: 50,
      });
    });

    transactions.forEach((transaction) => {
      const groupStat = statsMap.get(transaction.ledgerGroupId);
      if (groupStat) {
        groupStat.count++;
        if (transaction.type === 'GIVE') {
          groupStat.given += transaction.amount;
        } else {
          groupStat.received += transaction.amount;
        }
      }
    });

    const statsArray = Array.from(statsMap.values()).map((stat) => {
      stat.balance = stat.received - stat.given;
      stat.temperature = Math.min(100, Math.max(0, 50 + stat.balance / 10000));
      return stat;
    });

    setStats(statsArray);
  };

  const getTotalStats = () => {
    return stats.reduce(
      (acc, stat) => ({
        given: acc.given + stat.given,
        received: acc.received + stat.received,
        count: acc.count + stat.count,
      }),
      { given: 0, received: 0, count: 0 }
    );
  };

  const total = getTotalStats();

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
        <Text style={styles.headerTitle}>내 장부</Text>
        <Text style={styles.headerSubtitle}>그룹별 거래 내역</Text>
      </View>

      {/* 전체 통계 */}
      <View style={styles.totalStatsCard}>
        <Text style={styles.cardTitle}>전체 통계</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>준 금액</Text>
            <Text style={styles.statValueGive}>₩ {total.given.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>받은 금액</Text>
            <Text style={styles.statValueReceive}>₩ {total.received.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>총 거래</Text>
            <Text style={styles.statValueTotal}>{total.count}건</Text>
          </View>
        </View>
      </View>

      {/* 장부 그룹 리스트 */}
      <View style={styles.groupsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>장부 그룹</Text>
          <TouchableOpacity>
            <Text style={styles.addButtonText}>+ 추가</Text>
          </TouchableOpacity>
        </View>

        {stats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>장부 그룹이 없습니다</Text>
            <Text style={styles.emptySubtext}>새 그룹을 만들어보세요</Text>
          </View>
        ) : (
          stats.map((stat) => (
            <TouchableOpacity key={stat.groupId} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View>
                  <Text style={styles.groupName}>{stat.groupName}</Text>
                  <Text style={styles.groupCount}>{stat.count}건의 거래</Text>
                </View>
                <View style={styles.temperatureBadge}>
                  <Text style={styles.temperatureText}>{Math.round(stat.temperature)}°</Text>
                </View>
              </View>

              <View style={styles.groupStats}>
                <View style={styles.groupStatItem}>
                  <Text style={styles.groupStatLabel}>준 금액</Text>
                  <Text style={styles.groupStatValueGive}>
                    ₩ {stat.given.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.groupStatItem}>
                  <Text style={styles.groupStatLabel}>받은 금액</Text>
                  <Text style={styles.groupStatValueReceive}>
                    ₩ {stat.received.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.groupStatItem}>
                  <Text style={styles.groupStatLabel}>잔액</Text>
                  <Text
                    style={[
                      styles.groupStatValueBalance,
                      stat.balance >= 0 ? styles.balancePositive : styles.balanceNegative,
                    ]}
                  >
                    {stat.balance >= 0 ? '+' : ''}₩ {stat.balance.toLocaleString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  totalStatsCard: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValueGive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  statValueReceive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  groupsSection: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  groupCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  temperatureBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  temperatureText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupStatItem: {
    flex: 1,
  },
  groupStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  groupStatValueGive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  groupStatValueReceive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  groupStatValueBalance: {
    fontSize: 14,
    fontWeight: '600',
  },
  balancePositive: {
    color: '#10b981',
  },
  balanceNegative: {
    color: '#ef4444',
  },
});
