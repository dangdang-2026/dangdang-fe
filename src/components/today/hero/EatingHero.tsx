import iconDropWhiteXs from '@/assets/icons/drop-white-xs.svg'
import walking from '@/assets/images/dangdang/walking.svg'
import HeroShell from '@/components/today/hero/HeroShell'
import { EatingButtons } from '@/components/today/hero/HeroParts'
import { MEAL_LABEL } from '@/constants/glucose'
import type { Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'

type EatingHeroProps = {
  postMealHours: number | null
  meal: Meal
  dueAt: Date
  now: Date
  onWriteMeal: () => void
  onEditStart: () => void
}

// Figma H-03 식사 시작 직후: 식후 측정까지 남은 시간 · 먹은 것 적기 · 시작 시각 고치기
function EatingHero({
  postMealHours,
  meal,
  dueAt,
  now,
  onWriteMeal,
  onEditStart,
}: EatingHeroProps) {
  const startedAt = new Date(meal.startedAt)
  const total = dueAt.getTime() - startedAt.getTime()
  const progress = Math.min(Math.max((now.getTime() - startedAt.getTime()) / total, 0), 1)
  // now는 15초마다 갱신돼 식사 시작보다 이를 수 있음. 그땐 시작 시각 기준으로 1분 더 붙지 않게
  const current = Math.max(now.getTime(), startedAt.getTime())
  const remainingMinutes = Math.ceil((dueAt.getTime() - current) / 60000)
  const percent = `${progress * 100}%`

  return (
    <HeroShell
      status={`${MEAL_LABEL[meal.type]} · ${formatTime(startedAt)} 식사 시작`}
      postMealHours={postMealHours}
      muted
    >
      <h2 className="text-title-2 text-grey-900 mt-1.5">맛있게 드세요</h2>
      <p className="text-grey-700 mt-1.5 text-sm font-medium">
        {formatTime(dueAt)}에 재자고 알려 드릴게요
      </p>

      <p className="text-grey-900 mt-auto self-end text-sm font-bold">
        {remainingMinutes}분 남았어요
      </p>
      {/* 식사 시작 → 측정까지 진행 길. 당당이가 진행 위치를 따라 걸음 */}
      <div className="relative mt-4 h-2 rounded-full bg-white">
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

      <EatingButtons onWriteMeal={onWriteMeal} onEditStart={onEditStart} />
    </HeroShell>
  )
}

export default EatingHero
