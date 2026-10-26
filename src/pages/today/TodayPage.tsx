import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import GlucoseInputSheet from '@/components/glucose/GlucoseInputSheet'
import TodayHeader from '@/components/today/TodayHeader'
import HeroCard from '@/components/today/HeroCard'
import NotificationBanner from '@/components/today/NotificationBanner'
import TodayRecordSection from '@/components/today/TodayRecordSection'
import VisitCard from '@/components/today/VisitCard'
import MealContentSheet from '@/components/meal/MealContentSheet'
import { ROUTES } from '@/constants/routes'
import { useFoods } from '@/hooks/useFoods'
import { useNow } from '@/hooks/useNow'
import { useCriteria } from '@/hooks/useCriteria'
import { useProfileStore } from '@/stores/useProfileStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useVisitStore } from '@/stores/useVisitStore'
import type { GlucoseRecord, Meal, MeasureTarget, Portion } from '@/types/glucose'
import { isSameDay, startOfDay } from '@/utils/date'
import { formatPregnancyAge } from '@/utils/pregnancy'
import { formatVisitDay, getHomeVisitCard } from '@/utils/visit'
import { getHeroState, getMeasureTarget, getNextMealType, getSlotLabel } from '@/utils/glucose'
import { formatMealSavedMessage } from '@/utils/meal'

function TodayPage() {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const startMeal = useGlucoseStore((state) => state.startMeal)
  const skipMeal = useGlucoseStore((state) => state.skipMeal)
  const setMealContent = useGlucoseStore((state) => state.setMealContent)
  const foods = useFoods()
  const [sheetTarget, setSheetTarget] = useState<MeasureTarget | null>(null)
  const [writingMeal, setWritingMeal] = useState<Meal | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const criteria = useCriteria()
  const name = useProfileStore((state) => state.name)
  const dueDate = useProfileStore((state) => state.dueDate)

  const now = useNow()
  const todayMeals = meals.filter((meal) => isSameDay(new Date(meal.startedAt), now))
  const todayRecords = records.filter((record) => isSameDay(new Date(record.measuredAt), now))
  const heroState = getHeroState(meals, records, criteria.postMealHours, now)

  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const questionCount = useVisitStore((state) => state.questions.length)
  const navigate = useNavigate()
  const visitCard = getHomeVisitCard(nextVisitAt, now)
  // 진료 다음 날 카드는 진료 뒤 기준을 이미 바꿨으면 숨김
  const criteriaUpdated =
    visitCard?.kind === 'yesterday' &&
    criteria.version > 1 &&
    new Date(criteria.appliedFrom) >= startOfDay(visitCard.at)
  const openVisitCard = () => {
    navigate(visitCard?.kind === 'yesterday' ? ROUTES.VISIT_CRITERIA : ROUTES.VISIT_REPORT)
  }

  const handleStartMeal = () => {
    const current = new Date()
    startMeal(getNextMealType(meals, current), current)
  }

  const openGlucoseSheet = () => {
    setSheetTarget(getMeasureTarget(meals, records, criteria.postMealHours, new Date()))
  }
  const closeGlucoseSheet = useCallback(() => setSheetTarget(null), [])
  const closeMealSheet = useCallback(() => setWritingMeal(null), [])
  const closeToast = useCallback(() => setToast(null), [])

  const handleSaved = (record: GlucoseRecord) => {
    setSheetTarget(null)
    const label = getSlotLabel(record.slot, record.mealType, criteria.postMealHours)
    setToast(`${label} ${record.value} 저장했어요`)
  }

  const handleMealSaved = (mealFoods: string[], portion?: Portion) => {
    if (!writingMeal) return
    setMealContent(writingMeal.id, mealFoods, portion)
    setToast(formatMealSavedMessage({ ...writingMeal, foods: mealFoods, portion }, foods))
    setWritingMeal(null)
  }

  return (
    <main className="px-5 pt-15.5">
      <WarmBackground />
      <TodayHeader
        name={name}
        date={now}
        pregnancyLabel={formatPregnancyAge(dueDate, now)}
        visitLabel={formatVisitDay(nextVisitAt, now)}
      />
      <div className="mt-6">
        <HeroCard
          state={heroState}
          now={now}
          postMealHours={criteria.postMealHours}
          onStartMeal={handleStartMeal}
          onInputGlucose={openGlucoseSheet}
          onSkipMeal={skipMeal}
          onWriteMeal={setWritingMeal}
        />
      </div>
      {visitCard && !criteriaUpdated && (
        <div className="mt-4.5">
          <VisitCard card={visitCard} questionCount={questionCount} onOpen={openVisitCard} />
        </div>
      )}
      <div className="mt-4.5">
        <NotificationBanner />
      </div>
      <div className="mt-5.5">
        <TodayRecordSection
          meals={todayMeals}
          records={todayRecords}
          postMealHours={criteria.postMealHours}
          onInputGlucose={openGlucoseSheet}
        />
      </div>

      {sheetTarget && (
        <GlucoseInputSheet target={sheetTarget} onClose={closeGlucoseSheet} onSaved={handleSaved} />
      )}
      {writingMeal && (
        <MealContentSheet meal={writingMeal} onClose={closeMealSheet} onSaved={handleMealSaved} />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default TodayPage
