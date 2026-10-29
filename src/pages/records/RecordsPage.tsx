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
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import type { GlucoseRecord, InsulinRecord, Meal, MeasureTarget, Portion } from '@/types/glucose'
import { formatMonthDayWeekday, isSameDay, parseDateKey, startOfDay, toDateKey } from '@/utils/date'
import { getBackfillTarget, getMeasureTarget, getSlotLabel } from '@/utils/glucose'

type InputSheet = { target: MeasureTarget; backfillAt?: Date }

function RecordsPage() {
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const insulins = useGlucoseStore((state) => state.insulins)
  const updateInsulin = useGlucoseStore((state) => state.updateInsulin)
  const [editingInsulin, setEditingInsulin] = useState<InsulinRecord | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputSheet, setInputSheet] = useState<InputSheet | null>(null)
  const [editing, setEditing] = useState<GlucoseRecord | null>(null)
  const [deleting, setDeleting] = useState<GlucoseRecord | null>(null)
  const deleteRecord = useGlucoseStore((state) => state.deleteRecord)
  const setMealContent = useGlucoseStore((state) => state.setMealContent)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const criteria = useCriteria()
  const navigate = useNavigate()

  const now = useNow()
  const today = startOfDay(now)
  // ?date=YYYY-MM-DD, 없거나 미래면 오늘
  const parsed = parseDateKey(searchParams.get('date'))
  const selected = parsed && parsed <= today ? parsed : today
  const isToday = isSameDay(selected, today)

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
      const target = getMeasureTarget(meals, records, criteria.postMealHours, new Date())
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

  const handleMealEdited = (foods: string[], portion?: Portion) => {
    if (!editingMeal) return
    setMealContent(editingMeal.id, foods, portion)
    setEditingMeal(null)
    setToast(`${MEAL_LABEL[editingMeal.type]} 기록을 고쳤어요`)
  }
  const closeToast = useCallback(() => setToast(null), [])

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

  const handleDeleted = () => {
    if (deleting) deleteRecord(deleting.id)
    setDeleting(null)
    setToast('기록을 지웠어요')
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
              onSelectInsulin={setEditingInsulin}
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
      {deleting && <RecordDeleteSheet onConfirm={handleDeleted} onClose={closeDeleteSheet} />}
      {editingMeal && (
        <MealContentSheet
          meal={editingMeal}
          editing
          onClose={closeMealSheet}
          onSaved={handleMealEdited}
        />
      )}
      {editingInsulin && (
        <InsulinSheet
          record={editingInsulin}
          onSave={(input) => {
            updateInsulin(editingInsulin.id, input)
            setEditingInsulin(null)
            setToast('인슐린 기록을 고쳤어요')
          }}
          onClose={() => setEditingInsulin(null)}
        />
      )}
      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default RecordsPage
