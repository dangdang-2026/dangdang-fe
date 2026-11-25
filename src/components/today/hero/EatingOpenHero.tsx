import HeroShell from '@/components/today/hero/HeroShell'
import { EatingButtons } from '@/components/today/hero/HeroParts'
import { MEAL_LABEL } from '@/constants/glucose'
import type { Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'

type EatingOpenHeroProps = {
  meal: Meal
  // 병원 기준에 없는 끼니. 측정 시점을 정하라는 대신 안 재도 된다고 안내
  free?: boolean
  postMealHours: number | null
  onWriteMeal: () => void
  onEditStart: () => void
}

// Figma H-03b 식사 중인데 측정 시점을 모름: 식후 알림 없음 안내. 기준에 없는 끼니도 같은 틀
function EatingOpenHero({
  meal,
  free = false,
  postMealHours,
  onWriteMeal,
  onEditStart,
}: EatingOpenHeroProps) {
  return (
    <HeroShell
      status={`${MEAL_LABEL[meal.type]} · ${formatTime(new Date(meal.startedAt))} 식사 시작`}
      postMealHours={free ? postMealHours : null}
      muted
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">맛있게 드세요</h2>
      <p className="text-grey-700 mt-1.5 text-sm leading-normal font-medium">
        {free ? (
          <>
            병원 기준에 없는 끼니라 식후에 안 재도 돼요.
            <br />
            재고 싶으면 혈당 입력에서 적어 주세요.
          </>
        ) : (
          <>
            식후 측정 알림은 보내지 않아요.
            <br />
            병원에서 식후 몇 시간인지 들으면
            <br />
            병원 기준에서 골라 주세요.
          </>
        )}
      </p>

      <div className="mt-auto" />
      <EatingButtons onWriteMeal={onWriteMeal} onEditStart={onEditStart} />
    </HeroShell>
  )
}

export default EatingOpenHero
