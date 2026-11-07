import iconAlert from '@/assets/icons/alert.svg'
import { GLUCOSE_MAX, GLUCOSE_MIN } from '@/constants/glucose'
import type { TargetComparison } from '@/types/glucose'

type TargetChipProps = {
  comparison: TargetComparison
  target: number | null
}

// Figma G-03~G-06, G-08 수치 아래 칩. 색은 목표 비교 결과만 표시
function TargetChip({ comparison, target }: TargetChipProps) {
  const base = 'text-t7 flex items-center gap-1 rounded-full px-3 py-1.5 font-bold'

  if (comparison === 'in-range') {
    return <p className={`${base} bg-blue-50 text-blue-600`}>내 목표 안이에요 · {target} 미만</p>
  }
  if (comparison === 'high') {
    return (
      <p className={`${base} bg-red-50 text-red-600`}>
        <img src={iconAlert} alt="" width={14} height={14} />
        목표보다 높아요 · {target} 미만
      </p>
    )
  }
  if (comparison === 'invalid') {
    return (
      <p className={`${base} bg-red-50 text-red-500`}>
        {GLUCOSE_MIN}~{GLUCOSE_MAX} 사이 숫자인지 확인해 주세요
      </p>
    )
  }
  return (
    <p className={`${base} bg-grey-100 text-grey-600`}>병원 목표를 적으면 비교해서 보여 드려요</p>
  )
}

export default TargetChip
