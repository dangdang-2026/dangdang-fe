import { useState } from 'react'
import iconClose from '@/assets/icons/close.svg'
import iconPrivate from '@/assets/icons/private.svg'
import { useFoods } from '@/hooks/useFoods'
import type { MyFood, Portion } from '@/types/glucose'
import { formatPortion } from '@/utils/meal'

const PORTIONS: Portion[] = ['half', 'one', 'one-half']
const SIMILAR_LIMIT = 3
const MY_FOOD_UNIT = '인분'

type MyFoodFormProps = {
  initialName: string
  onBack: () => void
  onAdd: (food: MyFood) => void
}

// 이름에 겹치는 글자가 많은 음식 순
function useSimilarFoods(name: string) {
  const foods = useFoods()
  const letters = new Set(name.replace(/\s/g, ''))
  return foods
    .filter((food) => food.name !== name)
    .map((food) => ({
      name: food.name,
      score: [...new Set(food.name)].filter((char) => letters.has(char)).length,
    }))
    .filter((food) => food.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, SIMILAR_LIMIT)
    .map((food) => food.name)
}

const chipClass = (selected: boolean) =>
  `rounded-full border-2 px-3.5 py-2 text-sm leading-normal ${
    selected
      ? 'bg-primary border-primary text-grey-900 font-bold'
      : 'border-grey-200 text-grey-800 bg-white font-medium'
  }`

// Figma F-08 내 음식 추가. 식품 DB에 없는 음식을 이름·비슷한 음식·자주 먹는 양으로 저장
function MyFoodForm({ initialName, onBack, onAdd }: MyFoodFormProps) {
  const [name, setName] = useState(initialName)
  const [similarTo, setSimilarTo] = useState<string>()
  const [portion, setPortion] = useState<Portion>('one')
  const similarFoods = useSimilarFoods(name.trim())
  const trimmed = name.trim()

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">내 음식 추가</h2>
        <button type="button" aria-label="검색으로 돌아가기" onClick={onBack}>
          <img src={iconClose} alt="" width={22} height={22} />
        </button>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-body-3 text-grey-600">음식 이름</span>
        <input
          type="text"
          value={name}
          className="bg-grey-50 text-t6 text-grey-900 rounded-key px-3.5 py-3 font-medium outline-none"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      {similarFoods.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5">
            <span className="text-body-3 text-grey-600">비슷한 음식</span>
            <span className="text-grey-400 text-xs font-medium">선택</span>
          </p>
          <p className="text-grey-500 text-t7">
            고르면 영양 참고값을 이 음식 기준으로 보여 드려요.
          </p>
          <div className="flex flex-wrap gap-2">
            {similarFoods.map((food) => (
              <button
                key={food}
                type="button"
                aria-pressed={food === similarTo}
                className={chipClass(food === similarTo)}
                onClick={() => setSimilarTo(food === similarTo ? undefined : food)}
              >
                {food}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-body-3 text-grey-600">자주 먹는 양</span>
        <div className="flex gap-2">
          {PORTIONS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === portion}
              className={`flex-1 ${chipClass(item === portion)}`}
              onClick={() => setPortion(item)}
            >
              {formatPortion(item, MY_FOOD_UNIT)}
            </button>
          ))}
        </div>
      </div>

      <p className="bg-grey-50 flex gap-2 rounded-xl px-3.5 py-3">
        <img src={iconPrivate} alt="" width={18} height={18} />
        <span className="text-grey-700 text-t7 flex-1 leading-relaxed">
          내 음식은 나만 볼 수 있어요.
        </span>
      </p>

      <button
        type="button"
        disabled={!trimmed}
        className="disabled:bg-grey-100 disabled:text-grey-400 bg-primary text-grey-900 rounded-key py-4 text-base leading-normal font-bold"
        onClick={() => onAdd({ name: trimmed, unit: MY_FOOD_UNIT, similarTo, portion })}
      >
        추가하고 기록하기
      </button>
    </>
  )
}

export default MyFoodForm
