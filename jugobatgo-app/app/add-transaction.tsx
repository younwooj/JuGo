import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { transactionsApi } from '../src/api/transactions';
import { ledgerApi } from '../src/api/ledger';

export default function AddTransactionScreen() {
  const [loading, setLoading] = useState(false);
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);
  
  // 폼 상태
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [type, setType] = useState<'GIVE' | 'RECEIVE'>('GIVE');
  const [category, setCategory] = useState<'CASH' | 'GIFT' | 'GOLD'>('CASH');
  const [amount, setAmount] = useState('');
  const [giftName, setGiftName] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    loadLedgerGroups();
  }, []);

  const loadLedgerGroups = async () => {
    try {
      const groups = await ledgerApi.getAll();
      setLedgerGroups(groups);
      if (groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    } catch (error) {
      console.error('장부 그룹 로딩 실패:', error);
    }
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!contactName.trim()) {
      Alert.alert('오류', '이름을 입력해주세요');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('오류', '올바른 금액을 입력해주세요');
      return;
    }
    if (!selectedGroupId) {
      Alert.alert('오류', '장부 그룹을 선택해주세요');
      return;
    }

    setLoading(true);
    try {
      // TODO: 실제로는 먼저 Contact를 생성/검색해야 합니다
      // 지금은 임시로 하드코딩된 contactId 사용
      const demoContactId = '00000000-0000-0000-0000-000000000011';

      await transactionsApi.create({
        contactId: demoContactId,
        ledgerGroupId: selectedGroupId,
        type,
        category,
        amount: parseFloat(amount),
        originalName: category !== 'CASH' ? giftName : undefined,
        memo: memo || undefined,
        eventDate: new Date().toISOString(),
      });

      Alert.alert('성공', '거래가 추가되었습니다', [
        {
          text: '확인',
          onPress: () => {
            // 폼 초기화
            setContactName('');
            setPhoneNumber('');
            setAmount('');
            setGiftName('');
            setMemo('');
            setType('GIVE');
            setCategory('CASH');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('오류', error.message || '거래 추가에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>새 거래 추가</Text>
        <Text style={styles.headerSubtitle}>주고받은 내역을 기록하세요</Text>
      </View>

      <View style={styles.formContainer}>
        {/* 이름 입력 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>이름 *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 김철수"
            value={contactName}
            onChangeText={setContactName}
          />
        </View>

        {/* 전화번호 입력 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>전화번호</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 010-1234-5678"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        {/* 거래 유형 선택 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>거래 유형 *</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, type === 'GIVE' && styles.optionButtonActive]}
              onPress={() => setType('GIVE')}
            >
              <Text style={[styles.optionText, type === 'GIVE' && styles.optionTextActive]}>
                줌
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, type === 'RECEIVE' && styles.optionButtonActive]}
              onPress={() => setType('RECEIVE')}
            >
              <Text style={[styles.optionText, type === 'RECEIVE' && styles.optionTextActive]}>
                받음
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 분류 선택 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>분류 *</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.optionButton, category === 'CASH' && styles.optionButtonActive]}
              onPress={() => setCategory('CASH')}
            >
              <Text style={[styles.optionText, category === 'CASH' && styles.optionTextActive]}>
                현금
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, category === 'GIFT' && styles.optionButtonActive]}
              onPress={() => setCategory('GIFT')}
            >
              <Text style={[styles.optionText, category === 'GIFT' && styles.optionTextActive]}>
                선물
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, category === 'GOLD' && styles.optionButtonActive]}
              onPress={() => setCategory('GOLD')}
            >
              <Text style={[styles.optionText, category === 'GOLD' && styles.optionTextActive]}>
                금
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 금액 입력 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>금액 (원) *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 100000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* 선물명 (선물/금 선택시만) */}
        {category !== 'CASH' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {category === 'GIFT' ? '선물명' : '금 정보'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={category === 'GIFT' ? '예: 정관장 홍삼' : '예: 24K 3.75돈'}
              value={giftName}
              onChangeText={setGiftName}
            />
          </View>
        )}

        {/* 장부 그룹 선택 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>장부 그룹 *</Text>
          <View style={styles.buttonGroup}>
            {ledgerGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.optionButton,
                  selectedGroupId === group.id && styles.optionButtonActive,
                ]}
                onPress={() => setSelectedGroupId(group.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedGroupId === group.id && styles.optionTextActive,
                  ]}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 메모 입력 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>메모</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="메모를 입력하세요"
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 제출 버튼 */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>추가하기</Text>
          )}
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
  formContainer: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
