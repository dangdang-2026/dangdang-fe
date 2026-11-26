import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import iconShare from '@/assets/icons/share.svg'
import Toast from '@/components/common/Toast'
import OnboardingHeader from '@/components/onboarding/OnboardingHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'
import { isKakaoInApp } from '@/utils/device'

type Step = { text: string; figure?: ReactNode }

// 단계 옆 그림: 공유 버튼 · 카카오톡 ⋯ 버튼
function Figure({ children }: { children: ReactNode }) {
  return (
    <span className="border-grey-200 rounded-tag flex size-9 shrink-0 items-center justify-center border bg-white">
      {children}
    </span>
  )
}

const SAFARI_STEPS: Step[] = [
  {
    text: '아래 공유 버튼을 눌러요',
    figure: (
      <Figure>
        <img src={iconShare} alt="" width={20} height={20} />
      </Figure>
    ),
  },
  { text: "'홈 화면에 추가'를 골라요" },
  { text: '홈 화면의 당당으로 다시 열어요' },
]

const KAKAO_STEPS: Step[] = [
  {
    text: '오른쪽 아래 버튼을 눌러요',
    figure: <Figure>⋯</Figure>,
  },
  { text: "'Safari로 열기'를 골라요" },
  { text: 'Safari에서 홈 화면에 추가해요' },
]

// Figma A-04 가입 다음 홈 화면에 추가(iPhone · Safari) · A-04b 카카오톡에서 열었으면 Safari로
function HomeScreenPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.ONBOARDING_DUE_DATE)
  const kakao = isKakaoInApp()
  const steps = kakao ? KAKAO_STEPS : SAFARI_STEPS
  const [toast, setToast] = useState<string | null>(null)
  const goTour = () => navigate(ROUTES.ONBOARDING_TOUR, { replace: true })

  // 카카오톡에서는 Safari로 옮겨 열 주소를 복사
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setToast('링크를 복사했어요. Safari에 붙여 넣어 주세요')
    } catch {
      setToast('링크를 복사하지 못했어요. 오른쪽 아래 버튼으로 Safari에서 열어 주세요')
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-2 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      {/* 진행 점은 3칸이라 마지막 칸으로 */}
      <OnboardingHeader step={2} onBack={goBack} />

      <div className="mt-4.5 flex flex-col gap-3">
        <h1 className="text-title-2 text-grey-900">
          {kakao ? (
            <>
              Safari로 열어
              <br />
              주세요
            </>
          ) : (
            <>
              홈 화면에 당당을
              <br />
              추가해 주세요
            </>
          )}
        </h1>
        <p className="text-body-2 text-grey-700 font-normal">
          {kakao ? '카카오톡 안에서는' : 'iPhone은 홈 화면 앱에서만'}
          <br />
          {kakao ? '홈 화면에 추가할 수 없어요.' : '측정 알림이 와요.'}
        </p>
      </div>

      <ol className="bg-grey-50 mt-6 flex flex-col gap-4.5 rounded-2xl p-5">
        {steps.map(({ text, figure }, index) => (
          <li key={text} className="flex items-center gap-3">
            <span className="bg-grey-200 text-t7 text-grey-800 flex size-6.5 shrink-0 items-center justify-center rounded-full font-bold">
              {index + 1}
            </span>
            <span className="text-t6 text-grey-800 flex-1 font-medium">{text}</span>
            {figure}
          </li>
        ))}
      </ol>

      <div className="mt-auto flex flex-col items-center gap-5">
        <button
          type="button"
          className="text-grey-600 text-sm font-medium underline"
          onClick={goTour}
        >
          나중에 할게요
        </button>
        <button
          type="button"
          className="text-subtitle-1 bg-primary h-14 w-full rounded-xl leading-none font-bold text-white"
          onClick={kakao ? () => void copyLink() : goTour}
        >
          {kakao ? '링크 복사하기' : '추가했어요'}
        </button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </main>
  )
}

export default HomeScreenPage
