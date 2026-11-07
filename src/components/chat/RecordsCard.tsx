import type { RecordsSummary } from '@/types/chat'

type RecordsCardProps = {
  summary: RecordsSummary
}

// Figma Q-03 기록 카드. 목표보다 높은 횟수만 세고 괜찮은지는 말하지 않음
function RecordsCard({ summary }: RecordsCardProps) {
  const { label, range, target, measured, high, missing, days } = summary

  return (
    <section className="border-grey-200 flex w-full flex-col gap-2.5 rounded-2xl border bg-white p-4">
      <p className="text-grey-600 text-xs leading-snug font-medium">
        {label} · {range}
      </p>
      <p className="text-t3 text-grey-900">
        {target === null ? `${measured}번 쟀어요` : `${measured}번 중 ${high}번`}
      </p>
      <p className="text-grey-600 text-sm leading-normal">
        {target === null
          ? '목표를 적지 않아 비교하지 않았어요.'
          : `내가 적은 목표(${target} 미만)보다 높았어요.`}
        {missing > 0 && ` ${missing}번은 기록이 없어요.`}
      </p>
      <ul className="flex justify-between pt-1 leading-snug">
        {days.map((day, index) => (
          <li key={index} className="flex flex-col items-center gap-0.5">
            <span className="text-caption text-grey-600 leading-snug font-normal">
              {day.weekday}
            </span>
            <span
              className={`text-sm font-bold ${
                day.value === null ? 'text-grey-600' : day.high ? 'text-red-700' : 'text-grey-800'
              }`}
            >
              {day.value ?? '—'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RecordsCard
