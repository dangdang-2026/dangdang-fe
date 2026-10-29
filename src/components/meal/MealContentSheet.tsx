import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconClear from '@/assets/icons/clear.svg'
import iconPlusMd from '@/assets/icons/plus-md.svg'
import iconSearch from '@/assets/icons/search.svg'
import iconSearchSm from '@/assets/icons/search-sm.svg'
import BottomSheet from '@/components/common/BottomSheet'
import FoodChip from '@/components/meal/FoodChip'
import MyFoodForm from '@/components/meal/MyFoodForm'
import NutritionCard from '@/components/meal/NutritionCard'
import NutritionSourceSheet from '@/components/meal/NutritionSourceSheet'
import { MEAL_LABEL } from '@/constants/glucose'
import { foodHistoryPath } from '@/constants/routes'
import { useFoods } from '@/hooks/useFoods'
import { DEFAULT_RECENT_FOODS } from '@/mocks/foods'
import { useFoodStore } from '@/stores/useFoodStore'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import type { Meal, MyFood, Portion } from '@/types/glucose'
import { formatTime } from '@/utils/date'
import {
  findFood,
  findStaple,
  formatPortion,
  getRecentFoods,
  type NutritionItem,
} from '@/utils/meal'

const PORTIONS: Portion[] = ['half', 'one', 'one-half']
const RECENT_LIMIT = 3
const SEARCH_LIMIT = 8

type MealContentSheetProps = {
  meal: Meal
  // 이미 적은 식사를 고칠 때
  editing?: boolean
  onClose: () => void
  // 주식을 고르지 않으면 portion 없음
  onSaved: (foods: string[], portion?: Portion) => void
}

// Figma F-01·F-07·D-09 식사 내용 적기. 최근 음식·이름 검색으로 고르고 양 선택
function MealContentSheet({ meal, editing, onClose, onSaved }: MealContentSheetProps) {
  const navigate = useNavigate()
  const meals = useGlucoseStore((state) => state.meals)
  const foods = useFoods()
  const [selected, setSelected] = useState<string[]>(meal.foods ?? [])
  const [portion, setPortion] = useState<Portion>(meal.portion ?? 'one')
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  // 검색으로 고른 음식도 칩으로 계속 보여 줌
  const [searched, setSearched] = useState<string[]>([])
  // 내 음식 추가 중인 이름
  const [addingName, setAddingName] = useState<string | null>(null)
  const addMyFood = useFoodStore((state) => state.addMyFood)

  const recent = getRecentFoods(
    meals.filter((item) => item.id !== meal.id),
    RECENT_LIMIT,
  )
  const chips = [
    ...new Set([
      ...(meal.foods ?? []),
      // 최근 음식이 모자라면 기본 음식으로 채움
      ...[...new Set([...recent, ...DEFAULT_RECENT_FOODS])].slice(0, RECENT_LIMIT),
      ...searched,
    ]),
  ]
  // 양은 주식(밥·면 등)만 받음. 반찬은 이름만 기록
  const staple = findStaple(selected, foods)
  // 영양 참고값이 있는 고른 음식. 주식은 고른 양, 반찬은 1인분 기준
  const nutritionItems: NutritionItem[] = selected
    .map((name) => findFood(name, foods))
    .filter((food) => food?.nutrition !== undefined)
    .map((food) => ({ food: food!, portion: food === staple ? portion : undefined }))
  // 고른 음식 중 전에 먹은 적 있는 것 하나(주식 먼저). 지난 기록 링크로
  const pastMeals = meals.filter((item) => item.id !== meal.id)
  const countEaten = (name: string) => pastMeals.filter((item) => item.foods?.includes(name)).length
  const historyFood = [...(staple ? [staple.name] : []), ...selected].find(
    (name) => countEaten(name) > 0,
  )
  const [sourceItem, setSourceItem] = useState<NutritionItem | null>(null)
  const closeSource = useCallback(() => setSourceItem(null), [])

  const keyword = query.trim()
  const results = keyword
    ? foods.filter((food) => food.name.includes(keyword)).slice(0, SEARCH_LIMIT)
    : []

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }

  const pickSearched = (name: string) => {
    if (!selected.includes(name)) setSelected((prev) => [...prev, name])
    setSearched((prev) => (prev.includes(name) ? prev : [...prev, name]))
    setQuery('')
    setSearching(false)
  }

  // 내 음식을 추가하면 고른 음식에 더해 바로 저장
  const handleAddMyFood = (food: MyFood) => {
    addMyFood(food)
    // 이미 고른 주식이 있으면 그 양 유지
    const nextPortion = staple ? portion : food.staple ? food.portion : undefined
    onSaved([...new Set([...selected, food.name])], nextPortion)
  }

  const mealLabel = MEAL_LABEL[meal.type]

  if (addingName !== null) {
    return (
      <BottomSheet label="내 음식 추가" onClose={onClose}>
        <MyFoodForm
          initialName={addingName}
          onBack={() => setAddingName(null)}
          onAdd={handleAddMyFood}
        />
      </BottomSheet>
    )
  }

  return (
    <>
      {/* 출처 시트가 떠 있으면 Esc·딤은 출처 시트만 닫음 */}
      <BottomSheet label="식사 내용" onClose={sourceItem ? closeSource : onClose}>
        <div className="flex flex-col gap-1">
          <h2 className="text-t4 text-grey-900">
            {editing ? `${mealLabel} 기록 고치기` : `${mealLabel}에 뭐 드셨어요?`}
          </h2>
          {!searching && (
            <p className="text-t6 text-grey-700">
              {editing
                ? `${formatTime(new Date(meal.startedAt))}에 적은 식사예요`
                : '나중에 적어도 알림은 그대로 와요'}
            </p>
          )}
        </div>

        {searching ? (
          <>
            <div className="border-primary rounded-key flex items-center gap-2 border-2 px-3.5 py-3">
              <img src={iconSearch} alt="" width={18} height={18} />
              <input
                autoFocus
                type="search"
                aria-label="음식 이름 검색"
                placeholder="음식 이름을 적어 주세요"
                value={query}
                className="text-t6 text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 bg-transparent font-medium outline-none [&::-webkit-search-cancel-button]:hidden"
                onChange={(event) => setQuery(event.target.value)}
              />
              {/* 비우기. 이미 비었으면 검색 닫기 */}
              <button
                type="button"
                aria-label={query ? '검색어 지우기' : '검색 닫기'}
                onClick={() => (query ? setQuery('') : setSearching(false))}
              >
                <img src={iconClear} alt="" width={18} height={18} />
              </button>
            </div>

            {results.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {results.map((food) => (
                  <FoodChip
                    key={food.name}
                    name={food.name}
                    selected={selected.includes(food.name)}
                    onClick={() => pickSearched(food.name)}
                  />
                ))}
              </div>
            )}
            {keyword && results.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-5 text-center">
                <p className="text-t6 text-grey-900 font-bold">식품 DB에서 찾지 못했어요</p>
                <p className="text-grey-600 text-sm leading-relaxed">
                  직접 만든 음식이면 내 음식으로 추가해 두세요.
                  <br />
                  다음부터는 바로 고를 수 있어요.
                </p>
                <button
                  type="button"
                  className="border-grey-300 text-grey-800 flex items-center gap-1.5 rounded-full border py-2.5 pr-4.5 pl-4 text-sm leading-normal font-bold"
                  onClick={() => setAddingName(keyword)}
                >
                  <img src={iconPlusMd} alt="" width={16} height={16} />‘{keyword}’ 추가
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-grey-800 text-sm leading-normal font-bold">
              {editing ? '음식' : '최근 먹은 음식'}
            </p>
            <div className="flex flex-wrap gap-2">
              {chips.map((name) => (
                <FoodChip
                  key={name}
                  name={name}
                  selected={selected.includes(name)}
                  onClick={() => toggle(name)}
                />
              ))}
              <button
                type="button"
                className="bg-grey-100 text-grey-700 flex items-center gap-1 rounded-full border-2 border-transparent px-3.5 py-2 text-sm leading-normal font-bold"
                onClick={() => setSearching(true)}
              >
                <img src={iconSearchSm} alt="" width={14} height={14} />
                이름 검색
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

            {/* 주식을 고른 뒤에만 양 표시. 여러 개면 어느 음식 양인지 함께 표시 */}
            {staple && (
              <>
                <p className="text-grey-800 text-sm leading-normal font-bold">
                  {selected.length > 1 ? `${staple.name} 양` : '양'}
                </p>
                <div className="flex gap-2">
                  {PORTIONS.map((item) => {
                    const isSelected = item === portion
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={isSelected}
                        className={`text-t6 rounded-key flex-1 border-2 py-3 font-bold ${
                          isSelected
                            ? 'border-primary text-grey-800 bg-yellow-50'
                            : 'border-grey-200 text-grey-600 bg-white'
                        }`}
                        onClick={() => setPortion(item)}
                      >
                        {formatPortion(item, staple.unit)}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {nutritionItems.length > 0 && (
              <NutritionCard items={nutritionItems} onShowSource={setSourceItem} />
            )}
          </>
        )}

        <button
          type="button"
          disabled={selected.length === 0}
          className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary h-14 rounded-xl leading-none text-white"
          onClick={() => onSaved(selected, staple ? portion : undefined)}
        >
          확인한 것만 저장
        </button>
      </BottomSheet>

      {/* 시트 밖에 둬야 transform 영향 없이 화면 기준으로 뜸 */}
      {sourceItem && <NutritionSourceSheet item={sourceItem} onClose={closeSource} />}
    </>
  )
}

export default MealContentSheet
