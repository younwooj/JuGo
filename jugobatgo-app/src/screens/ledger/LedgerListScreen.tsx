import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';

interface LedgerGroup {
  id: string;
  name: string;
  transactionCount: number;
  balance: number;
  temperature: number;
}

const mockLedgerGroups: LedgerGroup[] = [
  { id: '1', name: '회사 동료', transactionCount: 12, balance: 200000, temperature: 72 },
  { id: '2', name: '고등학교 친구', transactionCount: 8, balance: -50000, temperature: 45 },
  { id: '3', name: '가족', transactionCount: 15, balance: 500000, temperature: 85 },
  { id: '4', name: '대학교 동기', transactionCount: 6, balance: 100000, temperature: 60 },
];

export default function LedgerListScreen() {
  const getTemperatureColor = (temperature: number): string => {
    if (temperature >= 70) return 'bg-red-500';
    if (temperature >= 40) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getTemperatureText = (temperature: number): string => {
    if (temperature >= 70) return '많이 줌';
    if (temperature >= 40) return '균형';
    return '많이 받음';
  };

  const renderLedgerItem = ({ item }: { item: LedgerGroup }) => (
    <TouchableOpacity 
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
      onPress={() => console.log('Navigate to ledger detail:', item.id)}
    >
      {/* 그룹 이름과 온도 */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-gray-900 text-lg font-bold">{item.name}</Text>
        <View className="flex-row items-center">
          <View className={`w-2 h-2 rounded-full ${getTemperatureColor(item.temperature)} mr-2`} />
          <Text className="text-gray-600 text-sm">{item.temperature}°</Text>
        </View>
      </View>

      {/* 거래 정보 */}
      <View className="flex-row justify-between items-center">
        <Text className="text-gray-500 text-sm">거래 {item.transactionCount}건</Text>
        <View className="flex-row items-center">
          <Text className={`text-sm font-semibold ${item.balance >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
            {item.balance >= 0 ? '+' : ''}{item.balance.toLocaleString()}원
          </Text>
          <Text className="text-gray-400 text-xs ml-2">• {getTemperatureText(item.temperature)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* 헤더 */}
      <View className="bg-primary-500 px-6 pt-12 pb-6">
        <Text className="text-white text-2xl font-bold">장부 관리</Text>
        <Text className="text-white/80 text-sm mt-1">그룹별로 관리하는 나의 경조사</Text>
      </View>

      {/* 통계 요약 */}
      <View className="mx-6 -mt-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-gray-500 text-sm">전체 장부</Text>
            <Text className="text-gray-900 text-2xl font-bold mt-1">{mockLedgerGroups.length}</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-gray-500 text-sm">총 거래</Text>
            <Text className="text-gray-900 text-2xl font-bold mt-1">
              {mockLedgerGroups.reduce((sum, g) => sum + g.transactionCount, 0)}
            </Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-gray-500 text-sm">총 잔액</Text>
            <Text className="text-primary-500 text-2xl font-bold mt-1">
              +{mockLedgerGroups.reduce((sum, g) => sum + g.balance, 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* 장부 리스트 */}
      <View className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-900 text-lg font-bold">내 장부 목록</Text>
          <TouchableOpacity className="bg-primary-500 px-4 py-2 rounded-lg">
            <Text className="text-white font-semibold">+ 새 장부</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={mockLedgerGroups}
          renderItem={renderLedgerItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </View>
  );
}
