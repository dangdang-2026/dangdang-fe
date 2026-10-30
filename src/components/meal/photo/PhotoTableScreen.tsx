import { useState } from 'react'
import iconCheck from '@/assets/icons/check-dark.svg'
import iconChevron from '@/assets/icons/legal/version-chev.svg'
import iconPlus from '@/assets/icons/meal/plus.svg'
import iconSparkleBlue from '@/assets/icons/meal/sparkle-blue.svg'
import BottomSheet from '@/components/common/BottomSheet'
import PhotoScreen from '@/components/meal/photo/PhotoScreen'
import { useFoods } from '@/hooks/useFoods'
import type { Portion } from '@/types/glucose'
import { findStaple, formatPortion } from '@/utils/meal'

const PORTIONS: Portion[] = ['half', 'one', 'one-half']

// 한상에서 찾은 음식 한 줄. 이름은 고칠 수 있음
export type TableItem = {
  id: string
  name: string
  checked: boolean
  needsCheck: boolean
  point?: { x: number; y: number }
}

type PhotoTableScreenProps = {
  photoUrl: string
  items: TableItem[]
  portion: Portion
  onToggle: (id: string) => void
  onPortionChange: (portion: Portion) => void
  // 이름이 틀렸거나 확인 필요인 음식 고치기
  onFix: (id: string) => void
  onAddMissing: () => void
  // 주식을 고르지 않으면 portion 없음
  onSave: (portion?: Portion) => void
  onClose: () => void
}

// Figma F-13 사진 찾은 결과 · 한상(MEAL-03b). 음식별 번호·체크, 애매한 건 체크 안 한 채로
function PhotoTableScreen({
  photoUrl,
  items,
  portion,
  onToggle,
  onPortionChange,
  onFix,
  onAddMissing,
  onSave,
  onClose,
}: PhotoTableScreenProps) {
  const foods = useFoods()
  const [portionSheet, setPortionSheet] = useState(false)
  const checked = items.filter((item) => item.checked)
  // 양은 주식만 받음. 반찬은 이름만 기록
  const staple = findStaple(
    checked.map((item) => item.name),
    foods,
  )
  // 사진 위 번호와 목록 번호를 맞춤
  const numbered = items.map((item, index) => ({ ...item, number: index + 1 }))

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
            onClick={() => onSave(staple ? portion : undefined)}
          >
            {checked.length > 0 ? `고른 ${checked.length}개 저장` : '음식을 골라 주세요'}
          </button>
        }
      >
        <div className="rounded-banner relative h-60 w-full shrink-0 overflow-hidden">
          <img src={photoUrl} alt="찍은 식사 사진" className="size-full object-cover" />
          {numbered
            .filter((item) => item.point)
            .map((item) => (
              <span
                key={item.id}
                aria-hidden
                className="bg-primary text-body-3 text-grey-900 absolute flex size-6.5 -translate-1/2 items-center justify-center rounded-full border-2 border-white leading-none font-bold"
                style={{ left: `${item.point!.x * 100}%`, top: `${item.point!.y * 100}%` }}
              >
                {item.number}
              </span>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-grey-900 text-lg leading-snug font-bold">여러 음식이 보여요</h2>
          <span className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pr-2.5 pl-2 text-xs leading-snug font-bold text-blue-700">
            <img src={iconSparkleBlue} alt="" width={14} height={14} />
            AI 후보 {items.length}개
          </span>
        </div>

        <ul className="border-grey-200 rounded-key overflow-hidden border">
          {numbered.map((item) => {
            const isStaple = item.checked && item.name === staple?.name
            return (
              <li
                key={item.id}
                className="border-grey-100 flex items-center gap-2.5 border-t px-3.5 py-3 first:border-t-0"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.checked}
                  aria-label={`${item.name} 고르기`}
                  onClick={() => onToggle(item.id)}
                >
                  {item.checked ? (
                    <span className="bg-primary flex size-5.5 items-center justify-center rounded-md">
                      <img src={iconCheck} alt="" width={14} height={14} />
                    </span>
                  ) : (
                    <span className="border-grey-300 block size-5.5 rounded-md border-2" />
                  )}
                </button>
                <span className="bg-grey-100 text-caption text-grey-700 flex size-5 shrink-0 items-center justify-center rounded-full leading-none font-bold">
                  {item.number}
                </span>
                {/* 이름을 누르면 직접 검색으로 고치기 */}
                <button
                  type="button"
                  className={`text-t6 min-w-0 flex-1 text-left leading-snug ${
                    item.needsCheck ? 'text-grey-600' : 'text-grey-900 font-medium'
                  }`}
                  onClick={() => onFix(item.id)}
                >
                  {item.needsCheck ? `${item.name}?` : item.name}
                </button>
                {(item.needsCheck || isStaple) && (
                  <button
                    type="button"
                    className="bg-grey-50 text-body-3 text-grey-700 flex shrink-0 items-center gap-0.5 rounded-full py-1 pr-2 pl-2.5 leading-snug"
                    onClick={() => (item.needsCheck ? onFix(item.id) : setPortionSheet(true))}
                  >
                    {item.needsCheck ? '확인 필요' : formatPortion(portion, staple!.unit)}
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
          onClick={onAddMissing}
        >
          <img src={iconPlus} alt="" width={18} height={18} />
          빠진 음식 추가
        </button>
      </PhotoScreen>

      {portionSheet && staple && (
        <BottomSheet label={`${staple.name} 양`} onClose={() => setPortionSheet(false)}>
          <h2 className="text-t4 text-grey-900">{staple.name} 양</h2>
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
                  onClick={() => {
                    onPortionChange(item)
                    setPortionSheet(false)
                  }}
                >
                  {formatPortion(item, staple.unit)}
                </button>
              )
            })}
          </div>
        </BottomSheet>
      )}
    </>
  )
}

export default PhotoTableScreen
