import { Navigate, useNavigate } from 'react-router'
import iconKakao from '@/assets/icons/onboarding/kakao.svg'
import iconMail from '@/assets/icons/onboarding/mail.svg'
import introCharacter from '@/assets/images/onboarding/intro-character.svg'
import { ROUTES } from '@/constants/routes'
import { useOnboardingStore } from '@/stores/useOnboardingStore'

// Figma S-02 서비스 소개. 카카오는 연동 전이라 바로 약관 동의로
function IntroPage() {
  const navigate = useNavigate()
  const completed = useOnboardingStore((state) => state.completed)

  if (completed) return <Navigate to={ROUTES.TODAY} replace />

  const start = () => navigate(ROUTES.ONBOARDING_TERMS)

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <div className="from-intro-from to-intro-to rounded-b-intro relative h-111 shrink-0 overflow-hidden bg-linear-196 from-10%">
        <span className="text-grey-900 rounded-banner text-t7 absolute top-52 left-31 flex rotate-8 flex-col items-center bg-yellow-500 px-4 py-3 font-bold">
          병원 기준대로
          <br />
          알려 드려요
        </span>
        <img
          src={introCharacter}
          alt=""
          width={230}
          height={230}
          className="absolute top-61 left-43"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-11">
        <h1 className="text-t2 text-grey-900">
          병원에서 받은 기준대로,
          <br />
          하루가 끊기지 않게
        </h1>
        <p className="text-body-2 text-grey-600">
          식사 시작만 누르면 측정 시간을 알려 드리고,
          <br />
          진료 날엔 기록을 한 장으로 정리해 드려요.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5">
        <button
          type="button"
          className="bg-kakao text-kakao-label text-subtitle-1 flex h-14 items-center justify-center gap-1 rounded-xl leading-none"
          onClick={start}
        >
          <img src={iconKakao} alt="" width={20} height={20} />
          카카오로 로그인
        </button>
        <p className="text-body-3 text-grey-400 flex items-center justify-center gap-1.5">
          <img src={iconMail} alt="" width={16} height={16} />
          <button type="button" onClick={() => navigate(ROUTES.SIGNUP)}>
            회원가입하기
          </button>
          <span aria-hidden>·</span>
          <button type="button" onClick={() => navigate(ROUTES.LOGIN)}>
            로그인하기
          </button>
        </p>
      </div>
    </main>
  )
}

export default IntroPage
