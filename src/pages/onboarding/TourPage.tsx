import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import welcome from '@/assets/images/tour/welcome.svg'
import ChatbotButton from '@/components/common/ChatbotButton'
import TabBar from '@/components/common/TabBar'
import TourComplete from '@/components/tour/TourComplete'
import TourGlucoseSheet from '@/components/tour/TourGlucoseSheet'
import TourHomeStage from '@/components/tour/TourHomeStage'
import TourSpotlight from '@/components/tour/TourSpotlight'
import TourVisitStage from '@/components/tour/TourVisitStage'
import { ROUTES } from '@/constants/routes'
import { TOUR_STEPS } from '@/constants/tour'

// 환영 → 6단계 → 완료
type Phase = 'welcome' | number | 'done'

// Figma A-05a~A-05h 첫 진입 설정을 마친 뒤 한 번 보는 가이드 투어
function TourPage() {
  const navigate = useNavigate()
  const stageRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('welcome')
  const finish = () => navigate(ROUTES.TODAY, { replace: true })

  if (phase === 'welcome') {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white px-5 pt-16 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="text-grey-700 self-end text-sm leading-snug font-medium"
          onClick={finish}
        >
          건너뛰기
        </button>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <img src={welcome} alt="" />
          <h1 className="text-grey-900 mt-14.5 text-2xl leading-snug font-bold">
            안녕하세요! 저는 당당이에요 👋
          </h1>
          <p className="text-grey-600 mt-3.5 text-base leading-normal font-medium">
            매일의 식사와 혈당 기록,
            <br />
            당당이가 함께 도와드릴게요.
          </p>
        </div>
        <button
          type="button"
          className="bg-primary text-subtitle-1 h-14 rounded-xl leading-none text-white"
          onClick={() => setPhase(0)}
        >
          시작하기
        </button>
      </main>
    )
  }

  const step = phase === 'done' ? null : TOUR_STEPS[phase]
  const stage = step?.stage ?? 'visit'

  return (
    <div className="mx-auto h-dvh w-full max-w-107.5 overflow-hidden">
      {/* 뒤 화면은 보여 주기만 하고 누를 수 없음 */}
      <div ref={stageRef} inert>
        {stage === 'visit' ? (
          <TourVisitStage />
        ) : (
          <TourHomeStage eating={stage !== 'home-before'} />
        )}
        {stage === 'glucose' && <TourGlucoseSheet />}
        <ChatbotButton />
        <TabBar activePath={stage === 'visit' ? ROUTES.VISIT : ROUTES.TODAY} />
      </div>

      {step && typeof phase === 'number' ? (
        <TourSpotlight
          key={phase}
          rootRef={stageRef}
          step={step}
          index={phase}
          total={TOUR_STEPS.length}
          onNext={() => setPhase(phase + 1 < TOUR_STEPS.length ? phase + 1 : 'done')}
          onSkip={finish}
        />
      ) : (
        <TourComplete onStart={finish} />
      )}
    </div>
  )
}

export default TourPage
