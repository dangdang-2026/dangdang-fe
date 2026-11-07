import { useState } from 'react'
import iconClose from '@/assets/icons/close.svg'
import iconPrivate from '@/assets/icons/private.svg'
import iconSearchSm from '@/assets/icons/search-sm.svg'
import { useFoods } from '@/hooks/useFoods'
import type { MyFood, Portion } from '@/types/glucose'
import { findFood, formatPortion, looksLikeStaple } from '@/utils/meal'

const PORTIONS: Portion[] = ['half', 'one', 'one-half']
const SIMILAR_LIMIT = 3
const SEARCH_LIMIT = 6
const MY_FOOD_UNIT = '인분'

type MyFoodFormProps = {
  initialName: string
  // 있으면 고치기(M-17), 없으면 추가(F-08)
  editing?: MyFood
  onBack: () => void
  onAdd: (food: MyFood) => void
  onDelete?: () => void
}

// 이름에 겹치는 글자가 많은 음식 순. 고치는 음식 자신은 뺌
function useSimilarFoods(name: string, exclude?: string) {
  const foods = useFoods()
  const letters = new Set(name.replace(/\s/g, ''))
  return foods
    .filter((food) => food.name !== name && food.name !== exclude)
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

// Figma F-08 내 음식 추가·M-17 고치기. 식품 DB에 없는 음식을 이름·비슷한 음식·자주 먹는 양으로 저장
function MyFoodForm({ initialName, editing, onBack, onAdd, onDelete }: MyFoodFormProps) {
  const [name, setName] = useState(initialName)
  const [similarTo, setSimilarTo] = useState(editing?.similarTo)
  const [portion, setPortion] = useState<Portion>(editing?.portion ?? 'one')
  // 추천에 없는 비슷한 음식을 직접 찾기
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const foods = useFoods()
  const suggested = useSimilarFoods(name.trim(), editing?.name)
  // 전에 고른 비슷한 음식은 추천에 없어도 보여 줌
  const similarFoods =
    similarTo && !suggested.includes(similarTo) ? [similarTo, ...suggested] : suggested
  const trimmed = name.trim()
  // 비슷한 음식을 고르면 그 음식 기준, 아니면 이름(밥·면 등)으로 주식인지 판단
  const similar = similarTo ? findFood(similarTo, foods) : undefined
  const staple = similar ? !!similar.staple : looksLikeStaple(trimmed)
  const unit = similar?.unit ?? MY_FOOD_UNIT
  const keyword = query.trim()
  const searchResults = keyword
    ? foods
        .filter((food) => food.name !== trimmed && food.name !== editing?.name)
        .filter((food) => food.name.includes(keyword))
        .slice(0, SEARCH_LIMIT)
    : []

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">{editing ? '내 음식 고치기' : '내 음식 추가'}</h2>
        <button type="button" aria-label={editing ? '닫기' : '검색으로 돌아가기'} onClick={onBack}>
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

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5">
          <span className="text-body-3 text-grey-600">비슷한 음식</span>
          <span className="text-grey-400 text-xs font-medium">선택</span>
        </p>
        <p className="text-grey-500 text-t7">고르면 영양 참고값을 이 음식 기준으로 보여 드려요.</p>
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
          <button
            type="button"
            aria-pressed={searching}
            className="bg-grey-100 text-grey-700 flex items-center gap-1 rounded-full border-2 border-transparent px-3.5 py-2 text-sm leading-normal font-bold"
            onClick={() => setSearching((prev) => !prev)}
          >
            <img src={iconSearchSm} alt="" width={14} height={14} />
            직접 검색
          </button>
        </div>
        {searching && (
          <>
            <input
              type="search"
              autoFocus
              aria-label="비슷한 음식 검색"
              placeholder="비슷한 음식 이름"
              value={query}
              className="bg-grey-50 text-t6 text-grey-900 placeholder:text-grey-400 rounded-key px-3.5 py-3 font-medium outline-none"
              onChange={(event) => setQuery(event.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchResults.map((food) => (
                  <button
                    key={food.name}
                    type="button"
                    className={chipClass(food.name === similarTo)}
                    onClick={() => {
                      setSimilarTo(food.name)
                      setSearching(false)
                      setQuery('')
                    }}
                  >
                    {food.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Figma M-17 반찬도 자주 먹는 양을 받음 */}
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
              {formatPortion(item, unit)}
            </button>
          ))}
        </div>
      </div>

      <p className="bg-grey-50 flex gap-2 rounded-xl px-3.5 py-3">
        <img src={iconPrivate} alt="" width={18} height={18} className="self-start" />
        <span className="text-grey-700 text-t7 flex-1 leading-relaxed">
          {editing
            ? '고쳐도 이미 남긴 끼니 기록은 그대로예요. 다음 기록부터 바뀐 내용으로 보여요.'
            : '내 음식은 나만 볼 수 있어요. 마이 › 내 음식에서 고치거나 지울 수 있어요.'}
        </span>
      </p>

      <button
        type="button"
        disabled={!trimmed}
        className="disabled:bg-grey-100 disabled:text-grey-400 bg-primary rounded-key py-4 text-base leading-normal font-bold text-white"
        onClick={() =>
          onAdd({
            name: trimmed,
            unit,
            similarTo,
            staple,
            // 영양 참고값은 비슷한 음식 기준
            nutrition: similar?.nutrition,
            portion,
          })
        }
      >
        {editing ? '저장' : '추가하고 기록하기'}
      </button>
      {onDelete && (
        <button
          type="button"
          className="text-grey-600 py-1 text-sm leading-normal font-medium"
          onClick={onDelete}
        >
          이 음식 지우기
        </button>
      )}
    </>
  )
}

export default MyFoodForm
