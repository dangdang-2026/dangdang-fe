import iconEdit from '@/assets/icons/edit.svg'
import iconFileGrey from '@/assets/icons/file-grey.svg'
import WarmBackground from '@/components/common/WarmBackground'
import CriteriaCard from '@/components/visit/CriteriaCard'
import NextVisitCard from '@/components/visit/NextVisitCard'
import QuestionsCard from '@/components/visit/QuestionsCard'
import ReportCard from '@/components/visit/ReportCard'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import { TOUR_NOW, TOUR_QUESTIONS, TOUR_VISIT_AT, TOUR_VISIT_DAYS } from '@/mocks/tour'
import { startOfDay } from '@/utils/date'

const noop = () => {}

// A-05g 투어 뒤에 깔리는 진료 탭. 실제 카드에 예시 진료일·질문만 넣음
function TourVisitStage() {
  return (
    <main className="px-5 pt-15.5">
      <WarmBackground />
      <header className="flex items-center justify-between">
        <h1 className="text-title-2 text-grey-900">진료</h1>
        <span className="shadow-icon-button flex size-10.5 items-center justify-center rounded-full bg-white">
          <img src={iconEdit} alt="" width={20} height={20} />
        </span>
      </header>

      <div className="mt-4">
        <NextVisitCard
          status={{ kind: 'upcoming', at: TOUR_VISIT_AT, dDay: TOUR_VISIT_DAYS }}
          onEdit={noop}
        />
      </div>
      <div className="mt-4">
        <QuestionsCard questions={TOUR_QUESTIONS} onAdd={noop} onRemove={noop} />
      </div>
      <div className="mt-4">
        <ReportCard today={startOfDay(TOUR_NOW)} onCreate={noop} onPast={noop} />
      </div>
      <div className="mt-4">
        <CriteriaCard onChange={noop} onNote={noop} onHistory={noop} />
      </div>
      <section className="shadow-card mt-4 rounded-3xl bg-white px-4.5 py-3.5">
        <VisitMenuRow
          icon={iconFileGrey}
          title="공식 자료"
          description="믿을 수 있는 곳의 자료만 모았어요"
        />
      </section>
    </main>
  )
}

export default TourVisitStage
