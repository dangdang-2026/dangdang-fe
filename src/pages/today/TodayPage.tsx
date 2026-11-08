import { useCallback, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { subscribePush } from '@/api/push'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import GlucoseInputSheet from '@/components/glucose/GlucoseInputSheet'
import InsulinSheet from '@/components/insulin/InsulinSheet'
import ContactMemoSheet from '@/components/my/ContactMemoSheet'
import TodayHeader from '@/components/today/TodayHeader'
import HeroCard from '@/components/today/HeroCard'
import HospitalHero from '@/components/today/hero/HospitalHero'
import OfflineHero from '@/components/today/hero/OfflineHero'
import NotificationBanner from '@/components/today/NotificationBanner'
import NotificationPermissionSheet from '@/components/today/NotificationPermissionSheet'
import OfflineBanner from '@/components/today/OfflineBanner'
import QuickActions from '@/components/today/QuickActions'
import TodayRecordSection from '@/components/today/TodayRecordSection'
import VisitCard from '@/components/today/VisitCard'
import WaitingMeasureCard from '@/components/today/WaitingMeasureCard'
import MealWriteFlow from '@/components/meal/MealWriteFlow'
import PostpartumToday from '@/components/postpartum/PostpartumToday'
import { ROUTES } from '@/constants/routes'
import { useFoods } from '@/hooks/useFoods'
import { useNow } from '@/hooks/useNow'
import { useOnline } from '@/hooks/useOnline'
import { useCriteria } from '@/hooks/useCriteria'
import { useProfileStore } from '@/stores/useProfileStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useInboxStore } from '@/stores/useInboxStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useVisitStore } from '@/stores/useVisitStore'
import type {
  GlucoseRecord,
  InsulinKind,
  Meal,
  MeasureTarget,
  NutritionEdits,
  Portion,
} from '@/types/glucose'
import { formatTime, isSameDay, startOfDay } from '@/utils/date'
import { formatPregnancyAge } from '@/utils/pregnancy'
import { formatVisitDay, getHomeVisitCard } from '@/utils/visit'
import {
  getHeroState,
  getMeasureTarget,
  getMissedMeals,
  getNextMealType,
  getSlotLabel,
  isDayEnd,
  type HeroState,
} from '@/utils/glucose'
import { formatMealSavedMessage } from '@/utils/meal'

// Figma H-03~H-07 상태별 헤더 제목. 없으면 인사
const HEADER_TITLE: Partial<Record<HeroState['kind'], string>> = {
  eating: '식사 시작했어요',
  'eating-open': '식사 시작했어요',
  'measure-time': '지금 재 주세요',
  overdue: '측정이 조금 늦었어요',
  'day-end': '오늘 하루 수고했어요',
}

// 측정을 기다리는 동안엔 히어로와 기다리는 측정만
const WAITING_KINDS: HeroState['kind'][] = ['eating', 'measure-time', 'overdue']

function TodayPage() {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const insulins = useGlucoseStore((state) => state.insulins)
  const startMeal = useGlucoseStore((state) => state.startMeal)
  const skipMeal = useGlucoseStore((state) => state.skipMeal)
  const setMealContent = useGlucoseStore((state) => state.setMealContent)
  const addInsulin = useGlucoseStore((state) => state.addInsulin)
  const foods = useFoods()
  const criteria = useCriteria()
  const navigate = useNavigate()
  const location = useLocation()
  // 알림함·측정 알림(앱 밖에서 열면 ?measure=1)을 누르고 오면 혈당 입력 시트부터
  const [searchParams] = useSearchParams()
  const fromMeasureAlert =
    !!(location.state as { openGlucose?: boolean } | null)?.openGlucose ||
    searchParams.get('measure') === '1'
  const [sheetTarget, setSheetTarget] = useState<MeasureTarget | null>(() =>
    fromMeasureAlert ? getMeasureTarget(meals, records, criteria.postMealHours, new Date()) : null,
  )
  // 오늘 탭이 열려 있을 때 알림을 눌러도 시트를 엶
  const [seenAlert, setSeenAlert] = useState(fromMeasureAlert)
  if (fromMeasureAlert !== seenAlert) {
    setSeenAlert(fromMeasureAlert)
    if (fromMeasureAlert) {
      setSheetTarget(getMeasureTarget(meals, records, criteria.postMealHours, new Date()))
    }
  }
  const hasUnread = useInboxStore((state) => state.items.some((item) => !item.readAt))
  const [writingMeal, setWritingMeal] = useState<Meal | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [insulinSheet, setInsulinSheet] = useState(false)
  const [memoSheet, setMemoSheet] = useState(false)
  const [permissionSheet, setPermissionSheet] = useState(false)
  const permissionAsked = useNotificationStore((state) => state.permissionAsked)
  const measureNotification = useNotificationStore((state) => state.measure)
  const markPermissionAsked = useNotificationStore((state) => state.markPermissionAsked)
  const updateNotification = useNotificationStore((state) => state.updateSettings)
  const name = useProfileStore((state) => state.name)
  const dueDate = useProfileStore((state) => state.dueDate)
  const hospitalized = useProfileStore((state) => state.hospitalized)
  const deliveryDate = useProfileStore((state) => state.deliveryDate)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const insulinMode = useProfileStore((state) => state.careMode === 'insulin')
  const contactMemo = useProfileStore((state) => state.contactMemo)

  const now = useNow()
  const { online, recheck } = useOnline()
  const todayMeals = meals.filter((meal) => isSameDay(new Date(meal.startedAt), now))
  const todayRecords = records.filter((record) => isSameDay(new Date(record.measuredAt), now))
  const todayInsulins = insulins.filter((insulin) => isSameDay(new Date(insulin.takenAt), now))
  const heroState = getHeroState(meals, records, criteria.postMealHours, now)
  const waitingMeasure = !hospitalized && WAITING_KINDS.includes(heroState.kind)
  const firstDay = heroState.kind === 'first-day'
  // 저녁 이후 놓친 식후 측정은 오늘 기록에 나중에 채우기 줄로
  const missedMeals = isDayEnd(now)
    ? getMissedMeals(meals, records, criteria.postMealHours, now)
    : []
  // 측정 알림을 껐거나 브라우저 권한이 없으면 알림 꺼짐 배너
  const notificationsOff =
    !measureNotification || !('Notification' in window) || Notification.permission !== 'granted'

  const nextVisitAt = useVisitStore((state) => state.nextVisitAt)
  const questionCount = useVisitStore((state) => state.questions.length)
  const visitCard = getHomeVisitCard(nextVisitAt, now)
  // 진료 다음 날 카드는 진료 뒤 기준을 이미 바꿨으면 숨김
  const criteriaUpdated =
    visitCard?.kind === 'yesterday' &&
    criteria.version > 1 &&
    new Date(criteria.appliedFrom) >= startOfDay(visitCard.at)
  const openVisitCard = () => {
    navigate(visitCard?.kind === 'yesterday' ? ROUTES.VISIT_NOTE : ROUTES.VISIT_REPORT)
  }

  const handleStartMeal = () => {
    const current = new Date()
    startMeal(getNextMealType(meals, current), current)
    // 첫 식사 시작 때 한 번만 알림 허용 안내
    if (!permissionAsked) {
      setPermissionSheet(true)
      return
    }
    const hours = criteria.postMealHours
    setToast(
      hours && !notificationsOff
        ? `식사 시작을 적었어요 · ${formatTime(new Date(current.getTime() + hours * 3600000))}에 알려 드릴게요`
        : '식사 시작을 적었어요',
    )
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
    // 앱이 닫혀 있어도 서버가 보낼 수 있게 푸시 구독(서버 키가 있을 때만)
    if (permission === 'granted') subscribePush().catch(() => {})
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

  // 하루 정리에서 비어 있는 식후 측정 채우기
  const fillMissed = (meal: Meal, dueAt: Date) => {
    setSheetTarget({
      slot: 'post-meal',
      mealId: meal.id,
      mealType: meal.type,
      dueAt: dueAt.toISOString(),
    })
  }

  const openGlucoseSheet = () => {
    setSheetTarget(getMeasureTarget(meals, records, criteria.postMealHours, new Date()))
  }
  // 알림에서 연 시트를 닫으면 기록에서 지워 뒤로 와도 다시 안 열리게
  const closeGlucoseSheet = useCallback(() => {
    setSheetTarget(null)
    if (fromMeasureAlert) navigate(ROUTES.TODAY, { replace: true })
  }, [fromMeasureAlert, navigate])
  const closeMealSheet = useCallback(() => setWritingMeal(null), [])
  const closeToast = useCallback(() => setToast(null), [])

  // 다시 연결하기. 아직 끊겨 있으면 알려 줌
  const retryConnection = () => {
    recheck()
    if (!navigator.onLine) setToast('아직 인터넷에 연결되지 않았어요')
  }

  const handleSaved = (record: GlucoseRecord) => {
    closeGlucoseSheet()
    const label = getSlotLabel(record.slot, record.mealType, criteria.postMealHours)
    setToast(`${label} ${record.value} 저장했어요`)
  }

  const handleMealSaved = (
    mealFoods: string[],
    portion?: Portion,
    nutritionEdits?: NutritionEdits,
  ) => {
    if (!writingMeal) return
    setMealContent(writingMeal.id, mealFoods, portion, nutritionEdits)
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
        greeting={firstDay ? '반가워요' : '안녕하세요'}
        title={hospitalized ? undefined : HEADER_TITLE[heroState.kind]}
        unread={hasUnread}
        onBell={() => navigate(ROUTES.INBOX)}
        onCalendar={firstDay ? undefined : () => navigate(ROUTES.RECORDS_CALENDAR)}
      />
      {!online && (
        <div className="mt-6">
          <OfflineBanner />
        </div>
      )}
      <div className={online ? 'mt-6' : 'mt-3.5'}>
        {hospitalized ? (
          <HospitalHero
            onResume={() => {
              updateProfile({ hospitalized: false })
              setToast('측정 알림을 다시 켰어요')
            }}
          />
        ) : !online && heroState.kind === 'eating' ? (
          // Figma H-12 식사 중 연결이 끊기면 알림 예약 안 됨 안내
          <OfflineHero meal={heroState.meal} dueAt={heroState.dueAt} onRetry={retryConnection} />
        ) : (
          <HeroCard
            state={heroState}
            now={now}
            postMealHours={criteria.postMealHours}
            onStartMeal={handleStartMeal}
            onInputGlucose={openGlucoseSheet}
            onSkipMeal={skipMeal}
            onWriteMeal={setWritingMeal}
            onFillMissed={fillMissed}
          />
        )}
      </div>
      {waitingMeasure && 'dueAt' in heroState ? (
        <div className="mt-5">
          <WaitingMeasureCard
            label={getSlotLabel('post-meal', heroState.meal.type, criteria.postMealHours)}
            dueAt={heroState.dueAt}
          />
        </div>
      ) : (
        <>
          {!firstDay && (
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
          )}
          {visitCard && !criteriaUpdated && (
            <div className="mt-4.5">
              <VisitCard card={visitCard} questionCount={questionCount} onOpen={openVisitCard} />
            </div>
          )}
          {notificationsOff && (
            <div className="mt-4.5">
              <NotificationBanner onTurnOn={() => setPermissionSheet(true)} />
            </div>
          )}
          <div className="mt-5.5">
            <TodayRecordSection
              meals={todayMeals}
              records={todayRecords}
              insulins={todayInsulins}
              postMealHours={criteria.postMealHours}
              missed={missedMeals}
              onInputGlucose={openGlucoseSheet}
            />
          </div>
        </>
      )}

      {sheetTarget && (
        <GlucoseInputSheet target={sheetTarget} onClose={closeGlucoseSheet} onSaved={handleSaved} />
      )}
      {writingMeal && (
        <MealWriteFlow meal={writingMeal} onClose={closeMealSheet} onSaved={handleMealSaved} />
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
