import { Link } from 'react-router'
import iconDrop from '@/assets/icons/drop.svg'
import iconPlus from '@/assets/icons/plus.svg'
import { MEAL_LABEL } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import type { GlucoseRecord, Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'
import { getSlotLabel } from '@/utils/glucose'

type TodayRecordSectionProps = {
  meals: Meal[]
  records: GlucoseRecord[]
  postMealHours: number | null
  onInputGlucose: () => void
}

type TimelineItem = {
  id: string
  at: Date
  label: string
  value?: number
}

// 식사·혈당을 시간순 한 줄씩
function toTimeline(meals: Meal[], records: GlucoseRecord[], hours: number | null) {
  const items: TimelineItem[] = [
    ...meals.map((meal) => ({
      id: meal.id,
      at: new Date(meal.startedAt),
      label: `${MEAL_LABEL[meal.type]} 식사`,
    })),
    ...records.map((record) => ({
      id: record.id,
      at: new Date(record.measuredAt),
      label: getSlotLabel(record.slot, record.mealType, hours),
      value: record.value,
    })),
  ]
  return items.sort((a, b) => a.at.getTime() - b.at.getTime())
}

function TodayRecordSection({
  meals,
  records,
  postMealHours,
  onInputGlucose,
}: TodayRecordSectionProps) {
  const timeline = toTimeline(meals, records, postMealHours)

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-title-3 text-grey-900">오늘 기록</h2>
        {timeline.length > 0 ? (
          <Link to={ROUTES.RECORDS} className="text-body-3 text-grey-500">
            전체 보기
          </Link>
        ) : (
          <span className="text-body-3 text-grey-500">0개</span>
        )}
      </div>

      {timeline.length > 0 ? (
        // Figma H-02 타임라인
        <ul className="mt-5 rounded-3xl bg-white py-1.5">
          {timeline.map(({ id, at, label, value }) => (
            <li key={id} className="flex items-center gap-3 px-4.5 py-3">
              <time dateTime={at.toISOString()} className="text-body-3 text-grey-400">
                {formatTime(at)}
              </time>
              <p className="text-t6 text-grey-800 flex-1 truncate font-bold">{label}</p>
              {value !== undefined && (
                <p className="flex items-baseline gap-1">
                  <span className="text-t4 text-blue-500">{value}</span>
                  <span className="text-caption text-grey-400 leading-normal font-medium">
                    mg/dL
                  </span>
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        // 기록 없을 때 빈 상태
        <div className="mt-3 flex flex-col items-center gap-2 rounded-3xl bg-white px-4.5 py-5.5 text-center">
          <span className="bg-grey-50 flex size-12 items-center justify-center rounded-full">
            <img src={iconDrop} alt="" width={22} height={22} />
          </span>
          <p className="text-t6 text-grey-700 font-bold">아직 기록이 없어요</p>
          <p className="text-t7 text-grey-500">공복 혈당부터 적어도 좋아요</p>
          <button
            type="button"
            className="bg-grey-100 text-t7 text-grey-700 flex items-center gap-1 rounded-full px-3.5 py-2 font-bold"
            onClick={onInputGlucose}
          >
            <img src={iconPlus} alt="" width={14} height={14} />
            혈당 입력
          </button>
        </div>
      )}
    </section>
  )
}

export default TodayRecordSection
