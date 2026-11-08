import iconDropWhiteSm from '@/assets/icons/drop-white-sm.svg'
import iconUtensilsDarkSm from '@/assets/icons/utensils-dark-sm.svg'
import walking from '@/assets/images/dangdang/walking.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { HillDangdang } from '@/components/today/hero/HeroParts'
import { MEAL_LABEL } from '@/constants/glucose'
import type { Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'

type EatingOpenHeroProps = {
  meal: Meal
  onInputGlucose: () => void
  onWriteMeal: () => void
}

// 식사 중인데 측정 시점을 모름: 남은 시간 대신 시작 시각만
function EatingOpenHero({ meal, onInputGlucose, onWriteMeal }: EatingOpenHeroProps) {
  return (
    <HeroShell
      status={`${MEAL_LABEL[meal.type]} 식사 중`}
      postMealHours={null}
      decoration={<HillDangdang body={walking} />}
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">
        {formatTime(new Date(meal.startedAt))}
        <br />
        식사 시작
      </h2>
      <p className="text-body-3 text-grey-700 mt-1.5">
        측정 시점을 정하면
        <br />잴 시간을 알려 드려요
      </p>

      <div className="mt-auto flex h-12.5 gap-2">
        <button
          type="button"
          className="text-body-2 text-grey-900 flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white"
          onClick={onWriteMeal}
        >
          <img src={iconUtensilsDarkSm} alt="" width={18} height={18} />
          식사 내용 적기
        </button>
        <button
          type="button"
          className="bg-grey-900 text-body-2 text-grey-50 flex flex-1 items-center justify-center gap-1.5 rounded-2xl"
          onClick={onInputGlucose}
        >
          <img src={iconDropWhiteSm} alt="" width={18} height={18} />
          지금 입력
        </button>
      </div>
    </HeroShell>
  )
}

export default EatingOpenHero
