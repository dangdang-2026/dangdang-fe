import WarmBackground from '@/components/common/WarmBackground'
import BeforeMealHero from '@/components/today/hero/BeforeMealHero'
import EatingHero from '@/components/today/hero/EatingHero'
import QuickActions from '@/components/today/QuickActions'
import TodayHeader from '@/components/today/TodayHeader'
import TodayRecordSection from '@/components/today/TodayRecordSection'
import {
  TOUR_BEFORE_MEAL,
  TOUR_DUE_AT,
  TOUR_EATING,
  TOUR_LUNCH,
  TOUR_LUNCH_RECORD,
  TOUR_NOW,
  TOUR_POST_MEAL_HOURS,
  TOUR_VISIT_DAYS,
} from '@/mocks/tour'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatPregnancyAge } from '@/utils/pregnancy'

type TourHomeStageProps = {
  // 식사 전(1단계) · 식사 중(2~5단계)
  eating: boolean
}

const noop = () => {}

// A-05 투어 뒤에 깔리는 오늘 탭. 실제 컴포넌트에 예시 기록만 넣음
function TourHomeStage({ eating }: TourHomeStageProps) {
  const name = useProfileStore((state) => state.name)
  const dueDate = useProfileStore((state) => state.dueDate)
  const { meals, records } = eating ? TOUR_EATING : TOUR_BEFORE_MEAL

  return (
    <main className="px-5 pt-15.5">
      <WarmBackground />
      <TodayHeader
        name={name}
        date={TOUR_NOW}
        pregnancyLabel={formatPregnancyAge(dueDate, TOUR_NOW)}
        visitLabel={`진료 D-${TOUR_VISIT_DAYS}`}
      />
      <div data-tour="hero" className="mt-6">
        {eating ? (
          <EatingHero
            postMealHours={TOUR_POST_MEAL_HOURS}
            meal={TOUR_LUNCH}
            dueAt={TOUR_DUE_AT}
            now={TOUR_NOW}
            onInputGlucose={noop}
            onWriteMeal={noop}
          />
        ) : (
          <BeforeMealHero
            postMealHours={TOUR_POST_MEAL_HOURS}
            nextMeal="dinner"
            lastRecord={TOUR_LUNCH_RECORD}
            onStartMeal={noop}
          />
        )}
      </div>
      <div className="mt-5">
        <QuickActions
          insulinMode={false}
          onInputGlucose={noop}
          onWriteMeal={noop}
          onOpenReport={noop}
          onInsulin={noop}
          onContactMemo={noop}
        />
      </div>
      <div className="mt-5.5">
        <TodayRecordSection
          meals={meals}
          records={records}
          postMealHours={TOUR_POST_MEAL_HOURS}
          onInputGlucose={noop}
        />
      </div>
    </main>
  )
}

export default TourHomeStage
