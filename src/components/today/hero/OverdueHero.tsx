import iconDropWhite from '@/assets/icons/drop-white.svg'
import faceCheer from '@/assets/images/dangdang/face-cheer.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HillDangdang } from '@/components/today/hero/HeroParts'
import { formatDuration } from '@/utils/criteria'

type OverdueHeroProps = {
  postMealHours: number | null
  dueAt: Date
  now: Date
  onInputGlucose: () => void
  onSkipMeal: () => void
}

// Figma H-05 측정 시간 지남: 지금 재면 식후 몇 시간 몇 분으로 기록되는지
function OverdueHero({ postMealHours, dueAt, now, onInputGlucose, onSkipMeal }: OverdueHeroProps) {
  const lateMinutes = Math.floor((now.getTime() - dueAt.getTime()) / 60000)
  // 예: 식후 1시간 25분
  const elapsed = formatDuration((postMealHours ?? 0) + lateMinutes / 60)

  return (
    <HeroShell
      status={`측정 시간이 ${lateMinutes}분 지났어요`}
      postMealHours={postMealHours}
      muted
      decoration={<HillDangdang face={faceCheer} />}
    >
      <h2 className="text-t3 text-grey-900 mt-1.5">
        지금 재면
        <br />
        &apos;식후 {elapsed}&apos;으로
        <br />
        기록돼요
      </h2>
      <p className="text-body-3 text-grey-700 mt-2.5">리포트에 늦게 잰 값으로 표시돼요</p>
      <button
        type="button"
        className="text-body-3 text-grey-600 mt-3 self-start"
        onClick={onSkipMeal}
      >
        이번 끼니는 건너뛸게요
      </button>
      <HeroButton icon={iconDropWhite} onClick={onInputGlucose}>
        혈당 입력
      </HeroButton>
    </HeroShell>
  )
}

export default OverdueHero
