import { useState } from 'react'
import { createPortal } from 'react-dom'
import iconArrowDown from '@/assets/icons/arrow-down.svg'
import iconArrowUp from '@/assets/icons/arrow-up.svg'
import iconChevronXs from '@/assets/icons/chevron-xs.svg'
import iconInfoSm from '@/assets/icons/info-sm.svg'
import iconPencilDark from '@/assets/icons/meal/pencil-dark.svg'
import iconPencilDarkSm from '@/assets/icons/meal/pencil-dark-sm.svg'
import iconShield from '@/assets/icons/shield.svg'
import NutritionEditScreen from '@/components/meal/NutritionEditScreen'
import { useFoodStore } from '@/stores/useFoodStore'
import type { NutritionEdit, NutritionEdits } from '@/types/glucose'
import { formatNutritionBasis, scaleNutrition, type NutritionItem } from '@/utils/meal'

type NutritionCardProps = {
  items: NutritionItem[]
  // 음식 이름별 내가 잰 값. 식사를 저장할 때 같이 저장
  edits: NutritionEdits
  onEditsChange: (edits: NutritionEdits) => void
  onShowSource: (item: NutritionItem) => void
}

// 예: 내가 입력한 값 · 250 g · 10/19 고침
function formatEditLabel(edit: NutritionEdit) {
  const editedAt = new Date(edit.editedAt)
  const grams = edit.grams !== undefined ? `${edit.grams} g · ` : ''
  return `내가 입력한 값 · ${grams}${editedAt.getMonth() + 1}/${editedAt.getDate()} 고침`
}

const OUTLINE_BUTTON =
  'border-grey-300 text-t7 text-grey-800 flex items-center gap-1.5 rounded-full border bg-white py-2 pr-3.5 pl-3 font-bold'

// Figma F-01 접힘·F-16 펼침·F-19 내가 입력한 값. 음식마다 따로 보고 끼니 합계는 내지 않음
function NutritionCard({ items, edits, onEditsChange, onShowSource }: NutritionCardProps) {
  const addMyFood = useFoodStore((state) => state.addMyFood)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeName, setActiveName] = useState(items[0]?.food.name)
  const active = items.find((item) => item.food.name === activeName) ?? items[0]
  if (!active?.food.nutrition) return null

  const edit = edits[active.food.name]
  const value = edit ?? scaleNutrition(active.food.nutrition, active.portion)
  const rows = [
    ['탄수화물', `${value.carbs} g`],
    ['당류', `${value.sugar} g`],
    ['단백질', `${value.protein} g`],
    ['지방', `${value.fat} g`],
    ['열량', `${value.kcal} kcal`],
  ]
  const basis = `식약처 기준 · ${formatNutritionBasis(active)}`

  const restore = () => {
    const rest = { ...edits }
    delete rest[active.food.name]
    onEditsChange(rest)
  }

  return (
    <div className="bg-grey-50 flex flex-col items-start gap-3 rounded-2xl p-4">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center justify-between"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-t6 text-grey-800 font-bold">영양 참고값</span>
        {open ? (
          <img src={iconArrowUp} alt="" width={16} height={16} />
        ) : (
          <img src={iconArrowDown} alt="" width={18} height={18} />
        )}
      </button>

      {edit ? (
        <p className="text-grey-800 flex items-center gap-1 rounded-full bg-yellow-100 py-1 pr-2.5 pl-2 text-xs leading-snug font-bold">
          <img src={iconPencilDarkSm} alt="" width={12} height={12} />
          {formatEditLabel(edit)}
        </p>
      ) : (
        <button
          type="button"
          className="border-grey-200 text-grey-700 flex items-center gap-1 rounded-full border bg-white py-1 pr-2 pl-2.5 text-xs leading-snug font-medium"
          onClick={() => onShowSource(active)}
        >
          {open && <img src={iconShield} alt="" width={12} height={12} />}
          {basis}
          {open ? (
            <img src={iconChevronXs} alt="" width={12} height={12} />
          ) : (
            <img src={iconInfoSm} alt="" width={14} height={14} />
          )}
        </button>
      )}

      {open && (
        <>
          {/* 음식이 여러 개면 하나씩 골라 봄 */}
          {items.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {items.map(({ food }) => (
                <button
                  key={food.name}
                  type="button"
                  aria-pressed={food.name === active.food.name}
                  className={`rounded-full px-3 py-1 text-xs leading-normal font-bold ${
                    food.name === active.food.name
                      ? 'bg-grey-800 text-white'
                      : 'text-grey-600 bg-white'
                  }`}
                  onClick={() => setActiveName(food.name)}
                >
                  {food.name}
                </button>
              ))}
            </div>
          )}
          <dl className="w-full overflow-hidden rounded-xl bg-white">
            {rows.map(([label, amount], index) => (
              <div
                key={label}
                className={`flex items-center justify-between px-3.5 py-3 ${
                  index > 0 ? 'border-grey-100 border-t' : ''
                }`}
              >
                <dt className="text-grey-700 text-sm leading-snug font-medium">{label}</dt>
                <dd className="text-t6 text-grey-900 leading-snug font-bold">{amount}</dd>
              </div>
            ))}
          </dl>
          {edit ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={OUTLINE_BUTTON} onClick={() => setEditing(true)}>
                다시 고치기
              </button>
              <button type="button" className={OUTLINE_BUTTON} onClick={restore}>
                공공데이터 값으로 되돌리기
              </button>
            </div>
          ) : (
            <button type="button" className={OUTLINE_BUTTON} onClick={() => setEditing(true)}>
              <img src={iconPencilDark} alt="" width={14} height={14} />
              내가 잰 값으로 고치기
            </button>
          )}
        </>
      )}

      {/* 바텀시트 transform 밖에서 화면 전체로 뜨도록 */}
      {editing &&
        createPortal(
          <NutritionEditScreen
            item={active}
            edit={edit}
            onSave={(nextEdit, myFood) => {
              onEditsChange({ ...edits, [active.food.name]: nextEdit })
              if (myFood) addMyFood(myFood)
              setEditing(false)
            }}
            onClose={() => setEditing(false)}
          />,
          document.body,
        )}
    </div>
  )
}

export default NutritionCard
