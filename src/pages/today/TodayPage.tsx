import { useCallback, useState } from 'react'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import GlucoseInputSheet from '@/components/glucose/GlucoseInputSheet'
import TodayHeader from '@/components/today/TodayHeader'
import HeroCard from '@/components/today/HeroCard'
import NotificationBanner from '@/components/today/NotificationBanner'
import TodayRecordSection from '@/components/today/TodayRecordSection'
import { useNow } from '@/hooks/useNow'
import { MOCK_USER } from '@/mocks/user'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import type { GlucoseRecord, MeasureTarget } from '@/types/glucose'
import { isSameDay } from '@/utils/date'
import { getHeroState, getMeasureTarget, getNextMealType, getSlotLabel } from '@/utils/glucose'

function TodayPage() {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const startMeal = useGlucoseStore((state) => state.startMeal)
  const skipMeal = useGlucoseStore((state) => state.skipMeal)
  const [sheetTarget, setSheetTarget] = useState<MeasureTarget | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const now = useNow()
  const todayMeals = meals.filter((meal) => isSameDay(new Date(meal.startedAt), now))
  const todayRecords = records.filter((record) => isSameDay(new Date(record.measuredAt), now))
  const heroState = getHeroState(meals, records, MOCK_USER.postMealHours, now)

  const handleStartMeal = () => {
    const current = new Date()
    startMeal(getNextMealType(meals, current), current)
  }

  const openGlucoseSheet = () => {
    setSheetTarget(getMeasureTarget(meals, records, MOCK_USER.postMealHours, new Date()))
  }
  const closeGlucoseSheet = useCallback(() => setSheetTarget(null), [])
  const closeToast = useCallback(() => setToast(null), [])

  const handleSaved = (record: GlucoseRecord) => {
    setSheetTarget(null)
    const label = getSlotLabel(record.slot, record.mealType, MOCK_USER.postMealHours)
    setToast(`${label} ${record.value} 저장했어요`)
  }

  return (
    <main className="px-5 pt-15.5">
      <WarmBackground />
      <TodayHeader name={MOCK_USER.name} date={now} />
      <div className="mt-6">
        <HeroCard
          state={heroState}
          now={now}
          postMealHours={MOCK_USER.postMealHours}
          onStartMeal={handleStartMeal}
          onInputGlucose={openGlucoseSheet}
          onSkipMeal={skipMeal}
        />
      </div>
      <div className="mt-4.5">
        <NotificationBanner />
      </div>
      <div className="mt-5.5">
        <TodayRecordSection
          meals={todayMeals}
          records={todayRecords}
          postMealHours={MOCK_USER.postMealHours}
          onInputGlucose={openGlucoseSheet}
        />
      </div>

      {sheetTarget && (
        <GlucoseInputSheet target={sheetTarget} onClose={closeGlucoseSheet} onSaved={handleSaved} />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default TodayPage
