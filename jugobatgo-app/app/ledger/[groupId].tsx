import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Transaction } from '../../src/api/transactions';
import { useAuthStore } from '../../src/store/authStore';
import { MOCK_LEDGER_GROUPS, MOCK_TRANSACTIONS } from '../../src/mock/demoData';
import { ledgerApi } from '../../src/api/ledger';
import { transactionsApi } from '../../src/api/transactions';

const CATEGORY_LABEL: Record<string, string> = {
  CASH: '현금',
  GIFT: '선물',
  GOLD: '금',
};

type ViewMode = 'all' | 'group' | 'person';

interface PersonStats {
  contactId: string;
  name: string;
  phoneNumber: string;
  given: number;
  received: number;
  balance: number;
  count: number;
  temperature: number;
  transactions: Transaction[];
}

function computePersonStats(transactions: Transaction[]): PersonStats[] {
  const byContact = new Map<string, PersonStats>();
  transactions.forEach((tx) => {
    const c = tx.contact;
    if (!c) return;
    let stat = byContact.get(c.id);
    if (!stat) {
      stat = {
        contactId: c.id,
        name: c.name,
        phoneNumber: c.phoneNumber || '',
        given: 0,
        received: 0,
        balance: 0,
        count: 0,
        temperature: 50,
        transactions: [],
      };
      byContact.set(c.id, stat);
    }
    stat.count++;
    stat.transactions.push(tx);
    if (tx.type === 'GIVE') stat.given += tx.amount;
    else stat.received += tx.amount;
  });
  return Array.from(byContact.values()).map((s) => {
    s.balance = s.received - s.given;
    s.temperature = Math.min(100, Math.max(0, 50 + s.balance / 10000));
    s.transactions.sort(
      (a, b) => new Date(b.eventDate || b.createdAt).getTime() - new Date(a.eventDate || a.createdAt).getTime()
    );
    return s;
  });
}

export default function LedgerDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const isGuest = !user || user.id === 'guest';

  const [groupName, setGroupName] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);

  const groupTransactions = useMemo(
    () => (groupId ? transactions.filter((t) => t.ledgerGroupId === groupId) : []),
    [transactions, groupId]
  );

  const personStats = useMemo(() => computePersonStats(groupTransactions), [groupTransactions]);

  const groupSummary = useMemo(() => {
    let given = 0,
      received = 0;
    groupTransactions.forEach((t) => {
      if (t.type === 'GIVE') given += t.amount;
      else received += t.amount;
    });
    const balance = received - given;
    const temperature = Math.min(100, Math.max(0, 50 + balance / 10000));
    return { given, received, balance, count: groupTransactions.length, temperature };
  }, [groupTransactions]);

  useEffect(() => {
    if (groupId) loadData();
  }, [groupId]);

  const loadData = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      setError(null);
      if (isGuest) {
        const group = MOCK_LEDGER_GROUPS.find((g) => g.id === groupId);
        setGroupName(group?.name ?? '');
        setTransactions(MOCK_TRANSACTIONS.filter((t) => t.ledgerGroupId === groupId));
        return;
      }
      const [groupRes, txRes] = await Promise.all([
        ledgerApi.getById(groupId),
        transactionsApi.getAll(),
      ]);
      setGroupName(groupRes.name);
      setTransactions(txRes);
    } catch (err: any) {
      console.error('장부 상세 로딩 실패:', err);
      setError('데이터를 불러올 수 없습니다.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedTransactions = useMemo(
    () =>
      [...groupTransactions].sort(
        (a, b) => new Date(b.eventDate || b.createdAt).getTime() - new Date(a.eventDate || a.createdAt).getTime()
      ),
    [groupTransactions]
  );

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.txRow}
      onPress={() => router.push(`/transaction/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.txLeft}>
        <View
          style={[
            styles.txTypeBadge,
            item.type === 'GIVE' ? styles.txTypeGive : styles.txTypeReceive,
          ]}
        >
          <Text style={styles.txTypeText}>{item.type === 'GIVE' ? '준 금액' : '받은 금액'}</Text>
        </View>
        <Text style={styles.txContact}>{item.contact?.name}</Text>
        <Text style={styles.txDate}>{formatDate(item.eventDate || item.createdAt)}</Text>
        {item.memo ? <Text style={styles.txMemo} numberOfLines={1}>{item.memo}</Text> : null}
      </View>
      <Text
        style={[
          styles.txAmount,
          item.type === 'GIVE' ? styles.txAmountGive : styles.txAmountReceive,
        ]}
      >
        {item.type === 'GIVE' ? '-' : '+'}₩ {item.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupName || '장부 상세'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 뷰 모드 탭 */}
      <View style={styles.tabBar}>
        {(
          [
            { key: 'all' as ViewMode, label: '전체 거래' },
            { key: 'group' as ViewMode, label: '장부 요약' },
            { key: 'person' as ViewMode, label: '개인별' },
          ] as const
        ).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, viewMode === key && styles.tabActive]}
            onPress={() => setViewMode(key)}
          >
            <Text style={[styles.tabText, viewMode === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'all' && (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>거래 내역 ({sortedTransactions.length}건)</Text>
              {sortedTransactions.length === 0 ? (
                <Text style={styles.emptyHint}>이 장부에 등록된 거래가 없습니다.</Text>
              ) : (
                sortedTransactions.map((tx) => (
                  <View key={tx.id}>
                    {renderTransactionItem({ item: tx })}
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {viewMode === 'group' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>이 장부 요약</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>준 금액</Text>
                <Text style={styles.summaryValueGive}>₩ {groupSummary.given.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>받은 금액</Text>
                <Text style={styles.summaryValueReceive}>₩ {groupSummary.received.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>잔액</Text>
                <Text
                  style={[
                    styles.summaryValueBalance,
                    groupSummary.balance >= 0 ? styles.balancePositive : styles.balanceNegative,
                  ]}
                >
                  {groupSummary.balance >= 0 ? '+' : ''}₩ {groupSummary.balance.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>장부 온도</Text>
                <View style={styles.temperatureWrap}>
                  <Text style={styles.temperatureValue}>{Math.round(groupSummary.temperature)}°</Text>
                </View>
              </View>
            </View>
            <Text style={styles.summaryCount}>{groupSummary.count}건의 거래</Text>
            {sortedTransactions.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>최근 거래</Text>
                {sortedTransactions.slice(0, 5).map((tx) => (
                  <View key={tx.id}>{renderTransactionItem({ item: tx })}</View>
                ))}
              </>
            )}
          </View>
        )}

        {viewMode === 'person' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>연락처별 주고받은 내역</Text>
            {personStats.length === 0 ? (
              <Text style={styles.emptyHint}>이 장부에 연락처별 거래가 없습니다.</Text>
            ) : (
              personStats.map((stat) => {
                const isExpanded = expandedPersonId === stat.contactId;
                return (
                  <View key={stat.contactId} style={styles.personCard}>
                    <TouchableOpacity
                      style={styles.personHeader}
                      onPress={() =>
                        setExpandedPersonId(isExpanded ? null : stat.contactId)
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.personHeaderLeft}>
                        <Text style={styles.personName}>{stat.name}</Text>
                        <Text style={styles.personMeta}>
                          거래 {stat.count}건 · 잔액 {stat.balance >= 0 ? '+' : ''}₩ {stat.balance.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.personHeaderRight}>
                        <View style={styles.tempBadge}>
                          <Ionicons name="thermometer-outline" size={16} color="#ef4444" />
                          <Text style={styles.tempBadgeText}>{Math.round(stat.temperature)}°</Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#6b7280"
                        />
                      </View>
                    </TouchableOpacity>
                    <View style={styles.personStatsRow}>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatLabel}>준 금액</Text>
                        <Text style={styles.miniStatValueGive}>₩ {stat.given.toLocaleString()}</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatLabel}>받은 금액</Text>
                        <Text style={styles.miniStatValueReceive}>₩ {stat.received.toLocaleString()}</Text>
                      </View>
                    </View>
                    {isExpanded && (
                      <View style={styles.personTxList}>
                        {stat.transactions.map((tx) => (
                          <TouchableOpacity
                            key={tx.id}
                            style={styles.personTxRow}
                            onPress={() => router.push(`/transaction/${tx.id}`)}
                          >
                            <Text style={styles.personTxDate}>{formatDate(tx.eventDate || tx.createdAt)}</Text>
                            <Text style={styles.personTxCategory}>{CATEGORY_LABEL[tx.category]}</Text>
                            <Text
                              style={[
                                styles.personTxAmount,
                                tx.type === 'GIVE' ? styles.txAmountGive : styles.txAmountReceive,
                              ]}
                            >
                              {tx.type === 'GIVE' ? '-' : '+'}₩ {tx.amount.toLocaleString()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
    color: '#6b7280',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerBack: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fee2e2',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ef4444',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 24,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  txLeft: {
    flex: 1,
  },
  txTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  txTypeGive: {
    backgroundColor: '#fee2e2',
  },
  txTypeReceive: {
    backgroundColor: '#dbeafe',
  },
  txTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  txContact: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  txDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  txMemo: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  txAmountGive: {
    color: '#dc2626',
  },
  txAmountReceive: {
    color: '#2563eb',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    minWidth: '45%',
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValueGive: {
    fontSize: 17,
    fontWeight: '700',
    color: '#dc2626',
  },
  summaryValueReceive: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2563eb',
  },
  summaryValueBalance: {
    fontSize: 17,
    fontWeight: '700',
  },
  balancePositive: {
    color: '#059669',
  },
  balanceNegative: {
    color: '#dc2626',
  },
  temperatureWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperatureValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ef4444',
  },
  summaryCount: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 12,
  },
  personCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personHeaderLeft: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  personMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  personHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tempBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  tempBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  personStatsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  miniStat: {
    flex: 1,
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  miniStatValueGive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  miniStatValueReceive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  personTxList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  personTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  personTxDate: {
    fontSize: 12,
    color: '#6b7280',
    width: 72,
  },
  personTxCategory: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  personTxAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
