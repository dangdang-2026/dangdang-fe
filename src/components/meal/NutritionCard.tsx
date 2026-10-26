import { useState } from 'react'
import iconArrowDown from '@/assets/icons/arrow-down.svg'
import iconArrowUp from '@/assets/icons/arrow-up.svg'
import iconChevronXs from '@/assets/icons/chevron-xs.svg'
import iconInfoSm from '@/assets/icons/info-sm.svg'
import iconShield from '@/assets/icons/shield.svg'
import { formatNutritionBasis, scaleNutrition, type NutritionItem } from '@/utils/meal'

type NutritionCardProps = {
  items: NutritionItem[]
  onShowSource: (item: NutritionItem) => void
}

// Figma F-01 접힘·F-16 펼침 영양 참고값. 음식마다 따로 보고 끼니 합계는 내지 않음
function NutritionCard({ items, onShowSource }: NutritionCardProps) {
  const [open, setOpen] = useState(false)
  const [activeName, setActiveName] = useState(items[0]?.food.name)
  const active = items.find((item) => item.food.name === activeName) ?? items[0]
  if (!active?.food.nutrition) return null

  const value = scaleNutrition(active.food.nutrition, active.portion)
  const rows = [
    ['탄수화물', `${value.carbs} g`],
    ['당류', `${value.sugar} g`],
    ['단백질', `${value.protein} g`],
    ['지방', `${value.fat} g`],
    ['열량', `${value.kcal} kcal`],
  ]
  const basis = `식약처 기준 · ${formatNutritionBasis(active)}`

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
        </>
      )}
    </div>
  )
}

export default NutritionCard
