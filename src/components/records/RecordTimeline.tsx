import iconDropSm from '@/assets/icons/drop-sm.svg'
import iconMealSm from '@/assets/icons/meal-sm.svg'
import iconInsulin from '@/assets/icons/quick/insulin.svg'
import { useFoods } from '@/hooks/useFoods'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import type { Criteria } from '@/types/criteria'
import type { GlucoseRecord, InsulinRecord, Meal } from '@/types/glucose'
import { getCriteriaAt } from '@/utils/criteria'
import { formatTime } from '@/utils/date'
import { compareToTarget, getLateMinutes, getSlotLabel, getTarget } from '@/utils/glucose'
import { formatInsulinLabel } from '@/utils/insulin'
import { formatMealLabel } from '@/utils/meal'

type RecordTimelineProps = {
  meals: Meal[]
  records: GlucoseRecord[]
  insulins?: InsulinRecord[]
  // 늦게 잼 계산용 전체 끼니
  allMeals: Meal[]
  onSelectRecord?: (record: GlucoseRecord) => void
  onSelectMeal?: (meal: Meal) => void
  onSelectInsulin?: (insulin: InsulinRecord) => void
}

type Row =
  | { kind: 'meal'; at: Date; meal: Meal }
  | { kind: 'glucose'; at: Date; record: GlucoseRecord }
  | { kind: 'insulin'; at: Date; insulin: InsulinRecord }

// 수정됨·늦게 잼·목표보다 높아요 보조 문구
function getRecordNote(record: GlucoseRecord, allMeals: Meal[], criteria: Criteria) {
  const hours = criteria.postMealHours
  const notes: string[] = []
  if (record.editedAt) notes.push(`수정됨 · ${formatTime(new Date(record.editedAt))}에 고침`)
  const late = getLateMinutes(record, allMeals, hours)
  if (late > 0) notes.push(`${late}분 늦게 잼`)
  const goal = getTarget(record.slot, criteria.targets, hours)
  const isHigh = compareToTarget(record.value, goal) === 'high'
  if (isHigh) notes.push('목표보다 높아요')
  return { note: notes.join(' · '), isHigh }
}

// Figma D-01 날짜별 식사·혈당·인슐린 시간순 목록. 줄을 누르면 수정
function RecordTimeline({
  meals,
  records,
  insulins = [],
  allMeals,
  onSelectRecord,
  onSelectMeal,
  onSelectInsulin,
}: RecordTimelineProps) {
  const foods = useFoods()
  const versions = useCriteriaStore((state) => state.versions)
  const rows: Row[] = [
    ...meals.map((meal) => ({ kind: 'meal' as const, at: new Date(meal.startedAt), meal })),
    ...records.map((record) => ({
      kind: 'glucose' as const,
      at: new Date(record.measuredAt),
      record,
    })),
    ...insulins.map((insulin) => ({
      kind: 'insulin' as const,
      at: new Date(insulin.takenAt),
      insulin,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime())

  return (
    <ul className="rounded-3xl bg-white py-1.5">
      {rows.map((row) => {
        const time = (
          <time dateTime={row.at.toISOString()} className="text-body-3 text-grey-400">
            {formatTime(row.at)}
          </time>
        )

        if (row.kind === 'meal') {
          return (
            <li key={row.meal.id}>
              <button
                type="button"
                disabled={!onSelectMeal}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left disabled:cursor-default"
                onClick={() => onSelectMeal?.(row.meal)}
              >
                {time}
                <img src={iconMealSm} alt="" width={16} height={16} />
                <span className="text-grey-800 min-w-0 flex-1 truncate text-sm leading-normal font-medium">
                  {formatMealLabel(row.meal, foods)}
                </span>
              </button>
            </li>
          )
        }

        if (row.kind === 'insulin') {
          return (
            <li key={row.insulin.id}>
              <button
                type="button"
                disabled={!onSelectInsulin}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left disabled:cursor-default"
                onClick={() => onSelectInsulin?.(row.insulin)}
              >
                {time}
                <img src={iconInsulin} alt="" width={16} height={16} />
                <span className="text-grey-800 min-w-0 flex-1 truncate text-sm leading-normal font-medium">
                  {formatInsulinLabel(row.insulin)}
                </span>
              </button>
            </li>
          )
        }

        const { record } = row
        // 기록한 날짜의 기준으로 비교
        const criteria = getCriteriaAt(versions, new Date(record.measuredAt))
        const { note, isHigh } = getRecordNote(record, allMeals, criteria)

        return (
          <li key={record.id}>
            <button
              type="button"
              disabled={!onSelectRecord}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left disabled:cursor-default"
              onClick={() => onSelectRecord?.(record)}
            >
              {time}
              <img src={iconDropSm} alt="" width={16} height={16} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-grey-800 text-sm leading-normal font-bold">
                  {getSlotLabel(record.slot, record.mealType, criteria.postMealHours)}
                </span>
                {note && (
                  <span className="text-caption text-grey-500 leading-normal font-medium">
                    {note}
                  </span>
                )}
              </span>
              <span className="flex items-end gap-1">
                <span className={`text-title-3 ${isHigh ? 'text-red-500' : 'text-blue-500'}`}>
                  {record.value}
                </span>
                <span className="text-caption text-grey-400 leading-normal font-medium">mg/dL</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default RecordTimeline
