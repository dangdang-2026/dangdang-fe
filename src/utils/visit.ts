import { diffInDays } from '@/utils/date'

export type VisitStatus =
  { kind: 'unknown' } | { kind: 'today'; at: Date } | { kind: 'upcoming'; at: Date; dDay: number }

// 다음 진료 상태. 날짜가 지났으면 모름과 같게 다시 묻기
export function getVisitStatus(nextVisitAt: string | null, now: Date): VisitStatus {
  if (!nextVisitAt) return { kind: 'unknown' }
  const at = new Date(nextVisitAt)
  const dDay = diffInDays(now, at)
  if (dDay < 0) return { kind: 'unknown' }
  if (dDay === 0) return { kind: 'today', at }
  return { kind: 'upcoming', at, dDay }
}
