import iconDropWhiteSm from '@/assets/icons/drop-white-sm.svg'
import iconDropWhiteXs from '@/assets/icons/drop-white-xs.svg'
import iconUtensilsDarkSm from '@/assets/icons/utensils-dark-sm.svg'
import walking from '@/assets/images/dangdang/walking.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import type { Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'
import { getSlotLabel } from '@/utils/glucose'

type EatingHeroProps = {
  postMealHours: number
  meal: Meal
  dueAt: Date
  now: Date
  onInputGlucose: () => void
}

// Figma 「당당/홈 히어로 카드」 식사 중: 식후 측정까지 남은 시간
function EatingHero({ postMealHours, meal, dueAt, now, onInputGlucose }: EatingHeroProps) {
  const startedAt = new Date(meal.startedAt)
  const total = dueAt.getTime() - startedAt.getTime()
  const progress = Math.min(Math.max((now.getTime() - startedAt.getTime()) / total, 0), 1)
  const remainingMinutes = Math.ceil((dueAt.getTime() - now.getTime()) / 60000)
  const percent = `${progress * 100}%`

  return (
    <HeroShell
      status={`${getSlotLabel('post-meal', meal.type, postMealHours)} 측정까지`}
      postMealHours={postMealHours}
    >
      <p className="text-grey-900 flex items-baseline gap-1 font-bold">
        <span className="text-number">{remainingMinutes}</span>
        <span className="text-t4">분</span>
      </p>
      <p className="text-body-3 text-grey-700 mt-1.5">{formatTime(dueAt)}에 알려 드려요</p>

      {/* 식사 시작 → 측정까지 진행 길. 당당이가 진행 위치를 따라 걸음 */}
      <div className="relative mt-12.5 h-2 rounded-full bg-white">
        <div className="h-full rounded-full bg-yellow-500" style={{ width: percent }} />
        <span className="bg-grey-900 absolute top-1/2 right-0 flex size-5.5 -translate-y-1/2 items-center justify-center rounded-full">
          <img src={iconDropWhiteXs} alt="" width={12} height={12} />
        </span>
        <span
          aria-hidden
          className="absolute -top-12.5 size-14 -translate-x-1/2"
          style={{ left: percent }}
        >
          <img src={walking} alt="" className="absolute top-2/15 left-7/40 max-w-none" />
        </span>
      </div>
      <div className="text-caption text-grey-600 mt-2 flex justify-between">
        <span>{formatTime(startedAt)} 식사 시작</span>
        <span>{formatTime(dueAt)} 측정</span>
      </div>

      <div className="mt-auto flex h-12.5 gap-2">
        <button
          type="button"
          className="text-body-2 text-grey-900 flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white"
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

export default EatingHero
