import { formatMonthDay } from '@/utils/date'

// 정보통신망법 제50조 광고 수신 동의 · 거부 처리 결과 안내. 예: 11월 23일 광고성 정보 수신에 동의했어요 (당당)
export function marketingResultText(agreed: boolean, date = new Date()) {
  return `${formatMonthDay(date)} 광고성 정보 수신${agreed ? '에 동의했어요' : '을 거부했어요'} (당당)`
}
