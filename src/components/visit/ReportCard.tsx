import iconArchive from '@/assets/icons/archive.svg'
import iconFile from '@/assets/icons/file.svg'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import { REPORT_DAYS } from '@/constants/report'
import { useReportStore } from '@/stores/useReportStore'
import { addDays } from '@/utils/date'

type ReportCardProps = {
  today: Date
  onCreate: () => void
  onPast: () => void
}

const formatShortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// Figma C-02 진료 리포트 카드
function ReportCard({ today, onCreate, onPast }: ReportCardProps) {
  const from = addDays(today, -(REPORT_DAYS - 1))
  const pastCount = useReportStore((state) => state.reports.length)

  return (
    <section className="shadow-card flex flex-col gap-2.5 rounded-3xl bg-white px-4.5 py-3.5">
      <VisitMenuRow
        icon={iconFile}
        primary
        title="진료 리포트 만들기"
        description={`${formatShortDate(from)}–${formatShortDate(today)} 기록 · A4 1쪽`}
        onClick={onCreate}
      />
      <hr className="border-grey-100" />
      <VisitMenuRow
        icon={iconArchive}
        title={pastCount ? `지난 리포트 ${pastCount}장` : '지난 리포트'}
        onClick={onPast}
      />
    </section>
  )
}

export default ReportCard
