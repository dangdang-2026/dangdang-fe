import { useState } from 'react'
import iconCheck from '@/assets/icons/check-dark.svg'
import iconChevron from '@/assets/icons/legal/version-chev.svg'
import iconPlus from '@/assets/icons/meal/plus.svg'
import PhotoBowlSheet, { AiMark } from '@/components/meal/photo/PhotoBowlSheet'
import PhotoScreen from '@/components/meal/photo/PhotoScreen'
import PhotoUnknownBowlSheet from '@/components/meal/photo/PhotoUnknownBowlSheet'
import { useFoods } from '@/hooks/useFoods'
import type { TableItem } from '@/types/foodPhoto'
import type { Portion } from '@/types/glucose'
import { findFood, findStaple, formatPortion } from '@/utils/meal'

// 이름을 못 찾은 그릇
const UNKNOWN_NAME = '알 수 없는 음식'

type PhotoTableScreenProps = {
  photoUrl: string
  items: TableItem[]
  onToggle: (id: string) => void
  // 확인 시트에서 고른 이름 · 양
  onChange: (id: string, name: string, portion?: Portion) => void
  // 직접 검색으로 고치기. null이면 빠진 음식 추가
  onSearch: (id: string | null) => void
  onRemove: (id: string) => void
  // 주식의 양. 주식을 고르지 않으면 없음
  onSave: (portion?: Portion) => void
  onClose: () => void
}

// Figma F-13 사진 찾은 결과 · 한상(MEAL-03b). 줄이나 사진 번호를 누르면 F-13b, 알아보기 어려운 그릇은 F-13c
function PhotoTableScreen({
  photoUrl,
  items,
  onToggle,
  onChange,
  onSearch,
  onRemove,
  onSave,
  onClose,
}: PhotoTableScreenProps) {
  const foods = useFoods()
  // 확인 시트를 연 줄
  const [openId, setOpenId] = useState<string | null>(null)
  const checked = items.filter((item) => item.checked)
  // 끼니의 대표 양은 주식 기준
  const staple = findStaple(
    checked.map((item) => item.name),
    foods,
  )
  const stapleItem = checked.find((item) => item.name === staple?.name)
  const unitOf = (name: string) => findFood(name, foods)?.unit ?? '인분'
  // 사진 위 번호와 목록 번호를 맞춤
  const numbered = items.map((item, index) => ({ ...item, number: index + 1 }))
  const openItem = numbered.find((item) => item.id === openId)
  const aiCount = items.filter((item) => item.fromAi).length
  const close = () => setOpenId(null)

  return (
    <>
      <PhotoScreen
        title="식사 내용"
        onBack={onClose}
        footer={
          <button
            type="button"
            disabled={checked.length === 0}
            className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key w-full py-4 text-base leading-snug font-bold text-white"
            onClick={() => onSave(stapleItem?.portion)}
          >
            {checked.length > 0 ? `고른 ${checked.length}가지 저장` : '음식을 골라 주세요'}
          </button>
        }
      >
        <div className="rounded-banner relative h-60 w-full shrink-0 overflow-hidden">
          <img src={photoUrl} alt="찍은 식사 사진" className="size-full object-cover" />
          {numbered
            .filter((item) => item.point)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`${item.number}번 그릇 확인`}
                className="bg-primary text-body-3 text-grey-900 absolute flex size-6.5 -translate-1/2 items-center justify-center rounded-full border-2 border-white leading-none font-bold"
                style={{ left: `${item.point!.x * 100}%`, top: `${item.point!.y * 100}%` }}
                onClick={() => setOpenId(item.id)}
              >
                {item.number}
              </button>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-grey-900 text-lg leading-snug font-bold">여러 음식이 보여요</h2>
          {aiCount > 0 && (
            <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs leading-snug font-bold text-yellow-600">
              AI가 찾은 {aiCount}가지
            </span>
          )}
        </div>

        <ul className="border-grey-200 rounded-key overflow-hidden border">
          {numbered.map((item) => {
            const unknown = !item.name
            const label = unknown ? UNKNOWN_NAME : item.name
            return (
              <li
                key={item.id}
                className="border-grey-100 flex items-center gap-2.5 border-t px-3.5 py-3 first:border-t-0"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.checked}
                  aria-label={`${label} 고르기`}
                  // 이름을 모르면 고르기 전에 무슨 음식인지부터
                  onClick={() => (unknown ? setOpenId(item.id) : onToggle(item.id))}
                >
                  {item.checked ? (
                    <span className="bg-primary flex size-5.5 items-center justify-center rounded-md">
                      <img src={iconCheck} alt="" width={14} height={14} />
                    </span>
                  ) : (
                    <span className="border-grey-300 block size-5.5 rounded-md border-2" />
                  )}
                </button>
                <span className="bg-grey-100 text-grey-700 flex size-5 shrink-0 items-center justify-center rounded-full text-xs leading-none font-bold">
                  {item.number}
                </span>
                <button
                  type="button"
                  className={`text-t6 flex min-w-0 flex-1 items-center gap-1 text-left leading-snug ${
                    item.needsCheck ? 'text-grey-600' : 'text-grey-900 font-medium'
                  }`}
                  onClick={() => setOpenId(item.id)}
                >
                  <span className="truncate">
                    {item.needsCheck && !unknown ? `${label}?` : label}
                  </span>
                  {item.fromAi && !item.needsCheck && item.candidates.includes(item.name) && (
                    <AiMark />
                  )}
                </button>
                {(item.needsCheck || item.checked) && (
                  <button
                    type="button"
                    className="bg-grey-50 text-body-3 text-grey-700 flex shrink-0 items-center gap-0.5 rounded-full py-1 pr-2 pl-2.5 leading-snug"
                    onClick={() => setOpenId(item.id)}
                  >
                    {item.needsCheck ? '확인 필요' : formatPortion(item.portion, unitOf(item.name))}
                    <img src={iconChevron} alt="" width={12} height={12} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          className="text-grey-600 flex items-center gap-1.5 self-start text-sm leading-snug font-medium"
          onClick={() => onSearch(null)}
        >
          <img src={iconPlus} alt="" width={18} height={18} />
          빠진 음식 추가
        </button>
      </PhotoScreen>

      {openItem &&
        (openItem.name ? (
          <PhotoBowlSheet
            key={openItem.id}
            photoUrl={photoUrl}
            item={openItem}
            number={openItem.number}
            onPick={(name, portion) => {
              onChange(openItem.id, name, portion)
              close()
            }}
            onSearch={() => {
              close()
              onSearch(openItem.id)
            }}
            onClose={close}
          />
        ) : (
          <PhotoUnknownBowlSheet
            key={openItem.id}
            photoUrl={photoUrl}
            item={openItem}
            number={openItem.number}
            onPick={(name) => {
              onChange(openItem.id, name)
              close()
            }}
            onSearch={() => {
              close()
              onSearch(openItem.id)
            }}
            onRemove={() => {
              close()
              onRemove(openItem.id)
            }}
            onClose={close}
          />
        ))}
    </>
  )
}

export default PhotoTableScreen
