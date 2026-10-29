import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import GlucoseInputSheet from '@/components/glucose/GlucoseInputSheet'
import InsulinSheet from '@/components/insulin/InsulinSheet'
import ContactMemoSheet from '@/components/my/ContactMemoSheet'
import TodayHeader from '@/components/today/TodayHeader'
import HeroCard from '@/components/today/HeroCard'
import HospitalHero from '@/components/today/hero/HospitalHero'
import NotificationBanner from '@/components/today/NotificationBanner'
import NotificationPermissionSheet from '@/components/today/NotificationPermissionSheet'
import QuickActions from '@/components/today/QuickActions'
import TodayRecordSection from '@/components/today/TodayRecordSection'
import VisitCard from '@/components/today/VisitCard'
import MealContentSheet from '@/components/meal/MealContentSheet'
import PostpartumToday from '@/components/postpartum/PostpartumToday'
import { ROUTES } from '@/constants/routes'
import { useFoods } from '@/hooks/useFoods'
import { useNow } from '@/hooks/useNow'
import { useCriteria } from '@/hooks/useCriteria'
import { useProfileStore } from '@/stores/useProfileStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useVisitStore } from '@/stores/useVisitStore'
import type { GlucoseRecord, InsulinKind, Meal, MeasureTarget, Portion } from '@/types/glucose'
import { isSameDay, startOfDay } from '@/utils/date'
import { formatPregnancyAge } from '@/utils/pregnancy'
import { formatVisitDay, getHomeVisitCard } from '@/utils/visit'
import { getHeroState, getMeasureTarget, getNextMealType, getSlotLabel } from '@/utils/glucose'
import { formatMealSavedMessage } from '@/utils/meal'

function TodayPage() {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const insulins = useGlucoseStore((state) => state.insulins)
  const startMeal = useGlucoseStore((state) => state.startMeal)
  const skipMeal = useGlucoseStore((state) => state.skipMeal)
  const setMealContent = useGlucoseStore((state) => state.setMealContent)
  const addInsulin = useGlucoseStore((state) => state.addInsulin)
  const foods = useFoods()
  const [sheetTarget, setSheetTarget] = useState<MeasureTarget | null>(null)
  const [writingMeal, setWritingMeal] = useState<Meal | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [insulinSheet, setInsulinSheet] = useState(false)
  const [memoSheet, setMemoSheet] = useState(false)
  const [permissionSheet, setPermissionSheet] = useState(false)
  const permissionAsked = useNotificationStore((state) => state.permissionAsked)
  const markPermissionAsked = useNotificationStore((state) => state.markPermissionAsked)
  const updateNotification = useNotificationStore((state) => state.updateSettings)
  const criteria = useCriteria()
  const name = useProfileStore((state) => state.name)
  const dueDate = useProfileStore((state) => state.dueDate)
  const hospitalized = useProfileStore((state) => state.hospitalized)
  const deliveryDate = useProfileStore((state) => state.deliveryDate)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const insulinMode = useProfileStore((state) => state.careMode === 'insulin')
  const contactMemo = useProfileStore((state) => state.contactMemo)

  const now = useNow()
  const todayMeals = meals.filter((meal) => isSameDay(new Date(meal.startedAt), now))
  const todayRecords = records.filter((record) => isSameDay(new Date(record.measuredAt), now))
  const todayInsulins = insulins.filter((insulin) => isSameDay(new Date(insulin.takenAt), now))
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
    // 첫 식사 시작 때 한 번만 알림 허용 안내
    if (!permissionAsked) setPermissionSheet(true)
  }

  const finishPermission = (granted: boolean) => {
    markPermissionAsked()
    updateNotification({ measure: granted })
    setPermissionSheet(false)
    setToast(granted ? '측정 시간에 알려 드릴게요' : '알림 없이 기록만 할게요')
  }

  const allowNotification = async () => {
    // 알림을 못 쓰는 브라우저(홈 화면 추가 전 iPhone 등)는 기록만
    if (!('Notification' in window)) {
      finishPermission(false)
      return
    }
    const permission = await Notification.requestPermission()
    finishPermission(permission === 'granted')
  }

  // 같은 종류로 마지막에 적은 단위. 새로 적을 때 시작값
  const lastUnits: Partial<Record<InsulinKind, number>> = {}
  ;[...insulins]
    .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
    .forEach((insulin) => {
      lastUnits[insulin.kind] = insulin.units
    })

  // 식사 적기는 오늘 마지막 끼니. 아직 없으면 식사 시작부터
  const writeLatestMeal = () => {
    const latest = todayMeals.at(-1)
    if (latest) setWritingMeal(latest)
    else setToast('식사 시작을 먼저 눌러 주세요')
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

  // 출산일을 적었으면 산후 홈
  if (deliveryDate) {
    return (
      <main className="px-5 pt-15.5">
        <PostpartumToday name={name} deliveryDate={deliveryDate} now={now} />
      </main>
    )
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
        {hospitalized ? (
          <HospitalHero
            onResume={() => {
              updateProfile({ hospitalized: false })
              setToast('측정 알림을 다시 켰어요')
            }}
          />
        ) : (
          <HeroCard
            state={heroState}
            now={now}
            postMealHours={criteria.postMealHours}
            onStartMeal={handleStartMeal}
            onInputGlucose={openGlucoseSheet}
            onSkipMeal={skipMeal}
            onWriteMeal={setWritingMeal}
          />
        )}
      </div>
      <div className="mt-5">
        <QuickActions
          insulinMode={insulinMode}
          onInputGlucose={openGlucoseSheet}
          onWriteMeal={writeLatestMeal}
          onOpenReport={() => navigate(ROUTES.VISIT_REPORTS)}
          onInsulin={() => setInsulinSheet(true)}
          onContactMemo={() => setMemoSheet(true)}
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
          insulins={todayInsulins}
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
      {insulinSheet && (
        <InsulinSheet
          lastUnits={lastUnits}
          onSave={(input) => {
            addInsulin(input)
            setInsulinSheet(false)
            setToast(`인슐린 ${input.units}단위 기록했어요`)
          }}
          onClose={() => setInsulinSheet(false)}
        />
      )}
      {memoSheet && (
        <ContactMemoSheet
          initialMemo={contactMemo}
          onSave={(memo) => {
            updateProfile({ contactMemo: memo })
            setMemoSheet(false)
            setToast('연락 기준 메모를 저장했어요')
          }}
          onClose={() => setMemoSheet(false)}
        />
      )}
      {permissionSheet && (
        <NotificationPermissionSheet
          onAllow={allowNotification}
          onSkip={() => finishPermission(false)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default TodayPage
