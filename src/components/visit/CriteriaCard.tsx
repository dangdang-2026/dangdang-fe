import iconHistory from '@/assets/icons/history.svg'
import iconTarget from '@/assets/icons/target.svg'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import { MOCK_USER } from '@/mocks/user'
import { formatCriteria } from '@/utils/report'

// Figma C-02 지금 병원 기준 카드. 기준 바꾸기·이력은 다음 이슈에서 연결
function CriteriaCard() {
  return (
    <section className="shadow-card flex flex-col gap-3 rounded-3xl bg-white px-4.5 py-3.5">
      <div className="flex items-center gap-3 py-0.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-50">
          <img src={iconTarget} alt="" width={20} height={20} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-grey-900 text-base leading-normal font-bold">지금 병원 기준</h2>
          <p className="text-t7 text-grey-500">
            {formatCriteria(MOCK_USER.targets, MOCK_USER.postMealHours) ??
              '아직 적은 목표가 없어요'}
            <br />
            병원에서 들은 대로 적었어요
          </p>
        </div>
      </div>
      <button
        type="button"
        className="text-grey-800 h-12 rounded-xl bg-yellow-50 text-base leading-none font-bold"
      >
        진료 후 기준 바꾸기
      </button>
      <hr className="border-grey-100" />
      <VisitMenuRow icon={iconHistory} title="기준 변경 이력" />
    </section>
  )
}

export default CriteriaCard
