import type { InsulinKind, InsulinRecord, MealType } from '@/types/glucose'
import { addDays, formatTime, isSameDay } from '@/utils/date'

// Figma E-02 종류 칩
export const INSULIN_KIND_LABEL: Record<Exclude<InsulinKind, 'custom'>, string> = {
  meal: '식사 때 (속효성)',
  bedtime: '자기 전 (지속형)',
}

// Figma E-02 식사 때 인슐린의 끼니 칩
export const INSULIN_MEAL_LABEL: Record<MealType, string> = {
  breakfast: '아침 식사',
  lunch: '점심 식사',
  dinner: '저녁 식사',
}

// 맞은 시각으로 끼니 짐작. 11시 전 아침 · 16시 전 점심 · 그 뒤 저녁
export function guessMealType(date: Date): MealType {
  const hour = date.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 16) return 'lunch'
  return 'dinner'
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

// 지난 기록 줄. 예: 어제 저녁 식사 때 6단위 · 10월 12일 자기 전 8단위
export function formatLastInsulin(record: InsulinRecord, now: Date) {
  const date = new Date(record.takenAt)
  const day = isSameDay(date, now)
    ? '오늘'
    : isSameDay(date, addDays(now, -1))
      ? '어제'
      : `${date.getMonth() + 1}월 ${date.getDate()}일`
  const kind =
    record.kind === 'meal' && record.mealType
      ? `${INSULIN_MEAL_LABEL[record.mealType]} 때`
      : record.kind === 'custom'
        ? (record.name ?? '직접 입력')
        : SHORT_LABEL[record.kind]
  return `${day} ${kind} ${record.units}단위`
}
