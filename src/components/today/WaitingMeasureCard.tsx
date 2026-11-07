import iconClockYellow from '@/assets/icons/today/clock-yellow.svg'
import { formatTime } from '@/utils/date'

type WaitingMeasureCardProps = {
  // 예: 점심 식후 1시간
  label: string
  dueAt: Date
}

// Figma H-03~H-05 기다리는 측정. 식사 중·측정할 시간·시간 지남에 히어로 아래
function WaitingMeasureCard({ label, dueAt }: WaitingMeasureCardProps) {
  return (
    <section className="flex flex-col gap-2.5 rounded-3xl bg-white p-4.5">
      <h2 className="text-grey-800 text-sm leading-normal font-bold">기다리는 측정</h2>
      <p className="flex items-center gap-2.5 text-sm leading-normal">
        <img src={iconClockYellow} alt="" width={18} height={18} />
        <span className="text-grey-700 flex-1 font-medium">{label}</span>
        <time dateTime={dueAt.toISOString()} className="text-grey-900 font-bold">
          {formatTime(dueAt)}
        </time>
      </p>
    </section>
  )
}

export default WaitingMeasureCard
