import { useState } from 'react'
import iconCheckDark from '@/assets/icons/check-dark.svg'
import PhotoScreen from '@/components/meal/photo/PhotoScreen'
import type { MyFood, Nutrition, NutritionEdit } from '@/types/glucose'
import {
  getPortionFactor,
  scaleNutrition,
  getDirectionParticle,
  type NutritionItem,
} from '@/utils/meal'

type NutrientKey = 'carbs' | 'sugar' | 'protein' | 'fat' | 'kcal'
type Mode = 'weight' | 'label'

const NUTRIENTS: { key: NutrientKey; label: string; unit: string }[] = [
  { key: 'carbs', label: '탄수화물', unit: 'g' },
  { key: 'sugar', label: '당류', unit: 'g' },
  { key: 'protein', label: '단백질', unit: 'g' },
  { key: 'fat', label: '지방', unit: 'g' },
  { key: 'kcal', label: '열량', unit: 'kcal' },
]

const MODES: { value: Mode; label: string }[] = [
  { value: 'weight', label: '무게로 계산' },
  { value: 'label', label: '영양성분표 보고 입력' },
]

// 숫자와 소수점 하나만, 네 자리까지
const toAmount = (text: string) => {
  const [whole, ...rest] = text.replace(/[^\d.]/g, '').split('.')
  const digits = whole.slice(0, 4)
  return rest.length > 0 ? `${digits}.${rest.join('').slice(0, 1)}` : digits
}

// 잰 무게만큼 1인분 값을 비율로 다시 계산
const byWeight = (nutrition: Nutrition, grams: number) =>
  Object.fromEntries(
    NUTRIENTS.map(({ key }) => [key, Math.round((nutrition[key] * grams) / nutrition.grams)]),
  ) as Record<NutrientKey, number>

type NutritionEditScreenProps = {
  item: NutritionItem
  // 이미 고친 값이 있으면 그 값부터
  edit?: NutritionEdit
  onSave: (edit: NutritionEdit, myFood?: MyFood) => void
  onClose: () => void
}

// Figma F-18 영양값 직접 고치기. 저울로 잰 무게나 포장지 영양성분표 값으로 바꿈
function NutritionEditScreen({ item, edit, onSave, onClose }: NutritionEditScreenProps) {
  const { food, portion } = item
  const nutrition = food.nutrition!
  const base = scaleNutrition(nutrition, portion)
  const baseGrams = Math.round(nutrition.grams * getPortionFactor(portion))

  // 처음 값으로를 누르면 식약처 값부터 다시
  const [fromBase, setFromBase] = useState(!edit)
  const start = fromBase || !edit ? base : edit
  const [mode, setMode] = useState<Mode>(edit && edit.grams === undefined ? 'label' : 'weight')
  const [weight, setWeight] = useState(String(edit?.grams ?? baseGrams))
  // 직접 고친 칸만. 안 고친 칸은 무게로 계산하거나 처음 값
  const [typed, setTyped] = useState<Partial<Record<NutrientKey, string>>>(() => {
    if (!edit) return {}
    const computed = byWeight(nutrition, edit.grams ?? baseGrams)
    return Object.fromEntries(
      NUTRIENTS.filter(({ key }) => edit.grams === undefined || edit[key] !== computed[key]).map(
        ({ key }) => [key, String(edit[key])],
      ),
    )
  })
  const [saveAsMyFood, setSaveAsMyFood] = useState(true)

  const grams = Number(weight)
  const computed = mode === 'weight' && grams > 0 ? byWeight(nutrition, grams) : null
  const valueOf = (key: NutrientKey) =>
    typed[key] ?? (mode === 'weight' ? (computed ? String(computed[key]) : '') : String(start[key]))
  const canSave =
    (mode === 'label' || grams > 0) && NUTRIENTS.every(({ key }) => valueOf(key) !== '')
  const myFoodName = `우리 집 ${food.name}`

  const reset = () => {
    setFromBase(true)
    setWeight(String(baseGrams))
    setTyped({})
  }

  const save = () => {
    const values = Object.fromEntries(
      NUTRIENTS.map(({ key }) => [key, Number(valueOf(key))]),
    ) as Record<NutrientKey, number>
    const savedGrams = mode === 'weight' ? grams : undefined
    const myFood: MyFood | undefined = saveAsMyFood
      ? {
          name: myFoodName,
          unit: food.unit,
          staple: food.staple,
          // 이번에 먹은 양을 1인분으로
          nutrition: { grams: savedGrams ?? baseGrams, ...values },
          similarTo: food.name,
          portion: food.staple ? 'one' : undefined,
        }
      : undefined
    onSave({ ...values, grams: savedGrams, editedAt: new Date().toISOString() }, myFood)
  }

  return (
    <PhotoScreen
      title="영양값 고치기"
      back
      onBack={onClose}
      action={
        <button
          type="button"
          className="text-grey-600 text-sm leading-snug font-medium"
          onClick={reset}
        >
          처음 값으로
        </button>
      }
      footer={
        <button
          type="button"
          disabled={!canSave}
          className="bg-primary disabled:bg-grey-100 disabled:text-grey-400 rounded-key w-full py-4 text-base leading-snug font-bold text-white"
          onClick={save}
        >
          이 값으로 저장
        </button>
      }
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t3 text-grey-900">직접 잰 값이 있으면 고쳐 주세요</h2>
        <p className="text-grey-600 text-sm leading-relaxed">
          저울로 잰 무게나 포장지 영양성분표를 보고 적으면 돼요. 고친 값은 ‘내가 입력한 값’으로 따로
          표시해요.
        </p>
      </div>

      <div className="bg-grey-100 flex gap-1 rounded-xl p-1">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className={`flex-1 rounded-lg py-2 text-sm leading-snug ${
              mode === value
                ? 'shadow-segment text-grey-900 bg-white font-bold'
                : 'text-grey-700 font-medium'
            }`}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'weight' ? (
        <label className="flex flex-col gap-2">
          <span className="text-grey-600 text-sm leading-snug font-medium">
            먹은 양 (저울로 잰 무게)
          </span>
          <span className="border-primary rounded-key flex items-center gap-2 border-2 px-4 py-3">
            <input
              inputMode="decimal"
              value={weight}
              placeholder="0"
              className="text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 bg-transparent text-lg leading-snug font-bold outline-none"
              onChange={(event) => setWeight(toAmount(event.target.value))}
            />
            <span className="text-body-2 text-grey-600">g</span>
          </span>
          <span className="text-grey-600 text-xs leading-normal">
            DB 1인분 {nutrition.grams} g 기준으로 비율을 다시 계산해요.
          </span>
        </label>
      ) : (
        <p className="text-grey-600 bg-grey-50 rounded-xl px-3.5 py-3 text-xs leading-normal">
          포장지 영양성분표에 적힌 값을 그대로 적어 주세요. 먹은 양 전체 기준이에요.
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-grey-600 flex items-center gap-1.5 leading-snug">
          <span className="text-sm font-medium">성분별 값</span>
          <span className="text-xs">필요한 것만 고쳐도 돼요</span>
        </h3>
        <ul className="border-grey-200 rounded-key overflow-hidden border">
          {NUTRIENTS.map(({ key, label, unit }, index) => {
            const edited = typed[key] !== undefined
            return (
              <li
                key={key}
                className={`flex items-center justify-between py-2 pr-3 pl-4 ${
                  index > 0 ? 'border-grey-100 border-t' : ''
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-body-2 text-grey-800">{label}</span>
                  {edited && (
                    <span className="text-caption text-grey-800 rounded-sm bg-yellow-100 px-1.5 py-px font-bold">
                      고침
                    </span>
                  )}
                </span>
                <span
                  className={`rounded-tag flex w-30 items-center justify-end gap-1 border-2 px-3 py-1.5 ${
                    edited ? 'border-primary bg-white' : 'bg-grey-50 border-transparent'
                  }`}
                >
                  <input
                    inputMode="decimal"
                    aria-label={`${label} ${unit}`}
                    value={valueOf(key)}
                    placeholder="0"
                    className="text-grey-900 placeholder:text-grey-400 min-w-0 flex-1 bg-transparent text-right text-base leading-snug font-bold outline-none"
                    onChange={(event) =>
                      setTyped((prev) => ({ ...prev, [key]: toAmount(event.target.value) }))
                    }
                  />
                  <span className={`text-body-3 ${edited ? 'text-grey-600' : 'text-grey-700'}`}>
                    {unit}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <label className="bg-grey-50 flex items-center gap-2.5 rounded-xl px-3.5 py-3">
        <input
          type="checkbox"
          checked={saveAsMyFood}
          className="peer sr-only"
          onChange={(event) => setSaveAsMyFood(event.target.checked)}
        />
        <span
          aria-hidden
          className={`flex size-5.5 shrink-0 items-center justify-center rounded-md peer-focus-visible:outline-2 peer-focus-visible:outline-orange-400 ${
            saveAsMyFood ? 'bg-primary' : 'border-grey-300 border-2 bg-white'
          }`}
        >
          {saveAsMyFood && <img src={iconCheckDark} alt="" width={14} height={14} />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body-2 text-grey-900 font-bold">다음에도 이 값 쓰기</span>
          <span className="text-t7 text-grey-700">
            ‘{myFoodName}’{getDirectionParticle(myFoodName)} 내 음식에 저장해요
          </span>
        </span>
      </label>
    </PhotoScreen>
  )
}

export default NutritionEditScreen
