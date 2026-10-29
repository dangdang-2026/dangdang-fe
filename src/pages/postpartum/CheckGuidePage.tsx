import iconHospital from '@/assets/icons/postpartum/hospital.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

// Figma E-13 문구 그대로. 앱이 시기를 정하지 않으므로 참고로만
const GUIDES = [
  {
    org: '대한당뇨병학회 (2025 진료지침)',
    timing: '출산 후 4~12주 · 75g 경구당부하검사',
    after: '이후 매년 검사',
    source: 'Diabetes Metab J 2025',
  },
  {
    org: '미국당뇨병학회 ADA (2026)',
    timing: '출산 후 4~12주',
    after: '이후 평생 1~3년마다',
    source: 'Diabetes Care 2026',
  },
  {
    org: '서울아산병원 건강정보',
    timing: '출산 후 6~12주 · 75g 경구당부하검사',
    after: '정상이면 최소 3년마다, 내당능장애면 1년마다',
    source: '서울아산병원 「임신성 당뇨병」',
  },
]

// Figma E-13 산후 검사 참고 정보 (기관별 권고)
function CheckGuidePage() {
  const goBack = useGoBack(ROUTES.POSTPARTUM_CHECK)

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-[max(--spacing(9),env(safe-area-inset-bottom))]">
      <SubPageHeader title="참고 정보" onBack={goBack} />

      <div className="mt-3 flex flex-col gap-1.5">
        <h1 className="text-hero text-grey-900">산후 검사 시기는 기관마다 조금씩 달라요</h1>
        <p className="text-grey-600 text-sm leading-relaxed">
          참고로만 보세요. 병원에서 들은 날짜를 적는 게 먼저예요.
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-4">
        {GUIDES.map((guide) => (
          <li
            key={guide.org}
            className="border-grey-200 flex flex-col gap-1.5 rounded-2xl border px-4 py-3.5"
          >
            <p className="text-body-3 text-grey-600">{guide.org}</p>
            <p className="text-grey-900 text-base leading-normal font-bold">{guide.timing}</p>
            <p className="text-grey-700 text-sm leading-normal">{guide.after}</p>
            <p className="text-grey-600 text-xs leading-snug font-medium">출처 · {guide.source}</p>
          </li>
        ))}
      </ul>

      <p className="text-t7 text-grey-800 mt-4 flex items-start gap-2 rounded-xl bg-yellow-50 px-3.5 py-3 leading-relaxed">
        <img src={iconHospital} alt="" width={18} height={18} className="shrink-0" />
        대한당뇨병학회는 출산 뒤에도 내분비내과의 장기 진료가 필요하다고 안내해요. 다니는 병원에
        다음 검사 시기를 꼭 물어보세요.
      </p>
    </main>
  )
}

export default CheckGuidePage
