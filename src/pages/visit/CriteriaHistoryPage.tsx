import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import iconInfo from '@/assets/icons/info-grey.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import { ROUTES } from '@/constants/routes'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import type { Criteria } from '@/types/criteria'
import { formatMeasureSlots, formatPostMealHours } from '@/utils/criteria'
import { formatMonthDay } from '@/utils/date'

// 예: 식후 1시간 · 140 미만 / 공복 · 목표 비어 있음
const formatGoal = (label: string, target: number | null) =>
  `${label} · ${target === null ? '목표 비어 있음' : `${target} 미만`}`

function CriteriaVersionCard({ criteria, isCurrent }: { criteria: Criteria; isCurrent: boolean }) {
  // 첫 버전은 가입 전부터 적용이라 날짜 대신 처음
  const dateLabel = criteria.version === 1 ? '처음' : formatMonthDay(new Date(criteria.appliedFrom))

  return (
    <li
      className={`rounded-banner flex flex-col gap-1.5 p-4.5 ${
        isCurrent ? 'bg-yellow-50' : 'bg-grey-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-bold">
          <span className="text-t7 text-grey-500">v{criteria.version}</span>
          <span className="text-grey-900 text-base leading-normal">{dateLabel}</span>
        </p>
        {isCurrent && (
          <span className="bg-primary text-grey-900 rounded-full px-2.5 py-1 text-xs leading-normal font-bold">
            지금 기준
          </span>
        )}
      </div>
      <p className="text-grey-800 text-sm leading-normal font-medium">
        {formatGoal(formatPostMealHours(criteria.postMealHours), criteria.targets.postMeal)}
      </p>
      <p className="text-grey-800 text-sm leading-normal font-medium">
        {formatGoal('공복', criteria.targets.fasting)}
      </p>
      <p className="text-grey-800 text-sm leading-normal font-medium">
        재는 때 · {formatMeasureSlots(criteria.measureSlots)}
      </p>
      <p className="text-grey-500 text-xs leading-normal">{criteria.source}</p>
    </li>
  )
}

// Figma C-10 기준 변경 이력. 최신 버전부터
function CriteriaHistoryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const versions = useCriteriaStore((state) => state.versions)
  // 기준을 막 바꾸고 왔으면 안내
  const [toast, setToast] = useState<string | null>(() =>
    (location.state as { saved?: boolean } | null)?.saved
      ? '새 기준을 적었어요 · 지난 기록은 그때 기준으로 보여요'
      : null,
  )
  const closeToast = useCallback(() => setToast(null), [])
  const latest = versions[versions.length - 1]

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="기준 변경 이력" onBack={() => navigate(ROUTES.VISIT)} />

      <ul className="mt-4 flex flex-col gap-3">
        {[...versions].reverse().map((criteria) => (
          <CriteriaVersionCard
            key={criteria.version}
            criteria={criteria}
            isCurrent={criteria === latest}
          />
        ))}
      </ul>

      <p className="text-t7 text-grey-500 mt-5 flex items-start gap-2 px-1">
        <img src={iconInfo} alt="" width={16} height={16} className="mt-0.5" />
        리포트에는 기록한 날짜의 기준으로 표시돼요
      </p>

      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default CriteriaHistoryPage
