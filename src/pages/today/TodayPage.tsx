import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { canServerPush, subscribePush } from '@/api/push'
import { openReminder, snoozeReminder } from '@/api/reminders'
import EmergencyBlock from '@/components/common/EmergencyBlock'
import TimeWheelSheet from '@/components/common/TimeWheelSheet'
import Toast from '@/components/common/Toast'
import NotificationDeniedSheet from '@/components/today/NotificationDeniedSheet'
import HighMemoCard from '@/components/today/HighMemoCard'
import KakaoLinkSheet from '@/components/auth/KakaoLinkSheet'
import { linkKakao, startKakaoLogin } from '@/api/auth'
import { useAuthStore } from '@/stores/useAuthStore'
import { KAKAO_LINK_TOAST, type KakaoLinkOutcome } from '@/utils/auth'
import WarmBackground from '@/components/common/WarmBackground'
import GlucoseInputSheet from '@/components/glucose/GlucoseInputSheet'
import InsulinSheet from '@/components/insulin/InsulinSheet'
import ContactMemoSheet from '@/components/my/ContactMemoSheet'
import BirthOrHospitalSheet from '@/components/postpartum/BirthOrHospitalSheet'
import BirthEntryCard from '@/components/today/BirthEntryCard'
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
import { GLUCOSE_LOW, JUST_SAVED_MS } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useFoods } from '@/hooks/useFoods'
import { useNow } from '@/hooks/useNow'
import { useOnline } from '@/hooks/useOnline'
import { useCriteria } from '@/hooks/useCriteria'
import { snoozeOnDevice } from '@/hooks/useMeasureReminder'
import { useTodaySync } from '@/hooks/useTodaySync'
import { saveHospitalized, useProfileStore } from '@/stores/useProfileStore'
import {
  editMealStart,
  saveMealContent,
  saveInsulin,
  saveMealStart,
  useGlucoseStore,
} from '@/stores/useGlucoseStore'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useInboxStore } from '@/stores/useInboxStore'
import { saveNotificationSettings, useNotificationStore } from '@/stores/useNotificationStore'
import { useVisitStore } from '@/stores/useVisitStore'
import type { GlucoseRecord, Meal, MeasureTarget, NutritionEdits, Portion } from '@/types/glucose'
import { getCriteriaAt } from '@/utils/criteria'
import { formatTime, isSameDay, startOfDay } from '@/utils/date'
import { formatPregnancyAge, getPregnancyAge } from '@/utils/pregnancy'
import { formatVisitDay, getHomeVisitCard } from '@/utils/visit'
import {
  formatGlucose,
  getHeroState,
  getMeasureTarget,
  getMissedMeals,
  getNextMealType,
  getSlotLabel,
  getTarget,
  isAboveTarget,
  isDayEnd,
  measuresAfter,
  type HeroState,
} from '@/utils/glucose'
import { formatMealSavedMessage } from '@/utils/meal'

// Figma H-03~H-07 상태별 헤더 제목. 없으면 인사
const HEADER_TITLE: Partial<Record<HeroState['kind'], string>> = {
  eating: '식사 시작했어요',
  'eating-open': '식사 시작했어요',
  'eating-free': '식사 시작했어요',
  'measure-time': '지금 재 주세요',
  overdue: '측정이 조금 늦었어요',
  'day-end': '오늘 하루 수고했어요',
  'all-done': '오늘 하루 수고했어요',
}

// 이 주수부터 입원·출산 입구(H-14)
const BIRTH_ENTRY_WEEKS = 37

// 측정을 기다리는 동안엔 히어로와 기다리는 측정만
const WAITING_KINDS: HeroState['kind'][] = ['eating', 'measure-time', 'overdue']

// 10분 뒤 다시를 맡겼을 때
const SNOOZED_TOAST = '10분 뒤에 한 번 더 알려 드릴게요'

function TodayPage() {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const insulins = useGlucoseStore((state) => state.insulins)
  const skipMeal = useGlucoseStore((state) => state.skipMeal)
  const foods = useFoods()
  const criteria = useCriteria()
  const criteriaVersions = useCriteriaStore((state) => state.versions)
  const navigate = useNavigate()
  const location = useLocation()
  // 알림함·측정 알림(앱 밖에서 열면 서버 주소대로 ?sheet=glucose)을 누르고 오면 혈당 입력 시트부터
  const [searchParams] = useSearchParams()
  const fromMeasureAlert =
    !!(location.state as { openGlucose?: boolean } | null)?.openGlucose ||
    searchParams.get('sheet') === 'glucose'
  const [sheetTarget, setSheetTarget] = useState<MeasureTarget | null>(() =>
    fromMeasureAlert
      ? getMeasureTarget(meals, records, criteria.postMealHours, new Date(), criteria.measureSlots)
      : null,
  )
  // 오늘 탭이 열려 있을 때 알림을 눌러도 시트를 엶
  const [seenAlert, setSeenAlert] = useState(fromMeasureAlert)
  if (fromMeasureAlert !== seenAlert) {
    setSeenAlert(fromMeasureAlert)
    if (fromMeasureAlert) {
      setSheetTarget(
        getMeasureTarget(meals, records, criteria.postMealHours, new Date(), criteria.measureSlots),
      )
    }
  }
  // 서버 알림을 눌러 들어오면 열람 처리. 실패해도 입력은 그대로
  const reminderId = searchParams.get('reminderId')
  useEffect(() => {
    if (reminderId) openReminder(reminderId).catch(() => {})
  }, [reminderId])
  const hasUnread = useInboxStore((state) => state.items.some((item) => !item.readAt))
  const [writingMeal, setWritingMeal] = useState<Meal | null>(null)
  // 카카오 연결을 다녀오면 결과 토스트
  const kakaoLinkOutcome = (location.state as { kakaoLink?: KakaoLinkOutcome } | null)?.kakaoLink
  const [toast, setToast] = useState<string | null>(() =>
    kakaoLinkOutcome ? KAKAO_LINK_TOAST[kakaoLinkOutcome] : null,
  )
  // 새로 고침 · 뒤로 가기로 토스트가 다시 뜨지 않게 주소의 state를 지움
  useEffect(() => {
    if (kakaoLinkOutcome) navigate(location.pathname, { replace: true, state: null })
  }, [kakaoLinkOutcome, navigate, location.pathname])
  const kakaoLinkOffer = useAuthStore((state) => state.kakaoLinkOffer)
  const setKakaoLinkOffer = useAuthStore((state) => state.setKakaoLinkOffer)
  const [linking, setLinking] = useState(false)
  const [insulinSheet, setInsulinSheet] = useState(false)
  const [memoSheet, setMemoSheet] = useState(false)
  const [birthSheet, setBirthSheet] = useState(false)
  const [permissionSheet, setPermissionSheet] = useState(false)
  // 시작 시각을 고치는 끼니
  const [editingStart, setEditingStart] = useState<Meal | null>(null)
  // 이미 거절한 알림 권한은 브라우저가 다시 안 물어봐서 설정에서 켜는 법
  const [deniedSheet, setDeniedSheet] = useState(false)
  const permissionAsked = useNotificationStore((state) => state.permissionAsked)
  const measureNotification = useNotificationStore((state) => state.measure)
  const markPermissionAsked = useNotificationStore((state) => state.markPermissionAsked)
  const name = useProfileStore((state) => state.name)
  const dueDate = useProfileStore((state) => state.dueDate)
  const hospitalized = useProfileStore((state) => state.hospitalized)
  const deliveryDate = useProfileStore((state) => state.deliveryDate)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const insulinMode = useProfileStore((state) => state.careMode === 'insulin')
  const contactMemo = useProfileStore((state) => state.contactMemo)

  const { pushReady, markPushReady } = useTodaySync()
  const now = useNow()
  const { online, recheck } = useOnline()
  const todayMeals = meals.filter((meal) => isSameDay(new Date(meal.startedAt), now))
  const todayRecords = records.filter((record) => isSameDay(new Date(record.measuredAt), now))
  const todayInsulins = insulins.filter((insulin) => isSameDay(new Date(insulin.takenAt), now))
  const heroState = getHeroState(meals, records, criteria.postMealHours, now, criteria.measureSlots)
  const waitingMeasure = !hospitalized && WAITING_KINDS.includes(heroState.kind)
  const firstDay = heroState.kind === 'first-day'
  // 가장 최근에 입력한 기록이 70 미만이고 입력한 지 30분 안이면 위급 안내. 늦게 채운 기록도 입력 시각 기준
  const lastEntered = records.reduce<GlucoseRecord | null>((latest, record) => {
    const at = new Date(record.enteredAt ?? record.measuredAt).getTime()
    return !latest || at > new Date(latest.enteredAt ?? latest.measuredAt).getTime()
      ? record
      : latest
  }, null)
  const justEntered =
    !hospitalized &&
    !!lastEntered &&
    now.getTime() - new Date(lastEntered.enteredAt ?? lastEntered.measuredAt).getTime() <
      JUST_SAVED_MS
  const showLowBlock = justEntered && !!lastEntered && lastEntered.value < GLUCOSE_LOW
  // 목표보다 높은 값이면 연락 메모 안내(H-06c). 목표를 안 적었으면 비교하지 않음
  // 잰 날의 기준으로 비교(지난 기록을 채운 경우)
  const lastCriteria = lastEntered
    ? getCriteriaAt(criteriaVersions, new Date(lastEntered.measuredAt))
    : null
  const lastTarget =
    lastEntered && lastCriteria
      ? getTarget(lastEntered.slot, lastCriteria.targets, lastCriteria.postMealHours)
      : null
  const showHighCard =
    justEntered && !!lastEntered && lastTarget !== null && isAboveTarget(lastEntered, lastTarget)
  // 출산 예정일이 가까우면 입원·출산 입구. 입원 중이면 안 보임
  const nearDue = !hospitalized && (getPregnancyAge(dueDate, now)?.weeks ?? 0) >= BIRTH_ENTRY_WEEKS
  // 저녁 이후 놓친 식후 측정은 오늘 기록에 나중에 채우기 줄로
  const missedMeals = isDayEnd(now)
    ? getMissedMeals(meals, records, criteria.postMealHours, now, criteria.measureSlots)
    : []
  // 측정 알림을 껐거나 브라우저 권한이 없거나, 푸시를 쓸 수 있는데 서버에 구독이 없으면 알림 꺼짐 배너
  const notificationsOff =
    !measureNotification ||
    !('Notification' in window) ||
    Notification.permission !== 'granted' ||
    (pushReady === false && canServerPush())

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

  const handleStartMeal = async () => {
    const current = new Date()
    // 기기엔 바로 적혀 화면은 기다리지 않음
    const mealType = getNextMealType(meals, current)
    const saving = saveMealStart(mealType, current)
    // 첫 식사 시작 때 한 번만 알림 허용 안내
    if (!permissionAsked) {
      setPermissionSheet(true)
      return
    }
    const saved = await saving
    // 병원 기준에 없는 끼니는 식후 알림 없음
    const hours = measuresAfter(mealType, criteria.measureSlots) ? criteria.postMealHours : null
    setToast(
      !saved
        ? '식사 시작을 적었어요 · 연결이 안 돼 알림 예약은 못 했어요'
        : hours && !notificationsOff
          ? `식사 시작을 적었어요 · ${formatTime(new Date(current.getTime() + hours * 3600000))}에 알려 드릴게요`
          : '식사 시작을 적었어요',
    )
  }

  const finishPermission = (granted: boolean) => {
    markPermissionAsked()
    // 서버에 못 저장하면 원래 설정 그대로 둠
    saveNotificationSettings({ measure: granted }).catch(() => {})
    setPermissionSheet(false)
    setToast(granted ? '측정 시간에 알려 드릴게요' : '알림 없이 기록만 할게요')
  }

  const allowNotification = async () => {
    // 알림을 못 쓰는 브라우저(홈 화면 추가 전 iPhone 등)는 기록만
    if (!('Notification' in window)) {
      finishPermission(false)
      return
    }
    // 이미 거절한 권한은 다시 안 물어봐서 설정 안내만. 측정 알림 설정은 그대로
    if (Notification.permission === 'denied') {
      markPermissionAsked()
      setPermissionSheet(false)
      setDeniedSheet(true)
      return
    }
    const permission = await Notification.requestPermission()
    finishPermission(permission === 'granted')
    // 앱이 닫혀 있어도 서버가 보낼 수 있게 푸시 구독(서버 키가 있을 때만)
    if (permission === 'granted') {
      subscribePush()
        .then((subscription) => {
          if (subscription) markPushReady()
        })
        .catch(() => {})
    }
  }

  // 알림 꺼짐 배너 켜기. 못 쓰는 브라우저·이미 거절한 권한은 물어봐도 소용없어 안내만
  const turnOnNotification = () => {
    if (!('Notification' in window)) {
      setToast('이 브라우저는 알림을 지원하지 않아요')
      return
    }
    if (Notification.permission === 'denied') {
      setDeniedSheet(true)
      return
    }
    setPermissionSheet(true)
  }

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
    setSheetTarget(
      getMeasureTarget(meals, records, criteria.postMealHours, new Date(), criteria.measureSlots),
    )
  }
  // 알림에서 연 시트를 닫으면 기록에서 지워 뒤로 와도 다시 안 열리게
  const closeGlucoseSheet = useCallback(() => {
    setSheetTarget(null)
    if (fromMeasureAlert) navigate(ROUTES.TODAY, { replace: true })
  }, [fromMeasureAlert, navigate])
  // 10분 뒤 다시. 서버 알림으로 열었으면 서버가, 아니면 이 기기가 다시 알림
  const snoozeMeasure = (mealId?: string) => {
    if (reminderId) {
      snoozeReminder(reminderId).catch(() => {
        if (mealId) snoozeOnDevice(mealId)
      })
      setToast(SNOOZED_TOAST)
      return
    }
    const scheduled = !!mealId && snoozeOnDevice(mealId)
    setToast(scheduled ? SNOOZED_TOAST : '알림이 꺼져 있어 다시 알려 드릴 수 없어요')
  }
  const closeMealSheet = useCallback(() => setWritingMeal(null), [])
  const closeToast = useCallback(() => setToast(null), [])

  // 시작 시각 고치기. 같은 날 그 시각으로, 지금보다 늦으면 안 됨. 서버가 식후 알림도 다시 잡음
  const changeMealStart = async (meal: Meal, time: string) => {
    setEditingStart(null)
    // 서버에 아직 안 간 끼니는 고친 값이 동기화로 되돌아갈 수 있어 막음
    if (meal.pending) {
      setToast('아직 저장 중이에요. 잠시 후 다시 고쳐 주세요')
      return
    }
    const [hours, minutes] = time.split(':').map(Number)
    const original = new Date(meal.startedAt)
    // 자정을 넘나들 수 있어 전날 · 그날 · 다음 날 중 원래 시각에 가장 가까운 날. 그게 지금보다 늦으면 거절
    const startedAt = [-1, 0, 1]
      .map((offset) => {
        const date = new Date(original)
        date.setDate(date.getDate() + offset)
        date.setHours(hours, minutes, 0, 0)
        return date
      })
      .sort(
        (a, b) =>
          Math.abs(a.getTime() - original.getTime()) - Math.abs(b.getTime() - original.getTime()),
      )[0]
    if (startedAt.getTime() > Date.now()) {
      setToast('지금보다 늦은 시각은 고를 수 없어요')
      return
    }
    try {
      await editMealStart(meal.id, startedAt)
      setToast(`식사 시작을 ${time}로 고쳤어요`)
    } catch {
      setToast('시작 시각을 고치지 못했어요. 잠시 후 다시 시도해 주세요')
    }
  }

  // 받아 둔 카카오 토큰이 있으면 바로 연결, 없거나 10분 지났으면 카카오를 다녀와서 연결
  const linkKakaoAccount = async () => {
    if (linking) return
    setLinking(true)
    try {
      const result = await linkKakao()
      if (result === 'expired') return startKakaoLogin({ purpose: 'link' })
      setKakaoLinkOffer(false)
      setToast(KAKAO_LINK_TOAST[result])
    } catch {
      setToast(KAKAO_LINK_TOAST.failed)
    } finally {
      setLinking(false)
    }
  }

  // 다시 연결하기. 아직 끊겨 있으면 알려 줌
  const retryConnection = () => {
    recheck()
    if (!navigator.onLine) setToast('아직 인터넷에 연결되지 않았어요')
  }

  const handleSaved = (record: GlucoseRecord) => {
    closeGlucoseSheet()
    const label = getSlotLabel(record.slot, record.mealType, criteria.postMealHours)
    setToast(`${label} ${formatGlucose(record)} 저장했어요`)
  }

  const handleMealSaved = (
    mealFoods: string[],
    portion?: Portion,
    nutritionEdits?: NutritionEdits,
    stapleGrams?: number,
  ) => {
    if (!writingMeal) return
    void saveMealContent(writingMeal.id, mealFoods, portion, nutritionEdits, stapleGrams)
    setToast(
      formatMealSavedMessage({ ...writingMeal, foods: mealFoods, portion, stapleGrams }, foods),
    )
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
              saveHospitalized(false)
                .then(() => setToast('측정 알림을 다시 켰어요'))
                .catch(() => setToast('알림을 다시 켜지 못했어요. 잠시 후 다시 시도해 주세요'))
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
            onStartMeal={() => void handleStartMeal()}
            onInputGlucose={openGlucoseSheet}
            onSkipMeal={skipMeal}
            onWriteMeal={setWritingMeal}
            onEditMealStart={setEditingStart}
            onFillMissed={fillMissed}
            onSnooze={snoozeMeasure}
          />
        )}
      </div>
      {/* 낮은 값을 입력한 직후 30분은 위급 안내 그대로. 입원 중이면 숨김 */}
      {showLowBlock && (
        <div className="mt-5">
          <EmergencyBlock onWriteMemo={() => setMemoSheet(true)} />
        </div>
      )}
      {showHighCard && (
        <div className="mt-5">
          <HighMemoCard onWriteMemo={() => setMemoSheet(true)} />
        </div>
      )}
      {nearDue && (
        <div className="mt-5">
          <BirthEntryCard onOpen={() => setBirthSheet(true)} />
        </div>
      )}
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
              <NotificationBanner onTurnOn={turnOnNotification} />
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
        <GlucoseInputSheet
          target={sheetTarget}
          onClose={closeGlucoseSheet}
          onSaved={handleSaved}
          // 서버 알림이 있거나, 측정 시점을 아는 끼니일 때만
          onSnooze={
            reminderId || (sheetTarget.mealId && criteria.postMealHours)
              ? () => {
                  snoozeMeasure(sheetTarget.mealId)
                  closeGlucoseSheet()
                }
              : undefined
          }
        />
      )}
      {writingMeal && (
        <MealWriteFlow meal={writingMeal} onClose={closeMealSheet} onSaved={handleMealSaved} />
      )}
      {insulinSheet && (
        <InsulinSheet
          onSave={async (input) => {
            try {
              await saveInsulin(input)
              setInsulinSheet(false)
              setToast(`인슐린 ${input.units}단위 기록했어요`)
            } catch {
              setToast('인슐린을 기록하지 못했어요. 잠시 후 다시 시도해 주세요')
            }
          }}
          onClose={() => setInsulinSheet(false)}
        />
      )}
      {birthSheet && (
        <BirthOrHospitalSheet
          onNext={(choice) => {
            if (choice === 'birth') {
              navigate(ROUTES.POSTPARTUM_DELIVERY)
              return
            }
            // 입원은 서버가 알림만 멈추고 홈에서 바로 보여 줌. 두 번 보내지 않게 시트 먼저 닫음
            setBirthSheet(false)
            saveHospitalized(true)
              .then(() => setToast('측정 알림을 멈췄어요'))
              .catch(() => setToast('입원 상태를 저장하지 못했어요. 잠시 후 다시 시도해 주세요'))
          }}
          onClose={() => setBirthSheet(false)}
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
      {/* 다른 시트가 없을 때만 */}
      {kakaoLinkOffer && !sheetTarget && !permissionSheet && (
        <KakaoLinkSheet
          loading={linking}
          onLink={() => void linkKakaoAccount()}
          onClose={() => setKakaoLinkOffer(false)}
        />
      )}
      {editingStart && (
        <TimeWheelSheet
          title="식사 시작 시각"
          value={formatTime(new Date(editingStart.startedAt))}
          onDone={(time) => void changeMealStart(editingStart, time)}
          onClose={() => setEditingStart(null)}
        />
      )}
      {deniedSheet && <NotificationDeniedSheet onClose={() => setDeniedSheet(false)} />}
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
