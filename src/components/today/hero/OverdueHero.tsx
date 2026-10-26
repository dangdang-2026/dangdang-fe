import iconDropWhite from '@/assets/icons/drop-white.svg'
import faceCheer from '@/assets/images/dangdang/face-cheer.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HillDangdang } from '@/components/today/hero/HeroParts'

type OverdueHeroProps = {
  postMealHours: number | null
  dueAt: Date
  now: Date
  onInputGlucose: () => void
  onSkipMeal: () => void
}

// Figma 「당당/홈 히어로 카드」 시간 지남
function OverdueHero({ postMealHours, dueAt, now, onInputGlucose, onSkipMeal }: OverdueHeroProps) {
  const lateMinutes = Math.floor((now.getTime() - dueAt.getTime()) / 60000)

  return (
    <HeroShell
      status={`측정 시간이 ${lateMinutes}분 지났어요`}
      postMealHours={postMealHours}
      decoration={<HillDangdang face={faceCheer} />}
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">
        괜찮아요,
        <br />
        지금 재도 돼요
      </h2>
      <p className="text-body-3 text-grey-700 mt-4.5">늦게 잰 시간도 그대로 기록돼요</p>
      <button
        type="button"
        className="text-body-3 text-grey-600 mt-6.5 self-start"
        onClick={onSkipMeal}
      >
        이번 끼니는 건너뛰기
      </button>
      <HeroButton icon={iconDropWhite} onClick={onInputGlucose}>
        지금 입력
      </HeroButton>
    </HeroShell>
  )
}

export default OverdueHero
