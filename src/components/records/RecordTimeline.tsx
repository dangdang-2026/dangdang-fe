import iconDropSm from '@/assets/icons/drop-sm.svg'
import iconMealSm from '@/assets/icons/meal-sm.svg'
import { MEAL_LABEL } from '@/constants/glucose'
import { MOCK_USER } from '@/mocks/user'
import type { GlucoseRecord, Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'
import { compareToTarget, getLateMinutes, getSlotLabel, getTarget } from '@/utils/glucose'

type RecordTimelineProps = {
  meals: Meal[]
  records: GlucoseRecord[]
  // 늦게 잼 계산용 전체 끼니
  allMeals: Meal[]
  onSelectRecord?: (record: GlucoseRecord) => void
}

type Row =
  { kind: 'meal'; at: Date; meal: Meal } | { kind: 'glucose'; at: Date; record: GlucoseRecord }

// 늦게 잼·목표보다 높아요 보조 문구
function getRecordNote(record: GlucoseRecord, allMeals: Meal[]) {
  const hours = MOCK_USER.postMealHours
  const notes: string[] = []
  const late = getLateMinutes(record, allMeals, hours)
  if (late > 0) notes.push(`${late}분 늦게 잼`)
  const goal = getTarget(record.slot, MOCK_USER.targets, hours)
  const isHigh = compareToTarget(record.value, goal) === 'high'
  if (isHigh) notes.push('목표보다 높아요')
  return { note: notes.join(' · '), isHigh }
}

// Figma D-01 날짜별 식사·혈당 시간순 목록. 혈당 줄을 누르면 수정
function RecordTimeline({ meals, records, allMeals, onSelectRecord }: RecordTimelineProps) {
  const rows: Row[] = [
    ...meals.map((meal) => ({ kind: 'meal' as const, at: new Date(meal.startedAt), meal })),
    ...records.map((record) => ({
      kind: 'glucose' as const,
      at: new Date(record.measuredAt),
      record,
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
            <li key={row.meal.id} className="flex items-center gap-2.5 px-4 py-3">
              {time}
              <img src={iconMealSm} alt="" width={16} height={16} />
              <p className="text-grey-800 text-sm leading-normal font-medium">
                {MEAL_LABEL[row.meal.type]} 식사
              </p>
            </li>
          )
        }

        const { record } = row
        const { note, isHigh } = getRecordNote(record, allMeals)

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
                  {getSlotLabel(record.slot, record.mealType, MOCK_USER.postMealHours)}
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
