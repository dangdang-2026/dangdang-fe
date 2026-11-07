import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { startOfDay } from '@/utils/date'

// 기록을 시작한 날: 설정을 마친 날과 가장 이른 기록 중 앞선 날. 둘 다 없으면 오늘
export function useRecordStart(today: Date) {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const insulins = useGlucoseStore((state) => state.insulins)
  const completedAt = useOnboardingStore((state) => state.completedAt)

  const times = [
    ...records.map((record) => record.measuredAt),
    ...meals.map((meal) => meal.startedAt),
    ...insulins.map((insulin) => insulin.takenAt),
    ...(completedAt ? [completedAt] : []),
  ].map((iso) => new Date(iso).getTime())

  return startOfDay(times.length ? new Date(Math.min(...times)) : today)
}
