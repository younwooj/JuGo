import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { contactsApi, Contact } from '../../src/api/contacts';
import { ledgerApi } from '../../src/api/ledger';
import * as Contacts from 'expo-contacts';

const DEMO_USER_ID = 'dac1f274-38a5-4e4d-9df1-ab0f09c6bb4a';

export default function ContactsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactsData, groupsData] = await Promise.all([
        contactsApi.getAll(),
        ledgerApi.getAll(),
      ]);
      setContacts(contactsData);
      setLedgerGroups(groupsData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      if (Platform.OS === 'web') {
        alert('데이터를 불러올 수 없습니다.\n잠시 후 다시 시도해주세요.');
      } else {
        Alert.alert('오류', '데이터를 불러올 수 없습니다.\n잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const syncPhoneContacts = async () => {
    try {
      setSyncing(true);

      // 권한 요청
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          alert('연락처 접근 권한이 필요합니다');
        } else {
          Alert.alert('권한 필요', '연락처 접근 권한이 필요합니다');
        }
        return;
      }

      // 연락처 가져오기
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      if (data.length === 0) {
        if (Platform.OS === 'web') {
          alert('가져올 연락처가 없습니다');
        } else {
          Alert.alert('알림', '가져올 연락처가 없습니다');
        }
        return;
      }

      // 연락처 변환
      const contactsToSync = data
        .filter((contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact) => ({
          userId: DEMO_USER_ID,
          name: contact.name || '이름 없음',
          phoneNumber: contact.phoneNumbers![0].number || '',
        }));

      // 배치 업서트
      const result = await contactsApi.batchUpsert(contactsToSync);

      if (Platform.OS === 'web') {
        alert(`연락처 동기화 완료!\n성공: ${result.success.length}건\n실패: ${result.failed.length}건`);
      } else {
        Alert.alert(
          '동기화 완료',
          `성공: ${result.success.length}건\n실패: ${result.failed.length}건`
        );
      }

      // 새로고침
      await loadData();
    } catch (error) {
      console.error('연락처 동기화 실패:', error);
      if (Platform.OS === 'web') {
        alert('연락처 동기화에 실패했습니다');
      } else {
        Alert.alert('오류', '연락처 동기화에 실패했습니다');
      }
    } finally {
      setSyncing(false);
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setSelectedGroupId(contact.ledgerGroupId || '');
  };

  const closeEditModal = () => {
    setEditingContact(null);
    setSelectedGroupId('');
  };

  const saveContactGroup = async () => {
    if (!editingContact) return;

    try {
      await contactsApi.update(editingContact.id, {
        ledgerGroupId: selectedGroupId || undefined,
      });

      if (Platform.OS === 'web') {
        alert('장부 그룹이 설정되었습니다');
      } else {
        Alert.alert('완료', '장부 그룹이 설정되었습니다');
      }

      closeEditModal();
      await loadData();
    } catch (error) {
      console.error('장부 그룹 설정 실패:', error);
      if (Platform.OS === 'web') {
        alert('장부 그룹 설정에 실패했습니다');
      } else {
        Alert.alert('오류', '장부 그룹 설정에 실패했습니다');
      }
    }
  };

  const deleteContact = async (contact: Contact) => {
    const confirmDelete = Platform.OS === 'web'
      ? confirm(`"${contact.name}" 연락처를 삭제하시겠습니까?`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            '연락처 삭제',
            `"${contact.name}" 연락처를 삭제하시겠습니까?`,
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '삭제', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmDelete) return;

    try {
      await contactsApi.delete(contact.id);
      await loadData();
    } catch (error) {
      console.error('연락처 삭제 실패:', error);
      if (Platform.OS === 'web') {
        alert('연락처 삭제에 실패했습니다');
      } else {
        Alert.alert('오류', '연락처 삭제에 실패했습니다');
      }
    }
  };

  // 필터링된 연락처
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery);
    const matchesGroup = selectedGroupFilter === 'all' ||
      (selectedGroupFilter === 'unassigned' && !contact.ledgerGroupId) ||
      contact.ledgerGroupId === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  // 그룹별 통계
  const groupStats = ledgerGroups.map((group) => ({
    ...group,
    count: contacts.filter((c) => c.ledgerGroupId === group.id).length,
  }));

  const unassignedCount = contacts.filter((c) => !c.ledgerGroupId).length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>연락처 로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>연락처 관리</Text>
          <Text style={styles.headerSubtitle}>총 {contacts.length}명</Text>
        </View>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={syncPhoneContacts}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.syncButtonText}>📱 동기화</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="이름 또는 전화번호로 검색"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 장부 그룹 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterSection}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedGroupFilter === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedGroupFilter('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedGroupFilter === 'all' && styles.filterChipTextActive,
            ]}
          >
            전체 ({contacts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedGroupFilter === 'unassigned' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedGroupFilter('unassigned')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedGroupFilter === 'unassigned' && styles.filterChipTextActive,
            ]}
          >
            미분류 ({unassignedCount})
          </Text>
        </TouchableOpacity>

        {groupStats.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.filterChip,
              selectedGroupFilter === group.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedGroupFilter(group.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedGroupFilter === group.id && styles.filterChipTextActive,
              ]}
            >
              {group.name} ({group.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 연락처 리스트 */}
      <ScrollView style={styles.listSection}>
        {filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📇</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? '검색 결과가 없습니다'
                : '연락처가 없습니다\n상단의 동기화 버튼을 눌러주세요'}
            </Text>
          </View>
        ) : (
          <View style={styles.contactList}>
            {filteredContacts.map((contact, index) => {
              const group = ledgerGroups.find((g) => g.id === contact.ledgerGroupId);
              return (
                <View
                  key={contact.id}
                  style={[
                    styles.contactItem,
                    index < filteredContacts.length - 1 && styles.contactItemBorder,
                  ]}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {contact.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                    {group ? (
                      <View style={styles.contactGroupBadge}>
                        <Text style={styles.contactGroupText}>{group.name}</Text>
                      </View>
                    ) : (
                      <View style={styles.contactUnassignedBadge}>
                        <Text style={styles.contactUnassignedText}>미분류</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(contact)}
                    >
                      <Text style={styles.editButtonText}>📝</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteContact(contact)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 장부 그룹 설정 모달 */}
      {editingContact && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>장부 그룹 설정</Text>
            <Text style={styles.modalSubtitle}>{editingContact.name}</Text>

            <View style={styles.modalGroupList}>
              <TouchableOpacity
                style={[
                  styles.modalGroupItem,
                  !selectedGroupId && styles.modalGroupItemActive,
                ]}
                onPress={() => setSelectedGroupId('')}
              >
                <Text
                  style={[
                    styles.modalGroupText,
                    !selectedGroupId && styles.modalGroupTextActive,
                  ]}
                >
                  미분류
                </Text>
              </TouchableOpacity>

              {ledgerGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.modalGroupItem,
                    selectedGroupId === group.id && styles.modalGroupItemActive,
                  ]}
                  onPress={() => setSelectedGroupId(group.id)}
                >
                  <Text
                    style={[
                      styles.modalGroupText,
                      selectedGroupId === group.id && styles.modalGroupTextActive,
                    ]}
                  >
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={closeEditModal}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveContactGroup}>
                <Text style={styles.modalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  header: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  contactList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
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
    marginBottom: 4,
  },
  contactGroupBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  contactGroupText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  contactUnassignedBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  contactUnassignedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  // 모달 스타일
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  modalGroupList: {
    marginBottom: 20,
  },
  modalGroupItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#f9fafb',
  },
  modalGroupItemActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  modalGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalGroupTextActive: {
    color: '#ef4444',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
