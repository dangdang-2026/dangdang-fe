import { useState } from 'react'
import { useNavigate } from 'react-router'
import iconOptionCheckOff from '@/assets/icons/onboarding/option-check-off.svg'
import iconOptionCheckOn from '@/assets/icons/onboarding/option-check-on.svg'
import iconInfoSm from '@/assets/icons/info-sm.svg'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { useOnboardingStore } from '@/stores/useOnboardingStore'

type Option = { value: number | null; title: string; description: string }

const OPTIONS: Option[] = [
  { value: 1, title: '식후 1시간', description: '첫술을 뜬 시각부터 1시간' },
  { value: 2, title: '식후 2시간', description: '첫술을 뜬 시각부터 2시간' },
  { value: null, title: '아직 몰라요', description: '다음 진료 때 확인해도 괜찮아요.' },
]

// Figma A-02 식후 측정 시점 · A-02c 아직 몰라요(식후 알림 없음 안내)
function TimingPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.ONBOARDING_TERMS)
  const saved = useOnboardingStore((state) => state.postMealHours)
  const setAnswers = useOnboardingStore((state) => state.setAnswers)
  const [hours, setHours] = useState<number | null | undefined>(saved)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <OnboardingHeader step={1} onBack={goBack} />

      <div className="mt-4.5 flex flex-col gap-6">
        <h1 className="text-title-2 text-grey-900">
          병원에서 식후
          <br />몇 시간에 재라고
          <br />
          안내받으셨나요?
        </h1>
        <p className="text-grey-500 text-sm leading-normal">
          알림 시간을 이 기준으로 맞춰요. 언제든 바꿀 수 있어요.
        </p>
      </div>

      <ul role="radiogroup" aria-label="식후 측정 시점" className="mt-6 flex flex-col gap-4">
        {OPTIONS.map(({ value, title, description }) => {
          const selected = hours === value
          return (
            <li key={title}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                className={`flex w-full items-center gap-3.5 rounded-3xl p-5 text-left ${
                  selected ? 'bg-yellow-50' : 'bg-grey-50'
                }`}
                onClick={() => setHours(value)}
              >
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-title-3 text-grey-900">{title}</span>
                  <span className="text-t7 text-grey-500">{description}</span>
                </span>
                <span
                  aria-hidden
                  className={`rounded-full border-2 p-1 ${
                    selected ? 'bg-primary border-primary' : 'border-grey-300 bg-white'
                  }`}
                >
                  <img
                    src={selected ? iconOptionCheckOn : iconOptionCheckOff}
                    alt=""
                    width={16}
                    height={16}
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {hours === null && (
        <div className="rounded-banner mt-4 flex gap-2 border border-yellow-300 bg-yellow-50 p-4">
          <img
            src={iconInfoSm}
            alt=""
            width={14}
            height={14}
            className="mt-1 shrink-0 self-start"
          />
          <p className="flex flex-col gap-1">
            <span className="text-t7 text-grey-900 font-bold">
              그동안 식후 측정 알림은 보내지 않아요
            </span>
            <span className="text-t7 text-grey-700">
              식사 시작은 그대로 기록해요. 몇 시간 뒤에 재야 할지 모르면 알림 시각을 정할 수
              없어서예요. 병원에서 들으면 마이 › 병원 기준에서 고르면 그때부터 알려 드려요.
            </span>
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={hours === undefined}
        className="text-subtitle-1 disabled:bg-grey-100 disabled:text-grey-400 bg-primary mt-auto h-14 rounded-xl leading-none text-white"
        onClick={() => {
          setAnswers({ postMealHours: hours })
          navigate(ROUTES.ONBOARDING_SLOTS)
        }}
      >
        다음
      </button>
    </main>
  )
}

export default TimingPage
