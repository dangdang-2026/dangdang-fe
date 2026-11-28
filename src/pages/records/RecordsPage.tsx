import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import EmptyRecordCard from '@/components/glucose/EmptyRecordCard'
import GlucoseInputSheet from '@/components/glucose/GlucoseInputSheet'
import InsulinSheet from '@/components/insulin/InsulinSheet'
import MealContentSheet from '@/components/meal/MealContentSheet'
import RecordDeleteSheet from '@/components/records/RecordDeleteSheet'
import RecordCalendar from '@/components/records/RecordCalendar'
import RecordEditSheet from '@/components/records/RecordEditSheet'
import RecordTimeline from '@/components/records/RecordTimeline'
import WeekPicker from '@/components/records/WeekPicker'
import StatsPanel from '@/components/stats/StatsPanel'
import { MEAL_LABEL } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useNow } from '@/hooks/useNow'
import { useCriteria } from '@/hooks/useCriteria'
import { useWeekRecordsSync } from '@/hooks/useWeekRecordsSync'
import {
  editInsulin,
  removeInsulin,
  removeMeal,
  removeRecord,
  restoreMeal,
  restoreRecord,
  saveMealContent,
  useGlucoseStore,
} from '@/stores/useGlucoseStore'
import ConfirmSheet from '@/components/common/ConfirmSheet'
import { getErrorCode } from '@/api/axios'
import type { InsulinInput } from '@/api/insulin'
import type {
  GlucoseRecord,
  InsulinRecord,
  Meal,
  MeasureTarget,
  NutritionEdits,
  Portion,
} from '@/types/glucose'
import {
  formatMonthDay,
  formatMonthDayWeekday,
  formatTime,
  isSameDay,
  parseDateKey,
  startOfDay,
  toDateKey,
} from '@/utils/date'
import { formatGlucose, getBackfillTarget, getMeasureTarget, getSlotLabel } from '@/utils/glucose'
import { formatInsulinLabel } from '@/utils/insulin'

type InputSheet = { target: MeasureTarget; backfillAt?: Date }

// 기록 지우기 되돌리기 토스트가 떠 있는 시간
const RECORD_UNDO_TOAST_MS = 5000

function RecordsPage() {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const insulins = useGlucoseStore((state) => state.insulins)
  const [editingInsulin, setEditingInsulin] = useState<InsulinRecord | null>(null)
  const [deletingInsulin, setDeletingInsulin] = useState<InsulinRecord | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputSheet, setInputSheet] = useState<InputSheet | null>(null)
  const [editing, setEditing] = useState<GlucoseRecord | null>(null)
  const [deleting, setDeleting] = useState<GlucoseRecord | null>(null)
  const [removing, setRemoving] = useState(false)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  // 식사 기록 고치기에서 지우기를 누른 끼니
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null)
  // 지운 뒤엔 5분 안 되돌리기 버튼을 같이
  const [toast, setToast] = useState<{
    message: string
    action?: { label: string; onClick: () => void }
    duration?: number
  } | null>(null)
  const criteria = useCriteria()
  // 「‹ 기록」은 오늘로
  const goBack = useGoBack(ROUTES.TODAY)

  const now = useNow()
  const today = startOfDay(now)
  // ?date=YYYY-MM-DD, 없거나 미래면 오늘
  const parsed = parseDateKey(searchParams.get('date'))
  const selected = parsed && parsed <= today ? parsed : today
  const isToday = isSameDay(selected, today)
  // ?tab=stats 통계, ?calendar=1 하루 탭에서 달력 펼침
  const statsTab = searchParams.get('tab') === 'stats'
  const calendarOpen = !statsTab && searchParams.get('calendar') === '1'
  useWeekRecordsSync(selected, today)

  const dayMeals = meals.filter((meal) => isSameDay(new Date(meal.startedAt), selected))
  const dayRecords = records.filter((record) => isSameDay(new Date(record.measuredAt), selected))
  const dayInsulins = insulins.filter((insulin) => isSameDay(new Date(insulin.takenAt), selected))
  const count = dayMeals.length + dayRecords.length + dayInsulins.length

  const hasRecord = (date: Date) =>
    records.some((record) => isSameDay(new Date(record.measuredAt), date)) ||
    meals.some((meal) => isSameDay(new Date(meal.startedAt), date)) ||
    insulins.some((insulin) => isSameDay(new Date(insulin.takenAt), date))

  // 날짜를 고르면 달력은 접고 그날 기록으로
  const selectDate = (date: Date) => {
    setSearchParams(isSameDay(date, today) ? {} : { date: toDateKey(date) }, { replace: true })
  }

  // 하루 · 통계 · 달력 전환. 고른 날짜는 그대로 둠
  const changeView = (view: { tab?: 'stats'; calendar?: boolean }) => {
    const next = new URLSearchParams()
    const date = searchParams.get('date')
    if (date) next.set('date', date)
    if (view.tab) next.set('tab', view.tab)
    if (view.calendar) next.set('calendar', '1')
    setSearchParams(next, { replace: true })
  }

  const openInputSheet = () => {
    if (isToday) {
      const target = getMeasureTarget(
        meals,
        records,
        criteria.postMealHours,
        new Date(),
        criteria.measureSlots,
      )
      setInputSheet({ target })
      return
    }
    // 지난 날은 그날 날짜에 지금 시각으로 채움. 시각은 수정에서 바꿈
    const current = new Date()
    const backfillAt = new Date(selected)
    backfillAt.setHours(current.getHours(), current.getMinutes())
    setInputSheet({ target: getBackfillTarget(records, backfillAt), backfillAt })
  }

  const closeInputSheet = useCallback(() => setInputSheet(null), [])
  const closeEditSheet = useCallback(() => setEditing(null), [])
  const closeDeleteSheet = useCallback(() => setDeleting(null), [])
  const closeMealSheet = useCallback(() => setEditingMeal(null), [])

  const handleMealEdited = (
    foods: string[],
    portion?: Portion,
    nutritionEdits?: NutritionEdits,
    stapleGrams?: number,
  ) => {
    if (!editingMeal) return
    void saveMealContent(editingMeal.id, foods, portion, nutritionEdits, stapleGrams)
    setEditingMeal(null)
    setToast({ message: `${MEAL_LABEL[editingMeal.type]} 기록을 고쳤어요` })
  }
  const closeToast = useCallback(() => setToast(null), [])

  // 지운 기록 되돌리기. 5분 지남(READING_40902 · MEAL_40904) · 붙은 식사가 지워짐(READING_40904)은 안내
  const undo = (restore: () => Promise<void>) =>
    restore()
      .then(() => setToast({ message: '되돌렸어요' }))
      .catch((error: unknown) => {
        const code = getErrorCode(error)
        setToast({
          message:
            code === 'READING_40902' || code === 'MEAL_40904'
              ? '되돌릴 수 있는 시간이 지났어요'
              : code === 'READING_40904'
                ? '이 혈당이 붙은 식사를 먼저 되돌려 주세요'
                : '되돌리지 못했어요. 잠시 후 다시 시도해 주세요',
        })
      })

  const handleMealDeleted = async () => {
    if (!deletingMeal || removing) return
    setRemoving(true)
    try {
      const meal = deletingMeal
      await removeMeal(meal.id)
      setToast({
        message: `${MEAL_LABEL[meal.type]} 기록을 지웠어요`,
        // 서버에 있던 식사만 5분 안 되돌리기
        action: meal.pending
          ? undefined
          : { label: '되돌리기', onClick: () => undo(() => restoreMeal(meal.id)) },
      })
    } catch {
      setToast({ message: '기록을 지우지 못했어요. 잠시 후 다시 시도해 주세요' })
    } finally {
      setRemoving(false)
      setDeletingMeal(null)
    }
  }

  const handleSaved = (record: GlucoseRecord) => {
    setInputSheet(null)
    const label = getSlotLabel(record.slot, record.mealType, criteria.postMealHours)
    setToast({ message: `${label} ${formatGlucose(record)} 저장했어요` })
  }

  const handleEdited = () => {
    setEditing(null)
    setToast({ message: '고쳤어요 · 리포트에 ‘수정됨’으로 표시돼요' })
  }

  // 수정 시트에서 삭제를 누르면 확인 시트로 전환
  const askDelete = () => {
    setDeleting(editing)
    setEditing(null)
  }

  const handleDeleted = async () => {
    if (!deleting || removing) return
    setRemoving(true)
    try {
      const id = deleting.id
      const result = await removeRecord(id)
      // 다른 기기에서 이미 지웠으면 되돌리기 없이
      setToast(
        result === 'gone'
          ? { message: '이미 지운 기록이에요' }
          : {
              message: '기록을 지웠어요',
              action: { label: '되돌리기', onClick: () => undo(() => restoreRecord(id)) },
              // 지우기 시트 안내 「지운 뒤 5초 동안은 되돌릴 수 있어요」와 같게
              duration: RECORD_UNDO_TOAST_MS,
            },
      )
    } catch {
      setToast({ message: '기록을 지우지 못했어요. 잠시 후 다시 시도해 주세요' })
    } finally {
      setRemoving(false)
      setDeleting(null)
    }
  }

  // 서버 연동 전 기기에만 남은 기록은 보기만
  const selectInsulin = (insulin: InsulinRecord) => {
    if (insulin.server) setEditingInsulin(insulin)
    else setToast({ message: '예전에 기기에만 적은 기록이라 고칠 수 없어요' })
  }

  // 다른 기기에서 이미 지운 기록이면 따로 알림
  const insulinFailToast = (error: unknown, action: string) =>
    setToast({
      message:
        getErrorCode(error) === 'INSULIN_40401'
          ? '이미 지운 기록이에요'
          : `인슐린 기록을 ${action} 못했어요. 잠시 후 다시 시도해 주세요`,
    })

  const handleInsulinEdited = async (input: InsulinInput) => {
    if (!editingInsulin) return
    try {
      await editInsulin(editingInsulin.id, input)
      setEditingInsulin(null)
      setToast({ message: '인슐린 기록을 고쳤어요' })
    } catch (error) {
      insulinFailToast(error, '고치지')
      if (getErrorCode(error) === 'INSULIN_40401') setEditingInsulin(null)
    }
  }

  const handleInsulinDeleted = async () => {
    if (!deletingInsulin || removing) return
    setRemoving(true)
    try {
      await removeInsulin(deletingInsulin.id)
      setToast({ message: '인슐린 기록을 지웠어요' })
    } catch (error) {
      insulinFailToast(error, '지우지')
    } finally {
      setRemoving(false)
      setDeletingInsulin(null)
    }
  }

  return (
    // Figma D-01 · D-13 · D-17 기록 화면. 「‹ 기록」 + 하루 | 통계
    <main
      className={`relative mx-auto min-h-dvh w-full max-w-107.5 px-5 pt-2 pb-10 ${statsTab ? 'bg-white' : ''}`}
    >
      {!statsTab && <WarmBackground />}
      <div className="relative">
        <SubPageHeader title="기록" onBack={goBack} />

        <div role="tablist" className="bg-grey-900/6 mt-0.5 flex rounded-xl p-1">
          {[
            { key: 'day', label: '하루' },
            { key: 'stats', label: '통계' },
          ].map((item) => {
            const active = (item.key === 'stats') === statsTab
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`text-body-2 h-9 flex-1 rounded-lg ${
                  active
                    ? 'shadow-segment text-grey-900 bg-white font-semibold'
                    : 'text-grey-600 font-medium'
                }`}
                onClick={() => changeView(item.key === 'stats' ? { tab: 'stats' } : {})}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {statsTab ? (
          <div className="mt-4">
            <StatsPanel today={today} />
          </div>
        ) : calendarOpen ? (
          <div className="mt-4.5">
            <RecordCalendar
              today={today}
              initialMonth={selected}
              onSelect={selectDate}
              onCollapse={() => changeView({})}
            />
          </div>
        ) : (
          <>
            <div className="mt-4.5">
              <WeekPicker
                selected={selected}
                today={today}
                hasRecord={hasRecord}
                onSelect={selectDate}
                onExpand={() => changeView({ calendar: true })}
              />
            </div>

            <section className="mt-9">
              <div className="flex items-center justify-between">
                <h2 className="text-subtitle-1 text-grey-900">{formatMonthDayWeekday(selected)}</h2>
                <span className="text-body-3 text-grey-500">기록 {count}개</span>
              </div>
              <div className="mt-3">
                {count > 0 ? (
                  <RecordTimeline
                    meals={dayMeals}
                    records={dayRecords}
                    insulins={dayInsulins}
                    allMeals={meals}
                    onSelectRecord={setEditing}
                    onSelectMeal={setEditingMeal}
                    onSelectInsulin={selectInsulin}
                  />
                ) : (
                  <EmptyRecordCard
                    title="이 날은 기록이 없어요"
                    description="나중에 채워도 괜찮아요"
                    onInputGlucose={openInputSheet}
                  />
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {inputSheet && (
        <GlucoseInputSheet
          target={inputSheet.target}
          backfillAt={inputSheet.backfillAt}
          onClose={closeInputSheet}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <RecordEditSheet
          record={editing}
          onClose={closeEditSheet}
          onSaved={handleEdited}
          onDelete={askDelete}
        />
      )}
      {deleting && (
        <RecordDeleteSheet
          record={deleting}
          label={getSlotLabel(deleting.slot, deleting.mealType, criteria.postMealHours)}
          onConfirm={() => void handleDeleted()}
          onClose={closeDeleteSheet}
        />
      )}
      {editingMeal && (
        <MealContentSheet
          meal={editingMeal}
          editing
          onClose={closeMealSheet}
          onSaved={handleMealEdited}
          onDelete={() => {
            setDeletingMeal(editingMeal)
            setEditingMeal(null)
          }}
        />
      )}
      {deletingMeal && (
        <ConfirmSheet
          title={`${MEAL_LABEL[deletingMeal.type]} 기록을 지울까요?`}
          summary={[
            {
              label: '식사',
              value: `${formatTime(new Date(deletingMeal.startedAt))} · ${deletingMeal.foods?.join(', ') || '내용 없음'}`,
            },
          ]}
          description={'식사 기록만 지워요. 이 끼니의 혈당 기록은 그대로 남아요.'}
          confirmLabel="지우기"
          danger
          loading={removing}
          onConfirm={() => void handleMealDeleted()}
          onClose={() => setDeletingMeal(null)}
        />
      )}
      {editingInsulin && (
        <InsulinSheet
          record={editingInsulin}
          onSave={handleInsulinEdited}
          onDelete={() => {
            setDeletingInsulin(editingInsulin)
            setEditingInsulin(null)
          }}
          onClose={() => setEditingInsulin(null)}
        />
      )}
      {deletingInsulin && (
        <ConfirmSheet
          title="이 기록을 지울까요?"
          detail={
            <div className="flex flex-col gap-1">
              <p className="text-grey-700 text-sm font-medium">
                {formatMonthDay(new Date(deletingInsulin.takenAt))}{' '}
                {formatTime(new Date(deletingInsulin.takenAt))} · 인슐린
              </p>
              <p className="text-grey-900 text-lg font-bold">
                {formatInsulinLabel(deletingInsulin).replace('인슐린 · ', '')}
              </p>
            </div>
          }
          description="지운 기록은 진료 리포트에서도 빠져요."
          confirmLabel="지우기"
          danger
          loading={removing}
          onConfirm={() => void handleInsulinDeleted()}
          onClose={() => setDeletingInsulin(null)}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}
    </main>
  )
}

export default RecordsPage
