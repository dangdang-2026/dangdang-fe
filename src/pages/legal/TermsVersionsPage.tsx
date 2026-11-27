import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

// 이용약관 이전 버전. 처리방침 이전 버전과 같은 모양, 지금은 첫 버전뿐
function TermsVersionsPage() {
  const goBack = useGoBack(ROUTES.LEGAL_TERMS)

  return (
    <LegalLayout title="이전 버전" onBack={goBack}>
      <DocumentHead
        title="이용약관 이전 버전"
        description="약관이 바뀌면 바뀌기 전 버전을 여기서 볼 수 있어요."
      />
      <div className="border-grey-200 rounded-xl border px-4 py-3.5">
        <p className="text-t6 text-grey-900 font-bold">버전 1.0</p>
        <p className="text-t7 text-grey-600">2026. 12. 1. 시행 · 지금 버전</p>
      </div>
      <p className="text-t7 text-grey-500">지금은 처음 버전이라 이전 버전이 없어요.</p>
    </LegalLayout>
  )
}

export default TermsVersionsPage
