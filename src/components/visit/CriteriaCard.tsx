import iconEditGrey from '@/assets/icons/edit-grey.svg'
import iconHistory from '@/assets/icons/history.svg'
import iconTarget from '@/assets/icons/target.svg'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import { useCriteria } from '@/hooks/useCriteria'
import { formatCriteria } from '@/utils/report'

type CriteriaCardProps = {
  onChange: () => void
  // 진료 탭에서만 진료 후 메모 줄
  onNote?: () => void
  onHistory: () => void
}

// Figma C-02 지금 병원 기준 카드
function CriteriaCard({ onChange, onNote, onHistory }: CriteriaCardProps) {
  const criteria = useCriteria()
  const appliedFrom = new Date(criteria.appliedFrom)
  // 진료 후 바꾼 기준이면 그날 진료로, 아니면 출처 그대로
  const sourceLabel =
    criteria.version > 1
      ? `${appliedFrom.getMonth() + 1}/${appliedFrom.getDate()} 진료 때 들은 대로 적었어요`
      : criteria.source

  return (
    <section className="shadow-card flex flex-col gap-3 rounded-3xl bg-white px-4.5 py-3.5">
      <div className="flex items-center gap-3 py-0.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-50">
          <img src={iconTarget} alt="" width={20} height={20} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-grey-900 text-base leading-normal font-bold">지금 병원 기준</h2>
          <p className="text-t7 text-grey-500">
            {formatCriteria(criteria.targets, criteria.postMealHours) ?? '아직 적은 목표가 없어요'}
            <br />
            {sourceLabel}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="text-grey-800 h-12 rounded-xl bg-yellow-50 text-base leading-none font-bold"
        onClick={onChange}
      >
        진료 후 기준 바꾸기
      </button>
      <hr className="border-grey-100" />
      {onNote && (
        <>
          <VisitMenuRow
            icon={iconEditGrey}
            title="진료 후 메모 쓰기"
            description="들은 말을 적으면 AI가 정리해 줘요"
            onClick={onNote}
          />
          <hr className="border-grey-100" />
        </>
      )}
      <VisitMenuRow icon={iconHistory} title="기준 변경 이력" onClick={onHistory} />
    </section>
  )
}

export default CriteriaCard
