/**
 * 금액을 한국 원화 형식으로 포맷팅
 * @param amount 금액
 * @returns 포맷팅된 문자열 (예: "1,000,000원")
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ko-KR')}원`;
};

/**
 * 주받 온도 계산 (0~100)
 * @param giveSum 준 금액 합계
 * @param receiveSum 받은 금액 합계
 * @returns 온도 (0~100)
 */
export const calculateTemperature = (giveSum: number, receiveSum: number): number => {
  if (giveSum + receiveSum === 0) return 50;
  const rawTemp = 50 + ((giveSum - receiveSum) / (giveSum + receiveSum)) * 50;
  return Math.min(Math.max(rawTemp, 0), 100); // 0~100 사이로 클램핑
};

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date 날짜
 * @returns 포맷팅된 문자열 (예: "2026년 1월 10일")
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};
