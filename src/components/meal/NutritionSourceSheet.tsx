import iconInfoLg from '@/assets/icons/info-lg.svg'
import BottomSheet from '@/components/common/BottomSheet'
import { NUTRITION_SOURCE } from '@/mocks/foods'
import { formatNutritionBasis, type NutritionItem } from '@/utils/meal'

type NutritionSourceSheetProps = {
  item: NutritionItem
  onClose: () => void
}

// Figma F-17 영양 참고값 데이터 출처
function NutritionSourceSheet({ item, onClose }: NutritionSourceSheetProps) {
  const { food } = item
  const similarTo = 'similarTo' in food ? food.similarTo : undefined
  const rows = [
    ['데이터', NUTRITION_SOURCE.data],
    ['받는 곳', NUTRITION_SOURCE.provider],
    ['음식', similarTo ? `${similarTo} (비슷한 음식 기준)` : `${food.name} (대표값)`],
    ['기준', `1인분 ${food.nutrition?.grams} g × ${formatNutritionBasis(item)}`],
    ['갱신', NUTRITION_SOURCE.updatedAt],
  ]

  return (
    <BottomSheet label="영양 참고값 출처" onClose={onClose}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-t4 text-grey-900">이 숫자는 어디서 왔나요?</h2>
        <p className="text-grey-600 text-sm leading-relaxed">
          AI가 계산한 값이 아니에요. 공공데이터의 1인분 값에 고른 양을 곱했어요.
        </p>
      </div>

      <dl className="border-grey-200 text-t7 overflow-hidden rounded-xl border">
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={`flex gap-3 px-3.5 py-3 ${index > 0 ? 'border-grey-100 border-t' : ''}`}
          >
            <dt className="text-grey-800 w-16 shrink-0 font-bold">{label}</dt>
            <dd className="text-grey-700 flex-1">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="bg-grey-50 flex gap-2 rounded-xl px-3.5 py-3">
        <img src={iconInfoLg} alt="" width={18} height={18} className="self-start" />
        <span className="text-grey-700 text-t7 flex-1 leading-relaxed">
          끼니 합계나 리포트에는 영양 숫자를 넣지 않아요. 음식마다 펼쳐 볼 때만 보여 드려요.
        </span>
      </p>

      <button
        type="button"
        className="bg-grey-100 text-grey-800 rounded-key py-4 text-base leading-normal font-bold"
        onClick={onClose}
      >
        확인
      </button>
    </BottomSheet>
  )
}

export default NutritionSourceSheet
