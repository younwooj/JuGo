import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* 헤더 */}
      <View className="bg-primary-500 px-6 pt-12 pb-8">
        <Text className="text-white text-2xl font-bold">주고받고</Text>
        <Text className="text-white/80 text-sm mt-1">경조사 관리의 새로운 기준</Text>
      </View>

      {/* 주받 온도계 */}
      <View className="mx-6 -mt-6 bg-white rounded-2xl p-6 shadow-sm">
        <Text className="text-gray-700 text-base font-semibold mb-4">내 주받 온도</Text>
        
        {/* 온도계 바 */}
        <View className="h-8 bg-gray-200 rounded-full overflow-hidden mb-3">
          <View 
            className="h-full bg-gradient-to-r from-blue-500 to-red-500 rounded-full"
            style={{ width: '65%' }}
          />
        </View>

        {/* 온도 표시 */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-primary-500">65°</Text>
            <Text className="text-gray-500 text-sm mt-1">균형 상태</Text>
          </View>
          <TouchableOpacity className="bg-primary-50 px-4 py-2 rounded-lg">
            <Text className="text-primary-500 font-semibold">자세히 보기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 요약 카드 */}
      <View className="mx-6 mt-6">
        <Text className="text-gray-900 text-lg font-bold mb-3">이번 달 요약</Text>
        
        <View className="flex-row gap-3">
          {/* 준 금액 */}
          <View className="flex-1 bg-red-50 rounded-xl p-4">
            <Text className="text-red-600 text-sm font-semibold">준 금액</Text>
            <Text className="text-red-900 text-2xl font-bold mt-2">₩ 500,000</Text>
            <Text className="text-red-600/60 text-xs mt-1">5건</Text>
          </View>

          {/* 받은 금액 */}
          <View className="flex-1 bg-blue-50 rounded-xl p-4">
            <Text className="text-blue-600 text-sm font-semibold">받은 금액</Text>
            <Text className="text-blue-900 text-2xl font-bold mt-2">₩ 300,000</Text>
            <Text className="text-blue-600/60 text-xs mt-1">3건</Text>
          </View>
        </View>
      </View>

      {/* 최근 거래 내역 */}
      <View className="mx-6 mt-6 mb-8">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-900 text-lg font-bold">최근 거래</Text>
          <TouchableOpacity>
            <Text className="text-primary-500 text-sm">전체보기</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl overflow-hidden">
          {/* 거래 항목 1 */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center">
              <Text className="text-red-600 font-bold">송</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-semibold">김철수</Text>
              <Text className="text-gray-500 text-sm">결혼식 축의금 • 회사 동료</Text>
            </View>
            <Text className="text-red-600 font-bold">-100,000원</Text>
          </View>

          {/* 거래 항목 2 */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
              <Text className="text-blue-600 font-bold">수</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-semibold">이영희</Text>
              <Text className="text-gray-500 text-sm">생일 선물 • 친구</Text>
            </View>
            <Text className="text-blue-600 font-bold">+50,000원</Text>
          </View>

          {/* 거래 항목 3 */}
          <View className="flex-row items-center p-4">
            <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center">
              <Text className="text-red-600 font-bold">송</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-semibold">박민수</Text>
              <Text className="text-gray-500 text-sm">장례식 조의금 • 가족</Text>
            </View>
            <Text className="text-red-600 font-bold">-200,000원</Text>
          </View>
        </View>
      </View>

      {/* 빠른 작업 버튼 */}
      <View className="mx-6 mb-8">
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-primary-500 rounded-xl p-4 items-center">
            <Text className="text-white font-bold text-base">거래 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white border-2 border-primary-500 rounded-xl p-4 items-center">
            <Text className="text-primary-500 font-bold text-base">장부 관리</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
