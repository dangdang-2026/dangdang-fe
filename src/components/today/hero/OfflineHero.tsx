import iconRefresh from '@/assets/icons/offline/refresh.svg'
import iconUtensilsXs from '@/assets/icons/offline/utensils-xs.svg'
import { MEAL_LABEL } from '@/constants/glucose'
import type { Meal } from '@/types/glucose'
import { formatTime } from '@/utils/date'

type OfflineHeroProps = {
  meal: Meal
  dueAt: Date
  onRetry: () => void
}

// Figma H-12 식사 중 연결이 끊김. 식사 시작은 기기에 남았고 측정 알림만 예약 전
function OfflineHero({ meal, dueAt, onRetry }: OfflineHeroProps) {
  return (
    <section className="rounded-hero shadow-offline flex flex-col items-start gap-2.5 bg-white px-4.5 py-5">
      <p className="text-grey-800 flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs leading-normal font-bold">
        <img src={iconUtensilsXs} alt="" width={14} height={14} />
        {MEAL_LABEL[meal.type]} · {formatTime(new Date(meal.startedAt))} 식사 시작
      </p>
      <h2 className="text-t4 text-grey-900">식사 시작은 기록해 뒀어요</h2>
      <p className="text-grey-700 text-sm leading-normal">
        연결되면 {formatTime(dueAt)} 측정 알림을 바로 예약할게요. 그 전에는 직접 시간을 확인해
        주세요.
      </p>
      <button
        type="button"
        className="bg-grey-900 flex h-12 w-full items-center justify-center gap-1 rounded-xl text-base leading-none font-bold text-white"
        onClick={onRetry}
      >
        <img src={iconRefresh} alt="" width={20} height={20} />
        다시 연결하기
      </button>
    </section>
  )
}

export default OfflineHero
