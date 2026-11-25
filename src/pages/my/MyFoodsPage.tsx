import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import iconChevronMd from '@/assets/icons/chevron-md.svg'
import iconPrivate from '@/assets/icons/private.svg'
import BottomSheet from '@/components/common/BottomSheet'
import ConfirmSheet from '@/components/common/ConfirmSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import MyFoodForm from '@/components/meal/MyFoodForm'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useFoodStore } from '@/stores/useFoodStore'
import type { MyFood } from '@/types/glucose'
import { formatPortion, withObjectParticle } from '@/utils/meal'

// 예: 비슷한 음식: 함박스테이크 기준 · 자주 1공기 / 내가 입력한 값 · 250 g
function describeMyFood(food: MyFood) {
  const basis = food.similarTo
    ? `비슷한 음식: ${food.similarTo} 기준`
    : food.nutrition
      ? `내가 입력한 값 · ${food.nutrition.grams} g`
      : '영양 참고값 없음'
  return food.portion ? `${basis} · 자주 ${formatPortion(food.portion, food.unit)}` : basis
}

// Figma M-13 내 음식 · M-17 고치기 · M-18 지우기 확인
function MyFoodsPage() {
  const goBack = useGoBack(ROUTES.MY)
  const navigate = useNavigate()
  const { myFoods, updateMyFood, removeMyFood } = useFoodStore()
  const [editing, setEditing] = useState<MyFood | null>(null)
  const [deleting, setDeleting] = useState<MyFood | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeEdit = useCallback(() => setEditing(null), [])
  const closeDelete = useCallback(() => setDeleting(null), [])

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="내 음식" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-4">
        <p className="text-t7 text-grey-500 font-medium">직접 추가한 음식 {myFoods.length}개</p>

        {myFoods.length === 0 ? (
          <div className="border-grey-200 flex flex-col items-center gap-1 rounded-2xl border px-4 py-8 text-center">
            <p className="text-t6 text-grey-900 font-bold">아직 내 음식이 없어요</p>
            <p className="text-t7 text-grey-500">
              식사 기록에서 ‘직접 추가’한 음식이
              <br />
              여기에 모여요.
            </p>
            <button
              type="button"
              className="text-t7 bg-grey-100 text-grey-800 rounded-tag mt-3 px-4 py-2 font-bold"
              onClick={() => navigate(ROUTES.RECORDS)}
            >
              식사 기록으로 가기
            </button>
          </div>
        ) : (
          <ul className="border-grey-200 divide-grey-100 divide-y rounded-2xl border">
            {myFoods.map((food) => (
              <li key={food.name}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 py-3.5 pr-3.5 pl-4 text-left"
                  onClick={() => setEditing(food)}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
                    <span className="text-body-2 text-grey-900 truncate">{food.name}</span>
                    <span className="text-grey-500 truncate text-xs">{describeMyFood(food)}</span>
                  </span>
                  <img src={iconChevronMd} alt="" width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="bg-grey-50 flex gap-2 rounded-xl px-3.5 py-3">
          <img src={iconPrivate} alt="" width={18} height={18} className="self-start" />
          <span className="text-grey-700 text-t7 flex-1 leading-relaxed">
            내 음식은 나만 볼 수 있어요. 지워도 이미 남긴 끼니 기록은 그대로예요.
          </span>
        </p>
      </div>

      {editing && (
        <BottomSheet label="내 음식 고치기" onClose={closeEdit}>
          <MyFoodForm
            initialName={editing.name}
            editing={editing}
            onBack={closeEdit}
            onAdd={(food) => {
              updateMyFood(editing.name, food)
              setEditing(null)
              setToast('내 음식을 고쳤어요')
            }}
            onDelete={() => {
              setEditing(null)
              setDeleting(editing)
            }}
          />
        </BottomSheet>
      )}

      {deleting && (
        <ConfirmSheet
          title="이 음식을 지울까요?"
          summary={[
            { label: '음식', value: deleting.name },
            {
              label: '보통 양',
              value: [
                formatPortion(deleting.portion ?? 'one', deleting.unit),
                deleting.nutrition?.grams && `${deleting.nutrition.grams} g`,
              ]
                .filter(Boolean)
                .join(' · '),
            },
          ]}
          description={'이미 남긴 끼니 기록은 그대로예요.\n다음부터 음식 검색에 나오지 않아요.'}
          confirmLabel="지우기"
          danger
          onConfirm={() => {
            removeMyFood(deleting.name)
            setDeleting(null)
            setToast(`${withObjectParticle(deleting.name)} 지웠어요`)
          }}
          onClose={closeDelete}
        />
      )}

      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default MyFoodsPage
