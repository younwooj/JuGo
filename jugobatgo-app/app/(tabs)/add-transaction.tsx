import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { platform } from '../../src/utils/platform';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { transactionsApi } from '../../src/api/transactions';
import { contactsApi, Contact } from '../../src/api/contacts';
import { aiApi } from '../../src/api/ai';
import { getLatestGoldRate, convertGoldToKRW, convertKRWToGold } from '../../src/api/gold';
import { uploadImage } from '../../src/api/storage';
import { useAuthStore } from '../../src/store/authStore';
import { MOCK_CONTACTS } from '../../src/mock/demoData';

const DEMO_USER_ID = 'dac1f274-38a5-4e4d-9df1-ab0f09c6bb4a';

export default function AddTransactionScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = Boolean(editId);
  const { user } = useAuthStore();
  const isGuest = !user || user.id === 'guest';
  const userId = user?.id ?? DEMO_USER_ID;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 폼 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [type, setType] = useState<'GIVE' | 'RECEIVE'>('GIVE');
  const [category, setCategory] = useState<'CASH' | 'GIFT' | 'GOLD'>('CASH');
  const [amount, setAmount] = useState('');
  const [giftName, setGiftName] = useState('');
  const [memo, setMemo] = useState('');
  
  // 금 거래 전용 상태
  const [goldKarat, setGoldKarat] = useState<'24K' | '18K' | '14K'>('24K');
  const [goldWeight, setGoldWeight] = useState('');
  const [goldWeightUnit, setGoldWeightUnit] = useState<'don' | 'g' | 'oz_t'>('g');
  const [goldPricePerGram, setGoldPricePerGram] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  // 수정 모드: 거래 데이터 로드 후 폼에 반영
  useEffect(() => {
    if (!editId || isGuest) return;
    let cancelled = false;
    (async () => {
      try {
        const tx = await transactionsApi.getById(editId);
        if (cancelled) return;
        setType(tx.type);
        setCategory(tx.category);
        setAmount(String(tx.amount));
        setGiftName(tx.originalName || '');
        setMemo(tx.memo || '');
        if (tx.goldInfo && typeof tx.goldInfo === 'object') {
          const g = tx.goldInfo as { purity?: string; weight?: number; unit?: string };
          if (g.purity) setGoldKarat((g.purity as '24K' | '18K' | '14K') || '24K');
          if (g.weight != null) setGoldWeight(String(g.weight));
        }
        setSelectedContact({
          id: tx.contact.id,
          name: tx.contact.name,
          phoneNumber: tx.contact.phoneNumber,
          userId,
          ledgerGroupId: tx.ledgerGroupId,
          createdAt: '',
          updatedAt: '',
        } as Contact);
        if ('imageUrl' in tx && tx.imageUrl) setUploadedImageUrl(tx.imageUrl);
      } catch (e) {
        console.error('거래 로드 실패:', e);
        if (!cancelled) platform.alert('오류', '거래 정보를 불러올 수 없습니다.');
      }
    })();
    return () => { cancelled = true; };
  }, [editId, isGuest, userId]);
  
  useEffect(() => {
    // 카테고리가 금으로 변경되면 최신 시세 불러오기
    if (category === 'GOLD') {
      loadGoldRate();
    }
  }, [category]);

  useEffect(() => {
    // 검색어로 연락처 필터링
    if (searchQuery.length > 0) {
      const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phoneNumber.includes(searchQuery)
      );
      setFilteredContacts(filtered);
      setShowContactPicker(filtered.length > 0);
    } else {
      setFilteredContacts([]);
      setShowContactPicker(false);
    }
  }, [searchQuery, contacts]);
  
  // 단위별 그램 환산: 1돈 = 3.75g, 1 oz t = 31.1035g
  const goldWeightToGrams = (value: number): number => {
    switch (goldWeightUnit) {
      case 'don': return value * 3.75;
      case 'oz_t': return value * 31.1035;
      default: return value;
    }
  };

  const applyGoldAmount = () => {
    const w = parseFloat(goldWeight);
    if (!Number.isFinite(w) || w <= 0) {
      platform.alert('입력 오류', '금 무게를 입력해주세요.');
      return;
    }
    if (goldPricePerGram <= 0) {
      platform.alert('오류', '금 시세를 불러온 뒤 다시 시도해주세요.');
      return;
    }
    const grams = goldWeightToGrams(w);
    const calculatedAmount = Math.round(grams * goldPricePerGram);
    setAmount(calculatedAmount.toString());
  };

  const loadInitialData = async () => {
    try {
      if (isGuest) {
        setContacts(MOCK_CONTACTS);
        return;
      }
      const contactsData = await contactsApi.getAll(userId);
      setContacts(contactsData);
    } catch (err: any) {
      console.error('데이터 로딩 실패:', err);
      
      // 네트워크 에러 메시지 개선
      let errorMessage = '데이터를 불러올 수 없습니다';
      if (err.isNetworkError || err.code === 'ERR_NETWORK' || err.message?.includes('Connection failed')) {
        errorMessage = '연결에 실패했습니다.\n인터넷 연결이나 VPN을 확인해주세요.';
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = '서버 응답 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.';
      }
      
      platform.alert('오류', errorMessage);
    }
  };
  
  const loadGoldRate = async () => {
    if (isGuest) {
      // 게스트 모드: 기본 금 시세 (24K 약 13만원/g)
      setGoldPricePerGram(goldKarat === '24K' ? 130000 : goldKarat === '18K' ? 97000 : 76000);
      return;
    }
    try {
      const goldRate = await getLatestGoldRate();
      switch (goldKarat) {
        case '24K':
          setGoldPricePerGram(goldRate.gold24K);
          break;
        case '18K':
          setGoldPricePerGram(goldRate.gold18K);
          break;
        case '14K':
          setGoldPricePerGram(goldRate.gold14K);
          break;
      }
    } catch (err: any) {
      console.error('금 시세 로딩 실패:', err);
      
      let errorMessage = '금 시세를 불러오지 못했습니다';
      if (err.isNetworkError || err.code === 'ERR_NETWORK' || err.message?.includes('Connection failed')) {
        errorMessage = '연결에 실패했습니다.\n인터넷 연결이나 VPN을 확인해주세요.';
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = '서버 응답 시간이 초과되었습니다.';
      }
      
      platform.alert('오류', errorMessage);
    }
  };

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setSearchQuery(contact.name);
    setShowContactPicker(false);
  };

  const pickImage = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
      platform.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다');
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
        await analyzeImageAndUpload(imageUri);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      platform.alert('오류', '이미지 선택에 실패했습니다');
    }
  };

  const takePhoto = async () => {
    try {
      // 카메라 권한 요청
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
      platform.alert('권한 필요', '카메라 접근 권한이 필요합니다');
        return;
      }

      // 카메라로 사진 촬영
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // AI 분석 시작
        await analyzeImageAndUpload(imageUri);
      }
    } catch (error) {
      console.error('사진 촬영 실패:', error);
      platform.alert('오류', '사진 촬영에 실패했습니다');
    }
  };

  const showImagePicker = () => {
    platform.showImagePickerOptions(takePhoto, pickImage);
  };

  const analyzeImageAndUpload = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      // 1. Supabase Storage에 업로드
      setIsUploading(true);
      const publicUrl = await uploadImage(imageUri);
      setUploadedImageUrl(publicUrl);
      setIsUploading(false);

      // 2. AI 분석
      const estimation = await aiApi.estimateFromImage(imageUri);
      
      // 3. 결과를 폼에 자동 입력
      setGiftName(estimation.giftName);
      setAmount(estimation.estimatedPrice.toString());
      setCategory('GIFT');

      platform.alert(
        'AI 분석 완료',
        `선물: ${estimation.giftName}\n예상 가격: ${estimation.estimatedPrice.toLocaleString()}원\n신뢰도: ${estimation.confidence}`
      );
    } catch (error: any) {
      console.error('처리 실패:', error);
      
      // 업로드는 성공했지만 AI 분석만 실패한 경우
      if (uploadedImageUrl) {
        platform.alert(
          '이미지 업로드 완료',
          'AI 분석에 실패했습니다. 수동으로 입력해주세요.\n이미지는 저장되었습니다.'
        );
      } else {
        platform.alert(
          '처리 실패',
          error.message || '이미지 처리에 실패했습니다. 수동으로 입력해주세요.'
        );
      }
    } finally {
      setIsAnalyzing(false);
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (isGuest) {
      platform.alert('알림', '게스트 모드에서는 거래를 추가할 수 없습니다.\n테스트 계정으로 로그인해주세요.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      platform.alert('오류', '올바른 금액을 입력해주세요');
      return;
    }

    // 수정 모드
    if (isEditMode && editId) {
      setLoading(true);
      try {
        const updateData: any = {
          type,
          category,
          amount: parseFloat(amount),
          originalName: category !== 'CASH' ? giftName : undefined,
          memo: memo || undefined,
          eventDate: new Date().toISOString(),
        };
        await transactionsApi.update(editId, updateData);
        platform.alert('수정 완료', '거래가 수정되었습니다.');
        router.back();
      } catch (error: any) {
        console.error('거래 수정 실패:', error);
        platform.alert('오류', error?.response?.data?.message || error?.message || '수정에 실패했습니다.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 추가 모드: 연락처·장부 그룹 필수
    if (!selectedContact) {
      platform.alert('오류', '연락처를 선택해주세요');
      return;
    }
    if (!selectedContact.ledgerGroupId) {
      platform.alert(
        '오류',
        '선택한 연락처에 장부 그룹이 설정되어 있지 않습니다.\n연락처 탭에서 장부 그룹을 설정해주세요.'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('거래 추가 시작:', {
        contactId: selectedContact.id,
        amount,
        type,
        category,
      });

      const transactionData: any = {
        contactId: selectedContact.id,
        ledgerGroupId: selectedContact.ledgerGroupId,
        type,
        category,
        amount: parseFloat(amount),
        originalName: category !== 'CASH' ? giftName : undefined,
        memo: memo || undefined,
        eventDate: new Date().toISOString(),
      };
      if (uploadedImageUrl) transactionData.imageUrl = uploadedImageUrl;

      await transactionsApi.create(transactionData);

      const confirmMessage = `${type === 'GIVE' ? '준' : '받은'} 거래가 성공적으로 추가되었습니다.\n\n${selectedContact.name} - ${parseFloat(amount).toLocaleString()}원`;

      platform.alertWithButtons(
        '✅ 추가 완료',
        `${confirmMessage}\n\n계속 추가하시겠습니까?`,
        [
          { text: '홈으로', onPress: () => router.replace('/') },
          {
            text: '계속 추가',
            onPress: () => {
              setSearchQuery('');
              setSelectedContact(null);
              setAmount('');
              setGiftName('');
              setMemo('');
              setSelectedImage(null);
              setUploadedImageUrl(null);
            },
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('거래 추가 실패:', error);
      
      let errorMessage = '거래 추가에 실패했습니다';
      if (error.isNetworkError || error.code === 'ERR_NETWORK' || error.message?.includes('Connection failed')) {
        errorMessage = '연결에 실패했습니다.\n인터넷 연결이나 VPN을 확인해주세요.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = '서버 응답 시간이 초과되었습니다.\n잠시 후 다시 시도해주세요.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      platform.alert('❌ 추가 실패', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 상단 고정: 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditMode ? '거래 수정' : '새 거래 추가'}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        {/* 연락처 선택 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>연락처 선택 *</Text>
          <TextInput
            style={styles.input}
            placeholder="이름 또는 전화번호로 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          {/* 선택된 연락처 표시 */}
          {selectedContact && !showContactPicker && (
            <View style={styles.selectedContact}>
              <View style={styles.selectedContactInfo}>
                <Text style={styles.selectedContactName}>{selectedContact.name}</Text>
                <Text style={styles.selectedContactPhone}>{selectedContact.phoneNumber}</Text>
              </View>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSelectedContact(null);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* 연락처 자동완성 */}
          {showContactPicker && filteredContacts.length > 0 && (
            <View style={styles.contactPicker}>
              <ScrollView style={styles.contactPickerScroll} nestedScrollEnabled>
                {filteredContacts.slice(0, 10).map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactItem}
                    onPress={() => selectContact(contact)}
                  >
                    <View>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                    </View>
                    {contact.ledgerGroupId ? (
                      <View style={styles.contactBadge}>
                        <Text style={styles.contactBadgeText}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.contactWarning}>
                        <Text style={styles.contactWarningText}>!</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {searchQuery && !showContactPicker && !selectedContact && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
              <TouchableOpacity onPress={() => router.push('/contacts')}>
                <Text style={styles.noResultsLink}>연락처 탭에서 추가하기 →</Text>
              </TouchableOpacity>
            </View>
          )}
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

        {/* AI 이미지 분석 (선물 선택시만) */}
        {category === 'GIFT' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>📸 AI 가격 추정</Text>
            <TouchableOpacity
              style={[styles.imagePickerButton, (isAnalyzing || isUploading) && styles.imagePickerButtonDisabled]}
              onPress={showImagePicker}
              disabled={isAnalyzing || isUploading}
            >
              {isUploading ? (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator color="#ef4444" size="small" />
                  <Text style={styles.analyzingText}>이미지 업로드 중...</Text>
                </View>
              ) : isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator color="#ef4444" size="small" />
                  <Text style={styles.analyzingText}>AI 분석 중...</Text>
                </View>
              ) : uploadedImageUrl ? (
                <>
                  <Text style={styles.imagePickerIcon}>✅</Text>
                  <Text style={styles.imagePickerText}>이미지 업로드 완료</Text>
                  <Text style={styles.imagePickerSubtext}>다시 촬영/선택하려면 탭하세요</Text>
                </>
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

        {/* 금액 입력 (현금/선물일 때만 상단에 표시) */}
        {category !== 'GOLD' && (
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
        )}

        {/* 선물명 (선물 선택시만) */}
        {category === 'GIFT' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>선물명</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 정관장 홍삼"
              value={giftName}
              onChangeText={setGiftName}
            />
          </View>
        )}

        {/* 금 거래 전용 입력 폼 */}
        {category === 'GOLD' && (
          <>
            {/* 금 순도 선택 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>금 순도 *</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.optionButton, goldKarat === '24K' && styles.optionButtonActive]}
                  onPress={() => {
                    setGoldKarat('24K');
                    loadGoldRate();
                  }}
                >
                  <Text style={[styles.optionText, goldKarat === '24K' && styles.optionTextActive]}>
                    24K (순금)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, goldKarat === '18K' && styles.optionButtonActive]}
                  onPress={() => {
                    setGoldKarat('18K');
                    loadGoldRate();
                  }}
                >
                  <Text style={[styles.optionText, goldKarat === '18K' && styles.optionTextActive]}>
                    18K
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, goldKarat === '14K' && styles.optionButtonActive]}
                  onPress={() => {
                    setGoldKarat('14K');
                    loadGoldRate();
                  }}
                >
                  <Text style={[styles.optionText, goldKarat === '14K' && styles.optionTextActive]}>
                    14K
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 오늘의 금 시세 */}
            <View style={styles.goldRateCard}>
              <Text style={styles.goldRateTitle}>오늘의 금 시세 ({goldKarat})</Text>
              <Text style={styles.goldRatePrice}>
                {goldPricePerGram.toLocaleString()}원 / g
              </Text>
              <TouchableOpacity onPress={loadGoldRate}>
                <Text style={styles.goldRateRefresh}>🔄 새로고침</Text>
              </TouchableOpacity>
            </View>

            {/* 금 무게 입력 + 단위 선택 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>금 무게 *</Text>
              <View style={styles.goldWeightRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={goldWeightUnit === 'don' ? '예: 3.75' : goldWeightUnit === 'oz_t' ? '예: 1' : '예: 14'}
                  value={goldWeight}
                  onChangeText={setGoldWeight}
                  keyboardType="decimal-pad"
                />
                <View style={styles.goldUnitGroup}>
                  <TouchableOpacity
                    style={[styles.goldUnitButton, goldWeightUnit === 'don' && styles.goldUnitButtonActive]}
                    onPress={() => setGoldWeightUnit('don')}
                  >
                    <Text style={[styles.goldUnitText, goldWeightUnit === 'don' && styles.goldUnitTextActive]}>돈</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.goldUnitButton, goldWeightUnit === 'g' && styles.goldUnitButtonActive]}
                    onPress={() => setGoldWeightUnit('g')}
                  >
                    <Text style={[styles.goldUnitText, goldWeightUnit === 'g' && styles.goldUnitTextActive]}>g</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.goldUnitButton, goldWeightUnit === 'oz_t' && styles.goldUnitButtonActive]}
                    onPress={() => setGoldWeightUnit('oz_t')}
                  >
                    <Text style={[styles.goldUnitText, goldWeightUnit === 'oz_t' && styles.goldUnitTextActive]}>oz t</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.goldApplyButton} onPress={applyGoldAmount}>
                <Text style={styles.goldApplyButtonText}>금액 계산</Text>
              </TouchableOpacity>
            </View>

            {/* 금액 (원) - 금 선택 시 버튼 아래에 표시 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>금액 (원) *</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 100000 (금액 계산 버튼으로 채움)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          </>
        )}

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
            <Text style={styles.submitButtonText}>{isEditMode ? '수정 완료' : '추가하기'}</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
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
    paddingBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
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
  selectedContact: {
    marginTop: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedContactInfo: {
    flex: 1,
  },
  selectedContactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  selectedContactPhone: {
    fontSize: 14,
    color: '#3b82f6',
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#93c5fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactPicker: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 250,
  },
  contactPickerScroll: {
    maxHeight: 250,
  },
  contactItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  contactBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBadgeText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contactWarning: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactWarningText: {
    color: '#b45309',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noResults: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  noResultsLink: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
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
  // 금 거래 전용 스타일
  goldRateCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  goldRateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  goldRatePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#b45309',
    marginBottom: 8,
  },
  goldRateRefresh: {
    fontSize: 14,
    color: '#b45309',
    textDecorationLine: 'underline',
  },
  goldWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goldUnitGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  goldUnitButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  goldUnitButtonActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#f59e0b',
  },
  goldUnitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  goldUnitTextActive: {
    color: '#92400e',
  },
  goldApplyButton: {
    marginTop: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  goldApplyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
