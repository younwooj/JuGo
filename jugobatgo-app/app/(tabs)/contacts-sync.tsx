import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { contactsApi } from '../../src/api/contacts';
import { ledgerApi } from '../../src/api/ledger';

// 하드코딩된 userId (실제로는 인증에서 가져와야 함)
const DEMO_USER_ID = 'dac1f274-38a5-4e4d-9df1-ab0f09c6bb4a';

interface PhoneContact {
  id: string;
  name: string;
  phoneNumbers: string[];
  selected: boolean;
  groupId?: string;
}

export default function ContactsSyncScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadLedgerGroups();
    requestPermission();
  }, []);

  const loadLedgerGroups = async () => {
    try {
      const groups = await ledgerApi.getAll();
      setLedgerGroups(groups);
    } catch (error) {
      console.error('장부 그룹 로딩 실패:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '연락처를 불러오려면 주소록 접근 권한이 필요합니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정으로 이동', onPress: () => {} },
          ]
        );
      }
    } catch (error) {
      console.error('권한 요청 실패:', error);
    }
  };

  const loadPhoneContacts = async () => {
    if (!hasPermission) {
      await requestPermission();
      return;
    }

    setLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const formatted: PhoneContact[] = data
          .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
          .map(contact => ({
            id: contact.id,
            name: contact.name || '이름 없음',
            phoneNumbers: contact.phoneNumbers?.map(p => p.number || '') || [],
            selected: false,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setPhoneContacts(formatted);
      } else {
        Alert.alert('알림', '연락처가 없습니다.');
      }
    } catch (error: any) {
      console.error('연락처 로딩 실패:', error);
      Alert.alert('오류', '연락처를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (contactId: string) => {
    setPhoneContacts(prev =>
      prev.map(c =>
        c.id === contactId ? { ...c, selected: !c.selected } : c
      )
    );
  };

  const assignGroup = (contactId: string, groupId: string) => {
    setPhoneContacts(prev =>
      prev.map(c =>
        c.id === contactId ? { ...c, groupId, selected: true } : c
      )
    );
  };

  const syncSelectedContacts = async () => {
    const selectedContacts = phoneContacts.filter(c => c.selected && c.groupId);
    
    if (selectedContacts.length === 0) {
      Alert.alert('알림', '동기화할 연락처를 선택하고 장부 그룹을 지정해주세요.');
      return;
    }

    setSyncing(true);

    try {
      // 대량 업서트 API 호출
      const contactsData = selectedContacts.map(contact => ({
        userId: DEMO_USER_ID,
        name: contact.name,
        phoneNumber: contact.phoneNumbers[0], // 첫 번째 번호 사용
        ledgerGroupId: contact.groupId!,
      }));

      const { success, failed } = await contactsApi.batchUpsert(contactsData);

      // 결과 표시
      if (failed.length === 0) {
        Alert.alert(
          '✅ 동기화 완료',
          `${success.length}명의 연락처가 성공적으로 동기화되었습니다.`,
          [
            {
              text: '확인',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert(
          '동기화 완료',
          `성공: ${success.length}명\n실패: ${failed.length}명\n\n실패한 연락처는 건너뛰었습니다.`,
          [
            {
              text: '실패 목록 보기',
              onPress: () => {
                const failedNames = failed.map(f => f.contact.name).join(', ');
                Alert.alert('실패 목록', failedNames);
              },
            },
            {
              text: '확인',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('동기화 실패:', error);
      Alert.alert('오류', '연락처 동기화에 실패했습니다.\n' + (error.message || ''));
    } finally {
      setSyncing(false);
    }
  };

  const selectAll = () => {
    const hasSelected = phoneContacts.some(c => c.selected);
    setPhoneContacts(prev =>
      prev.map(c => ({ ...c, selected: !hasSelected }))
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={styles.emptyTitle}>주소록 권한이 필요합니다</Text>
          <Text style={styles.emptyText}>
            연락처를 불러오려면 주소록 접근 권한을 허용해주세요.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>권한 요청</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>연락처 동기화</Text>
        <Text style={styles.headerSubtitle}>
          주소록에서 경조사 관리할 사람을 선택하세요
        </Text>
      </View>

      <View style={styles.contentContainer}>
        {phoneContacts.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyIcon}>📇</Text>
            <Text style={styles.emptyTitle}>연락처를 불러와주세요</Text>
            <Text style={styles.emptyText}>
              휴대폰 주소록에서 경조사 관리할 사람을 선택할 수 있습니다.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={loadPhoneContacts}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>연락처 불러오기</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 상단 액션 바 */}
            <View style={styles.actionBar}>
              <TouchableOpacity onPress={selectAll}>
                <Text style={styles.actionText}>
                  {phoneContacts.some(c => c.selected) ? '전체 해제' : '전체 선택'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.countText}>
                {phoneContacts.filter(c => c.selected).length} / {phoneContacts.length}명 선택
              </Text>
            </View>

            {/* 연락처 리스트 */}
            <FlatList
              data={phoneContacts}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.contactCard, item.selected && styles.contactCardSelected]}>
                  <TouchableOpacity
                    style={styles.contactHeader}
                    onPress={() => toggleContact(item.id)}
                  >
                    <View style={styles.checkbox}>
                      {item.selected && <View style={styles.checkboxChecked} />}
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactPhone}>{item.phoneNumbers[0]}</Text>
                    </View>
                  </TouchableOpacity>

                  {item.selected && (
                    <View style={styles.groupSelector}>
                      <Text style={styles.groupLabel}>장부 그룹:</Text>
                      <View style={styles.groupButtons}>
                        {ledgerGroups.map(group => (
                          <TouchableOpacity
                            key={group.id}
                            style={[
                              styles.groupButton,
                              item.groupId === group.id && styles.groupButtonSelected,
                            ]}
                            onPress={() => assignGroup(item.id, group.id)}
                          >
                            <Text
                              style={[
                                styles.groupButtonText,
                                item.groupId === group.id && styles.groupButtonTextSelected,
                              ]}
                            >
                              {group.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
              style={styles.list}
            />

            {/* 하단 동기화 버튼 */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  (syncing || phoneContacts.filter(c => c.selected && c.groupId).length === 0) &&
                    styles.syncButtonDisabled,
                ]}
                onPress={syncSelectedContacts}
                disabled={syncing || phoneContacts.filter(c => c.selected && c.groupId).length === 0}
              >
                {syncing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.syncButtonText}>
                    {phoneContacts.filter(c => c.selected && c.groupId).length}명 동기화
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
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
    paddingBottom: 32,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  countText: {
    color: '#6b7280',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  contactCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contactCardSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#ef4444',
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
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  groupSelector: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  groupButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  groupButtonSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  groupButtonTextSelected: {
    color: 'white',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  syncButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
