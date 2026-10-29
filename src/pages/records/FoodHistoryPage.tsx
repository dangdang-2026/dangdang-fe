import { Navigate, useSearchParams } from 'react-router'
import iconInfo from '@/assets/icons/info-lg.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import { MEAL_LABEL } from '@/constants/glucose'
import { ROUTES } from '@/constants/routes'
import { useFoods } from '@/hooks/useFoods'
import { useGoBack } from '@/hooks/useGoBack'
import { useCriteriaStore } from '@/stores/useCriteriaStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { getLateMinutes } from '@/utils/glucose'
import {
  findFood,
  findStaple,
  formatPortion,
  getFoodHistory,
  withObjectParticle,
  type FoodHistoryEntry,
} from '@/utils/meal'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type HistoryRowProps = {
  entry: FoodHistoryEntry
  // 이 음식이 주식이면 그 끼니의 양
  portion: string | null
  lateMinutes: number
}

// 기록 한 줄. 수치에 색·평가 없음
function HistoryRow({ entry, portion, lateMinutes }: HistoryRowProps) {
  const { meal, record, postMealHours } = entry
  const at = new Date(meal.startedAt)
  const details = [
    portion,
    postMealHours && `식후 ${postMealHours}시간`,
    lateMinutes > 0 && `${lateMinutes}분 늦게 잼`,
  ].filter(Boolean)

  return (
    <li className="border-grey-100 flex items-center gap-3 border-t px-4 py-3.5 first:border-t-0">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
        <span className="text-grey-900 text-t6 leading-snug font-bold">
          {at.getMonth() + 1}월 {at.getDate()}일 ({WEEKDAYS[at.getDay()]}) {MEAL_LABEL[meal.type]}
        </span>
        {details.length > 0 && (
          <span className="text-t7 text-grey-600 leading-snug">{details.join(' · ')}</span>
        )}
      </span>
      {record ? (
        <span className="flex shrink-0 items-baseline gap-0.5">
          <span className="text-t4 text-grey-900 leading-snug">{record.value}</span>
          <span className="text-grey-600 text-xs leading-snug font-medium">mg/dL</span>
        </span>
      ) : (
        <span aria-label="식후 수치 없음" className="text-t4 text-grey-400 shrink-0 leading-snug">
          —
        </span>
      )}
    </li>
  )
}

// Figma D-12 같은 메뉴 지난 기록. 먹은 날짜·양·식후 수치만
function FoodHistoryPage() {
  const goBack = useGoBack(ROUTES.RECORDS)
  const [searchParams] = useSearchParams()
  const name = searchParams.get('name') ?? ''
  const excludeMealId = searchParams.get('exclude') ?? undefined
  const meals = useGlucoseStore((state) => state.meals)
  const records = useGlucoseStore((state) => state.records)
  const versions = useCriteriaStore((state) => state.versions)
  const foods = useFoods()

  if (!name) return <Navigate to={ROUTES.RECORDS} replace />
  const history = getFoodHistory(name, meals, records, versions, excludeMealId)

  // 이 음식이 그 끼니의 주식일 때만 양 표시
  const getPortion = ({ meal }: FoodHistoryEntry) => {
    const staple = findStaple(meal.foods ?? [], foods)
    if (!meal.portion || staple?.name !== name) return null
    return formatPortion(meal.portion, findFood(name, foods)?.unit ?? staple.unit)
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-10">
      <SubPageHeader title={`${name} 지난 기록`} onBack={goBack} />

      <h2 className="text-t3 text-grey-900 mt-3">
        {history.length > 0
          ? `${withObjectParticle(name)} 먹은 날 ${history.length}번`
          : `${withObjectParticle(name)} 먹은 기록이 아직 없어요`}
      </h2>

      {history.length > 0 && (
        <ul className="border-grey-200 rounded-key mt-5 overflow-hidden border">
          {history.map((entry) => (
            <HistoryRow
              key={entry.meal.id}
              entry={entry}
              portion={getPortion(entry)}
              lateMinutes={
                entry.record ? getLateMinutes(entry.record, meals, entry.postMealHours) : 0
              }
            />
          ))}
        </ul>
      )}

      <p className="bg-grey-50 text-t7 text-grey-700 mt-5 flex items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
        <img src={iconInfo} alt="" width={18} height={18} className="shrink-0" />
        같은 음식도 양이나 함께 먹은 음식에 따라 수치가 달라요. 궁금하면 물어볼 것에 적어 두세요.
      </p>
    </main>
  )
}

export default FoodHistoryPage
