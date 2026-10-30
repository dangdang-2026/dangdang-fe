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
import PhotoUnclearScreen from '@/components/meal/photo/PhotoUnclearScreen'
import { MEAL_LABEL } from '@/constants/glucose'
import { useAiStore } from '@/stores/useAiStore'
import { useFoodStore } from '@/stores/useFoodStore'
import type { Meal, MyFood, Portion } from '@/types/glucose'

type Step =
  'consent' | 'camera' | 'finding' | 'result' | 'search' | 'myFood' | 'unclear' | 'name' | 'failed'

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

// 식사 내용 적기 흐름(MEAL-02~04). 사진 → AI 후보 → 고른 것만 저장, 언제든 이름으로 적기
function MealWriteFlow({ meal, onClose, onSaved }: MealWriteFlowProps) {
  const photoConsent = useAiStore((state) => state.photo)
  const setConsent = useAiStore((state) => state.setConsent)
  const addMyFood = useFoodStore((state) => state.addMyFood)
  const [step, setStep] = useState<Step>(() => getFirstStep(meal, photoConsent?.agreed))
  // 사진은 기기 메모리에만. 흐름이 끝나면 지움
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<string[]>([])
  const [chips, setChips] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [portion, setPortion] = useState<Portion>('one')
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
      const result = await findFoodInPhoto(photo)
      if (request !== requestRef.current) return
      if (result.status === 'unclear') return setStep('unclear')
      setCandidates(result.candidates)
      setChips(result.candidates)
      // 1등 후보만 골라 둠. 사용자가 확인하고 저장
      setSelected(result.candidates.slice(0, 1))
      setStep('result')
    } catch {
      if (request === requestRef.current) setStep('failed')
    }
  }

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }

  // 직접 고른 음식으로 AI 후보를 바꿈
  const pickSearched = (name: string) => {
    setChips((prev) => (prev.includes(name) ? prev : [...prev, name]))
    setSelected((prev) => [...prev.filter((item) => !candidates.includes(item)), name])
    setStep('result')
  }

  // 내 음식을 추가하면 고른 음식에 더해 바로 저장
  const handleAddMyFood = (food: MyFood) => {
    addMyFood(food)
    const rest = selected.filter((item) => !candidates.includes(item))
    onSaved([...new Set([...rest, food.name])], food.staple ? food.portion : undefined)
  }

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
    case 'result':
      return (
        <PhotoResultScreen
          meal={meal}
          photoUrl={photoUrl!}
          chips={chips}
          topCandidate={candidates[0]}
          selected={selected}
          portion={portion}
          onToggle={toggle}
          onPortionChange={setPortion}
          onSearch={() => setStep('search')}
          onSave={(savedPortion) => onSaved(selected, savedPortion)}
          onClose={onClose}
        />
      )
    case 'search':
      return (
        <PhotoSearchScreen
          photoUrl={photoUrl!}
          topCandidate={candidates[0]}
          onPick={pickSearched}
          onAddMyFood={(name) => {
            setMyFoodName(name)
            setStep('myFood')
          }}
          onBack={() => setStep('result')}
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
