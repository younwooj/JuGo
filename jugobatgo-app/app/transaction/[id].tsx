import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { transactionsApi, Transaction } from '../../src/api/transactions';
import { platform } from '../../src/utils/platform';
import { useAuthStore } from '../../src/store/authStore';
import { MOCK_TRANSACTIONS } from '../../src/mock/demoData';

const CATEGORY_LABEL: Record<string, string> = {
  CASH: '현금',
  GIFT: '선물',
  GOLD: '금',
};

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const isGuest = !user || user.id === 'guest';

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    if (id) loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      if (isGuest) {
        const found = MOCK_TRANSACTIONS.find((t) => t.id === id);
        setTransaction(found || null);
        if (!found) setError('거래를 찾을 수 없습니다.');
        return;
      }
      const data = await transactionsApi.getById(id);
      setTransaction(data);
    } catch (e: any) {
      console.error('거래 조회 실패:', e);
      setError(e?.response?.status === 404 ? '거래를 찾을 수 없습니다.' : '불러오기에 실패했습니다.');
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (transaction) router.push({ pathname: '/add-transaction', params: { editId: transaction.id } });
  };

  const handleDelete = async () => {
    if (!transaction || isGuest) return;
    const confirmed = await platform.confirm(
      '거래 삭제',
      `"${transaction.contact?.name}" 님의 이 거래를 삭제하시겠습니까?`,
      { confirmText: '삭제', cancelText: '취소' }
    );
    if (!confirmed) return;
    try {
      setDeleting(true);
      await transactionsApi.delete(transaction.id);
      platform.alert('삭제 완료', '거래가 삭제되었습니다.');
      router.back();
    } catch (e: any) {
      console.error('삭제 실패:', e);
      platform.alert('오류', '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const imageUrl = transaction && 'imageUrl' in transaction ? (transaction as any).imageUrl : null;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>거래 정보 로딩 중...</Text>
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
        <Text style={styles.errorText}>{error || '거래를 찾을 수 없습니다.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const eventDateStr = transaction.eventDate
    ? new Date(transaction.eventDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const createdAtStr = new Date(transaction.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>거래 상세</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.typeRow}>
            <View
              style={[
                styles.typeBadge,
                transaction.type === 'GIVE' ? styles.typeGive : styles.typeReceive,
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {transaction.type === 'GIVE' ? '준 거래' : '받은 거래'}
              </Text>
            </View>
            <Text style={styles.categoryText}>{CATEGORY_LABEL[transaction.category] || transaction.category}</Text>
          </View>

          <Text style={styles.amount}>
            {transaction.type === 'GIVE' ? '-' : '+'}₩ {transaction.amount.toLocaleString()}
          </Text>
          <Text style={[styles.amountSub, transaction.type === 'GIVE' ? styles.giveColor : styles.receiveColor]}>
            {transaction.contact?.name} · {transaction.ledgerGroup?.name}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <Row label="연락처" value={transaction.contact?.name} />
          <Row label="장부 그룹" value={transaction.ledgerGroup?.name} />
          <Row label="유형" value={transaction.type === 'GIVE' ? '준 거래' : '받은 거래'} />
          <Row label="구분" value={CATEGORY_LABEL[transaction.category] || transaction.category} />
          {transaction.originalName ? (
            <Row label="선물/품목" value={transaction.originalName} />
          ) : null}
          {transaction.eventDate ? (
            <Row label="경조사 날짜" value={eventDateStr || String(transaction.eventDate)} />
          ) : null}
          <Row label="등록일" value={createdAtStr} />
        </View>

        {transaction.memo ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>메모</Text>
            <Text style={styles.memoText}>{transaction.memo}</Text>
          </View>
        ) : null}

        {transaction.goldInfo && typeof transaction.goldInfo === 'object' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>금 정보</Text>
            <Text style={styles.memoText}>
              {[
                (transaction.goldInfo as any).purity,
                (transaction.goldInfo as any).weight,
                (transaction.goldInfo as any).unit,
              ]
                .filter(Boolean)
                .join(' ')}
            </Text>
          </View>
        ) : null}

        {imageUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>첨부 이미지</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setImageModalVisible(true)}
              style={styles.imageWrap}
            >
              <Image
                source={{ uri: imageUrl }}
                style={[styles.thumbnail, { width: width - 48, height: (width - 48) * 0.75 }]}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand-outline" size={28} color="white" />
                <Text style={styles.imageOverlayText}>탭하여 크게 보기</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isGuest && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#ef4444" />
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#6b7280" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#6b7280" />
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.imageModalBackdrop}
          onPress={() => setImageModalVisible(false)}
        >
          <Image
            source={{ uri: imageUrl! }}
            style={styles.imageModalImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeGive: {
    backgroundColor: '#fee2e2',
  },
  typeReceive: {
    backgroundColor: '#dbeafe',
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  amount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  amountSub: {
    fontSize: 15,
  },
  giveColor: {
    color: '#dc2626',
  },
  receiveColor: {
    color: '#2563eb',
  },
  section: {
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
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  memoText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  imageWrap: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  thumbnail: {
    borderRadius: 8,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: 'white',
    marginTop: 8,
    fontSize: 13,
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: '100%',
    height: '80%',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 10,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
