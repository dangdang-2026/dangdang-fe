import { usePrimaryHospital } from '@/hooks/usePrimaryHospital'
import { formatMeridiemTime, formatMonthDayWeekday } from '@/utils/date'
import type { VisitStatus } from '@/utils/visit'

type NextVisitCardProps = {
  status: VisitStatus
  onEdit: () => void
}

function getCardText(status: VisitStatus) {
  if (status.kind === 'unknown') return { chip: '다음 진료', title: '다음 진료일을 아직 몰라요' }
  const time = formatMeridiemTime(status.at)
  if (status.kind === 'today') return { chip: '오늘 진료', title: `오늘 ${time}` }
  return {
    chip: `다음 진료 · D-${status.dDay}`,
    title: `${formatMonthDayWeekday(status.at)} ${time}`,
  }
}

// Figma C-02·C-03·C-04 다음 진료 카드. 누르면 진료일 고치기
function NextVisitCard({ status, onEdit }: NextVisitCardProps) {
  const hospital = usePrimaryHospital()
  const { chip, title } = getCardText(status)

  return (
    <button
      type="button"
      className="from-hero-to flex w-full flex-col items-start gap-1.5 rounded-3xl bg-linear-to-b to-yellow-400 p-5 text-left"
      onClick={onEdit}
    >
      <span className="text-grey-900 rounded-full bg-white px-2.5 py-1 text-xs leading-normal font-bold">
        {chip}
      </span>
      <span className="text-t4 text-grey-900">{title}</span>
      <span className="text-grey-700 text-sm leading-normal font-medium">
        {hospital.name} · 외래
      </span>
    </button>
  )
}

export default NextVisitCard
