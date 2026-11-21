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
  // 병원 기준에 없는 끼니. 측정 시점을 정하라는 대신 안 재도 된다고 안내
  free?: boolean
  postMealHours: number | null
  onInputGlucose: () => void
  onWriteMeal: () => void
}

// Figma H-03b 식사 중인데 측정 시점을 모름: 식후 알림 없음 안내 + 병원 기준 정하기. 기준에 없는 끼니도 같은 틀
function EatingOpenHero({
  meal,
  free = false,
  postMealHours,
  onInputGlucose,
  onWriteMeal,
}: EatingOpenHeroProps) {
  const navigate = useNavigate()
  return (
    <HeroShell
      status={`${MEAL_LABEL[meal.type]} · ${formatTime(new Date(meal.startedAt))} 식사 시작`}
      postMealHours={free ? postMealHours : null}
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">
        {free ? '이번 끼니는' : '식후 측정 알림은'}
        <br />
        {free ? '식후에 안 재도 돼요' : '보내지 않아요'}
      </h2>
      <p className="text-body-3 text-grey-700 mt-3 font-normal">
        {free ? '병원 기준에 없는 끼니예요.' : '병원에서 식후 몇 시간에 잴지 들으면'}
        <br />
        {free
          ? '재고 싶으면 혈당 입력에서 적어 주세요.'
          : '병원 기준에서 골라 주세요. 그때부터 알려 드려요.'}
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
          onClick={free ? onInputGlucose : () => navigate(ROUTES.MY_CRITERIA)}
        >
          <img src={iconDropWhiteSm} alt="" width={18} height={18} />
          {free ? '혈당 입력' : '병원 기준 정하기'}
        </button>
      </div>
    </HeroShell>
  )
}

export default EatingOpenHero
