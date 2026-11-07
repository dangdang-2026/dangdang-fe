import type { InsulinKind, InsulinRecord } from '@/types/glucose'
import { addDays, formatTime, isSameDay } from '@/utils/date'

// Figma E-02 종류 칩. 직접 입력은 이름을 적음
export const INSULIN_KIND_LABEL: Record<Exclude<InsulinKind, 'custom'>, string> = {
  meal: '식사 때 (속효성)',
  bedtime: '자기 전 (지속형)',
}

const SHORT_LABEL: Record<Exclude<InsulinKind, 'custom'>, string> = {
  meal: '식사 때',
  bedtime: '자기 전',
}

// 예: 인슐린 · 식사 때 6단위
export function formatInsulinLabel(record: InsulinRecord) {
  const kind = record.kind === 'custom' ? (record.name ?? '직접 입력') : SHORT_LABEL[record.kind]
  return `인슐린 · ${kind} ${record.units}단위`
}

function partOfDay(hour: number) {
  if (hour < 5) return '새벽'
  if (hour < 11) return '아침'
  if (hour < 15) return '점심'
  if (hour < 18) return '오후'
  if (hour < 22) return '저녁'
  return '밤'
}

// 예: 오늘 저녁 18:25 · 어제 밤 22:10 · 10월 12일 아침 08:00
export function formatTakenAt(date: Date, now: Date) {
  const day = isSameDay(date, now)
    ? '오늘'
    : isSameDay(date, addDays(now, -1))
      ? '어제'
      : `${date.getMonth() + 1}월 ${date.getDate()}일`
  return `${day} ${partOfDay(date.getHours())} ${formatTime(date)}`
}
