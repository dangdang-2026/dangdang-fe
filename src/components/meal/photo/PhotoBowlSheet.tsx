import { useState } from 'react'
import iconCheck from '@/assets/icons/check-dark.svg'
import iconSearch from '@/assets/icons/search-sm.svg'
import BottomSheet from '@/components/common/BottomSheet'
import PhotoBowlHeader from '@/components/meal/photo/PhotoBowlHeader'
import { useFoods } from '@/hooks/useFoods'
import type { TableItem } from '@/types/foodPhoto'
import type { Portion } from '@/types/glucose'
import { findFood, formatPortion, getDirectionParticle, getPortionFactor } from '@/utils/meal'

const PORTIONS: Portion[] = ['half', 'one', 'one-half']

type PhotoBowlSheetProps = {
  photoUrl: string
  item: TableItem
  number: number
  onPick: (name: string, portion: Portion) => void
  onSearch: () => void
  onClose: () => void
}

// AI 표시. Figma F-13 · F-13b 「✦AI」
export function AiMark() {
  return <span className="text-caption font-bold text-yellow-600">✦AI</span>
}

// Figma F-13b 한상 · 그릇 하나 확인: 그 그릇의 AI 후보 + 직접 검색 + 양
function PhotoBowlSheet({
  photoUrl,
  item,
  number,
  onPick,
  onSearch,
  onClose,
}: PhotoBowlSheetProps) {
  const foods = useFoods()
  const [name, setName] = useState(item.name)
  const [portion, setPortion] = useState(item.portion)
  // 직접 검색으로 고친 이름도 칩으로
  const chips =
    item.name && !item.candidates.includes(item.name)
      ? [item.name, ...item.candidates]
      : item.candidates
  const food = findFood(name, foods)
  const unit = food?.unit ?? '인분'
  const servingGrams = food?.nutrition?.grams
  const amount = formatPortion(portion, unit)

  return (
    <BottomSheet label="이 음식이 맞나요?" onClose={onClose}>
      <PhotoBowlHeader
        photoUrl={photoUrl}
        box={item.box}
        number={number}
        title="이 음식이 맞나요?"
      />
      <p className="text-grey-600 text-sm leading-normal">AI가 찾은 이름은 틀릴 수 있어요.</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const selected = chip === name
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={selected}
              className={`flex h-10 items-center gap-1 rounded-full border-2 px-3.5 text-sm leading-none ${
                selected
                  ? 'border-primary text-grey-900 bg-yellow-50 font-bold'
                  : 'border-grey-200 text-grey-800 bg-white font-medium'
              }`}
              onClick={() => setName(chip)}
            >
              {selected && <img src={iconCheck} alt="" width={14} height={14} />}
              {chip}
              {chip === item.candidates[0] && <AiMark />}
            </button>
          )
        })}
        <button
          type="button"
          className="bg-grey-100 text-grey-800 flex h-10 items-center gap-1 rounded-full px-3.5 text-sm leading-none font-medium"
          onClick={onSearch}
        >
          <img src={iconSearch} alt="" width={14} height={14} />
          직접 검색
        </button>
      </div>

      <section className="flex flex-col gap-2.5">
        <h3 className="text-grey-900 text-base leading-snug font-bold">양</h3>
        <div className="flex gap-2">
          {PORTIONS.map((option) => {
            const selected = option === portion
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                className={`rounded-key flex flex-1 flex-col items-center gap-0.5 border-2 py-2.5 ${
                  selected ? 'border-primary bg-yellow-50' : 'border-grey-200 bg-white'
                }`}
                onClick={() => setPortion(option)}
              >
                <span className="text-t6 text-grey-900 font-bold">
                  {formatPortion(option, unit)}
                </span>
                {servingGrams && (
                  <span className="text-body-3 text-grey-600">
                    약 {Math.round(servingGrams * getPortionFactor(option))}g
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <button
        type="button"
        disabled={!name}
        className="text-subtitle-1 bg-primary disabled:bg-grey-200 disabled:text-grey-500 h-14 rounded-xl leading-none text-white"
        onClick={() => onPick(name, portion)}
      >
        {name ? `${name} ${amount}${getDirectionParticle(amount)} 바꾸기` : '음식을 골라 주세요'}
      </button>
    </BottomSheet>
  )
}

export default PhotoBowlSheet
