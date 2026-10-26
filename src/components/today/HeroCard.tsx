import BeforeMealHero from '@/components/today/hero/BeforeMealHero'
import EatingHero from '@/components/today/hero/EatingHero'
import FirstDayHero from '@/components/today/hero/FirstDayHero'
import MeasureTimeHero from '@/components/today/hero/MeasureTimeHero'
import OverdueHero from '@/components/today/hero/OverdueHero'
import SavedHero from '@/components/today/hero/SavedHero'
import type { HeroState } from '@/utils/glucose'

type HeroCardProps = {
  state: HeroState
  now: Date
  postMealHours: number
  onStartMeal: () => void
  onInputGlucose: () => void
  onSkipMeal: (mealId: string) => void
}

// 기록·식사 상태에 따라 히어로 카드 한 장만 표시
function HeroCard({
  state,
  now,
  postMealHours,
  onStartMeal,
  onInputGlucose,
  onSkipMeal,
}: HeroCardProps) {
  switch (state.kind) {
    case 'first-day':
      return <FirstDayHero postMealHours={postMealHours} onStartMeal={onStartMeal} />
    case 'before-meal':
      return (
        <BeforeMealHero
          postMealHours={postMealHours}
          nextMeal={state.nextMeal}
          lastRecord={state.lastRecord}
          onStartMeal={onStartMeal}
        />
      )
    case 'eating':
      return (
        <EatingHero
          postMealHours={postMealHours}
          meal={state.meal}
          dueAt={state.dueAt}
          now={now}
          onInputGlucose={onInputGlucose}
        />
      )
    case 'measure-time':
      return (
        <MeasureTimeHero
          postMealHours={postMealHours}
          meal={state.meal}
          dueAt={state.dueAt}
          onInputGlucose={onInputGlucose}
        />
      )
    case 'overdue':
      return (
        <OverdueHero
          postMealHours={postMealHours}
          dueAt={state.dueAt}
          now={now}
          onInputGlucose={onInputGlucose}
          onSkipMeal={() => onSkipMeal(state.meal.id)}
        />
      )
    case 'saved':
      return (
        <SavedHero
          postMealHours={postMealHours}
          record={state.record}
          nextMeal={state.nextMeal}
          onStartMeal={onStartMeal}
        />
      )
  }
}

export default HeroCard
