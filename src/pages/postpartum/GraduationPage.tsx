import { Navigate, useLocation, useNavigate } from 'react-router'
import type { GraduationStats } from '@/api/pregnancy'
import iconArchive from '@/assets/icons/postpartum/archive-md.svg'
import DangdangAvatar from '@/components/common/DangdangAvatar'
import { ROUTES } from '@/constants/routes'
import { useReportStore } from '@/stores/useReportStore'
import { useSplashStore } from '@/stores/useSplashStore'

// Figma E-12 임신 중 관리 졸업 · E-12a·E-12b 등장. 지킨 것만 보여 주고 평가·연속 축하는 없음
function GraduationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // 산후 홈에서 졸업한 뒤 서버가 준 숫자
  const graduation = (location.state as { graduation?: GraduationStats } | null)?.graduation
  const reportCount = useReportStore((state) => state.reports.length)
  // 주소로 바로 열면 스플래시가 덮으므로 걷힌 뒤에 등장
  const splashing = useSplashStore((state) => state.visible)

  if (!graduation) return <Navigate to={ROUTES.TODAY} replace />
  if (splashing) return <main className="min-h-dvh bg-white" />

  const stats = [
    { value: `${graduation.keptMeasurements}번`, label: '지킨 측정' },
    { value: `${reportCount}장`, label: '진료 리포트' },
    { value: `${graduation.weeksTogether}주`, label: '함께한 시간' },
  ]

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col items-center bg-white px-5 pt-45 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <div className="animate-pop-in motion-reduce:animate-none">
        <DangdangAvatar variant="done" />
      </div>

      <div className="animate-rise-in mt-5.5 flex flex-col items-center gap-5.5 text-center motion-reduce:animate-none">
        <h1 className="text-title-2 text-grey-900 leading-snug">임신 중 관리를 마쳤어요</h1>
        <p className="text-t6 text-grey-600 leading-relaxed">
          병원 기준대로 하루하루 챙겨 오셨어요.
          <br />
          그동안 정말 수고 많으셨어요.
        </p>
      </div>

      <div className="animate-rise-in-late mt-5.5 flex w-full flex-1 flex-col gap-5.5 motion-reduce:animate-none">
        <ul className="flex gap-2.5">
          {stats.map((stat) => (
            <li
              key={stat.label}
              className="rounded-key flex flex-1 flex-col items-center gap-1 bg-yellow-50 py-4"
            >
              <span className="text-grey-900 text-xl leading-tight font-bold">{stat.value}</span>
              <span className="text-grey-700 text-xs leading-snug font-medium">{stat.label}</span>
            </li>
          ))}
        </ul>

        <p className="bg-grey-50 text-t7 text-grey-700 flex items-start gap-2 rounded-xl px-3.5 py-3 leading-relaxed">
          <img src={iconArchive} alt="" width={18} height={18} className="shrink-0" />
          임신 중 기록은 보관함에 그대로 남아 있어요. 측정·인슐린 알림은 멈췄어요.
        </p>

        {/* 출산 뒤 마음이 힘들 때 바로 걸 수 있게 */}
        <p className="text-t7 text-grey-700 mt-auto text-center font-medium">
          마음이 힘들 땐 <a href="tel:109">109</a> · <a href="tel:15770199">1577-0199</a>
        </p>

        <button
          type="button"
          className="bg-primary rounded-key -mt-2 py-4 text-base leading-snug font-bold text-white"
          onClick={() => navigate(ROUTES.TODAY, { replace: true })}
        >
          홈으로
        </button>
      </div>
    </main>
  )
}

export default GraduationPage
