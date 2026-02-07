/**
 * 게스트 모드용 데모 데이터 (백엔드 연결 없이 UI 테스트 가능)
 */
import type { Transaction } from '../api/transactions';
import type { LedgerGroup } from '../api/ledger';
import type { Contact } from '../api/contacts';
import type {
  UserStatistics,
  CategoryStatistics,
  MonthlyStatistics,
  TopContact,
} from '../api/statistics';

const DEMO_LEDGER_ID = 'demo-ledger-1';
const DEMO_CONTACT_1 = { id: 'demo-contact-1', name: '김철수', phoneNumber: '010-1234-5678' };
const DEMO_CONTACT_2 = { id: 'demo-contact-2', name: '이영희', phoneNumber: '010-2345-6789' };
const DEMO_CONTACT_3 = { id: 'demo-contact-3', name: '박민수', phoneNumber: '010-3456-7890' };

export const MOCK_LEDGER_GROUPS: LedgerGroup[] = [
  {
    id: DEMO_LEDGER_ID,
    userId: 'guest',
    name: '가족/친지',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-ledger-2',
    userId: 'guest',
    name: '직장 동료',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-tx-1',
    contactId: DEMO_CONTACT_1.id,
    ledgerGroupId: DEMO_LEDGER_ID,
    type: 'GIVE',
    category: 'CASH',
    amount: 100000,
    originalName: null,
    goldInfo: null,
    memo: '결혼 축의금',
    eventDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contact: DEMO_CONTACT_1,
    ledgerGroup: { id: DEMO_LEDGER_ID, name: '가족/친지' },
  },
  {
    id: 'demo-tx-2',
    contactId: DEMO_CONTACT_2.id,
    ledgerGroupId: DEMO_LEDGER_ID,
    type: 'RECEIVE',
    category: 'GIFT',
    amount: 50000,
    originalName: null,
    goldInfo: null,
    memo: '생일 선물',
    eventDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contact: DEMO_CONTACT_2,
    ledgerGroup: { id: DEMO_LEDGER_ID, name: '가족/친지' },
  },
  {
    id: 'demo-tx-3',
    contactId: DEMO_CONTACT_3.id,
    ledgerGroupId: DEMO_LEDGER_ID,
    type: 'GIVE',
    category: 'CASH',
    amount: 30000,
    originalName: null,
    goldInfo: null,
    memo: '잡례',
    eventDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contact: DEMO_CONTACT_3,
    ledgerGroup: { id: DEMO_LEDGER_ID, name: '가족/친지' },
  },
];

export const MOCK_CONTACTS: Contact[] = [
  {
    id: DEMO_CONTACT_1.id,
    userId: 'guest',
    name: DEMO_CONTACT_1.name,
    phoneNumber: DEMO_CONTACT_1.phoneNumber,
    ledgerGroupId: DEMO_LEDGER_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: DEMO_CONTACT_2.id,
    userId: 'guest',
    name: DEMO_CONTACT_2.name,
    phoneNumber: DEMO_CONTACT_2.phoneNumber,
    ledgerGroupId: DEMO_LEDGER_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: DEMO_CONTACT_3.id,
    userId: 'guest',
    name: DEMO_CONTACT_3.name,
    phoneNumber: DEMO_CONTACT_3.phoneNumber,
    ledgerGroupId: DEMO_LEDGER_ID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_USER_STATS: UserStatistics = {
  totalGiveAmount: 130000,
  totalReceiveAmount: 50000,
  balance: -80000,
  transactionCount: 3,
  contactCount: 3,
  ledgerGroupCount: 2,
  jubadTemperature: 36.5,
  recentTransactions: MOCK_TRANSACTIONS.slice(0, 3).map((t) => ({
    id: t.id,
    type: t.type,
    category: t.category,
    amount: t.amount,
    eventDate: t.eventDate || t.createdAt,
    contact: { name: t.contact.name },
    ledgerGroup: { name: t.ledgerGroup.name },
  })),
};

export const MOCK_CATEGORY_STATS: CategoryStatistics = {
  CASH: { give: 130000, receive: 0, count: 2 },
  GIFT: { give: 0, receive: 50000, count: 1 },
  GOLD: { give: 0, receive: 0, count: 0 },
};

export const MOCK_MONTHLY_STATS: MonthlyStatistics = {
  [new Date().toISOString().slice(0, 7)]: {
    give: 130000,
    receive: 50000,
    balance: -80000,
  },
};

export const MOCK_TOP_CONTACTS: TopContact[] = [
  { id: DEMO_CONTACT_1.id, name: '김철수', phoneNumber: '010-1234-5678', give: 100000, receive: 0, balance: -100000, total: 100000, transactionCount: 1 },
  { id: DEMO_CONTACT_2.id, name: '이영희', phoneNumber: '010-2345-6789', give: 0, receive: 50000, balance: 50000, total: 50000, transactionCount: 1 },
  { id: DEMO_CONTACT_3.id, name: '박민수', phoneNumber: '010-3456-7890', give: 30000, receive: 0, balance: -30000, total: 30000, transactionCount: 1 },
];

export const MOCK_JUBAD_TEMPERATURE = 36.5;
