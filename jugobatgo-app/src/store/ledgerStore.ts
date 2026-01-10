import { create } from 'zustand';

export interface Transaction {
  id: string;
  contactId: string;
  type: 'GIVE' | 'RECEIVE';
  category: 'CASH' | 'GIFT' | 'GOLD';
  amount: number;
  originalName?: string;
  goldInfo?: {
    purity: string;
    weight: number;
    unit: string;
  };
  memo?: string;
  createdAt: Date;
}

interface LedgerState {
  transactions: Transaction[];
  selectedLedgerGroupId: string | null;
  addTransaction: (transaction: Transaction) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setSelectedLedgerGroupId: (id: string | null) => void;
  clearTransactions: () => void;
}

export const useLedgerStore = create<LedgerState>((set) => ({
  transactions: [],
  selectedLedgerGroupId: null,
  
  addTransaction: (transaction) => set((state) => ({ 
    transactions: [transaction, ...state.transactions] 
  })),
  
  setTransactions: (transactions) => set({ transactions }),
  
  setSelectedLedgerGroupId: (id) => set({ selectedLedgerGroupId: id }),
  
  clearTransactions: () => set({ transactions: [] }),
}));
