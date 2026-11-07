import { Navigate, useNavigate } from 'react-router'
import iconArchive from '@/assets/icons/postpartum/archive-md.svg'
import DangdangAvatar from '@/components/common/DangdangAvatar'
import { ROUTES } from '@/constants/routes'
import { useGlucoseStore } from '@/stores/useGlucoseStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useReportStore } from '@/stores/useReportStore'
import { useSplashStore } from '@/stores/useSplashStore'
import { diffInDays, parseDateKey } from '@/utils/date'

// Figma E-12 임신 중 관리 졸업 · E-12a·E-12b 등장. 지킨 것만 보여 주고 평가·연속 축하는 없음
function GraduationPage() {
  const navigate = useNavigate()
  const deliveryDate = parseDateKey(useProfileStore((state) => state.deliveryDate))
  const records = useGlucoseStore((state) => state.records)
  const meals = useGlucoseStore((state) => state.meals)
  const reportCount = useReportStore((state) => state.reports.length)
  // 주소로 바로 열면 스플래시가 덮으므로 걷힌 뒤에 등장
  const splashing = useSplashStore((state) => state.visible)

  if (!deliveryDate) return <Navigate to={ROUTES.TODAY} replace />
  if (splashing) return <main className="min-h-dvh bg-white" />

  // 첫 기록부터 출산일까지. 기록이 없으면 1주
  const firstAt = Math.min(
    ...records.map((record) => new Date(record.measuredAt).getTime()),
    ...meals.map((meal) => new Date(meal.startedAt).getTime()),
    deliveryDate.getTime(),
  )
  const weeks = Math.max(1, Math.ceil(diffInDays(new Date(firstAt), deliveryDate) / 7))

  const stats = [
    { value: `${records.length}번`, label: '지킨 측정' },
    { value: `${reportCount}장`, label: '진료 리포트' },
    { value: `${weeks}주`, label: '함께한 시간' },
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
          이제 산후 검사 일정만 함께 챙겨요.
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

        <button
          type="button"
          className="bg-primary rounded-key mt-auto py-4 text-base leading-snug font-bold text-white"
          onClick={() => navigate(ROUTES.TODAY, { replace: true })}
        >
          산후 홈으로
        </button>
      </div>
    </main>
  )
}

export default GraduationPage
