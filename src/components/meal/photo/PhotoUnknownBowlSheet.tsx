import { useState } from 'react'
import iconCheck from '@/assets/icons/check-dark.svg'
import iconSearch from '@/assets/icons/search-sm.svg'
import BottomSheet from '@/components/common/BottomSheet'
import PhotoBowlHeader from '@/components/meal/photo/PhotoBowlHeader'
import type { TableItem } from '@/types/foodPhoto'
import { getDirectionParticle } from '@/utils/meal'

type PhotoUnknownBowlSheetProps = {
  photoUrl: string
  item: TableItem
  number: number
  onPick: (name: string) => void
  onSearch: () => void
  onRemove: () => void
  onClose: () => void
}

// Figma F-13c 한상 · 알아보기 어려운 그릇: 짐작 이름(있으면) + 직접 검색, 아니면 이 그릇은 빼기
function PhotoUnknownBowlSheet({
  photoUrl,
  item,
  number,
  onPick,
  onSearch,
  onRemove,
  onClose,
}: PhotoUnknownBowlSheetProps) {
  // 짐작 이름은 서버가 줄 때만. 지금은 이름을 못 찾은 그릇에 후보가 없어 직접 검색만
  const guesses = item.candidates
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <BottomSheet label="어떤 음식인가요?" onClose={onClose}>
      <PhotoBowlHeader
        photoUrl={photoUrl}
        box={item.box}
        number={number}
        title="어떤 음식인가요?"
      />
      <p className="text-grey-600 text-sm leading-normal">
        AI가 잘 알아보지 못했어요.
        <br />
        {guesses.length > 0
          ? '짐작한 이름이 맞으면 고르고, 아니면 찾아 주세요.'
          : '이름으로 찾아 주세요.'}
      </p>
      <div className="flex flex-wrap gap-2">
        {guesses.map((guess) => {
          const selected = guess === picked
          return (
            <button
              key={guess}
              type="button"
              aria-pressed={selected}
              className={`flex h-10 items-center gap-1 rounded-full border-2 px-3.5 text-sm leading-none ${
                selected
                  ? 'border-primary text-grey-900 bg-yellow-50 font-bold'
                  : 'border-grey-200 text-grey-800 bg-white font-medium'
              }`}
              onClick={() => setPicked(guess)}
            >
              {selected && <img src={iconCheck} alt="" width={14} height={14} />}
              {guess}?
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
      <button
        type="button"
        disabled={!picked}
        className="text-subtitle-1 bg-primary disabled:bg-grey-200 disabled:text-grey-500 h-14 rounded-xl leading-none text-white"
        onClick={() => picked && onPick(picked)}
      >
        {picked ? `${picked}${getDirectionParticle(picked)} 고르기` : '음식을 골라 주세요'}
      </button>
      <button
        type="button"
        className="text-grey-600 self-center text-sm leading-normal font-medium underline"
        onClick={onRemove}
      >
        이 그릇은 빼기
      </button>
    </BottomSheet>
  )
}

export default PhotoUnknownBowlSheet
