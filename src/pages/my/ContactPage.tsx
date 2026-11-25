import DocumentHead from '@/components/legal/DocumentHead'
import LegalLayout from '@/components/legal/LegalLayout'
import LegalTable from '@/components/legal/LegalTable'
import { SUPPORT_EMAIL } from '@/constants/contact'
import { ROUTES } from '@/constants/routes'
import { useGoBack } from '@/hooks/useGoBack'

// Figma M-23 문의하기. 메일 앱으로 보냄
function ContactPage() {
  const goBack = useGoBack(ROUTES.MY)

  return (
    <LegalLayout
      title="문의하기"
      onBack={goBack}
      footer={{
        label: '메일 보내기',
        onClick: () => window.location.assign(`mailto:${SUPPORT_EMAIL}`),
      }}
    >
      <DocumentHead
        title="궁금한 점이 있나요?"
        description="메일로 보내 주시면 확인하고 답장드려요."
      />
      <LegalTable
        rows={[
          { label: '메일 주소', value: SUPPORT_EMAIL },
          { label: '답장 받는 곳', value: '보낸 메일 주소' },
          { label: '함께 적을 것', value: '어떤 화면에서 무엇을 하다가 생긴 일인지' },
        ]}
      />
      <p className="rounded-key bg-grey-100 text-grey-700 p-4 text-sm leading-relaxed">
        건강 상태나 수치는 병원에 문의해 주세요.
        <br />
        응급이면 119에 연락해 주세요.
      </p>
    </LegalLayout>
  )
}

export default ContactPage
