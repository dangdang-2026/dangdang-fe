import iconBack from '@/assets/icons/back.svg'

// 약관 → 병원 기준 → 출산예정일
const STEP_COUNT = 3

type OnboardingHeaderProps = {
  // 0부터
  step: number
  onBack: () => void
}

// Figma A-01~A-03 머리: 뒤로 + 진행 점(지난 단계 연노랑, 지금 단계 길게)
function OnboardingHeader({ step, onBack }: OnboardingHeaderProps) {
  return (
    <header className="relative flex h-14 items-center">
      <button type="button" aria-label="뒤로" onClick={onBack}>
        <img src={iconBack} alt="" width={24} height={24} />
      </button>
      <p
        aria-label={`${STEP_COUNT}단계 중 ${step + 1}단계`}
        className="absolute left-1/2 flex -translate-x-1/2 gap-1.5"
      >
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full ${
              index === step
                ? 'bg-primary w-7'
                : index < step
                  ? 'w-2.5 bg-yellow-200'
                  : 'bg-grey-200 w-2.5'
            }`}
          />
        ))}
      </p>
    </header>
  )
}

export default OnboardingHeader
