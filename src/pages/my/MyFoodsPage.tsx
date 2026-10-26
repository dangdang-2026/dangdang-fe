import { useCallback, useState } from 'react'
import iconChevronMd from '@/assets/icons/chevron-md.svg'
import iconPrivate from '@/assets/icons/private.svg'
import BottomSheet from '@/components/common/BottomSheet'
import SubPageHeader from '@/components/common/SubPageHeader'
import Toast from '@/components/common/Toast'
import MyFoodForm from '@/components/meal/MyFoodForm'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useFoodStore } from '@/stores/useFoodStore'
import type { MyFood } from '@/types/glucose'
import { formatPortion, withObjectParticle } from '@/utils/meal'

// 예: 비슷한 음식: 함박스테이크 기준 · 자주 1공기
function describeMyFood(food: MyFood) {
  const basis = food.similarTo ? `비슷한 음식: ${food.similarTo} 기준` : '영양 참고값 없음'
  return food.portion ? `${basis} · 자주 ${formatPortion(food.portion, food.unit)}` : basis
}

// 을·를만. 이름을 따옴표로 감쌀 때
const particleOf = (word: string) => withObjectParticle(word).slice(word.length)

// Figma M-13 내 음식 · M-17 고치기 · M-18 지우기 확인
function MyFoodsPage() {
  const goBack = useGoBack(ROUTES.MY)
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
            <p className="text-t6 text-grey-900 font-bold">아직 직접 추가한 음식이 없어요</p>
            <p className="text-t7 text-grey-500">
              식사 기록에서 찾는 음식이 없으면 내 음식으로 추가할 수 있어요
            </p>
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
        <BottomSheet label="내 음식 지우기" onClose={closeDelete}>
          <div className="flex flex-col gap-2">
            <h2 className="text-t4 text-grey-900">
              ‘{deleting.name}’{particleOf(deleting.name)} 지울까요?
            </h2>
            <p className="text-body-2 text-grey-700 font-normal">
              이미 남긴 끼니 기록은 그대로예요.
              <br />
              다음부터 음식 검색에 나오지 않아요.
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <button
              type="button"
              className="text-subtitle-1 bg-primary h-14 rounded-xl leading-none text-white"
              onClick={() => {
                removeMyFood(deleting.name)
                setDeleting(null)
                setToast(`${withObjectParticle(deleting.name)} 지웠어요`)
              }}
            >
              지우기
            </button>
            <button
              type="button"
              className="text-grey-600 py-1 text-sm leading-normal"
              onClick={closeDelete}
            >
              취소
            </button>
          </div>
        </BottomSheet>
      )}

      {toast && <Toast message={toast} onClose={closeToast} />}
    </main>
  )
}

export default MyFoodsPage
