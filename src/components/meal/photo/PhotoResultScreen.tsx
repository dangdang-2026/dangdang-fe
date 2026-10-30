import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconCheck from '@/assets/icons/check-dark.svg'
import iconSparkleBlue from '@/assets/icons/meal/sparkle-blue.svg'
import iconSparkleWhite from '@/assets/icons/meal/sparkle-white.svg'
import iconSearch from '@/assets/icons/search-sm.svg'
import NutritionCard from '@/components/meal/NutritionCard'
import NutritionSourceSheet from '@/components/meal/NutritionSourceSheet'
import PhotoScreen from '@/components/meal/photo/PhotoScreen'
import { foodHistoryPath } from '@/constants/routes'
import { useFoods } from '@/hooks/useFoods'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import type { Meal, Portion } from '@/types/glucose'
import { findFood, findStaple, formatPortion, type NutritionItem } from '@/utils/meal'

const PORTIONS: Portion[] = ['half', 'one', 'one-half']

type PillProps = {
  label: string
  selected: boolean
  onClick: () => void
  className?: string
}

// Figma F-12 후보·양 칩. 고르면 노란 배경 + 체크
function Pill({ label, selected, onClick, className = '' }: PillProps) {
  const color = selected
    ? 'bg-primary border-primary text-grey-900 font-bold'
    : 'border-grey-200 text-grey-800 bg-white font-medium'

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`flex items-center justify-center gap-1 rounded-full border px-3.5 py-2 text-sm leading-snug ${color} ${className}`}
      onClick={onClick}
    >
      {selected && <img src={iconCheck} alt="" width={14} height={14} />}
      {label}
    </button>
  )
}

type PhotoResultScreenProps = {
  meal: Meal
  photoUrl: string
  // AI 후보 + 직접 검색으로 고른 음식
  chips: string[]
  topCandidate: string
  selected: string[]
  portion: Portion
  onToggle: (name: string) => void
  onPortionChange: (portion: Portion) => void
  onSearch: () => void
  // 주식을 고르지 않으면 portion 없음
  onSave: (portion?: Portion) => void
  onClose: () => void
}

// Figma F-12 사진 찾은 결과(MEAL-03). 후보만 보여 주고 고른 것만 저장, % 표시 없음
function PhotoResultScreen({
  meal,
  photoUrl,
  chips,
  topCandidate,
  selected,
  portion,
  onToggle,
  onPortionChange,
  onSearch,
  onSave,
  onClose,
}: PhotoResultScreenProps) {
  const navigate = useNavigate()
  const meals = useGlucoseStore((state) => state.meals)
  const foods = useFoods()
  const [sourceItem, setSourceItem] = useState<NutritionItem | null>(null)
  const closeSource = useCallback(() => setSourceItem(null), [])

  // 양은 주식만 받음. 반찬은 이름만 기록
  const staple = findStaple(selected, foods)
  const nutritionItems: NutritionItem[] = selected
    .map((name) => findFood(name, foods))
    .filter((food) => food?.nutrition !== undefined)
    .map((food) => ({ food: food!, portion: food === staple ? portion : undefined }))
  const pastMeals = meals.filter((item) => item.id !== meal.id)
  const countEaten = (name: string) => pastMeals.filter((item) => item.foods?.includes(name)).length
  const historyFood = [...(staple ? [staple.name] : []), ...selected].find(
    (name) => countEaten(name) > 0,
  )

  return (
    <>
      <PhotoScreen
        title="식사 내용"
        onBack={onClose}
        footer={
          <button
            type="button"
            disabled={selected.length === 0}
            className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key w-full py-4 text-base leading-snug font-bold text-white"
            onClick={() => onSave(staple ? portion : undefined)}
          >
            확인한 것만 저장
          </button>
        }
      >
        <div className="rounded-banner relative h-55 w-full shrink-0 overflow-hidden">
          <img src={photoUrl} alt="찍은 식사 사진" className="size-full object-cover" />
          <span className="text-body-3 absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 py-1.5 pr-3 pl-2.5 leading-snug font-bold text-white">
            <img src={iconSparkleWhite} alt="" width={14} height={14} />
            {topCandidate}
          </span>
        </div>

        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-grey-900 text-lg leading-snug font-bold">이 음식이 맞나요?</h2>
            <span className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pr-2.5 pl-2 text-xs leading-snug font-bold text-blue-700">
              <img src={iconSparkleBlue} alt="" width={14} height={14} />
              AI 후보
            </span>
          </div>
          <p className="text-t7 text-grey-600">
            AI가 찾은 이름은 틀릴 수 있어요. 맞는 걸 골라 주세요.
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map((name) => (
              <Pill
                key={name}
                label={name}
                selected={selected.includes(name)}
                onClick={() => onToggle(name)}
              />
            ))}
            <button
              type="button"
              className="border-grey-200 text-grey-800 flex items-center gap-1 rounded-full border bg-white px-3.5 py-2 text-sm leading-snug font-medium"
              onClick={onSearch}
            >
              <img src={iconSearch} alt="" width={14} height={14} />
              직접 검색
            </button>
          </div>
          {historyFood && (
            <button
              type="button"
              className="text-t7 text-grey-600 self-start font-medium"
              onClick={() => navigate(foodHistoryPath(historyFood, meal.id))}
            >
              {historyFood} 먹은 날 {countEaten(historyFood)}번 · 지난 기록 보기 ›
            </button>
          )}
        </section>

        {staple && (
          <section className="flex flex-col gap-2.5">
            <h2 className="text-t6 text-grey-900 leading-snug font-bold">
              {selected.length > 1 ? `${staple.name} 양` : '양'}
            </h2>
            <div className="flex gap-2">
              {PORTIONS.map((item) => (
                <Pill
                  key={item}
                  label={formatPortion(item, staple.unit)}
                  selected={item === portion}
                  className="flex-1"
                  onClick={() => onPortionChange(item)}
                />
              ))}
            </div>
          </section>
        )}

        {nutritionItems.length > 0 && (
          <NutritionCard items={nutritionItems} onShowSource={setSourceItem} />
        )}
      </PhotoScreen>

      {sourceItem && <NutritionSourceSheet item={sourceItem} onClose={closeSource} />}
    </>
  )
}

export default PhotoResultScreen
