import { useEffect, useRef, useState } from 'react'
import { findFoodInPhoto } from '@/api/foodPhoto'
import BottomSheet from '@/components/common/BottomSheet'
import MealContentSheet from '@/components/meal/MealContentSheet'
import MyFoodForm from '@/components/meal/MyFoodForm'
import CameraScreen from '@/components/meal/photo/CameraScreen'
import PhotoConsentSheet from '@/components/meal/photo/PhotoConsentSheet'
import PhotoFindingScreen from '@/components/meal/photo/PhotoFindingScreen'
import PhotoResultScreen from '@/components/meal/photo/PhotoResultScreen'
import PhotoSearchScreen from '@/components/meal/photo/PhotoSearchScreen'
import PhotoTableScreen, { type TableItem } from '@/components/meal/photo/PhotoTableScreen'
import PhotoUnclearScreen from '@/components/meal/photo/PhotoUnclearScreen'
import { MEAL_LABEL } from '@/constants/glucose'
import { useAiStore } from '@/stores/useAiStore'
import { useFoodStore } from '@/stores/useFoodStore'
import type { DetectedFood } from '@/types/foodPhoto'
import type { Meal, MyFood, Portion } from '@/types/glucose'

type Step =
  | 'consent'
  | 'camera'
  | 'finding'
  | 'single'
  | 'table'
  | 'search'
  | 'myFood'
  | 'unclear'
  | 'name'
  | 'failed'

// 검색에서 고른 음식이 들어갈 곳. 한상은 고칠 줄 id, null이면 빠진 음식 추가
type SearchTarget = { mode: 'single' } | { mode: 'table'; id: string | null }

type MealWriteFlowProps = {
  meal: Meal
  onClose: () => void
  onSaved: (foods: string[], portion?: Portion) => void
}

// 이미 적은 식사는 이름으로 고치기. 사진 동의를 안 물어봤으면 동의부터, 거절했으면 이름으로
function getFirstStep(meal: Meal, agreed: boolean | undefined): Step {
  if (meal.foods?.length) return 'name'
  if (agreed === undefined) return 'consent'
  return agreed ? 'camera' : 'name'
}

// 한상 음식마다 1등 후보로. 확인 필요는 체크 안 한 채로 시작
const toTableItem = (food: DetectedFood): TableItem => ({
  id: food.id,
  name: food.candidates[0],
  checked: !food.needsCheck,
  needsCheck: food.needsCheck,
  point: food.point,
})

// 식사 내용 적기 흐름(MEAL-02~04). 사진 → AI 후보 → 고른 것만 저장, 언제든 이름으로 적기
function MealWriteFlow({ meal, onClose, onSaved }: MealWriteFlowProps) {
  const photoConsent = useAiStore((state) => state.photo)
  const setConsent = useAiStore((state) => state.setConsent)
  const addMyFood = useFoodStore((state) => state.addMyFood)
  const [step, setStep] = useState<Step>(() => getFirstStep(meal, photoConsent?.agreed))
  // 사진은 기기 메모리에만. 흐름이 끝나면 지움
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  // 음식 하나(F-12): AI 후보 + 직접 고른 음식 칩
  const [candidates, setCandidates] = useState<string[]>([])
  const [chips, setChips] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  // 한상(F-13): 음식별 줄
  const [items, setItems] = useState<TableItem[]>([])
  const [portion, setPortion] = useState<Portion>('one')
  const [searchTarget, setSearchTarget] = useState<SearchTarget>({ mode: 'single' })
  const [myFoodName, setMyFoodName] = useState('')
  // 다시 찍거나 이름으로 넘어가면 늦게 온 결과는 버림
  const requestRef = useRef(0)

  useEffect(() => {
    if (!photoUrl) return
    return () => URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  const writeName = () => {
    requestRef.current += 1
    setStep('name')
  }

  const handleCapture = async (photo: Blob) => {
    const request = ++requestRef.current
    setPhotoUrl(URL.createObjectURL(photo))
    setStep('finding')
    try {
      const result = await findFoodInPhoto(meal.id, photo)
      if (request !== requestRef.current) return
      if (result.status === 'unclear' || result.foods.length === 0) return setStep('unclear')
      setPortion('one')
      if (result.foods.length > 1) {
        setItems(result.foods.map(toTableItem))
        setStep('table')
        return
      }
      const [food] = result.foods
      setCandidates(food.candidates)
      setChips(food.candidates)
      // 1등 후보만 골라 둠. 애매하면 비워 두고 사용자가 고름
      setSelected(food.needsCheck ? [] : food.candidates.slice(0, 1))
      setStep('single')
    } catch {
      if (request === requestRef.current) setStep('failed')
    }
  }

  const toggleChip = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    )
  }

  const openSearch = (target: SearchTarget) => {
    setSearchTarget(target)
    setStep('search')
  }

  // 직접 고른 음식으로 AI 후보를 바꾸거나 빠진 음식으로 더함
  const pickSearched = (name: string) => {
    if (searchTarget.mode === 'single') {
      setChips((prev) => (prev.includes(name) ? prev : [...prev, name]))
      setSelected((prev) => [...prev.filter((item) => !candidates.includes(item)), name])
    } else if (searchTarget.id) {
      const { id } = searchTarget
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, name, checked: true, needsCheck: false } : item,
        ),
      )
    } else {
      setItems((prev) => [
        ...prev,
        { id: `added-${prev.length}`, name, checked: true, needsCheck: false },
      ])
    }
    setStep(searchTarget.mode)
  }

  // 내 음식을 추가하면 고른 음식에 넣고 결과 화면으로
  const handleAddMyFood = (food: MyFood) => {
    addMyFood(food)
    if (food.staple && food.portion) setPortion(food.portion)
    pickSearched(food.name)
  }

  const searchingItem =
    searchTarget.mode === 'table' ? items.find((item) => item.id === searchTarget.id) : undefined
  const mealLabel = MEAL_LABEL[meal.type]

  switch (step) {
    case 'consent':
      return (
        <PhotoConsentSheet
          onAgree={() => {
            setConsent('photo', true)
            setStep('camera')
          }}
          onDecline={() => {
            setConsent('photo', false)
            setStep('name')
          }}
          onClose={onClose}
        />
      )
    case 'camera':
      return (
        <CameraScreen
          title={`${mealLabel} 사진`}
          onCapture={handleCapture}
          onWriteName={writeName}
          onClose={onClose}
        />
      )
    case 'finding':
      return <PhotoFindingScreen photoUrl={photoUrl!} onWriteName={writeName} onClose={onClose} />
    case 'unclear':
      return (
        <PhotoUnclearScreen
          photoUrl={photoUrl!}
          onRetake={() => setStep('camera')}
          onWriteName={writeName}
          onClose={onClose}
        />
      )
    case 'single':
      return (
        <PhotoResultScreen
          meal={meal}
          photoUrl={photoUrl!}
          chips={chips}
          topCandidate={candidates[0]}
          selected={selected}
          portion={portion}
          onToggle={toggleChip}
          onPortionChange={setPortion}
          onSearch={() => openSearch({ mode: 'single' })}
          onSave={(savedPortion) => onSaved(selected, savedPortion)}
          onClose={onClose}
        />
      )
    case 'table':
      return (
        <PhotoTableScreen
          photoUrl={photoUrl!}
          items={items}
          portion={portion}
          onToggle={toggleItem}
          onPortionChange={setPortion}
          onFix={(id) => openSearch({ mode: 'table', id })}
          onAddMissing={() => openSearch({ mode: 'table', id: null })}
          onSave={(savedPortion) =>
            onSaved(
              [...new Set(items.filter((item) => item.checked).map((item) => item.name))],
              savedPortion,
            )
          }
          onClose={onClose}
        />
      )
    case 'search':
      return (
        <PhotoSearchScreen
          photoUrl={photoUrl!}
          topCandidate={searchTarget.mode === 'single' ? candidates[0] : searchingItem?.name}
          onPick={pickSearched}
          onAddMyFood={(name) => {
            setMyFoodName(name)
            setStep('myFood')
          }}
          onBack={() => setStep(searchTarget.mode)}
        />
      )
    case 'myFood':
      return (
        <BottomSheet label="내 음식 추가" onClose={onClose}>
          <MyFoodForm
            initialName={myFoodName}
            onBack={() => setStep('search')}
            onAdd={handleAddMyFood}
          />
        </BottomSheet>
      )
    case 'name':
    case 'failed':
      return (
        <MealContentSheet
          meal={meal}
          photoFailed={step === 'failed'}
          onClose={onClose}
          onSaved={onSaved}
        />
      )
  }
}

export default MealWriteFlow
