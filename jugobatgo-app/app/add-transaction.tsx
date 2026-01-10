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
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { transactionsApi } from '../src/api/transactions';
import { ledgerApi } from '../src/api/ledger';
import { contactsApi, Contact } from '../src/api/contacts';
import { aiApi } from '../src/api/ai';

// 하드코딩된 userId (실제로는 인증에서 가져와야 함)
const DEMO_USER_ID = 'dac1f274-38a5-4e4d-9df1-ab0f09c6bb4a';

export default function AddTransactionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
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
    loadInitialData();
  }, []);

  useEffect(() => {
    // 이름 입력 시 연락처 필터링
    if (contactName.length > 0) {
      const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(contactName.toLowerCase())
      );
      setFilteredContacts(filtered);
      setShowContactPicker(filtered.length > 0);
    } else {
      setFilteredContacts([]);
      setShowContactPicker(false);
    }
  }, [contactName, contacts]);

  const loadInitialData = async () => {
    try {
      const [groupsData, contactsData] = await Promise.all([
        ledgerApi.getAll(),
        contactsApi.getAll(),
      ]);
      setLedgerGroups(groupsData);
      setContacts(contactsData);
      if (groupsData.length > 0) {
        setSelectedGroupId(groupsData[0].id);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    }
  };

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactName(contact.name);
    setPhoneNumber(contact.phoneNumber);
    if (contact.ledgerGroupId) {
      setSelectedGroupId(contact.ledgerGroupId);
    }
    setShowContactPicker(false);
  };

  const pickImage = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다');
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // AI 분석 시작
        analyzeImage(imageUri);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      const estimation = await aiApi.estimateFromImage(imageUri);
      
      // 결과를 폼에 자동 입력
      setGiftName(estimation.giftName);
      setAmount(estimation.estimatedPrice.toString());
      setCategory('GIFT');

      Alert.alert(
        'AI 분석 완료',
        `선물: ${estimation.giftName}\n예상 가격: ${estimation.estimatedPrice.toLocaleString()}원\n신뢰도: ${estimation.confidence}`,
        [{ text: '확인' }]
      );
    } catch (error: any) {
      console.error('AI 분석 실패:', error);
      Alert.alert(
        '분석 실패',
        error.message || 'AI 분석에 실패했습니다. 수동으로 입력해주세요.',
      );
    } finally {
      setIsAnalyzing(false);
      // 이미지는 분석 후 즉시 제거 (메모리 절약)
      setSelectedImage(null);
    }
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!contactName.trim()) {
      Alert.alert('오류', '이름을 입력해주세요');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('오류', '전화번호를 입력해주세요');
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
      // 연락처 찾거나 생성
      const contact = await contactsApi.findOrCreate({
        userId: DEMO_USER_ID,
        name: contactName.trim(),
        phoneNumber: phoneNumber.trim(),
        ledgerGroupId: selectedGroupId,
      });

      // 거래 생성
      await transactionsApi.create({
        contactId: contact.id,
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
            // 홈으로 이동
            router.push('/');
          },
        },
      ]);
    } catch (error: any) {
      console.error('거래 추가 실패:', error);
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
          {/* 연락처 자동완성 */}
          {showContactPicker && filteredContacts.length > 0 && (
            <View style={styles.contactPicker}>
              {filteredContacts.slice(0, 5).map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactItem}
                  onPress={() => selectContact(contact)}
                >
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 전화번호 입력 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>전화번호 *</Text>
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

        {/* AI 이미지 분석 (선물/금 선택시) */}
        {category !== 'CASH' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>📸 AI 가격 추정</Text>
            <TouchableOpacity
              style={[styles.imagePickerButton, isAnalyzing && styles.imagePickerButtonDisabled]}
              onPress={pickImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator color="#ef4444" size="small" />
                  <Text style={styles.analyzingText}>AI 분석 중...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.imagePickerIcon}>📷</Text>
                  <Text style={styles.imagePickerText}>사진으로 가격 추정하기</Text>
                  <Text style={styles.imagePickerSubtext}>선물 사진을 찍거나 선택하세요</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

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
  contactPicker: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  contactItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  imagePickerButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
  },
  imagePickerButtonDisabled: {
    opacity: 0.6,
  },
  imagePickerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  imagePickerSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
