import iconClock from '@/assets/icons/clock.svg'
import iconClipboard from '@/assets/icons/today/clipboard.svg'
import beforeMeal from '@/assets/images/dangdang/before-meal.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HeroChip, HillDangdang } from '@/components/today/hero/HeroParts'
import type { Meal } from '@/types/glucose'
import { getSlotLabel } from '@/utils/glucose'

type DayEndHeroProps = {
  postMealHours: number | null
  // 비어 있는 식후 측정 중 마지막 끼니
  meal: Meal
  onFill: () => void
}

// Figma H-07 하루 정리. 저녁 이후 놓친 측정은 빨강 없이 나중에 채우기
function DayEndHero({ postMealHours, meal, onFill }: DayEndHeroProps) {
  return (
    <HeroShell
      status="오늘 하루 수고했어요"
      postMealHours={postMealHours}
      decoration={<HillDangdang body={beforeMeal} />}
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">
        비어 있는 기록은
        <br />
        나중에 채워도 돼요
      </h2>
      <div className="mt-7.5">
        <HeroChip icon={iconClock}>
          {getSlotLabel('post-meal', meal.type, postMealHours)}이 비어 있어요
        </HeroChip>
      </div>
      <HeroButton icon={iconClipboard} onClick={onFill}>
        빈 기록 채우기
      </HeroButton>
    </HeroShell>
  )
}

export default DayEndHero
