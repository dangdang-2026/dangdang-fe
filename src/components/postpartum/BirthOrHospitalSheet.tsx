import { useState } from 'react'
import iconCheckOff from '@/assets/icons/postpartum/check-off.svg'
import iconCheckOn from '@/assets/icons/postpartum/check-on.svg'
import sheetCharacter from '@/assets/images/postpartum/sheet-character.svg'
import BottomSheet from '@/components/common/BottomSheet'

export type BirthOrHospital = 'hospital' | 'birth'

const OPTIONS: { value: BirthOrHospital; title: string; description: string }[] = [
  {
    value: 'hospital',
    title: '입원했어요',
    description: '알림만 잠시 멈춰요. 퇴원하면 다시 켤 수 있어요.',
  },
  { value: 'birth', title: '출산했어요', description: '출산일을 적고 산후 모드로 바꿔요.' },
]

type BirthOrHospitalSheetProps = {
  onNext: (choice: BirthOrHospital) => void
  onClose: () => void
}

// Figma E-03 출산·입원했어요: 입원이면 알림만 멈추고, 출산이면 출산일 입력으로
function BirthOrHospitalSheet({ onNext, onClose }: BirthOrHospitalSheetProps) {
  const [choice, setChoice] = useState<BirthOrHospital | null>(null)

  return (
    <BottomSheet label="출산·입원" onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-t4 text-grey-900">출산·입원하셨나요?</h2>
        <img src={sheetCharacter} alt="" width={64} height={64} />
      </div>
      <p className="text-t6 text-grey-600">
        측정·인슐린 알림을 바로 멈출게요.
        <br />
        지금까지의 기록은 그대로 남아요.
      </p>

      <div role="radiogroup" aria-label="출산·입원" className="flex flex-col gap-4.5">
        {OPTIONS.map((option) => {
          const selected = choice === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`flex items-center gap-3.5 rounded-3xl border-2 p-5 text-left ${
                selected ? 'border-yellow-300 bg-yellow-50' : 'bg-grey-50 border-transparent'
              }`}
              onClick={() => setChoice(option.value)}
            >
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-title-3 text-grey-900">{option.title}</span>
                <span className="text-t7 text-grey-700">{option.description}</span>
              </span>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                  selected ? 'bg-primary' : 'border-grey-300 border-2 bg-white'
                }`}
              >
                <img src={selected ? iconCheckOn : iconCheckOff} alt="" width={16} height={16} />
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        disabled={!choice}
        className="text-subtitle-1 bg-primary disabled:bg-grey-100 disabled:text-grey-400 h-14 rounded-xl leading-none text-white"
        onClick={() => choice && onNext(choice)}
      >
        다음
      </button>
      <button type="button" className="text-grey-600 text-sm leading-normal" onClick={onClose}>
        취소
      </button>
    </BottomSheet>
  )
}

export default BirthOrHospitalSheet
