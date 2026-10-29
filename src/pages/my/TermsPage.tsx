import { useNavigate } from 'react-router'
import iconFileGrey from '@/assets/icons/file-grey.svg'
import SubPageHeader from '@/components/common/SubPageHeader'
import VisitMenuRow from '@/components/visit/VisitMenuRow'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

const TERMS = [
  { title: '개인정보 처리방침', to: ROUTES.LEGAL_PRIVACY },
  { title: '이용약관', to: ROUTES.LEGAL_TERMS },
  { title: '민감정보 수집·이용 동의', to: ROUTES.LEGAL_SENSITIVE },
]

// Figma M-11 약관 · 고지. 누르면 N-01·N-03·N-04 문서로
function TermsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack(ROUTES.MY)

  return (
    <main className="mx-auto min-h-dvh w-full max-w-107.5 bg-white px-5 pt-13 pb-30">
      <SubPageHeader title="약관 · 고지" onBack={goBack} />

      <div className="mt-2.5 flex flex-col gap-3.5">
        <section className="bg-grey-50 rounded-banner flex flex-col gap-2 p-4.5">
          <h2 className="text-grey-900 text-base leading-normal font-bold">
            당당은 의료기기가 아니에요
          </h2>
          <p className="text-t7 text-grey-600">
            병원에서 받은 기준대로 기록하고 알림을 받도록 돕는 앱이에요. 진단·처방을 하거나
            혈당·식단을 판단하지 않아요. 몸 상태가 걱정되면 다니는 병원에 문의해 주세요.
          </p>
        </section>

        <ul className="bg-grey-50 rounded-banner flex flex-col px-4.5 py-2">
          {TERMS.map(({ title, to }) => (
            <li key={title} className="py-2">
              <VisitMenuRow icon={iconFileGrey} title={title} onClick={() => navigate(to)} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default TermsPage
