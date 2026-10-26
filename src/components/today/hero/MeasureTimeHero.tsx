import iconClock from '@/assets/icons/clock.svg'
import iconDropWhite from '@/assets/icons/drop-white.svg'
import faceCheer from '@/assets/images/dangdang/face-cheer.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HeroChip, HillDangdang } from '@/components/today/hero/HeroParts'
import type { Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'
import { getSlotLabel } from '@/utils/glucose'

type MeasureTimeHeroProps = {
  postMealHours: number
  meal: Meal
  dueAt: Date
  onInputGlucose: () => void
}

// Figma 「당당/홈 히어로 카드」 측정할 시간
function MeasureTimeHero({ postMealHours, meal, dueAt, onInputGlucose }: MeasureTimeHeroProps) {
  return (
    <HeroShell
      status="지금 잴 시간이에요"
      postMealHours={postMealHours}
      gradient="from-yellow-100 to-yellow-300"
      decoration={<HillDangdang face={faceCheer} />}
    >
      <p className="text-number text-grey-900">{formatTime(dueAt)}</p>
      <p className="text-body-2 text-grey-800 mt-1.5">
        {getSlotLabel('post-meal', meal.type, postMealHours)}
      </p>
      {/* 알림 연동 전이라 UI만 */}
      <div className="mt-5">
        <HeroChip icon={iconClock}>10분 뒤 다시 알려 줘</HeroChip>
      </div>
      <HeroButton icon={iconDropWhite} onClick={onInputGlucose}>
        혈당 입력
      </HeroButton>
    </HeroShell>
  )
}

export default MeasureTimeHero
