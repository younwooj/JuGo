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
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { platform } from '../../src/utils/platform';
import { contactsApi, Contact } from '../../src/api/contacts';
import { ledgerApi } from '../../src/api/ledger';
import * as Contacts from 'expo-contacts';
import { useAuthStore } from '../../src/store/authStore';
import { MOCK_CONTACTS, MOCK_LEDGER_GROUPS } from '../../src/mock/demoData';

export default function ContactsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isGuest = !user || user.id === 'guest';
  const userId = user?.id;
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

      if (isGuest || !userId) {
        setContacts(MOCK_CONTACTS);
        setLedgerGroups(MOCK_LEDGER_GROUPS);
        return;
      }

      const [contactsData, groupsData] = await Promise.all([
        contactsApi.getAll(userId),
        ledgerApi.getAll(userId),
      ]);
      setContacts(contactsData);
      setLedgerGroups(groupsData);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      platform.alert('오류', '데이터를 불러올 수 없습니다.\n잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const syncPhoneContacts = async () => {
    if (isGuest) {
      platform.alert('알림', '게스트 모드에서는 연락처 동기화를 사용할 수 없습니다.\n테스트 계정으로 로그인해주세요.');
      return;
    }
    try {
      setSyncing(true);

      // 권한 요청
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        platform.alert('권한 필요', '연락처 접근 권한이 필요합니다');
        return;
      }

      // 연락처 가져오기
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      if (data.length === 0) {
        platform.alert('알림', '가져올 연락처가 없습니다');
        return;
      }

      if (!userId) {
        platform.alert('오류', '로그인 정보가 없습니다.');
        return;
      }

      // 연락처 변환 (이름, 전화번호만 — 서버에서 userId 기준 upsert)
      const contactsToSync = data
        .filter((contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact) => ({
          name: contact.name || '이름 없음',
          phoneNumber: contact.phoneNumbers![0].number?.trim() || '',
        }))
        .filter((c) => c.phoneNumber.length > 0);

      const result = await contactsApi.batchUpsert(userId, contactsToSync);

      platform.alert(
        '동기화 완료',
        `성공: ${result.success.length}건\n실패: ${result.failed.length}건`
      );

      // 새로고침
      await loadData();
    } catch (error) {
      console.error('연락처 동기화 실패:', error);
      platform.alert('오류', '연락처 동기화에 실패했습니다');
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
    if (isGuest) {
      platform.alert('알림', '게스트 모드에서는 장부 그룹을 변경할 수 없습니다.');
      return;
    }
    try {
      await contactsApi.update(editingContact.id, {
        ledgerGroupId: selectedGroupId || undefined,
      });

      platform.alert('완료', '장부 그룹이 설정되었습니다');

      closeEditModal();
      await loadData();
    } catch (error) {
      console.error('장부 그룹 설정 실패:', error);
      platform.alert('오류', '장부 그룹 설정에 실패했습니다');
    }
  };

  const deleteContact = async (contact: Contact) => {
    const confirmDelete = await platform.confirm(
      '연락처 삭제',
      `"${contact.name}" 연락처를 삭제하시겠습니까?`,
      { confirmText: '삭제', cancelText: '취소' }
    );

    if (!confirmDelete) return;

    try {
      await contactsApi.delete(contact.id);
      await loadData();
    } catch (error) {
      console.error('연락처 삭제 실패:', error);
      platform.alert('오류', '연락처 삭제에 실패했습니다');
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
        </View>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={syncPhoneContacts}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <View style={styles.syncButtonContent}>
              <Ionicons name="phone-portrait-outline" size={18} color="white" />
              <Text style={styles.syncButtonText}> 동기화</Text>
            </View>
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterSection}
        contentContainerStyle={styles.filterSectionContent}
      >
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
            전체 {contacts.length}
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
            미분류 {unassignedCount}
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
              {group.name} {group.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 연락처 리스트 */}
      <ScrollView style={styles.listSection}>
        {filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#9ca3af" />
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
                      <Ionicons name="create-outline" size={20} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteContact(contact)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#374151" />
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
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
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
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
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
