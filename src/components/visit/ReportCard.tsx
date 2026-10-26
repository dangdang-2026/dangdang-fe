import iconArchive from '@/assets/icons/archive.svg'
import iconFile from '@/assets/icons/file.svg'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import { addDays } from '@/utils/date'

// 리포트 기본 기간(최근 2주)
const REPORT_DAYS = 14

type ReportCardProps = {
  today: Date
}

const formatShortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`

// Figma C-02 진료 리포트 카드. 리포트 화면은 다음 이슈에서 연결
function ReportCard({ today }: ReportCardProps) {
  const from = addDays(today, -(REPORT_DAYS - 1))

  return (
    <section className="shadow-card flex flex-col gap-2.5 rounded-3xl bg-white px-4.5 py-3.5">
      <VisitMenuRow
        icon={iconFile}
        primary
        title="진료 리포트 만들기"
        description={`${formatShortDate(from)}–${formatShortDate(today)} 기록 · A4 1쪽`}
      />
      <hr className="border-grey-100" />
      <VisitMenuRow icon={iconArchive} title="지난 리포트" />
    </section>
  )
}

export default ReportCard
