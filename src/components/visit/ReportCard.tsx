import iconArchive from '@/assets/icons/archive.svg'
import iconFile from '@/assets/icons/file.svg'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import { REPORT_DAYS } from '@/constants/report'
import { useReportStore } from '@/stores/useReportStore'
import { addDays } from '@/utils/date'

type ReportCardProps = {
  today: Date
  // 다가오는 진료의 서버 리포트 기간. 받는 중이면 'loading', 진료용이 아니면 없음(최근 2주)
  visitPeriod?: { from: Date; to: Date } | 'loading' | null
  onCreate: () => void
  onPast: () => void
}

const formatShortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// Figma C-02 진료 리포트 카드
function ReportCard({ today, visitPeriod, onCreate, onPast }: ReportCardProps) {
  // 리포트 화면과 같은 기간으로. 받는 중엔 날짜를 비워 2주 기간이 잠깐 보이지 않게
  const period =
    visitPeriod === 'loading'
      ? '진료 전까지'
      : visitPeriod
        ? `${formatShortDate(visitPeriod.from)}–${formatShortDate(visitPeriod.to)}`
        : `${formatShortDate(addDays(today, -(REPORT_DAYS - 1)))}–${formatShortDate(today)}`
  const pastCount = useReportStore((state) => state.reports.length)

  return (
    <section className="shadow-card flex flex-col gap-2.5 rounded-3xl bg-white px-4.5 py-3.5">
      <VisitMenuRow
        icon={iconFile}
        primary
        title="진료 리포트 만들기"
        description={`${period} 기록 · A4 1쪽`}
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
