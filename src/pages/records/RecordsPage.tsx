import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import iconCalendar from '@/assets/icons/calendar.svg'
import iconChart from '@/assets/icons/stats/chart.svg'
import Toast from '@/components/common/Toast'
import WarmBackground from '@/components/common/WarmBackground'
import EmptyRecordCard from '@/components/glucose/EmptyRecordCard'
import GlucoseInputSheet from '@/components/glucose/GlucoseInputSheet'
import InsulinSheet from '@/components/insulin/InsulinSheet'
import MealContentSheet from '@/components/meal/MealContentSheet'
import RecordDeleteSheet from '@/components/records/RecordDeleteSheet'
import RecordEditSheet from '@/components/records/RecordEditSheet'
import RecordTimeline from '@/components/records/RecordTimeline'
import WeekPicker from '@/components/records/WeekPicker'
import { MEAL_LABEL } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { useCriteria } from '@/hooks/useCriteria'
import { useWeekRecordsSync } from '@/hooks/useWeekRecordsSync'
import {
  editInsulin,
  removeInsulin,
  removeMeal,
  removeRecord,
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
import { getBackfillTarget, getMeasureTarget, getSlotLabel } from '@/utils/glucose'
import { formatInsulinLabel } from '@/utils/insulin'

type InputSheet = { target: MeasureTarget; backfillAt?: Date }

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
  const [toast, setToast] = useState<string | null>(null)
  const criteria = useCriteria()
  const navigate = useNavigate()

  const now = useNow()
  const today = startOfDay(now)
  // ?date=YYYY-MM-DD, 없거나 미래면 오늘
  const parsed = parseDateKey(searchParams.get('date'))
  const selected = parsed && parsed <= today ? parsed : today
  const isToday = isSameDay(selected, today)
  useWeekRecordsSync(selected, today)

  const dayMeals = meals.filter((meal) => isSameDay(new Date(meal.startedAt), selected))
  const dayRecords = records.filter((record) => isSameDay(new Date(record.measuredAt), selected))
  const dayInsulins = insulins.filter((insulin) => isSameDay(new Date(insulin.takenAt), selected))
  const count = dayMeals.length + dayRecords.length + dayInsulins.length

  const hasRecord = (date: Date) =>
    records.some((record) => isSameDay(new Date(record.measuredAt), date)) ||
    meals.some((meal) => isSameDay(new Date(meal.startedAt), date)) ||
    insulins.some((insulin) => isSameDay(new Date(insulin.takenAt), date))

  const selectDate = (date: Date) => {
    setSearchParams(isSameDay(date, today) ? {} : { date: toDateKey(date) }, { replace: true })
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
    setToast(`${MEAL_LABEL[editingMeal.type]} 기록을 고쳤어요`)
  }
  const closeToast = useCallback(() => setToast(null), [])

  const handleMealDeleted = async () => {
    if (!deletingMeal || removing) return
    setRemoving(true)
    try {
      await removeMeal(deletingMeal.id)
      setToast(`${MEAL_LABEL[deletingMeal.type]} 기록을 지웠어요`)
    } catch {
      setToast('기록을 지우지 못했어요. 잠시 후 다시 시도해 주세요')
    } finally {
      setRemoving(false)
      setDeletingMeal(null)
    }
  }

  const handleSaved = (record: GlucoseRecord) => {
    setInputSheet(null)
    const label = getSlotLabel(record.slot, record.mealType, criteria.postMealHours)
    setToast(`${label} ${record.value} 저장했어요`)
  }

  const handleEdited = () => {
    setEditing(null)
    setToast('고쳤어요 · 리포트에 ‘수정됨’으로 표시돼요')
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
      await removeRecord(deleting.id)
      setToast('기록을 지웠어요')
    } catch {
      setToast('기록을 지우지 못했어요. 잠시 후 다시 시도해 주세요')
    } finally {
      setRemoving(false)
      setDeleting(null)
    }
  }

  // 서버 연동 전 기기에만 남은 기록은 보기만
  const selectInsulin = (insulin: InsulinRecord) => {
    if (insulin.server) setEditingInsulin(insulin)
    else setToast('예전에 기기에만 적은 기록이라 고칠 수 없어요')
  }

  // 다른 기기에서 이미 지운 기록이면 따로 알림
  const insulinFailToast = (error: unknown, action: string) =>
    setToast(
      getErrorCode(error) === 'INSULIN_40401'
        ? '이미 지운 기록이에요'
        : `인슐린 기록을 ${action} 못했어요. 잠시 후 다시 시도해 주세요`,
    )

  const handleInsulinEdited = async (input: InsulinInput) => {
    if (!editingInsulin) return
    try {
      await editInsulin(editingInsulin.id, input)
      setEditingInsulin(null)
      setToast('인슐린 기록을 고쳤어요')
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
      setToast('인슐린 기록을 지웠어요')
    } catch (error) {
      insulinFailToast(error, '지우지')
    } finally {
      setRemoving(false)
      setDeletingInsulin(null)
    }
  }

  return (
    <main className="px-5 pt-15.5">
      <WarmBackground />
      <header className="flex items-center justify-between">
        <h1 className="text-title-2 text-grey-900">기록</h1>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="혈당 통계"
            className="shadow-icon-button flex size-10.5 items-center justify-center rounded-full bg-white"
            onClick={() => navigate(ROUTES.RECORDS_STATS)}
          >
            <img src={iconChart} alt="" width={20} height={20} />
          </button>
          <button
            type="button"
            aria-label="기록 달력"
            className="shadow-icon-button flex size-10.5 items-center justify-center rounded-full bg-white"
            onClick={() => navigate(ROUTES.RECORDS_CALENDAR)}
          >
            <img src={iconCalendar} alt="" width={20} height={20} />
          </button>
        </div>
      </header>

      <div className="mt-4.5">
        <WeekPicker selected={selected} today={today} hasRecord={hasRecord} onSelect={selectDate} />
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
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default RecordsPage
