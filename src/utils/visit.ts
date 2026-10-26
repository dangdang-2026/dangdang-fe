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

// 홈 진료 카드: 진료 전날·당일·다음 날만
export type HomeVisitCard = { kind: 'tomorrow' | 'today' | 'yesterday'; at: Date }

export function getHomeVisitCard(nextVisitAt: string | null, now: Date): HomeVisitCard | null {
  if (!nextVisitAt) return null
  const at = new Date(nextVisitAt)
  const dDay = diffInDays(now, at)
  if (dDay === 1) return { kind: 'tomorrow', at }
  if (dDay === 0) return { kind: 'today', at }
  if (dDay === -1) return { kind: 'yesterday', at }
  return null
}

// 홈 헤더용. 예: 진료 D-5 / 오늘 진료 / 어제 진료
export function formatVisitDay(nextVisitAt: string | null, now: Date) {
  if (!nextVisitAt) return null
  const dDay = diffInDays(now, new Date(nextVisitAt))
  if (dDay > 0) return `진료 D-${dDay}`
  if (dDay === 0) return '오늘 진료'
  if (dDay === -1) return '어제 진료'
  return null
}
