import iconCheck from '@/assets/icons/check.svg'
import iconUtensilsDark from '@/assets/icons/utensils-dark.svg'
import faceHappy from '@/assets/images/dangdang/face-happy.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HeroButton, HeroChip, HillDangdang } from '@/components/today/hero/HeroParts'
import { MEAL_LABEL } from '@/constants/glucose'
import type { GlucoseRecord, MealType } from '@/types/glucose'
import { formatTime } from '@/utils/date'
import { getSlotLabel } from '@/utils/glucose'

type SavedHeroProps = {
  postMealHours: number
  record: GlucoseRecord
  nextMeal: MealType
  onStartMeal: () => void
}

// Figma 「당당/홈 히어로 카드」 저장 직후. 색으로 수치를 평가하지 않음
function SavedHero({ postMealHours, record, nextMeal, onStartMeal }: SavedHeroProps) {
  const label = getSlotLabel(record.slot, record.mealType, postMealHours)
  const meal = MEAL_LABEL[nextMeal]

  return (
    <HeroShell
      status={`${label} · ${formatTime(new Date(record.measuredAt))}`}
      postMealHours={postMealHours}
      decoration={<HillDangdang face={faceHappy} />}
    >
      <p className="flex items-baseline gap-1.5">
        <span className="text-number text-grey-900">{record.value}</span>
        <span className="text-body-2 text-grey-700 leading-none font-semibold">mg/dL</span>
      </p>
      <div className="mt-2">
        <HeroChip icon={iconCheck}>기록했어요</HeroChip>
      </div>
      <p className="text-body-2 text-grey-800 mt-3">
        다음은 {meal} 드실 때
        <br />
        눌러 주세요
      </p>
      <HeroButton icon={iconUtensilsDark} light onClick={onStartMeal}>
        {meal} 식사 시작
      </HeroButton>
    </HeroShell>
  )
}

export default SavedHero
