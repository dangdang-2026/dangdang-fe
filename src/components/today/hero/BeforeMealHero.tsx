import iconCheck from '@/assets/icons/check.svg'
import iconUtensils from '@/assets/icons/utensils.svg'
import beforeMeal from '@/assets/images/dangdang/before-meal.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HeroChip, HillDangdang } from '@/components/today/hero/HeroParts'
import { MEAL_LABEL } from '@/constants/glucose'
import type { GlucoseRecord, MealType } from '@/types/glucose'
import { getSlotLabel } from '@/utils/glucose'

type BeforeMealHeroProps = {
  postMealHours: number
  nextMeal: MealType
  lastRecord?: GlucoseRecord
  onStartMeal: () => void
}

// Figma 「당당/홈 히어로 카드」 식사 전
function BeforeMealHero({ postMealHours, nextMeal, lastRecord, onStartMeal }: BeforeMealHeroProps) {
  const meal = MEAL_LABEL[nextMeal]

  return (
    <HeroShell
      status={`다음은 ${meal}`}
      postMealHours={postMealHours}
      decoration={<HillDangdang body={beforeMeal} />}
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">
        {meal} 드실 때
        <br />
        눌러 주세요
      </h2>
      {lastRecord && (
        <div className="mt-7.5">
          <HeroChip icon={iconCheck}>
            {getSlotLabel(lastRecord.slot, lastRecord.mealType, postMealHours)} · {lastRecord.value}{' '}
            기록함
          </HeroChip>
        </div>
      )}
      <HeroButton icon={iconUtensils} onClick={onStartMeal}>
        식사 시작
      </HeroButton>
    </HeroShell>
  )
}

export default BeforeMealHero
