import { useNavigate } from 'react-router'
import iconDropWhiteSm from '@/assets/icons/drop-white-sm.svg'
import iconUtensilsDarkSm from '@/assets/icons/utensils-dark-sm.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { MEAL_LABEL } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import type { Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'

type EatingOpenHeroProps = {
  meal: Meal
  onWriteMeal: () => void
}

// Figma H-03b 식사 중인데 측정 시점을 모름: 식후 알림 없음 안내 + 병원 기준 정하기
function EatingOpenHero({ meal, onWriteMeal }: EatingOpenHeroProps) {
  const navigate = useNavigate()
  return (
    <HeroShell
      status={`${MEAL_LABEL[meal.type]} · ${formatTime(new Date(meal.startedAt))} 식사 시작`}
      postMealHours={null}
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">
        식후 측정 알림은
        <br />
        보내지 않아요
      </h2>
      <p className="text-body-3 text-grey-700 mt-3 font-normal">
        병원에서 식후 몇 시간에 잴지 들으면
        <br />
        병원 기준에서 골라 주세요. 그때부터 알려 드려요.
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
          onClick={() => navigate(ROUTES.MY_CRITERIA)}
        >
          <img src={iconDropWhiteSm} alt="" width={18} height={18} />
          병원 기준 정하기
        </button>
      </div>
    </HeroShell>
  )
}

export default EatingOpenHero
