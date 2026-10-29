import iconCalendar from '@/assets/icons/postpartum/calendar.svg'
import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import type { PostpartumCheck } from '@/stores/useProfileStore'
import { parseDateKey } from '@/utils/date'
import { formatDday, formatMonthDayWeekday, formatRemind } from '@/utils/postpartum'

type CheckScheduleCardProps = {
  check: PostpartumCheck
  now: Date
  onWriteResult: () => void
  onChangeDate: () => void
}

// Figma E-10 산후 홈 검사 일정 카드
function CheckScheduleCard({ check, now, onWriteResult, onChangeDate }: CheckScheduleCardProps) {
  const hospital = usePrimaryHospital()
  const date = parseDateKey(check.date) ?? now

  return (
    <section className="rounded-banner flex flex-col gap-3.5 bg-yellow-50 p-4.5">
      <div className="flex items-center gap-2.5">
        <img src={iconCalendar} alt="" width={22} height={22} />
        <h2 className="text-t6 text-grey-900 flex-1 leading-snug font-bold">{check.name}</h2>
        <span className="text-t7 text-grey-900 rounded-full bg-white px-2.5 py-1 leading-snug font-bold">
          {formatDday(date, now)}
        </span>
      </div>
      <p className="text-t4 text-grey-900">
        {formatMonthDayWeekday(date)} · {hospital.name}
      </p>
      <p className="text-t7 text-grey-700 leading-snug">{formatRemind(check.remind)}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="bg-grey-900 text-t6 text-grey-50 flex-1 rounded-xl py-3 leading-snug font-bold"
          onClick={onWriteResult}
        >
          결과 적기
        </button>
        <button
          type="button"
          className="text-t6 text-grey-800 flex-1 rounded-xl bg-white py-3 leading-snug font-bold"
          onClick={onChangeDate}
        >
          날짜 바꾸기
        </button>
      </div>
    </section>
  )
}

export default CheckScheduleCard
