import { useState } from 'react'
import iconClear from '@/assets/icons/meal/clear.svg'
import iconArrow from '@/assets/icons/postpartum/chevron-md.svg'
import iconPlus from '@/assets/icons/postpartum/plus.svg'
import iconSearch from '@/assets/icons/search.svg'
import PhotoScreen from '@/components/meal/photo/PhotoScreen'
import { useFoods } from '@/hooks/useFoods'

const SEARCH_LIMIT = 8

type PhotoSearchScreenProps = {
  photoUrl: string
  // 고치는 음식의 AI 후보. 빠진 음식을 추가할 땐 없음
  topCandidate?: string
  onPick: (name: string) => void
  onAddMyFood: (name: string) => void
  onBack: () => void
}

// 검색어와 겹치는 부분만 노란 글자
function HighlightedName({ name, keyword }: { name: string; keyword: string }) {
  const start = name.indexOf(keyword)
  return (
    <>
      {name.slice(0, start)}
      <span className="text-yellow-600">{keyword}</span>
      {name.slice(start + keyword.length)}
    </>
  )
}

// Figma F-14 AI 후보가 틀렸을 때·빠진 음식 직접 검색. 없으면 내 음식으로 추가
function PhotoSearchScreen({
  photoUrl,
  topCandidate,
  onPick,
  onAddMyFood,
  onBack,
}: PhotoSearchScreenProps) {
  const foods = useFoods()
  const [query, setQuery] = useState('')
  const keyword = query.trim()
  const results = keyword
    ? foods.filter((food) => food.name.includes(keyword)).slice(0, SEARCH_LIMIT)
    : []

  return (
    <PhotoScreen title="음식 검색" back onBack={onBack}>
      <div className="flex items-center gap-3">
        <img
          src={photoUrl}
          alt="찍은 식사 사진"
          className="size-14 shrink-0 rounded-xl object-cover"
        />
        <div className="flex min-w-0 flex-col gap-0.5 leading-snug">
          {topCandidate && (
            <p className="text-grey-600 text-sm font-medium">AI 후보: {topCandidate}</p>
          )}
          <p className="text-grey-900 text-base font-bold">
            {topCandidate ? '맞는 음식을 찾아 주세요' : '빠진 음식을 찾아 주세요'}
          </p>
        </div>
      </div>

      <div className="border-primary rounded-key flex items-center gap-2 border-2 px-3.5 py-3">
        <img src={iconSearch} alt="" width={18} height={18} />
        <input
          autoFocus
          type="search"
          aria-label="음식 이름 검색"
          placeholder="음식 이름을 적어 주세요"
          value={query}
          className="text-t6 text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 bg-transparent leading-snug font-medium outline-none [&::-webkit-search-cancel-button]:hidden"
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}>
            <img src={iconClear} alt="" width={18} height={18} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <section className="flex flex-col">
          <h2 className="text-body-3 text-grey-600 leading-snug">식품 DB 검색 결과</h2>
          <ul>
            {results.map((food) => (
              <li key={food.name} className="border-grey-100 border-b">
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-3.5 text-left"
                  onClick={() => onPick(food.name)}
                >
                  <span className="text-t6 text-grey-900 leading-snug font-medium">
                    <HighlightedName name={food.name} keyword={keyword} />
                  </span>
                  <span className="text-t7 text-grey-600 leading-snug">1인분 기준</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {keyword && (
        <button
          type="button"
          className="bg-grey-50 rounded-key flex w-full items-center gap-2.5 px-4 py-3.5 text-left"
          onClick={() => onAddMyFood(keyword)}
        >
          <img src={iconPlus} alt="" width={20} height={20} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
            <span className="text-t7 text-grey-700 leading-snug">찾는 음식이 없나요?</span>
            <span className="text-t6 text-grey-900 leading-snug font-bold">
              ‘{keyword}’ 내 음식으로 추가
            </span>
          </span>
          <img src={iconArrow} alt="" width={16} height={16} />
        </button>
      )}
    </PhotoScreen>
  )
}

export default PhotoSearchScreen
